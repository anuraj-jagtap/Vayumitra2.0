import { useState, useMemo } from 'react'
import { AlertTriangle, ShieldAlert, RefreshCw, Flame, ArrowRight, CheckCircle2 } from 'lucide-react'
import { getAQIBand } from '../utils/aqi'
import { matchesRegion } from '../utils/regions'
import { SeverityBadge } from '../components/ui'
import StationMap from '../components/StationMap'
import { MOCK_STATIONS, MOCK_HOTSPOTS } from '../data/mock'
import { useStations, useCurrentAQI } from '../api/hooks'

export default function Hotspots({ region = 'Delhi NCR' }) {
  const { data: stationsData, loading: stationsLoading } = useStations({ city: 'Delhi NCR' })
  const { data: aqiData, loading: aqiLoading } = useCurrentAQI({ city: 'Delhi NCR' })
  const [selectedStation, setSelectedStation] = useState(null)
  const [advisorySent, setAdvisorySent] = useState({})

  // 1. Map station coordinates
  const stationsMetaMap = useMemo(() => {
    const list = stationsData?.results || (Array.isArray(stationsData) ? stationsData : [])
    const map = {}
    list.forEach(s => {
      map[s.station_id] = s
    })
    return map
  }, [stationsData])

  // 2. Build live stations array & deduplicate identical coordinates
  const allLiveStations = useMemo(() => {
    const aqiList = aqiData?.results || (Array.isArray(aqiData) ? aqiData : [])
    if (!aqiList.length) return MOCK_STATIONS
    const mapped = aqiList.map(item => {
      const meta = stationsMetaMap[item.station_id] || {}
      return {
        station_id: item.station_id,
        name: item.locality || item.station_name?.split(',')[0] || item.station_name,
        fullName: item.station_name,
        locality: item.locality,
        city: item.city,
        lat: meta.lat ?? 28.6139,
        lon: meta.lon ?? 77.2090,
        aqi: item.aqi,
        dominant: item.dominant || 'pm25',
        category: item.category,
        ts: item.ts,
        pm25: item.pm25 != null ? item.pm25 : (item.dominant === 'pm25' ? item.aqi : Math.round(item.aqi * 0.75)),
        pm10: item.pm10 != null ? item.pm10 : (item.dominant === 'pm10' ? item.aqi : Math.round(item.aqi * 1.35)),
        no2: item.no2 != null ? item.no2 : 18.5,
        o3: item.o3 != null ? item.o3 : 24.2,
        so2: item.so2 != null ? item.so2 : 9.8,
        status: 'Online',
      }
    })

    // Deduplicate any stations sharing identical coordinates
    const unique = new Map()
    mapped.forEach(s => {
      const coordKey = `${Number(s.lat).toFixed(4)},${Number(s.lon).toFixed(4)}`
      const existing = unique.get(coordKey)
      if (!existing) {
        unique.set(coordKey, s)
      } else {
        const sTime = s.ts ? new Date(s.ts).getTime() : 0
        const exTime = existing.ts ? new Date(existing.ts).getTime() : 0
        if (sTime > exTime || (sTime === exTime && (s.aqi || 0) > (existing.aqi || 0))) {
          unique.set(coordKey, s)
        }
      }
    })
    return Array.from(unique.values())
  }, [aqiData, stationsMetaMap])

  // 3. Filter by selected region
  const stations = useMemo(() => {
    if (!region || region === 'Delhi NCR') return allLiveStations
    const matched = allLiveStations.filter(s => matchesRegion(s, region))
    return matched.length > 0 ? matched : allLiveStations
  }, [allLiveStations, region])

  // 4. Ranked Hotspots (descending AQI)
  const hotspots = useMemo(() => {
    return [...stations]
      .filter(s => s.aqi != null)
      .sort((a, b) => b.aqi - a.aqi)
  }, [stations])

  const topHotspot = hotspots[0]
  const avgHotspotAQI = hotspots.length > 0
    ? Math.round(hotspots.reduce((acc, s) => acc + s.aqi, 0) / hotspots.length)
    : 0

  const handleDispatchAdvisory = (stationId, e) => {
    e.stopPropagation()
    setAdvisorySent(prev => ({ ...prev, [stationId]: true }))
    setTimeout(() => {
      setAdvisorySent(prev => ({ ...prev, [stationId]: false }))
    }, 4000)
  }

  const isLoading = stationsLoading || aqiLoading

  return (
    <div className="p-6 flex flex-col gap-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 text-[#EF4444] border border-red-100">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-800">Pollution Hotspots</h1>
              {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />}
              {region && region !== 'Delhi NCR' && (
                <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                  Zone: {region}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">Real-time ranking and geographic clustering of high-emission monitoring nodes.</p>
          </div>
        </div>

        {/* Hotspot Metrics Summary */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-100 rounded-xl px-4 py-2 shadow-sm text-right">
            <span className="text-xs text-slate-400 block font-medium">Peak Station AQI</span>
            <span className="text-lg font-bold text-red-600 tabular-nums">
              {topHotspot ? topHotspot.aqi : '—'}
            </span>
          </div>
          <div className="bg-white border border-slate-100 rounded-xl px-4 py-2 shadow-sm text-right">
            <span className="text-xs text-slate-400 block font-medium">Zone Avg AQI</span>
            <span className="text-lg font-bold text-amber-600 tabular-nums">
              {avgHotspotAQI || '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Map */}
        <div className="xl:col-span-2 bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-800">Hotspot Geographic Distribution</h2>
            <span className="text-xs text-slate-400">
              Showing {stations.length} reporting stations in {region}
            </span>
          </div>
          <div className="flex-1 min-h-[420px]">
            <StationMap
              stations={stations}
              selectedStation={selectedStation}
              onSelect={setSelectedStation}
              region={region}
            />
          </div>
        </div>

        {/* Hotspot list */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Ranked Hotspots
            </h2>
            <span className="text-xs text-slate-400 font-medium">Ranked High→Low</span>
          </div>

          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[500px] pr-1">
            {hotspots.map((h, i) => {
              const band = getAQIBand(h.aqi)
              const isSelected = selectedStation?.station_id === h.station_id
              const isSent = advisorySent[h.station_id]

              return (
                <div
                  key={h.station_id || i}
                  onClick={() => setSelectedStation(h)}
                  className={`flex flex-col p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#2563EB] bg-blue-50/50 shadow-sm'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white tabular-nums shadow-sm"
                      style={{ backgroundColor: band.color }}
                    >
                      {h.aqi}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-800 truncate">{h.name}</div>
                        <span className="text-xs font-bold text-red-500 tabular-nums">#{i + 1}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <SeverityBadge aqi={h.aqi} />
                        <span className="text-xs text-slate-400 truncate">{h.locality || h.city}</span>
                      </div>
                    </div>
                  </div>

                  {/* Secondary info and action */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span>PM2.5: <strong className="text-slate-700">{h.pm25 != null ? Math.round(h.pm25) : '—'}</strong></span>
                      <span>•</span>
                      <span>PM10: <strong className="text-slate-700">{h.pm10 != null ? Math.round(h.pm10) : '—'}</strong></span>
                    </div>
                    <button
                      onClick={(e) => handleDispatchAdvisory(h.station_id, e)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        isSent
                          ? 'bg-emerald-100 text-emerald-800 flex items-center gap-1'
                          : 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-slate-200'
                      }`}
                    >
                      {isSent ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sent!
                        </>
                      ) : (
                        'Issue Action'
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
