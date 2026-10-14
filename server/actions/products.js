import { z } from "zod";
import { CATALOGUE_ROLES } from "../lib/auth.js";
import { deletePublicObject, uploadPublicImage } from "../lib/s3.js";
import { productSchema } from "../../shared/schemas.js";
import { slugify } from "../../shared/format.js";
import { rateLimit } from "../lib/rateLimit.js";
import { fail, friendlyDbError, logActivity, revalidatePublic, runAdminAction, succeed, zodFieldErrors } from "./helpers.js";
function parseSpecs(text) {
    return text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 30)
        .map((l) => {
        const i = l.indexOf(":");
        return i > 0 ? { label: l.slice(0, i).trim().slice(0, 60), value: l.slice(i + 1).trim().slice(0, 200) } : { label: l.slice(0, 60), value: "" };
    });
}
export async function saveProduct(ctx, formData) {
    return runAdminAction(ctx, CATALOGUE_ROLES, async (user) => {
        const id = String(formData.get("id") ?? "");
        const raw = Object.fromEntries(formData);
        for (const flag of ["is_featured", "is_popular", "is_published"])
            raw[flag] = formData.get(flag) === "on" ? "true" : "";
        if (!raw.slug)
            raw.slug = slugify(String(raw.name ?? ""));
        raw.primary_category_id = raw.primary_category_id ? raw.primary_category_id : null;
        const parsed = productSchema.safeParse(raw);
        if (!parsed.success)
            return fail("Please fix the highlighted fields.", zodFieldErrors(parsed.error.issues));
        const row = {
            ...parsed.data,
            sku: parsed.data.sku ?? null,
            sale_price: parsed.data.sale_price ?? null,
            weight_grams: parsed.data.weight_grams ?? null,
            stock_quantity: parsed.data.stock_quantity ?? null,
            primary_category_id: parsed.data.primary_category_id ?? null,
            specifications: parseSpecs(String(formData.get("specifications") ?? "")),
        };
        const supabase = ctx.supabase;
        let productId = id;
        if (id) {
            const { error } = await supabase.from("products").update(row).eq("id", id);
            if (error)
                return fail(friendlyDbError(error, "product"));
        }
        else {
            const { data, error } = await supabase.from("products").insert(row).select("id").single();
            if (error || !data)
                return fail(friendlyDbError(error, "product"));
            productId = data.id;
        }
        const extra = formData.getAll("extra_categories").map(String).filter((v) => z.string().uuid().safeParse(v).success);
        await supabase.from("product_categories").delete().eq("product_id", productId);
        if (extra.length)
            await supabase.from("product_categories").insert(extra.map((category_id) => ({ product_id: productId, category_id })));
        await logActivity(ctx, id ? "updated" : "created", "product", productId, row.name);
        revalidatePublic();
        return succeed(id ? "Product updated successfully." : "Product created successfully.", { id: productId });
    });
}
export async function uploadProductImage(ctx, productId, formData) {
    return runAdminAction(ctx, CATALOGUE_ROLES, async (user) => {
        if (!rateLimit(`upload:${user.id}`, 60, 10 * 60_000).ok)
            return fail("Too many uploads. Please wait a few minutes.");
        const file = formData.get("file");
        if (!(file instanceof File))
            return fail("No file received.");
        const supabase = ctx.supabase;
        const up = await uploadPublicImage(file, "products");
        if (!up.ok)
            return fail(up.error);
        const { data: existing } = await supabase.from("product_images").select("id,sort_order,is_primary").eq("product_id", productId);
        const next = (existing ?? []).reduce((m, i) => Math.max(m, i.sort_order), -1) + 1;
        const { error } = await supabase.from("product_images").insert({
            product_id: productId,
            storage_key: up.key,
            alt_text: String(formData.get("alt") ?? "").slice(0, 200) || null,
            sort_order: next,
            is_primary: !(existing ?? []).some((i) => i.is_primary),
            width: up.width,
            height: up.height,
        });
        if (error) {
            await deletePublicObject(up.key); // don't orphan the object
            return fail(friendlyDbError(error, "image"));
        }
        await logActivity(ctx, "uploaded", "product image", productId);
        revalidatePublic();
        return succeed("Image uploaded successfully.");
    });
}
export async function deleteProductImage(ctx, imageId) {
    return runAdminAction(ctx, CATALOGUE_ROLES, async (user) => {
        const supabase = ctx.supabase;
        const { data: img } = await supabase.from("product_images").select("id,product_id,storage_key,is_primary").eq("id", imageId).maybeSingle();
        if (!img)
            return fail("Image not found.");
        const { error } = await supabase.from("product_images").delete().eq("id", imageId);
        if (error)
            return fail(friendlyDbError(error, "image"));
        await deletePublicObject(img.storage_key);
        if (img.is_primary) {
            const { data: first } = await supabase.from("product_images").select("id").eq("product_id", img.product_id).order("sort_order").limit(1);
            if (first?.[0])
                await supabase.rpc("set_primary_product_image", { _product: img.product_id, _image: first[0].id });
        }
        await logActivity(ctx, "deleted", "product image", img.product_id);
        revalidatePublic();
        return succeed("Image removed.");
    });
}
export async function setPrimaryImage(ctx, productId, imageId) {
    return runAdminAction(ctx, CATALOGUE_ROLES, async () => {
        const supabase = ctx.supabase;
        const { error } = await supabase.rpc("set_primary_product_image", { _product: productId, _image: imageId });
        if (error)
            return fail(friendlyDbError(error, "image"));
        revalidatePublic();
        return succeed("Primary image updated.");
    });
}
export async function moveProductImage(ctx, productId, imageId, direction) {
    return runAdminAction(ctx, CATALOGUE_ROLES, async () => {
        const supabase = ctx.supabase;
        const { data } = await supabase.from("product_images").select("id,sort_order").eq("product_id", productId).order("sort_order");
        const list = data ?? [];
        const i = list.findIndex((x) => x.id === imageId);
        const j = i + direction;
        if (i < 0 || j < 0 || j >= list.length)
            return succeed("Already at the edge.");
        [list[i], list[j]] = [list[j], list[i]];
        await Promise.all(list.map((img, idx) => supabase.from("product_images").update({ sort_order: idx }).eq("id", img.id)));
        revalidatePublic();
        return succeed("Order updated.");
    });
}
export async function updateImageAlt(ctx, imageId, alt) {
    return runAdminAction(ctx, CATALOGUE_ROLES, async () => {
        const supabase = ctx.supabase;
        const { error } = await supabase.from("product_images").update({ alt_text: alt.slice(0, 200) || null }).eq("id", imageId);
        if (error)
            return fail(friendlyDbError(error, "image"));
        revalidatePublic();
        return succeed("Alt text saved.");
    });
}
export async function duplicateProduct(ctx, productId) {
    return runAdminAction(ctx, CATALOGUE_ROLES, async (user) => {
        const supabase = ctx.supabase;
        const { data: p } = await supabase.from("products").select("*").eq("id", productId).single();
        if (!p)
            return fail("Product not found.");
            const { id: _id, created_at: _c, updated_at: _u, search_vector: _s, sku: _sku, slug, name, ...rest } = p;
            const { data: copy, error } = await supabase
            .from("products")
            .insert({ ...rest, name: `${name} (copy)`, slug: `${slug}-copy-${Date.now().toString(36)}`, sku: null, is_published: false })
            .select("id")
            .single();
        if (error || !copy)
            return fail(friendlyDbError(error, "product"));
        await logActivity(ctx, "duplicated", "product", copy.id, name);
        revalidatePublic();
        return succeed("Product duplicated as an unpublished draft (images not copied).", { id: copy.id });
    });
}
/**
 * Archive hides a product (RLS only exposes rows with archived_at null) WITHOUT touching is_published,
 * so restoring returns it to exactly the state it had. `publish` = true also makes it live on restore.
 */
export async function archiveProduct(ctx, productId, archive, publish = false) {
    return runAdminAction(ctx, CATALOGUE_ROLES, async (user) => {
        const supabase = ctx.supabase;
        const patch = archive
            ? { archived_at: new Date().toISOString() }
            : { archived_at: null, ...(publish ? { is_published: true } : {}) };
        const { data, error } = await supabase.from("products").update(patch).eq("id", productId).select("is_published").maybeSingle();
        if (error)
            return fail(friendlyDbError(error, "product"));
        if (!data)
            return fail("Product not found.");
        await logActivity(ctx, archive ? "archived" : publish ? "restored and published" : "restored", "product", productId);
        revalidatePublic();
        if (archive)
            return succeed("Product archived. It is hidden from the site and can be restored any time.");
        return succeed(data.is_published
            ? "Product restored and live on the site."
            : "Product restored as a draft. Tick Published (or use Restore & publish) to show it on the site.");
    });
}
export async function deleteProduct(ctx, productId) {
    return runAdminAction(ctx, CATALOGUE_ROLES, async (user) => {
        const supabase = ctx.supabase;
        const { data: images } = await supabase.from("product_images").select("storage_key").eq("product_id", productId);
        const { error } = await supabase.from("products").delete().eq("id", productId);
        if (error)
            return fail(friendlyDbError(error, "product"));
        await Promise.all((images ?? []).map((i) => deletePublicObject(i.storage_key)));
        await logActivity(ctx, "deleted", "product", productId);
        revalidatePublic();
        return succeed("Product deleted.");
    });
}
const bulkSchema = z.object({
    ids: z.array(z.string().uuid()).min(1).max(200),
    action: z.enum(["publish", "unpublish", "archive", "set_category"]),
    categoryId: z.string().uuid().optional(),
});
export async function bulkProductAction(ctx, input) {
    return runAdminAction(ctx, CATALOGUE_ROLES, async (user) => {
        const parsed = bulkSchema.safeParse(input);
        if (!parsed.success)
            return fail("Select at least one product.");
        const { ids, action, categoryId } = parsed.data;
        const supabase = ctx.supabase;
        const patch = action === "publish" ? { is_published: true }
            : action === "unpublish" ? { is_published: false }
                : action === "archive" ? { archived_at: new Date().toISOString() }
                    : categoryId ? { primary_category_id: categoryId } : null;
        if (!patch)
            return fail("Choose a category.");
        const { error } = await supabase.from("products").update(patch).in("id", ids);
        if (error)
            return fail(friendlyDbError(error, "products"));
        await logActivity(ctx, `bulk ${action}`, "product", undefined, `${ids.length} products`);
        revalidatePublic();
        return succeed(`Updated ${ids.length} product(s).`);
    });
}
// ---------- CSV import ----------
function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quoted) {
            if (c === '"' && text[i + 1] === '"') {
                cell += '"';
                i++;
            }
            else if (c === '"')
                quoted = false;
            else
                cell += c;
        }
        else if (c === '"')
            quoted = true;
        else if (c === ",") {
            row.push(cell);
            cell = "";
        }
        else if (c === "\n" || c === "\r") {
            if (c === "\r" && text[i + 1] === "\n")
                i++;
            row.push(cell);
            cell = "";
            if (row.some((v) => v !== ""))
                rows.push(row);
            row = [];
        }
        else
            cell += c;
    }
    row.push(cell);
    if (row.some((v) => v !== ""))
        rows.push(row);
    return rows;
}
export async function importProductsCsv(ctx, formData) {
    return runAdminAction(ctx, CATALOGUE_ROLES, async (user) => {
        const file = formData.get("file");
        if (!(file instanceof File) || file.size === 0)
            return fail("Choose a CSV file.");
        if (file.size > 1024 * 1024)
            return fail("CSV must be under 1 MB.");
        const [header, ...rows] = parseCsv(await file.text());
        if (!header)
            return fail("The CSV is empty.");
        const cols = header.map((h) => h.trim().toLowerCase());
        if (!cols.includes("name") || !cols.includes("price"))
            return fail("CSV needs at least 'name' and 'price' columns.");
        if (rows.length > 500)
            return fail("Import at most 500 rows at a time.");
        const supabase = ctx.supabase;
        const { data: cats } = await supabase.from("categories").select("id,slug");
        const catBySlug = new Map((cats ?? []).map((c) => [c.slug, c.id]));
        const errors = [];
        const valid = [];
        rows.forEach((r, idx) => {
            const rec = {};
            cols.forEach((c, i) => (rec[c] = (r[i] ?? "").trim()));
            const parsed = productSchema.safeParse({
                name: rec.name,
                slug: rec.slug || slugify(rec.name),
                sku: rec.sku,
                short_description: rec.short_description,
                description: rec.description,
                price: rec.price,
                sale_price: rec.sale_price,
                material_options: rec.material_options?.replaceAll("|", ","),
                color_options: rec.color_options?.replaceAll("|", ","),
                size_options: rec.size_options?.replaceAll("|", ","),
                availability: rec.availability || "made_to_order",
                lead_time: rec.lead_time,
                is_published: rec.is_published === "true" ? "true" : "",
                is_featured: rec.is_featured === "true" ? "true" : "",
            });
            if (!parsed.success) {
                errors.push(`Row ${idx + 2}: ${parsed.error.issues[0].message}`);
                return;
            }
            valid.push({ ...parsed.data, sku: parsed.data.sku ?? null, sale_price: parsed.data.sale_price ?? null, weight_grams: null, stock_quantity: null, primary_category_id: catBySlug.get(rec.category) ?? null });
        });
        if (errors.length)
            return fail(`Nothing imported. ${errors.slice(0, 5).join(" | ")}${errors.length > 5 ? ` (+${errors.length - 5} more)` : ""}`);
        const { error } = await supabase.from("products").insert(valid); // single statement = all-or-nothing
        if (error)
            return fail(friendlyDbError(error, "products"));
        await logActivity(ctx, "imported", "product", undefined, `${valid.length} rows`);
        revalidatePublic();
        return succeed(`Imported ${valid.length} product(s). Add images to each from its edit page.`);
    });
}
