'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, BarChart2, Bot } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { DemoProfile } from '@/lib/demo-profiles'

interface IbgeData {
  source: string
  city: { yieldSc: number; areaHa: number }
  stateYieldSc: number
  farmersEst: number
}

function parseStat(value: string): number | null {
  const m = value.match(/[\d,.]+/)
  if (!m) return null
  return parseFloat(m[0].replace(',', '.'))
}

function cropKey(name: string) {
  const n = name.toLowerCase()
  if (n.includes('soja'))    return 'soja'
  if (n.includes('milho'))   return 'milho'
  if (n.includes('algodão') || n.includes('algodao')) return 'algodão'
  return 'soja'
}

interface Props { profile: DemoProfile }

export function RegionalBenchmark({ profile }: Props) {
  const router = useRouter()
  const [ibge, setIbge] = useState<IbgeData | null>(null)
  const [loading, setLoading] = useState(true)

  const primary  = profile.crops[0]
  const crop     = primary ? cropKey(primary.name) : 'soja'
  const { city, state } = profile.farm

  useEffect(() => {
    fetch(`/api/ibge-pam?city=${encodeURIComponent(city)}&state=${state}&crop=${encodeURIComponent(crop)}`)
      .then(r => r.json()).then(setIbge).finally(() => setLoading(false))
  }, [city, state, crop])

  // Profile yield from stats
  const yieldStat  = profile.stats.find(s => s.label.toLowerCase().includes('safra') || s.label.toLowerCase().includes('produt'))
  const myYield    = yieldStat ? parseStat(yieldStat.value) : null
  const ndviStat   = profile.stats.find(s => s.label.toLowerCase().includes('ndvi'))
  const myNdvi     = ndviStat ? parseStat(ndviStat.value) : null

  const regionAvg  = ibge?.city?.yieldSc ?? (ibge?.stateYieldSc ?? 58)
  const yieldDiff  = myYield != null ? +(((myYield - regionAvg) / regionAvg) * 100).toFixed(1) : null
  const ndviRegion = 0.67
  const ndviDiff   = myNdvi != null ? +(((myNdvi - ndviRegion) / ndviRegion) * 100).toFixed(1) : null

  function askAI() {
    const q = `Minha fazenda tem produtividade estimada de ${myYield ?? '—'} sc/ha. A média do município de ${city} é ${regionAvg} sc/ha (IBGE). Como posso melhorar e quais são os principais fatores limitantes?`
    router.push(`/assistente?q=${encodeURIComponent(q)}`)
  }

  const items = [
    { label: 'Produtividade estimada', mine: myYield ? `${myYield} sc/ha` : '—', region: `${regionAvg} sc/ha`, diff: yieldDiff },
    { label: 'NDVI médio lavoura',     mine: myNdvi ? myNdvi.toFixed(2) : '—',  region: ndviRegion.toFixed(2),   diff: ndviDiff },
    { label: 'Área monitorada',        mine: `${profile.farm.hectares.toLocaleString('pt-BR')} ha`, region: `média ${profile.farm.hectares > 200 ? 310 : 85} ha`, diff: null },
  ]

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-stone-400" />
            Benchmark regional
          </h3>
          <p className="text-[10px] text-stone-400 mt-0.5">
            {loading ? 'Carregando dados IBGE…' : `${ibge?.farmersEst?.toLocaleString('pt-BR') ?? '—'} produtores estimados em ${city}`}
          </p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
          ibge?.source?.includes('IBGE PAM')
            ? 'bg-blue-50 text-blue-600 border-blue-200'
            : 'bg-purple-50 text-purple-600 border-purple-200'
        }`}>
          {ibge?.source?.includes('IBGE PAM') ? 'IBGE 2023' : 'Simulado'}
        </span>
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">{item.label}</span>
              {item.diff != null && (
                <span className={`flex items-center gap-0.5 font-semibold ${item.diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {item.diff >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {item.diff >= 0 ? '+' : ''}{item.diff}% vs região
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.diff == null ? 'bg-stone-400' : item.diff >= 0 ? 'bg-green-500' : 'bg-amber-500'}`}
                  style={{ width: item.diff == null ? '60%' : `${Math.min(100, 50 + (item.diff / 2))}%` }}
                />
              </div>
              <div className="flex gap-2 text-[10px] text-stone-500 flex-shrink-0">
                <span className="font-medium text-stone-800">{item.mine}</span>
                <span>·</span>
                <span>média {item.region}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`mt-4 p-3 rounded-xl text-xs ${
        (yieldDiff ?? 0) >= 5 ? 'bg-green-50 border border-green-200 text-green-800'
        : (yieldDiff ?? 0) >= 0 ? 'bg-blue-50 border border-blue-200 text-blue-800'
        : 'bg-amber-50 border border-amber-200 text-amber-800'
      }`}>
        {(yieldDiff ?? 0) >= 5
          ? `✓ Produtividade acima da média de ${city}. Continue monitorando para manter esse diferencial.`
          : (yieldDiff ?? 0) >= 0
          ? `Produtividade alinhada com a média regional. Há espaço para ganhos com manejo de precisão.`
          : `Produtividade abaixo da média de ${city}. Veja com o AgroAssistente o que pode melhorar.`}
      </div>

      <button onClick={askAI} className="w-full mt-3 flex items-center justify-center gap-2 text-xs font-medium text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 rounded-xl py-2 transition-colors">
        <Bot className="w-3.5 h-3.5" />
        Como superar a média regional?
      </button>
    </Card>
  )
}
