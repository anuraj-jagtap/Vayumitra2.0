import { useEffect, useRef } from 'react'
import { getAQIBand } from '../utils/aqi'

// StationMap: Leaflet map with AQI-colored pins
export default function StationMap({ stations = [], selectedStation, onSelect }) {
  const mapRef = useRef(null)
  const instanceRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (instanceRef.current) return
    // Dynamic import to avoid SSR issues
    import('leaflet').then(L => {
      const map = L.map(mapRef.current, {
        center: [28.6139, 77.209],
        zoom: 11,
        zoomControl: true,
      })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CartoDB',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)
      instanceRef.current = { map, L }
    })
    return () => {
      if (instanceRef.current) {
        instanceRef.current.map.remove()
        instanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!instanceRef.current) return
    const { map, L } = instanceRef.current
    // Remove old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    stations.forEach(s => {
      const band = getAQIBand(s.aqi)
      const iconHtml = `
        <div style="
          background:${band.color};
          width:36px;height:36px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          color:white;font-weight:700;font-size:11px;
          border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);
          font-feature-settings:'tnum' 1;
        ">${s.aqi}</div>
      `
      const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [36, 36], iconAnchor: [18, 18] })
      const marker = L.marker([s.lat, s.lon], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:160px">
            <div style="font-weight:700;font-size:14px;color:#0F172A;margin-bottom:4px">${s.name}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
              <span style="font-size:24px;font-weight:800;color:${band.color};font-feature-settings:'tnum' 1">${s.aqi}</span>
              <span style="background:${band.bg};color:${band.text};padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600">${band.label}</span>
            </div>
            <div style="font-size:12px;color:#64748B">
              PM2.5: <b>${s.pm25 ?? '—'}</b> µg/m³ &nbsp;|&nbsp; PM10: <b>${s.pm10 ?? '—'}</b> µg/m³
            </div>
          </div>
        `)
        .on('click', () => onSelect && onSelect(s))
      markersRef.current.push(marker)
    })
  }, [stations])

  return (
    <div ref={mapRef} className="w-full rounded-xl" style={{ height: '420px', zIndex: 1 }} />
  )
}
