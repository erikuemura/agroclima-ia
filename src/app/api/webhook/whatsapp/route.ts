import { NextResponse } from 'next/server'
import { handleIncomingMessage, type WaMessage } from '@/lib/whatsapp-bot'
import { createHmac, timingSafeEqual } from 'crypto'

// Meta webhook verification
export async function GET(req: Request) {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
  if (!verifyToken) return new Response('Not configured', { status: 503 })

  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === verifyToken) {
    return new Response(challenge ?? '', { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// Valida X-Hub-Signature-256 (HMAC-SHA256 do body cru com o App Secret da Meta)
function validSignature(rawBody: string, header: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret) {
    console.warn('[WhatsApp webhook] WHATSAPP_APP_SECRET não configurado — assinatura NÃO validada')
    return true
  }
  if (!header?.startsWith('sha256=')) return false
  const expected = createHmac('sha256', appSecret).update(rawBody).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(header.slice(7)))
  } catch {
    return false
  }
}

// Incoming messages
export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    if (!validSignature(rawBody, req.headers.get('x-hub-signature-256'))) {
      console.warn('[WhatsApp webhook] assinatura inválida — requisição rejeitada')
      return NextResponse.json({ status: 'forbidden' }, { status: 403 })
    }
    const body = JSON.parse(rawBody)

    // Always respond 200 quickly — Meta retries if we take >20s
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value  = changes?.value

    if (value?.messages) {
      for (const msg of value.messages) {
        const from: string = msg.from

        const waMessage: WaMessage = {
          type: msg.type ?? 'unknown',
          text: msg.text,
          image: msg.image,
          interactive: msg.interactive,
        }

        // Fire-and-forget — don't await so Meta gets 200 fast
        handleIncomingMessage(from, waMessage).catch(err =>
          console.error(`[WhatsApp bot] Error for ${from}:`, err)
        )
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('[WhatsApp webhook] Parse error:', err)
    return NextResponse.json({ status: 'error' }, { status: 200 }) // always 200 to Meta
  }
}
