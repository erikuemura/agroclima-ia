import { NextResponse } from 'next/server'

// Sliding-window rate limiter em memória (por instância serverless).
// Suficiente como barreira de custo para as rotas de IA; para limite
// global entre instâncias, trocar por Upstash/Vercel KV.
const hits = new Map<string, number[]>()

const MAX_KEYS = 5000

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  return fwd?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
}

export function rateLimit(
  req: Request,
  { limit = 20, windowMs = 60_000, key = 'global' }: { limit?: number; windowMs?: number; key?: string } = {}
): NextResponse | null {
  const now = Date.now()
  const id = `${key}:${clientIp(req)}`

  if (hits.size > MAX_KEYS) hits.clear()

  const windowHits = (hits.get(id) ?? []).filter(t => now - t < windowMs)
  if (windowHits.length >= limit) {
    return NextResponse.json(
      { error: 'Muitas requisições. Aguarde um instante e tente novamente.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(windowMs / 1000)) } }
    )
  }
  windowHits.push(now)
  hits.set(id, windowHits)
  return null
}
