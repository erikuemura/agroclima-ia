import { NextRequest, NextResponse } from 'next/server'
import { mp } from '@/lib/mercadopago'
import { Payment, PreApproval } from 'mercadopago'
import { createHmac, timingSafeEqual } from 'crypto'
import { recordEvent } from '@/lib/server-events'

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

      if (result.status === 'approved') {
        // TODO: confirmar cobrança recorrente no Supabase
        // await supabase.from('subscriptions').update({ status: 'active', last_payment: new Date() })
        //   .eq('mp_subscription_id', result.metadata?.preapproval_id)
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

      // TODO: sincronizar status da assinatura no Supabase
      // const planId = subscription.external_reference?.split('_')[0]
      // await supabase.from('subscriptions').upsert({
      //   mp_subscription_id: subscription.id,
      //   user_email: subscription.payer_email,
      //   plan_id: planId,
      //   status: subscription.status,
      //   next_payment: subscription.next_payment_date,
      // })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[webhook/mp]', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
