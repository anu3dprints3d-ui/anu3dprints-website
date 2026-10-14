import { createAnonClient, createUserClient } from "./supabase.js";

export const CATALOGUE_ROLES = ["super_admin", "catalogue_manager"];
export const ENQUIRY_ROLES = ["super_admin", "enquiry_manager"];
export const SUPER_ONLY = ["super_admin"];

export class AuthError extends Error {}

export const hasAnyRole = (user, allowed) => user.roles.some((r) => allowed.includes(r));

/**
 * Verifies the bearer token with Supabase (not just decoding it), then loads the caller's roles
 * through a client that carries their JWT. Returns null for anonymous/invalid/non-admin callers.
 */
export async function buildAdminContext(req) {
  const header = req.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;

  const { data, error } = await createAnonClient().auth.getUser(token);
  if (error || !data.user) return null;

  const supabase = createUserClient(token);
  const [{ data: roleRows }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", data.user.id),
    supabase.from("profiles").select("full_name,is_active").eq("id", data.user.id).maybeSingle(),
  ]);
  const roles = (roleRows ?? []).map((r) => r.role);
  if (roles.length === 0 || profile?.is_active === false) return null;

  return { id: data.user.id, email: data.user.email ?? "", roles, supabase };
}

/** Throws AuthError unless the caller (ctx.user) holds one of the allowed roles. */
export function assertAdmin(ctx, allowed) {
  if (!ctx.user) throw new AuthError("Your session has expired. Please sign in again.");
  if (!hasAnyRole(ctx.user, allowed)) throw new AuthError("You do not have permission to do that.");
  return ctx.user;
}
