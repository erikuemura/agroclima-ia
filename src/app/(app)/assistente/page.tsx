'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Bot, Send, Loader2, User, Camera, X, ImageIcon, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { getDemoProfileClient } from '@/lib/demo-profiles'

interface Message {
  role: 'user' | 'assistant'
  content: string
  imagePreview?: string
}

interface FarmIntelligence {
  contextString: string
  suggestions: string[]
  fires: { risk: string; nearby50: number; nearestKm: number | null } | null
  climate: { rainStatus: string; rainDelta: number; monthName: string } | null
  soil: { ph: number; phStatus: string } | null
}

export default function AssistentePage() {
  const profile = getDemoProfileClient()

  const [messages, setMessages]         = useState<Message[]>([
    { role: 'assistant', content: `Olá! Sou o AgroAssistente 🌱\n\nEstou carregando a inteligência da sua fazenda **${profile.farm.name}** com dados de queimadas, clima histórico e solo. Em instantes estarei pronto com contexto completo.` },
  ])
  const [input, setInput]               = useState('')
  const [streaming, setStreaming]       = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64]   = useState<string | null>(null)
  const [imageMime, setImageMime]       = useState<string>('image/jpeg')
  const [farmCtx, setFarmCtx]           = useState<FarmIntelligence | null>(null)
  const [ctxOpen, setCtxOpen]           = useState(false)
  const [initialSent, setInitialSent]   = useState(false)
  const endRef   = useRef<HTMLDivElement>(null)
  const fileRef  = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Load farm intelligence on mount
  useEffect(() => {
    fetch('/api/farm-intelligence')
      .then(r => r.json())
      .then((data: FarmIntelligence) => {
        setFarmCtx(data)
        // Update greeting with loaded context
        const badges: string[] = []
        if ((data.fires?.nearby50 ?? 0) > 0) badges.push(`🔥 ${data.fires!.nearby50} focos a <50km`)
        if (data.climate?.rainStatus !== 'normal') badges.push(`🌧 Chuva ${data.climate?.rainStatus}`)
        if (data.soil?.ph && data.soil.ph < 5.5) badges.push(`🌍 Solo ácido pH ${data.soil.ph}`)

        const greeting = `Olá! Sou o AgroAssistente 🌱\n\nFazenda **${profile.farm.name}** · ${profile.farm.city}/${profile.farm.state} · ${profile.crops.length} cultura(s)\n\n${
          badges.length > 0 ? `**Alertas ativos:** ${badges.join(' · ')}\n\n` : ''
        }Pode me perguntar sobre manejo, pragas, adubação, histórico climático da sua região ou enviar uma foto para diagnóstico.`

        setMessages([{ role: 'assistant', content: greeting }])
      })
      .catch(() => {
        setMessages([{ role: 'assistant', content: `Olá! Sou o AgroAssistente 🌱\n\nFazenda **${profile.farm.name}** em ${profile.farm.city}/${profile.farm.state}. Como posso ajudar?` }])
      })
  }, [])

  // Read ?q= URL param and auto-send after context loads
  useEffect(() => {
    if (!farmCtx || initialSent) return
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    if (q) {
      setInitialSent(true)
      // Small delay so greeting is rendered first
      setTimeout(() => sendMessage(q, farmCtx), 400)
    }
  }, [farmCtx, initialSent])

  function handleImageFile(file: File) {
    setImageMime(file.type || 'image/jpeg')
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setImagePreview(result)
      setImageBase64(result.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  async function sendMessage(text: string, ctx: FarmIntelligence | null = farmCtx) {
    if (!text && !imageBase64) return
    if (streaming) { abortRef.current?.abort(); return }

    const userMsg: Message = {
      role: 'user',
      content: text || '📷 Foto enviada para análise',
      imagePreview: imagePreview ?? undefined,
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setImagePreview(null)
    setImageBase64(null)
    setStreaming(true)
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
          farmContext: ctx?.contextString,
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
        setMessages(m => { const u = [...m]; u[u.length-1] = { role: 'assistant', content: snap }; return u })
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setMessages(m => { const u = [...m]; u[u.length-1] = { role: 'assistant', content: 'Não consegui responder. Tente novamente.' }; return u })
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  const send = useCallback((text?: string) => sendMessage(text ?? input.trim()), [input, imageBase64, imagePreview, imageMime, messages, streaming, farmCtx])

  const suggestions = farmCtx?.suggestions?.slice(0, 4) ?? [
    profile.alerts[0] ? `O que fazer com: "${profile.alerts[0].title}"?` : 'Como identificar ferrugem asiática?',
    profile.crops[0] ? `Manejo de ${profile.crops[0].name} em ${profile.crops[0].phase}` : 'Quando aplicar herbicida?',
    'Fiz uma foto da lavoura — o que vejo aqui?',
    'Como calcular dose de calcário para meu solo?',
  ]

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <div className="mb-3">
        <h1 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
          <Bot className="w-5 h-5 text-green-700" />
          AgroAssistente
        </h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Agrônomo virtual · {profile.farm.name} · {profile.farm.city}/{profile.farm.state}
        </p>
      </div>

      {/* Farm intelligence summary bar */}
      {farmCtx && (
        <div className="mb-3 rounded-xl border border-stone-200 overflow-hidden">
          <button
            onClick={() => setCtxOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-stone-50 hover:bg-stone-100 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-xs font-medium text-stone-700">Inteligência da fazenda carregada</span>
              <div className="flex gap-1">
                {farmCtx.fires && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">Queimadas</span>}
                {farmCtx.climate && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Clima hist.</span>}
                {farmCtx.soil && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Solo</span>}
              </div>
            </div>
            {ctxOpen ? <ChevronUp className="w-3.5 h-3.5 text-stone-400" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
          </button>
          {ctxOpen && (
            <div className="px-4 py-3 bg-white border-t border-stone-100">
              <pre className="text-[10px] text-stone-500 whitespace-pre-wrap leading-relaxed font-mono">
                {farmCtx.contextString}
              </pre>
            </div>
          )}
        </div>
      )}

      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'assistant' ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-600'
              }`}>
                {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user' ? 'bg-green-700 text-white' : 'bg-stone-100 text-stone-800'
              }`}>
                {msg.imagePreview && (
                  <img src={msg.imagePreview} alt="Foto enviada" className="rounded-lg mb-2 max-h-48 object-cover w-full" />
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
              <button key={s} onClick={() => send(s)}
                className="text-xs text-stone-500 border border-stone-200 rounded-lg px-3 py-2 hover:bg-stone-50 text-left transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Image preview */}
        {imagePreview && (
          <div className="px-4 pb-2 flex items-center gap-2">
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="h-14 w-14 rounded-lg object-cover border border-stone-200" />
              <button onClick={() => { setImagePreview(null); setImageBase64(null) }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-700 text-white rounded-full flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-stone-400 flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Foto pronta para análise</p>
          </div>
        )}

        {/* Input bar */}
        <div className="border-t border-stone-100 p-3">
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-stone-200 text-stone-400 hover:bg-stone-50 transition-colors"
              title="Enviar foto da lavoura">
              <Camera className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f) }} />
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder={imageBase64 ? 'Descreva o problema ou envie sem texto…' : 'Digite sua dúvida…'}
              className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <button onClick={() => send()} disabled={!streaming && !input.trim() && !imageBase64}
              className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-white transition-colors ${
                streaming ? 'bg-red-500 hover:bg-red-600' : 'bg-green-700 hover:bg-green-800 disabled:opacity-40'
              }`}
              title={streaming ? 'Parar' : 'Enviar'}>
              {streaming ? <X className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
