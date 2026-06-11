import { NextResponse } from 'next/server'

export const revalidate = 86400

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') ?? '-12.5')
  const lon = parseFloat(searchParams.get('lon') ?? '-55.7')

  try {
    const props = ['phh2o', 'nitrogen', 'soc', 'clay', 'sand']
    const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}&${props.map(p => `property=${p}`).join('&')}&depth=0-5cm&value=mean`

    const res = await fetch(url, { signal: AbortSignal.timeout(10000), next: { revalidate: 86400 } })
    if (!res.ok) throw new Error('SoilGrids failed')

    const json = await res.json()
    const layers: { name: string; depths: { label: string; values: { mean: number } }[] }[] = json?.properties?.layers ?? []

    function val(name: string): number {
      const layer = layers.find(l => l.name === name)
      return layer?.depths?.[0]?.values?.mean ?? 0
    }

    // phh2o is pH × 10, nitrogen is cg/kg (÷10 = g/kg), soc is dg/kg (÷10 = g/kg), clay/sand g/kg (÷10 = %)
    const ph      = +(val('phh2o') / 10).toFixed(1)
    const n       = +(val('nitrogen') / 10).toFixed(2)          // g/kg
    const soc     = +(val('soc') / 10).toFixed(2)               // g/kg ≈ approx MO
    const clay    = +(val('clay') / 10).toFixed(1)              // %
    const sand    = +(val('sand') / 10).toFixed(1)              // %
    const silt    = +(100 - clay - sand).toFixed(1)

    // Derive texture class
    let texture: string
    if (clay >= 60) texture = 'muito argilosa'
    else if (clay >= 35) texture = 'argilosa'
    else if (clay >= 25 && sand < 45) texture = 'média'
    else if (sand >= 70) texture = 'arenosa'
    else texture = 'areno-argilosa'

    // Derive MO from SOC (MO ≈ SOC × 1.724)
    const om = +(soc * 1.724).toFixed(2)

    const phStatus = ph < 5.5 ? 'ácido' : ph < 6.0 ? 'moderadamente ácido' : ph < 7.0 ? 'neutro' : 'alcalino'

    return NextResponse.json({
      source: 'SoilGrids ISRIC (250m)',
      lat, lon,
      ph, phStatus,
      nitrogen: n,
      organicMatter: om,
      clay, sand, silt,
      texture,
      // Pre-filled form values compatible with SoilData type
      formValues: {
        ph: Math.min(7.5, Math.max(4.0, ph)),
        nitrogen: Math.round(n * 10),      // convert to mg/kg approx
        phosphorus: 15,                     // SoilGrids doesn't have P — typical
        potassium: 100,                     // SoilGrids doesn't have K — typical
        organicMatter: Math.min(8, Math.max(0.5, om)),
        texture: texture.includes('argilosa') ? 'argilosa' : texture.includes('arenosa') ? 'arenosa' : texture.includes('areno') ? 'areno-argilosa' : 'média',
      },
    })
  } catch {
    return NextResponse.json({
      source: 'Simulado',
      ph: 5.6, phStatus: 'moderadamente ácido',
      nitrogen: 1.2, organicMatter: 2.1,
      clay: 42, sand: 35, silt: 23,
      texture: 'argilosa',
      formValues: { ph: 5.6, nitrogen: 18, phosphorus: 15, potassium: 100, organicMatter: 2.1, texture: 'argilosa' },
    })
  }
}
