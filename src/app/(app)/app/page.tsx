import { Suspense } from 'react'
import { WeatherDashboard } from '@/components/dashboard/WeatherDashboard'
import { fetchForecast } from '@/lib/weather'
import { generateAlerts } from '@/lib/ai'
import { FARM, CROPS } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

async function DashboardContent() {
  const weather = await fetchForecast(FARM.lat, FARM.lon)
  const alerts = await generateAlerts(weather.current, weather.days, CROPS).catch(() => [])
  return <WeatherDashboard weather={weather} alerts={alerts} crops={CROPS} farm={FARM} />
}

export default function HomePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-6 bg-stone-200 rounded w-48 mb-1" />
        <div className="h-4 bg-stone-100 rounded w-72" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-stone-200 rounded-xl h-24" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-stone-200 rounded-xl h-64" />
        <div className="bg-stone-200 rounded-xl h-64" />
      </div>
    </div>
  )
}
