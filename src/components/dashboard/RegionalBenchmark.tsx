import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react'
import type { DemoProfile } from '@/lib/demo-profiles'

// Regional benchmarks by state/city — simulated from IBGE/CONAB averages
const BENCHMARKS: Record<string, {
  avgYield: Record<string, number>   // sc/ha by crop type
  avgCost: number                    // R$/ha
  avgNdvi: number
  peers: number                      // farms in region
}> = {
  'PR': {
    avgYield: { soja: 55, milho: 95, trigo: 42 },
    avgCost: 3200,
    avgNdvi: 0.65,
    peers: 1240,
  },
  'MT': {
    avgYield: { soja: 60, milho: 105, algodao: 280, pastagem: 12 },
    avgCost: 3800,
    avgNdvi: 0.68,
    peers: 870,
  },
  'GO': {
    avgYield: { soja: 58, milho: 100, cana: 82 },
    avgCost: 3500,
    avgNdvi: 0.66,
    peers: 620,
  },
  'SP': {
    avgYield: { soja: 54, milho: 92, cana: 85 },
    avgCost: 3900,
    avgNdvi: 0.64,
    peers: 490,
  },
}

function cropKey(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('soja')) return 'soja'
  if (n.includes('milho')) return 'milho'
  if (n.includes('algodão') || n.includes('algodao')) return 'algodao'
  if (n.includes('trigo')) return 'trigo'
  if (n.includes('cana')) return 'cana'
  if (n.includes('pastagem')) return 'pastagem'
  return 'soja'
}

function parseStat(value: string): number | null {
  const m = value.match(/[\d,.]+/)
  if (!m) return null
  return parseFloat(m[0].replace(',', '.'))
}

interface Props {
  profile: DemoProfile
}

export function RegionalBenchmark({ profile }: Props) {
  const bench = BENCHMARKS[profile.farm.state] ?? BENCHMARKS['MT']

  // Pull yield stat from profile.stats
  const yieldStat = profile.stats.find(s =>
    s.label.toLowerCase().includes('safra') || s.label.toLowerCase().includes('produt')
  )
  const myYield   = yieldStat ? parseStat(yieldStat.value) : null
  const ndviStat  = profile.stats.find(s => s.label.toLowerCase().includes('ndvi'))
  const myNdvi    = ndviStat ? parseStat(ndviStat.value) : null

  // Pick primary crop for regional yield avg
  const primary   = profile.crops[0]
  const key       = primary ? cropKey(primary.name) : 'soja'
  const regionAvg = bench.avgYield[key] ?? 58

  // Compute deltas
  const yieldDiff = myYield != null ? +(((myYield - regionAvg) / regionAvg) * 100).toFixed(1) : null
  const ndviDiff  = myNdvi != null ? +(((myNdvi - bench.avgNdvi) / bench.avgNdvi) * 100).toFixed(1) : null

  const items = [
    {
      label: 'Produtividade estimada',
      mine: myYield ? `${myYield} sc/ha` : '—',
      region: `${regionAvg} sc/ha`,
      diff: yieldDiff,
      unit: '%',
    },
    {
      label: 'NDVI médio lavoura',
      mine: myNdvi ? myNdvi.toFixed(2) : '—',
      region: bench.avgNdvi.toFixed(2),
      diff: ndviDiff,
      unit: '%',
    },
    {
      label: 'Área monitorada',
      mine: `${profile.farm.hectares.toLocaleString('pt-BR')} ha`,
      region: `média ${profile.farm.hectares > 200 ? 310 : 85} ha`,
      diff: null,
      unit: '',
    },
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
            Comparativo com {bench.peers.toLocaleString('pt-BR')} produtores de {profile.farm.state}
          </p>
        </div>
        <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full font-medium">
          Simulado
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
                  style={{
                    width: item.diff == null
                      ? '60%'
                      : `${Math.min(100, 50 + (item.diff / 2))}%`,
                  }}
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
          ? `✓ Sua fazenda está entre as mais produtivas de ${profile.farm.city}. Continue monitorando para manter essa posição.`
          : (yieldDiff ?? 0) >= 0
          ? `Produtividade alinhada com a média regional. Há espaço para ganhos com manejo de precisão.`
          : `Produtividade abaixo da média regional. O AgroAssistente pode sugerir melhorias específicas para sua lavoura.`
        }
      </div>
    </Card>
  )
}
