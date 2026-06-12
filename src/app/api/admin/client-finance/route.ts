import { NextResponse } from 'next/server'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { DEMO_PROFILES } from '@/lib/demo-profiles'
import { getSubscriptions, findSubscriptionByEmail, subscriptionHealth, type PaymentHealth } from '@/lib/admin-finance'

export interface ClientFinanceRow {
  userId: string
  name: string
  email: string
  plan: string
  amount: number
  health: PaymentHealth
  nextPayment: string | null
  since: string | null
  impersonateProfile: string | null
}

// Visão financeira por cliente: usuários × assinaturas (match por e-mail)
export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) return unauthorized()

  const { source, subscriptions } = await getSubscriptions()

  // Base de clientes: demo + Supabase (quando configurado)
  const clients: { id: string; name: string; email: string; impersonateProfile: string | null }[] =
    Object.values(DEMO_PROFILES).map(p => ({
      id: `demo-${p.id}`, name: p.label, email: p.email, impersonateProfile: p.id,
    }))

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && serviceKey) {
    try {
      const res = await fetch(`${url}/auth/v1/admin/users?per_page=100`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        const data = await res.json()
        for (const u of data.users ?? []) {
          if (!u.email) continue
          clients.push({
            id: u.id,
            name: u.user_metadata?.full_name ?? u.email.split('@')[0],
            email: u.email,
            impersonateProfile: 'medio',
          })
        }
      }
    } catch { /* segue só com demo */ }
  }

  const knownEmails = new Set(clients.map(c => c.email.toLowerCase()))

  const rows: ClientFinanceRow[] = clients.map(c => {
    const sub = findSubscriptionByEmail(subscriptions, c.email)
    return {
      userId: c.id,
      name: c.name,
      email: c.email,
      plan: sub?.reason ?? 'Gratuito',
      amount: sub?.amount ?? 0,
      health: subscriptionHealth(sub),
      nextPayment: sub?.nextPayment ?? null,
      since: sub?.createdAt ?? null,
      impersonateProfile: c.impersonateProfile,
    }
  })

  // Assinantes sem conta correspondente (e-mail diferente do cadastro)
  for (const sub of subscriptions) {
    if (knownEmails.has(sub.payerEmail.toLowerCase())) continue
    rows.push({
      userId: `sub-${sub.id}`,
      name: sub.payerEmail.split('@')[0],
      email: sub.payerEmail,
      plan: sub.reason,
      amount: sub.amount,
      health: subscriptionHealth(sub),
      nextPayment: sub.nextPayment,
      since: sub.createdAt,
      impersonateProfile: null,
    })
  }

  const order: PaymentHealth[] = ['atrasado', 'em_dia', 'cancelado', 'sem_assinatura']
  rows.sort((a, b) => order.indexOf(a.health) - order.indexOf(b.health))

  return NextResponse.json({ source, rows })
}
