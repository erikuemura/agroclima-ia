import { NextResponse } from 'next/server'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { DEMO_PROFILES, type DemoProfileId } from '@/lib/demo-profiles'
import { getSubscriptions, findSubscriptionByEmail, subscriptionHealth } from '@/lib/admin-finance'

// Ficha cadastral completa do cliente + situação financeira
export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) return unauthorized()

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id') ?? ''

  // Contas demo: demo-<profileId>
  if (id.startsWith('demo-')) {
    const profileId = id.replace('demo-', '') as DemoProfileId
    const p = DEMO_PROFILES[profileId]
    if (!p) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

    const { subscriptions } = await getSubscriptions()
    const sub = findSubscriptionByEmail(subscriptions, p.email)

    return NextResponse.json({
      id,
      kind: 'demo',
      name: p.label,
      email: p.email,
      role: p.role,
      description: p.description,
      plan: p.plan,
      farm: {
        name: p.farm.name,
        city: p.farm.city,
        state: p.farm.state,
        lat: p.farm.lat,
        lon: p.farm.lon,
        hectares: p.farm.hectares,
      },
      crops: p.crops.map(c => ({
        name: c.name, field: c.field, hectares: c.hectares,
        phase: c.phase, status: c.status,
        plantedAt: c.plantedAt, harvestAt: c.harvestAt,
      })),
      activeAlerts: p.alerts.length,
      finance: {
        health: subscriptionHealth(sub),
        subscription: sub ?? null,
      },
      impersonateProfile: profileId,
    })
  }

  // Usuários Supabase: busca individual via admin API
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && serviceKey) {
    try {
      const res = await fetch(`${url}/auth/v1/admin/users/${id}`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        const u = await res.json()
        const { subscriptions } = await getSubscriptions()
        const sub = u.email ? findSubscriptionByEmail(subscriptions, u.email) : undefined
        return NextResponse.json({
          id,
          kind: 'supabase',
          name: u.user_metadata?.full_name ?? u.email?.split('@')[0] ?? '—',
          email: u.email ?? '—',
          role: 'Produtor',
          description: null,
          plan: sub ? sub.reason : 'Gratuito',
          farm: null, // fazenda ainda não persistida no banco
          crops: [],
          activeAlerts: null,
          createdAt: u.created_at ?? null,
          lastSignIn: u.last_sign_in_at ?? null,
          emailConfirmed: !!u.email_confirmed_at,
          finance: { health: subscriptionHealth(sub), subscription: sub ?? null },
          impersonateProfile: 'medio',
        })
      }
    } catch { /* cai no 404 */ }
  }

  return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
}
