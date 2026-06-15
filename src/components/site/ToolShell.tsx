import { ToolHeader } from '@/components/site/ToolCTA'

export function ToolShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <ToolHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-medium text-stone-900 mb-2">{title}</h1>
        <p className="text-sm sm:text-base text-stone-500 mb-8 leading-relaxed">{subtitle}</p>
        {children}
      </main>
    </div>
  )
}
