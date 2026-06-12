'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Target, Bot } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getDemoProfileClient } from '@/lib/demo-profiles'
import {
  readPlans, writePlans, BUDGET_CATEGORIES, type SeasonPlan,
} from '@/lib/stores'
import {
  pricesFromApi, matchCommodity, formatBRL, formatBRLFull, type CommodityPrices,
} from '@/lib/finance'

export default function PlanejamentoPage() {
  const router = useRouter()
  const profile = getDemoProfileClient()
  const [plans, setPlans] = useState<SeasonPlan[]>([])
  const [prices, setPrices] = useState<CommodityPrices | null>(null)
  const [spent, setSpent] = useState(0)

  useEffect(() => {
    setPlans(readPlans())
    fetch('/api/commodities').then(r => r.json()).then(d => setPrices(pricesFromApi(d))).catch(() => {})
    try {
      const costs: { value: number }[] = JSON.parse(localStorage.getItem('campoclima_costs') ?? '[]')
      setSpent(costs.reduce((s, c) => s + c.value, 0))
    } catch { /* sem custos */ }
  }, [])

  function updateBudget(planId: string, category: string, value: number) {
    const next = plans.map(p => p.id === planId ? { ...p, budget: { ...p.budget, [category]: value } } : p)
    setPlans(next); writePlans(next)
  }

  function updatePlan(planId: string, patch: Partial<SeasonPlan>) {
    const next = plans.map(p => p.id === planId ? { ...p, ...patch } : p)
    setPlans(next); writePlans(next)
  }

  const totalBudget = plans.reduce((s, p) => s + Object.values(p.budget).reduce((a, b) => a + b, 0), 0)

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
          <Target className="w-5 h-5 text-green-700" /> Planejamento de safra
        </h1>
        <p className="text-sm text-stone-400 mt-0.5">Orçamento planejado vs realizado — {profile.farm.name}</p>
      </div>

      {/* Comparativo geral */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-stone-100 rounded-xl p-4">
          <p className="text-xs text-stone-500 mb-1">Orçamento planejado</p>
          <p className="text-xl font-semibold text-stone-800">{formatBRL(totalBudget)}</p>
        </div>
        <div className="bg-stone-100 rounded-xl p-4">
          <p className="text-xs text-stone-500 mb-1">Realizado (custos lançados)</p>
          <p className={`text-xl font-semibold ${spent > totalBudget ? 'text-red-600' : 'text-stone-800'}`}>{formatBRL(spent)}</p>
        </div>
        <div className={`rounded-xl p-4 ${spent > totalBudget ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          <p className="text-xs text-stone-500 mb-1">{spent > totalBudget ? 'Acima do orçamento' : 'Disponível'}</p>
          <p className={`text-xl font-semibold ${spent > totalBudget ? 'text-red-600' : 'text-green-700'}`}>
            {formatBRL(Math.abs(totalBudget - spent))}
          </p>
        </div>
      </div>

      {plans.map(plan => {
        const planTotal = Object.values(plan.budget).reduce((a, b) => a + b, 0)
        const commodity = matchCommodity(plan.cropName)
        const price = commodity && prices ? prices[commodity] ?? 0 : 0
        const revenue = Math.round(plan.areaHa * plan.expectedYieldSc * price)
        const margin = revenue - planTotal
        const costHa = plan.areaHa > 0 ? Math.round(planTotal / plan.areaHa) : 0

        return (
          <Card key={plan.id} className="p-5">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-medium text-stone-800">{plan.cropName}</h3>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  <label className="text-[10px] text-stone-400 flex items-center gap-1">
                    Variedade
                    <input value={plan.variety} onChange={e => updatePlan(plan.id, { variety: e.target.value })}
                      className="border border-stone-200 rounded px-1.5 py-0.5 text-[11px] text-stone-700 w-28" />
                  </label>
                  <label className="text-[10px] text-stone-400 flex items-center gap-1">
                    Área (ha)
                    <input type="number" value={plan.areaHa} onChange={e => updatePlan(plan.id, { areaHa: +e.target.value || 0 })}
                      className="border border-stone-200 rounded px-1.5 py-0.5 text-[11px] text-stone-700 w-16" />
                  </label>
                  <label className="text-[10px] text-stone-400 flex items-center gap-1">
                    Prod. esperada (sc/ha)
                    <input type="number" value={plan.expectedYieldSc} onChange={e => updatePlan(plan.id, { expectedYieldSc: +e.target.value || 0 })}
                      className="border border-stone-200 rounded px-1.5 py-0.5 text-[11px] text-stone-700 w-14" />
                  </label>
                </div>
              </div>
            </div>

            {/* Orçamento por categoria */}
            <div className="space-y-1.5 mb-4">
              {BUDGET_CATEGORIES.map(cat => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs text-stone-500 w-28 flex-shrink-0">{cat}</span>
                  <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full"
                      style={{ width: `${planTotal > 0 ? ((plan.budget[cat] ?? 0) / planTotal) * 100 : 0}%` }} />
                  </div>
                  <input type="number" value={plan.budget[cat] ?? 0}
                    onChange={e => updateBudget(plan.id, cat, +e.target.value || 0)}
                    className="w-24 border border-stone-200 rounded px-1.5 py-0.5 text-[11px] text-right text-stone-700" />
                </div>
              ))}
            </div>

            {/* Indicadores */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Custo/ha', value: formatBRLFull(costHa) },
                { label: 'Receita esperada', value: prices ? formatBRL(revenue) : '—' },
                { label: 'Margem estimada', value: prices ? formatBRL(margin) : '—', color: margin >= 0 ? 'text-green-700' : 'text-red-600' },
                { label: 'Margem %', value: revenue > 0 ? `${Math.round((margin / revenue) * 100)}%` : '—', color: margin >= 0 ? 'text-green-700' : 'text-red-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-stone-50 rounded-lg p-2.5 text-center">
                  <p className={`text-sm font-semibold ${color ?? 'text-stone-800'}`}>{value}</p>
                  <p className="text-[9px] text-stone-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </Card>
        )
      })}

      <button
        onClick={() => router.push(`/assistente?q=${encodeURIComponent('Analise meu planejamento de safra: orçamento total de ' + formatBRL(totalBudget) + ' e realizado de ' + formatBRL(spent) + '. Os custos estão saudáveis para a região? Onde posso otimizar?')}`)}
        className="w-full flex items-center justify-center gap-2 text-xs font-medium text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 rounded-xl py-2.5 transition-colors">
        <Bot className="w-3.5 h-3.5" /> Analisar planejamento com o AgroAssistente
      </button>
    </div>
  )
}
