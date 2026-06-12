'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Users, ExternalLink, Search } from 'lucide-react'

interface AdminUser {
  id: string
  kind: 'demo' | 'supabase'
  name: string
  email: string
  plan: string
  farm: string
  location: string
  hectares: number | null
  lastSignIn: string | null
  createdAt: string | null
  impersonateProfile: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [supabaseOn, setSupabaseOn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => { setUsers(d.users ?? []); setSupabaseOn(d.supabaseAvailable ?? false) })
      .finally(() => setLoading(false))
  }, [])

  const q = query.toLowerCase()
  const visible = users.filter(u =>
    !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.farm.toLowerCase().includes(q)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-700" /> Usuários
          </h1>
          <p className="text-sm text-stone-400 mt-0.5">
            {users.length} conta(s)
            {!supabaseOn && ' · Supabase admin não configurado (exibindo contas demo)'}
          </p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nome, e-mail, fazenda…"
            className="bg-white border border-stone-200 rounded-lg pl-8 pr-3 py-2 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-stone-100 text-[10px] uppercase tracking-wider text-stone-400">
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Fazenda</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Plano</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">Último acesso</th>
              <th className="px-4 py-3 font-medium text-right">Suporte</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-stone-400">Carregando…</td></tr>
            )}
            {!loading && visible.map(u => (
              <tr key={u.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-8 h-8 rounded-lg text-[10px] font-semibold flex items-center justify-center flex-shrink-0 ${
                      u.kind === 'demo' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {u.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{u.name}
                        {u.kind === 'demo' && <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded ml-2">demo</span>}
                      </p>
                      <p className="text-[11px] text-stone-400 truncate">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p className="text-xs text-stone-600">{u.farm}</p>
                  <p className="text-[10px] text-stone-400">{u.location}{u.hectares ? ` · ${u.hectares.toLocaleString('pt-BR')} ha` : ''}</p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-[11px] bg-stone-100 text-stone-600 px-2 py-1 rounded-full whitespace-nowrap">{u.plan}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-[11px] text-stone-400">
                  {u.lastSignIn ? new Date(u.lastSignIn).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {u.impersonateProfile ? (
                    <a href={`/api/admin/impersonate?profile=${u.impersonateProfile}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap">
                      <ExternalLink className="w-3 h-3" /> Acessar painel
                    </a>
                  ) : <span className="text-xs text-stone-300">—</span>}
                </td>
              </tr>
            ))}
            {!loading && visible.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-stone-400">Nenhum usuário encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <p className="text-[10px] text-stone-400">
        ⚠️ &quot;Acessar painel&quot; assume a sessão do cliente neste navegador (cookie de perfil) para suporte.
        Ao terminar, volte ao backoffice e a sessão do cliente expira em 4h.
      </p>
    </div>
  )
}
