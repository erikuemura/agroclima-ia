// ─────────────────────────────────────────────────────────────
// Armazém de eventos do servidor (telemetria do backoffice):
// uso de IA por cliente, atividade no app e webhooks do MP.
//
// Persistência em camadas:
//  1. Ring buffer em memória (rápido; por instância serverless)
//  2. console.log estruturado (consultável nos logs do Vercel)
//  3. Supabase `backoffice_events` quando SUPABASE_SERVICE_ROLE_KEY
//     existir (best-effort, nunca bloqueia a request) —
//     schema em docs/migrations/002_backoffice_events.sql
// ─────────────────────────────────────────────────────────────

export type ServerEventType = 'ai_usage' | 'app_activity' | 'mp_webhook'

export interface ServerEvent {
  type: ServerEventType
  profile: string            // perfil/cliente (ou 'sistema')
  data: Record<string, string | number | boolean | null>
  at: string                 // ISO
}

const MAX_EVENTS = 2000
const buffer: ServerEvent[] = []

function persistToSupabase(event: ServerEvent): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return
  fetch(`${url}/rest/v1/backoffice_events`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ type: event.type, profile: event.profile, data: event.data, created_at: event.at }),
    signal: AbortSignal.timeout(4000),
  }).catch(() => { /* telemetria nunca derruba a request */ })
}

export function recordEvent(type: ServerEventType, profile: string, data: ServerEvent['data']): void {
  const event: ServerEvent = { type, profile, data, at: new Date().toISOString() }
  buffer.push(event)
  if (buffer.length > MAX_EVENTS) buffer.splice(0, buffer.length - MAX_EVENTS)
  console.log(`[event:${type}]`, JSON.stringify({ profile, ...data }))
  persistToSupabase(event)
}

async function fetchFromSupabase(type: ServerEventType, limit: number): Promise<ServerEvent[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  try {
    const res = await fetch(
      `${url}/rest/v1/backoffice_events?type=eq.${type}&order=created_at.desc&limit=${limit}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const rows = await res.json()
    return rows.map((r: { type: ServerEventType; profile: string; data: ServerEvent['data']; created_at: string }) => ({
      type: r.type, profile: r.profile, data: r.data, at: r.created_at,
    }))
  } catch {
    return null
  }
}

// Lê eventos: Supabase quando disponível (visão global), senão o buffer local
export async function queryEvents(type: ServerEventType, limit = 500): Promise<{ events: ServerEvent[]; source: 'supabase' | 'memoria' }> {
  const persisted = await fetchFromSupabase(type, limit)
  if (persisted) return { events: persisted, source: 'supabase' }
  return {
    events: buffer.filter(e => e.type === type).slice(-limit).reverse(),
    source: 'memoria',
  }
}

// ── Custo de IA ──────────────────────────────────────────────
// Preços oficiais por MTok (jun/2026): Haiku 4.5 $1/$5 · Sonnet 4.6 $3/$15
const MODEL_PRICES_USD: Record<string, { input: number; output: number }> = {
  haiku:  { input: 1, output: 5 },
  sonnet: { input: 3, output: 15 },
}
const USD_BRL = 5.5 // estimativa conservadora p/ exibição

// Estimativa: ~4 chars/token em pt-BR; imagem ≈ 1.300 tokens
export function estimateAiCostBRL(model: string, inputChars: number, outputChars: number, hasImage: boolean): number {
  const price = model.includes('sonnet') ? MODEL_PRICES_USD.sonnet : MODEL_PRICES_USD.haiku
  const inputTokens = inputChars / 4 + (hasImage ? 1300 : 0)
  const outputTokens = outputChars / 4
  const usd = (inputTokens * price.input + outputTokens * price.output) / 1_000_000
  return +(usd * USD_BRL).toFixed(4)
}
