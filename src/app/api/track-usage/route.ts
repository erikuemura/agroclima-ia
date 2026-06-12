import { NextResponse } from 'next/server'
import { getDemoProfileFromCookie } from '@/lib/demo-profiles'
import { recordEvent } from '@/lib/server-events'
import { rateLimit } from '@/lib/rate-limit'

// Heartbeat de engajamento: o app reporta a página visitada (1× por navegação).
// Alimenta "último acesso" e "módulos usados" no backoffice.
export async function POST(req: Request) {
  const limited = rateLimit(req, { key: 'track', limit: 60, windowMs: 60_000 })
  if (limited) return limited

  const profile = getDemoProfileFromCookie(req.headers.get('cookie') ?? '')
  const { path } = await req.json().catch(() => ({ path: null }))
  if (typeof path !== 'string' || !path.startsWith('/') || path.length > 100) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  recordEvent('app_activity', profile.id, { path })
  return NextResponse.json({ ok: true })
}
