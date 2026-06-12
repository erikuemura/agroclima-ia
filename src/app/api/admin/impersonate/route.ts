import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { DEMO_PROFILES, type DemoProfileId } from '@/lib/demo-profiles'

// "Ver como usuário": assume o painel do cliente para suporte.
// Define o cookie de perfil + flag de impersonation e redireciona ao /app.
export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.redirect(new URL('/backoffice/login', req.url))
  }

  const { searchParams } = new URL(req.url)
  const profile = searchParams.get('profile') as DemoProfileId | null
  if (!profile || !DEMO_PROFILES[profile]) {
    return NextResponse.json({ error: 'Perfil inválido' }, { status: 400 })
  }

  const res = NextResponse.redirect(new URL('/app', req.url))
  res.cookies.set('demo_profile', profile, { path: '/', maxAge: 60 * 60 * 4 })
  res.cookies.set('admin_impersonating', '1', { path: '/', maxAge: 60 * 60 * 4 })
  return res
}

// Encerra a impersonation e volta ao backoffice
export async function DELETE(req: Request) {
  const res = NextResponse.json({ ok: true })
  void req
  res.cookies.set('demo_profile', '', { path: '/', maxAge: 0 })
  res.cookies.set('admin_impersonating', '', { path: '/', maxAge: 0 })
  return res
}
