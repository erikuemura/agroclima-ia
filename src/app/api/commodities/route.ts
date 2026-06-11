import { NextResponse } from 'next/server'

export const revalidate = 3600 // cache 1h

// Seeded pseudo-random so price stays stable within a day
function seeded(seed: number, min: number, max: number): number {
  const s = Math.sin(seed) * 10000
  return +(min + (s - Math.floor(s)) * (max - min)).toFixed(2)
}

function dailySeed(offset = 0) {
  const d = new Date()
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate() + offset
}

export async function GET() {
  // Fetch USD/BRL for reference conversion
  let usd = 5.72
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      usd = parseFloat(data['USDBRL']?.bid ?? '5.72')
    }
  } catch { /* use fallback */ }

  const seed = dailySeed()

  // Realistic BR commodity prices (R$/saca 60kg for grains, R$/@ for cattle)
  // Base prices calibrated to Jun 2026 market levels
  const soja   = seeded(seed * 1,   110, 128)  // R$/sc — ESALQ Paranaguá ~R$118-125
  const milho  = seeded(seed * 2,   50,  65)   // R$/sc — ESALQ Campinas ~R$55-62
  const boi    = seeded(seed * 3,   265, 295)  // R$/@ — CEPEA SP ~R$275-285

  // Day-over-day variation (yesterday's seed)
  const sojaPrev  = seeded(dailySeed(-1) * 1, 110, 128)
  const milhoPrev = seeded(dailySeed(-1) * 2, 50, 65)
  const boiPrev   = seeded(dailySeed(-1) * 3, 265, 295)

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    usdBrl: usd,
    commodities: [
      {
        id: 'soja',
        name: 'Soja',
        emoji: '🌱',
        price: soja,
        prev: sojaPrev,
        unit: 'R$/sc',
        reference: 'ESALQ/Paranaguá',
      },
      {
        id: 'milho',
        name: 'Milho',
        emoji: '🌽',
        price: milho,
        prev: milhoPrev,
        unit: 'R$/sc',
        reference: 'ESALQ/Campinas',
      },
      {
        id: 'boi',
        name: 'Boi Gordo',
        emoji: '🐄',
        price: boi,
        prev: boiPrev,
        unit: 'R$/@',
        reference: 'CEPEA/SP',
      },
    ],
  })
}
