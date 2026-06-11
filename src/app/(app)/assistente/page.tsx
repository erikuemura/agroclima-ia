'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Bot, Send, Loader2, User } from 'lucide-react'
import { CROPS, FARM } from '@/lib/mock-data'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Como identificar ferrugem asiática na soja?',
  'Qual o melhor momento para aplicar herbicida?',
  'Meu milho está com folhas amareladas, o que pode ser?',
  'Como calcular a necessidade de calcário?',
]

export default function AssistentePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Olá! Sou o AgroAssistente 🌱\n\nEstou aqui para ajudar você com dúvidas sobre suas culturas, manejo, pragas, doenças, clima e muito mais. O que posso fazer por você hoje?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text?: string) {
    const content = text ?? input.trim()
    if (!content) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          context: {
            city: `${FARM.city} — ${FARM.state}`,
            crops: CROPS.map(c => c.name),
          },
        }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', content: data.reply }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
          <Bot className="w-5 h-5 text-green-700" />
          AgroAssistente
        </h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Agrônomo virtual · responde em português simples
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                msg.role === 'assistant' ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-600'
              }`}>
                {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-green-700 text-white'
                  : 'bg-stone-100 text-stone-800'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-green-800" />
              </div>
              <div className="bg-stone-100 rounded-xl px-4 py-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length === 1 && (
          <div className="px-4 pb-3 grid grid-cols-2 gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs text-stone-500 border border-stone-200 rounded-lg px-3 py-2 hover:bg-stone-50 text-left transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-stone-100 p-4">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Digite sua dúvida..."
              className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="bg-green-700 text-white rounded-lg px-3 py-2 hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
