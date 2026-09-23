-- Lanzarote Hub — numeración compartida + grupos de crucero
-- Ejecutar UNA vez en el Supabase que usarán las tres webs (HUB_SUPABASE_*).

create table if not exists public.hub_sequences (
  key text primary key,
  last_value integer not null
);

create or replace function public.hub_next_number(
  p_key text,
  p_min_next integer default 1001
)
returns integer
language plpgsql
as $$
declare
  v integer;
begin
  if p_min_next < 1 then
    p_min_next := 1;
  end if;

  insert into public.hub_sequences (key, last_value)
  values (p_key, p_min_next)
  on conflict (key) do update
    set last_value = greatest(public.hub_sequences.last_value + 1, excluded.last_value)
  returning last_value into v;

  return v;
end;
$$;

create table if not exists public.hub_bookings (
  site_id text not null,
  id text not null,
  site_label text not null,
  group_id text,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (site_id, id)
);

create index if not exists hub_bookings_group_id_idx
  on public.hub_bookings (group_id);

create table if not exists public.hub_cruise_groups (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.hub_sequences enable row level security;
alter table public.hub_bookings enable row level security;
alter table public.hub_cruise_groups enable row level security;

create or replace function public.hub_raise_floor(p_key text, p_last integer)
returns integer
language plpgsql
as $$
declare
  v integer;
begin
  if p_last < 0 then
    p_last := 0;
  end if;

  insert into public.hub_sequences (key, last_value)
  values (p_key, p_last)
  on conflict (key) do update
    set last_value = greatest(public.hub_sequences.last_value, excluded.last_value)
  returning last_value into v;

  return v;
end;
$$;

grant execute on function public.hub_next_number(text, integer) to service_role;
grant execute on function public.hub_raise_floor(text, integer) to service_role;
grant all on table public.hub_sequences to service_role;
grant all on table public.hub_bookings to service_role;
grant all on table public.hub_cruise_groups to service_role;
