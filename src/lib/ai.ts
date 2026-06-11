import Anthropic from '@anthropic-ai/sdk'
import type { WeatherCurrent, WeatherDay, Crop, Alert, SoilData } from '@/types'

const client = new Anthropic()

export async function generateAlerts(
  current: WeatherCurrent,
  days: WeatherDay[],
  crops: Crop[]
): Promise<Alert[]> {
  const cropList = crops.map(c => `${c.name} (${c.phase}, ${c.hectares}ha)`).join(', ')
  const forecast = days.slice(0, 7).map(d =>
    `${d.label}: ${d.tempMax}°/${d.tempMin}°, ${d.rain}mm, vento ${d.windMax}km/h, ícone ${d.icon}`
  ).join('\n')

  const prompt = `Você é um agrônomo especialista. Analise os dados abaixo e gere alertas práticos para o produtor rural.

CLIMA ATUAL:
- Temperatura: ${current.temp}°C, Umidade: ${current.humidity}%
- Vento: ${current.windSpeed} km/h
- Chuva acumulada 7d: ${current.rain7d} mm
- ETo hoje: ${current.eto} mm, ETo 7d: ${current.eto7d} mm

PREVISÃO 7 DIAS:
${forecast}

CULTURAS MONITORADAS: ${cropList}

Retorne EXATAMENTE um JSON válido neste formato (sem markdown, sem explicações):
[
  {
    "id": "1",
    "severity": "danger|warning|success|info",
    "title": "título curto (máx 50 chars)",
    "description": "descrição prática (máx 100 chars)",
    "crop": "nome da cultura ou null"
  }
]

Gere entre 3 e 5 alertas relevantes. Priorize: tempestades, déficit hídrico, janelas de pulverização, risco de geada, calor excessivo.`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
  try {
    return JSON.parse(text)
  } catch {
    return []
  }
}

export async function analyzeSoil(soil: SoilData): Promise<string> {
  const prompt = `Você é um engenheiro agrônomo especialista em fertilidade do solo. Analise os dados abaixo e gere um laudo técnico em português simples, acessível para pequenos e médios produtores rurais.

DADOS DA ANÁLISE DE SOLO:
- pH: ${soil.ph}
- Nitrogênio (N): ${soil.nitrogen} mg/kg
- Fósforo (P): ${soil.phosphorus} mg/kg
- Potássio (K): ${soil.potassium} mg/kg
- Matéria Orgânica: ${soil.organicMatter}%
- Textura: ${soil.texture}
- Cultura pretendida: ${soil.crop}

Estruture o laudo com:
1. **Diagnóstico geral** (2-3 frases)
2. **Pontos de atenção** (liste os nutrientes fora do ideal)
3. **Recomendações de correção** (calcário, gesso, doses de fertilizante)
4. **Adubação recomendada para ${soil.crop}** (NPK de base + cobertura)
5. **Dica prática** (1 ação prioritária para o produtor fazer agora)

Use linguagem clara, evite jargão técnico excessivo. Seja direto e prático.`

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  return msg.content[0].type === 'text' ? msg.content[0].text : ''
}

export async function chatWithAgronomist(
  messages: { role: 'user' | 'assistant'; content: string }[],
  context: { city: string; crops: string[] }
): Promise<string> {
  const system = `Você é o AgroAssistente — um agrônomo virtual especializado em auxiliar pequenos e médios produtores rurais brasileiros.

Contexto da fazenda:
- Localização: ${context.city}
- Culturas: ${context.crops.join(', ')}

Suas diretrizes:
- Responda em português claro e simples, sem jargão técnico desnecessário
- Seja prático e direto — o produtor está no campo
- Quando relevante, mencione época do ano, região e cultura específica
- Se não tiver certeza, diga isso e oriente a consultar um agrônomo local
- Áreas de expertise: pragas, doenças, manejo, clima, adubação, colheita, custos
- Respostas curtas para perguntas simples, detalhadas para problemas complexos`

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system,
    messages,
  })

  return msg.content[0].type === 'text' ? msg.content[0].text : ''
}
