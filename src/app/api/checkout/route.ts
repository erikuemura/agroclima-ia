import { NextRequest, NextResponse } from 'next/server'
import { createSubscription, PLANS, PlanId } from '@/lib/mercadopago'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Mercado Pago não configurado' }, { status: 503 })
    }

    const { planId, annual, payerEmail } = await req.json()

    if (!planId || !(planId in PLANS)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    const subscription = await createSubscription(planId as PlanId, !!annual, payerEmail)

    return NextResponse.json({
      init_point: subscription.init_point,
      id: subscription.id,
    })
  } catch (err) {
    console.error('[checkout]', err)
    return NextResponse.json({ error: 'Erro ao criar assinatura' }, { status: 500 })
  }
}
