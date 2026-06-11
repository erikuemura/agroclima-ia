'use client'

import { useState } from 'react'
import {
  MessageCircle, Bell, Shield, User, Check, AlertCircle,
  Loader2, ChevronRight, Smartphone, BellRing, X, CheckCircle2
} from 'lucide-react'

type AlertType = 'geada' | 'pulverizacao' | 'chuva' | 'ndvi' | 'umidade'

const ALERT_TYPES: { id: AlertType; label: string; desc: string; emoji: string }[] = [
  { id: 'geada',        label: 'Risco de geada',           desc: 'Quando temperatura prevista < 4°C',        emoji: '🌡️' },
  { id: 'pulverizacao', label: 'Janela de pulverização',   desc: 'Vento < 15km/h + umidade ideal',           emoji: '💨' },
  { id: 'chuva',        label: 'Chuva intensa',            desc: 'Precipitação > 40mm em 24h prevista',      emoji: '🌧' },
  { id: 'ndvi',         label: 'Queda de NDVI',            desc: 'Vegetação abaixo do esperado no talhão',  emoji: '🛰️' },
  { id: 'umidade',      label: 'Déficit hídrico',          desc: 'ETo acumulado sem chuva por 7+ dias',     emoji: '☀️' },
]

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<'whatsapp' | 'notificacoes' | 'perfil'>('whatsapp')

  // WhatsApp state
  const [phone, setPhone]     = useState('')
  const [rawPhone, setRaw]    = useState('')
  const [status, setStatus]   = useState<'idle' | 'sending' | 'verify' | 'done' | 'error'>('idle')
  const [code, setCode]       = useState('')
  const [errorMsg, setError]  = useState('')
  const [waEnabled, setWaEnabled] = useState(false)
  const isSending = status === 'sending'

  // Alert toggles
  const [alerts, setAlerts] = useState<Record<AlertType, boolean>>({
    geada: true, pulverizacao: true, chuva: true, ndvi: false, umidade: true,
  })

  function formatPhone(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 11)
    setRaw(d)
    if (d.length <= 2)  return setPhone(d)
    if (d.length <= 7)  return setPhone(`(${d.slice(0,2)}) ${d.slice(2)}`)
    setPhone(`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`)
  }

  async function handleSendCode() {
    if (rawPhone.length < 10) { setError('Número inválido. Use DDD + número.'); return }
    setError('')
    setStatus('sending')
    // In production: POST /api/whatsapp/send-code com Twilio Verify ou Meta OTP
    // Aqui simulamos o envio com delay
    await new Promise(r => setTimeout(r, 1400))
    setStatus('verify')
  }

  async function handleVerifyCode() {
    if (code.length < 6) { setError('Código deve ter 6 dígitos.'); return }
    setError('')
    setStatus('sending')
    await new Promise(r => setTimeout(r, 1200))
    // TODO: real verification — compare code stored in session/Redis
    if (code === '123456' || code.length === 6) {
      setStatus('done')
      setWaEnabled(true)
    } else {
      setStatus('verify')
      setError('Código incorreto. Tente novamente.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-medium text-stone-900 mb-1">Configurações</h1>
        <p className="text-sm text-stone-400">Personalize alertas, notificações e sua conta</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl mb-6">
        {[
          { id: 'whatsapp',     label: 'WhatsApp',     icon: MessageCircle },
          { id: 'notificacoes', label: 'Alertas',      icon: Bell },
          { id: 'perfil',       label: 'Perfil',       icon: User },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as typeof tab)}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-lg transition-colors ${
              tab === id ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: WhatsApp ── */}
      {tab === 'whatsapp' && (
        <div className="space-y-4">

          {/* Status banner */}
          {waEnabled ? (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900">WhatsApp conectado</p>
                <p className="text-xs text-green-600">{phone} — alertas e AgroAssistente ativos</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <Smartphone className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">Conecte seu WhatsApp para receber alertas e usar o AgroAssistente no celular.</p>
            </div>
          )}

          {/* Card: como funciona */}
          {!waEnabled && status === 'idle' && (
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <h2 className="text-sm font-medium text-stone-900 mb-4">Como funciona</h2>
              <div className="space-y-3">
                {[
                  { n: '1', t: 'Cadastre seu número', d: 'Informe o WhatsApp que usará para receber alertas' },
                  { n: '2', t: 'Confirme com código', d: 'Enviamos um código de 6 dígitos via WhatsApp' },
                  { n: '3', t: 'Pronto!', d: 'Receba alertas e converse com o AgroAssistente diretamente' },
                ].map(({ n, t, d }) => (
                  <div key={n} className="flex gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-800 flex-shrink-0 mt-0.5">{n}</div>
                    <div>
                      <p className="text-sm font-medium text-stone-800">{t}</p>
                      <p className="text-xs text-stone-400">{d}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-100 mt-5 pt-4">
                <label className="block text-xs font-medium text-stone-600 mb-2">Número do WhatsApp</label>
                <div className="flex gap-2">
                  <div className="flex items-center border border-stone-200 rounded-lg px-3 bg-stone-50">
                    <span className="text-sm text-stone-500">🇧🇷 +55</span>
                  </div>
                  <input
                    value={phone}
                    onChange={e => formatPhone(e.target.value)}
                    placeholder="(65) 99999-9999"
                    className="flex-1 border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
                  />
                </div>
                {errorMsg && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 mt-2">
                    <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
                  </p>
                )}
                <button
                  onClick={handleSendCode}
                  disabled={isSending}
                  className="mt-3 w-full bg-green-800 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Enviando código...</>
                  ) : (
                    <><MessageCircle className="w-4 h-4" /> Enviar código de verificação</>
                  )}
                </button>
                <p className="text-[10px] text-stone-400 text-center mt-2">Enviaremos uma mensagem via WhatsApp com o código</p>
              </div>
            </div>
          )}

          {/* Verification step */}
          {status === 'verify' && !waEnabled && (
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => { setStatus('idle'); setError('') }} className="text-stone-400 hover:text-stone-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <h2 className="text-sm font-medium text-stone-900">Verificar número</h2>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 text-sm text-green-800 mb-4 flex items-start gap-2">
                <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Enviamos um código para <strong>{phone}</strong> via WhatsApp. Verifique sua caixa de mensagens.</span>
              </div>

              <label className="block text-xs font-medium text-stone-600 mb-2">Código de verificação (6 dígitos)</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                placeholder="000000"
                className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-center tracking-[0.3em] text-lg font-mono focus:outline-none focus:ring-2 focus:ring-green-600"
                maxLength={6}
              />
              {errorMsg && (
                <p className="flex items-center gap-1.5 text-xs text-red-600 mt-2">
                  <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
                </p>
              )}
              <button
                onClick={handleVerifyCode}
                disabled={isSending || code.length < 6}
                className="mt-3 w-full bg-green-800 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSending ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</> : <><Check className="w-4 h-4" /> Confirmar</>}
              </button>
              <button onClick={() => handleSendCode()} className="mt-2 w-full text-xs text-stone-400 hover:text-stone-600 transition-colors py-1">
                Não recebi o código — reenviar
              </button>
            </div>
          )}

          {/* Connected — quick actions */}
          {waEnabled && (
            <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-medium text-stone-900 mb-1">Ações rápidas</h2>
              {[
                { icon: BellRing,       label: 'Enviar alerta de teste',    action: () => sendTestAlert(phone) },
                { icon: MessageCircle,  label: 'Abrir AgroAssistente no WhatsApp', action: () => window.open(`https://wa.me/+55${rawPhone}?text=oi`) },
              ].map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors text-sm text-stone-700"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-green-700" />
                    {label}
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-300" />
                </button>
              ))}
              <button
                onClick={() => { setWaEnabled(false); setStatus('idle'); setPhone(''); setRaw(''); setCode('') }}
                className="w-full text-xs text-red-400 hover:text-red-600 transition-colors pt-2"
              >
                Desconectar WhatsApp
              </button>
            </div>
          )}

          {/* Commands cheat-sheet */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Comandos disponíveis no WhatsApp</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { cmd: 'oi / menu',    desc: 'Abrir menu principal' },
                { cmd: 'clima',        desc: 'Previsão do tempo' },
                { cmd: 'alertas',      desc: 'Ver alertas ativos' },
                { cmd: '[foto]',       desc: 'Diagnosticar praga' },
                { cmd: '[pergunta]',   desc: 'AgroAssistente IA' },
                { cmd: 'sair',         desc: 'Encerrar sessão' },
              ].map(({ cmd, desc }) => (
                <div key={cmd} className="flex items-center gap-2">
                  <code className="text-[11px] bg-white border border-stone-200 text-green-800 font-mono px-2 py-0.5 rounded">{cmd}</code>
                  <span className="text-[11px] text-stone-400">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Alertas ── */}
      {tab === 'notificacoes' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <h2 className="text-sm font-medium text-stone-900 mb-1">Alertas automáticos</h2>
            <p className="text-xs text-stone-400 mb-4">Ative os alertas que deseja receber. Serão enviados via push e WhatsApp.</p>
            <div className="space-y-3">
              {ALERT_TYPES.map(({ id, label, desc, emoji }) => (
                <div key={id} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-stone-800">{label}</p>
                      <p className="text-xs text-stone-400">{desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAlerts(a => ({ ...a, [id]: !a[id] }))}
                    className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${alerts[id] ? 'bg-green-700' : 'bg-stone-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform mx-1 ${alerts[id] ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full bg-green-800 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-900 transition-colors">
              Salvar preferências
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            💡 <strong>Dica:</strong> Os alertas de geada e janela de pulverização são os mais populares entre produtores de soja e milho no Mato Grosso.
          </div>
        </div>
      )}

      {/* ── Tab: Perfil ── */}
      {tab === 'perfil' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-medium text-stone-900">Dados da conta</h2>
            {[
              { label: 'Nome completo', value: 'João Oliveira', type: 'text' },
              { label: 'E-mail',        value: 'joao@fazendaoliv.com.br', type: 'email' },
              { label: 'Cidade/UF',     value: 'Sorriso — MT', type: 'text' },
            ].map(({ label, value, type }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-stone-600 mb-1">{label}</label>
                <input defaultValue={value} type={type}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
            ))}
            <button className="w-full bg-green-800 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-900 transition-colors">
              Salvar alterações
            </button>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-stone-900">Plano atual</h2>
              <span className="text-xs bg-green-100 text-green-800 border border-green-200 px-2.5 py-1 rounded-full font-medium">Produtor</span>
            </div>
            <p className="text-xs text-stone-400 mb-3">R$49/mês · Próxima cobrança em 28/07/2026</p>
            <div className="flex gap-2">
              <button className="flex-1 text-xs border border-stone-200 rounded-lg py-2 text-stone-600 hover:bg-stone-50 transition-colors">Ver faturas</button>
              <button className="flex-1 text-xs border border-stone-200 rounded-lg py-2 text-stone-600 hover:bg-stone-50 transition-colors">Cancelar plano</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

async function sendTestAlert(phone: string) {
  try {
    await fetch('/api/whatsapp/send-alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': '', // user-facing test, simplified
      },
      body: JSON.stringify({
        numbers: [phone.replace(/\D/g,'')],
        alert: {
          severity: 'warning',
          title: 'Alerta de teste — CampoClima',
          description: 'Sua integração com WhatsApp está funcionando! Você receberá alertas reais aqui.',
          crop: null,
        },
      }),
    })
    alert('Alerta de teste enviado! Verifique seu WhatsApp.')
  } catch {
    alert('Erro ao enviar alerta. Verifique a configuração.')
  }
}
