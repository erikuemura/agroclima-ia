import { NextResponse } from 'next/server'
import { fetchForecast } from '@/lib/weather'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') ?? '-12.5449')
  const lon = parseFloat(searchParams.get('lon') ?? '-55.7212')
  const data = await fetchForecast(lat, lon)
  return NextResponse.json(data)
}
