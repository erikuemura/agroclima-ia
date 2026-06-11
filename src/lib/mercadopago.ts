import { MercadoPagoConfig, Preference } from 'mercadopago'

export const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export const PLAN_PRICES = {
  produtor: { monthly: 4900, annual: 46800, label: 'CampoClima Produtor' },
  premium:  { monthly: 12900, annual: 118800, label: 'CampoClima Premium' },
} as const

export type PlanId = keyof typeof PLAN_PRICES

export async function createPreference(planId: PlanId, annual: boolean, userEmail?: string) {
  const plan = PLAN_PRICES[planId]
  const unit_price = annual ? plan.annual / 100 : plan.monthly / 100
  const description = annual ? `${plan.label} — Plano Anual` : `${plan.label} — Plano Mensal`

  const preference = new Preference(mp)
  const result = await preference.create({
    body: {
      items: [{
        id: `${planId}_${annual ? 'annual' : 'monthly'}`,
        title: description,
        quantity: 1,
        unit_price,
        currency_id: 'BRL',
      }],
      payer: userEmail ? { email: userEmail } : undefined,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/app?checkout=success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/precos?checkout=failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/precos?checkout=pending`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/mp`,
      statement_descriptor: 'CAMPOCLIMA',
      metadata: { planId, annual },
    },
  })

  return result
}
