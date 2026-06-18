import type { Metadata } from 'next'
import { ToolShell } from '@/components/site/ToolShell'
import { ToolJsonLd } from '@/components/site/JsonLd'
import { PopulacaoTool } from '@/components/tools/PopulacaoTool'

export const metadata: Metadata = {
  title: 'Calculadora de população de plantas e sementes',
  description: 'Calcule sementes por metro, por hectare e kg/ha para soja, milho, algodão e feijão, descontando germinação e emergência. Ferramenta gratuita. Sem cadastro.',
  alternates: { canonical: '/ferramentas/populacao-de-plantas' },
  openGraph: { title: 'Calculadora de população de plantas', description: 'Sementes por metro, hectare e kg/ha. Grátis, sem cadastro.', url: '/ferramentas/populacao-de-plantas' },
}

export default function Page() {
  return (
    <ToolShell
      title="População de plantas e sementes"
      subtitle="Quantas sementes plantar por metro e por hectare? Calcule descontando germinação e emergência, para soja, milho, algodão e feijão. Grátis e sem cadastro."
    >
      <ToolJsonLd name="Calculadora de população de plantas" description="Sementes por metro, por hectare e kg/ha descontando germinação." path="/ferramentas/populacao-de-plantas" />
      <PopulacaoTool />
    </ToolShell>
  )
}
