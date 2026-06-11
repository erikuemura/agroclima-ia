import { NextResponse } from 'next/server'

export const revalidate = 86400 // 24h — climatology doesn't change often

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') ?? '-12.5')
  const lon = parseFloat(searchParams.get('lon') ?? '-55.7')

  try {
    // NASA POWER 30-year climatology (1991-2020)
    const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=PRECTOTCORR,T2M,RH2M,ALLSKY_SFC_SW_DWN&community=AG&longitude=${lon}&latitude=${lat}&format=JSON`
    const res = await fetch(url, { signal: AbortSignal.timeout(12000), next: { revalidate: 86400 } })
    if (!res.ok) throw new Error('NASA API failed')

    const json = await res.json()
    const params = json?.properties?.parameter ?? {}

    const rain   = params.PRECTOTCORR ?? {}
    const temp   = params.T2M ?? {}
    const rh     = params.RH2M ?? {}
    const solar  = params.ALLSKY_SFC_SW_DWN ?? {}

    // Months 1-12
    const months = Array.from({ length: 12 }, (_, i) => {
      const k = String(i + 1).padStart(2, '0') // '01'..'12'
      return {
        month: MONTHS_PT[i],
        rain:  +(rain[k]  ?? 0).toFixed(1),
        temp:  +(temp[k]  ?? 0).toFixed(1),
        rh:    +(rh[k]    ?? 0).toFixed(1),
        solar: +(solar[k] ?? 0).toFixed(1),
      }
    })

    const currentMonth = new Date().getMonth() // 0-indexed
    const currentNormal = months[currentMonth]
    const annualRain = months.reduce((a, m) => a + m.rain, 0).toFixed(0)

    // Find wettest and driest months
    const wettestIdx = months.reduce((a, m, i) => m.rain > months[a].rain ? i : a, 0)
    const driestIdx  = months.reduce((a, m, i) => m.rain < months[a].rain ? i : a, 0)

    return NextResponse.json({
      source: 'NASA POWER — Climatology 1991-2020',
      months,
      currentNormal,
      currentMonthName: MONTHS_PT[currentMonth],
      annualRain: +annualRain,
      wettestMonth: MONTHS_PT[wettestIdx],
      wettestRain:  months[wettestIdx].rain,
      driestMonth:  MONTHS_PT[driestIdx],
      driestRain:   months[driestIdx].rain,
    })
  } catch {
    // Cerrado climate fallback (MT profile)
    const months = [
      { month:'Jan', rain:240, temp:25.5, rh:83, solar:18.5 },
      { month:'Fev', rain:210, temp:25.4, rh:83, solar:18.1 },
      { month:'Mar', rain:195, temp:25.3, rh:82, solar:18.8 },
      { month:'Abr', rain:100, temp:25.0, rh:76, solar:19.5 },
      { month:'Mai', rain:40,  temp:24.1, rh:68, solar:20.2 },
      { month:'Jun', rain:8,   temp:23.2, rh:60, solar:21.0 },
      { month:'Jul', rain:5,   temp:23.5, rh:55, solar:21.8 },
      { month:'Ago', rain:18,  temp:25.1, rh:53, solar:21.5 },
      { month:'Set', rain:65,  temp:26.3, rh:60, solar:20.0 },
      { month:'Out', rain:140, temp:26.8, rh:71, solar:19.2 },
      { month:'Nov', rain:200, temp:26.2, rh:78, solar:18.0 },
      { month:'Dez', rain:225, temp:25.8, rh:82, solar:17.8 },
    ]
    const cm = new Date().getMonth()
    return NextResponse.json({
      source: 'Dados climáticos simulados',
      months,
      currentNormal: months[cm],
      currentMonthName: MONTHS_PT[cm],
      annualRain: 1446,
      wettestMonth: 'Jan', wettestRain: 240,
      driestMonth: 'Jul',  driestRain: 5,
    })
  }
}
