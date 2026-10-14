-- Anu3D Prints: core schema. No payment tables by design (WhatsApp-only workflow).
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------- helpers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- roles ----------
create type public.app_role as enum ('super_admin', 'catalogue_manager', 'enquiry_manager');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- Authorization helpers. SECURITY DEFINER + fixed search_path avoids recursive RLS.
create or replace function public.has_role(_role public.app_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles ur
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = (select auth.uid()) and ur.role = _role and p.is_active
  );
$$;

create or replace function public.has_any_role(_roles public.app_role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles ur
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = (select auth.uid()) and ur.role = any(_roles) and p.is_active
  );
$$;

create or replace function public.can_manage_catalogue()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_any_role(array['super_admin','catalogue_manager']::public.app_role[]);
$$;

create or replace function public.can_manage_enquiries()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_any_role(array['super_admin','enquiry_manager']::public.app_role[]);
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_role('super_admin');
$$;

-- Auto-create a profile for every new auth user (no role is ever granted automatically).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- catalogue ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  image_key text,
  image_alt text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_active_order_idx on public.categories (is_active, sort_order);

create type public.availability_status as enum ('in_stock', 'made_to_order', 'limited', 'out_of_stock');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sku text unique,
  short_description text,
  description text,
  price numeric(10,2) not null check (price >= 0),
  sale_price numeric(10,2) check (sale_price is null or (sale_price >= 0 and sale_price <= price)),
  primary_category_id uuid references public.categories(id) on delete restrict,
  specifications jsonb not null default '[]'::jsonb,   -- [{label, value}] display-only list
  material_options text[] not null default '{}',
  color_options text[] not null default '{}',
  size_options text[] not null default '{}',
  dimensions text,
  weight_grams numeric(10,2) check (weight_grams is null or weight_grams >= 0),
  print_duration text,
  lead_time text,
  availability public.availability_status not null default 'made_to_order',
  stock_quantity int check (stock_quantity is null or stock_quantity >= 0),
  is_featured boolean not null default false,
  is_popular boolean not null default false,
  is_published boolean not null default false,
  archived_at timestamptz,
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(sku,'') || ' ' || coalesce(short_description,'') || ' ' || coalesce(description,''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_listing_idx on public.products (is_published, archived_at, created_at desc);
create index products_category_idx on public.products (primary_category_id);
create index products_price_idx on public.products (price);
create index products_search_idx on public.products using gin (search_vector);
create index products_name_trgm_idx on public.products using gin (name gin_trgm_ops);

create table public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);
create index product_categories_category_idx on public.product_categories (category_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_key text not null unique,
  alt_text text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  width int,
  height int,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort_order);
create unique index product_images_one_primary_idx on public.product_images (product_id) where is_primary;

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  sku text unique,
  price_override numeric(10,2) check (price_override is null or price_override >= 0),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index product_variants_product_idx on public.product_variants (product_id, sort_order);

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text,
  caption text,
  alt_text text not null default '',
  project_type text,
  storage_key text not null unique,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index gallery_published_idx on public.gallery_items (is_published, sort_order);

-- ---------- enquiries ----------
create type public.enquiry_type as enum ('product', 'custom_print', 'bulk_order', 'contact');
create type public.enquiry_status as enum (
  'new', 'contacted', 'quotation_pending', 'quotation_sent', 'confirmed_outside_website', 'completed', 'closed'
);

create sequence public.enquiry_ref_seq start 1001;

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('A3D-' || nextval('public.enquiry_ref_seq')),
  type public.enquiry_type not null,
  status public.enquiry_status not null default 'new',
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  phone text not null check (char_length(phone) between 7 and 20),
  email text,
  company_name text,
  product_id uuid references public.products(id) on delete set null,
  product_name text,
  quantity int check (quantity is null or quantity > 0),
  material text,
  size_preference text,
  required_by date,
  customization_details text,
  message text,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index enquiries_status_idx on public.enquiries (status, created_at desc);
create index enquiries_type_idx on public.enquiries (type, created_at desc);

create table public.enquiry_files (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  storage_key text not null unique,
  original_name text not null,
  content_type text not null,
  size_bytes int not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);
create index enquiry_files_enquiry_idx on public.enquiry_files (enquiry_id);

create table public.enquiry_notes (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index enquiry_notes_enquiry_idx on public.enquiry_notes (enquiry_id, created_at);

create table public.enquiry_status_history (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  from_status public.enquiry_status,
  to_status public.enquiry_status not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index enquiry_status_history_enquiry_idx on public.enquiry_status_history (enquiry_id, created_at);

-- Record the initial status and every later change automatically.
create or replace function public.log_enquiry_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.enquiry_status_history (enquiry_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, (select auth.uid()));
  elsif new.status is distinct from old.status then
    insert into public.enquiry_status_history (enquiry_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, (select auth.uid()));
  end if;
  return new;
end $$;

create trigger enquiries_log_status
  after insert or update of status on public.enquiries
  for each row execute function public.log_enquiry_status();

-- ---------- content & settings ----------
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default true,   -- false = never exposed to anon
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table public.homepage_sections (
  key text primary key,                      -- hero, categories, featured, popular, recent, how_it_works, custom_print, bulk, gallery, faq, contact
  title text,
  subtitle text,
  content jsonb not null default '{}'::jsonb, -- validated by the app per section key
  is_visible boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  summary text,
  created_at timestamptz not null default now()
);
create index admin_activity_logs_created_idx on public.admin_activity_logs (created_at desc);

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['profiles','categories','products','gallery_items','enquiries','site_settings','homepage_sections','faqs']
  loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Atomically make one image primary.
create or replace function public.set_primary_product_image(_product uuid, _image uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  update public.product_images set is_primary = false where product_id = _product and is_primary and id <> _image;
  update public.product_images set is_primary = true where id = _image and product_id = _product;
end $$;
