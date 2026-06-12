import { NextResponse } from 'next/server'
import { fetchNdviZones, type NdviZonesResult } from '@/lib/intelligence/sentinel'

export const revalidate = 86400 // cenas novas a cada ~5 dias; 1 busca/dia basta

// Fallback determinístico quando o Sentinel-2 está indisponível
function seededZones(lat: number, lon: number): NdviZonesResult {
  const size = 16
  const seedBase = Math.abs(Math.sin(lat * 13.7 + lon * 7.3)) * 1000
  const grid: number[][] = []
  const flat: number[] = []
  for (let r = 0; r < size; r++) {
    const row: number[] = []
    for (let c = 0; c < size; c++) {
      const s = Math.sin(seedBase + r * 3.1 + c * 1.7) * 10000
      const noise = s - Math.floor(s)
      // gradiente suave + ruído, faixa típica de lavoura
      const v = +(0.45 + 0.3 * Math.sin((r + c) / 8) + noise * 0.15).toFixed(3)
      const clamped = Math.max(0.2, Math.min(0.9, v))
      row.push(clamped); flat.push(clamped)
    }
    grid.push(row)
  }
  const sorted = [...flat].sort((a, b) => a - b)
  const t1 = sorted[Math.floor(sorted.length / 3)]
  const t2 = sorted[Math.floor((2 * sorted.length) / 3)]
  const zones = grid.map(row => row.map(v => (v < t1 ? 0 : v < t2 ? 1 : 2)))
  const count = (z: number) => zones.flat().filter(v => v === z).length
  return {
    source: 'Simulado (Sentinel-2 indisponível)',
    sceneId: '—',
    sceneDate: new Date().toISOString().slice(0, 10),
    cloudCover: 0,
    grid, zones,
    stats: {
      mean: +(flat.reduce((a, b) => a + b, 0) / flat.length).toFixed(3),
      min: sorted[0], max: sorted[sorted.length - 1],
      lowPct: Math.round((count(0) / flat.length) * 100),
      midPct: Math.round((count(1) / flat.length) * 100),
      highPct: Math.round((count(2) / flat.length) * 100),
    },
    resolutionM: 125,
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') ?? '-12.5449')
  const lon = parseFloat(searchParams.get('lon') ?? '-55.7212')

  try {
    const result = await fetchNdviZones(lat, lon)
    return NextResponse.json(result)
  } catch (err) {
    console.warn('[ndvi-zones] fallback:', err instanceof Error ? err.message : err)
    return NextResponse.json(seededZones(lat, lon))
  }
}
