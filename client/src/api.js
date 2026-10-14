import { supabase } from "@/lib/supabase";
import { loginSchema } from "@shared/schemas";

const NETWORK = "Network problem - please check your connection and try again.";

/** POST to the Express action endpoint. Sends the user's JWT so the server can verify and apply RLS. */
async function call(name, args = [], formData = null) {
  const body = new FormData();
  body.set("_args", JSON.stringify(args));
  if (formData) {
    body.set("_form", "1");
    for (const [key, value] of formData.entries()) body.append(key, value);
  }
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  try {
    const res = await fetch(`/api/actions/${name}`, { method: "POST", body, headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return await res.json();
  } catch {
    return { ok: false, message: NETWORK, error: NETWORK };
  }
}

// (previousState, FormData) - shape used by React's useActionState
const stateful = (name) => (_prev, fd) => call(name, [], fd);
// (...jsonArgs, FormData)
const withForm = (name) => (...args) => {
  const fd = args.pop();
  return call(name, args, fd);
};
// (...jsonArgs)
const plain = (name) => (...args) => call(name, args);

export const submitEnquiry = (fd) => call("submitEnquiry", [], fd);

export const saveProduct = stateful("saveProduct");
export const saveCategory = stateful("saveCategory");
export const saveBusinessSettings = stateful("saveBusinessSettings");
export const saveSiteMessaging = stateful("saveSiteMessaging");
export const saveHomepageSection = stateful("saveHomepageSection");
export const saveFaq = stateful("saveFaq");
export const importProductsCsv = stateful("importProductsCsv");
export const addEnquiryNote = stateful("addEnquiryNote");
export const inviteAdmin = stateful("inviteAdmin");

export const uploadProductImage = withForm("uploadProductImage");
export const uploadGalleryItem = withForm("uploadGalleryItem");
export const updateGalleryItem = withForm("updateGalleryItem");

export const deleteProductImage = plain("deleteProductImage");
export const setPrimaryImage = plain("setPrimaryImage");
export const moveProductImage = plain("moveProductImage");
export const updateImageAlt = plain("updateImageAlt");
export const duplicateProduct = plain("duplicateProduct");
export const archiveProduct = plain("archiveProduct");
export const deleteProduct = plain("deleteProduct");
export const bulkProductAction = plain("bulkProductAction");
export const removeCategoryImage = plain("removeCategoryImage");
export const deleteCategory = plain("deleteCategory");
export const setCategoryActive = plain("setCategoryActive");
export const deleteGalleryItem = plain("deleteGalleryItem");
export const setEnquiryStatus = plain("setEnquiryStatus");
export const assignEnquiry = plain("assignEnquiry");
export const getEnquiryDetail = plain("getEnquiryDetail");
export const getFileUrl = plain("getFileUrl");
export const getStorageStatus = plain("getStorageStatus");
export const deleteFaq = plain("deleteFaq");
export const setUserRole = plain("setUserRole");
export const setUserActive = plain("setUserActive");

/** Downloads a CSV export from the server (needs the Authorization header, so not a plain link). */
export async function downloadExport(what, params = {}) {
  const { data } = await supabase.auth.getSession();
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/admin/export/${what}${qs ? `?${qs}` : ""}`, { headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` } });
  if (!res.ok) return { ok: false, message: "Export failed." };
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = `${what}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return { ok: true };
}

// ---------- auth (browser, Supabase Auth directly) ----------
export async function signIn(_prev, formData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Enter a valid email and a password of at least 8 characters." };
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { ok: false, message: "Incorrect email or password." }; // same message for unknown user / wrong password
  const [{ data: roles }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", data.user.id),
    supabase.from("profiles").select("is_active").eq("id", data.user.id).maybeSingle(),
  ]);
  if (!roles?.length || profile?.is_active === false) {
    await supabase.auth.signOut();
    return { ok: false, message: "This account does not have admin access." };
  }
  return { ok: true, message: "Signed in" };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function requestPasswordReset(_prev, formData) {
  const email = String(formData.get("email") ?? "").trim();
  if (/^\S+@\S+\.\S+$/.test(email)) {
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/admin/auth/confirm?next=/admin/reset-password` });
  }
  // Always the same response so the form cannot be used to discover admin emails.
  return { ok: true, message: "If that email belongs to an admin, a reset link is on its way." };
}

export async function updatePassword(_prev, formData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 12) return { ok: false, message: "Use at least 12 characters." };
  if (password !== String(formData.get("confirm") ?? "")) return { ok: false, message: "Passwords do not match." };
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, message: "This reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: "Could not update the password. The link may have expired." };
  return { ok: true, message: "Password updated." };
}
