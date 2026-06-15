'use client'

import { useEffect, useMemo, useState } from 'react'
import { Wallet, TrendingUp } from 'lucide-react'
import { harvestValue } from '@/lib/agro-calc'
import { formatBRLFull, formatBRL } from '@/lib/finance'
import { ToolCTA } from '@/components/site/ToolCTA'

const CROPS = [
  { id: 'soja', label: 'Soja', unit: 'sc/ha', defaultYield: 60, priceLabel: 'R$/saca' },
  { id: 'milho', label: 'Milho', unit: 'sc/ha', defaultYield: 100, priceLabel: 'R$/saca' },
  { id: 'boi', label: 'Boi gordo', unit: '@/ha', defaultYield: 18, priceLabel: 'R$/arroba' },
]

export function ValorSafraTool() {
  const [crop, setCrop] = useState(CROPS[0])
  const [area, setArea] = useState(100)
  const [yieldPerHa, setYieldPerHa] = useState(60)
  const [price, setPrice] = useState(0)
  const [priceSource, setPriceSource] = useState('')

  // Puxa a cotação real do dia
  useEffect(() => {
    fetch('/api/commodities').then(r => r.json()).then(d => {
      const c = d.commodities?.find((x: { id: string; price: number }) => x.id === crop.id)
      if (c) { setPrice(+c.price.toFixed(2)); setPriceSource(`cotação de hoje · ${new Date(d.updatedAt).toLocaleDateString('pt-BR')}`) }
    }).catch(() => {})
  }, [crop.id])

  const result = useMemo(() => harvestValue(area, yieldPerHa, price), [area, yieldPerHa, price])

  function selectCrop(id: string) {
    const c = CROPS.find(x => x.id === id)!
    setCrop(c)
    setYieldPerHa(c.defaultYield)
  }

  const inputCls = 'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-stone-600 block mb-1">Cultura</label>
          <select value={crop.id} onChange={e => selectCrop(e.target.value)} className={inputCls}>
            {CROPS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600 block mb-1">Área ({crop.id === 'boi' ? 'ha de pasto' : 'hectares'})</label>
          <input type="number" min={1} value={area} onChange={e => setArea(+e.target.value || 0)} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600 block mb-1">Produtividade ({crop.unit})</label>
          <input type="number" min={0} value={yieldPerHa} onChange={e => setYieldPerHa(+e.target.value || 0)} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600 block mb-1">Preço ({crop.priceLabel})</label>
          <input type="number" min={0} step="0.01" value={price} onChange={e => setPrice(+e.target.value || 0)} className={inputCls} />
          {priceSource && <p className="text-[10px] text-green-600 mt-1">✓ {priceSource} (editável)</p>}
        </div>
      </div>

      {/* Resultado */}
      <div className="rounded-2xl bg-green-800 text-white p-6">
        <p className="text-xs text-green-200 flex items-center gap-1.5 mb-1"><Wallet className="w-3.5 h-3.5" /> Valor bruto estimado da produção</p>
        <p className="text-4xl font-semibold">{formatBRLFull(result.grossValue)}</p>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-green-700">
          <div>
            <p className="text-xs text-green-300">Produção total</p>
            <p className="text-lg font-medium">{result.totalBags.toLocaleString('pt-BR')} {crop.id === 'boi' ? '@' : 'sc'}</p>
          </div>
          <div>
            <p className="text-xs text-green-300">Por hectare</p>
            <p className="text-lg font-medium">{formatBRL(result.perHa)}/ha</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-stone-400 flex items-start gap-1.5">
        <TrendingUp className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        Estimativa de receita bruta (sem descontar custos). Cotações de referência CEPEA/ESALQ — valores reais variam por região, classificação e momento de venda.
      </p>

      <ToolCTA tool="valor-da-safra" headline="Acompanhe o valor da sua safra em tempo real" />
    </div>
  )
}
