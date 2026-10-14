// Creates the FIRST super admin using the service key. Run once, locally, never from the browser.
// Requires in .env.local: VITE_SUPABASE_URL, SUPABASE_SECRET_KEY, ADMIN_BOOTSTRAP_EMAIL, ADMIN_BOOTSTRAP_PASSWORD
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL: url0, VITE_SUPABASE_URL: url1, SUPABASE_SECRET_KEY: key, ADMIN_BOOTSTRAP_EMAIL: email, ADMIN_BOOTSTRAP_PASSWORD: password } =
  process.env;
const url = url0 || url1;

if (!url || !key || !email || !password) {
  console.error("Set VITE_SUPABASE_URL, SUPABASE_SECRET_KEY, ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD in .env.local");
  process.exit(1);
}
if (password.length < 12) {
  console.error("ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: existing, error: listError } = await supabase.from("user_roles").select("user_id").eq("role", "super_admin").limit(1);
if (listError) {
  console.error("Could not read user_roles. Have the migrations been applied?", listError.message);
  process.exit(1);
}
if (existing && existing.length > 0 && !process.argv.includes("--force")) {
  console.error("A super admin already exists. Use the admin dashboard to invite more users (or pass --force).");
  process.exit(1);
}

const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
if (error || !data.user) {
  console.error("Could not create user:", error?.message ?? "unknown error");
  process.exit(1);
}
const { error: roleError } = await supabase.from("user_roles").insert({ user_id: data.user.id, role: "super_admin" });
if (roleError) {
  console.error("User created but role assignment failed:", roleError.message);
  process.exit(1);
}
console.log(`Super admin created for ${email}. Sign in at /admin/login, then remove ADMIN_BOOTSTRAP_PASSWORD from .env.local.`);
