import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import {
  Wind, AlertTriangle, Wifi, BarChart2, FileText, Bell, FlaskConical,
  Download, TrendingUp, ArrowRight, Filter, SortAsc
} from 'lucide-react'
import { AQIHero, StatCard, PollutantBar, AlertCard, SeverityBadge } from '../components/ui'
import {
  MOCK_CITY_AQI, MOCK_TREND, MOCK_UPDATED, MOCK_KPIS, MOCK_HOTSPOTS,
  MOCK_POLLUTANTS, MOCK_WEEKLY_TREND, MOCK_ALERTS
} from '../data/mock'
import { getAQIBand } from '../utils/aqi'

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

export default function Overview() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-screen-2xl mx-auto">
      {/* Hero */}
      <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">City AQI · Delhi NCR</div>
          <AQIHero aqi={MOCK_CITY_AQI} trend={MOCK_TREND} updatedAt={MOCK_UPDATED} city="Delhi NCR" />
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
        {MOCK_KPIS.map((k, i) => {
          const Icon = ICON_MAP[k.icon] || Wind
          return (
            <StatCard
              key={i}
              icon={Icon}
              label={k.label}
              value={k.value}
              delta={k.delta}
              deltaLabel={k.deltaLabel}
            />
          )
        })}
      </div>

      {/* Two-column: Rankings + Pollutants */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Pollution Rankings */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">🔴 Top Pollution Hotspots</h2>
          <div className="flex flex-col gap-3">
            {MOCK_HOTSPOTS.map((h, i) => {
              const band = getAQIBand(h.aqi)
              const maxAqi = MOCK_HOTSPOTS[0].aqi
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
                        style={{ width: `${(h.aqi / maxAqi) * 100}%`, backgroundColor: band.color }}
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
          <h2 className="text-sm font-semibold text-slate-800">🚨 Recent Alerts</h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors">
              <Filter className="w-3 h-3" /> Filter
            </button>
            <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors">
              <SortAsc className="w-3 h-3" /> Sort
            </button>
            <button className="flex items-center gap-1 text-xs text-[#2563EB] hover:underline ml-2">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {MOCK_ALERTS.map((a, i) => <AlertCard key={i} {...a} />)}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
        <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {QUICK_ACTIONS.map((a, i) => {
            const Icon = a.icon
            return (
              <button
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md text-sm font-medium text-slate-700 transition-all duration-150"
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

// Need ReferenceArea
import { ReferenceArea } from 'recharts'
