import type { Metadata } from 'next'
import { ToolShell } from '@/components/site/ToolShell'
import { CalagemTool } from '@/components/tools/CalagemTool'

export const metadata: Metadata = {
  title: 'Calculadora de calagem — quanto de calcário aplicar',
  description: 'Calcule a necessidade de calcário (t/ha) pelo método da saturação por bases, a partir da sua análise de solo. Ferramenta gratuita para o produtor rural. Sem cadastro.',
  alternates: { canonical: '/ferramentas/calagem' },
  openGraph: { title: 'Calculadora de calagem', description: 'Necessidade de calcário (t/ha) pela saturação por bases. Grátis.', url: '/ferramentas/calagem' },
}

export default function Page() {
  return (
    <ToolShell
      title="Calculadora de calagem"
      subtitle="Quanto de calcário aplicar para corrigir o pH do solo? Calcule pela saturação por bases a partir da sua análise de solo. Grátis e sem cadastro."
    >
      <CalagemTool />
    </ToolShell>
  )
}
