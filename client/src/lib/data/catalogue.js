import { publicDb } from "@/lib/supabase";

export const PAGE_SIZE = 12;

const PRODUCT_SELECT =
  "*, product_images(id,product_id,storage_key,alt_text,sort_order,is_primary), categories:primary_category_id(name,slug)";

export const SORTS = {
  newest: { column: "created_at", ascending: false },
  name: { column: "name", ascending: true },
  price_asc: { column: "price", ascending: true },
  price_desc: { column: "price", ascending: false },
};

/** Strips characters that have meaning in PostgREST filter syntax. */
const sanitizeSearch = (q) => q.replace(/[,()%*\\:"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);

export const sortImages = (images = []) =>
  [...images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);

export async function getProducts(query = {}) {
  const page = Math.max(1, query.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const sort = SORTS[query.sort ?? "newest"] ?? SORTS.newest;

  let req = publicDb.from("products").select(PRODUCT_SELECT, { count: "exact" });
  if (query.categoryId) req = req.eq("primary_category_id", query.categoryId);
  if (query.min != null) req = req.gte("price", query.min);
  if (query.max != null) req = req.lte("price", query.max);
  if (query.featured) req = req.eq("is_featured", true);
  if (query.popular) req = req.eq("is_popular", true);
  if (query.q) {
    const s = sanitizeSearch(query.q);
    if (s) req = req.or(`name.ilike.%${s}%,sku.ilike.%${s}%,short_description.ilike.%${s}%,description.ilike.%${s}%`);
  }
  const { data, count, error } = await req
    .order(sort.column, { ascending: sort.ascending })
    .order("sort_order")
    .range(from, from + PAGE_SIZE - 1);
  if (error) return { products: [], total: 0, error: true };
  return { products: data ?? [], total: count ?? 0, error: false };
}

export async function getProductBySlug(slug) {
  const { data } = await publicDb.from("products").select(PRODUCT_SELECT).eq("slug", slug).maybeSingle();
  return data ?? null;
}

export async function getRelatedProducts(product, limit = 4) {
  if (!product.primary_category_id) return [];
  const { data } = await publicDb
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("primary_category_id", product.primary_category_id)
    .neq("id", product.id)
    .limit(limit);
  return data ?? [];
}

export async function getCategories() {
  const { data } = await publicDb.from("categories").select("*").order("sort_order");
  return data ?? [];
}

export async function getCategoryBySlug(slug) {
  const { data } = await publicDb.from("categories").select("*").eq("slug", slug).maybeSingle();
  return data ?? null;
}

export async function getGallery(limit) {
  let req = publicDb.from("gallery_items").select("*").order("sort_order").order("created_at", { ascending: false });
  if (limit) req = req.limit(limit);
  const { data } = await req;
  return data ?? [];
}

export async function getHomepageSections() {
  const { data } = await publicDb.from("homepage_sections").select("key,title,subtitle,content,is_visible,sort_order").order("sort_order");
  return data ?? [];
}

export async function getFaqs() {
  const { data } = await publicDb.from("faqs").select("id,question,answer").eq("is_published", true).order("sort_order");
  return data ?? [];
}
