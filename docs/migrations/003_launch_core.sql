-- CampoClima — Núcleo de lançamento: fazendas reais + assinaturas
-- APLICAR ANTES DO LANÇAMENTO no SQL Editor do Supabase.
-- Pré-requisito das envs no Vercel: NEXT_PUBLIC_SUPABASE_URL,
-- NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.

-- ── Fazendas do usuário ──────────────────────────────────────
create table if not exists farms (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  city        text not null,
  state       char(2) not null,
  lat         double precision not null,
  lon         double precision not null,
  hectares    numeric not null,
  created_at  timestamptz not null default now()
);

alter table farms enable row level security;
drop policy if exists "farms_owner_all" on farms;
create policy "farms_owner_all" on farms
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ── Culturas ─────────────────────────────────────────────────
create table if not exists crops (
  id            uuid primary key default gen_random_uuid(),
  farm_id       uuid not null references farms(id) on delete cascade,
  name          text not null,
  variety       text,
  field         text not null,
  hectares      numeric not null,
  planted_at    date not null,
  harvest_at    date,
  expected_yield numeric default 60,
  created_at    timestamptz not null default now()
);

alter table crops enable row level security;
drop policy if exists "crops_owner_all" on crops;
create policy "crops_owner_all" on crops
  for all using (exists (select 1 from farms f where f.id = farm_id and f.owner_id = auth.uid()))
  with check (exists (select 1 from farms f where f.id = farm_id and f.owner_id = auth.uid()));

-- ── Assinaturas (sincronizadas pelo webhook do Mercado Pago) ─
create table if not exists subscriptions (
  mp_subscription_id text primary key,
  payer_email        text not null,
  plan_id            text,
  status             text,            -- authorized | paused | cancelled | pending
  amount             numeric,
  next_payment       date,
  last_payment_at    timestamptz,
  updated_at         timestamptz not null default now()
);
create index if not exists subscriptions_email_idx on subscriptions (payer_email);

-- Somente service role acessa (sem policies = anon/authenticated bloqueados)
alter table subscriptions enable row level security;
