import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { FlaskConical, RefreshCw, ChevronDown, CheckCircle2, Send } from 'lucide-react'
import { matchesRegion } from '../utils/regions'
import { getAQIBand } from '../utils/aqi'
import { useCurrentAQI } from '../api/hooks'
import { MOCK_HISTORY_TREND } from '../data/mock'

const POLICY_DEFS = [
  { key: 'traffic',      label: 'Odd-Even Traffic Restriction',      impact: 16, icon: '🚗', desc: 'Cuts vehicular NO₂ and fine PM2.5 by ~16%' },
  { key: 'industry',     label: 'Industrial Fuel & Generator Curfew', impact: 22, icon: '🏭', desc: 'Restricts non-PNG industrial boilers & DG sets' },
  { key: 'waste',        label: 'Strict Biomass & Waste Burning Ban', impact: 9,  icon: '🔥', desc: 'Deterrence patrols across landfill & peri-urban zones' },
  { key: 'construction', label: 'Dust Control & Construction Pause',  impact: 14, icon: '🏗️', desc: 'Mandatory water misting and excavation stoppage' },
]

export default function PolicySimulator({ region = 'Delhi NCR' }) {
  const { data: aqiData, loading: aqiLoading } = useCurrentAQI({ city: 'Delhi NCR' })

  // 1. Filter stations by region
  const stations = useMemo(() => {
    const list = aqiData?.results || (Array.isArray(aqiData) ? aqiData : [])
    if (!region || region === 'Delhi NCR') return list
    const filtered = list.filter(s => matchesRegion(s, region))
    return filtered.length > 0 ? filtered : list
  }, [aqiData, region])

  const [selectedStationId, setSelectedStationId] = useState('ALL')
  const [policies, setPolicies] = useState({ traffic: true, industry: false, waste: true, construction: false })
  const [intensity, setIntensity] = useState(70)
  const [submitted, setSubmitted] = useState(false)

  // 2. Compute dynamic baseline AQI
  const baselineAQI = useMemo(() => {
    if (!stations.length) return 187
    if (selectedStationId === 'ALL') {
      const sum = stations.reduce((acc, s) => acc + (s.aqi || 0), 0)
      return Math.round(sum / stations.length)
    }
    const target = stations.find(s => s.station_id === selectedStationId)
    return target?.aqi || 187
  }, [stations, selectedStationId])

  // 3. Compute reduction percentage based on active policies and intensity
  const reductionPct = useMemo(() => {
    let totalPotential = 0
    POLICY_DEFS.forEach(p => {
      if (policies[p.key]) totalPotential += p.impact
    })
    // Diminishing returns curve for simultaneous policies
    const combinedFactor = 1 - Math.exp(-totalPotential / 100)
    return Math.min(65, combinedFactor * 100 * (intensity / 100))
  }, [policies, intensity])

  const simulatedAQI = Math.max(35, Math.round(baselineAQI * (1 - reductionPct / 100)))
  const aqiDelta = baselineAQI - simulatedAQI
  const baselineBand = getAQIBand(baselineAQI)
  const simulatedBand = getAQIBand(simulatedAQI)

  // 5. 14-day projection data based on dynamic baseline
  const chartData = useMemo(() => {
    return MOCK_HISTORY_TREND.map(d => {
      const baseVal = Math.round(baselineAQI * (d.observed / 187))
      const simVal = Math.max(30, Math.round(baseVal * (1 - reductionPct / 100)))
      return {
        date: d.date,
        observed: baseVal,
        simulated: simVal,
      }
    })
  }, [baselineAQI, reductionPct])

  const handleTogglePolicy = (key) => {
    setPolicies(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmitSimulation = () => {
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3500)
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-screen-2xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-100">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-800">Policy Intervention Simulator</h1>
              {aqiLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />}
              {region && region !== 'Delhi NCR' && (
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                  Zone: {region}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              Evaluate real-time atmospheric impact and public health benefits before issuing executive orders.
            </p>
          </div>
        </div>

        {/* Target Scope Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Target Area:</label>
          <div className="relative">
            <select
              value={selectedStationId}
              onChange={e => setSelectedStationId(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 pr-8 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="ALL">All {region} (Region-wide Average)</option>
              {stations.map(s => (
                <option key={s.station_id} value={s.station_id}>
                  {s.locality || s.station_name?.split(',')[0]} (Live AQI: {s.aqi})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Policy Controls */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-800">Select Interventions to Model</h2>
          <span className="text-xs text-slate-400">Toggle policies to calculate cumulative air quality relief</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
          {POLICY_DEFS.map(p => {
            const isChecked = policies[p.key]
            return (
              <div
                key={p.key}
                onClick={() => handleTogglePolicy(p.key)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  isChecked
                    ? 'border-[#2563EB] bg-blue-50/40 shadow-sm'
                    : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{p.icon}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="accent-[#2563EB] w-4 h-4 cursor-pointer"
                    />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">{p.label}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">{p.desc}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    Up to -{p.impact}% AQI
                  </span>
                  <span className={`text-[11px] font-medium ${isChecked ? 'text-blue-600' : 'text-slate-400'}`}>
                    {isChecked ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Implementation Intensity Slider */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-semibold text-slate-700">Enforcement Rigor & Field Compliance:</span>
              <span className="text-xs text-slate-500 ml-2">Applies field inspection and penal coefficient</span>
            </div>
            <span className="text-sm font-bold text-[#2563EB] tabular-nums bg-white border border-blue-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
              {intensity}% Rigor
            </span>
          </div>
          <input
            type="range"
            min={20}
            max={100}
            step={5}
            value={intensity}
            onChange={e => setIntensity(Number(e.target.value))}
            className="w-full accent-[#2563EB] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>20% (Partial Advisory)</span>
            <span>60% (Active Enforcement)</span>
            <span>100% (Emergency Martial Curfew)</span>
          </div>
        </div>
      </div>

      {/* Comparison Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Baseline Card */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Baseline</span>
              <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-medium">
                CPCB Telemetry
              </span>
            </div>
            <div className="text-5xl font-extrabold tabular-nums" style={{ color: baselineBand.color }}>
              {baselineAQI}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: baselineBand.bg, color: baselineBand.text }}>
                {baselineBand.label}
              </span>
              <span className="text-xs text-slate-500 truncate">
                {selectedStationId === 'ALL' ? `${region} Average` : 'Selected Station'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
            Real-time reference index before intervention modeling
          </div>
        </div>

        {/* Simulated Outcome Card */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider">Simulated Outcome</span>
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">
                ↓ {reductionPct.toFixed(1)}% Reduction
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <div className="text-5xl font-extrabold tabular-nums" style={{ color: simulatedBand.color }}>
                {simulatedAQI}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: simulatedBand.bg, color: simulatedBand.text }}>
                  {simulatedBand.label}
                </span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  ↓ {aqiDelta} AQI Points Drop
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              Reflects {intensity}% enforcement compliance
            </span>
            <button
              onClick={handleSubmitSimulation}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                submitted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#2563EB] hover:bg-blue-600 text-white active:scale-95 shadow-sm'
              }`}
            >
              {submitted ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Simulation Brief Forwarded to CAQM!
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Submit Simulation Brief
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Trajectory Timeline Chart */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-800">
            14-Day Trajectory: Observed Baseline vs Simulated Intervention
          </h2>
          <span className="text-xs text-slate-400">
            Simulated curve reflects active policies at {intensity}% implementation rigor
          </span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={35} />
            <Tooltip
              contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }}
            />
            <Line
              dataKey="observed"
              name="Current Baseline AQI"
              stroke="#EF4444"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#EF4444' }}
            />
            <Line
              dataKey="simulated"
              name="Simulated Policy AQI"
              stroke="#22C55E"
              strokeWidth={2.5}
              strokeDasharray="4 3"
              dot={{ r: 3, fill: '#22C55E' }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
