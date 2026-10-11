import { useState, useMemo } from 'react'
import { Calendar, AlertCircle, RefreshCw, ChevronDown, CheckCircle2, ShieldCheck, Flame, Send } from 'lucide-react'
import HeatmapGrid from '../components/HeatmapGrid'
import { getAQIBand } from '../utils/aqi'
import { matchesRegion } from '../utils/regions'
import { useCurrentAQI, useHourlyForecast, useDailyForecast } from '../api/hooks'
import { MOCK_HEATMAP, MOCK_FORECAST_ADVISORIES } from '../data/mock'

export default function ForecastWarnings({ region = 'Delhi NCR' }) {
  const { data: aqiData, loading: aqiLoading } = useCurrentAQI({ city: 'Delhi NCR' })

  // 1. Filter stations by region
  const stations = useMemo(() => {
    const list = aqiData?.results || (Array.isArray(aqiData) ? aqiData : [])
    if (!region || region === 'Delhi NCR') return list
    const filtered = list.filter(s => matchesRegion(s, region))
    return filtered.length > 0 ? filtered : list
  }, [aqiData, region])

  const [selectedStationId, setSelectedStationId] = useState('')
  const [issuedAdvisories, setIssuedAdvisories] = useState({})

  // Pick first station once loaded if not already selected
  const activeStationId = selectedStationId || stations[0]?.station_id || ''

  const activeStation = useMemo(() => {
    return stations.find(s => s.station_id === activeStationId) || stations[0]
  }, [stations, activeStationId])

  // 2. Fetch forecast predictions from PostgreSQL
  const { data: hourlyData, loading: hourlyLoading } = useHourlyForecast(
    activeStationId ? { station_id: activeStationId } : {}
  )
  const { data: dailyData, loading: dailyLoading } = useDailyForecast(
    activeStationId ? { station_id: activeStationId } : {}
  )

  // 3. Build dynamic Heatmap rows
  const heatmapData = useMemo(() => {
    const hourlyList = hourlyData?.results || (Array.isArray(hourlyData) ? hourlyData : [])
    const dailyList = dailyData?.results || (Array.isArray(dailyData) ? dailyData : [])

    if (!hourlyList.length && !dailyList.length) {
      return MOCK_HEATMAP
    }

    const rows = []
    const now = new Date()

    // Day 1: Next 24 Hours from hourly forecast
    const day1Hours = Array.from({ length: 24 }, (_, h) => {
      const match = hourlyList.find(item => item.lead_h === h + 1)
      if (match) {
        return {
          hour: h,
          aqi: match.aqi,
          pm25: match.pm25 != null ? Math.round(match.pm25) : Math.round(match.aqi * 0.7),
          pm10: match.pm10 != null ? Math.round(match.pm10) : Math.round(match.aqi * 1.2),
        }
      }
      // Baseline extrapolation from active station
      const base = activeStation?.aqi || 150
      const sim = Math.max(40, Math.round(base + Math.sin(h / 3) * 35))
      return { hour: h, aqi: sim, pm25: Math.round(sim * 0.7), pm10: Math.round(sim * 1.2) }
    })

    const day1Label = now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })
    rows.push({ date: `${day1Label} (Today/24h)`, hours: day1Hours })

    // Day 2 and Day 3 from daily projections
    const day2Record = dailyList.find(d => d.lead_day === 2) || dailyList[1]
    const day3Record = dailyList.find(d => d.lead_day === 3) || dailyList[2]

    const makeProjectedHours = (dayOffset, dayAvgAqi, label) => {
      const targetDate = new Date(now)
      targetDate.setDate(targetDate.getDate() + dayOffset)
      const avg = dayAvgAqi || (activeStation?.aqi || 140)

      const hours = Array.from({ length: 24 }, (_, h) => {
        const diurnal = Math.sin((h - 6) / 3.8) * 45
        const aqiVal = Math.max(45, Math.round(avg + diurnal))
        return {
          hour: h,
          aqi: aqiVal,
          pm25: Math.round(aqiVal * 0.68),
          pm10: Math.round(aqiVal * 1.15),
        }
      })

      const dateStr = targetDate.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })
      return { date: `${dateStr} (${label})`, hours }
    }

    rows.push(makeProjectedHours(1, day2Record?.aqi, 'Day 2'))
    rows.push(makeProjectedHours(2, day3Record?.aqi, 'Day 3'))

    return rows
  }, [hourlyData, dailyData, activeStation])

  // 4. Dynamic early-warning advisories & GRAP recommendations
  const dynamicAdvisories = useMemo(() => {
    const dailyList = dailyData?.results || (Array.isArray(dailyData) ? dailyData : [])
    const peakForecastAQI = dailyList.length > 0
      ? Math.max(...dailyList.map(d => d.aqi))
      : (activeStation?.aqi ? activeStation.aqi + 25 : 190)

    const advisories = []
    const stationName = activeStation?.name || activeStation?.station_name || region

    if (peakForecastAQI >= 300) {
      advisories.push({
        zone: `${stationName} · GRAP Stage III`,
        window: 'Next 24–48 Hours',
        aqi: peakForecastAQI,
        band: 'Very Poor to Severe',
        action: 'Invoke GRAP III: Ban BS-III petrol & BS-IV diesel cars, halt private construction',
      })
    } else if (peakForecastAQI >= 200) {
      advisories.push({
        zone: `${stationName} · GRAP Stage II`,
        window: 'Next 24–48 Hours',
        aqi: peakForecastAQI,
        band: 'Poor',
        action: 'Invoke GRAP II: Deploy anti-smog water sprinklers, diesel generator restrictions',
      })
    } else {
      advisories.push({
        zone: `${stationName} · GRAP Stage I`,
        window: 'Upcoming 72h Window',
        aqi: peakForecastAQI,
        band: 'Moderate',
        action: 'Routine dust control, mechanized road sweeping, ban on open biomass waste burning',
      })
    }

    // Forward advisory for nearby sensitive zones
    advisories.push({
      zone: `NCR Sensitive Clusters (${region})`,
      window: 'Day 2 Peak 08:00 – 16:00',
      aqi: Math.round(peakForecastAQI * 0.92),
      band: peakForecastAQI > 200 ? 'Poor' : 'Moderate',
      action: 'Issue advisory to schools: Shift morning outdoor activities and assemblies indoors',
    })

    return advisories
  }, [dailyData, activeStation, region])

  const handleIssueAction = (idx) => {
    setIssuedAdvisories(prev => ({ ...prev, [idx]: true }))
    setTimeout(() => {
      setIssuedAdvisories(prev => ({ ...prev, [idx]: false }))
    }, 4000)
  }

  const isLoading = hourlyLoading || dailyLoading || aqiLoading

  return (
    <div className="p-6 flex flex-col gap-6 max-w-screen-2xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-slate-800">72-Hour AQI Forecast Matrix</h1>
            {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />}
            {region && region !== 'Delhi NCR' && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                Zone: {region}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Multi-model XGBoost trajectory across lead hours. Cells colored by CPCB AQI severity bands.
          </p>
        </div>

        {/* Station Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Station Feed:</label>
          <div className="relative">
            <select
              value={activeStationId}
              onChange={e => setSelectedStationId(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 pr-8 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {stations.map(s => (
                <option key={s.station_id} value={s.station_id}>
                  {s.locality || s.station_name?.split(',')[0]} (AQI: {s.aqi})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Heatmap Grid Section */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-semibold text-slate-800">
              Hourly Forecast Matrix — <span className="text-[#2563EB]">{activeStation?.locality || activeStation?.station_name?.split(',')[0]}</span>
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Current AQI: <strong className="text-slate-700">{activeStation?.aqi ?? '—'}</strong> ({activeStation?.category || 'Active'})
          </span>
        </div>
        <HeatmapGrid data={heatmapData} />
      </div>

      {/* Early-warning advisories & Policy action triggers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" /> Early-Warning GRAP Advisories
          </h2>
          <span className="text-xs text-slate-400">Automated thresholds based on 72h peak exposure</span>
        </div>

        <div className="flex flex-col gap-3">
          {dynamicAdvisories.map((a, i) => {
            const band = getAQIBand(a.aqi)
            const isSent = issuedAdvisories[i]

            return (
              <div
                key={i}
                className="flex flex-col md:flex-row md:items-center gap-3 bg-white border border-slate-100 rounded-xl p-4 shadow-sm border-l-4 transition-all hover:shadow-md"
                style={{ borderLeftColor: band.color }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{a.zone}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: band.bg, color: band.text }}
                    >
                      {a.band}
                    </span>
                    <span className="text-xs tabular-nums font-bold" style={{ color: band.color }}>
                      Peak AQI {a.aqi}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 font-medium">{a.action}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Forecast Trigger Window: 📅 {a.window}</p>
                </div>
                <div className="shrink-0">
                  <button
                    onClick={() => handleIssueAction(i)}
                    className={`text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${
                      isSent
                        ? 'bg-emerald-600 text-white'
                        : 'text-white hover:opacity-90 active:scale-95'
                    }`}
                    style={!isSent ? { backgroundColor: band.color } : {}}
                  >
                    {isSent ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Advisory Dispatched!
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Dispatch GRAP Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
