import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { recordEvent } from '@/lib/server-events'

// Captura de leads da landing (e-mail ou WhatsApp + cidade/UF opcional)
export async function POST(req: Request) {
  const limited = rateLimit(req, { key: 'leads', limit: 5, windowMs: 60_000 })
  if (limited) return limited

  const { contact, city } = await req.json().catch(() => ({}))
  if (typeof contact !== 'string') {
    return NextResponse.json({ error: 'Informe e-mail ou WhatsApp' }, { status: 400 })
  }

  const trimmed = contact.trim()
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)
  const isPhone = /^[\d\s()+-]{10,16}$/.test(trimmed)
  if (!isEmail && !isPhone) {
    return NextResponse.json({ error: 'Informe um e-mail ou WhatsApp válido' }, { status: 400 })
  }
  if (trimmed.length > 80 || (typeof city === 'string' && city.length > 60)) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  recordEvent('lead', 'site', {
    contact: trimmed,
    kind: isEmail ? 'email' : 'whatsapp',
    city: typeof city === 'string' && city.trim() ? city.trim() : null,
  })

  return NextResponse.json({ ok: true })
}
