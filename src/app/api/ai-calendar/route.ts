import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimit } from '@/lib/rate-limit'

const client = new Anthropic()

export async function POST(req: Request) {
  const limited = rateLimit(req, { key: 'ai-calendar', limit: 10, windowMs: 60_000 })
  if (limited) return limited

  const { crop, field, plantedAt, harvestAt, currentDate } = await req.json()

  const prompt = `Você é um agrônomo especialista. Gere um cronograma agrícola para a cultura abaixo.

CULTURA: ${crop}
TALHÃO: ${field}
DATA DE PLANTIO: ${plantedAt}
DATA DE COLHEITA PREVISTA: ${harvestAt}
DATA ATUAL: ${currentDate}

Gere entre 8 e 12 eventos agrícolas importantes entre o plantio e a colheita.
Retorne EXATAMENTE um JSON válido (sem markdown):
[
  {
    "id": "ai_1",
    "date": "YYYY-MM-DD",
    "title": "título curto (máx 50 chars)",
    "type": "plantio|aplicacao|colheita|irrigacao|monitoramento|outro",
    "crop": "${crop}",
    "field": "${field}",
    "done": false,
    "aiGenerated": true
  }
]

Inclua: monitoramento de pragas/doenças, adubações, irrigações críticas, tratamentos, dessecação e colheita.`

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
    return NextResponse.json(JSON.parse(text))
  } catch {
    return NextResponse.json([])
  }
}
