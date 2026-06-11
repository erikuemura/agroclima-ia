import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { WeatherDashboard } from '@/components/dashboard/WeatherDashboard'
import { fetchForecast } from '@/lib/weather'
import { generateAlerts } from '@/lib/ai'
import { getDemoProfileFromCookie } from '@/lib/demo-profiles'

export const dynamic = 'force-dynamic'

async function DashboardContent() {
  const cookieStore = await cookies()
  const profile = getDemoProfileFromCookie(
    cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
  )
  const weather = await fetchForecast(profile.farm.lat, profile.farm.lon)
  const alerts = await generateAlerts(weather.current, weather.days, profile.crops).catch(() => profile.alerts)
  return <WeatherDashboard weather={weather} alerts={alerts} crops={profile.crops} farm={profile.farm} profile={profile} />
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
