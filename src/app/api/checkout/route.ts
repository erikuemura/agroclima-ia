import { NextRequest, NextResponse } from 'next/server'
import { createPreference, PLAN_PRICES, PlanId } from '@/lib/mercadopago'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Mercado Pago não configurado' }, { status: 503 })
    }

    const { planId, annual } = await req.json()

    if (!planId || !(planId in PLAN_PRICES)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    const preference = await createPreference(planId as PlanId, !!annual)

    return NextResponse.json({
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      id: preference.id,
    })
  } catch (err) {
    console.error('[checkout]', err)
    return NextResponse.json({ error: 'Erro ao criar checkout' }, { status: 500 })
  }
}
