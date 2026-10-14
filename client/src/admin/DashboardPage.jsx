import Link from "@/components/Link";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { Card, Skeleton } from "@/components/ui/misc";
import { CATALOGUE_ROLES, ENQUIRY_ROLES, SUPER_ONLY, hasAnyRole, useAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useData } from "@/lib/useData";
import { formatDate } from "@shared/format";
import { ENQUIRY_STATUS_LABELS } from "@shared/constants";

const head = { count: "exact", head: true };
const count = (q) => q.then((r) => r.count ?? 0);

export default function DashboardPage() {
  const { user } = useAdmin();
  const showCatalogue = hasAnyRole(user, CATALOGUE_ROLES);
  const showEnquiries = hasAnyRole(user, ENQUIRY_ROLES);
  const showActivity = hasAnyRole(user, SUPER_ONLY);

  const { data, loading } = useData(async () => {
    const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
    const [products, published, categories, featured, recent, unavailable, enquiries, activity] = await Promise.all([
      showCatalogue ? count(supabase.from("products").select("id", head).is("archived_at", null)) : 0,
      showCatalogue ? count(supabase.from("products").select("id", head).eq("is_published", true).is("archived_at", null)) : 0,
      showCatalogue ? count(supabase.from("categories").select("id", head)) : 0,
      showCatalogue ? count(supabase.from("products").select("id", head).eq("is_featured", true).eq("is_published", true)) : 0,
      showCatalogue ? count(supabase.from("products").select("id", head).gte("created_at", weekAgo)) : 0,
      showCatalogue ? count(supabase.from("products").select("id", head).eq("availability", "out_of_stock").is("archived_at", null)) : 0,
      showEnquiries ? supabase.from("enquiries").select("status").then((r) => r.data ?? []) : [],
      showActivity ? supabase.from("admin_activity_logs").select("id,action,entity,summary,created_at").order("created_at", { ascending: false }).limit(8).then((r) => r.data ?? []) : [],
    ]);
    const byStatus = {};
    for (const e of enquiries) byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
    return { products, published, categories, featured, recent, unavailable, byStatus, activity };
  }, [showCatalogue, showEnquiries, showActivity]);

  return (
    <>
      <PageHeader title="Dashboard" description={`Signed in as ${user.email}`} />
      {loading || !data ? <Skeleton className="h-32" /> : (
        <>
          {showCatalogue ? (
            <section aria-label="Catalogue" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard label="Active products" value={data.products} href="/admin/products" hint={`${data.published} published`} />
              <StatCard label="Categories" value={data.categories} href="/admin/categories" />
              <StatCard label="Featured" value={data.featured} />
              <StatCard label="Added this week" value={data.recent} />
              <StatCard label="Out of stock" value={data.unavailable} />
            </section>
          ) : null}

          {showEnquiries ? (
            <section aria-label="Enquiries" className="mt-6">
              <h2 className="mb-3 text-lg font-bold">Enquiries by status</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {Object.keys(ENQUIRY_STATUS_LABELS).map((s) => (
                  <StatCard key={s} label={ENQUIRY_STATUS_LABELS[s]} value={data.byStatus[s] ?? 0} href={`/admin/enquiries?status=${s}`} />
                ))}
              </div>
            </section>
          ) : null}

          {data.activity.length > 0 ? (
            <section aria-label="Recent activity" className="mt-8">
              <h2 className="mb-3 text-lg font-bold">Recent administrative activity</h2>
              <Card className="divide-y divide-border">
                {data.activity.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <span><span className="font-semibold capitalize">{a.action}</span> {a.entity}{a.summary ? ` - ${a.summary}` : ""}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
                  </div>
                ))}
              </Card>
            </section>
          ) : null}
        </>
      )}
      <p className="mt-8 text-xs text-muted-foreground">
        All numbers are live counts from the database. This site takes enquiries only, so there are no sales or payment figures. <Link href="/" className="underline">View public site</Link>
      </p>
    </>
  );
}
