-- =====================================================================
--  NETTSNEKKER – kjør hele filen i Supabase → SQL Editor → Run.
--  Trygg å kjøre flere ganger.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
--  Hvem er admin? Legg inn din egen e-post (se nederst).
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  email      text primary key,
  navn       text default '',
  created_at timestamptz not null default now()
);

create or replace function public.er_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------------------------------------------------------------------
--  Innstillinger: priser, tekster, FAQ, vilkår osv. (JSON per nøkkel)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  key        text primary key,
  value      jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  Bestillinger
-- ---------------------------------------------------------------------
create sequence if not exists public.ordrenr_seq start 1001;

create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  ordrenr            text not null unique default ('NS-' || nextval('public.ordrenr_seq')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- venter_gebyr | ny | under_arbeid | utkast_sendt | endringer | godkjent | live | levert | avbrutt
  status             text not null default 'venter_gebyr',

  -- kunden
  kunde_navn         text not null,
  kunde_epost        text not null,
  kunde_telefon      text default '',
  kommentar          text default '',

  -- bedriften og ønskene
  bedrift_navn       text not null,
  orgnr              text default '',
  bransje            text default '',
  beskrivelse        text default '',
  mal                text[] default '{}',
  malgruppe          text default '',
  eksisterende_side  text default '',
  inspirasjon        text default '',
  tema               jsonb default '{}'::jsonb,   -- { id, navn, farger, egenFarge, stil, mork }
  sider              text[] default '{}',
  egne_sider         text default '',
  funksjoner         text[] default '{}',
  tillegg            jsonb default '{}'::jsonb,   -- { id: antall }
  onsker             text default '',
  admin_valgt        boolean not null default false,
  admin_onsker       text default '',
  domene_valg        text default 'ingen',        -- nytt | eget | ingen
  domene             text default '',
  domene_aar         int default 1,
  domene_pris_nok    int default 0,
  domene_fornyelse_nok int default 0,
  filer              jsonb default '[]'::jsonb,   -- [{ path, navn, type, storrelse, kategori }]

  -- pris
  pris_linjer        jsonb default '[]'::jsonb,
  gebyr              int not null default 0,
  rest               int not null default 0,
  total              int not null default 0,
  rabatt             int not null default 0,

  -- betaling
  gebyr_betalt       boolean not null default false,
  gebyr_betalt_at    timestamptz,
  gebyr_session_id   text default '',
  rest_betalt        boolean not null default false,
  rest_betalt_at     timestamptz,
  rest_lenke         text default '',
  rest_lenke_id      text default '',

  -- arbeidet
  utkast_url         text default '',
  live_url           text default '',
  github_repo        text default '',
  endringsrunder_brukt int not null default 0,
  ai_brief           text default '',
  claude_prompt      text default '',
  notater            text default '',
  hosting_fornyes    date,
  domene_fornyes     date,
  vilkar_godtatt_at  timestamptz,
  bekreftelse_sendt  boolean not null default false
);

alter table public.orders add column if not exists rabatt int not null default 0;

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

-- Hendelseslogg per bestilling (statusendringer, betalinger osv.)
create table if not exists public.order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  hva        text not null,
  detalj     text default '',
  created_at timestamptz not null default now()
);
create index if not exists order_events_idx on public.order_events (order_id, created_at desc);

-- ---------------------------------------------------------------------
--  E-post: maler og alt som er sendt
-- ---------------------------------------------------------------------
create table if not exists public.email_templates (
  key         text primary key,
  navn        text not null,
  beskrivelse text default '',
  emne        text not null,
  innhold     text not null,
  automatisk  boolean not null default false,
  sort        int not null default 100,
  updated_at  timestamptz not null default now()
);

create table if not exists public.sent_emails (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid references public.orders(id) on delete set null,
  mal        text default '',
  til        text not null,
  emne       text not null,
  html       text default '',
  ok         boolean not null default true,
  feil       text default '',
  sendt_av   text default '',
  created_at timestamptz not null default now()
);
create index if not exists sent_emails_order_idx on public.sent_emails (order_id, created_at desc);
create index if not exists sent_emails_created_idx on public.sent_emails (created_at desc);

-- ---------------------------------------------------------------------
--  Sikkerhet: kunder kan ikke lese noe. Alt skrives via serveren.
--  Innloggede admins får full tilgang.
-- ---------------------------------------------------------------------
alter table public.admins          enable row level security;
alter table public.settings        enable row level security;
alter table public.orders          enable row level security;
alter table public.order_events    enable row level security;
alter table public.email_templates enable row level security;
alter table public.sent_emails     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['admins','settings','orders','order_events','email_templates','sent_emails'] loop
    execute format('drop policy if exists "admin_alt" on public.%I', t);
    execute format('create policy "admin_alt" on public.%I for all to authenticated using (public.er_admin()) with check (public.er_admin())', t);
  end loop;
end $$;

-- Sanntid i adminpanelet
do $$
begin
  begin execute 'alter publication supabase_realtime add table public.orders'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.sent_emails'; exception when others then null; end;
end $$;

-- ---------------------------------------------------------------------
--  Lagring av filer kunden laster opp (privat bøtte)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('bestillinger', 'bestillinger', false, 15728640)
on conflict (id) do nothing;

drop policy if exists "admin_les_filer" on storage.objects;
create policy "admin_les_filer" on storage.objects
  for select to authenticated using (bucket_id = 'bestillinger' and public.er_admin());

drop policy if exists "admin_slett_filer" on storage.objects;
create policy "admin_slett_filer" on storage.objects
  for delete to authenticated using (bucket_id = 'bestillinger' and public.er_admin());

-- Bilder til eksempler på forsiden (offentlig bøtte)
insert into storage.buckets (id, name, public) values ('offentlig', 'offentlig', true)
on conflict (id) do nothing;

drop policy if exists "admin_skriv_offentlig" on storage.objects;
create policy "admin_skriv_offentlig" on storage.objects
  for all to authenticated using (bucket_id = 'offentlig' and public.er_admin())
  with check (bucket_id = 'offentlig' and public.er_admin());

-- ---------------------------------------------------------------------
--  LEGG INN DEG SELV SOM ADMIN – bytt ut e-posten og kjør denne linjen
-- ---------------------------------------------------------------------
-- insert into public.admins (email, navn) values ('din@epost.no', 'Håkon') on conflict do nothing;
