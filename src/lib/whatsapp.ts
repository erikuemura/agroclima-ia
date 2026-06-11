const BASE = 'https://graph.facebook.com/v20.0'
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!
const TOKEN    = process.env.WHATSAPP_TOKEN!

// ──────────────────────────────────────────────
// Core send helpers
// ──────────────────────────────────────────────

async function post(body: object) {
  const res = await fetch(`${BASE}/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WhatsApp API error ${res.status}: ${err}`)
  }
  return res.json()
}

export async function sendText(to: string, text: string) {
  return post({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } })
}

export async function sendButtons(
  to: string,
  body: string,
  buttons: { id: string; title: string }[]
) {
  return post({
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body },
      action: {
        buttons: buttons.map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })),
      },
    },
  })
}

export async function sendList(
  to: string,
  body: string,
  buttonLabel: string,
  sections: { title: string; rows: { id: string; title: string; description?: string }[] }[]
) {
  return post({
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: body },
      action: { button: buttonLabel, sections },
    },
  })
}

// Download media (foto enviada pelo usuário)
export async function getMediaUrl(mediaId: string): Promise<string> {
  const res = await fetch(`${BASE}/${mediaId}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  const data = await res.json()
  return data.url as string
}

export async function downloadMedia(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

// ──────────────────────────────────────────────
// Alert push — envia para um número específico
// ──────────────────────────────────────────────

export type AlertSeverity = 'danger' | 'warning' | 'success' | 'info'

const severityEmoji: Record<AlertSeverity, string> = {
  danger:  '🚨',
  warning: '⚠️',
  success: '✅',
  info:    'ℹ️',
}

export async function sendAlert(to: string, alert: {
  severity: AlertSeverity
  title: string
  description: string
  crop?: string | null
}) {
  const emoji = severityEmoji[alert.severity]
  const cropLine = alert.crop ? `\n🌱 Cultura: ${alert.crop}` : ''
  const msg = `${emoji} *${alert.title}*\n\n${alert.description}${cropLine}\n\n_Via CampoClima · Responda com *ajuda* para ver comandos_`
  return sendText(to, msg)
}
