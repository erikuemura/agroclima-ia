-- CampoClima — Telemetria do backoffice
-- Eventos de uso de IA, atividade no app e webhooks do Mercado Pago.
-- Habilita o histórico persistente da aba Atividade do backoffice:
-- basta criar esta tabela e definir SUPABASE_SERVICE_ROLE_KEY no Vercel.

create table if not exists backoffice_events (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('ai_usage', 'app_activity', 'mp_webhook')),
  profile    text not null,           -- id do perfil/cliente ou e-mail (mp_webhook)
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index on backoffice_events (type, created_at desc);
create index on backoffice_events (profile, created_at desc);

-- Tabela interna: sem acesso anon/authenticated (somente service role)
alter table backoffice_events enable row level security;

-- Retenção sugerida (rodar via pg_cron ou manualmente):
-- delete from backoffice_events where created_at < now() - interval '90 days';
