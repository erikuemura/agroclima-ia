'use client'

export async function exportReportPDF(opts: {
  farmName: string
  season: string
  totalHa: number
  crops: { name: string; hectares: number; expectedYield: number; phase: string }[]
  totalRain: number
  avgNdvi: string
  applications: number
  aiReport: string
}) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const green = [59, 109, 17] as [number, number, number]
  const stone = [87, 83, 78] as [number, number, number]
  const dark = [28, 25, 23] as [number, number, number]
  const lightGray = [245, 244, 242] as [number, number, number]

  const W = 210
  const margin = 16

  // Header band
  doc.setFillColor(...green)
  doc.rect(0, 0, W, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('AgroClima IA', margin, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Relatório de Safra', margin, 18)
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, W - margin, 18, { align: 'right' })

  // Farm info
  doc.setTextColor(...dark)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(opts.farmName, margin, 38)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...stone)
  doc.text(`Safra ${opts.season}  ·  ${opts.totalHa} ha`, margin, 44)

  // KPIs row
  let y = 52
  const kpis = [
    { label: 'Área total', value: `${opts.totalHa} ha` },
    { label: 'Chuva no período', value: `${opts.totalRain} mm` },
    { label: 'NDVI médio', value: opts.avgNdvi },
    { label: 'Aplicações', value: String(opts.applications) },
  ]
  const kpiW = (W - margin * 2) / 4
  kpis.forEach((k, i) => {
    const x = margin + i * kpiW
    doc.setFillColor(...lightGray)
    doc.roundedRect(x, y, kpiW - 2, 18, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setTextColor(...stone)
    doc.setFont('helvetica', 'normal')
    doc.text(k.label, x + 4, y + 6)
    doc.setFontSize(13)
    doc.setTextColor(...dark)
    doc.setFont('helvetica', 'bold')
    doc.text(k.value, x + 4, y + 14)
  })

  // Section: culturas
  y = 78
  doc.setFillColor(...green)
  doc.rect(margin, y, W - margin * 2, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMO POR CULTURA', margin + 2, y + 4)

  y += 10
  opts.crops.forEach(c => {
    doc.setTextColor(...dark)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`${c.name}  —  ${c.hectares} ha`, margin, y)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...stone)
    doc.text(`Fase: ${c.phase}  ·  Produtividade esperada: ${c.expectedYield} sc/ha`, margin, y + 5)
    // progress bar
    const barW = W - margin * 2
    doc.setFillColor(...lightGray)
    doc.roundedRect(margin, y + 8, barW, 3, 1, 1, 'F')
    doc.setFillColor(...green)
    doc.roundedRect(margin, y + 8, barW * Math.min(1, c.hectares / opts.totalHa), 3, 1, 1, 'F')
    y += 18
  })

  // Section: IA report
  if (opts.aiReport) {
    y += 4
    doc.setFillColor(...green)
    doc.rect(margin, y, W - margin * 2, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('ANÁLISE DA SAFRA — IA', margin + 2, y + 4)

    y += 10
    doc.setTextColor(...dark)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(opts.aiReport, W - margin * 2)
    lines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      doc.text(line, margin, y)
      y += 4.5
    })
  }

  // Footer
  doc.setFillColor(...lightGray)
  doc.rect(0, 285, W, 12, 'F')
  doc.setTextColor(...stone)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Gerado por AgroClima IA  ·  agroclima.app', margin, 292)
  doc.text(`Página 1`, W - margin, 292, { align: 'right' })

  doc.save(`relatorio-safra-${opts.season.replace('/', '-')}.pdf`)
}
