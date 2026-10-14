import { publicImageUrl as build } from "@shared/format";

export const publicImageUrl = (key) => build(import.meta.env.VITE_SUPABASE_URL, key);
export const SITE_URL = typeof window !== "undefined" ? window.location.origin : "";
