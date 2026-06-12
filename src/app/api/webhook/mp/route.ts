import { NextRequest, NextResponse } from 'next/server'
import { mp } from '@/lib/mercadopago'
import { Payment, PreApproval } from 'mercadopago'
import { createHmac, timingSafeEqual } from 'crypto'
import { recordEvent } from '@/lib/server-events'

// Sincroniza a assinatura no Supabase (service role; best-effort).
// Tabela `subscriptions` — docs/migrations/003_launch_core.sql
async function upsertSubscription(row: {
  mp_subscription_id: string
  payer_email?: string | null
  plan_id?: string | null
  status?: string | null
  amount?: number | null
  next_payment?: string | null
  last_payment_at?: string | null
}): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return
  try {
    await fetch(`${url}/rest/v1/subscriptions?on_conflict=mp_subscription_id`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({ ...row, updated_at: new Date().toISOString() }),
      signal: AbortSignal.timeout(5000),
    })
  } catch (err) {
    console.warn('[webhook/mp] sync supabase falhou:', err instanceof Error ? err.message : err)
  }
}

// Valida o header x-signature do Mercado Pago (formato "ts=...,v1=...").
// Manifest oficial: id:{data.id};request-id:{x-request-id};ts:{ts};
function validateSignature(req: NextRequest, dataId: string | undefined): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[webhook/mp] MP_WEBHOOK_SECRET não configurado — assinatura NÃO validada')
    return true
  }
  const signature = req.headers.get('x-signature') ?? ''
  const requestId = req.headers.get('x-request-id') ?? ''
  const parts = Object.fromEntries(signature.split(',').map(p => p.trim().split('=') as [string, string]))
  if (!parts.ts || !parts.v1 || !dataId) return false

  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, data } = body

    if (!validateSignature(req, data?.id ? String(data.id) : undefined)) {
      console.warn('[webhook/mp] assinatura inválida — requisição rejeitada')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Cobrança de assinatura executada
    if (type === 'payment' && data?.id) {
      const payment = new Payment(mp)
      const result = await payment.get({ id: data.id })

      console.log('[webhook/mp] payment:', {
        id: result.id,
        status: result.status,
        subscriptionId: result.metadata?.preapproval_id,
        email: result.payer?.email,
        amount: result.transaction_amount,
      })

      recordEvent('mp_webhook', result.payer?.email ?? 'desconhecido', {
        kind: 'payment',
        paymentId: String(result.id ?? ''),
        status: result.status ?? null,
        statusDetail: result.status_detail ?? null,
        amount: result.transaction_amount ?? null,
      })

      if (result.status === 'approved' && result.metadata?.preapproval_id) {
        await upsertSubscription({
          mp_subscription_id: String(result.metadata.preapproval_id),
          payer_email: result.payer?.email ?? null,
          status: 'authorized',
          amount: result.transaction_amount ?? null,
          last_payment_at: new Date().toISOString(),
        })
      }
    }

    // Assinatura criada, cancelada ou suspensa
    if (type === 'subscription_preapproval' && data?.id) {
      const preApproval = new PreApproval(mp)
      const subscription = await preApproval.get({ id: data.id })

      console.log('[webhook/mp] subscription:', {
        id: subscription.id,
        status: subscription.status,         // authorized | paused | cancelled
        reason: subscription.reason,
        email: subscription.payer_email,
        externalRef: subscription.external_reference,
        nextPayment: subscription.next_payment_date,
      })

      recordEvent('mp_webhook', subscription.payer_email ?? 'desconhecido', {
        kind: 'subscription',
        subscriptionId: String(subscription.id ?? ''),
        status: subscription.status ?? null,
        reason: subscription.reason ?? null,
        nextPayment: subscription.next_payment_date ?? null,
      })

      await upsertSubscription({
        mp_subscription_id: String(subscription.id ?? ''),
        payer_email: subscription.payer_email ?? null,
        plan_id: subscription.external_reference?.split('_')[0] ?? null,
        status: subscription.status ?? null,
        next_payment: subscription.next_payment_date?.slice(0, 10) ?? null,
      })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[webhook/mp]', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
