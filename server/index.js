import express from "express";
import helmet from "helmet";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { registry } from "./actions/index.js";
import { buildAdminContext, CATALOGUE_ROLES, ENQUIRY_ROLES, hasAnyRole } from "./lib/auth.js";
import { rateLimit } from "./lib/rateLimit.js";
import { metaFor, renderIndex, sitemapXml } from "./lib/seo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../client/dist");
const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1); // behind Vercel/nginx so req.ip is the real client

const supabaseOrigin = (() => {
  try {
    return new URL(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL).origin;
  } catch {
    return "https://*.supabase.co";
  }
})();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", supabaseOrigin],
        connectSrc: ["'self'", supabaseOrigin],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    strictTransportSecurity: { maxAge: 63072000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

const origin = (req) => process.env.SITE_URL || `${req.protocol}://${req.get("host")}`;

// ---------- API ----------
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 21 * 1024 * 1024, files: 6, fieldSize: 1024 * 1024 } });

app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "private, no-store");
  const limit = rateLimit(`api:${req.ip}`, 600, 10 * 60_000);
  if (!limit.ok) return res.status(429).json({ ok: false, message: "Too many requests. Please slow down.", error: "Too many requests." });
  next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

/** Rebuilds a FormData from the multipart request so action code can use the standard FormData API. */
function buildFormData(req) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(req.body ?? {})) {
    if (key === "_args" || key === "_form") continue;
    for (const v of Array.isArray(value) ? value : [value]) fd.append(key, String(v));
  }
  for (const f of req.files ?? []) fd.append(f.fieldname, new File([f.buffer], f.originalname, { type: f.mimetype }));
  return fd;
}

app.post("/api/actions/:name", upload.any(), async (req, res) => {
  const entry = registry.get(req.params.name);
  if (!entry) return res.status(404).json({ ok: false, message: "Unknown action." });

  const ctx = { ip: req.ip, user: null, supabase: null };
  if (!entry.isPublic) {
    const admin = await buildAdminContext(req).catch(() => null);
    if (!admin) return res.status(401).json({ ok: false, message: "Your session has expired. Please sign in again." });
    ctx.user = admin;
    ctx.supabase = admin.supabase;
  }

  try {
    let args = [];
    if (req.body?._args) {
      args = JSON.parse(req.body._args);
      if (!Array.isArray(args)) throw new Error("bad args");
    }
    if (req.body?._form === "1" || (req.files?.length ?? 0) > 0) args.push(buildFormData(req));
    res.json(await entry.fn(ctx, ...args));
  } catch (err) {
    console.error(`Action ${req.params.name} failed:`, err instanceof Error ? err.message : "unknown");
    const message = "Something went wrong. Please try again.";
    res.status(500).json({ ok: false, message, error: message });
  }
});

const csvEscape = (v) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise spreadsheet formula injection
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

app.get("/api/admin/export/:what", async (req, res) => {
  const user = await buildAdminContext(req).catch(() => null);
  const what = req.params.what;
  const allowed = what === "products" ? CATALOGUE_ROLES : what === "enquiries" ? ENQUIRY_ROLES : null;
  if (!user || !allowed || !hasAnyRole(user, allowed)) return res.status(403).send("Forbidden");

  let head, rows;
  if (what === "products") {
    const { data, error } = await user.supabase
      .from("products")
      .select("name,slug,sku,short_description,description,price,sale_price,material_options,color_options,size_options,availability,lead_time,is_published,is_featured,categories:primary_category_id(slug)")
      .is("archived_at", null)
      .order("created_at");
    if (error) return res.status(500).send("Export failed");
    head = ["name", "slug", "sku", "short_description", "description", "price", "sale_price", "category", "material_options", "color_options", "size_options", "availability", "lead_time", "is_published", "is_featured"];
    rows = (data ?? []).map((p) => ({ ...p, category: p.categories?.slug ?? "", material_options: p.material_options.join("|"), color_options: p.color_options.join("|"), size_options: p.size_options.join("|") }));
  } else {
    let q = user.supabase.from("enquiries").select("reference,type,status,customer_name,phone,email,company_name,product_name,quantity,material,size_preference,required_by,customization_details,message,created_at");
    if (req.query.status) q = q.eq("status", String(req.query.status));
    if (req.query.type) q = q.eq("type", String(req.query.type));
    const { data, error } = await q.order("created_at", { ascending: false }).limit(5000);
    if (error) return res.status(500).send("Export failed");
    head = ["reference", "type", "status", "customer_name", "phone", "email", "company_name", "product_name", "quantity", "material", "size_preference", "required_by", "customization_details", "message", "created_at"];
    rows = data ?? [];
  }
  res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${what}.csv"` });
  res.send([head.join(","), ...rows.map((r) => head.map((h) => csvEscape(r[h])).join(","))].join("\n"));
});

app.use("/api", (_req, res) => res.status(404).json({ ok: false, message: "Not found." }));

// ---------- SEO ----------
app.get("/robots.txt", (req, res) =>
  res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\nSitemap: ${origin(req)}/sitemap.xml\n`),
);
app.get("/sitemap.xml", async (req, res) => res.type("application/xml").send(await sitemapXml(origin(req))));

// ---------- SPA ----------
if (fs.existsSync(distDir)) {
  app.use("/assets", express.static(path.join(distDir, "assets"), { immutable: true, maxAge: "1y" }));
  app.use(express.static(distDir, { index: false, maxAge: "1h" }));
  app.get(/^(?!\/api\/).*/, async (req, res) => {
    let meta = null;
    try {
      meta = await metaFor(req.path, origin(req));
    } catch {
      /* serve the plain shell */
    }
    res.set("Cache-Control", req.path.startsWith("/admin") ? "private, no-store" : "no-cache");
    res.type("html").send(renderIndex(distDir, meta));
  });
}

// Multer / body errors -> clean JSON, never a stack trace.
app.use((err, _req, res, _next) => {
  const tooBig = err?.code === "LIMIT_FILE_SIZE";
  res.status(tooBig ? 413 : 400).json({ ok: false, message: tooBig ? "A file is too large (max 20 MB)." : "Invalid request.", error: tooBig ? "A file is too large (max 20 MB)." : "Invalid request." });
});

app.listen(PORT, () => console.log(`Anu3D server listening on :${PORT}`));
