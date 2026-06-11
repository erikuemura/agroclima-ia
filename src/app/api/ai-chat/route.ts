import Anthropic from '@anthropic-ai/sdk'
import { getDemoProfileFromCookie } from '@/lib/demo-profiles'

const client = new Anthropic()

const TEXT_MODEL   = 'claude-haiku-4-5-20251001'
const VISION_MODEL = 'claude-sonnet-4-6'

export async function POST(req: Request) {
  const cookieHeader = req.headers.get('cookie') ?? ''
  const profile = getDemoProfileFromCookie(cookieHeader)

  const body = await req.json()
  const { messages, imageBase64, imageMime } = body as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    imageBase64?: string
    imageMime?: string
  }

  // Cap history to save tokens
  const history = messages.slice(-8)
  const lastUser = history[history.length - 1]

  const cropList  = profile.crops.map(c => `${c.name} (${c.phase}, ${c.hectares}ha)`).join(', ')
  const alertList = profile.alerts.slice(0, 3).map(a => `${a.title}: ${a.description}`).join(' | ')

  const systemText = `Você é o AgroAssistente do CampoClima — agrônomo virtual para produtores rurais brasileiros.

FAZENDA ATIVA:
- Nome: ${profile.farm.name} · ${profile.farm.city}/${profile.farm.state}
- Área: ${profile.farm.hectares} ha
- Culturas: ${cropList}
- Alertas ativos: ${alertList || 'nenhum'}

REGRAS:
- Resposta curta e direta (máx 3 parágrafos)
- Português simples, sem jargão desnecessário
- Use **negrito** para termos técnicos
- Quando houver imagem: diagnóstico, causa, ação recomendada, urgência
- Se não souber com certeza: sugira consultar agrônomo local com CREA
- Não responda perguntas fora de agricultura`

  // Build last message content (may include image)
  const userContent: Anthropic.ContentBlockParam[] = []
  if (imageBase64 && imageMime) {
    userContent.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: imageMime as 'image/jpeg' | 'image/png' | 'image/webp',
        data: imageBase64,
      },
    })
  }
  userContent.push({ type: 'text', text: lastUser?.content ?? '' })

  const apiMessages: Anthropic.MessageParam[] = [
    ...history.slice(0, -1).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: userContent },
  ]

  const model = imageBase64 ? VISION_MODEL : TEXT_MODEL

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const s = await client.messages.stream({
          model,
          max_tokens: imageBase64 ? 800 : 500,
          system: [
            {
              type: 'text',
              text: systemText,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: apiMessages,
        })

        for await (const chunk of s) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } catch {
        controller.enqueue(encoder.encode('\n\n[Erro ao gerar resposta. Tente novamente.]'))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'x-anthropic-beta': 'prompt-caching-2024-07-31',
    },
  })
}
