import { NextResponse } from 'next/server'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { DEMO_PROFILES } from '@/lib/demo-profiles'

export interface AdminUser {
  id: string
  kind: 'demo' | 'supabase'
  name: string
  email: string
  plan: string
  farm: string
  location: string
  hectares: number | null
  lastSignIn: string | null
  createdAt: string | null
  impersonateProfile: string | null // perfil demo usado para "ver como usuário"
}

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) return unauthorized()

  const users: AdminUser[] = Object.values(DEMO_PROFILES).map(p => ({
    id: `demo-${p.id}`,
    kind: 'demo',
    name: p.label,
    email: p.email,
    plan: p.plan,
    farm: p.farm.name,
    location: `${p.farm.city}/${p.farm.state}`,
    hectares: p.farm.hectares,
    lastSignIn: null,
    createdAt: null,
    impersonateProfile: p.id,
  }))

  // Usuários reais do Supabase (requer service role key)
  let supabaseAvailable = false
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && serviceKey) {
    try {
      const res = await fetch(`${url}/auth/v1/admin/users?per_page=100`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        supabaseAvailable = true
        const data = await res.json()
        for (const u of data.users ?? []) {
          users.push({
            id: u.id,
            kind: 'supabase',
            name: u.user_metadata?.full_name ?? u.email?.split('@')[0] ?? '—',
            email: u.email ?? '—',
            plan: 'Gratuito',
            farm: '—',
            location: '—',
            hectares: null,
            lastSignIn: u.last_sign_in_at ?? null,
            createdAt: u.created_at ?? null,
            // sem dados de fazenda persistidos ainda — suporte usa o perfil demo médio
            impersonateProfile: 'medio',
          })
        }
      }
    } catch { /* Supabase fora — segue só com demo */ }
  }

  return NextResponse.json({ users, supabaseAvailable })
}
