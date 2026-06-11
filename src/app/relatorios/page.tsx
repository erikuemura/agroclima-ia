'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { FileText, Sparkles, Loader2, Download, TrendingUp, Droplets, FlaskConical, Sprout } from 'lucide-react'
import { INITIAL_CROPS } from '@/lib/crops-store'
import { FIELDS } from '@/lib/fields-data'
import { FARM } from '@/lib/mock-data'
import { exportReportPDF } from '@/lib/export-pdf'

const SPRAY_LOG = [
  { date: '2026-05-28', crop: 'Soja', field: 'T1', product: 'Priori Xtra', dose: '300 ml/ha', area: 420, target: 'Ferrugem' },
  { date: '2026-05-10', crop: 'Soja', field: 'T1', product: 'Engeo Pleno', dose: '150 ml/ha', area: 420, target: 'Percevejo' },
  { date: '2026-04-22', crop: 'Soja', field: 'T1', product: 'Roundup WG', dose: '2 kg/ha', area: 420, target: 'Plantas daninhas' },
  { date: '2026-03-15', crop: 'Milho', field: 'T2', product: 'Atrazina', dose: '3 L/ha', area: 180, target: 'Plantas daninhas' },
]

const RAIN_MONTHS = [
  { month: 'Out', mm: 180 }, { month: 'Nov', mm: 220 }, { month: 'Dez', mm: 195 },
  { month: 'Jan', mm: 210 }, { month: 'Fev', mm: 175 }, { month: 'Mar', mm: 140 },
  { month: 'Abr', mm: 65 },  { month: 'Mai', mm: 30 },  { month: 'Jun', mm: 8 },
]

const maxRain = Math.max(...RAIN_MONTHS.map(r => r.mm))

export default function RelatoriosPage() {
  const [aiReport, setAiReport] = useState('')
  const [loading, setLoading] = useState(false)
  const [season, setSeason] = useState('25/26')

  const totalHa = FIELDS.reduce((a, f) => a + f.hectares, 0)
  const totalApplications = SPRAY_LOG.length
  const totalRain = RAIN_MONTHS.reduce((a, r) => a + r.mm, 0)
  const avgNdvi = (FIELDS.reduce((a, f) => a + f.ndvi, 0) / FIELDS.length).toFixed(2)

  async function generateReport() {
    setLoading(true)
    setAiReport('')
    try {
      const context = {
        farm: FARM.name,
        city: `${FARM.city} — ${FARM.state}`,
        season,
        totalHa,
        crops: INITIAL_CROPS.map(c => `${c.name} (${c.hectares}ha, ${c.phase}, ${c.expectedYield}sc/ha esperado)`).join('; '),
        fields: FIELDS.length,
        avgNdvi,
        totalRain,
        applications: totalApplications,
      }
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Gere um relatório executivo de safra para esta propriedade rural:

FAZENDA: ${context.farm} — ${context.city}
SAFRA: ${context.season}
ÁREA TOTAL: ${context.totalHa} ha em ${context.fields} talhões
CULTURAS: ${context.crops}
CHUVA TOTAL NO PERÍODO: ${context.totalRain} mm
NDVI MÉDIO: ${context.avgNdvi}
APLICAÇÕES REALIZADAS: ${context.applications}

Estruture o relatório com:
1. **Resumo executivo** (2-3 frases)
2. **Desempenho das culturas** (análise por cultura)
3. **Balanço hídrico da safra**
4. **Manejo fitossanitário** (resumo das aplicações)
5. **Pontos de atenção** (riscos e oportunidades)
6. **Recomendações para próxima safra**

Seja técnico mas acessível. Use dados fornecidos.`,
          }],
          context: { city: `${FARM.city} — ${FARM.state}`, crops: INITIAL_CROPS.map(c => c.name) },
        }),
      })
      const data = await res.json()
      setAiReport(data.reply)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-stone-800">Relatórios</h1>
          <p className="text-sm text-stone-400 mt-0.5">Resumo de safra e análise por IA — {FARM.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={season} onChange={e => setSeason(e.target.value)} className="border border-stone-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-stone-600">
            <option>25/26</option><option>24/25</option><option>23/24</option>
          </select>
          <button onClick={generateReport} disabled={loading} className="flex items-center gap-1.5 text-xs bg-green-700 text-white rounded-lg px-3 py-1.5 hover:bg-green-800 disabled:opacity-60 transition-colors">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Gerar relatório IA
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Área total', value: `${totalHa} ha`, sub: `${FIELDS.length} talhões`, icon: <Sprout className="w-3.5 h-3.5" /> },
          { label: 'Chuva no período', value: `${totalRain} mm`, sub: 'Out/25 – Jun/26', icon: <Droplets className="w-3.5 h-3.5" /> },
          { label: 'NDVI médio', value: avgNdvi, sub: 'Saúde da lavoura', icon: <TrendingUp className="w-3.5 h-3.5" /> },
          { label: 'Aplicações', value: String(totalApplications), sub: 'Registros no sistema', icon: <FlaskConical className="w-3.5 h-3.5" /> },
        ].map(({ label, value, sub, icon }) => (
          <div key={label} className="bg-stone-100 rounded-xl p-4">
            <p className="text-xs text-stone-500 flex items-center gap-1 mb-1.5">{icon}{label}</p>
            <p className="text-2xl font-semibold text-stone-800">{value}</p>
            <p className="text-xs text-stone-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Culturas */}
        <Card className="p-5">
          <h3 className="text-sm font-medium text-stone-700 mb-4">Resumo por cultura</h3>
          <div className="space-y-4">
            {INITIAL_CROPS.map(c => {
              const harvest = new Date(c.harvestAt + 'T12:00')
              const planted = new Date(c.plantedAt + 'T12:00')
              const totalDays = Math.max(1, (harvest.getTime() - planted.getTime()) / 86400000)
              const elapsed = Math.min(totalDays, Math.max(0, (Date.now() - planted.getTime()) / 86400000))
              const progress = Math.round((elapsed / totalDays) * 100)
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.emoji}</span>
                      <div>
                        <p className="text-sm font-medium text-stone-800">{c.name} — {c.fieldName}</p>
                        <p className="text-xs text-stone-400">{c.variety} · {c.hectares} ha</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-700">{c.expectedYield} sc/ha</p>
                      <p className="text-[10px] text-stone-400">produtividade esperada</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] text-stone-400 w-8 text-right">{progress}%</span>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">{c.phase}</p>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Chuva */}
        <Card className="p-5">
          <h3 className="text-sm font-medium text-stone-700 mb-4">Pluviosidade mensal (mm)</h3>
          <div className="flex items-end gap-2 h-32 mb-2">
            {RAIN_MONTHS.map(r => {
              const pct = (r.mm / maxRain) * 100
              const isLow = r.mm < 50
              return (
                <div key={r.month} className="flex-1 flex flex-col items-center gap-1">
                  {r.mm > 0 && <span className="text-[8px] text-stone-400">{r.mm}</span>}
                  <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                    <div
                      className={cn('rounded-sm w-full', isLow ? 'bg-amber-300' : 'bg-blue-400')}
                      style={{ height: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-stone-400">{r.month}</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-stone-400 text-right mt-1">Total: {totalRain} mm</p>
        </Card>
      </div>

      {/* Log de aplicações */}
      <Card className="p-5">
        <h3 className="text-sm font-medium text-stone-700 mb-4">Histórico de aplicações fitossanitárias</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-stone-400 border-b border-stone-100">
                <th className="text-left py-2 pr-4 font-medium">Data</th>
                <th className="text-left py-2 pr-4 font-medium">Talhão</th>
                <th className="text-left py-2 pr-4 font-medium">Cultura</th>
                <th className="text-left py-2 pr-4 font-medium">Produto</th>
                <th className="text-left py-2 pr-4 font-medium">Dose</th>
                <th className="text-left py-2 pr-4 font-medium">Alvo</th>
                <th className="text-right py-2 font-medium">Área</th>
              </tr>
            </thead>
            <tbody>
              {SPRAY_LOG.map((r, i) => (
                <tr key={i} className="border-b border-stone-50 hover:bg-stone-50">
                  <td className="py-2 pr-4 text-stone-500">
                    {new Date(r.date + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="py-2 pr-4 font-medium text-stone-700">{r.field}</td>
                  <td className="py-2 pr-4 text-stone-500">{r.crop}</td>
                  <td className="py-2 pr-4 font-medium text-stone-800">{r.product}</td>
                  <td className="py-2 pr-4 text-stone-500">{r.dose}</td>
                  <td className="py-2 pr-4">
                    <Badge variant="outline" className="text-[10px] px-1.5">{r.target}</Badge>
                  </td>
                  <td className="py-2 text-right text-stone-500">{r.area} ha</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Relatório IA */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-stone-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-green-600" />
            Relatório executivo gerado por IA
          </h3>
          {aiReport && (
            <button
              onClick={() => exportReportPDF({
                farmName: FARM.name,
                season,
                totalHa,
                crops: INITIAL_CROPS.map(c => ({ name: c.name, hectares: c.hectares, expectedYield: c.expectedYield, phase: c.phase })),
                totalRain,
                avgNdvi,
                applications: totalApplications,
                aiReport,
              })}
              className="flex items-center gap-1.5 text-xs border border-stone-200 rounded-lg px-3 py-1.5 hover:bg-stone-50 text-stone-500 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Exportar PDF
            </button>
          )}
        </div>
        {!aiReport && !loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-stone-400" />
            </div>
            <p className="text-sm text-stone-400">Clique em "Gerar relatório IA" para criar um laudo completo da safra {season}</p>
          </div>
        )}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            <p className="text-sm text-stone-400">Analisando dados da safra...</p>
          </div>
        )}
        {aiReport && (
          <div className="prose prose-sm prose-stone max-w-none text-sm leading-relaxed whitespace-pre-wrap text-stone-700">
            {aiReport}
          </div>
        )}
      </Card>
    </div>
  )
}
