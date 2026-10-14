import { z } from "zod";
import { CATALOGUE_ROLES } from "../lib/auth.js";
import { deletePublicObject, uploadPublicImage } from "../lib/s3.js";
import { categorySchema } from "../../shared/schemas.js";
import { slugify } from "../../shared/format.js";
import { fail, friendlyDbError, logActivity, revalidatePublic, runAdminAction, succeed, zodFieldErrors } from "./helpers.js";
export async function saveCategory(ctx, formData) {
    return runAdminAction(ctx, CATALOGUE_ROLES, async (user) => {
        const id = String(formData.get("id") ?? "");
        const raw = Object.fromEntries(formData);
        raw.is_active = formData.get("is_active") === "on" ? "true" : "";
        if (!raw.slug)
            raw.slug = slugify(String(raw.name ?? ""));
        const parsed = categorySchema.safeParse(raw);
        if (!parsed.success)
            return fail("Please fix the highlighted fields.", zodFieldErrors(parsed.error.issues));
        const supabase = ctx.supabase;
        const patch = { ...parsed.data, description: parsed.data.description ?? null, seo_title: parsed.data.seo_title ?? null, seo_description: parsed.data.seo_description ?? null };
        const file = formData.get("image");
        let newKey = null;
        if (file instanceof File && file.size > 0) {
            const up = await uploadPublicImage(file, "categories");
            if (!up.ok)
                return fail(up.error, { image: up.error });
            newKey = up.key;
            patch.image_key = up.key;
            patch.image_alt = String(formData.get("image_alt") ?? "").slice(0, 200) || parsed.data.name;
        }
        let oldKey = null;
        let categoryId = id;
        if (id) {
            if (newKey)
                oldKey = (await supabase.from("categories").select("image_key").eq("id", id).maybeSingle()).data?.image_key ?? null;
            const { error } = await supabase.from("categories").update(patch).eq("id", id);
            if (error) {
                await deletePublicObject(newKey);
                return fail(friendlyDbError(error, "category"));
            }
        }
        else {
            const { data, error } = await supabase.from("categories").insert(patch).select("id").single();
            if (error || !data) {
                await deletePublicObject(newKey);
                return fail(friendlyDbError(error, "category"));
            }
            categoryId = data.id;
        }
        if (oldKey && oldKey !== newKey)
            await deletePublicObject(oldKey); // replaced image: no orphan
        await logActivity(ctx, id ? "updated" : "created", "category", categoryId, parsed.data.name);
        revalidatePublic();
        return succeed(id ? "Category updated successfully." : "Category created successfully.", { id: categoryId });
    });
}
export async function removeCategoryImage(ctx, id) {
    return runAdminAction(ctx, CATALOGUE_ROLES, async () => {
        const supabase = ctx.supabase;
        const { data } = await supabase.from("categories").select("image_key").eq("id", id).maybeSingle();
        const { error } = await supabase.from("categories").update({ image_key: null, image_alt: null }).eq("id", id);
        if (error)
            return fail(friendlyDbError(error, "category"));
        await deletePublicObject(data?.image_key);
        revalidatePublic();
        return succeed("Image removed.");
    });
}
const deleteSchema = z.object({ id: z.string().uuid(), reassignTo: z.string().uuid().optional() });
/** Deleting a category that still has products requires choosing where those products go. */
export async function deleteCategory(ctx, input) {
    return runAdminAction(ctx, CATALOGUE_ROLES, async (user) => {
        const parsed = deleteSchema.safeParse(input);
        if (!parsed.success)
            return fail("Invalid request.");
        const { id, reassignTo } = parsed.data;
        const supabase = ctx.supabase;
        const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("primary_category_id", id);
        if ((count ?? 0) > 0) {
            if (!reassignTo || reassignTo === id)
                return fail(`This category has ${count} product(s). Choose a category to move them to, or archive the category instead.`);
            const { error } = await supabase.from("products").update({ primary_category_id: reassignTo }).eq("primary_category_id", id);
            if (error)
                return fail(friendlyDbError(error, "products"));
        }
        const { data: cat } = await supabase.from("categories").select("image_key,name").eq("id", id).maybeSingle();
        const { error } = await supabase.from("categories").delete().eq("id", id);
        if (error)
            return fail(friendlyDbError(error, "category"));
        await deletePublicObject(cat?.image_key);
        await logActivity(ctx, "deleted", "category", id, cat?.name);
        revalidatePublic();
        return succeed("Category deleted.");
    });
}
export async function setCategoryActive(ctx, id, active) {
    return runAdminAction(ctx, CATALOGUE_ROLES, async (user) => {
        const supabase = ctx.supabase;
        const { error } = await supabase.from("categories").update({ is_active: active }).eq("id", id);
        if (error)
            return fail(friendlyDbError(error, "category"));
        await logActivity(ctx, active ? "activated" : "archived", "category", id);
        revalidatePublic();
        return succeed(active ? "Category is now visible." : "Category archived (hidden from the site).");
    });
}
