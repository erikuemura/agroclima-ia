import { NextResponse } from 'next/server'
import { analyzeSoil } from '@/lib/ai'
import { rateLimit } from '@/lib/rate-limit'
import type { SoilData } from '@/types'

export async function POST(req: Request) {
  const limited = rateLimit(req, { key: 'soil-analysis', limit: 10, windowMs: 60_000 })
  if (limited) return limited

  const soil: SoilData = await req.json()
  const analysis = await analyzeSoil(soil)
  return NextResponse.json({ analysis })
}
