import { useParams, useSearchParams } from "react-router-dom";
import { Download, Plus } from "lucide-react";
import Link from "@/components/Link";
import { downloadExport } from "@/api";
import { PageHeader } from "@/components/admin/ui";
import { ProductsTable } from "@/components/admin/products-table";
import { CsvImport } from "@/components/admin/csv-import";
import { ProductForm } from "@/components/admin/product-form";
import { ImageManager } from "@/components/admin/image-manager";
import { ProductDangerZone } from "@/components/admin/product-danger-zone";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/fields";
import { Badge, Card, EmptyState, Skeleton } from "@/components/ui/misc";
import { supabase } from "@/lib/supabase";
import { publicImageUrl } from "@/lib/urls";
import { sortImages } from "@/lib/data/catalogue";
import { useData } from "@/lib/useData";
import NotFound from "@/pages/NotFound";

const PER_PAGE = 20;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ProductsAdminPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const q = (params.get("q") ?? "").replace(/[,()%*\\:"']/g, " ").trim().slice(0, 80);
  const status = params.get("status") ?? "";
  const category = params.get("category") ?? "";

  const { data, loading } = useData(async () => {
    let query = supabase
      .from("products")
      .select("id,name,sku,price,is_published,is_featured,archived_at,primary_category_id,categories:primary_category_id(name),product_images(storage_key,is_primary,sort_order)", { count: "exact" });
    if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
    if (UUID.test(category)) query = query.eq("primary_category_id", category);
    if (status === "published") query = query.eq("is_published", true).is("archived_at", null);
    else if (status === "draft") query = query.eq("is_published", false).is("archived_at", null);
    else if (status === "archived") query = query.not("archived_at", "is", null);
    else query = query.is("archived_at", null);
    const [{ data: rows, count, error }, { data: cats }] = await Promise.all([
      query.order("created_at", { ascending: false }).range((page - 1) * PER_PAGE, page * PER_PAGE - 1),
      supabase.from("categories").select("id,name").order("sort_order"),
    ]);
    return {
      error,
      count: count ?? 0,
      cats: cats ?? [],
      rows: (rows ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: Number(p.price),
        is_published: p.is_published,
        is_featured: p.is_featured,
        archived_at: p.archived_at,
        category: p.categories?.name ?? null,
        image: publicImageUrl(sortImages(p.product_images)[0]?.storage_key),
      })),
    };
  }, [q, status, category, page]);

  const pages = Math.max(1, Math.ceil((data?.count ?? 0) / PER_PAGE));
  const go = (n) => {
    const sp = new URLSearchParams(params);
    if (n > 1) sp.set("page", String(n));
    else sp.delete("page");
    setParams(sp);
  };
  const filter = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    for (const [k, v] of fd.entries()) if (String(v).trim()) next.set(k, String(v).trim());
    setParams(next);
  };

  return (
    <>
      <PageHeader
        title="Products"
        description={`${data?.count ?? 0} product(s)`}
        actions={
          <>
            <Button variant="outline" onClick={() => downloadExport("products")}><Download className="size-4" aria-hidden /> Export CSV</Button>
            <Link href="/admin/products/new" className={buttonVariants({})}><Plus className="size-4" aria-hidden /> New product</Link>
          </>
        }
      />
      <CsvImport />
      <form onSubmit={filter} className="mb-4 grid gap-2 sm:grid-cols-[1fr_12rem_12rem_auto]" role="search" key={params.toString()}>
        <Input name="q" defaultValue={q} placeholder="Search name or SKU" aria-label="Search products" />
        <Select name="status" defaultValue={status} aria-label="Status">
          <option value="">Active (all)</option><option value="published">Published</option><option value="draft">Drafts</option><option value="archived">Archived</option>
        </Select>
        <Select name="category" defaultValue={category} aria-label="Category">
          <option value="">All categories</option>
          {(data?.cats ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Button type="submit" variant="dark">Filter</Button>
      </form>

      {loading || !data ? <Skeleton className="h-64" /> : data.error ? (
        <EmptyState title="Could not load products" body="Check the database connection and try again." />
      ) : data.rows.length === 0 ? (
        <EmptyState title="No products found" body="Create your first product or adjust the filters." action={<Link href="/admin/products/new" className={buttonVariants({})}>New product</Link>} />
      ) : (
        <ProductsTable rows={data.rows} categories={data.cats} />
      )}

      {pages > 1 ? (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-3 text-sm">
          {page > 1 ? <Button size="sm" variant="outline" onClick={() => go(page - 1)}>Previous</Button> : null}
          <span>Page {page} of {pages}</span>
          {page < pages ? <Button size="sm" variant="outline" onClick={() => go(page + 1)}>Next</Button> : null}
        </nav>
      ) : null}
    </>
  );
}

export function NewProductPage() {
  const { data: categories } = useData(async () => (await supabase.from("categories").select("id,name").order("sort_order")).data ?? [], []);
  return (
    <>
      <PageHeader title="New product" description="Save the product first, then add images." />
      {categories ? <ProductForm categories={categories} extraCategoryIds={[]} /> : <Skeleton className="h-64" />}
    </>
  );
}

export function EditProductPage() {
  const { id } = useParams();
  const valid = UUID.test(id ?? "");
  const { data, loading } = useData(async () => {
    if (!valid) return null;
    const [{ data: product }, { data: categories }, { data: extra }] = await Promise.all([
      supabase.from("products").select("*, product_images(id,product_id,storage_key,alt_text,sort_order,is_primary)").eq("id", id).maybeSingle(),
      supabase.from("categories").select("id,name").order("sort_order"),
      supabase.from("product_categories").select("category_id").eq("product_id", id),
    ]);
    return product ? { product, categories: categories ?? [], extra: (extra ?? []).map((e) => e.category_id) } : null;
  }, [id]);

  if (loading) return <Skeleton className="h-64" />;
  if (!data) return <NotFound inline />;
  const p = data.product;
  const images = sortImages(p.product_images ?? []).map((i) => ({ id: i.id, url: publicImageUrl(i.storage_key), alt: i.alt_text ?? "", isPrimary: i.is_primary }));

  return (
    <>
      <PageHeader
        title={p.name}
        description={p.sku ? `SKU ${p.sku}` : undefined}
        actions={p.archived_at ? <Badge>Archived</Badge> : p.is_published ? <Badge tone="green">Published</Badge> : <Badge tone="gold">Draft</Badge>}
      />
      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">Images</h2>
          <ImageManager productId={p.id} images={images} />
        </Card>
        <ProductForm key={p.updated_at} product={p} categories={data.categories} extraCategoryIds={data.extra} />
        <Card className="p-5 sm:p-6">
          <h2 className="mb-1 text-lg font-bold">Archive or delete</h2>
          <p className="mb-4 text-sm text-muted-foreground">Archiving hides the product but keeps it so you can restore it. Deleting also removes its images from storage.</p>
          <ProductDangerZone productId={p.id} archived={!!p.archived_at} />
        </Card>
      </div>
    </>
  );
}
