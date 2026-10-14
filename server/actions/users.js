import { z } from "zod";
import { SUPER_ONLY } from "../lib/auth.js";
import { createAdminClient } from "../lib/supabase.js";
import { fail, logActivity, runAdminAction, succeed } from "./helpers.js";
const ROLES = ["super_admin", "catalogue_manager", "enquiry_manager"];
const roleSchema = z.enum(ROLES);
/** Service client is used ONLY after assertAdmin(SUPER_ONLY) passed in runAdminAction. */
export async function inviteAdmin(ctx, formData) {
    return runAdminAction(ctx, SUPER_ONLY, async (actor) => {
        const parsed = z.object({ email: z.string().trim().email(), role: roleSchema }).safeParse(Object.fromEntries(formData));
        if (!parsed.success)
            return fail("Enter a valid email and choose a role.");
        const site = process.env.SITE_URL ?? "http://localhost:3000";
        const admin = createAdminClient();
        const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, { redirectTo: `${site}/admin/auth/confirm?next=/admin/reset-password` });
        if (error || !data.user)
            return fail("Could not send the invitation. The email may already be registered.");
        const { error: roleError } = await admin.from("user_roles").insert({ user_id: data.user.id, role: parsed.data.role });
        if (roleError)
            return fail("Invitation sent but the role could not be assigned. Set it from the list below.");
        await logActivity(actor, "invited", "admin user", data.user.id, `${parsed.data.email} as ${parsed.data.role}`);
        return succeed(`Invitation sent to ${parsed.data.email}.`);
    });
}
async function superAdminCount() {
    const { count } = await createAdminClient().from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "super_admin");
    return count ?? 0;
}
export async function setUserRole(ctx, userId, role, grant) {
    return runAdminAction(ctx, SUPER_ONLY, async (actor) => {
        const r = roleSchema.safeParse(role);
        if (!r.success || !z.string().uuid().safeParse(userId).success)
            return fail("Invalid request.");
        const supabase = ctx.supabase;
        if (!grant && r.data === "super_admin" && (await superAdminCount()) <= 1)
            return fail("You cannot remove the last Super Admin.");
        if (!grant && r.data === "super_admin" && userId === actor.id)
            return fail("Ask another Super Admin to change your own Super Admin role.");
        const { error } = grant
            ? await supabase.from("user_roles").upsert({ user_id: userId, role: r.data })
            : await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", r.data);
        if (error)
            return fail("Could not update the role.");
        await logActivity(actor, grant ? "granted role" : "revoked role", "admin user", userId, r.data);
        return succeed("Role updated.");
    });
}
export async function setUserActive(ctx, userId, active) {
    return runAdminAction(ctx, SUPER_ONLY, async (actor) => {
        if (!z.string().uuid().safeParse(userId).success)
            return fail("Invalid request.");
        if (userId === actor.id)
            return fail("You cannot deactivate your own account.");
        const supabase = ctx.supabase;
        const { error } = await supabase.from("profiles").update({ is_active: active }).eq("id", userId);
        if (error)
            return fail("Could not update the account.");
        await logActivity(actor, active ? "activated" : "deactivated", "admin user", userId);
        return succeed(active ? "Account reactivated." : "Account deactivated - access removed.");
    });
}
