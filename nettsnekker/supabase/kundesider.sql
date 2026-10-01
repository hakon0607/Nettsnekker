-- =====================================================================
--  FELLES DATABASE FOR ALLE KUNDENETTSIDER
--  Kjøres i et EGET Supabase-prosjekt (f.eks. «nettsnekker-kunder»),
--  ikke i Nettsnekker-prosjektet. Alle kundesider deler denne databasen,
--  og hver rad har en site_id så kundene aldri ser hverandres data.
--  Trygg å kjøre flere ganger.
-- =====================================================================

create extension if not exists pgcrypto;

-- Én rad per kundenettside
create table if not exists public.sites (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,          -- f.eks. «klipp-og-kroll»
  navn       text not null,
  ordrenr    text default '',               -- kobling til bestillingen i Nettsnekker
  aktiv      boolean not null default true,
  created_at timestamptz not null default now()
);

-- Hvem kan logge inn på /admin for hvilken side
create table if not exists public.site_admins (
  site_id    uuid not null references public.sites(id) on delete cascade,
  email      text not null,
  rolle      text not null default 'eier',  -- eier | ansatt
  created_at timestamptz not null default now(),
  primary key (site_id, email)
);

create or replace function public.er_site_admin(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.site_admins a
    where a.site_id = sid and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Redigerbart innhold: tekster, priser, åpningstider osv. (nøkkel → JSON)
create table if not exists public.site_innhold (
  site_id    uuid not null references public.sites(id) on delete cascade,
  nokkel     text not null,
  verdi      jsonb,
  updated_at timestamptz not null default now(),
  primary key (site_id, nokkel)
);

-- Lister: produkter, tjenester, ansatte, galleri, nyheter … (type skiller dem)
create table if not exists public.site_elementer (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid not null references public.sites(id) on delete cascade,
  type       text not null,                 -- produkt | tjeneste | ansatt | bilde | nyhet | tilbud …
  data       jsonb not null default '{}'::jsonb,
  synlig     boolean not null default true,
  sort       int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists site_elementer_idx on public.site_elementer (site_id, type, sort);

-- Det besøkende sender inn: bestillinger, timebestillinger, kontaktskjema
create table if not exists public.site_innsendt (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid not null references public.sites(id) on delete cascade,
  type       text not null,                 -- melding | bestilling | booking
  data       jsonb not null default '{}'::jsonb,
  status     text not null default 'ny',    -- ny | behandlet | ferdig | avlyst
  created_at timestamptz not null default now()
);
create index if not exists site_innsendt_idx on public.site_innsendt (site_id, type, created_at desc);

-- ---------------------------------------------------------------------
--  Sikkerhet
-- ---------------------------------------------------------------------
alter table public.sites          enable row level security;
alter table public.site_admins    enable row level security;
alter table public.site_innhold   enable row level security;
alter table public.site_elementer enable row level security;
alter table public.site_innsendt  enable row level security;

-- Alle kan lese aktive sider og synlig innhold
drop policy if exists "les_sites" on public.sites;
create policy "les_sites" on public.sites for select using (aktiv);

drop policy if exists "les_innhold" on public.site_innhold;
create policy "les_innhold" on public.site_innhold for select using (true);

drop policy if exists "les_elementer" on public.site_elementer;
create policy "les_elementer" on public.site_elementer for select using (synlig or public.er_site_admin(site_id));

-- Site-admins kan endre sitt eget innhold
drop policy if exists "admin_innhold" on public.site_innhold;
create policy "admin_innhold" on public.site_innhold for all to authenticated
  using (public.er_site_admin(site_id)) with check (public.er_site_admin(site_id));

drop policy if exists "admin_elementer" on public.site_elementer;
create policy "admin_elementer" on public.site_elementer for all to authenticated
  using (public.er_site_admin(site_id)) with check (public.er_site_admin(site_id));

-- Besøkende kan sende inn (men ikke lese). Site-admins ser og behandler.
drop policy if exists "send_inn" on public.site_innsendt;
create policy "send_inn" on public.site_innsendt for insert with check (true);

drop policy if exists "admin_innsendt" on public.site_innsendt;
create policy "admin_innsendt" on public.site_innsendt for all to authenticated
  using (public.er_site_admin(site_id)) with check (public.er_site_admin(site_id));

-- Site-admins ser hvem som har tilgang til sin side
drop policy if exists "les_egne_admins" on public.site_admins;
create policy "les_egne_admins" on public.site_admins for select to authenticated using (public.er_site_admin(site_id));

-- ---------------------------------------------------------------------
--  Bilder: én offentlig bøtte, mappe per side (site_id/...)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('kundesider', 'kundesider', true)
on conflict (id) do nothing;

drop policy if exists "kunde_bilder_skriv" on storage.objects;
create policy "kunde_bilder_skriv" on storage.objects for all to authenticated
  using (bucket_id = 'kundesider' and public.er_site_admin(((storage.foldername(name))[1])::uuid))
  with check (bucket_id = 'kundesider' and public.er_site_admin(((storage.foldername(name))[1])::uuid));

-- ---------------------------------------------------------------------
--  NY KUNDE: lag siden og gi kunden tilgang (bytt ut verdiene)
-- ---------------------------------------------------------------------
-- insert into public.sites (slug, navn, ordrenr) values ('klipp-og-kroll', 'Klipp & Krøll', 'NS-1001') returning id;
-- insert into public.site_admins (site_id, email) values ('<id fra linjen over>', 'kunde@epost.no');
