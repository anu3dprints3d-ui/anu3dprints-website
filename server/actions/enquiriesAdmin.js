import { ENQUIRY_ROLES, SUPER_ONLY } from "../lib/auth.js";
import { createAdminClient } from "../lib/supabase.js";
import { checkBuckets, signPrivateUrl } from "../lib/s3.js";
import { enquiryNoteSchema, enquiryStatusSchema } from "../../shared/schemas.js";
import { fail, friendlyDbError, logActivity, runAdminAction, succeed } from "./helpers.js";
import { z } from "zod";
export async function setEnquiryStatus(ctx, id, status) {
    return runAdminAction(ctx, ENQUIRY_ROLES, async (user) => {
        const parsed = enquiryStatusSchema.safeParse(status);
        if (!parsed.success || !z.string().uuid().safeParse(id).success)
            return fail("Invalid status.");
        const supabase = ctx.supabase;
        const { error } = await supabase.from("enquiries").update({ status: parsed.data }).eq("id", id); // history row written by DB trigger
        if (error)
            return fail(friendlyDbError(error, "enquiry"));
        await logActivity(ctx, "status changed", "enquiry", id, parsed.data);
        return succeed("Status updated.");
    });
}
export async function addEnquiryNote(ctx, formData) {
    return runAdminAction(ctx, ENQUIRY_ROLES, async (user) => {
        const parsed = enquiryNoteSchema.safeParse(Object.fromEntries(formData));
        if (!parsed.success)
            return fail(parsed.error.issues[0].message);
        const supabase = ctx.supabase;
        const { error } = await supabase.from("enquiry_notes").insert({ enquiry_id: parsed.data.enquiry_id, body: parsed.data.body, author_id: user.id });
        if (error)
            return fail(friendlyDbError(error, "note"));
        return succeed("Note added.");
    });
}
export async function assignEnquiry(ctx, id, assignee) {
    return runAdminAction(ctx, ENQUIRY_ROLES, async (user) => {
        if (assignee && !z.string().uuid().safeParse(assignee).success)
            return fail("Invalid assignee.");
        const supabase = ctx.supabase;
        const { error } = await supabase.from("enquiries").update({ assigned_to: assignee }).eq("id", id);
        if (error)
            return fail(friendlyDbError(error, "enquiry"));
        await logActivity(ctx, "assigned", "enquiry", id);
        return succeed("Assignment saved.");
    });
}

/** Everything the enquiry detail screen needs. Staff emails are resolved with the service client after the role check. */
export async function getEnquiryDetail(ctx, id) {
    return runAdminAction(ctx, ENQUIRY_ROLES, async () => {
        if (!z.string().uuid().safeParse(id).success)
            return fail("Invalid enquiry.");
        const db = ctx.supabase;
        const [{ data: enquiry }, { data: files }, { data: notes }, { data: history }, { data: roleRows }] = await Promise.all([
            db.from("enquiries").select("*").eq("id", id).maybeSingle(),
            db.from("enquiry_files").select("id,original_name,size_bytes").eq("enquiry_id", id),
            db.from("enquiry_notes").select("id,body,author_id,created_at").eq("enquiry_id", id).order("created_at", { ascending: false }),
            db.from("enquiry_status_history").select("id,from_status,to_status,changed_by,created_at").eq("enquiry_id", id).order("created_at"),
            db.from("user_roles").select("user_id").in("role", ["super_admin", "enquiry_manager"]),
        ]);
        if (!enquiry)
            return fail("Enquiry not found.");
        const ids = [...new Set([...(roleRows ?? []).map((r) => r.user_id), ...(notes ?? []).map((n) => n.author_id), ...(history ?? []).map((h) => h.changed_by)].filter(Boolean))];
        const { data: profiles } = ids.length ? await createAdminClient().from("profiles").select("id,email").in("id", ids) : { data: [] };
        const emails = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.email]));
        const admins = (roleRows ?? []).map((r) => ({ id: r.user_id, email: emails[r.user_id] ?? r.user_id }));
        return succeed("ok", { enquiry, files: files ?? [], notes: notes ?? [], history: history ?? [], admins, emails });
    });
}
/** Authorises the caller (role + RLS) and returns a 5-minute signed URL for a private customer file. */
export async function getFileUrl(ctx, fileId) {
    return runAdminAction(ctx, ENQUIRY_ROLES, async () => {
        if (!z.string().uuid().safeParse(fileId).success)
            return fail("Invalid file.");
        const { data } = await ctx.supabase.from("enquiry_files").select("storage_key,original_name").eq("id", fileId).maybeSingle();
        if (!data)
            return fail("File not found.");
        try {
            return succeed("ok", { url: await signPrivateUrl(data.storage_key, data.original_name) });
        }
        catch {
            return fail("File storage is not available.");
        }
    });
}
/** Real connectivity check; only bucket names and an error class are returned, never credentials. */
export async function getStorageStatus(ctx) {
    return runAdminAction(ctx, SUPER_ONLY, async () => {
        try {
            return succeed("ok", { buckets: await checkBuckets() });
        }
        catch (e) {
            return fail(e instanceof Error ? e.message : "Storage is not configured");
        }
    });
}
