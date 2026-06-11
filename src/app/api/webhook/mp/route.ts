import { NextRequest, NextResponse } from 'next/server'
import { mp } from '@/lib/mercadopago'
import { Payment, PreApproval } from 'mercadopago'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, data } = body

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
