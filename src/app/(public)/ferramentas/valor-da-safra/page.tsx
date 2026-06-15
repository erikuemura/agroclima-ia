import type { Metadata } from 'next'
import { ToolShell } from '@/components/site/ToolShell'
import { ValorSafraTool } from '@/components/tools/ValorSafraTool'

export const metadata: Metadata = {
  title: 'Quanto vale minha safra — calculadora grátis',
  description: 'Calcule o valor bruto da sua produção de soja, milho ou boi com a cotação do dia, produtividade e área. Ferramenta gratuita para o produtor rural. Sem cadastro.',
  alternates: { canonical: '/ferramentas/valor-da-safra' },
  openGraph: { title: 'Quanto vale minha safra', description: 'Calcule o valor da sua produção com a cotação do dia. Grátis.', url: '/ferramentas/valor-da-safra' },
}

export default function Page() {
  return (
    <ToolShell
      title="Quanto vale minha safra?"
      subtitle="Calcule o valor bruto da sua produção com a cotação do dia, sua produtividade e área. Soja, milho e boi gordo. Grátis e sem cadastro."
    >
      <ValorSafraTool />
    </ToolShell>
  )
}
