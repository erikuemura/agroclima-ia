'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Wallet, AlertTriangle, ExternalLink } from 'lucide-react'

type PaymentHealth = 'em_dia' | 'atrasado' | 'cancelado' | 'sem_assinatura'

interface ClientFinanceRow {
  userId: string
  name: string
  email: string
  plan: string
  amount: number
  health: PaymentHealth
  nextPayment: string | null
  since: string | null
  impersonateProfile: string | null
}

const HEALTH_META: Record<PaymentHealth, { label: string; cls: string; dot: string }> = {
  em_dia:         { label: 'Em dia',         cls: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  atrasado:       { label: 'Atrasado',       cls: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
  cancelado:      { label: 'Cancelado',      cls: 'bg-stone-200 text-stone-600', dot: 'bg-stone-400' },
  sem_assinatura: { label: 'Sem assinatura', cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
}

const FILTERS: { id: PaymentHealth | 'todos'; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'atrasado', label: 'Atrasados' },
  { id: 'em_dia', label: 'Em dia' },
  { id: 'cancelado', label: 'Cancelados' },
  { id: 'sem_assinatura', label: 'Sem assinatura' },
]

export default function BackofficeFinanceiroPage() {
  const [rows, setRows] = useState<ClientFinanceRow[]>([])
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<PaymentHealth | 'todos'>('todos')

  useEffect(() => {
    fetch('/api/admin/client-finance')
      .then(r => r.json())
      .then(d => { setRows(d.rows ?? []); setSource(d.source ?? '') })
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const by = (h: PaymentHealth) => rows.filter(r => r.health === h)
    const emDia = by('em_dia')
    const atrasados = by('atrasado')
    const payers = emDia.length + atrasados.length
    return {
      mrr: emDia.reduce((s, r) => s + r.amount, 0),
      emDia: emDia.length,
      atrasados: atrasados.length,
      emRisco: atrasados.reduce((s, r) => s + r.amount, 0),
      inadimplencia: payers > 0 ? Math.round((atrasados.length / payers) * 100) : 0,
    }
  }, [rows])

  const visible = filter === 'todos' ? rows : rows.filter(r => r.health === filter)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-green-700" /> Gestão financeira dos clientes
        </h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Mensalidades por cliente{source === 'demo' && ' · dados demo (MP não configurado ou sem assinaturas)'}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-green-800 text-white rounded-xl p-4">
          <p className="text-xs text-green-200 mb-1">MRR em dia</p>
          <p className="text-2xl font-semibold">R$ {stats.mrr.toLocaleString('pt-BR')}</p>
        </div>
        <div className={`rounded-xl p-4 border ${stats.atrasados > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-stone-200'}`}>
          <p className="text-xs text-stone-500 mb-1">Atrasados</p>
          <p className={`text-2xl font-semibold ${stats.atrasados > 0 ? 'text-red-600' : 'text-stone-800'}`}>{stats.atrasados}</p>
          {stats.emRisco > 0 && <p className="text-[10px] text-red-500 mt-0.5">R$ {stats.emRisco.toLocaleString('pt-BR')}/mês em risco</p>}
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-stone-500 mb-1">Clientes em dia</p>
          <p className="text-2xl font-semibold text-green-700">{stats.emDia}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-stone-500 mb-1">Inadimplência</p>
          <p className="text-2xl font-semibold text-stone-800">{stats.inadimplencia}%</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === f.id ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-stone-100 text-[10px] uppercase tracking-wider text-stone-400">
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Plano</th>
              <th className="px-4 py-3 font-medium">Mensalidade</th>
              <th className="px-4 py-3 font-medium">Situação</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Próx. cobrança</th>
              <th className="px-4 py-3 font-medium text-right hidden lg:table-cell">Suporte</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-stone-400">Carregando…</td></tr>
            )}
            {!loading && visible.map(r => {
              const meta = HEALTH_META[r.health]
              const overdue = r.health === 'atrasado' && r.nextPayment
              return (
                <tr key={r.userId} className="border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-stone-800">{r.name}</p>
                    <p className="text-[11px] text-stone-400 truncate max-w-[200px]">{r.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-xs text-stone-500">{r.plan}</td>
                  <td className="px-4 py-3 text-sm font-medium text-stone-800 whitespace-nowrap">
                    {r.amount > 0 ? `R$ ${r.amount.toLocaleString('pt-BR')}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full ${meta.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} /> {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs">
                    {r.nextPayment ? (
                      <span className={overdue ? 'text-red-600 font-medium flex items-center gap-1' : 'text-stone-500'}>
                        {overdue && <AlertTriangle className="w-3 h-3" />}
                        {new Date(r.nextPayment + 'T12:00').toLocaleDateString('pt-BR')}
                        {overdue && ' (vencida)'}
                      </span>
                    ) : <span className="text-stone-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    {r.impersonateProfile ? (
                      <a href={`/api/admin/impersonate?profile=${r.impersonateProfile}`}
                        className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline whitespace-nowrap">
                        <ExternalLink className="w-3 h-3" /> Acessar painel
                      </a>
                    ) : <span className="text-xs text-stone-300">—</span>}
                  </td>
                </tr>
              )
            })}
            {!loading && visible.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-stone-400">Nenhum cliente neste filtro.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <p className="text-[10px] text-stone-400">
        &quot;Atrasado&quot; = assinatura ativa com cobrança vencida (MP não conseguiu cobrar), pausada ou pendente de aprovação.
        Ações de cobrança (retentativa, cancelamento) são feitas no painel do Mercado Pago.
      </p>
    </div>
  )
}
