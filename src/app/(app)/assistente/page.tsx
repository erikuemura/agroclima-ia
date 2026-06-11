'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Bot, Send, Loader2, User, Camera, X, ImageIcon } from 'lucide-react'
import { getDemoProfileClient } from '@/lib/demo-profiles'

interface Message {
  role: 'user' | 'assistant'
  content: string
  imagePreview?: string
}

export default function AssistentePage() {
  const profile = getDemoProfileClient()

  const suggestions = [
    profile.alerts[0] ? `O que fazer com: "${profile.alerts[0].title}"?` : 'Como identificar ferrugem asiática?',
    profile.crops[0] ? `Manejo de ${profile.crops[0].name} em ${profile.crops[0].phase}` : 'Quando aplicar herbicida?',
    'Fiz uma foto da lavoura — o que vejo aqui?',
    'Como calcular dose de calcário para meu solo?',
  ]

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Olá! Sou o AgroAssistente 🌱\n\nEstou vendo sua fazenda **${profile.farm.name}** em ${profile.farm.city}/${profile.farm.state} com ${profile.crops.length} cultura(s) ativa(s). Pode me enviar dúvidas por texto ou tirar uma foto da lavoura para diagnóstico.`,
    },
  ])
  const [input, setInput]           = useState('')
  const [streaming, setStreaming]   = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64]   = useState<string | null>(null)
  const [imageMime, setImageMime]       = useState<string>('image/jpeg')
  const endRef   = useRef<HTMLDivElement>(null)
  const fileRef  = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleImageFile(file: File) {
    setImageMime(file.type || 'image/jpeg')
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setImagePreview(result)
      // strip "data:image/...;base64," prefix
      setImageBase64(result.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  const send = useCallback(async (text?: string) => {
    const content = text ?? input.trim()
    if (!content && !imageBase64) return
    if (streaming) {
      abortRef.current?.abort()
      return
    }

    const userMsg: Message = {
      role: 'user',
      content: content || '📷 Foto enviada para análise',
      imagePreview: imagePreview ?? undefined,
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setImagePreview(null)
    setImageBase64(null)
    setStreaming(true)

    // Placeholder assistant message for streaming
    setMessages(m => [...m, { role: 'assistant', content: '' }])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          imageBase64: imageBase64 ?? undefined,
          imageMime,
        }),
      })

      if (!res.ok || !res.body) throw new Error('Erro na API')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        const snap = accumulated
        setMessages(m => {
          const updated = [...m]
          updated[updated.length - 1] = { role: 'assistant', content: snap }
          return updated
        })
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setMessages(m => {
          const updated = [...m]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'Não consegui responder. Verifique sua conexão e tente novamente.',
          }
          return updated
        })
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [input, imageBase64, imagePreview, imageMime, messages, streaming])

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
          <Bot className="w-5 h-5 text-green-700" />
          AgroAssistente
        </h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Agrônomo virtual · {profile.farm.name} · {profile.farm.city}/{profile.farm.state}
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
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
              <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-green-700 text-white'
                  : 'bg-stone-100 text-stone-800'
              }`}>
                {msg.imagePreview && (
                  <img
                    src={msg.imagePreview}
                    alt="Foto enviada"
                    className="rounded-lg mb-2 max-h-48 object-cover w-full"
                  />
                )}
                {msg.content ? (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestions.map(s => (
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

        {/* Image preview bar */}
        {imagePreview && (
          <div className="px-4 pb-2 flex items-center gap-2">
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="h-14 w-14 rounded-lg object-cover border border-stone-200" />
              <button
                onClick={() => { setImagePreview(null); setImageBase64(null) }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-700 text-white rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-stone-400 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> Foto pronta para análise
            </p>
          </div>
        )}

        {/* Input bar */}
        <div className="border-t border-stone-100 p-3">
          <div className="flex gap-2">
            {/* Camera / image upload */}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-stone-200 text-stone-400 hover:bg-stone-50 transition-colors"
              title="Enviar foto da lavoura"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f) }}
            />

            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder={imageBase64 ? 'Descreva o problema ou envie sem texto…' : 'Digite sua dúvida…'}
              className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={() => send()}
              disabled={!streaming && !input.trim() && !imageBase64}
              className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-white transition-colors ${
                streaming ? 'bg-red-500 hover:bg-red-600' : 'bg-green-700 hover:bg-green-800 disabled:opacity-40'
              }`}
              title={streaming ? 'Parar' : 'Enviar'}
            >
              {streaming ? <X className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
