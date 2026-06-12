'use client'

import { track } from '@vercel/analytics'

// ─────────────────────────────────────────────────────────────
// Eventos custom do funil. Pageviews são automáticos (<Analytics/>
// no root layout). Aqui só os momentos de negócio: demo, IA,
// checkout e engajamento. Nunca enviar dados pessoais no payload.
// ─────────────────────────────────────────────────────────────

type EventName =
  | 'demo_started'          // { profile }
  | 'ai_chat_message'       // { hasImage, fromCard }
  | 'checkout_started'      // { plan, annual }
  | 'alert_followed'        // { category }
  | 'push_enabled'
  | 'insight_action_click'  // { category }

export function trackEvent(name: EventName, props?: Record<string, string | number | boolean>) {
  try { track(name, props) } catch { /* analytics nunca quebra o app */ }
}
