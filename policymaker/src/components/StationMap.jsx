import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getAQIBand } from '../utils/aqi'

export const REGION_CENTERS = {
  'Delhi NCR':   { center: [28.6139, 77.2090], zoom: 10 },
  'South Delhi': { center: [28.5355, 77.2100], zoom: 12 },
  'North Delhi': { center: [28.7150, 77.1600], zoom: 12 },
  'East Delhi':  { center: [28.6300, 77.3000], zoom: 12 },
  'West Delhi':  { center: [28.6450, 77.1100], zoom: 12 },
  'Noida':       { center: [28.5700, 77.3500], zoom: 12 },
  'Gurgaon':     { center: [28.4500, 77.0500], zoom: 12 },
  'Faridabad':   { center: [28.4000, 77.3100], zoom: 12 },
}

// StationMap: Dynamic Leaflet map responsive to region filters and station clicks
export default function StationMap({
  stations = [],
  selectedStation,
  onSelect,
  pollutant = 'AQI',
  region = 'Delhi NCR'
}) {
  const mapRef = useRef(null)
  const instanceRef = useRef(null)
  const markersRef = useRef([])
  const markerMapRef = useRef({})

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current) return

    if (instanceRef.current) {
      instanceRef.current.remove()
      instanceRef.current = null
    }
    if (mapRef.current && mapRef.current._leaflet_id) {
      delete mapRef.current._leaflet_id
    }

    const defaultCfg = REGION_CENTERS[region] || REGION_CENTERS['Delhi NCR']
    const map = L.map(mapRef.current, {
      center: defaultCfg.center,
      zoom: defaultCfg.zoom,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    instanceRef.current = map

    setTimeout(() => {
      map.invalidateSize()
    }, 200)

    return () => {
      map.remove()
      instanceRef.current = null
    }
  }, [])

  // Sync pins whenever stations or active pollutant changes
  useEffect(() => {
    const map = instanceRef.current
    if (!map) return

    // Clean old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    markerMapRef.current = {}

    const validCoords = []

    // Deduplicate any stations sharing identical coordinates so pins never overlap/mask each other
    const uniqueMap = new Map()
    stations.forEach(s => {
      if (s.lat == null || (s.lon == null && s.lng == null)) return
      const lat = Number(s.lat)
      const lon = Number(s.lon != null ? s.lon : s.lng)
      const coordKey = `${lat.toFixed(4)},${lon.toFixed(4)}`
      const existing = uniqueMap.get(coordKey)
      if (!existing) {
        uniqueMap.set(coordKey, s)
      } else if (s.station_id === selectedStation?.station_id) {
        uniqueMap.set(coordKey, s)
      } else if (existing.station_id !== selectedStation?.station_id) {
        const sTime = s.ts ? new Date(s.ts).getTime() : 0
        const exTime = existing.ts ? new Date(existing.ts).getTime() : 0
        if (sTime > exTime || (sTime === exTime && (s.aqi || 0) > (existing.aqi || 0))) {
          uniqueMap.set(coordKey, s)
        }
      }
    })
    const renderStations = Array.from(uniqueMap.values())

    renderStations.forEach(s => {
      const lat = s.lat
      const lon = s.lon != null ? s.lon : s.lng
      validCoords.push([lat, lon])

      // Determine value to display based on selected pollutant
      let displayValue = s.aqi ?? '—'
      let unit = ''
      if (pollutant === 'PM2.5') {
        displayValue = s.pm25 != null ? Math.round(s.pm25) : '—'
        unit = ' µg/m³'
      } else if (pollutant === 'PM10') {
        displayValue = s.pm10 != null ? Math.round(s.pm10) : '—'
        unit = ' µg/m³'
      } else if (pollutant === 'NO₂') {
        displayValue = s.no2 != null ? (typeof s.no2 === 'number' ? s.no2.toFixed(1) : s.no2) : '—'
        unit = ' ppb'
      } else if (pollutant === 'O₃') {
        displayValue = s.o3 != null ? (typeof s.o3 === 'number' ? s.o3.toFixed(1) : s.o3) : '—'
        unit = ' ppb'
      }

      const band = getAQIBand(s.aqi)
      const isSelected = selectedStation?.station_id === s.station_id

      const iconHtml = `
        <div style="
          background:${band.color};
          width:${isSelected ? '42px' : '36px'};
          height:${isSelected ? '42px' : '36px'};
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          color:white;
          font-weight:800;
          font-size:${isSelected ? '12px' : '11px'};
          border:${isSelected ? '3.5px solid #2563EB' : '2.5px solid white'};
          box-shadow:${isSelected ? '0 0 0 4px rgba(37,99,235,0.4), 0 4px 12px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.25)'};
          font-feature-settings:'tnum' 1;
          transition: transform 0.2s ease;
        ">${displayValue}</div>
      `
      const icon = L.divIcon({
        html: iconHtml,
        className: '',
        iconSize: isSelected ? [42, 42] : [36, 36],
        iconAnchor: isSelected ? [21, 21] : [18, 18],
      })

      const marker = L.marker([lat, lon], {
        icon,
        zIndexOffset: isSelected ? 1000 : 0
      })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:200px">
            <div style="font-weight:700;font-size:14px;color:#0F172A;margin-bottom:2px">
              ${s.name || s.station_name || 'Station'}
            </div>
            <div style="font-size:11px;color:#64748B;margin-bottom:6px">
              ${s.city || 'Delhi NCR'} &nbsp;•&nbsp; ${s.locality || 'Active Station'}
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
              <span style="font-size:22px;font-weight:800;color:${band.color};font-feature-settings:'tnum' 1">
                ${displayValue}${unit}
              </span>
              <span style="background:${band.bg};color:${band.text};padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600">
                ${pollutant} (${band.label})
              </span>
            </div>
            <div style="font-size:11px;color:#475569;line-height:1.5;background:#F8FAFC;padding:6px 8px;border-radius:6px;border:1px solid #E2E8F0">
              <b>AQI:</b> ${s.aqi ?? '—'} &nbsp;|&nbsp; <b>Dominant:</b> <span style="text-transform:uppercase">${s.dominant || 'pm25'}</span><br/>
              <b>PM2.5:</b> ${s.pm25 != null ? Math.round(s.pm25) : '—'} µg/m³ &nbsp;|&nbsp; <b>PM10:</b> ${s.pm10 != null ? Math.round(s.pm10) : '—'} µg/m³<br/>
              <b>NO₂:</b> ${s.no2 ?? '—'} &nbsp;|&nbsp; <b>O₃:</b> ${s.o3 ?? '—'}
            </div>
          </div>
        `)
        .on('click', () => onSelect && onSelect(s))

      markersRef.current.push(marker)
      if (s.station_id) {
        markerMapRef.current[s.station_id] = marker
      }
    })

    // Dynamically adjust view bounds to fit the current filtered station set
    if (validCoords.length === 1) {
      map.flyTo(validCoords[0], 13, { duration: 1.0 })
    } else if (validCoords.length > 1) {
      const bounds = L.latLngBounds(validCoords)
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13, duration: 1.0 })
    } else if (region && REGION_CENTERS[region]) {
      const rc = REGION_CENTERS[region]
      map.flyTo(rc.center, rc.zoom, { duration: 1.0 })
    }
  }, [stations, pollutant, selectedStation?.station_id])

  // Pan to selected station when clicked from table or list
  useEffect(() => {
    const map = instanceRef.current
    if (!map || !selectedStation) return

    if (selectedStation.lat != null && (selectedStation.lon != null || selectedStation.lng != null)) {
      const lat = selectedStation.lat
      const lon = selectedStation.lon != null ? selectedStation.lon : selectedStation.lng
      map.flyTo([lat, lon], 13, { duration: 0.8 })

      // Elevate selected marker zIndex to top layer and open its popup
      Object.entries(markerMapRef.current).forEach(([id, m]) => {
        if (!m) return
        if (id === selectedStation.station_id) {
          if (typeof m.setZIndexOffset === 'function') m.setZIndexOffset(1000)
          setTimeout(() => {
            if (typeof m.openPopup === 'function') m.openPopup()
          }, 400)
        } else {
          if (typeof m.setZIndexOffset === 'function') m.setZIndexOffset(0)
        }
      })
    }
  }, [selectedStation])

  return (
    <div
      ref={mapRef}
      className="w-full rounded-xl relative shadow-inner overflow-hidden border border-slate-100"
      style={{ height: '440px', minHeight: '440px', zIndex: 1 }}
    />
  )
}

