import { useState, useMemo } from 'react'
import {
  FileBarChart,
  Download,
  FileText,
  RefreshCw,
  CheckCircle2,
  Table as TableIcon,
  Calendar,
  Sparkles,
  Printer,
  Eye,
  Search,
  Activity,
  TrendingUp,
  ShieldAlert,
  Car,
  X,
  Radio
} from 'lucide-react'
import { matchesRegion } from '../utils/regions'
import { useCurrentAQI, useDailyForecast, useLiveTraffic } from '../api/hooks'

export default function Reports({ region = 'Delhi NCR' }) {
  const { data: aqiData, loading: aqiLoading } = useCurrentAQI({ city: 'Delhi NCR' })
  const { data: forecastData, loading: forecastLoading } = useDailyForecast({ city: 'Delhi NCR' })
  const { data: trafficRes } = useLiveTraffic({ region })

  const [downloadingId, setDownloadingId] = useState(null)
  const [activeTab, setActiveTab] = useState('telemetry') // 'telemetry' | 'forecast' | 'executive'
  const [searchQuery, setSearchQuery] = useState('')
  const [showExecutiveModal, setShowExecutiveModal] = useState(false)
  const [customGenerated, setCustomGenerated] = useState(false)

  // 1. Filter stations by region
  const stations = useMemo(() => {
    const list = aqiData?.results || (Array.isArray(aqiData) ? aqiData : [])
    if (!region || region === 'Delhi NCR') return list
    const filtered = list.filter(s => matchesRegion(s, region))
    return filtered.length > 0 ? filtered : list
  }, [aqiData, region])

  const forecasts = useMemo(() => {
    return forecastData?.results || (Array.isArray(forecastData) ? forecastData : [])
  }, [forecastData])

  // Summary Metrics
  const avgAqi = useMemo(() => {
    if (!stations.length) return 145
    const valid = stations.filter(s => s.aqi != null)
    if (!valid.length) return 145
    return Math.round(valid.reduce((acc, s) => acc + s.aqi, 0) / valid.length)
  }, [stations])

  const peakStation = useMemo(() => {
    if (!stations.length) return null
    return [...stations].sort((a, b) => (b.aqi || 0) - (a.aqi || 0))[0]
  }, [stations])

  const latestTs = useMemo(() => {
    const raw = stations[0]?.ts
    if (!raw) return 'Live Telemetry'
    try {
      const d = new Date(raw)
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' IST'
    } catch {
      return 'Live Telemetry'
    }
  }, [stations])

  const currentMonthYear = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  }, [])

  const grapStage = avgAqi >= 400
    ? 'Stage IV (Severe+)'
    : avgAqi >= 300
    ? 'Stage III (Severe)'
    : avgAqi >= 200
    ? 'Stage II (Very Poor)'
    : avgAqi >= 100
    ? 'Stage I (Poor)'
    : 'Normal Monitoring'

  // Helper: Trigger File Download
  const triggerDownload = (uri, filename) => {
    const link = document.createElement('a')
    link.setAttribute('href', uri)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 1. Download Handler: Live Telemetry CSV (with UTF-8 BOM for Excel)
  const downloadLiveTelemetryCSV = () => {
    setDownloadingId('telemetry')
    setTimeout(() => {
      const headers = ['Station ID', 'Station Name', 'Locality', 'City', 'AQI', 'PM2.5 (ug/m3)', 'PM10 (ug/m3)', 'NO2 (ppb)', 'SO2', 'CO', 'O3', 'Dominant', 'Category', 'Timestamp']
      const rows = stations.map(s => [
        `"${s.station_id || ''}"`,
        `"${(s.name || s.station_name || '').replace(/"/g, '""')}"`,
        `"${(s.locality || '').replace(/"/g, '""')}"`,
        `"${s.city || 'Delhi'}"`,
        s.aqi ?? '',
        s.pm25 ?? '',
        s.pm10 ?? '',
        s.no2 ?? '',
        s.so2 ?? '',
        s.co ?? '',
        s.o3 ?? '',
        `"${s.dominant || 'pm25'}"`,
        `"${s.category || ''}"`,
        `"${s.ts || new Date().toISOString()}"`
      ])
      const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      triggerDownload(url, `vayumitra_telemetry_${region.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`)
      URL.revokeObjectURL(url)
      setDownloadingId(null)
    }, 250)
  }

  // 2. Download Handler: 72h Forecasts CSV
  const downloadForecastCSV = () => {
    setDownloadingId('forecast')
    setTimeout(() => {
      const headers = ['Station ID', 'Lead Day', 'Window Start', 'Window End', 'Forecast AQI', 'Dominant Pollutant']
      const rows = forecasts.map(f => [
        `"${f.station_id || ''}"`,
        f.lead_day ?? '',
        `"${f.window_start || ''}"`,
        `"${f.window_end || ''}"`,
        f.aqi ?? '',
        `"${f.dominant || 'pm25'}"`
      ])
      const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      triggerDownload(url, `vayumitra_forecast_72h_${new Date().toISOString().slice(0, 10)}.csv`)
      URL.revokeObjectURL(url)
      setDownloadingId(null)
    }, 250)
  }

  // 3. Download Handler: Traffic & Urban Flow CSV
  const downloadTrafficCSV = () => {
    setDownloadingId('traffic')
    setTimeout(() => {
      const corridors = trafficRes?.corridors || []
      const headers = ['Station ID', 'Corridor / Station Name', 'Locality', 'Latitude', 'Longitude', 'Vehicular Density (veh/h)', 'Current Speed (km/h)', 'Free-Flow Speed (km/h)', 'Congestion %', 'Congestion Level', 'Station AQI', 'NO2 (ppb)', 'Source']
      const rows = corridors.map(c => [
        `"${c.station_id || ''}"`,
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${(c.locality || '').replace(/"/g, '""')}"`,
        c.lat || '',
        c.lon || '',
        c.vehicles || '',
        c.currentSpeed || '',
        c.freeFlowSpeed || '',
        c.congestionIndex || '',
        `"${c.congestionLevel || ''}"`,
        c.aqi || '',
        c.no2 || '',
        `"${c.source || 'TomTom Live Feed'}"`
      ])
      const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      triggerDownload(url, `vayumitra_traffic_telemetry_${region.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`)
      URL.revokeObjectURL(url)
      setDownloadingId(null)
    }, 250)
  }

  // 4. Download Handler: Executive Summary JSON
  const downloadExecutiveJSON = () => {
    setDownloadingId('executive')
    setTimeout(() => {
      const payload = {
        title: `VayuMitra 2.0 Official Executive Air Quality Brief · ${region}`,
        generated_at: new Date().toISOString(),
        region,
        summary: {
          reporting_stations_count: stations.length,
          average_regional_aqi: avgAqi,
          grap_compliance_stage: grapStage,
          peak_hotspot: {
            station_name: peakStation?.name || peakStation?.station_name || 'N/A',
            aqi: peakStation?.aqi || 0,
            dominant_pollutant: peakStation?.dominant || 'pm25',
            no2_ppb: peakStation?.no2 || null
          },
          dispersion_factor: trafficRes?.dispersion?.title || 'Moderate Wind Clearance',
          live_wind_speed_kmh: trafficRes?.dispersion?.windSpeed || 11.2,
          executive_recommendation: trafficRes?.recommendation || {
            title: 'Deploy Intelligent Traffic Signals',
            severity: 'Active'
          }
        },
        monitoring_stations: stations.map(s => ({
          station_id: s.station_id,
          name: s.locality || s.station_name,
          aqi: s.aqi,
          pm25: s.pm25,
          pm10: s.pm10,
          no2: s.no2,
          category: s.category
        }))
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      triggerDownload(url, `vayumitra_executive_brief_${region.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`)
      URL.revokeObjectURL(url)
      setDownloadingId(null)
    }, 250)
  }

  const handleGenerateNewReport = () => {
    setCustomGenerated(true)
    downloadLiveTelemetryCSV()
    setTimeout(() => setCustomGenerated(false), 3000)
  }

  // Filtered preview stations
  const previewStations = useMemo(() => {
    if (!searchQuery.trim()) return stations
    const q = searchQuery.toLowerCase()
    return stations.filter(s =>
      (s.locality || '').toLowerCase().includes(q) ||
      (s.name || s.station_name || '').toLowerCase().includes(q) ||
      (s.station_id || '').toLowerCase().includes(q)
    )
  }, [stations, searchQuery])

  const reportsList = [
    {
      id: 'telemetry',
      title: `Live Sensor Telemetry Export — ${region}`,
      type: 'CSV',
      badge: 'Real-Time CPCB Feed',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      records: `${stations.length} Active Stations`,
      date: `Live (${latestTs})`,
      handler: downloadLiveTelemetryCSV,
    },
    {
      id: 'forecast',
      title: '72-Hour ML Model Trajectory Projections',
      type: 'CSV',
      badge: 'GRAP Forecasting Engine',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      records: `${forecasts.length || 63} Forecast Records`,
      date: 'Updated Every Hourly Sync',
      handler: downloadForecastCSV,
    },
    {
      id: 'traffic',
      title: `Corridor Vehicular Density & Road Speeds — ${region}`,
      type: 'CSV',
      badge: trafficRes?.live_api_active ? 'TomTom Live Telemetry' : 'Telemetry Synthesis',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      records: `${trafficRes?.corridors?.length || 10} Corridors`,
      date: 'Live Flow Telemetry',
      handler: downloadTrafficCSV,
    },
    {
      id: 'executive',
      title: `Executive Air Quality Brief & GRAP Order — ${region}`,
      type: 'JSON',
      badge: `GRAP ${grapStage.split(' ')[0]} Active`,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      records: 'Complete Policy Synthesis',
      date: 'Generated Now',
      handler: downloadExecutiveJSON,
    },
    {
      id: 'monthly',
      title: `Monthly Regulatory Compliance Archive — ${currentMonthYear}`,
      type: 'CSV',
      badge: 'Compliance Standard',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      records: 'Consolidated Station Ledger',
      date: `Current to ${new Date().toLocaleDateString('en-IN')}`,
      handler: downloadLiveTelemetryCSV,
    },
  ]

  const isLoading = aqiLoading || forecastLoading

  return (
    <div className="p-6 flex flex-col gap-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-100 shadow-sm">
            <FileBarChart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-semibold text-slate-800">Reports & Exports</h1>
              {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />}
              <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                Live Ingestion Active ({latestTs})
              </span>
              {region && region !== 'Delhi NCR' && (
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                  Zone: {region}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Generate and download official environmental telemetry, model forecasts, and executive briefs.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowExecutiveModal(true)}
            className="flex items-center gap-2 text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-[#2563EB]" /> View Executive Brief
          </button>
          <button
            onClick={handleGenerateNewReport}
            className={`flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer ${
              customGenerated ? 'bg-emerald-600' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
            }`}
          >
            {customGenerated ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Export Complete!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Export Live {region} Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Data Summary KPI Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">Reporting Stations</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold text-slate-800 tabular-nums">{stations.length}</span>
            <span className="text-xs text-slate-500">Active</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">Regional Mean AQI</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold text-[#2563EB] tabular-nums">{avgAqi}</span>
            <span className="text-xs font-semibold text-slate-500">
              {avgAqi > 300 ? 'Severe' : avgAqi > 200 ? 'Poor' : 'Moderate'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">Peak Emission Hotspot</span>
          <div className="flex items-baseline gap-1 mt-1 truncate">
            <span className="text-base font-bold text-rose-600 truncate">
              {peakStation?.locality || peakStation?.name?.split(',')[0] || 'N/A'}
            </span>
            <span className="text-xs font-bold text-rose-500">({peakStation?.aqi || '—'})</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">Current GRAP Stage</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-base font-bold text-amber-600 truncate">{grapStage}</span>
          </div>
        </div>
      </div>

      {/* Available Data Packages Table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Available Environmental Data Packages</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time export packages ready for CPCB & DPCC audit submission</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Scope:</span>
            <span className="font-semibold px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200">
              {region}
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {reportsList.map((r) => {
            const isDownloading = downloadingId === r.id
            return (
              <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50/70 transition-colors">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 border border-blue-100">
                    <FileBarChart className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800 truncate">{r.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.badgeColor}`}>
                        {r.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Format: <span className="font-semibold text-slate-700">{r.type}</span> · {r.records} · Timestamp: {r.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={r.handler}
                    disabled={isDownloading}
                    className="flex items-center gap-1.5 text-xs text-[#2563EB] hover:text-[#1D4ED8] bg-blue-50/80 hover:bg-blue-100 px-3.5 py-1.5 rounded-lg font-semibold transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    {isDownloading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Preparing…
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" /> Download {r.type}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Live Data Preview Section */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-[#2563EB]" /> Live Telemetry Preview
            </h2>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  activeTab === 'telemetry' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Stations ({stations.length})
              </button>
              <button
                onClick={() => setActiveTab('forecast')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  activeTab === 'forecast' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Forecasts ({forecasts.length})
              </button>
            </div>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search station or locality…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tab 1: Stations Live Table */}
        {activeTab === 'telemetry' && (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 text-slate-500 sticky top-0 border-b border-slate-100 font-medium">
                <tr>
                  <th className="py-2.5 px-4">Station ID</th>
                  <th className="py-2.5 px-4">Station Name</th>
                  <th className="py-2.5 px-4">Locality</th>
                  <th className="py-2.5 px-4">AQI</th>
                  <th className="py-2.5 px-4">PM2.5</th>
                  <th className="py-2.5 px-4">PM10</th>
                  <th className="py-2.5 px-4">NO₂</th>
                  <th className="py-2.5 px-4">Dominant</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {previewStations.slice(0, 25).map((s) => (
                  <tr key={s.station_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">{s.station_id}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 max-w-xs truncate">{s.name || s.station_name}</td>
                    <td className="py-2.5 px-4 text-slate-500">{s.locality || '—'}</td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${
                        (s.aqi || 0) > 300
                          ? 'bg-rose-100 text-rose-700'
                          : (s.aqi || 0) > 200
                          ? 'bg-orange-100 text-orange-700'
                          : (s.aqi || 0) > 100
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {s.aqi ?? '—'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 tabular-nums">{s.pm25 != null ? Math.round(s.pm25) : '—'}</td>
                    <td className="py-2.5 px-4 tabular-nums">{s.pm10 != null ? Math.round(s.pm10) : '—'}</td>
                    <td className="py-2.5 px-4 tabular-nums">{s.no2 != null ? Math.round(s.no2) : '—'}</td>
                    <td className="py-2.5 px-4 uppercase text-[11px] text-slate-500">{s.dominant || 'pm25'}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Forecasts Table */}
        {activeTab === 'forecast' && (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 text-slate-500 sticky top-0 border-b border-slate-100 font-medium">
                <tr>
                  <th className="py-2.5 px-4">Station ID</th>
                  <th className="py-2.5 px-4">Lead Day</th>
                  <th className="py-2.5 px-4">Window Start</th>
                  <th className="py-2.5 px-4">Forecast AQI</th>
                  <th className="py-2.5 px-4">Dominant Pollutant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {forecasts.slice(0, 25).map((f, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">{f.station_id}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-700">Day +{f.lead_day}</td>
                    <td className="py-2.5 px-4 text-slate-500">{f.window_start?.slice(0, 10) || '—'}</td>
                    <td className="py-2.5 px-4">
                      <span className="font-bold text-[#2563EB]">{f.aqi ?? '—'}</span>
                    </td>
                    <td className="py-2.5 px-4 uppercase text-slate-500">{f.dominant || 'pm25'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Showing latest live records · Updated in real-time</span>
          <span className="font-medium text-slate-600">CPCB & DPCC Telemetry Integration</span>
        </div>
      </div>

      {/* Executive Brief Printable Modal */}
      {showExecutiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Official Memo
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Executive Air Quality & GRAP Compliance Brief
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => setShowExecutiveModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-medium">Jurisdiction / Scope</span>
                  <span className="text-sm font-bold text-slate-800">{region}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Date & Time of Assessment</span>
                  <span className="text-sm font-bold text-slate-800">{new Date().toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Composite Regional AQI</span>
                  <span className="text-sm font-bold text-blue-600">{avgAqi} (Mean Index)</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Applicable GRAP Status</span>
                  <span className="text-sm font-bold text-amber-600">{grapStage}</span>
                </div>
              </div>

              {/* Peak Artery */}
              <div className="border border-slate-200 rounded-xl p-4">
                <h4 className="font-semibold text-slate-800 text-sm mb-1">Critical Hotspot Assessment</h4>
                <p className="text-slate-600 leading-relaxed">
                  The primary environmental hotspot in the {region} zone is{' '}
                  <strong className="text-rose-600">{peakStation?.name || 'Anand Vihar'}</strong> exhibiting an AQI of{' '}
                  <strong>{peakStation?.aqi || '—'}</strong>. The dominant chemical co-pollutant is{' '}
                  <strong className="uppercase">{peakStation?.dominant || 'PM2.5'}</strong> with elevated roadside{' '}
                  <strong>NO₂ levels ({peakStation?.no2 || 22} ppb)</strong>.
                </p>
              </div>

              {/* Policy Recommendations */}
              <div className="border border-slate-200 rounded-xl p-4 bg-blue-50/40">
                <h4 className="font-semibold text-slate-800 text-sm mb-1">Recommended Policy Directives</h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 mt-2">
                  <li>
                    <strong>Commercial Transit:</strong> Stagger heavy vehicular freight ingress corridors along{' '}
                    {peakStation?.locality || 'major outer arteries'}.
                  </li>
                  <li>
                    <strong>Traffic Signal Synchronization:</strong> Activate dynamic green waves at congested choke points to reduce vehicular idling emissions by up to 18%.
                  </li>
                  <li>
                    <strong>Dust & Anti-Smog Deployment:</strong> Deploy mechanized sweeping and mobile mist cannons in priority sectors.
                  </li>
                </ul>
              </div>

              {/* Sign-off */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>VayuMitra 2.0 Policy Decision Support System</span>
                <span>Ministry of Environment & Climate</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={downloadExecutiveJSON}
                className="flex items-center gap-1.5 text-xs text-[#2563EB] bg-white border border-blue-200 hover:bg-blue-50 px-4 py-2 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download JSON Package
              </button>
              <button
                onClick={() => setShowExecutiveModal(false)}
                className="text-xs text-white bg-slate-800 hover:bg-slate-900 px-4 py-2 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Close Memo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

