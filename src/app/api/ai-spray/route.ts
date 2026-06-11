import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimit } from '@/lib/rate-limit'

const client = new Anthropic()

export async function POST(req: Request) {
  const limited = rateLimit(req, { key: 'ai-spray', limit: 10, windowMs: 60_000 })
  if (limited) return limited

  const { windSpeed, humidity, temp, crop, phase, problem } = await req.json()

  const prompt = `Você é um agrônomo especialista em proteção de plantas. Analise as condições e sugira o tratamento.

CONDIÇÕES ATUAIS:
- Vento: ${windSpeed} km/h
- Umidade relativa: ${humidity}%
- Temperatura: ${temp}°C

CULTURA: ${crop}
FASE FENOLÓGICA: ${phase}
PROBLEMA RELATADO: ${problem}

Responda em JSON (sem markdown):
{
  "windowStatus": "aberta|restrita|fechada",
  "windowReason": "motivo em 1 frase",
  "bestTime": "melhor horário para aplicação",
  "products": [
    {
      "name": "nome comercial ou princípio ativo",
      "type": "fungicida|inseticida|herbicida|acaricida|outro",
      "dose": "dose por hectare",
      "interval": "intervalo de reaplicação"
    }
  ],
  "precautions": ["precaução 1", "precaução 2"],
  "tip": "dica prática do agrônomo em 1 frase"
}`

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    return NextResponse.json(JSON.parse(text))
  } catch {
    return NextResponse.json({ windowStatus: 'aberta', windowReason: 'Condições favoráveis', products: [], precautions: [], tip: '' })
  }
}
