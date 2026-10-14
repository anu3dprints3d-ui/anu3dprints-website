import { AuthError, assertAdmin } from "../lib/auth.js";

export const fail = (message, fieldErrors) => ({ ok: false, message, fieldErrors });
export const succeed = (message, extra = {}) => ({ ok: true, message, ...extra });

export function zodFieldErrors(issues) {
  const out = {};
  for (const i of issues) out[String(i.path[0] ?? "form")] ??= i.message;
  return out;
}

/** Runs an admin mutation behind a role check and turns throws into safe, user-facing errors. */
export async function runAdminAction(ctx, roles, fn) {
  try {
    const user = assertAdmin(ctx, roles);
    return await fn(user);
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message);
    console.error("Admin action failed:", err instanceof Error ? err.message : "unknown");
    return fail("Something went wrong. Please try again.");
  }
}

/** Maps Postgres errors to friendly messages without leaking internals. */
export function friendlyDbError(error, entity = "record") {
  if (!error) return "";
  if (error.code === "23505") {
    if (error.message?.includes("sku")) return "That SKU is already used by another product.";
    if (error.message?.includes("slug")) return "That slug is already in use - choose another.";
    return `A ${entity} with those details already exists.`;
  }
  if (error.code === "23503") return `This ${entity} is still referenced by other data.`;
  if (error.code === "23514") return "One of the values is out of the allowed range.";
  if (error.code === "42501") return "You do not have permission to do that.";
  return `Could not save the ${entity}. Please try again.`;
}

export async function logActivity(ctx, action, entity, entityId, summary) {
  const { error } = await ctx.supabase.from("admin_activity_logs").insert({
    actor_id: ctx.user.id,
    action,
    entity,
    entity_id: entityId ?? null,
    summary: summary?.slice(0, 300) ?? null,
  });
  if (error) console.error("Activity log failed:", error.code);
}

/** The SPA reads fresh data from Supabase, so there is no server cache to invalidate. */
export function revalidatePublic() {}
