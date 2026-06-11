import { NextResponse } from 'next/server'

export const revalidate = 3600

function fmt(d: Date) {
  return d.toISOString().slice(0, 10)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') ?? '-12.5')
  const lon = parseFloat(searchParams.get('lon') ?? '-55.7')

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const yesterday  = new Date(now); yesterday.setDate(now.getDate() - 1)

  const lastYearStart = new Date(monthStart); lastYearStart.setFullYear(lastYearStart.getFullYear() - 1)
  const lastYearEnd   = new Date(yesterday);  lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1)

  const base = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,temperature_2m_mean&timezone=auto`

  async function fetchPeriod(start: Date, end: Date) {
    if (start >= end) return { rain: 0, tempAvg: 0, days: 0 }
    const res = await fetch(`${base}&start_date=${fmt(start)}&end_date=${fmt(end)}`, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error('fetch failed')
    const json = await res.json()
    const precip: number[] = json.daily?.precipitation_sum ?? []
    const temps: number[]  = json.daily?.temperature_2m_mean ?? []
    const rain    = +precip.reduce((a: number, v: number) => a + (v ?? 0), 0).toFixed(1)
    const tempAvg = temps.length ? +(temps.reduce((a: number, v: number) => a + (v ?? 0), 0) / temps.length).toFixed(1) : 0
    return { rain, tempAvg, days: precip.length }
  }

  try {
    const [current, lastYear] = await Promise.all([
      fetchPeriod(monthStart, yesterday),
      fetchPeriod(lastYearStart, lastYearEnd),
    ])

    const rainDelta    = lastYear.rain > 0 ? +(((current.rain - lastYear.rain) / lastYear.rain) * 100).toFixed(1) : 0
    const tempDelta    = +(current.tempAvg - lastYear.tempAvg).toFixed(1)
    const monthName    = monthStart.toLocaleDateString('pt-BR', { month: 'long' })
    const daysElapsed  = current.days

    return NextResponse.json({
      source: 'Open-Meteo Archive',
      monthName,
      daysElapsed,
      current,
      lastYear,
      rainDelta,
      tempDelta,
      rainStatus: rainDelta <= -20 ? 'seco' : rainDelta >= 20 ? 'chuvoso' : 'normal',
      tempStatus: tempDelta >= 1.5 ? 'quente' : tempDelta <= -1.5 ? 'frio' : 'normal',
    })
  } catch {
    // Seeded fallback
    const seed = Math.sin(now.getFullYear() * 100 + now.getMonth()) * 10000
    const r = seed - Math.floor(seed)
    return NextResponse.json({
      source: 'Simulado',
      monthName: monthStart.toLocaleDateString('pt-BR', { month: 'long' }),
      daysElapsed: yesterday.getDate(),
      current:  { rain: +(40 + r * 60).toFixed(1), tempAvg: +(26 + r * 4).toFixed(1), days: yesterday.getDate() },
      lastYear: { rain: +(55 + r * 50).toFixed(1), tempAvg: +(25 + r * 3).toFixed(1), days: yesterday.getDate() },
      rainDelta: -18,
      tempDelta: 1.2,
      rainStatus: 'seco',
      tempStatus: 'normal',
    })
  }
}
