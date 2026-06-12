# CampoClima — Arquitetura da Plataforma

> Plataforma agrícola integrada para pequenos e médios produtores brasileiros.
> Visão: **o AgroAssistente IA é a interface central** — toda funcionalidade gera
> insights consumíveis pelo assistente, pela Home e por notificações.

## Visão geral

```
┌────────────────────────────────────────────────────────────┐
│                    AGRICULTURAL INTELLIGENCE LAYER          │
│  /api/insights  ←  engines puros em src/lib/intelligence/  │
│  • disease.ts        (ferrugem, mofo branco — extensível)  │
│  • water-balance.ts  (Saldo = Chuva − ETc, Kc FAO-56)      │
│  • insights.ts       (tempestade, hídrico, mercado, spray) │
│  • health-score.ts   (score 0–100 multi-componente)        │
│  • local-insights.ts (estoque, diário, orçamento, alvo)    │
└──────────────┬─────────────────┬───────────────┬───────────┘
               │                 │               │
          Nova Home       AgroAssistente    Notificações
       (ExecutivePanel)  (farm-intelligence)  (WhatsApp)
```

### Fluxo de dados

1. **Fontes externas** (com fallback gracioso em todas):
   - Open-Meteo: previsão 10d + `past_days` (relatório de chuva) — `lib/weather.ts`
   - INPE Queimadas, NASA POWER, SoilGrids, IBGE PAM — `app/api/*`
   - Cotações: `/api/commodities` (seeded diário + USD/BRL real)
2. **Engines puros** (`lib/intelligence/`, `lib/finance.ts`): funções sem I/O,
   testadas em `__tests__/engines.test.ts` (vitest).
3. **`/api/insights`**: consolida tudo → `{ healthScore, insights[], diseases,
   waterBalances, rainReport, dailySummary }`. Aceita `?profile=` (modo consultor).
4. **`/api/farm-intelligence`**: monta o `contextString` injetado no system prompt
   do Claude — inclui o output do intelligence layer.
5. **Cliente**: `local-insights.ts` gera insights dos dados localStorage
   (estoque crítico, talhões sem registro, custo vs orçamento, preço-alvo)
   e os mescla na Home e no contexto do assistente.

## Módulos

| Módulo | Rota | Persistência | Insights gerados |
|---|---|---|---|
| Painel da fazenda (Home) | `/app` | — | consome todos |
| AgroAssistente IA | `/assistente` | — | consome contexto completo |
| Diário de campo | `/diario` | localStorage (`stores.ts`) | talhões sem atualização |
| Estoque | `/estoque` | localStorage | estoque mínimo, validade |
| Planejamento de safra | `/planejamento` | localStorage | custo acima do orçamento |
| Financeiro | `/financeiro` | localStorage | preço-alvo atingido |
| Comunidade + Radar | `/comunidade` | localStorage (seed regional) | ocorrências regionais |
| Modo consultor | `/consultor` | localStorage (recomendações) | visão multi-fazenda |
| Clima/NDVI/Solo/etc. | módulos pré-existentes | — | tempestade, doença, hídrico |

**Integração diário ↔ estoque**: registrar pulverização/adubação no diário com
insumo selecionado dá baixa automática no estoque e cria `StockMovement`.

## Modelos agronômicos

- **Doenças** (`disease.ts`): registry `DISEASE_MODELS[]` — cada modelo define
  hospedeiros, fases críticas, `assess(clima)` → score 0–100 e recomendação.
  Score ajustado pela fase fenológica (+15% em fase suscetível, −40% fora).
  Níveis: baixo < 35 ≤ médio < 60 ≤ alto < 80 ≤ crítico.
- **Balanço hídrico** (`water-balance.ts`): ETc = ETo × Kc (tabela FAO-56 por
  cultura/fase). Lâmina de irrigação desconta a chuva prevista em 5 dias.
- **Perda financeira** (`finance.ts`): FAO-33 — perda% = Ky × (déficit/ETc),
  cap 25%/semana, × produtividade × área × cotação do dia.
- **Health score** (`health-score.ts`): média ponderada renormalizada —
  Clima 20 · Fitossanitário 25 · Hídrico 25 · Operacional 15 · Financeiro 15.

## Persistência

Hoje: cookie `demo_profile` + localStorage com chave por perfil
(`campoclima_<store>_<profileId>`). As funções de `stores.ts` são a camada de
acesso — ao ligar o Supabase, trocam-se as implementações mantendo a assinatura.
Schema SQL pronto em `docs/migrations/001_core_schema.sql`.

## Segurança

- Rotas de IA com rate limit por IP (`lib/rate-limit.ts`)
- Webhooks com validação de assinatura (MP `x-signature`, Meta `X-Hub-Signature-256`)
- `proxy.ts` (Next 16) protege todas as rotas do app; demo via cookie

## Testes

```bash
npm test   # vitest — engines de doença, balanço hídrico, health score, finanças
```

## Roadmap executado

- ✅ Fase 1: Nova Home (ExecutivePanel), Motor de Insights, Diário, Estoque, Planejamento
- ✅ Fase 2: Doenças (ferrugem + mofo branco), Balanço hídrico FAO-56, Relatório de chuva, Alertas centralizados
- ✅ Fase 3 (parcial): Radar regional na Comunidade · _pendente: zonas de produtividade NDVI reais (Sentinel-2)_
- ✅ Fase 4: Modo consultor, Comunidade, Preço-alvo de mercado

## Próximos passos

1. Persistência Supabase real (schema pronto) + sync offline-first
2. Briefing diário via WhatsApp consumindo `/api/insights`
3. Zonas de produtividade com Sentinel-2 (Copernicus Data Space, gratuito)
4. Notificações push (PWA) disparadas pelos insights P1
