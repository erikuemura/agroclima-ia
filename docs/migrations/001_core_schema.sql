-- CampoClima — Schema núcleo (Supabase/Postgres)
-- Migration preparada para quando a persistência real substituir o localStorage.
-- As entidades espelham os tipos de src/lib/stores.ts e src/types/index.ts.

create table if not exists farms (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  city        text not null,
  state       char(2) not null,
  lat         double precision not null,
  lon         double precision not null,
  hectares    numeric not null,
  created_at  timestamptz default now()
);

create table if not exists crops (
  id            uuid primary key default gen_random_uuid(),
  farm_id       uuid not null references farms(id) on delete cascade,
  name          text not null,
  variety       text,
  field         text not null,           -- talhão
  hectares      numeric not null,
  planted_at    date not null,
  harvest_at    date,
  phase         text not null,
  phase_percent int default 0,
  status        text check (status in ('normal','attention','critical')) default 'normal'
);

-- Diário de campo (FieldView/Solinftec-like)
create table if not exists diary_events (
  id            uuid primary key default gen_random_uuid(),
  farm_id       uuid not null references farms(id) on delete cascade,
  type          text check (type in ('plantio','pulverização','adubação','irrigação','colheita','monitoramento','outro')),
  date          date not null,
  field         text not null,
  operator      text,
  machine       text,
  notes         text,
  stock_item_id uuid references stock_items(id),
  stock_qty     numeric,
  created_at    timestamptz default now()
);
create index on diary_events (farm_id, field, date desc);

-- Estoque de insumos
create table if not exists stock_items (
  id           uuid primary key default gen_random_uuid(),
  farm_id      uuid not null references farms(id) on delete cascade,
  name         text not null,
  category     text check (category in ('semente','fertilizante','defensivo','combustível','outro')),
  unit         text not null,
  quantity     numeric not null default 0,
  min_quantity numeric not null default 0,
  expires_at   date,
  supplier     text,
  lot          text
);

create table if not exists stock_movements (
  id        uuid primary key default gen_random_uuid(),
  item_id   uuid not null references stock_items(id) on delete cascade,
  kind      text check (kind in ('entrada','aplicação','perda','transferência')),
  quantity  numeric not null,
  date      date not null default current_date,
  notes     text
);

-- Planejamento de safra (Aegro-like)
create table if not exists season_plans (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references farms(id) on delete cascade,
  crop_name         text not null,
  variety           text,
  area_ha           numeric not null,
  expected_yield_sc numeric not null,
  budget            jsonb not null default '{}'::jsonb  -- {categoria: valor}
);

-- Lançamentos de custo (Financeiro)
create table if not exists cost_entries (
  id       uuid primary key default gen_random_uuid(),
  farm_id  uuid not null references farms(id) on delete cascade,
  field    text not null,
  item     text not null,
  value    numeric not null,
  date     date not null default current_date
);

-- Preço-alvo de mercado
create table if not exists price_targets (
  id        uuid primary key default gen_random_uuid(),
  farm_id   uuid not null references farms(id) on delete cascade,
  commodity text check (commodity in ('soja','milho','boi')),
  target    numeric not null,
  hit_at    timestamptz
);

-- Comunidade
create table if not exists community_posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references auth.users(id) on delete cascade,
  city       text not null,
  state      char(2) not null,
  category   text check (category in ('praga','doença','clima','mercado','geral')),
  text       text not null,
  created_at timestamptz default now()
);
create index on community_posts (state, category, created_at desc);

create table if not exists post_likes (
  post_id uuid references community_posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (post_id, user_id)
);

create table if not exists post_comments (
  id        uuid primary key default gen_random_uuid(),
  post_id   uuid not null references community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  text      text not null,
  created_at timestamptz default now()
);

-- Modo consultor
create table if not exists consultant_links (
  consultant_id uuid references auth.users(id) on delete cascade,
  farm_id       uuid references farms(id) on delete cascade,
  primary key (consultant_id, farm_id)
);

create table if not exists consultant_recommendations (
  id            uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references auth.users(id),
  farm_id       uuid not null references farms(id) on delete cascade,
  text          text not null,
  created_at    timestamptz default now()
);

-- Insights persistidos (histórico/auditoria do intelligence layer)
create table if not exists insights_log (
  id         uuid primary key default gen_random_uuid(),
  farm_id    uuid not null references farms(id) on delete cascade,
  category   text not null,
  priority   smallint not null,
  severity   text not null,
  title      text not null,
  payload    jsonb not null,
  created_at timestamptz default now()
);

-- RLS básica (exemplo — ajustar políticas por perfil)
alter table farms enable row level security;
create policy "owner_all" on farms for all using (owner_id = auth.uid());
