'use client'

import { useMemo, useState } from 'react'
import { FlaskConical, CheckCircle2 } from 'lucide-react'
import { limingNeed, TARGET_V } from '@/lib/agro-calc'
import { ToolCTA } from '@/components/site/ToolCTA'

const CULTURES = Object.keys(TARGET_V)

export function CalagemTool() {
  const [culture, setCulture] = useState('soja')
  const [vCurrent, setVCurrent] = useState(40)
  const [ctc, setCtc] = useState(8)
  const [prnt, setPrnt] = useState(85)
  const [area, setArea] = useState(100)

  const vTarget = TARGET_V[culture] ?? 60
  const result = useMemo(() => limingNeed(vCurrent, vTarget, ctc, prnt, area), [vCurrent, vTarget, ctc, prnt, area])

  const inputCls = 'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-stone-600 block mb-1">Cultura (define a saturação-alvo)</label>
          <select value={culture} onChange={e => setCulture(e.target.value)} className={inputCls}>
            {CULTURES.map(c => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)} (V {TARGET_V[c]}%)</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600 block mb-1">Saturação por bases ATUAL — V% (da análise de solo)</label>
          <input type="number" min={0} max={100} value={vCurrent} onChange={e => setVCurrent(+e.target.value || 0)} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600 block mb-1">CTC a pH 7 (T) — cmolc/dm³</label>
          <input type="number" min={0} step="0.1" value={ctc} onChange={e => setCtc(+e.target.value || 0)} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600 block mb-1">PRNT do calcário (%)</label>
          <input type="number" min={1} max={100} value={prnt} onChange={e => setPrnt(+e.target.value || 0)} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600 block mb-1">Área a corrigir (hectares)</label>
          <input type="number" min={1} value={area} onChange={e => setArea(+e.target.value || 0)} className={inputCls} />
        </div>
      </div>

      {/* Resultado */}
      {result.status === 'desnecessario' ? (
        <div className="rounded-2xl bg-blue-50 border border-blue-200 p-6">
          <p className="flex items-center gap-2 text-blue-800 font-medium"><CheckCircle2 className="w-5 h-5" /> Calagem não necessária</p>
          <p className="text-sm text-blue-700 mt-1.5">A saturação atual ({vCurrent}%) já atinge ou supera a recomendada para {culture} ({vTarget}%). Reavalie na próxima análise de solo.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-green-800 text-white p-6">
          <p className="text-xs text-green-200 flex items-center gap-1.5 mb-1"><FlaskConical className="w-3.5 h-3.5" /> Necessidade de calcário</p>
          <p className="text-4xl font-semibold">{result.tonsPerHa} <span className="text-xl font-normal">t/ha</span></p>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-green-700">
            <div>
              <p className="text-xs text-green-300">Total para {area} ha</p>
              <p className="text-lg font-medium">{result.totalTons.toLocaleString('pt-BR')} toneladas</p>
            </div>
            <div>
              <p className="text-xs text-green-300">Elevar V de {vCurrent}% → {vTarget}%</p>
              <p className="text-lg font-medium">cultura: {culture}</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-stone-400 leading-relaxed">
        Método da saturação por bases: NC (t/ha) = ((V₂ − V₁) × CTC) / PRNT. Estimativa para camada de 0–20 cm.
        Para dose definitiva, siga o laudo do seu agrônomo com a análise de solo completa.
      </p>

      <ToolCTA tool="calagem" headline="Análise de solo com laudo de IA na sua fazenda" />
    </div>
  )
}
