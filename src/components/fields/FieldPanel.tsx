import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Field } from '@/lib/fields-data'
import { NDVI_COLOR, NDVI_LABEL } from '@/lib/fields-data'
import { cn } from '@/lib/utils'
import { Layers, Sprout, FlaskConical, TrendingUp } from 'lucide-react'

interface Props {
  field: Field | null
}

const statusBg: Record<string, string> = {
  critico: 'bg-red-100 text-red-800',
  baixo:   'bg-orange-100 text-orange-800',
  normal:  'bg-yellow-100 text-yellow-800',
  bom:     'bg-green-100 text-green-800',
  otimo:   'bg-emerald-100 text-emerald-800',
}

export function FieldPanel({ field }: Props) {
  if (!field) {
    return (
      <Card className="p-5 flex flex-col items-center justify-center h-full text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
          <Layers className="w-6 h-6 text-stone-400" />
        </div>
        <p className="text-sm text-stone-400">Clique em um talhão no mapa para ver os detalhes</p>
      </Card>
    )
  }

  const ndviPct = Math.round(field.ndvi * 100)

  return (
    <Card className="p-5 flex flex-col gap-4 h-full overflow-y-auto">
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="text-sm font-semibold text-stone-800">{field.name}</h3>
          <Badge className={cn('text-xs', statusBg[field.ndviStatus])}>
            NDVI {NDVI_LABEL[field.ndviStatus]}
          </Badge>
        </div>
        <p className="text-xs text-stone-400">{field.soilType} · {field.hectares} ha</p>
      </div>

      {/* Cultura */}
      <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center text-lg flex-shrink-0">
          {field.cropEmoji ?? '🟫'}
        </div>
        <div>
          <p className="text-xs text-stone-400">Cultura</p>
          <p className="text-sm font-medium text-stone-800">
            {field.cropName ?? 'Sem cultura vinculada'}
          </p>
        </div>
      </div>

      {/* NDVI */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-medium text-stone-600 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Índice NDVI
          </p>
          <span className="text-xs font-semibold text-stone-800">{field.ndvi.toFixed(2)}</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right,#ef4444,#f97316,#eab308,#22c55e,#15803d)' }}>
          <div
            className="h-full w-1 rounded-full bg-white border border-stone-400 -mt-0"
            style={{ marginLeft: `calc(${ndviPct}% - 4px)` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-stone-400 mt-1">
          <span>0 estresse</span><span>1.0 máximo</span>
        </div>
        {field.ndviStatus === 'critico' || field.ndviStatus === 'baixo' ? (
          <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-2.5 py-1.5 rounded-lg">
            ⚠ Recomenda-se vistoria no campo
          </p>
        ) : (
          <p className="text-xs text-green-600 mt-2 bg-green-50 px-2.5 py-1.5 rounded-lg">
            ✓ Cobertura vegetal satisfatória
          </p>
        )}
      </div>

      {/* Solo e ações */}
      <div className="space-y-2">
        <div className="flex items-center justify-between py-2 border-b border-stone-100 text-sm">
          <span className="text-stone-500 flex items-center gap-1.5"><FlaskConical className="w-3.5 h-3.5" /> Solo</span>
          <span className="font-medium text-stone-800 text-xs">{field.soilType}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-stone-100 text-sm">
          <span className="text-stone-500 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Área</span>
          <span className="font-medium text-stone-800">{field.hectares} ha</span>
        </div>
        <div className="flex items-center justify-between py-2 text-sm">
          <span className="text-stone-500 flex items-center gap-1.5"><Sprout className="w-3.5 h-3.5" /> Última imagem</span>
          <span className="font-medium text-stone-800 text-xs">08 jun 2026</span>
        </div>
      </div>

      <button className="w-full text-xs text-green-700 border border-green-200 rounded-lg py-2 hover:bg-green-50 transition-colors mt-auto">
        Analisar solo deste talhão →
      </button>
    </Card>
  )
}
