import { NextResponse } from 'next/server'

export const revalidate = 86400

// IBGE municipality codes for demo profiles
const CITY_CODES: Record<string, number> = {
  'Cascavel':    4104808,
  'Sorriso':     5107909,
  'Nova Mutum':  5106224,
}

// State codes
const STATE_CODES: Record<string, number> = {
  MT: 51, PR: 41, GO: 52, SP: 35, MS: 50, RS: 43, SC: 42, BA: 29,
}

// Crop codes in IBGE PAM (produto)
const CROP_CODES: Record<string, number> = {
  soja: 14139, milho: 14137, algodão: 14132, trigo: 14141, cana: 14128,
}

function detectCropCode(cropName: string): number {
  const n = cropName.toLowerCase()
  if (n.includes('soja'))    return CROP_CODES.soja
  if (n.includes('milho'))   return CROP_CODES.milho
  if (n.includes('algodão') || n.includes('algodao')) return CROP_CODES.algodão
  if (n.includes('trigo'))   return CROP_CODES.trigo
  if (n.includes('cana'))    return CROP_CODES.cana
  return CROP_CODES.soja
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const city      = searchParams.get('city')  ?? 'Sorriso'
  const state     = searchParams.get('state') ?? 'MT'
  const cropParam = searchParams.get('crop')  ?? 'soja'

  const cityCode  = CITY_CODES[city] ?? CITY_CODES['Sorriso']
  const stateCode = STATE_CODES[state] ?? 51
  const prodCode  = detectCropCode(cropParam)

  try {
    // Variables: 109=área colhida(ha), 216=produção(t), 112=rendimento(kg/ha)
    const vars = '109|216|112'
    const url = `https://servicodados.ibge.gov.br/api/v3/agregados/1612/periodos/2023/variaveis/${vars}?localidades=N6[${cityCode}]|N3[${stateCode}]`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 86400 } })
    if (!res.ok) throw new Error('IBGE API failed')

    const json = await res.json()

    function extractVal(varId: number, localityLevel: string): number {
      const varData = json.find((v: { id: number }) => v.id === varId)
      if (!varData) return 0
      const locality = varData.resultados?.[0]?.series?.find(
        (s: { localidade: { nivel: { id: string } } }) => s.localidade.nivel.id === localityLevel
      )
      return parseFloat(locality?.serie?.['2023'] ?? '0') || 0
    }

    const cityAreaHa   = extractVal(109, 'N6')
    const cityProdT    = extractVal(216, 'N6')
    const cityYieldKgHa= extractVal(112, 'N6')
    const stateAreaHa  = extractVal(109, 'N3')
    const stateProdT   = extractVal(216, 'N3')

    // Convert yield to sc/ha (soja: 60kg/sc, milho: 60kg/sc)
    const bagKg = 60
    const cityYieldSc  = cityYieldKgHa  > 0 ? +(cityYieldKgHa  / bagKg).toFixed(1) : 0
    const stateYieldSc = stateAreaHa > 0 ? +((stateProdT * 1000 / stateAreaHa) / bagKg).toFixed(1) : 0

    return NextResponse.json({
      source: 'IBGE PAM 2023',
      cityName: city, state, crop: cropParam,
      city: { areaHa: cityAreaHa, prodT: cityProdT, yieldKgHa: cityYieldKgHa, yieldSc: cityYieldSc },
      stateYieldSc,
      stateAreaHa,
      farmersEst: Math.round(cityAreaHa / 250),
    })
  } catch {
    const defaults: Record<string, { yieldSc: number; stateYieldSc: number; area: number }> = {
      MT: { yieldSc: 62.0, stateYieldSc: 60.5, area: 12400000 },
      PR: { yieldSc: 56.0, stateYieldSc: 54.8, area: 5800000 },
      GO: { yieldSc: 59.0, stateYieldSc: 57.5, area: 4100000 },
    }
    const d = defaults[state] ?? defaults.MT
    return NextResponse.json({
      source: 'Dados IBGE estimados',
      cityName: city, state, crop: cropParam,
      city: { areaHa: 180000, prodT: 680000, yieldKgHa: d.yieldSc * 60, yieldSc: d.yieldSc },
      stateYieldSc: d.stateYieldSc,
      stateAreaHa: d.area,
      farmersEst: 720,
    })
  }
}
