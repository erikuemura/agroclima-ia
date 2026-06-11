import { NextResponse } from 'next/server'
import { analyzeSoil } from '@/lib/ai'
import type { SoilData } from '@/types'

export async function POST(req: Request) {
  const soil: SoilData = await req.json()
  const analysis = await analyzeSoil(soil)
  return NextResponse.json({ analysis })
}
