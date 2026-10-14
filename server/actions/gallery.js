import { CATALOGUE_ROLES } from "../lib/auth.js";
import { deletePublicObject, uploadPublicImage } from "../lib/s3.js";
import { rateLimit } from "../lib/rateLimit.js";
import { galleryItemSchema } from "../../shared/schemas.js";
import { fail, friendlyDbError, logActivity, revalidatePublic, runAdminAction, succeed, zodFieldErrors } from "./helpers.js";
export async function uploadGalleryItem(ctx, formData) {
    return runAdminAction(ctx, CATALOGUE_ROLES, async (user) => {
        if (!rateLimit(`upload:${user.id}`, 60, 10 * 60_000).ok)
            return fail("Too many uploads. Please wait a few minutes.");
        const file = formData.get("file");
        if (!(file instanceof File))
            return fail("No file received.");
        const alt = String(formData.get("alt_text") ?? "").trim() || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
        const up = await uploadPublicImage(file, "gallery");
        if (!up.ok)
            return fail(up.error);
        const supabase = ctx.supabase;
        const { data: last } = await supabase.from("gallery_items").select("sort_order").order("sort_order", { ascending: false }).limit(1);
        const { error } = await supabase.from("gallery_items").insert({
            storage_key: up.key,
            alt_text: alt.slice(0, 200),
            project_type: String(formData.get("project_type") ?? "").trim().slice(0, 60) || null,
            sort_order: (last?.[0]?.sort_order ?? -1) + 1,
        });
        if (error) {
            await deletePublicObject(up.key);
            return fail(friendlyDbError(error, "gallery item"));
        }
        await logActivity(ctx, "uploaded", "gallery item");
        revalidatePublic();
        return succeed("Image uploaded successfully.");
    });
}
export async function updateGalleryItem(ctx, id, formData) {
    return runAdminAction(ctx, CATALOGUE_ROLES, async (user) => {
        const raw = Object.fromEntries(formData);
        const parsed = galleryItemSchema.safeParse({ ...raw, is_published: formData.get("is_published") === "on" ? "true" : "" });
        if (!parsed.success)
            return fail("Please fix the highlighted fields.", zodFieldErrors(parsed.error.issues));
        const supabase = ctx.supabase;
        const { error } = await supabase.from("gallery_items").update({ ...parsed.data, title: parsed.data.title ?? null, caption: parsed.data.caption ?? null, project_type: parsed.data.project_type ?? null }).eq("id", id);
        if (error)
            return fail(friendlyDbError(error, "gallery item"));
        await logActivity(ctx, "updated", "gallery item", id);
        revalidatePublic();
        return succeed("Gallery item saved.");
    });
}
export async function deleteGalleryItem(ctx, id) {
    return runAdminAction(ctx, CATALOGUE_ROLES, async (user) => {
        const supabase = ctx.supabase;
        const { data } = await supabase.from("gallery_items").select("storage_key").eq("id", id).maybeSingle();
        const { error } = await supabase.from("gallery_items").delete().eq("id", id);
        if (error)
            return fail(friendlyDbError(error, "gallery item"));
        await deletePublicObject(data?.storage_key);
        await logActivity(ctx, "deleted", "gallery item", id);
        revalidatePublic();
        return succeed("Gallery item deleted.");
    });
}
