import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { rateLimit } from '@/lib/rate-limit'
import { recordEvent } from '@/lib/server-events'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const OWNER_EMAIL = 'erikuemura@gmail.com'
const FROM = process.env.RESEND_FROM ?? 'CampoClima <onboarding@resend.dev>'

// Captura de leads da landing (e-mail ou WhatsApp + cidade/UF opcional)
export async function POST(req: Request) {
  const limited = rateLimit(req, { key: 'leads', limit: 5, windowMs: 60_000 })
  if (limited) return limited

  const { contact, city } = await req.json().catch(() => ({}))
  if (typeof contact !== 'string') {
    return NextResponse.json({ error: 'Informe e-mail ou WhatsApp' }, { status: 400 })
  }

  const trimmed = contact.trim()
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)
  const isPhone = /^[\d\s()+-]{10,16}$/.test(trimmed)
  if (!isEmail && !isPhone) {
    return NextResponse.json({ error: 'Informe um e-mail ou WhatsApp válido' }, { status: 400 })
  }
  if (trimmed.length > 80 || (typeof city === 'string' && city.length > 60)) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const cityLabel = typeof city === 'string' && city.trim() ? city.trim() : null

  recordEvent('lead', 'site', {
    contact: trimmed,
    kind: isEmail ? 'email' : 'whatsapp',
    city: cityLabel,
  })

  if (resend) {
    const emailPromises: Promise<unknown>[] = []

    // Notificação para o dono
    emailPromises.push(
      resend.emails.send({
        from: FROM,
        to: OWNER_EMAIL,
        subject: `Novo lead CampoClima — ${isEmail ? trimmed : 'WhatsApp'}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#1c4006;margin-bottom:4px">Novo lead captado 🌱</h2>
            <p style="color:#78716c;font-size:14px;margin-top:0">Landing page · ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
            <table style="width:100%;border-collapse:collapse;margin-top:16px">
              <tr><td style="padding:8px 0;color:#57534e;font-size:14px;border-bottom:1px solid #e7e5e4"><strong>Contato</strong></td><td style="padding:8px 0;font-size:14px;border-bottom:1px solid #e7e5e4">${trimmed}</td></tr>
              <tr><td style="padding:8px 0;color:#57534e;font-size:14px;border-bottom:1px solid #e7e5e4"><strong>Tipo</strong></td><td style="padding:8px 0;font-size:14px;border-bottom:1px solid #e7e5e4">${isEmail ? 'E-mail' : 'WhatsApp'}</td></tr>
              ${cityLabel ? `<tr><td style="padding:8px 0;color:#57534e;font-size:14px"><strong>Cidade/UF</strong></td><td style="padding:8px 0;font-size:14px">${cityLabel}</td></tr>` : ''}
            </table>
            <a href="https://campoclima.com.br/backoffice" style="display:inline-block;margin-top:20px;background:#3b6d11;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px">Ver no backoffice →</a>
          </div>`,
      })
    )

    // Boas-vindas para o lead (só se for email)
    if (isEmail) {
      emailPromises.push(
        resend.emails.send({
          from: FROM,
          to: trimmed,
          subject: 'Bem-vindo ao CampoClima 🌱',
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
              <div style="background:#1c4006;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
                <h1 style="color:white;margin:0;font-size:22px">CampoClima</h1>
                <p style="color:#86efac;margin:6px 0 0;font-size:13px">Inteligência para o campo</p>
              </div>
              <h2 style="color:#1c4006">Olá! Recebemos seu contato 👋</h2>
              <p style="color:#57534e;line-height:1.6">Obrigado por se interessar pelo CampoClima. Você será um dos primeiros a saber quando lançarmos novidades e a receber dicas agrícolas para a sua região.</p>
              <p style="color:#57534e;line-height:1.6">Enquanto isso, que tal experimentar nossa plataforma gratuitamente?</p>
              <a href="https://campoclima.com.br/login" style="display:inline-block;margin:8px 0 24px;background:#3b6d11;color:white;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600">Criar conta grátis →</a>
              <p style="color:#a8a29e;font-size:12px;border-top:1px solid #e7e5e4;padding-top:16px;margin-top:8px">Você recebeu este email porque se cadastrou em campoclima.com.br. Se foi engano, pode ignorar.</p>
            </div>`,
        })
      )
    }

    await Promise.allSettled(emailPromises)
  }

  return NextResponse.json({ ok: true })
}
