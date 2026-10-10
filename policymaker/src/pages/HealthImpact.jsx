import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { MOCK_HEALTH, MOCK_HISTORY_TREND } from '../data/mock'
import { Wind, HeartPulse, Activity, IndianRupee, TrendingUp, TrendingDown } from 'lucide-react'


const ICON_MAP = { Wind, HeartPulse, Activity, IndianRupee }

const SEVERITY_STYLE = {
  severe: { bg: '#FFF1F2', text: '#7F1D1D', label: 'Severe' },
  high:   { bg: '#FEF2F2', text: '#B91C1C', label: 'High'   },
  medium: { bg: '#FFF7ED', text: '#C2410C', label: 'Moderate'},
}

export default function HealthImpact() {
  const [range, setRange] = useState('7')
  const data = MOCK_HISTORY_TREND.slice(-parseInt(range))

  return (
    <div className="p-6 flex flex-col gap-6 max-w-screen-2xl mx-auto">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {MOCK_HEALTH.map((h, i) => {
          const Icon = ICON_MAP[h.icon] || HeartPulse
          const s = SEVERITY_STYLE[h.severity] || SEVERITY_STYLE.medium
          return (
            <div key={i} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-slate-600" />
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.text }}>
                  {s.label}
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold tabular-nums text-slate-900">{h.value}</span>
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${h.delta > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {h.delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {h.delta > 0 ? '+' : ''}{h.delta}%
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{h.label}</p>
              </div>
              <p className="text-xs text-slate-400 border-t border-slate-50 pt-2">{h.note}</p>
            </div>
          )
        })}
      </div>

      {/* Correlation chart */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-800">Health Impact vs AQI — Trend</h2>
          <div className="flex gap-1">
            {['7', '14'].map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${range === r ? 'bg-[#2563EB] text-white' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {r}D
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={40} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={50} />
            <Tooltip contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }} />
            <Line yAxisId="left"  dataKey="observed"    name="AQI"        stroke="#EF4444" strokeWidth={2} dot={false} />
            <Line yAxisId="right" dataKey="respiratory" name="Respiratory" stroke="#8B5CF6" strokeWidth={2} dot={false} strokeDasharray="4 3" />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
