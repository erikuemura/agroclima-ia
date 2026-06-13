'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Satellite } from 'lucide-react'
import { fieldsFromProfile, NDVI_COLOR, NDVI_LABEL, type Field } from '@/lib/fields-data'
import { NdviZonesCard } from '@/components/dashboard/NdviZonesCard'
import { getDemoProfileClient } from '@/lib/demo-profiles'

// Histórico NDVI de 12 meses gerado por talhão: curva sazonal que termina
// no NDVI atual do talhão; "safra anterior" = mesma curva com leve variação.
function buildHistory(field: Field): { month: string; ndvi: number; prev: number }[] {
  const now = new Date()
  const MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const out: { month: string; ndvi: number; prev: number }[] = []
  for (let k = 11; k >= 0; k--) {
    const d = new Date(now.getFullYear(), now.getMonth() - k, 1)
    const monthsAgo = k
    // curva: cresce até ~3 meses atrás e converge ao NDVI atual no mês 0
    const seasonal = Math.sin(((11 - monthsAgo) / 11) * Math.PI) // 0→1→0
    const target = field.ndvi
    const ndvi = +Math.max(0.08, Math.min(0.92, target * (0.45 + 0.55 * seasonal) + (monthsAgo === 0 ? 0 : 0))).toFixed(2)
    const finalNdvi = monthsAgo === 0 ? target : ndvi
    const jitter = (Math.sin(monthsAgo * 7.3 + field.hectares) * 0.05)
    out.push({
      month: `${MES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
      ndvi: finalNdvi,
      prev: +Math.max(0.08, Math.min(0.92, finalNdvi - 0.03 + jitter)).toFixed(2),
    })
  }
  return out
}

interface Anomaly { fieldId: string; zone: string; area: string; description: string; severity: 'high' | 'moderate' | 'info' }

function buildAnomalies(fields: Field[]): Anomaly[] {
  const out: Anomaly[] = []
  for (const f of fields) {
    if (f.ndviStatus === 'critico') {
      out.push({ fieldId: f.id, zone: 'Toda a área', area: `${f.hectares} ha`, description: `NDVI ${f.ndvi.toFixed(2)} — cobertura vegetal muito baixa. Verifique stand, plantio ou se o talhão está em pousio.`, severity: 'high' })
    } else if (f.ndviStatus === 'baixo') {
      out.push({ fieldId: f.id, zone: 'Setor com estresse', area: `~${Math.round(f.hectares * 0.2)} ha`, description: `NDVI ${f.ndvi.toFixed(2)} — possível déficit hídrico, compactação ou deficiência nutricional localizada. Recomenda-se vistoria.`, severity: 'moderate' })
    }
  }
  return out
}

const anomalySeverityStyle = {
  high:     'bg-red-50 border-red-200',
  moderate: 'bg-amber-50 border-amber-200',
  info:     'bg-blue-50 border-blue-200',
}

export default function NdviPage() {
  const profile = getDemoProfileClient()
  const FIELDS = useMemo(() => fieldsFromProfile(profile), [profile])
  const anomalies = useMemo(() => buildAnomalies(FIELDS), [FIELDS])
  const [selectedField, setSelectedField] = useState(FIELDS[0]?.id ?? '')
  const field = FIELDS.find(f => f.id === selectedField) ?? FIELDS[0]
  const history = useMemo(() => field ? buildHistory(field) : [], [field])
  const fieldAnomalies = anomalies.filter(a => a.fieldId === selectedField)
  const chartH = 120

  if (!field) {
    return (
      <div className="max-w-5xl">
        <h1 className="text-lg font-semibold text-stone-800">NDVI & satélite</h1>
        <p className="text-sm text-stone-400 mt-2">Cadastre uma cultura para ver o monitoramento por satélite dos seus talhões.</p>
      </div>
    )
  }

  const last = history[history.length - 1]
  const prev = history[history.length - 2]
  const trend = last.ndvi - prev.ndvi
  const TrendIcon = trend > 0.02 ? TrendingUp : trend < -0.02 ? TrendingDown : Minus
  const trendColor = trend > 0.02 ? 'text-green-600' : trend < -0.02 ? 'text-red-500' : 'text-stone-400'

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-stone-800">NDVI & satélite</h1>
          <p className="text-sm text-stone-400 mt-0.5">Índice de vegetação por diferença normalizada · Sentinel-2 · 10m</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-400 bg-stone-100 rounded-lg px-3 py-1.5">
          <Satellite className="w-3.5 h-3.5" />
          Última imagem: 08 jun 2026
        </div>
      </div>

      {/* Zonas de produtividade — Sentinel-2 real */}
      <NdviZonesCard lat={profile.farm.lat} lon={profile.farm.lon} />

      {/* Seletor de talhão */}
      <div className="flex gap-2 flex-wrap">
        {FIELDS.map(f => (
          <button
            key={f.id}
            onClick={() => setSelectedField(f.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors',
              selectedField === f.id ? 'bg-stone-800 text-white border-stone-800' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            )}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: NDVI_COLOR[f.ndviStatus] }} />
            {f.name}
            <span className="opacity-70">NDVI {f.ndvi.toFixed(2)}</span>
          </button>
        ))}
      </div>

      {/* Cards de indicadores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-stone-100 rounded-xl p-4">
          <p className="text-xs text-stone-500 mb-1.5">NDVI atual</p>
          <p className="text-2xl font-semibold text-stone-800">{field.ndvi.toFixed(2)}</p>
          <div className={cn('flex items-center gap-1 text-xs mt-0.5', trendColor)}>
            <TrendIcon className="w-3 h-3" />
            {trend > 0 ? '+' : ''}{trend.toFixed(2)} vs mês ant.
          </div>
        </div>
        <div className="bg-stone-100 rounded-xl p-4">
          <p className="text-xs text-stone-500 mb-1.5">Status vegetação</p>
          <p className="text-lg font-semibold text-stone-800">{NDVI_LABEL[field.ndviStatus]}</p>
          <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right,#ef4444,#f97316,#eab308,#22c55e,#15803d)' }}>
            <div className="h-full w-1 bg-white border border-stone-400 rounded-full" style={{ marginLeft: `calc(${field.ndvi * 100}% - 4px)` }} />
          </div>
        </div>
        <div className="bg-stone-100 rounded-xl p-4">
          <p className="text-xs text-stone-500 mb-1.5">Safra anterior</p>
          <p className="text-2xl font-semibold text-stone-800">{last.prev.toFixed(2)}</p>
          <p className={cn('text-xs mt-0.5', last.ndvi >= last.prev ? 'text-green-600' : 'text-red-500')}>
            {last.ndvi >= last.prev ? '↑ Acima' : '↓ Abaixo'} da média histórica
          </p>
        </div>
        <div className="bg-stone-100 rounded-xl p-4">
          <p className="text-xs text-stone-500 mb-1.5">Área monitorada</p>
          <p className="text-2xl font-semibold text-stone-800">{field.hectares} ha</p>
          <p className="text-xs text-stone-400 mt-0.5">{field.soilType}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico de série temporal */}
        <Card className="col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-stone-700">Evolução NDVI — 12 meses</h3>
            <div className="flex gap-3 text-xs text-stone-400">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block rounded" /> {field.name}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-stone-300 inline-block rounded border-dashed border-t border-stone-300" /> Safra anterior</span>
            </div>
          </div>
          <div className="relative" style={{ height: `${chartH + 24}px` }}>
            <svg width="100%" height={chartH} viewBox={`0 0 ${history.length * 50} ${chartH}`} preserveAspectRatio="none" className="overflow-visible">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map(v => (
                <line key={v} x1={0} x2={history.length * 50} y1={chartH - v * chartH} y2={chartH - v * chartH}
                  stroke="#e7e5e4" strokeWidth="1" />
              ))}
              {/* Previous season line */}
              <polyline
                points={history.map((d, i) => `${i * 50 + 25},${chartH - d.prev * chartH}`).join(' ')}
                fill="none" stroke="#d6d3d1" strokeWidth="1.5" strokeDasharray="4,3"
              />
              {/* Current season area fill */}
              <polygon
                points={[
                  ...history.map((d, i) => `${i * 50 + 25},${chartH - d.ndvi * chartH}`),
                  `${(history.length - 1) * 50 + 25},${chartH}`,
                  `25,${chartH}`,
                ].join(' ')}
                fill="#22c55e" fillOpacity="0.1"
              />
              {/* Current season line */}
              <polyline
                points={history.map((d, i) => `${i * 50 + 25},${chartH - d.ndvi * chartH}`).join(' ')}
                fill="none" stroke="#22c55e" strokeWidth="2"
              />
              {/* Dots */}
              {history.map((d, i) => (
                <circle key={i} cx={i * 50 + 25} cy={chartH - d.ndvi * chartH} r="3"
                  fill={i === history.length - 1 ? '#22c55e' : '#fff'} stroke="#22c55e" strokeWidth="2" />
              ))}
            </svg>
            {/* X labels */}
            <div className="flex mt-1">
              {history.map(d => (
                <div key={d.month} className="flex-1 text-center text-[9px] text-stone-400">{d.month}</div>
              ))}
            </div>
          </div>
          {/* Y labels */}
          <div className="flex justify-between text-[9px] text-stone-400 mt-1">
            <span>0.0</span><span>0.25</span><span>0.50</span><span>0.75</span><span>1.0</span>
          </div>
        </Card>

        {/* Anomalias + mapa de calor simulado */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-medium text-stone-700 mb-3">Mapa de zonas NDVI</h3>
            {/* Simulação visual de mapa de calor */}
            <div className="rounded-lg overflow-hidden mb-3 border border-stone-100">
              <div className="grid grid-cols-10 grid-rows-8">
                {Array.from({ length: 80 }).map((_, i) => {
                  const row = Math.floor(i / 10)
                  const col = i % 10
                  const isAnomaly = (field.ndviStatus === 'baixo' || field.ndviStatus === 'critico') && row < 3 && col > 7
                  const base = field.ndvi
                  const noise = (Math.sin(i * 13.7) * 0.12)
                  const val = isAnomaly ? 0.3 : Math.max(0.05, Math.min(0.95, base + noise))
                  const r = Math.round(239 - val * 200)
                  const g = Math.round(68 + val * 130)
                  const b = Math.round(68 - val * 50)
                  return <div key={i} style={{ background: `rgb(${r},${g},${b})`, height: '14px' }} />
                })}
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-400">
              <span>Baixo NDVI</span>
              <div className="h-2 flex-1 mx-2 rounded-full" style={{ background: 'linear-gradient(to right,#ef4444,#eab308,#22c55e)' }} />
              <span>Alto NDVI</span>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-medium text-stone-700 mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Anomalias detectadas
            </h3>
            {fieldAnomalies.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-4">Sem anomalias neste talhão</p>
            ) : (
              <div className="space-y-2">
                {fieldAnomalies.map((a, i) => (
                  <div key={i} className={cn('p-3 rounded-lg border text-xs', anomalySeverityStyle[a.severity])}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-stone-800">{a.zone}</span>
                      <span className="text-stone-400">{a.area}</span>
                    </div>
                    <p className="text-stone-600 leading-relaxed">{a.description}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
