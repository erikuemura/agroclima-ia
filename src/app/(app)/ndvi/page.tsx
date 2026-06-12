'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Satellite } from 'lucide-react'
import { FIELDS, NDVI_COLOR, NDVI_LABEL } from '@/lib/fields-data'
import { NdviZonesCard } from '@/components/dashboard/NdviZonesCard'
import { getDemoProfileClient } from '@/lib/demo-profiles'

// Série temporal NDVI simulada (12 meses)
const NDVI_HISTORY: Record<string, { month: string; ndvi: number; prev: number }[]> = {
  t1: [
    { month: 'Jul/25', ndvi: 0.18, prev: 0.19 },
    { month: 'Ago/25', ndvi: 0.22, prev: 0.20 },
    { month: 'Set/25', ndvi: 0.31, prev: 0.28 },
    { month: 'Out/25', ndvi: 0.48, prev: 0.45 },
    { month: 'Nov/25', ndvi: 0.62, prev: 0.60 },
    { month: 'Dez/25', ndvi: 0.71, prev: 0.68 },
    { month: 'Jan/26', ndvi: 0.79, prev: 0.76 },
    { month: 'Fev/26', ndvi: 0.76, prev: 0.78 },
    { month: 'Mar/26', ndvi: 0.69, prev: 0.72 },
    { month: 'Abr/26', ndvi: 0.55, prev: 0.58 },
    { month: 'Mai/26', ndvi: 0.42, prev: 0.44 },
    { month: 'Jun/26', ndvi: 0.74, prev: 0.70 },
  ],
  t2: [
    { month: 'Jul/25', ndvi: 0.15, prev: 0.16 },
    { month: 'Ago/25', ndvi: 0.17, prev: 0.18 },
    { month: 'Set/25', ndvi: 0.20, prev: 0.21 },
    { month: 'Out/25', ndvi: 0.24, prev: 0.25 },
    { month: 'Nov/25', ndvi: 0.28, prev: 0.30 },
    { month: 'Dez/25', ndvi: 0.31, prev: 0.33 },
    { month: 'Jan/26', ndvi: 0.33, prev: 0.36 },
    { month: 'Fev/26', ndvi: 0.30, prev: 0.34 },
    { month: 'Mar/26', ndvi: 0.28, prev: 0.31 },
    { month: 'Abr/26', ndvi: 0.26, prev: 0.29 },
    { month: 'Mai/26', ndvi: 0.24, prev: 0.27 },
    { month: 'Jun/26', ndvi: 0.32, prev: 0.29 },
  ],
  t3: [
    { month: 'Jul/25', ndvi: 0.10, prev: 0.14 },
    { month: 'Ago/25', ndvi: 0.10, prev: 0.13 },
    { month: 'Set/25', ndvi: 0.11, prev: 0.14 },
    { month: 'Out/25', ndvi: 0.10, prev: 0.15 },
    { month: 'Nov/25', ndvi: 0.09, prev: 0.14 },
    { month: 'Dez/25', ndvi: 0.11, prev: 0.13 },
    { month: 'Jan/26', ndvi: 0.10, prev: 0.13 },
    { month: 'Fev/26', ndvi: 0.11, prev: 0.12 },
    { month: 'Mar/26', ndvi: 0.10, prev: 0.13 },
    { month: 'Abr/26', ndvi: 0.10, prev: 0.12 },
    { month: 'Mai/26', ndvi: 0.11, prev: 0.12 },
    { month: 'Jun/26', ndvi: 0.12, prev: 0.13 },
  ],
}

const ANOMALIES = [
  { fieldId: 't1', zone: 'Setor NE', area: '12 ha', description: 'NDVI abaixo de 0.5 — possível compactação ou deficiência hídrica localizada', severity: 'moderate' as const },
  { fieldId: 't2', zone: 'Toda a área', area: '180 ha', description: 'NDVI consistentemente baixo desde o plantio — verificar stand e fertilidade', severity: 'high' as const },
  { fieldId: 't3', zone: 'Toda a área', area: '95 ha', description: 'Sem cobertura vegetal ativa — talhão sem cultura plantada', severity: 'info' as const },
]

const anomalySeverityStyle = {
  high:     'bg-red-50 border-red-200',
  moderate: 'bg-amber-50 border-amber-200',
  info:     'bg-blue-50 border-blue-200',
}

export default function NdviPage() {
  const profile = getDemoProfileClient()
  const [selectedField, setSelectedField] = useState('t1')
  const field = FIELDS.find(f => f.id === selectedField)!
  const history = NDVI_HISTORY[selectedField]
  const fieldAnomalies = ANOMALIES.filter(a => a.fieldId === selectedField)
  const maxNdvi = 1.0
  const chartH = 120

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
                  const isAnomaly = selectedField === 't1' && row < 3 && col > 7
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
