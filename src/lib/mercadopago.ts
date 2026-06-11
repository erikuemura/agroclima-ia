import { MercadoPagoConfig, PreApproval } from 'mercadopago'

export const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export const PLANS = {
  produtor: {
    label: 'CampoClima Produtor',
    monthly:  { amount: 49.00, frequency: 1, frequency_type: 'months' as const },
    annual:   { amount: 39.00, frequency: 1, frequency_type: 'months' as const }, // cobrado mensalmente com desconto anual
  },
  premium: {
    label: 'CampoClima Premium',
    monthly:  { amount: 129.00, frequency: 1, frequency_type: 'months' as const },
    annual:   { amount: 99.00, frequency: 1, frequency_type: 'months' as const },
  },
} as const

export type PlanId = keyof typeof PLANS

export async function createSubscription(planId: PlanId, annual: boolean, payerEmail?: string) {
  const plan = PLANS[planId]
  const pricing = annual ? plan.annual : plan.monthly
  const reason = annual
    ? `${plan.label} — Mensal (contrato anual)`
    : `${plan.label} — Mensal`

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const preApproval = new PreApproval(mp)
  const result = await preApproval.create({
    body: {
      reason,
      external_reference: `${planId}_${annual ? 'annual' : 'monthly'}`,
      payer_email: payerEmail,
      auto_recurring: {
        frequency:       pricing.frequency,
        frequency_type:  pricing.frequency_type,
        transaction_amount: pricing.amount,
        currency_id:     'BRL',
      },
      back_url: `${appUrl}/app?checkout=success`,
      status: 'pending',
    },
  })

  return result
}
