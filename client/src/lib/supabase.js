import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isConfigured = Boolean(url && key);

/** Admin client: keeps the signed-in session. RLS applies as that user. */
export const supabase = createClient(url ?? "http://localhost", key ?? "missing-key", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

/**
 * Public client: never stores or reads a session, so even a signed-in admin browsing the
 * storefront only sees what an anonymous visitor would (no drafts or archived items).
 */
export const publicDb = createClient(url ?? "http://localhost", key ?? "missing-key", {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
