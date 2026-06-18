import type { Metadata } from 'next'
import { ToolShell } from '@/components/site/ToolShell'
import { ToolJsonLd } from '@/components/site/JsonLd'
import { PrevisaoTool } from '@/components/tools/PrevisaoTool'

export const metadata: Metadata = {
  title: 'Previsão do tempo agrícola por município — grátis',
  description: 'Veja a previsão do tempo de 7 dias para a sua cidade, com janela de pulverização e chuva acumulada. Ferramenta gratuita para o produtor rural. Sem cadastro.',
  alternates: { canonical: '/ferramentas/previsao-do-tempo' },
  openGraph: { title: 'Previsão do tempo agrícola por município', description: 'Previsão de 7 dias + janela de pulverização. Grátis, sem cadastro.', url: '/ferramentas/previsao-do-tempo' },
}

export default function Page() {
  return (
    <ToolShell
      title="Previsão do tempo agrícola"
      subtitle="Previsão de 7 dias para o seu município, com janela de pulverização e chuva acumulada — feita para quem trabalha no campo. Grátis e sem cadastro."
    >
      <ToolJsonLd name="Previsão do tempo agrícola" description="Previsão de 7 dias por município com janela de pulverização e chuva acumulada." path="/ferramentas/previsao-do-tempo" />
      <PrevisaoTool />
    </ToolShell>
  )
}
