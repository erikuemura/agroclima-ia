'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { FieldPanel } from '@/components/fields/FieldPanel'
import { fieldsFromProfile, NDVI_COLOR, NDVI_LABEL } from '@/lib/fields-data'
import { getDemoProfileClient } from '@/lib/demo-profiles'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const FieldMap = dynamic(
  () => import('@/components/fields/FieldMap').then(m => m.FieldMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-stone-100 rounded-xl animate-pulse" /> }
)

const statusBg: Record<string, string> = {
  critico: 'bg-red-100 text-red-800',
  baixo: 'bg-orange-100 text-orange-800',
  normal: 'bg-yellow-100 text-yellow-800',
  bom: 'bg-green-100 text-green-800',
  otimo: 'bg-emerald-100 text-emerald-800',
}

export default function TalhoesPage() {
  const FIELDS = useMemo(() => fieldsFromProfile(getDemoProfileClient()), [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedField = FIELDS.find(f => f.id === selectedId) ?? null
  const totalHa = FIELDS.reduce((a, f) => a + f.hectares, 0)

  return (
    <div className="flex flex-col h-full gap-4" style={{ height: 'calc(100vh - 112px)' }}>
      {/* Header + stats */}
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-stone-800">Talhões & mapa</h1>
          <p className="text-sm text-stone-400 mt-0.5">{FIELDS.length} talhões · {totalHa} ha total</p>
        </div>
        <div className="flex gap-2">
          {FIELDS.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedId(f.id === selectedId ? null : f.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                selectedId === f.id
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              )}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: NDVI_COLOR[f.ndviStatus] }}
              />
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* Legenda NDVI */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-stone-400">NDVI:</span>
        {(Object.entries(NDVI_COLOR) as [string, string][]).map(([key, color]) => (
          <span key={key} className="flex items-center gap-1 text-xs text-stone-500">
            <span className="w-3 h-3 rounded-sm" style={{ background: color }} />
            {NDVI_LABEL[key as keyof typeof NDVI_LABEL]}
          </span>
        ))}
      </div>

      {/* Mapa + painel */}
      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 min-h-0">
          <FieldMap
            fields={FIELDS}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        <div className="w-72 flex-shrink-0 min-h-0">
          <FieldPanel field={selectedField} />
        </div>
      </div>

      {/* Lista de talhões */}
      <div className="flex gap-3 flex-shrink-0">
        {FIELDS.map(f => (
          <button
            key={f.id}
            onClick={() => setSelectedId(f.id === selectedId ? null : f.id)}
            className={cn(
              'flex-1 p-3 rounded-xl border text-left transition-colors',
              selectedId === f.id
                ? 'border-stone-400 bg-stone-100'
                : 'border-stone-200 bg-white hover:bg-stone-50'
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-stone-700">{f.name}</span>
              <Badge className={cn('text-[10px] px-1.5', statusBg[f.ndviStatus])}>
                {NDVI_LABEL[f.ndviStatus]}
              </Badge>
            </div>
            <p className="text-xs text-stone-400">{f.cropEmoji} {f.cropName ?? 'Sem cultura'}</p>
            <p className="text-xs text-stone-400">{f.hectares} ha · NDVI {f.ndvi.toFixed(2)}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
