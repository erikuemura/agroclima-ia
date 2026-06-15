'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Send, CheckCircle2, Loader2 } from 'lucide-react'

// CTA suave usado ao final de cada ferramenta pública:
// convite à demo + captura de lead (sem bloquear o resultado).
export function ToolCTA({ tool, headline }: { tool: string; headline?: string }) {
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, city: `[ferramenta: ${tool}]` }),
      })
      setStatus('done')
    } catch {
      setStatus('done')
    }
  }

  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-6 mt-6">
      <h3 className="text-base font-medium text-stone-900 mb-1.5">
        {headline ?? 'Quer isso automático e monitorado pra sua fazenda?'}
      </h3>
      <p className="text-sm text-stone-600 leading-relaxed mb-4">
        O CampoClima acompanha clima, satélite, solo e custos da sua propriedade o ano todo —
        com alertas por IA antes dos problemas acontecerem.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Link href="/demo" className="inline-flex items-center justify-center gap-2 bg-green-800 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-green-900 transition-colors">
          Ver demonstração ao vivo <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/login" className="inline-flex items-center justify-center gap-2 border border-stone-300 text-stone-700 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-white transition-colors">
          Criar conta grátis
        </Link>
      </div>

      {status === 'done' ? (
        <p className="flex items-center gap-2 text-sm text-green-800">
          <CheckCircle2 className="w-4 h-4" /> Pronto! Vamos te enviar novidades úteis pra sua região.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text" value={contact} onChange={e => setContact(e.target.value)}
            placeholder="Ou deixe e-mail/WhatsApp e receba dicas da sua região"
            required
            className="flex-1 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button type="submit" disabled={status === 'loading' || !contact.trim()}
            className="inline-flex items-center justify-center gap-2 bg-white border border-green-300 text-green-800 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-green-100 transition-colors disabled:opacity-50">
            {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Receber
          </button>
        </form>
      )}
    </div>
  )
}

// Cabeçalho padrão das ferramentas (logo + voltar)
export function ToolHeader() {
  return (
    <nav className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-stone-100 bg-white/95 backdrop-blur sticky top-0 z-40">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-green-800 rounded-lg flex items-center justify-center">
          <svg viewBox="0 0 64 64" className="w-4 h-4"><g transform="translate(14 13)" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 34 A11.7 11.7 0 0 1 16 11 C25.7 9.2 28.3 8.3 31.7 4 c1.7 3.4 3.3 7 3.3 13.3 0 9.2 -8 16.7 -16.7 16.7 Z"/><path d="M3 36 c0 -5 3.1 -8.9 8.5 -10 C18.8 24.2 23 21.7 25 18"/></g></svg>
        </div>
        <span className="text-sm font-semibold text-stone-900">CampoClima</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/ferramentas" className="text-sm text-stone-500 hover:text-stone-800 transition-colors">Ferramentas</Link>
        <Link href="/demo" className="text-sm bg-green-800 text-white rounded-lg px-4 py-2 hover:bg-green-900 transition-colors">Ver demo</Link>
      </div>
    </nav>
  )
}
