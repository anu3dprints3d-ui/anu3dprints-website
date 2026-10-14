import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "./product-card";
import Link from "@/components/Link";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { Input, Select } from "@/components/ui/fields";
import { getCategories, getProducts, PAGE_SIZE, SORTS } from "@/lib/data/catalogue";
import { useData } from "@/lib/useData";
import { cn } from "@/lib/utils";

const num = (v) => {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export function CatalogueView({ basePath, fixedCategory }) {
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") ?? "").slice(0, 80);
  const categorySlug = fixedCategory?.slug ?? params.get("category") ?? "";
  const sortParam = params.get("sort");
  const sort = sortParam && sortParam in SORTS ? sortParam : "newest";
  const min = num(params.get("min"));
  const max = num(params.get("max"));
  const page = Math.max(1, Math.floor(num(params.get("page")) ?? 1));
  const flag = params.get("show") ?? "";

  const { data: categories } = useData(getCategories, []);
  const categoryId = fixedCategory?.id ?? (categories ?? []).find((c) => c.slug === categorySlug)?.id;
  const waitingForCategory = !fixedCategory && categorySlug && !categories;

  const { data, loading } = useData(
    () =>
      waitingForCategory
        ? Promise.resolve(null)
        : getProducts({
            q,
            categoryId: categorySlug && !categoryId ? "00000000-0000-0000-0000-000000000000" : categoryId,
            min,
            max,
            sort,
            page,
            featured: flag === "featured",
            popular: flag === "popular",
          }),
    [q, categorySlug, categoryId, min, max, sort, page, flag, waitingForCategory],
  );

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeFilters = [q, !fixedCategory && categorySlug, min != null, max != null, flag].filter(Boolean).length;

  const hrefFor = (p) => {
    const sp = new URLSearchParams(params);
    if (p > 1) sp.set("page", String(p));
    else sp.delete("page");
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  function apply(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    for (const [k, v] of fd.entries()) if (String(v).trim() !== "" && !(k === "sort" && v === "newest")) next.set(k, String(v).trim());
    setParams(next);
  }

  const filters = (
    <form onSubmit={apply} className="space-y-4">
      <div>
        <label htmlFor="q" className="mb-1.5 block text-sm font-medium">Search</label>
        <Input id="q" name="q" defaultValue={q} placeholder="Name, SKU or keyword" />
      </div>
      {!fixedCategory ? (
        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm font-medium">Category</label>
          <Select id="category" name="category" defaultValue={categorySlug}>
            <option value="">All categories</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </Select>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="min" className="mb-1.5 block text-sm font-medium">Min ₹</label>
          <Input id="min" name="min" type="number" min={0} inputMode="numeric" defaultValue={min ?? ""} />
        </div>
        <div>
          <label htmlFor="max" className="mb-1.5 block text-sm font-medium">Max ₹</label>
          <Input id="max" name="max" type="number" min={0} inputMode="numeric" defaultValue={max ?? ""} />
        </div>
      </div>
      <div>
        <label htmlFor="show" className="mb-1.5 block text-sm font-medium">Show</label>
        <Select id="show" name="show" defaultValue={flag}>
          <option value="">Everything</option>
          <option value="featured">Featured</option>
          <option value="popular">Popular</option>
        </Select>
      </div>
      <div>
        <label htmlFor="sort" className="mb-1.5 block text-sm font-medium">Sort by</label>
        <Select id="sort" name="sort" defaultValue={sort}>
          <option value="newest">Newest</option>
          <option value="name">Name (A-Z)</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">Apply</Button>
        {activeFilters > 0 ? <Link href={basePath} className={cn(buttonVariants({ variant: "outline" }))}>Clear</Link> : null}
      </div>
    </form>
  );

  const products = data?.products ?? [];

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      {/* key remounts the (uncontrolled) filter inputs when the URL changes, e.g. after "Clear" */}
      <aside aria-label="Filters" key={params.toString()}>
        <details className="rounded-2xl border border-border bg-card p-4 lg:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold">
            <SlidersHorizontal className="size-4" aria-hidden /> Filters &amp; sort
            {activeFilters > 0 ? <span className="rounded-full bg-gold px-2 text-xs">{activeFilters}</span> : null}
          </summary>
          <div className="mt-4">{filters}</div>
        </details>
        <div className="sticky top-24 hidden rounded-2xl border border-border bg-card p-5 lg:block">{filters}</div>
      </aside>

      <section aria-live="polite">
        <p className="mb-4 text-sm text-muted-foreground">{loading || data?.error ? " " : `${total} product${total === 1 ? "" : "s"}`}</p>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
          </div>
        ) : data?.error ? (
          <EmptyState title="We couldn't load products" body="Something went wrong on our side. Please try again." action={<Button variant="dark" onClick={() => window.location.reload()}>Retry</Button>} />
        ) : products.length === 0 ? (
          <EmptyState title="No products found" body="Try different keywords or clear the filters. Can't find it? We can make it for you." action={<Link href="/custom-3d-printing" className={buttonVariants({})}>Request a custom print</Link>} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
              {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
            </div>
            {pages > 1 ? (
              <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3">
                {page > 1 ? <Link href={hrefFor(page - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}><ChevronLeft className="size-4" aria-hidden /> Previous</Link> : null}
                <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
                {page < pages ? <Link href={hrefFor(page + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>Next <ChevronRight className="size-4" aria-hidden /></Link> : null}
              </nav>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
