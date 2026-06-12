'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { ShieldCheck, Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Erro ao entrar')
      }
      window.location.href = '/backoffice'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <div className="w-full max-w-xs">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6 text-green-400" />
          </div>
          <h1 className="text-lg font-semibold text-white">Backoffice CampoClima</h1>
          <p className="text-xs text-stone-400 mt-0.5">Acesso restrito à equipe</p>
        </div>

        <Card className="p-5 bg-stone-800 border-stone-700">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-stone-400 block mb-1">Usuário</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} autoFocus autoComplete="username"
                className="w-full bg-stone-900 border border-stone-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-400 block mb-1">Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                className="w-full bg-stone-900 border border-stone-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button type="submit" disabled={loading || !password || !username}
              className="w-full bg-green-700 text-white text-sm font-medium py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Entrar
            </button>
          </form>
        </Card>
      </div>
    </div>
  )
}
