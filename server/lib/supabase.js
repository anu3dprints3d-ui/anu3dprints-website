import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "./env.js";

const opts = { auth: { persistSession: false, autoRefreshToken: false } };

/** Service-role client. BYPASSES RLS - use only after authorising the caller in code. */
export function createAdminClient() {
  const env = serverEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, opts);
}

/** Anonymous client (publishable key): RLS limits it to public, published data. */
export function createAnonClient() {
  const env = serverEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, opts);
}

/** Client acting AS the signed-in user: their JWT is forwarded so Postgres RLS applies to every query. */
export function createUserClient(accessToken) {
  const env = serverEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    ...opts,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
