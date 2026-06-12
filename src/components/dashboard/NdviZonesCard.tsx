'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Satellite, RefreshCw, Bot } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ZonesData {
  source: string
  sceneId: string
  sceneDate: string
  cloudCover: number
  grid: number[][]
  zones: number[][]
  stats: { mean: number; min: number; max: number; lowPct: number; midPct: number; highPct: number }
  resolutionM: number
}

const ZONE_COLORS = ['#ef9f27', '#97c459', '#3b6d11'] // baixa, média, alta
const ZONE_LABELS = ['Baixa', 'Média', 'Alta']

export function NdviZonesCard({ lat, lon }: { lat: number; lon: number }) {
  const router = useRouter()
  const [data, setData] = useState<ZonesData | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/ndvi-zones?lat=${lat}&lon=${lon}`)
      if (res.ok) setData(await res.json())
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [lat, lon])

  const isReal = data?.source.includes('Sentinel-2')

  function askAI() {
    if (!data) return
    const q = `Minhas zonas de produtividade por satélite (Sentinel-2, ${data.sceneDate}): ${data.stats.lowPct}% da área em zona baixa, ${data.stats.midPct}% média e ${data.stats.highPct}% alta. NDVI médio ${data.stats.mean} (mín ${data.stats.min}, máx ${data.stats.max}). O que essa variabilidade indica e como manejar as zonas de baixa produtividade?`
    router.push(`/assistente?q=${encodeURIComponent(q)}`)
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-purple-500" />
          <h3 className="text-sm font-medium text-stone-700">Zonas de produtividade</h3>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            isReal ? 'bg-purple-100 text-purple-700' : 'bg-stone-100 text-stone-500'
          }`}>
            {isReal ? '🛰️ Sentinel-2 real' : 'Simulado'}
          </span>
        </div>
        <button onClick={load} disabled={loading} className="text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-40">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <p className="text-[10px] text-stone-400 mb-4">
        {data ? `Imagem de ${new Date(data.sceneDate + 'T12:00').toLocaleDateString('pt-BR')} · ${data.cloudCover}% nuvem · ${data.resolutionM}m/célula` : 'Buscando última cena…'}
      </p>

      {loading && !data ? (
        <div className="aspect-square max-w-xs mx-auto bg-stone-100 rounded-xl animate-pulse" />
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
          {/* Heatmap de variabilidade */}
          <div className="aspect-square rounded-xl overflow-hidden border border-stone-200"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${data.zones[0]?.length ?? 16}, 1fr)`,
              gridTemplateRows: `repeat(${data.zones.length || 16}, 1fr)`,
            }}>
            {data.zones.flat().map((z, i) => (
              <div key={i} style={{ background: z === -1 ? '#e7e5e4' : ZONE_COLORS[z] }} />
            ))}
          </div>

          <div>
            {/* Distribuição por zona */}
            <div className="space-y-2 mb-4">
              {[data.stats.lowPct, data.stats.midPct, data.stats.highPct].map((pct, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: ZONE_COLORS[i] }} />
                  <span className="text-xs text-stone-500 w-12">{ZONE_LABELS[i]}</span>
                  <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ZONE_COLORS[i] }} />
                  </div>
                  <span className="text-xs font-medium text-stone-700 w-9 text-right">{pct}%</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'NDVI médio', value: data.stats.mean },
                { label: 'Mínimo', value: data.stats.min },
                { label: 'Máximo', value: data.stats.max },
              ].map(({ label, value }) => (
                <div key={label} className="bg-stone-50 rounded-lg p-2 text-center">
                  <p className="text-sm font-semibold text-stone-800">{value}</p>
                  <p className="text-[9px] text-stone-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <button onClick={askAI}
              className="w-full flex items-center justify-center gap-2 text-xs font-medium text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 rounded-xl py-2 transition-colors">
              <Bot className="w-3.5 h-3.5" /> Manejar zonas com o AgroAssistente
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-stone-400 py-6 text-center">Dados indisponíveis</p>
      )}

      {data && (
        <p className="text-[9px] text-stone-300 mt-3 text-right">
          {data.source} · cena {data.sceneId} · zonas por tercis de NDVI
        </p>
      )}
    </Card>
  )
}
