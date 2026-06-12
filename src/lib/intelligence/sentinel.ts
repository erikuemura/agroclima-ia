import { fromUrl } from 'geotiff'

// ─────────────────────────────────────────────────────────────
// Zonas de produtividade com Sentinel-2 REAL.
// Pipeline: STAC (earth-search AWS, sem chave) → COGs B04/B08 →
// janela de ~2km via HTTP range requests → NDVI por pixel →
// classificação em zonas baixa/média/alta por tercis.
// ─────────────────────────────────────────────────────────────

const STAC_URL = 'https://earth-search.aws.element84.com/v1/search'

export interface NdviZonesResult {
  source: string
  sceneId: string
  sceneDate: string
  cloudCover: number
  grid: number[][]        // NDVI por célula (linha × coluna), -1 = sem dado
  zones: number[][]       // 0 = baixa, 1 = média, 2 = alta, -1 = sem dado
  stats: { mean: number; min: number; max: number; lowPct: number; midPct: number; highPct: number }
  resolutionM: number
}

// Conversão WGS84 → UTM (Snyder/Transverse Mercator) — suficiente
// para indexar pixels de 10m dentro do tile correto.
function latLonToUTM(lat: number, lon: number, zone: number): { x: number; y: number } {
  const a = 6378137.0
  const f = 1 / 298.257223563
  const k0 = 0.9996
  const e2 = f * (2 - f)
  const ep2 = e2 / (1 - e2)
  const latR = (lat * Math.PI) / 180
  const lonR = (lon * Math.PI) / 180
  const lon0 = (((zone - 1) * 6 - 180 + 3) * Math.PI) / 180

  const N = a / Math.sqrt(1 - e2 * Math.sin(latR) ** 2)
  const T = Math.tan(latR) ** 2
  const C = ep2 * Math.cos(latR) ** 2
  const A = Math.cos(latR) * (lonR - lon0)

  const M = a * (
    (1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * latR
    - ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) * Math.sin(2 * latR)
    + ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * latR)
    - ((35 * e2 ** 3) / 3072) * Math.sin(6 * latR)
  )

  const x = k0 * N * (A + ((1 - T + C) * A ** 3) / 6 + ((5 - 18 * T + T ** 2 + 72 * C - 58 * ep2) * A ** 5) / 120) + 500000
  let y = k0 * (M + N * Math.tan(latR) * (A ** 2 / 2 + ((5 - T + 9 * C + 4 * C ** 2) * A ** 4) / 24
    + ((61 - 58 * T + T ** 2 + 600 * C - 330 * ep2) * A ** 6) / 720))
  if (lat < 0) y += 10000000 // hemisfério sul
  return { x, y }
}

interface StacAsset { href: string; 'proj:transform'?: number[] }
interface StacFeature {
  id: string
  properties: { datetime: string; 'eo:cloud_cover': number; 'proj:epsg'?: number }
  assets: { red: StacAsset; nir: StacAsset; [k: string]: StacAsset }
}

async function findLatestScene(lat: number, lon: number): Promise<StacFeature> {
  const res = await fetch(STAC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({
      collections: ['sentinel-2-l2a'],
      intersects: { type: 'Point', coordinates: [lon, lat] },
      query: { 'eo:cloud_cover': { lt: 40 } },
      sortby: [{ field: 'properties.datetime', direction: 'desc' }],
      limit: 1,
    }),
  })
  if (!res.ok) throw new Error(`STAC ${res.status}`)
  const data = await res.json()
  const feature = data.features?.[0]
  if (!feature) throw new Error('Nenhuma cena Sentinel-2 disponível')
  return feature
}

// Lê uma janela downsampled do COG via range requests
async function readWindow(href: string, x: number, y: number, halfM: number, outSize: number): Promise<{ data: Float64Array | number[]; ok: boolean }> {
  const tiff = await fromUrl(href, { allowFullFile: false })
  const image = await tiff.getImage()
  // origem e resolução do raster (UTM)
  const [originX, originY] = image.getOrigin()
  const [resX, resY] = image.getResolution() // resY é negativo
  const px = Math.round((x - originX) / resX)
  const py = Math.round((y - originY) / resY)
  const halfPx = Math.round(halfM / Math.abs(resX))
  const window: [number, number, number, number] = [
    Math.max(0, px - halfPx), Math.max(0, py - halfPx),
    Math.min(image.getWidth(), px + halfPx), Math.min(image.getHeight(), py + halfPx),
  ]
  if (window[2] <= window[0] || window[3] <= window[1]) return { data: [], ok: false }
  const rasters = await image.readRasters({ window, width: outSize, height: outSize, samples: [0] })
  return { data: rasters[0] as Float64Array, ok: true }
}

export async function fetchNdviZones(lat: number, lon: number, halfM = 1000, gridSize = 16): Promise<NdviZonesResult> {
  const scene = await findLatestScene(lat, lon)
  const epsg = scene.properties['proj:epsg'] ?? 32721
  const zone = epsg % 100
  const { x, y } = latLonToUTM(lat, lon, zone)

  const [red, nir] = await Promise.all([
    readWindow(scene.assets.red.href, x, y, halfM, gridSize),
    readWindow(scene.assets.nir.href, x, y, halfM, gridSize),
  ])
  if (!red.ok || !nir.ok) throw new Error('Janela fora do tile')

  // NDVI = (NIR − RED) / (NIR + RED); reflectância L2A vem em DN×10000
  const ndviFlat: number[] = []
  const grid: number[][] = []
  for (let r = 0; r < gridSize; r++) {
    const row: number[] = []
    for (let c = 0; c < gridSize; c++) {
      const i = r * gridSize + c
      const rv = Number(red.data[i]), nv = Number(nir.data[i])
      if (!rv && !nv) { row.push(-1); continue }
      const ndvi = +((nv - rv) / (nv + rv)).toFixed(3)
      row.push(ndvi)
      ndviFlat.push(ndvi)
    }
    grid.push(row)
  }
  if (ndviFlat.length === 0) throw new Error('Sem pixels válidos')

  // Zonas por tercis (variabilidade relativa dentro da área)
  const sorted = [...ndviFlat].sort((a, b) => a - b)
  const t1 = sorted[Math.floor(sorted.length / 3)]
  const t2 = sorted[Math.floor((2 * sorted.length) / 3)]
  const zones = grid.map(row => row.map(v => v === -1 ? -1 : v < t1 ? 0 : v < t2 ? 1 : 2))

  const count = (z: number) => zones.flat().filter(v => v === z).length
  const valid = ndviFlat.length
  const mean = +(ndviFlat.reduce((a, b) => a + b, 0) / valid).toFixed(3)

  return {
    source: 'Sentinel-2 L2A (Copernicus/AWS)',
    sceneId: scene.id,
    sceneDate: scene.properties.datetime.slice(0, 10),
    cloudCover: +scene.properties['eo:cloud_cover'].toFixed(1),
    grid,
    zones,
    stats: {
      mean,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      lowPct: Math.round((count(0) / valid) * 100),
      midPct: Math.round((count(1) / valid) * 100),
      highPct: Math.round((count(2) / valid) * 100),
    },
    resolutionM: Math.round((halfM * 2) / gridSize),
  }
}
