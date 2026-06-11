-- AgroClima IA — Schema Supabase
-- Execute no SQL Editor do painel Supabase

-- Habilitar RLS em todas as tabelas
-- Cada usuário vê apenas os dados das suas fazendas

-- ============================================================
-- Fazendas
-- ============================================================
create table if not exists farms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  city text not null,
  state text not null,
  lat double precision not null,
  lon double precision not null,
  hectares integer not null default 0,
  created_at timestamptz default now()
);

alter table farms enable row level security;
create policy "users see own farms" on farms for all using (auth.uid() = user_id);

-- ============================================================
-- Talhões
-- ============================================================
create table if not exists fields (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms(id) on delete cascade not null,
  name text not null,
  hectares integer not null,
  soil_type text,
  coordinates jsonb, -- [[lat,lon], ...]
  ndvi double precision default 0,
  ndvi_status text default 'normal',
  created_at timestamptz default now()
);

alter table fields enable row level security;
create policy "users see own fields" on fields for all
  using (farm_id in (select id from farms where user_id = auth.uid()));

-- ============================================================
-- Culturas
-- ============================================================
create table if not exists crops (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms(id) on delete cascade not null,
  field_id uuid references fields(id) on delete set null,
  name text not null,
  variety text,
  emoji text default '🌱',
  hectares integer not null,
  planted_at date not null,
  harvest_at date not null,
  phase text not null,
  phase_percent integer default 0,
  status text default 'normal',
  expected_yield integer default 0,
  notes text,
  season text,
  created_at timestamptz default now()
);

alter table crops enable row level security;
create policy "users see own crops" on crops for all
  using (farm_id in (select id from farms where user_id = auth.uid()));

-- ============================================================
-- Registros de pulverização
-- ============================================================
create table if not exists spray_records (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms(id) on delete cascade not null,
  field_name text,
  crop_name text,
  product text not null,
  dose text,
  area_ha integer,
  target text,
  applied_at date not null default current_date,
  created_at timestamptz default now()
);

alter table spray_records enable row level security;
create policy "users see own spray records" on spray_records for all
  using (farm_id in (select id from farms where user_id = auth.uid()));

-- ============================================================
-- Registros de irrigação
-- ============================================================
create table if not exists irrigation_records (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms(id) on delete cascade not null,
  field_name text,
  lamina_mm integer not null,
  method text,
  applied_at date not null default current_date,
  created_at timestamptz default now()
);

alter table irrigation_records enable row level security;
create policy "users see own irrigation records" on irrigation_records for all
  using (farm_id in (select id from farms where user_id = auth.uid()));

-- ============================================================
-- Eventos do calendário
-- ============================================================
create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms(id) on delete cascade not null,
  title text not null,
  event_date date not null,
  event_type text not null,
  crop_name text,
  field_name text,
  done boolean default false,
  ai_generated boolean default false,
  created_at timestamptz default now()
);

alter table calendar_events enable row level security;
create policy "users see own events" on calendar_events for all
  using (farm_id in (select id from farms where user_id = auth.uid()));
