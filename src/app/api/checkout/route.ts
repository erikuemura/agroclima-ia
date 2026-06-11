import { NextRequest, NextResponse } from 'next/server'
import { mp, PLANS, PlanId } from '@/lib/mercadopago'
import { PreApproval } from 'mercadopago'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Mercado Pago não configurado' }, { status: 503 })
    }

    const { planId, annual, payerEmail, cardTokenId, payer } = await req.json()

    if (!planId || !(planId in PLANS)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    const plan    = PLANS[planId as PlanId]
    const pricing = annual ? plan.annual : plan.monthly
    const reason  = annual
      ? `${plan.label} — Mensal (contrato anual)`
      : `${plan.label} — Mensal`
    const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? ''

    const preApproval = new PreApproval(mp)

    const body: Record<string, unknown> = {
      reason,
      external_reference: `${planId}_${annual ? 'annual' : 'monthly'}`,
      payer_email: payerEmail ?? payer?.email,
      auto_recurring: {
        frequency:          pricing.frequency,
        frequency_type:     pricing.frequency_type,
        transaction_amount: pricing.amount,
        currency_id:        'BRL',
      },
      back_url: `${appUrl}/app?checkout=success`,
      status:   'pending',
    }

    // Se vier token do cartão, inclui para criar assinatura já com cartão vinculado
    if (cardTokenId) {
      body.card_token_id = cardTokenId
    }

    // Dados do pagador (endereço, CPF, telefone)
    if (payer) {
      body.payer = payer
    }

    const result = await preApproval.create({ body: body as any })

    return NextResponse.json({
      init_point: result.init_point,
      id:         result.id,
      status:     result.status,
    })
  } catch (err: unknown) {
    console.error('[checkout]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Não foi possível criar a assinatura. Verifique os dados do cartão e tente novamente.' }, { status: 500 })
  }
}
