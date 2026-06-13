'use client'

import { useEffect, useRef, useState } from 'react'
import type { Field } from '@/lib/fields-data'
import { NDVI_COLOR } from '@/lib/fields-data'

interface Props {
  fields: Field[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function FieldMap({ fields, selectedId, onSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const layersRef = useRef<Record<string, any>>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then((L) => {
      // fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Centro inicial = primeiro vértice do primeiro talhão (fallback Cerrado)
      const initialCenter = (fields[0]?.coordinates?.[0] as [number, number]) ?? [-12.544, -55.700]
      const map = L.map(mapRef.current!, {
        center: initialCenter,
        zoom: 13,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      const allPolys: any[] = []
      fields.forEach((field) => {
        const color = NDVI_COLOR[field.ndviStatus]
        const poly = L.polygon(field.coordinates as [number, number][], {
          color: '#fff',
          weight: 2,
          fillColor: color,
          fillOpacity: 0.55,
        }).addTo(map)

        const center = poly.getBounds().getCenter()
        const label = L.divIcon({
          className: '',
          html: `<div style="background:rgba(0,0,0,0.55);color:#fff;font-size:11px;padding:2px 7px;border-radius:4px;white-space:nowrap;font-weight:500">${field.name}</div>`,
          iconAnchor: [30, 10],
        })
        L.marker(center, { icon: label }).addTo(map)

        poly.on('click', () => onSelect(field.id))
        poly.on('mouseover', () => poly.setStyle({ fillOpacity: 0.8, weight: 3 }))
        poly.on('mouseout', () => poly.setStyle({ fillOpacity: 0.55, weight: 2 }))

        layersRef.current[field.id] = poly
        allPolys.push(poly)
      })

      // Enquadra todos os talhões da fazenda real
      if (allPolys.length > 0) {
        const group = L.featureGroup(allPolys)
        map.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 15 })
      }

      mapInstanceRef.current = map
      setReady(true)
    })

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // highlight selected field
  useEffect(() => {
    if (!ready) return
    import('leaflet').then(() => {
      Object.entries(layersRef.current).forEach(([id, poly]) => {
        if (id === selectedId) {
          poly.setStyle({ weight: 4, color: '#fbbf24', fillOpacity: 0.75 })
          poly.bringToFront()
        } else {
          const field = fields.find(f => f.id === id)
          const color = field ? NDVI_COLOR[field.ndviStatus] : '#22c55e'
          poly.setStyle({ weight: 2, color: '#fff', fillColor: color, fillOpacity: 0.55 })
        }
      })
    })
  }, [selectedId, ready])

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div ref={mapRef} className="w-full h-full rounded-xl overflow-hidden" />
    </>
  )
}
