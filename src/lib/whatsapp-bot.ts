import Anthropic from '@anthropic-ai/sdk'
import { sendText, sendButtons, sendList, getMediaUrl, downloadMedia } from './whatsapp'

const anthropic = new Anthropic()

// In-memory conversation history per phone number
// In production: replace with Redis or Supabase
const sessions = new Map<string, { role: 'user' | 'assistant'; content: string }[]>()

const SYSTEM_PROMPT = `Você é o AgroAssistente do CampoClima — um agrônomo virtual via WhatsApp para produtores rurais brasileiros.

Regras de resposta no WhatsApp:
- Respostas CURTAS (máx 3 parágrafos). WhatsApp não é e-mail.
- Use emojis com moderação: 🌱 🌧 ⚠️ ✅
- Bullet points com hífen (-), não asterisco
- Negrito com *asterisco* para termos importantes
- Se for lista, separe com quebra de linha
- Nunca use markdown de cabeçalho (#, ##)
- Tom: amigável, direto, como um agrônomo colega de profissão

Expertise: pragas, doenças, adubação, irrigação, pulverização, clima, colheita, solo, preços agrícolas.
Se não souber ou for muito específico: "Melhor consultar um agrônomo local com CREA."
Não responda perguntas fora de agricultura.`

// ──────────────────────────────────────────────
// Main handler — called from webhook
// ──────────────────────────────────────────────

export async function handleIncomingMessage(from: string, message: WaMessage) {
  // Reset idle sessions after 30 min (simple TTL via message count cap)
  const history = sessions.get(from) ?? []

  if (message.type === 'text') {
    const text = message.text!.body.trim()
    const lower = text.toLowerCase()

    // Command shortcuts
    if (lower === 'oi' || lower === 'olá' || lower === 'ola' || lower === 'menu' || lower === 'ajuda') {
      sessions.delete(from) // reset session on greeting
      await sendWelcome(from)
      return
    }

    if (lower === 'clima' || lower === 'previsao' || lower === 'previsão') {
      await sendText(from, '🌧 Para ver o clima da sua fazenda em tempo real, acesse:\nhttps://campoclima.com.br/app\n\nOu me diga sua cidade que busco a previsão agora!')
      return
    }

    if (lower === 'alertas' || lower === 'alert') {
      await sendText(from, '🔔 Seus alertas estão configurados.\nVocê receberá mensagens aqui quando a IA detectar:\n- Risco de geada\n- Janela de pulverização\n- Déficit hídrico\n- Chuva intensa\n\nPara ajustar, acesse *Configurações* no CampoClima.')
      return
    }

    if (lower === 'sair' || lower === 'parar' || lower === 'cancelar') {
      sessions.delete(from)
      await sendText(from, '👋 Ok! Para voltar, é só me mandar uma mensagem.\n\n_CampoClima — Inteligência para o campo_')
      return
    }

    // Handle interactive button/list reply
    // (falls through to AI if not a command)
    await chatWithAI(from, text, history)
    return
  }

  if (message.type === 'interactive') {
    const id = message.interactive!.button_reply?.id ?? message.interactive!.list_reply?.id
    await handleInteractiveReply(from, id ?? '')
    return
  }

  if (message.type === 'image') {
    await handleImageMessage(from, message.image!.id, message.image!.caption)
    return
  }

  // Fallback for unsupported types
  await sendText(from, 'Oi! Me mande uma *mensagem de texto* ou uma *foto* da sua lavoura. 🌱\n\nDigite *ajuda* para ver o que posso fazer.')
}

// ──────────────────────────────────────────────
// AI chat
// ──────────────────────────────────────────────

async function chatWithAI(from: string, userText: string, history: { role: 'user' | 'assistant'; content: string }[]) {
  // Keep last 10 turns to avoid token bloat
  const trimmed = history.slice(-10)
  trimmed.push({ role: 'user', content: userText })

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: trimmed,
  })

  const reply = response.content[0].type === 'text' ? response.content[0].text : 'Não entendi. Pode reformular?'

  trimmed.push({ role: 'assistant', content: reply })
  sessions.set(from, trimmed)

  await sendText(from, reply)
}

// ──────────────────────────────────────────────
// Image: identify pest / disease
// ──────────────────────────────────────────────

async function handleImageMessage(from: string, mediaId: string, caption?: string) {
  await sendText(from, '📸 Analisando a imagem da sua lavoura...\n_Aguarde um instante_')

  try {
    const mediaUrl = await getMediaUrl(mediaId)
    const buffer   = await downloadMedia(mediaUrl)
    const base64   = buffer.toString('base64')

    const contextNote = caption ? `O produtor descreveu: "${caption}"\n\n` : ''

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
          },
          {
            type: 'text',
            text: `${contextNote}Você é um fitopatologista e entomologista especializado em culturas tropicais brasileiras. Analise esta imagem da lavoura e responda de forma CURTA e PRÁTICA (máx 4 parágrafos, formato WhatsApp):

1. O que você vê (praga, doença, deficiência, ou normal)?
2. Diagnóstico provável
3. Ação recomendada (produto, dose ou manejo)
4. Urgência: baixa / média / alta

Se a imagem não for de lavoura, informe gentilmente.`,
          },
        ],
      }],
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : 'Não consegui analisar a imagem.'
    await sendText(from, `🔬 *Diagnóstico IA*\n\n${reply}`)
    await sendText(from, '💡 Para um laudo completo com receituário, acesse *Solo & Análise* no CampoClima.\nPrecisa de mais ajuda? É só perguntar!')

  } catch (err) {
    console.error('Image analysis error:', err)
    await sendText(from, '⚠️ Não consegui analisar a imagem. Tente enviar uma foto mais nítida da folha ou planta afetada.')
  }
}

// ──────────────────────────────────────────────
// Welcome menu
// ──────────────────────────────────────────────

async function sendWelcome(from: string) {
  await sendText(from,
    `👋 Olá! Sou o *AgroAssistente do CampoClima*.\n\nPosso te ajudar com:\n🌧 Clima e alertas da sua fazenda\n🔬 Identificar pragas e doenças (envie uma foto!)\n🌱 Recomendações agronômicas\n💊 Dosagem de defensivos e fertilizantes\n📅 Calendário agrícola\n\nSó me perguntar — ou escolha uma opção abaixo:`
  )

  await sendButtons(from, 'Como posso te ajudar hoje?', [
    { id: 'btn_clima',   title: '🌧 Ver clima' },
    { id: 'btn_foto',    title: '📸 Analisar foto' },
    { id: 'btn_alertas', title: '🔔 Meus alertas' },
  ])
}

// ──────────────────────────────────────────────
// Interactive button replies
// ──────────────────────────────────────────────

async function handleInteractiveReply(from: string, id: string) {
  switch (id) {
    case 'btn_clima':
      await sendText(from, '🌧 Para ver clima em tempo real com mapa e NDVI:\n👉 https://campoclima.com.br/app\n\nOu me diga sua *cidade* que busco a previsão agora!')
      break
    case 'btn_foto':
      await sendText(from, '📸 Perfeito! Tire uma foto *clara e próxima* da folha, fruto ou planta com o problema e me envie aqui.\n\nDica: foto com boa iluminação natural dá resultado muito melhor! ☀️')
      break
    case 'btn_alertas':
      await sendText(from, '🔔 *Seus alertas ativos:*\n- 🚨 Geada (risco alto)\n- ⚠️ Janela de pulverização\n- ℹ️ Déficit hídrico\n\nPara ajustar quais alertas receber:\nConfigurar → WhatsApp → CampoClima')
      break
    default:
      await sendText(from, 'Não reconheci essa opção. Digite *ajuda* para ver o menu.')
  }
}

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface WaMessage {
  type: 'text' | 'image' | 'audio' | 'interactive' | 'button' | 'unknown'
  text?: { body: string }
  image?: { id: string; caption?: string; mime_type: string }
  interactive?: {
    type: string
    button_reply?: { id: string; title: string }
    list_reply?: { id: string; title: string }
  }
}
