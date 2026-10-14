const inr = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
});
export function formatINR(value) {
    const n = typeof value === "string" ? Number(value) : value;
    return Number.isFinite(n) ? inr.format(n) : "";
}
export function slugify(input) {
    return input
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}
export function formatDate(value) {
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export const PUBLIC_BUCKET = "public-media";

/** Stable public URL for an object in the public bucket (base = Supabase project URL). */
export function publicImageUrl(base, key) {
    if (!key)
        return null;
    if (/^https:\/\//i.test(key))
        return key; // a full URL (e.g. an externally hosted logo) is used as-is
    if (!base)
        return null;
    return `${base}/storage/v1/object/public/${PUBLIC_BUCKET}/${key.split("/").map(encodeURIComponent).join("/")}`;
}
