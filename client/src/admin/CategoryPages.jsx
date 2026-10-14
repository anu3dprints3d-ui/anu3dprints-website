import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import Image from "@/components/Image";
import Link from "@/components/Link";
import { PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/category-form";
import { CategoryRowActions } from "@/components/admin/category-row-actions";
import { buttonVariants } from "@/components/ui/button";
import { Badge, EmptyState, Skeleton } from "@/components/ui/misc";
import { supabase } from "@/lib/supabase";
import { publicImageUrl } from "@/lib/urls";
import { useData } from "@/lib/useData";
import NotFound from "@/pages/NotFound";

export function CategoriesAdminPage() {
  const { data, loading } = useData(async () => {
    const [{ data: cats, error }, { data: counts }] = await Promise.all([
      supabase.from("categories").select("id,name,slug,image_key,sort_order,is_active").order("sort_order"),
      supabase.from("products").select("primary_category_id").is("archived_at", null),
    ]);
    const countBy = {};
    for (const p of counts ?? []) if (p.primary_category_id) countBy[p.primary_category_id] = (countBy[p.primary_category_id] ?? 0) + 1;
    return { cats: cats ?? [], countBy, error };
  }, []);

  return (
    <>
      <PageHeader title="Categories" actions={<Link href="/admin/categories/new" className={buttonVariants({})}><Plus className="size-4" aria-hidden /> New category</Link>} />
      {loading || !data ? <Skeleton className="h-48" /> : data.error ? <EmptyState title="Could not load categories" /> : !data.cats.length ? (
        <EmptyState title="No categories yet" action={<Link href="/admin/categories/new" className={buttonVariants({})}>Create one</Link>} />
      ) : (
        <Table>
          <thead><tr><Th>Category</Th><Th>Order</Th><Th>Products</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
          <tbody>
            {data.cats.map((c) => {
              const src = publicImageUrl(c.image_key);
              return (
                <tr key={c.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 overflow-hidden rounded-lg bg-muted">{src ? <Image src={src} alt="" fill sizes="40px" className="object-cover" /> : null}</div>
                      <div><p className="font-semibold">{c.name}</p><p className="text-xs text-muted-foreground">/{c.slug}</p></div>
                    </div>
                  </Td>
                  <Td label="Order">{c.sort_order}</Td>
                  <Td label="Products">{data.countBy[c.id] ?? 0}</Td>
                  <Td label="Status">{c.is_active ? <Badge tone="green">Visible</Badge> : <Badge>Archived</Badge>}</Td>
                  <Td><CategoryRowActions id={c.id} name={c.name} active={c.is_active} productCount={data.countBy[c.id] ?? 0} others={data.cats.filter((o) => o.id !== c.id).map((o) => ({ id: o.id, name: o.name }))} /></Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}

export const NewCategoryPage = () => (
  <>
    <PageHeader title="New category" />
    <CategoryForm />
  </>
);

export function EditCategoryPage() {
  const { id } = useParams();
  const { data: category, loading } = useData(async () => (await supabase.from("categories").select("*").eq("id", id).maybeSingle()).data, [id]);
  if (loading) return <Skeleton className="h-64" />;
  if (!category) return <NotFound inline />;
  return (
    <>
      <PageHeader title={category.name} />
      <CategoryForm category={category} imageUrl={publicImageUrl(category.image_key)} />
    </>
  );
}
