import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend, ReferenceArea
} from 'recharts'
import {
  Wind, AlertTriangle, Wifi, BarChart2, FileText, Bell, FlaskConical,
  Download, TrendingUp, ArrowRight, Filter, SortAsc, RefreshCw, Check
} from 'lucide-react'
import { AQIHero, StatCard, PollutantBar, AlertCard, SeverityBadge } from '../components/ui'
import {
  MOCK_CITY_AQI, MOCK_TREND, MOCK_UPDATED, MOCK_KPIS, MOCK_HOTSPOTS,
  MOCK_POLLUTANTS, MOCK_WEEKLY_TREND, MOCK_ALERTS
} from '../data/mock'
import { getAQIBand } from '../utils/aqi'
import { matchesRegion } from '../utils/regions'
import { useCurrentAQI, useCurrentWeather, useDailyForecast } from '../api/hooks'

const ICON_MAP = { Wind, AlertTriangle, Wifi, BarChart2 }

const ZONE_BANDS = [
  { y1: 0,   y2: 50,  color: '#22C55E20' },
  { y1: 50,  y2: 100, color: '#84CC1620' },
  { y1: 100, y2: 200, color: '#EAB30820' },
  { y1: 200, y2: 300, color: '#F9731620' },
  { y1: 300, y2: 400, color: '#EF444420' },
  { y1: 400, y2: 500, color: '#7F1D1D30' },
]

const QUICK_ACTIONS = [
  { icon: FileText, label: 'Generate Report', color: '#2563EB' },
  { icon: Bell,     label: 'Issue Advisory',  color: '#EF4444' },
  { icon: AlertTriangle, label: 'Set Alert',  color: '#F97316' },
  { icon: FlaskConical, label: 'Policy Sim',  color: '#8B5CF6' },
  { icon: Download, label: 'Export Data',     color: '#059669' },
]

export default function Overview({ region = 'Delhi NCR' }) {
  const { data: aqiData, loading: aqiLoading } = useCurrentAQI({ city: 'Delhi NCR' })
  const { data: weatherData } = useCurrentWeather({ city: 'Delhi' })
  const { data: forecastData } = useDailyForecast({ city: 'Delhi NCR' })

  // 1. Extract live stations & deduplicate by name/locality
  const allStations = useMemo(() => {
    const list = aqiData?.results || (Array.isArray(aqiData) ? aqiData : [])
    const unique = new Map()
    list.forEach(s => {
      const key = (s.locality || s.station_name?.split(',')[0] || s.station_name || '').trim().toLowerCase()
      const existing = unique.get(key)
      if (!existing) {
        unique.set(key, s)
      } else {
        const sTime = s.ts ? new Date(s.ts).getTime() : 0
        const exTime = existing.ts ? new Date(existing.ts).getTime() : 0
        if (sTime > exTime || (sTime === exTime && (s.aqi || 0) > (existing.aqi || 0))) {
          unique.set(key, s)
        }
      }
    })
    return Array.from(unique.values())
  }, [aqiData])

  // Filter stations based on selected region
  const stations = useMemo(() => {
    if (!region || region === 'Delhi NCR') return allStations
    const matched = allStations.filter(s => matchesRegion(s, region))
    return matched.length > 0 ? matched : allStations
  }, [allStations, region])

  // 2. Compute dynamic City Average AQI
  const cityAQI = useMemo(() => {
    if (!stations.length) return MOCK_CITY_AQI
    const sum = stations.reduce((acc, s) => acc + (s.aqi || 0), 0)
    return Math.round(sum / stations.length)
  }, [stations])

  // 3. Dynamic Hotspots ranking from PostgreSQL
  const hotspots = useMemo(() => {
    if (!stations.length) return MOCK_HOTSPOTS
    return [...stations]
      .filter(s => s.aqi != null)
      .sort((a, b) => b.aqi - a.aqi)
      .slice(0, 5)
      .map(s => ({
        name: s.locality || s.station_name?.split(',')[0] || s.station_name,
        zone: s.city || 'Delhi NCR',
        aqi: s.aqi,
      }))
  }, [stations])

  const maxHotspotAqi = hotspots.length > 0 ? Math.max(...hotspots.map(h => h.aqi), 1) : 300

  // 4. Weather info
  const weather = Array.isArray(weatherData)
    ? weatherData[0]
    : (weatherData?.results ? weatherData.results[0] : weatherData)

  const activeAlertsCount = stations.filter(s => (s.aqi || 0) >= 200).length || MOCK_ALERTS.length

  const kpis = [
    {
      icon: 'Wind',
      label: 'Wind Speed',
      value: weather?.wind_speed_kmh ? `${weather.wind_speed_kmh} km/h` : '10.7 km/h',
      delta: weather?.temp_c ? `${Math.round(weather.temp_c)}°C temp` : '32°C temp',
      deltaLabel: 'surface wind',
    },
    {
      icon: 'AlertTriangle',
      label: 'Active Alerts',
      value: `${activeAlertsCount}`,
      delta: '+2',
      deltaLabel: 'critical wards',
    },
    {
      icon: 'Wifi',
      label: 'Stations Online',
      value: `${stations.length > 0 ? stations.length : (allStations.length || 20)}`,
      delta: region !== 'Delhi NCR' ? `${region}` : 'Active',
      deltaLabel: region !== 'Delhi NCR' ? 'reporting' : 'live monitoring',
    },
    {
      icon: 'BarChart2',
      label: region !== 'Delhi NCR' ? `${region} AQI` : 'City Avg AQI',
      value: `${cityAQI}`,
      delta: cityAQI > 200 ? 'Poor' : 'Moderate',
      deltaLabel: region || 'Delhi NCR',
    },
  ]

  // Dynamic timestamp
  const latestTs = stations[0]?.ts
  const updatedAt = latestTs
    ? new Date(latestTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : MOCK_UPDATED

  const navigate = useNavigate()
  const [alertFilter, setAlertFilter] = useState('all') // 'all' | 'critical' | 'high' | 'medium'
  const [alertSortAsc, setAlertSortAsc] = useState(false)
  const [exporting, setExporting] = useState(false)

  // 5. Generate dynamic live alerts based on real PostgreSQL telemetry breaches
  const liveAlerts = useMemo(() => {
    if (!stations.length) return MOCK_ALERTS

    const alerts = []
    const sorted = [...stations].filter(s => s.aqi != null).sort((a, b) => b.aqi - a.aqi)

    sorted.forEach(s => {
      const name = s.locality || s.station_name?.split(',')[0] || s.station_name
      const timeStr = s.ts
        ? new Date(s.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Just now'
      const pol = (s.dominant || 'pm25').toUpperCase()

      if (s.aqi >= 160) {
        alerts.push({
          severity: 'critical',
          title: `Severe AQI Breach — ${name}`,
          description: `AQI recorded at ${s.aqi} (${s.category || 'Moderate/Poor'}). ${pol} levels are elevated. Immediate school and outdoor advisories recommended for ${name}.`,
          zone: s.city || 'Delhi NCR',
          timestamp: timeStr,
          aqi: s.aqi,
        })
      } else if (s.aqi >= 150) {
        alerts.push({
          severity: 'high',
          title: `${pol} Spike — ${name}`,
          description: `AQI reached ${s.aqi} with ${pol} identified as dominant pollutant. Sensitive groups should wear N95 masks.`,
          zone: s.city || 'Delhi NCR',
          timestamp: timeStr,
          aqi: s.aqi,
        })
      } else if (s.aqi >= 130) {
        alerts.push({
          severity: 'medium',
          title: `Rising Pollution Trend — ${name}`,
          description: `AQI currently ${s.aqi}. Atmospheric dispersion remains moderate under current surface wind conditions.`,
          zone: s.city || 'Delhi NCR',
          timestamp: timeStr,
          aqi: s.aqi,
        })
      }
    })

    // If daily forecast has high projections, add a forward warning
    const forecastList = forecastData?.results || (Array.isArray(forecastData) ? forecastData : [])
    const peakForecast = forecastList.find(f => f.aqi >= 140)
    if (peakForecast) {
      alerts.push({
        severity: 'low',
        title: `Forecast Warning: Upcoming 48h`,
        description: `Model predicts elevated AQI around ${peakForecast.aqi} over the next 24–48 hours across monitoring zones.`,
        zone: 'Delhi NCR',
        timestamp: 'Forecast Run',
        aqi: peakForecast.aqi,
      })
    }

    return alerts.length > 0 ? alerts.slice(0, 5) : MOCK_ALERTS
  }, [stations, forecastData])

  const filteredAlerts = useMemo(() => {
    let list = [...liveAlerts]
    if (alertFilter !== 'all') {
      list = list.filter(a => a.severity === alertFilter)
    }
    return list.sort((a, b) => alertSortAsc ? (a.aqi || 0) - (b.aqi || 0) : (b.aqi || 0) - (a.aqi || 0))
  }, [liveAlerts, alertFilter, alertSortAsc])

  // Live CSV Export Action
  const handleExportData = () => {
    setExporting(true)
    setTimeout(() => {
      const dataToExport = stations.length > 0 ? stations : MOCK_HOTSPOTS
      const headers = ['Station ID', 'Name', 'City', 'AQI', 'Dominant Pollutant', 'Category', 'Timestamp']
      const rows = dataToExport.map(s => [
        `"${s.station_id || ''}"`,
        `"${s.name || s.station_name || ''}"`,
        `"${s.city || 'Delhi NCR'}"`,
        s.aqi ?? '',
        `"${s.dominant || 'pm25'}"`,
        `"${s.category || ''}"`,
        `"${s.ts || new Date().toISOString()}"`
      ])
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const uri = encodeURI(csv)
      const link = document.createElement('a')
      link.setAttribute('href', uri)
      link.setAttribute('download', `vayumitra_air_quality_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setExporting(false)
    }, 200)
  }

  const handleQuickAction = (label) => {
    if (label === 'Generate Report') navigate('/reports')
    else if (label === 'Policy Sim') navigate('/simulator')
    else if (label === 'Issue Advisory') navigate('/live')
    else if (label === 'Set Alert') {
      setAlertFilter(prev => prev === 'critical' ? 'all' : 'critical')
    } else if (label === 'Export Data') {
      handleExportData()
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-screen-2xl mx-auto">
      {/* Hero */}
      <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span>City AQI · {region || 'Delhi NCR'}</span>
            {aqiLoading && <RefreshCw className="w-3 h-3 animate-spin text-blue-500 inline" />}
            {region && region !== 'Delhi NCR' && (
              <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                Zone: {region} ({stations.length} reporting)
              </span>
            )}
          </div>
          <AQIHero aqi={cityAQI} trend={MOCK_TREND} updatedAt={updatedAt} city={region || 'Delhi NCR'} />
        </div>
        <div className="flex-1 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_WEEKLY_TREND} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area dataKey="aqi" stroke="#EF4444" strokeWidth={2} fill="url(#aqiGrad)" dot={false} />
              <Tooltip
                contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
                formatter={v => [v, 'AQI']}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KPI chips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k, i) => {
          const Icon = ICON_MAP[k.icon] || Wind
          return (
            <StatCard
              key={i}
              icon={Icon}
              label={k.label}
              value={k.value}
              delta={k.delta}
              deltaLabel={k.deltaLabel}
              loading={aqiLoading && !stations.length}
            />
          )
        })}
      </div>

      {/* Two-column: Rankings + Pollutants */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Pollution Rankings */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">🔴 Top Pollution Hotspots</h2>
            <span className="text-xs text-slate-400 font-medium">Live Sensor Feed</span>
          </div>
          <div className="flex flex-col gap-3">
            {hotspots.map((h, i) => {
              const band = getAQIBand(h.aqi)
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-4 tabular-nums">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-800">{h.name}</span>
                      <div className="flex items-center gap-2">
                        <SeverityBadge aqi={h.aqi} />
                        <span className="text-sm font-bold tabular-nums" style={{ color: band.color }}>{h.aqi}</span>
                      </div>
                    </div>
                    <div className="bg-slate-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, (h.aqi / maxHotspotAqi) * 100)}%`, backgroundColor: band.color }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 mt-0.5 block">{h.zone}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pollutant Breakdown */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">📊 Pollutant Breakdown vs Limits</h2>
          <div className="flex flex-col gap-3">
            {MOCK_POLLUTANTS.map((p, i) => (
              <PollutantBar key={i} {...p} />
            ))}
          </div>
        </div>
      </div>

      {/* Weekly AQI Trend Chart */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">📈 7-Day AQI Trend</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={MOCK_WEEKLY_TREND} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            {ZONE_BANDS.map((z, i) => (
              <ReferenceArea key={i} y1={z.y1} y2={z.y2} fill={z.color} ifOverflow="visible" />
            ))}
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 350]} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={35} />
            <Tooltip
              contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
            />
            <Line dataKey="aqi" name="Observed AQI" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: '#2563EB' }} />
            <Line dataKey="forecast" name="Forecast" stroke="#F97316" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls={false} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts panel */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-800">🚨 Live Critical Alerts</h2>
            {alertFilter !== 'all' && (
              <span className="text-[11px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                Filter: {alertFilter}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const cycle = ['all', 'critical', 'high', 'medium']
                const next = cycle[(cycle.indexOf(alertFilter) + 1) % cycle.length]
                setAlertFilter(next)
              }}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors font-medium"
            >
              <Filter className="w-3 h-3" /> Filter: {alertFilter === 'all' ? 'All' : alertFilter}
            </button>
            <button
              onClick={() => setAlertSortAsc(prev => !prev)}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors font-medium"
            >
              <SortAsc className="w-3 h-3" /> Sort {alertSortAsc ? 'Low→High' : 'High→Low'}
            </button>
            <button
              onClick={() => navigate('/live')}
              className="flex items-center gap-1 text-xs text-[#2563EB] hover:underline ml-2 font-semibold"
            >
              View Live Stations <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((a, i) => <AlertCard key={i} {...a} />)
          ) : (
            <div className="text-center py-6 text-sm text-slate-400">
              No alerts match the selected severity filter.
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Quick Actions</h2>
          {exporting && (
            <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
              <RefreshCw className="w-3 h-3 animate-spin" /> Preparing CSV…
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {QUICK_ACTIONS.map((a, i) => {
            const Icon = a.icon
            return (
              <button
                key={i}
                onClick={() => handleQuickAction(a.label)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md text-sm font-medium text-slate-700 transition-all duration-150 cursor-pointer active:scale-95"
              >
                <Icon className="w-4 h-4" style={{ color: a.color }} />
                {a.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
