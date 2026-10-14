import { CheckCircle2, XCircle } from "lucide-react";
import { getStorageStatus } from "@/api";
import { PageHeader } from "@/components/admin/ui";
import { BusinessForm, FaqForm, MessagingForm, SectionForm } from "@/components/admin/content-forms";
import { InviteForm, UserCard } from "@/components/admin/users-manager";
import { Card, Skeleton } from "@/components/ui/misc";
import { useAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useData } from "@/lib/useData";
import { DEFAULT_WHATSAPP } from "@shared/whatsapp";

export function ContentAdminPage() {
  const { data, loading } = useData(async () => {
    const [{ data: sections }, { data: faqs }] = await Promise.all([
      supabase.from("homepage_sections").select("*").order("sort_order"),
      supabase.from("faqs").select("*").order("sort_order"),
    ]);
    return { sections: sections ?? [], faqs: faqs ?? [] };
  }, []);
  return (
    <>
      <PageHeader title="Homepage content" description="Headings, order and visibility of each homepage section. Featured/popular products are chosen on each product." />
      {loading ? <Skeleton className="h-64" /> : (
        <>
          <div className="space-y-4">{data.sections.map((s) => <SectionForm key={`${s.key}-${s.updated_at}`} section={s} />)}</div>
          <h2 className="mb-3 mt-12 text-xl font-bold">FAQs</h2>
          <div className="space-y-3">
            {data.faqs.map((f) => <FaqForm key={`${f.id}-${f.updated_at}`} faq={f} />)}
            <FaqForm key={`new-${data.faqs.length}`} />
          </div>
        </>
      )}
    </>
  );
}

export function SettingsAdminPage() {
  const { data, loading } = useData(async () => {
    const [{ data: rows }, storage] = await Promise.all([supabase.from("site_settings").select("key,value"), getStorageStatus()]);
    return { map: Object.fromEntries((rows ?? []).map((r) => [r.key, r.value])), storage };
  }, []);
  const m = data?.map ?? {};
  const business = { name: "", tagline: "", support: "", location: "", phone: "", email: "", address: "", hours: "", whatsapp: DEFAULT_WHATSAPP, instagram: "", facebook: "", map_url: "", logo_key: "", favicon_key: "", ...(m.business ?? {}) };
  business.whatsapp = business.whatsapp || DEFAULT_WHATSAPP;

  return (
    <>
      <PageHeader title="Settings" />
      {loading ? <Skeleton className="h-64" /> : (
        <div className="space-y-6">
          <BusinessForm b={business} />
          <MessagingForm
            announcement={{ enabled: false, text: "", ...(m.announcement ?? {}) }}
            shipping={{ lead_time_message: "", info: "", ...(m.shipping ?? {}) }}
            seo={{ title: "", description: "", ...(m.seo ?? {}) }}
            maintenance={{ enabled: false, ...(m.maintenance ?? {}) }}
          />
          <Card className="p-5 sm:p-6">
            <h2 className="mb-3 text-lg font-bold">Storage status</h2>
            {!data.storage.ok ? <p className="text-sm text-danger">{data.storage.message}</p> : (
              <ul className="space-y-2 text-sm">
                {data.storage.buckets.map((s) => (
                  <li key={s.bucket} className="flex items-center gap-2">
                    {s.ok ? <CheckCircle2 className="size-4 text-success" aria-hidden /> : <XCircle className="size-4 text-danger" aria-hidden />}
                    <span className="font-medium">{s.bucket}</span> {s.ok ? "reachable" : `not reachable (${s.error})`}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted-foreground">Credentials live in server environment variables and are never displayed.</p>
          </Card>
        </div>
      )}
    </>
  );
}

export function UsersAdminPage() {
  const { user: me } = useAdmin();
  const { data, loading } = useData(async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id,email,is_active").order("email"),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    const byUser = {};
    for (const r of roles ?? []) (byUser[r.user_id] ??= []).push(r.role);
    return (profiles ?? []).filter((p) => byUser[p.id] || p.id === me.id).map((p) => ({ id: p.id, email: p.email, is_active: p.is_active, roles: byUser[p.id] ?? [] }));
  }, [me.id]);

  return (
    <>
      <PageHeader title="Admin users" description="Invite staff and control what each person can do. Public visitors can never create accounts." />
      <InviteForm />
      {loading ? <Skeleton className="mt-6 h-32" /> : (
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {data.map((u) => <UserCard key={`${u.id}-${u.roles.join()}-${u.is_active}`} user={u} isSelf={u.id === me.id} />)}
        </div>
      )}
    </>
  );
}
