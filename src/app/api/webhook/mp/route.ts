import { NextRequest, NextResponse } from 'next/server'
import { mp } from '@/lib/mercadopago'
import { Payment } from 'mercadopago'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, data } = body

    if (type === 'payment' && data?.id) {
      const payment = new Payment(mp)
      const result = await payment.get({ id: data.id })

      console.log('[webhook/mp] payment:', {
        id: result.id,
        status: result.status,
        plan: result.metadata?.planId,
        annual: result.metadata?.annual,
        email: result.payer?.email,
        amount: result.transaction_amount,
      })

      if (result.status === 'approved') {
        // TODO: atualizar plano do usuário no Supabase
        // await supabase.from('subscriptions').upsert({ user_email: result.payer?.email, plan: result.metadata?.planId })
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[webhook/mp]', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
