-- Row Level Security for every table in the public schema.
-- Public enquiry submission is NOT an anon INSERT policy: it goes through a server
-- action (rate-limited, validated) that uses the service key. Anon cannot write anything.

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.gallery_items enable row level security;
alter table public.enquiries enable row level security;
alter table public.enquiry_files enable row level security;
alter table public.enquiry_notes enable row level security;
alter table public.enquiry_status_history enable row level security;
alter table public.site_settings enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.faqs enable row level security;
alter table public.admin_activity_logs enable row level security;

-- Lock down helper functions: only signed-in users may call them.
revoke execute on function public.has_role(public.app_role) from public, anon;
revoke execute on function public.has_any_role(public.app_role[]) from public, anon;
revoke execute on function public.can_manage_catalogue() from public, anon;
revoke execute on function public.can_manage_enquiries() from public, anon;
revoke execute on function public.is_super_admin() from public, anon;
grant execute on function public.has_role(public.app_role) to authenticated;
grant execute on function public.has_any_role(public.app_role[]) to authenticated;
grant execute on function public.can_manage_catalogue() to authenticated;
grant execute on function public.can_manage_enquiries() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

-- ---------- profiles / roles ----------
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: super admin read all" on public.profiles
  for select to authenticated using ((select public.is_super_admin()));
create policy "profiles: super admin update" on public.profiles
  for update to authenticated using ((select public.is_super_admin())) with check ((select public.is_super_admin()));

create policy "user_roles: read own" on public.user_roles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "user_roles: super admin manage" on public.user_roles
  for all to authenticated using ((select public.is_super_admin())) with check ((select public.is_super_admin()));

-- ---------- catalogue (public read of live content, staff write) ----------
create policy "categories: public read active" on public.categories
  for select to anon, authenticated using (is_active);
create policy "categories: catalogue staff all" on public.categories
  for all to authenticated using ((select public.can_manage_catalogue())) with check ((select public.can_manage_catalogue()));

create policy "products: public read published" on public.products
  for select to anon, authenticated using (is_published and archived_at is null);
create policy "products: catalogue staff all" on public.products
  for all to authenticated using ((select public.can_manage_catalogue())) with check ((select public.can_manage_catalogue()));

create policy "product_categories: public read" on public.product_categories
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and p.is_published and p.archived_at is null)
  );
create policy "product_categories: catalogue staff all" on public.product_categories
  for all to authenticated using ((select public.can_manage_catalogue())) with check ((select public.can_manage_catalogue()));

create policy "product_images: public read" on public.product_images
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and p.is_published and p.archived_at is null)
  );
create policy "product_images: catalogue staff all" on public.product_images
  for all to authenticated using ((select public.can_manage_catalogue())) with check ((select public.can_manage_catalogue()));

create policy "product_variants: public read" on public.product_variants
  for select to anon, authenticated using (
    is_active and exists (select 1 from public.products p where p.id = product_id and p.is_published and p.archived_at is null)
  );
create policy "product_variants: catalogue staff all" on public.product_variants
  for all to authenticated using ((select public.can_manage_catalogue())) with check ((select public.can_manage_catalogue()));

create policy "gallery: public read published" on public.gallery_items
  for select to anon, authenticated using (is_published);
create policy "gallery: catalogue staff all" on public.gallery_items
  for all to authenticated using ((select public.can_manage_catalogue())) with check ((select public.can_manage_catalogue()));

create policy "faqs: public read published" on public.faqs
  for select to anon, authenticated using (is_published);
create policy "faqs: super admin all" on public.faqs
  for all to authenticated using ((select public.is_super_admin())) with check ((select public.is_super_admin()));

-- ---------- content & settings ----------
create policy "homepage_sections: public read visible" on public.homepage_sections
  for select to anon, authenticated using (is_visible);
create policy "homepage_sections: super admin all" on public.homepage_sections
  for all to authenticated using ((select public.is_super_admin())) with check ((select public.is_super_admin()));

create policy "site_settings: public read public keys" on public.site_settings
  for select to anon, authenticated using (is_public);
create policy "site_settings: super admin all" on public.site_settings
  for all to authenticated using ((select public.is_super_admin())) with check ((select public.is_super_admin()));

-- ---------- enquiries (private: no anon access at all) ----------
create policy "enquiries: staff read" on public.enquiries
  for select to authenticated using ((select public.can_manage_enquiries()));
create policy "enquiries: staff update" on public.enquiries
  for update to authenticated using ((select public.can_manage_enquiries())) with check ((select public.can_manage_enquiries()));
create policy "enquiries: super admin delete" on public.enquiries
  for delete to authenticated using ((select public.is_super_admin()));

create policy "enquiry_files: staff read" on public.enquiry_files
  for select to authenticated using ((select public.can_manage_enquiries()));

create policy "enquiry_notes: staff read" on public.enquiry_notes
  for select to authenticated using ((select public.can_manage_enquiries()));
create policy "enquiry_notes: staff insert as self" on public.enquiry_notes
  for insert to authenticated with check ((select public.can_manage_enquiries()) and author_id = (select auth.uid()));

create policy "enquiry_status_history: staff read" on public.enquiry_status_history
  for select to authenticated using ((select public.can_manage_enquiries()));

-- ---------- audit log ----------
create policy "activity_logs: super admin read" on public.admin_activity_logs
  for select to authenticated using ((select public.is_super_admin()));
create policy "activity_logs: staff insert as self" on public.admin_activity_logs
  for insert to authenticated with check (
    actor_id = (select auth.uid())
    and (select public.has_any_role(array['super_admin','catalogue_manager','enquiry_manager']::public.app_role[]))
  );

-- Sequence used by enquiry references must not be callable by clients directly.
revoke all on sequence public.enquiry_ref_seq from anon, authenticated;
