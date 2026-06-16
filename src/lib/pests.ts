// ─────────────────────────────────────────────────────────────
// Base de conhecimento de pragas e doenças das principais culturas
// brasileiras. Conteúdo curado a partir de recomendações da Embrapa
// e do MIP (Manejo Integrado de Pragas). Funções puras, testáveis.
// ─────────────────────────────────────────────────────────────

export type PestKind = 'praga' | 'doença'
export type Severity = 'alta' | 'média' | 'baixa'

export interface Pest {
  id: string
  name: string
  scientificName: string
  kind: PestKind
  emoji: string
  crops: string[]            // substrings de nome de cultura que hospeda
  severity: Severity         // potencial de dano econômico
  criticalPhases: string[]   // fases fenológicas mais suscetíveis (substring)
  symptoms: string[]         // sinais de identificação no campo
  damage: string             // descrição do prejuízo
  controlLevel: string       // nível de ação (quando intervir) — MIP
  favorability: string       // condições que favorecem
  management: {
    cultural: string[]
    biological: string[]
    chemical: string[]
  }
  // se houver modelo de risco climático no intelligence layer
  riskModelId?: 'ferrugem-asiatica' | 'mofo-branco'
}

export const PESTS: Pest[] = [
  // ── SOJA ──────────────────────────────────────────────────
  {
    id: 'ferrugem-asiatica',
    name: 'Ferrugem asiática',
    scientificName: 'Phakopsora pachyrhizi',
    kind: 'doença', emoji: '🍂',
    crops: ['soja'], severity: 'alta',
    criticalPhases: ['floração', 'enchimento', 'vegetativo'],
    symptoms: [
      'Pústulas (pontos) cinza-castanhas na face inferior das folhas baixeiras',
      'Pequenas lesões angulares que liberam pó (urediniósporos)',
      'Amarelecimento e desfolha precoce de baixo para cima',
    ],
    damage: 'Desfolha antecipada reduz o enchimento de grãos; perdas podem passar de 50% em epidemias não controladas.',
    controlLevel: 'Aplicação preventiva no fechamento das entrelinhas ou aos primeiros sinais. Monitorar folhas baixeiras a cada 2 dias na fase crítica.',
    favorability: 'Temperatura 18–28°C, molhamento foliar prolongado (orvalho/chuva), alta umidade.',
    management: {
      cultural: ['Vazio sanitário (eliminar soja voluntária no entressafra)', 'Cultivares de ciclo precoce', 'Semeadura no início da janela'],
      biological: ['Fungicidas biológicos (Bacillus) como complemento preventivo'],
      chemical: ['Fungicidas triazol + estrobilurina + carboxamida em rotação de mecanismos de ação para evitar resistência'],
    },
    riskModelId: 'ferrugem-asiatica',
  },
  {
    id: 'mofo-branco',
    name: 'Mofo branco',
    scientificName: 'Sclerotinia sclerotiorum',
    kind: 'doença', emoji: '⚪',
    crops: ['soja', 'feijão', 'algod'], severity: 'alta',
    criticalPhases: ['floração'],
    symptoms: [
      'Micélio branco cotonoso nas hastes e vagens',
      'Apodrecimento aquoso seguido de murcha',
      'Escleródios (estruturas pretas, tipo fezes de rato) dentro da haste',
    ],
    damage: 'Tomba e seca plantas em reboleiras; escleródios sobrevivem anos no solo, comprometendo safras futuras.',
    controlLevel: 'Manejo preventivo no início da floração em áreas com histórico. Não há nível de dano de resgate eficiente.',
    favorability: 'Clima ameno (15–25°C), solo úmido, dossel fechado e irrigação por aspersão.',
    management: {
      cultural: ['Reduzir população de plantas (mais arejamento)', 'Rotação com gramíneas (milho, sorgo)', 'Evitar irrigação por aspersão na floração'],
      biological: ['Trichoderma e Bacillus aplicados no solo para degradar escleródios'],
      chemical: ['Fungicidas específicos no início da floração (R1)'],
    },
    riskModelId: 'mofo-branco',
  },
  {
    id: 'percevejo-marrom',
    name: 'Percevejo-marrom',
    scientificName: 'Euschistus heros',
    kind: 'praga', emoji: '🐞',
    crops: ['soja'], severity: 'alta',
    criticalPhases: ['enchimento', 'grão', 'formação de vagens'],
    symptoms: [
      'Insetos marrons com listra clara no abdômen',
      'Vagens chochas, grãos murchos ou manchados',
      'Retenção foliar ("haste verde") — planta não seca',
    ],
    damage: 'Suga grãos em formação: reduz peso, poder germinativo e qualidade. Principal praga da soja na fase reprodutiva.',
    controlLevel: 'Pano de batida: 2 percevejos/metro (produção de grãos) ou 1/metro (produção de sementes).',
    favorability: 'Fase de enchimento de grãos; temperaturas altas aceleram o ciclo.',
    management: {
      cultural: ['Manejo de plantas hospedeiras na entressafra', 'Dessecação uniforme'],
      biological: ['Parasitoide de ovos Telenomus podisi', 'Fungo Beauveria bassiana'],
      chemical: ['Inseticidas no nível de controle; preservar inimigos naturais com produtos seletivos'],
    },
  },
  {
    id: 'lagarta-helicoverpa',
    name: 'Lagarta Helicoverpa',
    scientificName: 'Helicoverpa armigera',
    kind: 'praga', emoji: '🐛',
    crops: ['soja', 'milho', 'algod', 'feijão'], severity: 'alta',
    criticalPhases: ['vegetativo', 'floração', 'enchimento'],
    symptoms: [
      'Lagartas grandes (até 4 cm) com listras longitudinais',
      'Furos em vagens, maçãs e espigas (ataca estruturas reprodutivas)',
      'Desfolha e danos diretos aos frutos',
    ],
    damage: 'Polífaga e de difícil controle; ataca diretamente a parte reprodutiva, causando perdas severas.',
    controlLevel: 'Soja: 2 lagartas (>1,5 cm)/metro na fase reprodutiva. Monitorar com armadilhas de feromônio.',
    favorability: 'Cultivos sucessivos e diversidade de hospedeiros mantêm a população alta.',
    management: {
      cultural: ['Rotação de culturas', 'Destruição de restos culturais', 'Refúgio em áreas Bt'],
      biological: ['Baculovírus', 'Parasitoide Trichogramma', 'Bacillus thuringiensis'],
      chemical: ['Inseticidas com rotação de modo de ação; aplicar em lagartas pequenas'],
    },
  },
  // ── MILHO ─────────────────────────────────────────────────
  {
    id: 'cigarrinha-milho',
    name: 'Cigarrinha-do-milho',
    scientificName: 'Dalbulus maidis',
    kind: 'praga', emoji: '🦗',
    crops: ['milho'], severity: 'alta',
    criticalPhases: ['germinação', 'emergência', 'vegetativo', 'v6'],
    symptoms: [
      'Insetos pequenos amarelo-palha no cartucho',
      'Enfezamento (plantas baixas), avermelhamento e estrias claras nas folhas',
      'Espigas falhadas ou múltiplas e improdutivas',
    ],
    damage: 'Vetor dos enfezamentos (molicutes) e da risca — doenças que podem zerar a produtividade. Praga nº 1 do milho atual.',
    controlLevel: 'Controle preventivo nas primeiras semanas (V0–V4), janela em que a transmissão é mais danosa.',
    favorability: 'Cultivo escalonado o ano todo ("ponte verde"), temperaturas altas.',
    management: {
      cultural: ['Evitar semeaduras escalonadas e milho voluntário', 'Janela de semeadura regional', 'Tratamento de sementes'],
      biological: ['Fungos entomopatogênicos (Beauveria, Metarhizium)'],
      chemical: ['Inseticidas no início do ciclo; foco na fase vegetativa inicial'],
    },
  },
  {
    id: 'lagarta-cartucho',
    name: 'Lagarta-do-cartucho',
    scientificName: 'Spodoptera frugiperda',
    kind: 'praga', emoji: '🐛',
    crops: ['milho', 'algod', 'soja'], severity: 'alta',
    criticalPhases: ['vegetativo', 'cartucho', 'v6'],
    symptoms: [
      'Raspaduras e furos nas folhas do cartucho',
      'Serragem (excrementos) no cartucho',
      'Lagarta com "Y" invertido na cabeça e 4 pontos no penúltimo segmento',
    ],
    damage: 'Destrói o cartucho e reduz área foliar; em ataque severo compromete o pendoamento e a produtividade.',
    controlLevel: 'Cartucho: 20% de plantas com raspaduras/lagartas pequenas. Atuar antes de a lagarta se proteger no cartucho.',
    favorability: 'Veranicos e altas temperaturas; sobreposição de cultivos.',
    management: {
      cultural: ['Milho Bt com refúgio', 'Rotação de culturas', 'Destruição de soqueira'],
      biological: ['Baculovírus spodoptera', 'Trichogramma', 'Bt'],
      chemical: ['Inseticidas em lagartas pequenas; rotação de modo de ação contra resistência'],
    },
  },
  // ── ALGODÃO ───────────────────────────────────────────────
  {
    id: 'bicudo-algodoeiro',
    name: 'Bicudo-do-algodoeiro',
    scientificName: 'Anthonomus grandis',
    kind: 'praga', emoji: '🪲',
    crops: ['algod'], severity: 'alta',
    criticalPhases: ['floração', 'botão floral', 'capulho'],
    symptoms: [
      'Besouro com rostro (bico) longo',
      'Botões florais com orifícios de oviposição e que caem ("queda de botões")',
      'Brácteas abertas em forma de estrela',
    ],
    damage: 'Principal praga do algodão: ataca botões e maçãs, derrubando estruturas reprodutivas e reduzindo drasticamente a produção.',
    controlLevel: 'Armadilhas de feromônio + 5–10% de botões atacados. Monitoramento intensivo nas bordaduras.',
    favorability: 'Restos culturais e algodão tigüera (voluntário) no entressafra.',
    management: {
      cultural: ['Destruição de soqueira obrigatória', 'Vazio sanitário', 'Catação de botões caídos'],
      biological: ['Parasitoides de bicudo', 'Beauveria bassiana'],
      chemical: ['Inseticidas em bordaduras e área total no nível de controle; programa regional coordenado'],
    },
  },
  // ── MOSCA-BRANCA (multicultura) ───────────────────────────
  {
    id: 'mosca-branca',
    name: 'Mosca-branca',
    scientificName: 'Bemisia tabaci',
    kind: 'praga', emoji: '🪰',
    crops: ['soja', 'algod', 'feijão', 'milho'], severity: 'média',
    criticalPhases: ['vegetativo', 'floração'],
    symptoms: [
      'Insetos brancos minúsculos que voam ao tocar a planta',
      'Fumagina (mofo preto) sobre a melada',
      'Amarelecimento e encarquilhamento das folhas',
    ],
    damage: 'Suga seiva e transmite vírus (mosaico-dourado no feijão). Melada favorece fungos que sujam a fibra/grão.',
    controlLevel: 'Monitorar ninfas na face inferior das folhas; agir antes do pico populacional.',
    favorability: 'Tempo quente e seco, cultivos sucessivos de hospedeiros.',
    management: {
      cultural: ['Eliminar plantas hospedeiras e tigüera', 'Janela de semeadura', 'Barreiras vivas'],
      biological: ['Parasitoides Encarsia/Eretmocerus', 'Fungos Beauveria/Isaria'],
      chemical: ['Inseticidas seletivos; alternar modos de ação contra resistência'],
    },
  },
]

// ── Funções ──────────────────────────────────────────────────

function cropMatches(pest: Pest, cropName: string): boolean {
  const n = cropName.toLowerCase()
  return pest.crops.some(c => n.includes(c))
}

export function pestsForCrop(cropName: string): Pest[] {
  return PESTS.filter(p => cropMatches(p, cropName))
}

export function pestById(id: string): Pest | undefined {
  return PESTS.find(p => p.id === id)
}

// Busca por nome, científico ou sintoma (diagnóstico guiado)
export function searchPests(query: string, cropName?: string): Pest[] {
  const q = query.trim().toLowerCase()
  const base = cropName ? pestsForCrop(cropName) : PESTS
  if (!q) return base
  return base.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.scientificName.toLowerCase().includes(q) ||
    p.symptoms.some(s => s.toLowerCase().includes(q)) ||
    p.damage.toLowerCase().includes(q)
  )
}

// Pragas suscetíveis na fase atual da cultura (para priorizar monitoramento)
export function pestsRelevantNow(cropName: string, phase: string): Pest[] {
  const p = phase.toLowerCase()
  return pestsForCrop(cropName)
    .filter(pest => pest.criticalPhases.some(cp => p.includes(cp) || cp.includes(p.split(' ')[0])))
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
}

export function severityRank(s: Severity): number {
  return s === 'alta' ? 3 : s === 'média' ? 2 : 1
}

export const SEVERITY_META: Record<Severity, { label: string; cls: string }> = {
  alta:  { label: 'Alto risco',  cls: 'bg-red-100 text-red-700' },
  média: { label: 'Risco médio', cls: 'bg-amber-100 text-amber-700' },
  baixa: { label: 'Baixo risco', cls: 'bg-stone-100 text-stone-600' },
}
