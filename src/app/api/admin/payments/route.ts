import { NextResponse } from 'next/server'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'

export interface AdminSubscription {
  id: string
  payerEmail: string
  reason: string
  amount: number
  status: string          // authorized | paused | cancelled | pending
  nextPayment: string | null
  createdAt: string | null
}

// Assinaturas demo para a tela funcionar sem MP configurado
const DEMO_SUBS: AdminSubscription[] = [
  { id: 'demo-1', payerEmail: 'demo.pequeno@campoclima.com.br', reason: 'Produtor — Mensal', amount: 49, status: 'authorized', nextPayment: '2026-07-05', createdAt: '2026-03-05' },
  { id: 'demo-2', payerEmail: 'demo.medio@campoclima.com.br', reason: 'Produtor — Mensal', amount: 49, status: 'authorized', nextPayment: '2026-07-12', createdAt: '2026-01-12' },
  { id: 'demo-3', payerEmail: 'demo.grande@campoclima.com.br', reason: 'Premium — Mensal (contrato anual)', amount: 129, status: 'authorized', nextPayment: '2026-07-01', createdAt: '2025-11-01' },
  { id: 'demo-4', payerEmail: 'cancelado@exemplo.com.br', reason: 'Produtor — Mensal', amount: 49, status: 'cancelled', nextPayment: null, createdAt: '2026-02-20' },
]

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) return unauthorized()

  const token = process.env.MP_ACCESS_TOKEN
  if (!token) {
    return NextResponse.json({ source: 'demo', subscriptions: DEMO_SUBS })
  }

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

    // Sandbox/conta nova sem assinaturas: mostra demo para a tela não ficar vazia
    return NextResponse.json({
      source: subscriptions.length > 0 ? 'mercadopago' : 'demo',
      subscriptions: subscriptions.length > 0 ? subscriptions : DEMO_SUBS,
    })
  } catch {
    return NextResponse.json({ source: 'demo', subscriptions: DEMO_SUBS })
  }
}
