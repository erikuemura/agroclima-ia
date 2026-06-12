import { NextResponse } from 'next/server'
import { adminToken, ADMIN_COOKIE } from '@/lib/admin-auth'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  // Proteção contra brute-force
  const limited = rateLimit(req, { key: 'admin-login', limit: 5, windowMs: 60_000 })
  if (limited) return limited

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Backoffice não configurado (ADMIN_PASSWORD ausente)' }, { status: 503 })
  }

  const { username, password } = await req.json().catch(() => ({}))
  const expectedUser = process.env.ADMIN_USER ?? 'Admin'
  if (username !== expectedUser || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Usuário ou senha incorretos' }, { status: 401 })
  }

  const token = await adminToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8h de sessão
  })
  return res
}
