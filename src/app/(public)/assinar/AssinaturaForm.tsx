'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react'
import { Leaf, ShieldCheck, Lock, Check, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'

const PLANS = {
  produtor: {
    label: 'CampoClima Produtor',
    monthly: 49,
    annual: 39,
    features: ['Fazendas e talhões ilimitados', 'Todos os 11 módulos', 'IA ilimitada', 'Suporte por e-mail'],
  },
  premium: {
    label: 'CampoClima Premium',
    monthly: 129,
    annual: 99,
    features: ['Tudo do Produtor', 'Multi-usuário (5 logins)', 'API de integração', 'Suporte WhatsApp'],
  },
} as const

type PlanId = keyof typeof PLANS

interface PersonalData {
  name: string
  email: string
  cpf: string
  phone: string
  cep: string
  street: string
  number: string
  city: string
  state: string
}

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const inputCls = 'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white text-stone-900 placeholder:text-stone-300'
const labelCls = 'block text-xs font-medium text-stone-600 mb-1'

export default function AssinaturaForm({ planId, annual }: { planId: PlanId; annual: boolean }) {
  const plan  = PLANS[planId]
  const price = annual ? plan.annual : plan.monthly

  const [mpReady, setMpReady] = useState(false)
  const [step, setStep]       = useState<'dados' | 'pagamento' | 'sucesso'>('dados')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const [personal, setPersonal] = useState<PersonalData>({
    name: '', email: '', cpf: '', phone: '',
    cep: '', street: '', number: '', city: '', state: 'MT',
  })

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY
    if (key) {
      initMercadoPago(key, { locale: 'pt-BR' })
      setMpReady(true)
    }
  }, [])

  function set(field: keyof PersonalData, value: string) {
    setPersonal(p => ({ ...p, [field]: value }))
  }

  function formatCPF(v: string) {
    return v.replace(/\D/g, '').slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  function formatPhone(v: string) {
    return v.replace(/\D/g, '').slice(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  async function fetchCEP(cep: string) {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const d = await r.json()
      if (!d.erro) {
        setPersonal(p => ({ ...p, street: d.logradouro, city: d.localidade, state: d.uf }))
      }
    } catch {}
  }

  function validateDados() {
    const { name, email, cpf, phone, cep, street, number, city } = personal
    if (!name.trim()) return 'Informe o nome completo'
    if (!/\S+@\S+\.\S+/.test(email)) return 'E-mail inválido'
    if (cpf.replace(/\D/g, '').length < 11) return 'CPF inválido'
    if (phone.replace(/\D/g, '').length < 10) return 'Telefone inválido'
    if (cep.replace(/\D/g, '').length < 8) return 'CEP inválido'
    if (!street.trim()) return 'Informe a rua'
    if (!number.trim()) return 'Informe o número'
    if (!city.trim()) return 'Informe a cidade'
    return ''
  }

  function handleNextStep() {
    const err = validateDados()
    if (err) { setError(err); return }
    setError('')
    setStep('pagamento')
  }

  async function handleCardSubmit(formData: { token: string; installments: number; payment_method_id: string; issuer_id: string }) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          annual,
          payerEmail: personal.email,
          cardTokenId: formData.token,
          payer: {
            name: personal.name,
            email: personal.email,
            identification: { type: 'CPF', number: personal.cpf.replace(/\D/g, '') },
            phone: { number: personal.phone.replace(/\D/g, '') },
            address: {
              zip_code: personal.cep.replace(/\D/g, ''),
              street_name: personal.street,
              street_number: personal.number,
              city: personal.city,
              federal_unit: personal.state,
            },
          },
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Erro ao processar assinatura')

      // Se MP retornar init_point (autorização pendente) redireciona; senão mostra sucesso
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        setStep('sucesso')
      }
    } catch (err: any) {
      setError(err.message ?? 'Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'sucesso') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-white rounded-2xl border border-stone-200 p-10">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-700" />
          </div>
          <h1 className="text-xl font-medium text-stone-900 mb-2">Assinatura confirmada!</h1>
          <p className="text-sm text-stone-500 mb-6">
            Bem-vindo ao <strong className="text-green-800">{plan.label}</strong>.<br />
            Você já tem acesso completo à plataforma.
          </p>
          <Link href="/app" className="inline-flex items-center gap-2 bg-green-800 text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-green-900 transition-colors">
            Entrar na plataforma
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* NAV */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-stone-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-800 rounded-md flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-stone-900">CampoClima</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-stone-400">
          <Lock className="w-3 h-3" /> Pagamento 100% seguro · Mercado Pago
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-[1fr_380px] gap-8 items-start">

        {/* FORMULÁRIO */}
        <div className="space-y-6">

          {/* Stepper */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 text-sm font-medium ${step === 'dados' ? 'text-green-800' : 'text-stone-400'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 ${step === 'dados' ? 'border-green-700 bg-green-700 text-white' : 'border-stone-300 text-stone-400'}`}>
                {step === 'pagamento' ? <Check className="w-3.5 h-3.5" /> : '1'}
              </span>
              Dados pessoais
            </div>
            <div className="flex-1 h-px bg-stone-200" />
            <div className={`flex items-center gap-2 text-sm font-medium ${step === 'pagamento' ? 'text-green-800' : 'text-stone-400'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 ${step === 'pagamento' ? 'border-green-700 bg-green-700 text-white' : 'border-stone-300 text-stone-400'}`}>
                2
              </span>
              Pagamento
            </div>
          </div>

          {/* STEP 1 — Dados pessoais */}
          {step === 'dados' && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
              <h2 className="text-base font-medium text-stone-900">Seus dados</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Nome completo *</label>
                  <input value={personal.name} onChange={e => set('name', e.target.value)}
                    placeholder="João Silva" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>E-mail *</label>
                  <input type="email" value={personal.email} onChange={e => set('email', e.target.value)}
                    placeholder="joao@fazenda.com.br" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>CPF *</label>
                  <input value={personal.cpf}
                    onChange={e => set('cpf', formatCPF(e.target.value))}
                    placeholder="000.000.000-00" className={inputCls} maxLength={14} />
                </div>
                <div>
                  <label className={labelCls}>Telefone / WhatsApp *</label>
                  <input value={personal.phone}
                    onChange={e => set('phone', formatPhone(e.target.value))}
                    placeholder="(65) 99999-9999" className={inputCls} maxLength={15} />
                </div>
                <div>
                  <label className={labelCls}>CEP *</label>
                  <input value={personal.cep}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 8)
                      set('cep', v)
                      if (v.length === 8) fetchCEP(v)
                    }}
                    placeholder="78000-000" className={inputCls} maxLength={9} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Endereço</label>
                  <input value={personal.street} onChange={e => set('street', e.target.value)}
                    placeholder="Rua das Palmeiras" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Número</label>
                  <input value={personal.number} onChange={e => set('number', e.target.value)}
                    placeholder="123" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Cidade</label>
                  <input value={personal.city} onChange={e => set('city', e.target.value)}
                    placeholder="Sorriso" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Estado</label>
                  <select value={personal.state} onChange={e => set('state', e.target.value)} className={inputCls}>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <button onClick={handleNextStep}
                className="w-full bg-green-800 text-white rounded-xl py-3 text-sm font-medium hover:bg-green-900 transition-colors flex items-center justify-center gap-2">
                Continuar para pagamento
              </button>
            </div>
          )}

          {/* STEP 2 — Pagamento */}
          {step === 'pagamento' && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setStep('dados')} className="text-stone-400 hover:text-stone-700 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-medium text-stone-900">Dados do cartão</h2>
              </div>

              <p className="text-xs text-stone-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                Seus dados são criptografados pelo Mercado Pago. O CampoClima não armazena dados do cartão.
              </p>

              {mpReady ? (
                <div className="mp-brick-wrapper">
                  <CardPayment
                    initialization={{ amount: price }}
                    customization={{
                      paymentMethods: { maxInstallments: 1 },
                      visual: {
                        style: {
                          theme: 'default',
                          customVariables: {
                            baseColor: '#3b6d11',
                            buttonTextColor: '#ffffff',
                          },
                        },
                      },
                    }}
                    onSubmit={async (formData) => {
                      await handleCardSubmit(formData as any)
                    }}
                    onError={(err) => setError('Erro no cartão: ' + err.message)}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-stone-400 text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando formulário de pagamento...
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-green-800">
                  <Loader2 className="w-4 h-4 animate-spin" /> Processando assinatura...
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RESUMO DO PEDIDO */}
        <div className="space-y-4 sticky top-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <p className="text-xs text-stone-400 mb-3 uppercase tracking-wide font-medium">Resumo do pedido</p>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-green-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-900">{plan.label}</p>
                <p className="text-xs text-stone-400">{annual ? 'Cobrança mensal com desconto anual' : 'Cobrança mensal'}</p>
              </div>
            </div>

            <div className="border-t border-stone-100 pt-4 space-y-2">
              {plan.features.map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-stone-500">
                  <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" /> {f}
                </div>
              ))}
            </div>

            <div className="border-t border-stone-100 mt-4 pt-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-stone-500">Total mensal</span>
                <div className="text-right">
                  <span className="text-2xl font-medium text-stone-900">R$ {price}</span>
                  <span className="text-xs text-stone-400">/mês</span>
                </div>
              </div>
              {annual && (
                <p className="text-xs text-green-700 mt-1 text-right">
                  Economia de R$ {(PLANS[planId].monthly - price) * 12}/ano
                </p>
              )}
            </div>

            <p className="text-[10px] text-stone-400 mt-3 leading-relaxed">
              Assinatura recorrente. Cobrado automaticamente todo mês. Cancele quando quiser sem multa.
            </p>
          </div>

          {/* Selos de segurança */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-2.5">
            {[
              { icon: ShieldCheck, text: 'Pagamento seguro via Mercado Pago' },
              { icon: Lock, text: 'Dados criptografados (SSL/TLS)' },
              { icon: Check, text: 'Cancele a qualquer momento' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs text-stone-500">
                <Icon className="w-3.5 h-3.5 text-green-600 flex-shrink-0" /> {text}
              </div>
            ))}
            <div className="pt-2 border-t border-stone-100">
              <img
                src="https://imgmp.mlstatic.com/org-img/banners/br/medios/online/350X109.jpg"
                alt="Mercado Pago — meios de pagamento"
                className="w-full rounded opacity-70"
              />
            </div>
          </div>

          <p className="text-[10px] text-stone-400 text-center leading-relaxed px-2">
            Ao assinar você concorda com os{' '}
            <Link href="#" className="underline">Termos de Uso</Link>
            {' '}e a{' '}
            <Link href="#" className="underline">Política de Privacidade</Link>
            {' '}do CampoClima.
          </p>
        </div>
      </div>
    </div>
  )
}
