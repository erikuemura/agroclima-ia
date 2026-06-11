'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react'

interface Commodity {
  id: string
  name: string
  emoji: string
  price: number
  prev: number
  unit: string
  reference: string
}

interface CommoditiesData {
  updatedAt: string
  usdBrl: number
  commodities: Commodity[]
}

function delta(price: number, prev: number) {
  const diff = price - prev
  const pct = ((diff / prev) * 100).toFixed(2)
  return { diff: diff.toFixed(2), pct, up: diff > 0, neutral: Math.abs(diff) < 0.01 }
}

export function CommoditiesCard() {
  const [data, setData] = useState<CommoditiesData | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/commodities')
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const updatedLabel = data
    ? new Date(data.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-stone-700">Cotações do dia</h3>
          <p className="text-[10px] text-stone-400 mt-0.5">
            {data ? `Atualizado ${updatedLabel} · USD/BRL R$${data.usdBrl.toFixed(2)}` : 'Carregando…'}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-40"
          title="Atualizar"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !data ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-10 rounded-lg bg-stone-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {data?.commodities.map(c => {
            const d = delta(c.price, c.prev)
            return (
              <div
                key={c.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg leading-none">{c.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-stone-800">{c.name}</p>
                    <p className="text-[10px] text-stone-400">{c.reference}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-stone-900">
                    R$ {c.price.toFixed(2)}
                    <span className="text-[10px] font-normal text-stone-400 ml-1">{c.unit}</span>
                  </p>
                  <div className={`flex items-center justify-end gap-0.5 text-[10px] font-medium ${
                    d.neutral ? 'text-stone-400'
                    : d.up ? 'text-green-600'
                    : 'text-red-500'
                  }`}>
                    {d.neutral ? (
                      <Minus className="w-2.5 h-2.5" />
                    ) : d.up ? (
                      <TrendingUp className="w-2.5 h-2.5" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5" />
                    )}
                    {d.up && '+'}{d.diff} ({d.up && '+'}{d.pct}%)
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-[9px] text-stone-300 mt-3 text-right">
        Simulação baseada em CEPEA/ESALQ · atualização diária
      </p>
    </Card>
  )
}
