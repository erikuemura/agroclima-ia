import { NextResponse } from 'next/server'
import { sendAlert, type AlertSeverity } from '@/lib/whatsapp'

// Internal endpoint: send an alert to one or many WhatsApp numbers
// POST { numbers: string[], alert: { severity, title, description, crop? } }
export async function POST(req: Request) {
  const secret = req.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { numbers, alert } = await req.json() as {
    numbers: string[]
    alert: { severity: AlertSeverity; title: string; description: string; crop?: string }
  }

  if (!numbers?.length || !alert) {
    return NextResponse.json({ error: 'numbers[] and alert required' }, { status: 400 })
  }

  const results = await Promise.allSettled(
    numbers.map(n => sendAlert(n, alert))
  )

  const sent   = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({ sent, failed })
}
