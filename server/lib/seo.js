import fs from "node:fs";
import path from "node:path";
import { createAnonClient } from "./supabase.js";
import { publicImageUrl } from "../../shared/format.js";

export const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

let template;
export function indexTemplate(distDir) {
  if (!template) template = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
  return template;
}

function tags(meta) {
  const out = [`<title>${escapeHtml(meta.title)}</title>`];
  if (meta.description) out.push(`<meta name="description" content="${escapeHtml(meta.description)}" />`);
  out.push(`<link rel="canonical" href="${escapeHtml(meta.url)}" />`);
  out.push(`<meta property="og:title" content="${escapeHtml(meta.title)}" />`);
  if (meta.description) out.push(`<meta property="og:description" content="${escapeHtml(meta.description)}" />`);
  out.push(`<meta property="og:url" content="${escapeHtml(meta.url)}" />`, `<meta property="og:type" content="website" />`);
  if (meta.image) out.push(`<meta property="og:image" content="${escapeHtml(meta.image)}" />`);
  if (meta.jsonLd) out.push(`<script type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c")}</script>`);
  return out.join("\n    ");
}

export function renderIndex(distDir, meta) {
  const html = indexTemplate(distDir);
  return meta ? html.replace("<!--app-head-->", tags(meta)) : html;
}

/** Meta for /products/:slug and /categories/:slug so link previews and crawlers see real content. */
export async function metaFor(urlPath, origin) {
  const db = createAnonClient();
  let m = urlPath.match(/^\/products\/([a-z0-9-]+)\/?$/);
  if (m) {
    const { data: p } = await db
      .from("products")
      .select("name,slug,sku,short_description,price,sale_price,availability,seo_title,seo_description,product_images(storage_key,is_primary,sort_order),categories:primary_category_id(name,slug)")
      .eq("slug", m[1])
      .maybeSingle();
    if (!p) return null;
    const img = [...(p.product_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
    const image = publicImageUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, img[0]?.storage_key);
    const url = `${origin}/products/${p.slug}`;
    return {
      title: `${p.seo_title || p.name} | Anu3D Prints`,
      description: p.seo_description || p.short_description,
      url,
      image,
      jsonLd: {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Product",
            name: p.name,
            sku: p.sku ?? undefined,
            description: p.short_description ?? undefined,
            image: image ? [image] : undefined,
            offers: { "@type": "Offer", priceCurrency: "INR", price: p.sale_price ?? p.price, url, availability: p.availability === "out_of_stock" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock" },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Products", item: `${origin}/products` },
              ...(p.categories ? [{ "@type": "ListItem", position: 2, name: p.categories.name, item: `${origin}/categories/${p.categories.slug}` }] : []),
              { "@type": "ListItem", position: p.categories ? 3 : 2, name: p.name, item: url },
            ],
          },
        ],
      },
    };
  }
  m = urlPath.match(/^\/categories\/([a-z0-9-]+)\/?$/);
  if (m) {
    const { data: c } = await db.from("categories").select("name,slug,description,seo_title,seo_description").eq("slug", m[1]).maybeSingle();
    if (!c) return null;
    return { title: `${c.seo_title || c.name} | Anu3D Prints`, description: c.seo_description || c.description, url: `${origin}/categories/${c.slug}` };
  }
  return null;
}

export async function sitemapXml(origin) {
  const statics = ["", "/products", "/custom-3d-printing", "/bulk-orders", "/gallery", "/about", "/contact", "/faq", "/privacy-policy", "/terms-and-conditions", "/shipping-and-delivery", "/cancellation-and-refund-policy"];
  const urls = statics.map((p) => ({ loc: `${origin}${p}` }));
  try {
    const db = createAnonClient();
    const [p, c] = await Promise.all([db.from("products").select("slug,updated_at"), db.from("categories").select("slug,updated_at")]);
    for (const x of c.data ?? []) urls.push({ loc: `${origin}/categories/${x.slug}`, lastmod: x.updated_at });
    for (const x of p.data ?? []) urls.push({ loc: `${origin}/products/${x.slug}`, lastmod: x.updated_at });
  } catch {
    /* fall back to static URLs */
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${escapeHtml(u.loc)}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ""}</url>`)
    .join("\n")}\n</urlset>`;
}
