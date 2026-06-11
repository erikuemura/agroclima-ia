import { NextResponse } from 'next/server'
import { handleIncomingMessage, type WaMessage } from '@/lib/whatsapp-bot'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? 'campoclima_verify_2026'

// Meta webhook verification
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge ?? '', { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// Incoming messages
export async function POST(req: Request) {
  try {
    const body = await req.json()

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
