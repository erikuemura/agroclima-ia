'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import {
  Wallet, TrendingUp, PiggyBank, Plus, Trash2, Check, Bot, Share2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getDemoProfileClient } from '@/lib/demo-profiles'
import {
  pricesFromApi, revenueEstimate, totalProductionValue, matchCommodity,
  alertSavingEstimate, formatBRL, formatBRLFull, DEFAULT_YIELD_SC,
  type CommodityPrices,
} from '@/lib/finance'

interface CostEntry {
  id: string
  field: string
  item: string
  value: number
  date: string
}

const COSTS_KEY = 'campoclima_costs'
const FOLLOWED_KEY = 'campoclima_followed_alerts'

export default function FinanceiroPage() {
  const router = useRouter()
  const profile = getDemoProfileClient()

  const [prices, setPrices] = useState<CommodityPrices | null>(null)
  const [sellPct, setSellPct] = useState(30)
  const [targetPrice, setTargetPrice] = useState<number | null>(null)
  const [costs, setCosts] = useState<CostEntry[]>([])
  const [followed, setFollowed] = useState<Record<string, number>>({})
  const [newCost, setNewCost] = useState({ field: '', item: '', value: '' })

  useEffect(() => {
    fetch('/api/commodities').then(r => r.json()).then(d => {
      const p = pricesFromApi(d)
      setPrices(p)
      setTargetPrice(t => t ?? +(p.soja * 1.08).toFixed(2))
    }).catch(() => {})
    try {
      setCosts(JSON.parse(localStorage.getItem(COSTS_KEY) ?? '[]'))
      setFollowed(JSON.parse(localStorage.getItem(FOLLOWED_KEY) ?? '{}'))
    } catch { /* primeiro acesso */ }
  }, [])

  const mainCrop = profile.crops.find(c => matchCommodity(c.name)) ?? profile.crops[0]
  const commodity = mainCrop ? matchCommodity(mainCrop.name) : null
  const currentPrice = commodity && prices ? prices[commodity] ?? 0 : 0
  const yieldSc = commodity ? DEFAULT_YIELD_SC[commodity] ?? 60 : 60
  const totalSc = mainCrop ? Math.round(mainCrop.hectares * yieldSc) : 0

  const totalValue = prices ? totalProductionValue(profile.crops, prices) : 0

  // Simulador: vender X% hoje vs no preço-alvo
  const sim = useMemo(() => {
    if (!prices || !mainCrop || !currentPrice || !targetPrice) return null
    const scToSell = Math.round(totalSc * (sellPct / 100))
    const sellNow = Math.round(scToSell * currentPrice)
    const sellTarget = Math.round(scToSell * targetPrice)
    return { scToSell, sellNow, sellTarget, diff: sellTarget - sellNow }
  }, [prices, mainCrop, currentPrice, targetPrice, sellPct, totalSc])

  // Custos por talhão
  const totalCosts = costs.reduce((s, c) => s + c.value, 0)
  const costByField = useMemo(() => {
    const map = new Map<string, number>()
    costs.forEach(c => map.set(c.field, (map.get(c.field) ?? 0) + c.value))
    return [...map.entries()]
  }, [costs])

  function addCost() {
    const value = parseFloat(newCost.value.replace(',', '.'))
    if (!newCost.field || !newCost.item || !value) return
    const entry: CostEntry = {
      id: String(Date.now()),
      field: newCost.field,
      item: newCost.item,
      value,
      date: new Date().toISOString().slice(0, 10),
    }
    const next = [entry, ...costs]
    setCosts(next)
    localStorage.setItem(COSTS_KEY, JSON.stringify(next))
    setNewCost({ field: '', item: '', value: '' })
  }

  function removeCost(id: string) {
    const next = costs.filter(c => c.id !== id)
    setCosts(next)
    localStorage.setItem(COSTS_KEY, JSON.stringify(next))
  }

  // Economia por alertas seguidos
  const totalSaved = Object.values(followed).reduce((s, v) => s + v, 0)

  function toggleFollowed(alertId: string, saving: number) {
    const next = { ...followed }
    if (next[alertId] != null) delete next[alertId]
    else next[alertId] = saving
    setFollowed(next)
    localStorage.setItem(FOLLOWED_KEY, JSON.stringify(next))
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-green-700" /> Financeiro
        </h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Sua safra em reais — {profile.farm.name} · {profile.farm.city}/{profile.farm.state}
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-green-800 text-white rounded-xl p-4">
          <p className="text-xs text-green-200 mb-1">Produção estimada vale hoje</p>
          <p className="text-2xl font-semibold">{prices ? formatBRL(totalValue) : '—'}</p>
          <p className="text-[10px] text-green-300 mt-1">cotação do dia × produtividade estimada</p>
        </div>
        <div className="bg-stone-100 rounded-xl p-4">
          <p className="text-xs text-stone-500 mb-1">Custos lançados na safra</p>
          <p className="text-2xl font-semibold text-stone-800">{formatBRL(totalCosts)}</p>
          <p className="text-[10px] text-stone-400 mt-1">{costs.length} lançamento(s)</p>
        </div>
        <div className="bg-stone-100 rounded-xl p-4">
          <p className="text-xs text-stone-500 mb-1">Economia com alertas seguidos</p>
          <p className="text-2xl font-semibold text-green-700">{formatBRL(totalSaved)}</p>
          <p className="text-[10px] text-stone-400 mt-1">{Object.keys(followed).length} recomendação(ões) acatada(s)</p>
        </div>
      </div>

      {/* Simulador de venda */}
      {mainCrop && commodity && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-700" />
            <h3 className="text-sm font-medium text-stone-700">Simulador de venda — {mainCrop.name}</h3>
          </div>
          <p className="text-xs text-stone-400 mb-4">
            {totalSc.toLocaleString('pt-BR')} sc estimadas ({mainCrop.hectares} ha × {yieldSc} sc/ha) · cotação hoje R$ {currentPrice.toFixed(2)}/sc
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-stone-500 flex justify-between mb-1.5">
                <span>Quanto vender</span>
                <span className="font-semibold text-stone-700">{sellPct}% · {sim?.scToSell.toLocaleString('pt-BR')} sc</span>
              </label>
              <input type="range" min={5} max={100} step={5} value={sellPct}
                onChange={e => setSellPct(+e.target.value)} className="w-full accent-green-700" />
            </div>
            <div>
              <label className="text-xs text-stone-500 block mb-1.5">Preço-alvo (R$/sc)</label>
              <input type="number" step="0.5" value={targetPrice ?? ''}
                onChange={e => setTargetPrice(parseFloat(e.target.value) || 0)}
                className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          {sim && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-stone-400 mb-1">Vendendo hoje</p>
                <p className="text-lg font-semibold text-stone-800">{formatBRLFull(sim.sellNow)}</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${sim.diff >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className="text-[10px] text-stone-400 mb-1">No preço-alvo</p>
                <p className={`text-lg font-semibold ${sim.diff >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatBRLFull(sim.sellTarget)}</p>
                <p className={`text-[10px] font-medium ${sim.diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {sim.diff >= 0 ? '+' : ''}{formatBRL(sim.diff)} de diferença
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => router.push(`/assistente?q=${encodeURIComponent(`Tenho ${totalSc} sacas de ${mainCrop.name} estimadas e a cotação hoje é R$ ${currentPrice.toFixed(2)}/sc. Vale a pena vender ${sellPct}% agora ou esperar? Considere o cenário climático da região.`)}`)}
            className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-medium text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 rounded-xl py-2 transition-colors">
            <Bot className="w-3.5 h-3.5" /> Pedir análise de cenário ao AgroAssistente
          </button>

          <p className="text-[9px] text-stone-300 mt-3">
            Simulação informativa — não constitui recomendação de comercialização.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Custo por talhão */}
        <Card className="p-5">
          <h3 className="text-sm font-medium text-stone-700 mb-4">Custos por talhão</h3>

          <div className="flex gap-2 mb-4">
            <input placeholder="Talhão" value={newCost.field}
              onChange={e => setNewCost({ ...newCost, field: e.target.value })}
              className="w-24 border border-stone-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500" />
            <input placeholder="Insumo / operação" value={newCost.item}
              onChange={e => setNewCost({ ...newCost, item: e.target.value })}
              className="flex-1 min-w-0 border border-stone-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500" />
            <input placeholder="R$" inputMode="decimal" value={newCost.value}
              onChange={e => setNewCost({ ...newCost, value: e.target.value })}
              className="w-20 border border-stone-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500" />
            <button onClick={addCost}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {costByField.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {costByField.map(([field, total]) => (
                <div key={field} className="flex justify-between text-xs bg-stone-50 rounded-lg px-3 py-2">
                  <span className="text-stone-600 font-medium">{field}</span>
                  <span className="text-stone-800 font-semibold">{formatBRLFull(total)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1 max-h-44 overflow-y-auto">
            {costs.map(c => (
              <div key={c.id} className="flex items-center gap-2 text-xs py-1.5 border-b border-stone-50 last:border-0">
                <span className="text-stone-400 w-20 flex-shrink-0 truncate">{c.field}</span>
                <span className="text-stone-600 flex-1 truncate">{c.item}</span>
                <span className="text-stone-700 font-medium">{formatBRLFull(c.value)}</span>
                <button onClick={() => removeCost(c.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {costs.length === 0 && (
              <p className="text-xs text-stone-400 text-center py-6">
                Lance os custos de insumos e operações para ver a margem por talhão na colheita.
              </p>
            )}
          </div>
        </Card>

        {/* Economia por alertas */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <PiggyBank className="w-4 h-4 text-green-700" />
            <h3 className="text-sm font-medium text-stone-700">Quanto o CampoClima te economizou</h3>
          </div>
          <p className="text-xs text-stone-400 mb-4">Marque os alertas que você seguiu para somar a economia estimada.</p>

          <div className="space-y-2">
            {profile.alerts.map(alert => {
              const saving = prices ? alertSavingEstimate(alert, profile.crops, prices) : 0
              if (saving <= 0) return null
              const done = followed[alert.id] != null
              return (
                <button key={alert.id} onClick={() => toggleFollowed(alert.id, saving)}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-colors ${
                    done ? 'bg-green-50 border-green-200' : 'bg-white border-stone-200 hover:bg-stone-50'
                  }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border ${
                    done ? 'bg-green-600 border-green-600 text-white' : 'border-stone-300 text-transparent'
                  }`}>
                    <Check className="w-3 h-3" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-medium text-stone-700 truncate">{alert.title}</span>
                    <span className="block text-[10px] text-stone-400">economia estimada se seguido</span>
                  </span>
                  <span className={`text-xs font-semibold ${done ? 'text-green-700' : 'text-stone-500'}`}>
                    {formatBRL(saving)}
                  </span>
                </button>
              )
            })}
          </div>

          {totalSaved > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-green-800 text-white flex items-center justify-between">
              <div>
                <p className="text-[10px] text-green-300">Total economizado nesta safra</p>
                <p className="text-lg font-semibold">{formatBRLFull(totalSaved)}</p>
              </div>
              <Share2 className="w-4 h-4 text-green-300" />
            </div>
          )}

          <p className="text-[9px] text-stone-300 mt-3">
            Estimativas heurísticas baseadas em custos médios de operação e na cotação do dia.
          </p>
        </Card>
      </div>
    </div>
  )
}
