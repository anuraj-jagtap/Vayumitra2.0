import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { MOCK_HISTORY_TREND } from '../data/mock'
import { FlaskConical } from 'lucide-react'

const BASELINE_AQI = 187

function generateSimulated(policies) {
  const reduction = (policies.traffic ? 15 : 0) + (policies.industry ? 25 : 0) + (policies.waste ? 8 : 0)
  return MOCK_HISTORY_TREND.map(d => ({
    ...d,
    simulated: Math.max(30, Math.round(d.observed * (1 - reduction / 100))),
  }))
}

export default function PolicySimulator() {
  const [policies, setPolicies] = useState({ traffic: false, industry: false, waste: false })
  const [intensity, setIntensity] = useState(50)
  const data = generateSimulated(policies)

  const reductionPct = ((policies.traffic ? 15 : 0) + (policies.industry ? 25 : 0) + (policies.waste ? 8 : 0)) * (intensity / 100)
  const simulatedAQI = Math.round(BASELINE_AQI * (1 - reductionPct / 100))

  return (
    <div className="p-6 flex flex-col gap-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-3">
        <FlaskConical className="w-5 h-5 text-[#2563EB]" />
        <div>
          <h1 className="text-base font-semibold text-slate-800">Policy Simulator</h1>
          <p className="text-sm text-slate-500">Model AQI impact of policy interventions before issuing advisories.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Simulation Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {[
            { key: 'traffic',  label: 'Odd-Even Traffic Restriction', impact: '-15% AQI', icon: '🚗' },
            { key: 'industry', label: 'Industrial Shutdown',          impact: '-25% AQI', icon: '🏭' },
            { key: 'waste',    label: 'Waste Burning Ban',            impact: '-8% AQI',  icon: '🔥' },
          ].map(p => (
            <label
              key={p.key}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${policies[p.key] ? 'border-[#2563EB] bg-[#DBEAFE]/30' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
            >
              <input
                type="checkbox"
                checked={policies[p.key]}
                onChange={e => setPolicies(prev => ({ ...prev, [p.key]: e.target.checked }))}
                className="accent-[#2563EB] mt-0.5"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span>{p.icon}</span>
                  <span className="text-sm font-medium text-slate-800">{p.label}</span>
                </div>
                <span className="text-xs text-green-600 font-medium mt-0.5 block">{p.impact}</span>
              </div>
            </label>
          ))}
        </div>
        <div>
          <label className="text-xs text-slate-500 font-medium mb-1 block">Implementation Intensity: <span className="text-slate-800 font-bold">{intensity}%</span></label>
          <input
            type="range" min={10} max={100} value={intensity}
            onChange={e => setIntensity(Number(e.target.value))}
            className="w-full accent-[#2563EB]"
          />
        </div>
      </div>

      {/* Before / After comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Baseline</h3>
          <div className="text-5xl font-extrabold tabular-nums text-[#EF4444]">{BASELINE_AQI}</div>
          <div className="text-sm text-slate-500 mt-1">AQI · Poor</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider mb-2">Simulated Outcome</h3>
          <div className={`text-5xl font-extrabold tabular-nums ${simulatedAQI < 100 ? 'text-[#22C55E]' : simulatedAQI < 200 ? 'text-[#EAB308]' : 'text-[#EF4444]'}`}>
            {simulatedAQI}
          </div>
          <div className="text-sm text-green-600 font-medium mt-1">
            ↓ {BASELINE_AQI - simulatedAQI} AQI reduction ({reductionPct.toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* Overlaid chart */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Baseline vs Simulated AQI — 14-Day</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={35} />
            <Tooltip contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }} />
            <Line dataKey="observed"  name="Baseline AQI"  stroke="#EF4444" strokeWidth={2.5} dot={false} />
            <Line dataKey="simulated" name="Simulated AQI" stroke="#22C55E" strokeWidth={2.5} strokeDasharray="5 4" dot={false} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
