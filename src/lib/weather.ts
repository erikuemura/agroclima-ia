import type { WeatherDay, WeatherCurrent } from '@/types'

const BASE = 'https://api.open-meteo.com/v1/forecast'

function iconFor(code: number, rain: number): WeatherDay['icon'] {
  if (code >= 95) return 'storm'
  if (code >= 61 || rain > 5) return 'rain'
  if (code >= 51) return 'rain'
  if (code >= 2) return 'partly-cloudy'
  if (code >= 1) return 'cloud'
  return 'sun'
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export async function fetchForecast(lat: number, lon: number): Promise<{
  current: WeatherCurrent
  days: WeatherDay[]
}> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weathercode,et0_fao_evapotranspiration',
    hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m',
    current_weather: 'true',
    timezone: 'America/Cuiaba',
    forecast_days: '10',
  })

  const res = await fetch(`${BASE}?${params}`, { next: { revalidate: 1800 } })
  if (!res.ok) throw new Error('Weather API error')
  const data = await res.json()

  const daily = data.daily
  const current = data.current_weather

  const humidity = data.hourly?.relative_humidity_2m?.[0] ?? 65
  const rain7d = (daily.precipitation_sum as number[]).slice(0, 7).reduce((a: number, b: number) => a + b, 0)
  const eto = daily.et0_fao_evapotranspiration[0] ?? 5
  const eto7d = (daily.et0_fao_evapotranspiration as number[]).slice(0, 7).reduce((a: number, b: number) => a + b, 0)

  const days: WeatherDay[] = (daily.time as string[]).map((date: string, i: number) => {
    const d = new Date(date + 'T12:00:00')
    const label = i === 0 ? 'Hoje' : DAY_LABELS[d.getDay()]
    return {
      date,
      label,
      tempMax: Math.round(daily.temperature_2m_max[i]),
      tempMin: Math.round(daily.temperature_2m_min[i]),
      rain: Math.round(daily.precipitation_sum[i] * 10) / 10,
      windMax: Math.round(daily.wind_speed_10m_max[i]),
      icon: iconFor(daily.weathercode[i], daily.precipitation_sum[i]),
    }
  })

  return {
    current: {
      temp: Math.round(current.temperature),
      humidity: Math.round(humidity),
      windSpeed: Math.round(current.windspeed),
      rain7d: Math.round(rain7d * 10) / 10,
      eto: Math.round(eto * 10) / 10,
      eto7d: Math.round(eto7d * 10) / 10,
    },
    days,
  }
}
