-- Lanzarote Experience Tours — initial Supabase schema
-- Run in Supabase SQL Editor or via supabase db push

create extension if not exists "pgcrypto";

-- ── Bookings ──────────────────────────────────────────────
create table if not exists public.bookings (
  id text primary key,
  created_at timestamptz not null default now(),
  type text not null check (type in ('tour', 'transfer', 'minibus')),
  tour_id text,
  tour_title text not null,
  service_date date not null,
  adults int not null default 1,
  children int not null default 0,
  total_price numeric(12,2) not null default 0,
  amount_total numeric(12,2) not null default 0,
  amount_paid_card numeric(12,2) not null default 0,
  amount_due_cash numeric(12,2) not null default 0,
  amount_paid_cash numeric(12,2) not null default 0,
  payment_method text not null,
  payment_status text not null,
  cash_status text not null,
  status text not null check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  invoice_id text,
  cancellation_reason text,
  cancelled_at timestamptz,
  cancellation_fee numeric(12,2),
  customer jsonb not null default '{}'::jsonb,
  transfer jsonb,
  minibus jsonb
);

create index if not exists bookings_service_date_idx on public.bookings (service_date);
create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists bookings_customer_email_idx on public.bookings ((lower(customer->>'email')));

-- ── Invoices ──────────────────────────────────────────────
create table if not exists public.invoices (
  id text primary key,
  number int not null,
  type text not null check (type in ('invoice', 'credit_note')),
  booking_id text not null references public.bookings(id) on delete cascade,
  created_at timestamptz not null default now(),
  customer jsonb not null default '{}'::jsonb,
  lines jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  tax_rate numeric(6,2) not null default 7,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  related_invoice_id text,
  notes text,
  status text not null default 'issued' check (status in ('issued', 'void'))
);

create index if not exists invoices_booking_id_idx on public.invoices (booking_id);

-- ── Tours ─────────────────────────────────────────────────
create table if not exists public.tours (
  id text primary key,
  slug text not null unique,
  title text not null,
  short_title text not null,
  category text not null,
  group_size text,
  duration text not null,
  duration_hours numeric(6,2) not null default 5,
  price_adult numeric(12,2) not null default 0,
  price_child numeric(12,2) not null default 0,
  currency text not null default 'EUR',
  rating numeric(4,2) not null default 9,
  review_count int not null default 0,
  image text not null,
  gallery jsonb not null default '[]'::jsonb,
  summary text not null default '',
  description text not null default '',
  highlights jsonb not null default '[]'::jsonb,
  places jsonb not null default '[]'::jsonb,
  included jsonb not null default '[]'::jsonb,
  not_included jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  cancellation_policy text not null default '',
  max_group int,
  languages jsonb not null default '[]'::jsonb,
  allow_pay_on_day boolean not null default false,
  allow_card boolean not null default true,
  allow_bizum boolean not null default true,
  cruise_friendly boolean not null default false,
  featured boolean not null default false
);

-- ── Transfers ─────────────────────────────────────────────
create table if not exists public.transfer_destinations (
  id text primary key,
  name text not null,
  slug text not null unique,
  price_one_way numeric(12,2) not null default 0,
  price_return numeric(12,2) not null default 0,
  duration text not null default '',
  distance text not null default ''
);

create table if not exists public.transfer_meta (
  id int primary key default 1 check (id = 1),
  highlights jsonb not null default '[]'::jsonb
);

-- ── Blog ──────────────────────────────────────────────────
create table if not exists public.blog_posts (
  slug text primary key,
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  image text not null default '',
  date date not null,
  author text not null default '',
  tags jsonb not null default '[]'::jsonb
);

-- ── Settings (singleton) ──────────────────────────────────
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ── Contact messages ──────────────────────────────────────
create table if not exists public.contact_messages (
  id text primary key,
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  message text not null
);

-- ── Cruise calendar ───────────────────────────────────────
create table if not exists public.cruise_calendar_meta (
  id int primary key default 1 check (id = 1),
  season text,
  port text,
  source text,
  updated_at timestamptz
);

create table if not exists public.cruise_calls (
  id text primary key,
  date date not null,
  port text not null,
  company text not null,
  ship_code text not null default '',
  ship_name text not null,
  arrival_time text not null default '',
  departure_time text not null default '',
  season text not null default '',
  published boolean not null default true,
  notes text
);

create index if not exists cruise_calls_date_idx on public.cruise_calls (date);

-- ── Cruise itineraries ────────────────────────────────────
create table if not exists public.cruise_companies (
  slug text primary key,
  name text not null,
  sailing_count int not null default 0,
  ships jsonb not null default '[]'::jsonb
);

create table if not exists public.cruise_shore_tours (
  id text primary key,
  data jsonb not null
);

create table if not exists public.cruise_sailings (
  id text primary key,
  company_slug text not null references public.cruise_companies(slug) on delete cascade,
  company_name text not null,
  ship_slug text not null,
  ship_name text not null,
  departure_date date not null,
  nights int,
  stops jsonb not null default '[]'::jsonb
);

create index if not exists cruise_sailings_company_idx on public.cruise_sailings (company_slug);
create index if not exists cruise_sailings_departure_idx on public.cruise_sailings (departure_date);

create table if not exists public.cruise_itineraries_meta (
  id int primary key default 1 check (id = 1),
  updated_at timestamptz,
  source text
);

-- ── Admin extras ──────────────────────────────────────────
create table if not exists public.payment_links (
  id text primary key,
  data jsonb not null
);

create table if not exists public.collaborators (
  id text primary key,
  data jsonb not null
);

create table if not exists public.customer_feedback (
  id text primary key,
  data jsonb not null
);

create table if not exists public.cruise_ports (
  id text primary key,
  data jsonb not null
);

create table if not exists public.cruise_groups (
  id text primary key,
  data jsonb not null
);

create table if not exists public.seo_redirects (
  id text primary key,
  data jsonb not null
);

-- ── UI + content translations ─────────────────────────────
create table if not exists public.ui_translation_overrides (
  locale text not null check (locale in ('en', 'de')),
  data jsonb not null default '{}'::jsonb,
  primary key (locale)
);

create table if not exists public.content_translations (
  locale text not null check (locale in ('en', 'de')),
  data jsonb not null,
  primary key (locale)
);

-- ── Admin auth helper (password gate for API) ─────────────
-- Prefer Supabase Auth; this table is optional for simple password check.
create table if not exists public.admin_config (
  id int primary key default 1 check (id = 1),
  password_hash text
);

-- ── Storage bucket (run in dashboard or via API) ──────────
-- insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true);

-- ── RLS: service role bypasses; anon can read public CMS ──
alter table public.tours enable row level security;
alter table public.transfer_destinations enable row level security;
alter table public.transfer_meta enable row level security;
alter table public.blog_posts enable row level security;
alter table public.site_settings enable row level security;
alter table public.cruise_calls enable row level security;
alter table public.cruise_calendar_meta enable row level security;
alter table public.cruise_companies enable row level security;
alter table public.cruise_shore_tours enable row level security;
alter table public.cruise_sailings enable row level security;
alter table public.cruise_itineraries_meta enable row level security;
alter table public.content_translations enable row level security;
alter table public.bookings enable row level security;
alter table public.invoices enable row level security;
alter table public.contact_messages enable row level security;
alter table public.payment_links enable row level security;
alter table public.collaborators enable row level security;
alter table public.customer_feedback enable row level security;
alter table public.cruise_ports enable row level security;
alter table public.cruise_groups enable row level security;
alter table public.seo_redirects enable row level security;
alter table public.ui_translation_overrides enable row level security;

-- Public read for CMS
create policy "Public read tours" on public.tours for select using (true);
create policy "Public read transfers" on public.transfer_destinations for select using (true);
create policy "Public read transfer_meta" on public.transfer_meta for select using (true);
create policy "Public read blog" on public.blog_posts for select using (true);
create policy "Public read settings" on public.site_settings for select using (true);
create policy "Public read cruise_calls" on public.cruise_calls for select using (true);
create policy "Public read cruise_calendar_meta" on public.cruise_calendar_meta for select using (true);
create policy "Public read cruise_companies" on public.cruise_companies for select using (true);
create policy "Public read shore_tours" on public.cruise_shore_tours for select using (true);
create policy "Public read sailings" on public.cruise_sailings for select using (true);
create policy "Public read itineraries_meta" on public.cruise_itineraries_meta for select using (true);
create policy "Public read content_translations" on public.content_translations for select using (true);

-- Public can insert bookings / contact (service role used from API for full access)
create policy "Public insert bookings" on public.bookings for insert with check (true);
create policy "Public select own booking by id" on public.bookings for select using (true);
create policy "Public update bookings cancel" on public.bookings for update using (true);
create policy "Public insert contact" on public.contact_messages for insert with check (true);
create policy "Public insert invoices" on public.invoices for insert with check (true);
create policy "Public select invoices" on public.invoices for select using (true);
