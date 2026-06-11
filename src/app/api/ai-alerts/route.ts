import { NextResponse } from 'next/server'
import { generateAlerts } from '@/lib/ai'
import { rateLimit } from '@/lib/rate-limit'
import type { WeatherCurrent, WeatherDay, Crop } from '@/types'

export async function POST(req: Request) {
  const limited = rateLimit(req, { key: 'ai-alerts', limit: 10, windowMs: 60_000 })
  if (limited) return limited

  const { current, days, crops }: { current: WeatherCurrent; days: WeatherDay[]; crops: Crop[] } = await req.json()
  const alerts = await generateAlerts(current, days, crops)
  return NextResponse.json(alerts)
}
