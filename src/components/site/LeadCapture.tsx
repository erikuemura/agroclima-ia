'use client'

import { useState } from 'react'
import { Send, CheckCircle2, Loader2 } from 'lucide-react'

export function LeadCapture() {
  const [contact, setContact] = useState('')
  const [city, setCity] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading'); setError('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, city }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Erro ao enviar')
      }
      setStatus('done')
    } catch (err: unknown) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Erro ao enviar')
    }
  }

  if (status === 'done') {
    return (
      <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-800">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        Recebido! Vamos te avisar das novidades da sua região.
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <input
          value={contact}
          onChange={e => setContact(e.target.value)}
          placeholder="Seu e-mail ou WhatsApp"
          required
          className="flex-1 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="Cidade/UF (para alertas locais)"
          className="sm:w-44 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          disabled={status === 'loading' || !contact.trim()}
          className="inline-flex items-center justify-center gap-2 bg-green-800 text-white rounded-xl px-5 py-3 text-sm font-medium hover:bg-green-900 transition-colors disabled:opacity-50"
        >
          {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Quero receber
        </button>
      </form>
      {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
      <p className="text-xs text-stone-400 mt-3 text-center">Sem spam. Cancelamento a qualquer momento.</p>
    </div>
  )
}
