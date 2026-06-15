'use client'

import { useMemo, useState } from 'react'
import { Sprout } from 'lucide-react'
import { plantingRate } from '@/lib/agro-calc'
import { ToolCTA } from '@/components/site/ToolCTA'

// Presets comuns por cultura (população final desejada plantas/ha, espaçamento cm, PMS g)
const PRESETS: Record<string, { pop: number; row: number; pms: number; bag: number }> = {
  Soja:    { pop: 300_000, row: 50, pms: 180, bag: 360_000 }, // saco 60kg ≈ 360k sementes
  Milho:   { pop: 65_000,  row: 50, pms: 330, bag: 60_000 },  // saco 60k sementes
  Algodão: { pop: 100_000, row: 76, pms: 110, bag: 0 },
  Feijão:  { pop: 240_000, row: 45, pms: 220, bag: 0 },
}

export function PopulacaoTool() {
  const [culture, setCulture] = useState('Soja')
  const preset = PRESETS[culture]
  const [pop, setPop] = useState(preset.pop)
  const [row, setRow] = useState(preset.row)
  const [germ, setGerm] = useState(90)
  const [emerg, setEmerg] = useState(95)
  const [pms, setPms] = useState(preset.pms)
  const [area, setArea] = useState(100)

  const result = useMemo(
    () => plantingRate(pop, row, germ, emerg, area, pms || undefined, PRESETS[culture].bag || undefined),
    [pop, row, germ, emerg, area, pms, culture]
  )

  function selectCulture(c: string) {
    setCulture(c)
    setPop(PRESETS[c].pop); setRow(PRESETS[c].row); setPms(PRESETS[c].pms)
  }

  const inputCls = 'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-medium text-stone-600 block mb-1">Cultura</label>
          <select value={culture} onChange={e => selectCulture(e.target.value)} className={inputCls}>
            {Object.keys(PRESETS).map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600 block mb-1">População final (plantas/ha)</label>
          <input type="number" value={pop} onChange={e => setPop(+e.target.value || 0)} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600 block mb-1">Espaçamento entre linhas (cm)</label>
          <input type="number" value={row} onChange={e => setRow(+e.target.value || 0)} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600 block mb-1">Germinação (%)</label>
          <input type="number" min={1} max={100} value={germ} onChange={e => setGerm(+e.target.value || 0)} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600 block mb-1">Emergência a campo (%)</label>
          <input type="number" min={1} max={100} value={emerg} onChange={e => setEmerg(+e.target.value || 0)} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600 block mb-1">PMS — peso de mil sementes (g)</label>
          <input type="number" value={pms} onChange={e => setPms(+e.target.value || 0)} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600 block mb-1">Área (hectares)</label>
          <input type="number" min={1} value={area} onChange={e => setArea(+e.target.value || 0)} className={inputCls} />
        </div>
      </div>

      <div className="rounded-2xl bg-green-800 text-white p-6">
        <p className="text-xs text-green-200 flex items-center gap-1.5 mb-1"><Sprout className="w-3.5 h-3.5" /> Sementes a semear</p>
        <p className="text-4xl font-semibold">{result.seedsPerMeter} <span className="text-xl font-normal">sementes/metro</span></p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-green-700 text-sm">
          <div><p className="text-xs text-green-300">Por hectare</p><p className="font-medium">{result.seedsPerHa.toLocaleString('pt-BR')}</p></div>
          {result.kgPerHa != null && <div><p className="text-xs text-green-300">Por hectare (kg)</p><p className="font-medium">{result.kgPerHa} kg/ha</p></div>}
          <div><p className="text-xs text-green-300">Total no campo</p><p className="font-medium">{(result.seedsTotal / 1_000_000).toFixed(1)} mi</p></div>
          {result.bagsNeeded != null && <div><p className="text-xs text-green-300">Sacos de semente</p><p className="font-medium">{result.bagsNeeded}</p></div>}
        </div>
      </div>

      <p className="text-xs text-stone-400 leading-relaxed">
        Sementes/ha = população desejada ÷ (germinação × emergência). Ajuste germinação e emergência conforme o lote e as condições do plantio.
      </p>

      <ToolCTA tool="populacao-de-plantas" headline="Planeje plantio, insumos e custos no CampoClima" />
    </div>
  )
}
