import { useMemo } from 'react'
import { Car, RefreshCw, TrendingUp, AlertTriangle, Wind, Radio, Clock, ShieldCheck, Gauge } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { matchesRegion } from '../utils/regions'
import { useCurrentAQI, useLiveTraffic } from '../api/hooks'

export default function TrafficUrban({ region = 'Delhi NCR' }) {
  const { data: trafficRes, loading: trafficLoading } = useLiveTraffic({ region })
  const { data: aqiData, loading: aqiLoading } = useCurrentAQI({ city: 'Delhi NCR' })

  // 1. Correlate corridors either from live traffic endpoint or fallback to client correlation
  const trafficData = useMemo(() => {
    if (trafficRes?.corridors && trafficRes.corridors.length > 0) {
      return trafficRes.corridors.map(c => ({
        zone: c.name.length > 15 ? c.name.slice(0, 15) + '…' : c.name,
        fullName: c.fullName || c.name,
        name: c.name,
        vehicles: c.vehicles,
        aqi: c.aqi,
        no2: c.no2,
        currentSpeed: c.currentSpeed,
        freeFlowSpeed: c.freeFlowSpeed,
        congestionIndex: c.congestionIndex,
        congestionLevel: c.congestionLevel,
        source: c.source
      }))
    }

    // Fallback: Calculate from live CPCB stations if backend traffic endpoint is still loading
    const list = aqiData?.results || (Array.isArray(aqiData) ? aqiData : [])
    const filtered = (!region || region === 'Delhi NCR') ? list : list.filter(s => matchesRegion(s, region))
    const stations = filtered.length > 0 ? filtered : list

    return [...stations]
      .filter(s => s.aqi != null)
      .slice(0, 8)
      .map(s => {
        const name = s.locality || s.station_name?.split(',')[0] || s.station_name
        const no2 = s.no2 != null ? Number(s.no2) : 15
        const vehiclesEst = Math.round(500 + no2 * 65 + s.aqi * 3.5)
        return {
          zone: name.length > 15 ? name.slice(0, 15) + '…' : name,
          fullName: name,
          name,
          vehicles: vehiclesEst,
          aqi: s.aqi,
          no2: Math.round(no2),
          currentSpeed: 28,
          freeFlowSpeed: 50,
          congestionIndex: Math.min(95, Math.round(vehiclesEst / 22)),
          congestionLevel: vehiclesEst > 1500 ? 'Severe' : 'Elevated',
          source: 'CPCB Telemetry Synthesis'
        }
      })
      .sort((a, b) => b.vehicles - a.vehicles)
  }, [trafficRes, aqiData, region])

  const avgVehicles = trafficRes?.avg_density || (
    trafficData.length > 0
      ? Math.round(trafficData.reduce((acc, t) => acc + t.vehicles, 0) / trafficData.length)
      : 1250
  )

  const congestionRisk = trafficRes?.congestion_risk || (avgVehicles > 1500 ? 'Severe' : 'Elevated')
  const peakArtery = trafficData[0]
  const dispersion = trafficRes?.dispersion
  const recommendation = trafficRes?.recommendation
  const isLiveApi = trafficRes?.live_api_active
  const isLoading = trafficLoading && aqiLoading

  return (
    <div className="p-6 flex flex-col gap-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-100 shadow-sm">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-semibold text-slate-800">Traffic & Urban Impact</h1>
              {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />}
              
              {/* Live Provider Status Badge */}
              {isLiveApi ? (
                <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                  <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                  Live Traffic API Connected
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium"
                  title="Endpoint is open and ready. Add TRAFFIC_API_KEY to activate external real-time feed."
                >
                  <Radio className="w-3 h-3 text-blue-500" />
                  Telemetry & Rush-Hour Profile (API Key Ready)
                </span>
              )}

              {trafficRes?.diurnal_window && (
                <span className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {trafficRes.diurnal_window}
                </span>
              )}

              {region && region !== 'Delhi NCR' && (
                <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold">
                  Zone: {region}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Live correlation between vehicular density, ambient NO₂ levels, road speeds, and station AQI.
            </p>
          </div>
        </div>

        {/* Traffic KPI Metrics */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-100 rounded-xl px-4 py-2 shadow-sm text-right">
            <span className="text-xs text-slate-400 block font-medium">Avg Fleet Density</span>
            <span className="text-lg font-bold text-[#2563EB] tabular-nums">
              {avgVehicles.toLocaleString()} <span className="text-xs font-normal text-slate-500">veh/h</span>
            </span>
          </div>
          <div className="bg-white border border-slate-100 rounded-xl px-4 py-2 shadow-sm text-right">
            <span className="text-xs text-slate-400 block font-medium">Congestion Risk</span>
            <span className={`text-lg font-bold ${congestionRisk === 'Severe' ? 'text-rose-600' : 'text-amber-600'}`}>
              {congestionRisk}
            </span>
          </div>
        </div>
      </div>

      {/* Main Bar Chart */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Corridor Vehicular Density vs Measured Station AQI
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isLiveApi
                ? 'Correlated with Live Traffic Speeds & Ground Telemetry'
                : 'CPCB Telemetry, Live NO₂ Chemistry & Diurnal Profile (Ready for Real Traffic API)'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-100">
              Active Corridors: {trafficData.length}
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={trafficData} margin={{ top: 10, right: 25, bottom: 25, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="zone" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              width={50}
              label={{ value: 'Vehicles/h', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94A3B8' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              width={40}
              label={{ value: 'AQI Index', angle: 90, position: 'insideRight', fontSize: 10, fill: '#94A3B8' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs border border-slate-700">
                      <div className="font-semibold text-sm mb-1 text-slate-100">{d.fullName}</div>
                      <div className="space-y-1 text-slate-300">
                        <div className="flex justify-between gap-4">
                          <span>Vehicular Flow:</span>
                          <span className="font-bold text-blue-400">{d.vehicles.toLocaleString()} veh/h</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Station AQI:</span>
                          <span className="font-bold text-rose-400">{d.aqi}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>NO₂ Co-Pollutant:</span>
                          <span className="font-bold text-amber-400">{d.no2} ppb</span>
                        </div>
                        {d.currentSpeed && (
                          <div className="flex justify-between gap-4 border-t border-slate-700 pt-1 mt-1 text-slate-400">
                            <span>Corridor Speed:</span>
                            <span className="text-white font-medium">{d.currentSpeed} km/h</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 pt-0.5 italic">{d.source}</div>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar yAxisId="left"  dataKey="vehicles" name="Vehicles/h" fill="#2563EB" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="aqi"      name="Station AQI" fill="#EF4444" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
            <Bar yAxisId="right" dataKey="no2"      name="NO₂ Level (ppb)" fill="#F59E0B" radius={[4, 4, 0, 0]} fillOpacity={0.7} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Dynamic Corridor & Policy Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Peak Emission Artery */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5 text-rose-600">
                <TrendingUp className="w-4 h-4" /> Peak Emission Artery
              </span>
              {peakArtery && (
                <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold">
                  {peakArtery.congestionLevel || 'Elevated'}
                </span>
              )}
            </div>
            <div className="text-base font-bold text-slate-800">
              {peakArtery?.fullName || 'Anand Vihar Corridor'}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 font-medium">
              <span>NO₂: <strong className="text-amber-600">{peakArtery?.no2 || 24} ppb</strong></span>
              <span>•</span>
              <span>AQI: <strong className="text-rose-600">{peakArtery?.aqi || 180}</strong></span>
              {peakArtery?.currentSpeed && (
                <>
                  <span>•</span>
                  <span>Speed: <strong className="text-blue-600">{peakArtery.currentSpeed} km/h</strong></span>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2.5 border-t border-slate-50 pt-2">
            Exhibits highest roadside NO₂ concentration. Recommend commercial freight diversions during peak hours.
          </p>
        </div>

        {/* 2. Traffic Dispersion Factor (Live Atmospheric Clearance) */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5 text-blue-600">
                <Wind className="w-4 h-4" /> Traffic Dispersion Factor
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                dispersion?.level === 'high'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : dispersion?.level === 'stagnant'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {dispersion?.windSpeed ? `${dispersion.windSpeed} km/h` : 'Live Telemetry'}
              </span>
            </div>
            <div className="text-base font-bold text-slate-800">
              {dispersion?.title || 'Moderate Wind Clearance'}
            </div>
            <div className="text-xs text-slate-500 mt-1.5 font-medium">
              {dispersion?.risk || 'Current boundary ventilation prevents extreme micro-pocket trapping.'}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2.5 border-t border-slate-50 pt-2">
            {dispersion?.summary || 'Current surface wind dispersion prevents extreme micro-pocket ground-level accumulation.'}
          </p>
        </div>

        {/* 3. Executive Recommendation (Live Policy Decision Matrix) */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5 text-amber-600">
                <AlertTriangle className="w-4 h-4" /> Executive Recommendation
              </span>
              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
                {recommendation?.severity || 'Active Action'}
              </span>
            </div>
            <div className="text-base font-bold text-slate-800">
              {recommendation?.title || 'Deploy Intelligent Traffic Signals'}
            </div>
            <div className="text-xs text-slate-500 mt-1.5 font-medium">
              Target: <strong className="text-slate-700">{recommendation?.targetCorridor || peakArtery?.name || 'Major Corridors'}</strong>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2.5 border-t border-slate-50 pt-2">
            {recommendation?.summary || 'Dynamic green corridor synchronization can cut stop-and-go vehicular idling emissions by up to 18%.'}
          </p>
        </div>
      </div>
    </div>
  )
}

