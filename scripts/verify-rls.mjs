// Verifies Row Level Security from the outside, using ONLY the publishable (anon) key.
// Run after migrations + seed:  node --env-file=.env.local scripts/verify-rls.mjs
// Exits non-zero if any check fails. Needs no secrets beyond the public URL + publishable key.
import { createClient } from "@supabase/supabase-js";

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
const key = (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
if (!url || !key) {
  console.error("Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local");
  process.exit(1);
}
const anon = createClient(url, key, { auth: { persistSession: false } });

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` - ${detail}` : ""}`);
  if (!ok) failures++;
};

// Reads that must return NO rows for anonymous visitors.
for (const table of ["enquiries", "enquiry_notes", "enquiry_files", "enquiry_status_history", "admin_activity_logs", "profiles", "user_roles"]) {
  const { data, error } = await anon.from(table).select("*").limit(1);
  check(`anon cannot read ${table}`, !error && (data ?? []).length === 0, error?.message);
}

// Public content must be filtered to live rows only.
const { data: unpublished } = await anon.from("products").select("id").eq("is_published", false).limit(1);
check("anon sees no unpublished products", (unpublished ?? []).length === 0);
const { data: archived } = await anon.from("products").select("id").not("archived_at", "is", null).limit(1);
check("anon sees no archived products", (archived ?? []).length === 0);
const { data: inactive } = await anon.from("categories").select("id").eq("is_active", false).limit(1);
check("anon sees no inactive categories", (inactive ?? []).length === 0);
const { data: unpubGallery } = await anon.from("gallery_items").select("id").eq("is_published", false).limit(1);
check("anon sees no unpublished gallery items", (unpubGallery ?? []).length === 0);
const { data: privateSettings } = await anon.from("site_settings").select("key").eq("is_public", false).limit(1);
check("anon sees no private settings", (privateSettings ?? []).length === 0);

// Writes that must be rejected for anonymous visitors.
const writes = [
  ["insert enquiries", () => anon.from("enquiries").insert({ type: "contact", customer_name: "Rls Test", phone: "9999999999" })],
  ["insert products", () => anon.from("products").insert({ name: "x", slug: "rls-test", price: 1 })],
  ["insert categories", () => anon.from("categories").insert({ name: "xx", slug: "rls-test" })],
  ["insert user_roles", () => anon.from("user_roles").insert({ user_id: "00000000-0000-0000-0000-000000000000", role: "super_admin" })],
  ["insert admin_activity_logs", () => anon.from("admin_activity_logs").insert({ action: "x", entity: "x" })],
  ["insert site_settings", () => anon.from("site_settings").insert({ key: "rls-test", value: {} })],
];
for (const [name, run] of writes) {
  const { error } = await run();
  check(`anon cannot ${name}`, !!error, error ? "" : "write was ACCEPTED");
}
const upd = await anon.from("products").update({ price: 1 }).eq("is_published", true).select("id");
check("anon cannot update products", !!upd.error || (upd.data ?? []).length === 0);
const del = await anon.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000").select("id");
check("anon cannot delete categories", !!del.error || (del.data ?? []).length === 0);

// Helper functions must not be callable by anon.
const rpc = await anon.rpc("is_super_admin");
check("anon cannot call is_super_admin()", !!rpc.error);

console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll RLS checks passed");
process.exit(failures ? 1 : 0);
