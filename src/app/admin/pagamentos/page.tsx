'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { CreditCard, ExternalLink } from 'lucide-react'

interface AdminSubscription {
  id: string
  payerEmail: string
  reason: string
  amount: number
  status: string
  nextPayment: string | null
  createdAt: string | null
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  authorized: { label: 'Ativa',     cls: 'bg-green-100 text-green-800' },
  pending:    { label: 'Pendente',  cls: 'bg-amber-100 text-amber-800' },
  paused:     { label: 'Pausada',   cls: 'bg-stone-200 text-stone-600' },
  cancelled:  { label: 'Cancelada', cls: 'bg-red-100 text-red-700' },
}

export default function AdminPaymentsPage() {
  const [subs, setSubs] = useState<AdminSubscription[]>([])
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/payments')
      .then(r => r.json())
      .then(d => { setSubs(d.subscriptions ?? []); setSource(d.source ?? '') })
      .finally(() => setLoading(false))
  }, [])

  const mrr = useMemo(
    () => subs.filter(s => s.status === 'authorized').reduce((sum, s) => sum + s.amount, 0),
    [subs]
  )
  const active = subs.filter(s => s.status === 'authorized').length
  const churned = subs.filter(s => s.status === 'cancelled').length

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-green-700" /> Pagamentos
        </h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Assinaturas via Mercado Pago{source === 'demo' && ' · dados demo (MP não configurado ou sem assinaturas)'}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-800 text-white rounded-xl p-4">
          <p className="text-xs text-green-200 mb-1">MRR</p>
          <p className="text-2xl font-semibold">R$ {mrr.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-stone-500 mb-1">Assinaturas ativas</p>
          <p className="text-2xl font-semibold text-stone-800">{active}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-stone-500 mb-1">Canceladas</p>
          <p className="text-2xl font-semibold text-stone-800">{churned}</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-stone-100 text-[10px] uppercase tracking-wider text-stone-400">
              <th className="px-4 py-3 font-medium">Assinante</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Plano</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Próx. cobrança</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">Desde</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-stone-400">Carregando…</td></tr>
            )}
            {!loading && subs.map(s => {
              const meta = STATUS_META[s.status] ?? { label: s.status, cls: 'bg-stone-100 text-stone-500' }
              return (
                <tr key={s.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm text-stone-700 truncate max-w-[220px]">{s.payerEmail}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-xs text-stone-500">{s.reason}</td>
                  <td className="px-4 py-3 text-sm font-medium text-stone-800 whitespace-nowrap">R$ {s.amount.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium px-2 py-1 rounded-full ${meta.cls}`}>{meta.label}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-stone-500">
                    {s.nextPayment ? new Date(s.nextPayment + 'T12:00').toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-stone-400">
                    {s.createdAt ? new Date(s.createdAt + 'T12:00').toLocaleDateString('pt-BR') : '—'}
                  </td>
                </tr>
              )
            })}
            {!loading && subs.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-stone-400">Nenhuma assinatura.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <a href="https://www.mercadopago.com.br/subscriptions" target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700">
        <ExternalLink className="w-3 h-3" /> Gerenciar cobranças no painel do Mercado Pago
      </a>
    </div>
  )
}
