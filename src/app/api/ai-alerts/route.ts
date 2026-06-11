import { NextResponse } from 'next/server'
import { generateAlerts } from '@/lib/ai'
import type { WeatherCurrent, WeatherDay, Crop } from '@/types'

export async function POST(req: Request) {
  const { current, days, crops }: { current: WeatherCurrent; days: WeatherDay[]; crops: Crop[] } = await req.json()
  const alerts = await generateAlerts(current, days, crops)
  return NextResponse.json(alerts)
}
