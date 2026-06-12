// ─────────────────────────────────────────────────────────────
// Gestão financeira do backoffice (server-side).
// Fonte: assinaturas do Mercado Pago (preapproval/search) quando
// MP_ACCESS_TOKEN existe; senão, conjunto demo. O status de
// mensalidade é derivado de status + data da próxima cobrança.
// ─────────────────────────────────────────────────────────────

export interface AdminSubscription {
  id: string
  payerEmail: string
  reason: string
  amount: number
  status: string          // authorized | paused | cancelled | pending
  nextPayment: string | null
  createdAt: string | null
}

export type PaymentHealth = 'em_dia' | 'atrasado' | 'cancelado' | 'sem_assinatura'

export const PAYMENT_HEALTH_META: Record<PaymentHealth, { label: string }> = {
  em_dia:         { label: 'Em dia' },
  atrasado:       { label: 'Atrasado' },
  cancelado:      { label: 'Cancelado' },
  sem_assinatura: { label: 'Sem assinatura' },
}

function daysFromNow(offset: number): string {
  const d = new Date(); d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

// Demo: pequeno em dia · medio atrasado (cobrança vencida) · grande em dia
const DEMO_SUBS: AdminSubscription[] = [
  { id: 'demo-1', payerEmail: 'demo.pequeno@campoclima.com.br', reason: 'Produtor — Mensal', amount: 49, status: 'authorized', nextPayment: daysFromNow(18), createdAt: '2026-03-05' },
  { id: 'demo-2', payerEmail: 'demo.medio@campoclima.com.br', reason: 'Produtor — Mensal', amount: 49, status: 'authorized', nextPayment: daysFromNow(-9), createdAt: '2026-01-12' },
  { id: 'demo-3', payerEmail: 'demo.grande@campoclima.com.br', reason: 'Premium — Mensal (contrato anual)', amount: 129, status: 'authorized', nextPayment: daysFromNow(11), createdAt: '2025-11-01' },
  { id: 'demo-4', payerEmail: 'cancelado@exemplo.com.br', reason: 'Produtor — Mensal', amount: 49, status: 'cancelled', nextPayment: null, createdAt: '2026-02-20' },
]

export async function getSubscriptions(): Promise<{ source: 'mercadopago' | 'demo'; subscriptions: AdminSubscription[] }> {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) return { source: 'demo', subscriptions: DEMO_SUBS }

  try {
    const res = await fetch('https://api.mercadopago.com/preapproval/search?limit=100&sort=date_created:desc', {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`MP ${res.status}`)
    const data = await res.json()
    const subscriptions: AdminSubscription[] = (data.results ?? []).map((s: {
      id: string; payer_email?: string; reason?: string; status?: string
      auto_recurring?: { transaction_amount?: number }
      next_payment_date?: string; date_created?: string
    }) => ({
      id: s.id,
      payerEmail: s.payer_email ?? '—',
      reason: s.reason ?? '—',
      amount: s.auto_recurring?.transaction_amount ?? 0,
      status: s.status ?? 'pending',
      nextPayment: s.next_payment_date?.slice(0, 10) ?? null,
      createdAt: s.date_created?.slice(0, 10) ?? null,
    }))
    if (subscriptions.length === 0) return { source: 'demo', subscriptions: DEMO_SUBS }
    return { source: 'mercadopago', subscriptions }
  } catch {
    return { source: 'demo', subscriptions: DEMO_SUBS }
  }
}

// Saúde da mensalidade de uma assinatura.
// "Atrasado" = ativa, mas a data da próxima cobrança já passou
// (o MP tentou cobrar e não conseguiu) ou está pendente de aprovação.
export function subscriptionHealth(sub: AdminSubscription | undefined): PaymentHealth {
  if (!sub) return 'sem_assinatura'
  if (sub.status === 'cancelled') return 'cancelado'
  if (sub.status === 'pending' || sub.status === 'paused') return 'atrasado'
  if (sub.nextPayment && sub.nextPayment < new Date().toISOString().slice(0, 10)) return 'atrasado'
  return 'em_dia'
}

export function findSubscriptionByEmail(subs: AdminSubscription[], email: string): AdminSubscription | undefined {
  // Preferência: ativa > pausada/pendente > cancelada (cliente pode ter histórico)
  const mine = subs.filter(s => s.payerEmail.toLowerCase() === email.toLowerCase())
  return mine.find(s => s.status === 'authorized')
    ?? mine.find(s => s.status === 'pending' || s.status === 'paused')
    ?? mine[0]
}
