import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Filter, Search, ArrowUpDown } from 'lucide-react'
import StationMap from '../components/StationMap'
import { SeverityBadge } from '../components/ui'
import { MOCK_STATIONS, MOCK_HISTORY_TREND } from '../data/mock'
import { getAQIBand } from '../utils/aqi'

const POLLUTANTS = ['AQI', 'PM2.5', 'PM10', 'NO₂', 'O₃']

export default function LiveAQI() {
  const [selected, setSelected] = useState(MOCK_STATIONS[0])
  const [search, setSearch] = useState('')
  const [filterPollutant, setFilterPollutant] = useState('AQI')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const filtered = MOCK_STATIONS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full overflow-hidden">
      {/* Filter sidebar */}
      <aside className={`shrink-0 bg-white border-r border-slate-100 transition-all duration-300 overflow-y-auto ${sidebarOpen ? 'w-64' : 'w-0'}`}>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Filters</span>
            <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs">✕</button>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium block mb-1">Pollutant</label>
            <div className="flex flex-col gap-1">
              {POLLUTANTS.map(p => (
                <button
                  key={p}
                  onClick={() => setFilterPollutant(p)}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterPollutant === p ? 'bg-[#2563EB] text-white font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium block mb-1">Search Station</label>
            <div className="relative">
              <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Station name…"
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)} className="flex items-center gap-2 text-sm text-[#2563EB] font-medium">
            <Filter className="w-4 h-4" /> Show Filters
          </button>
        )}

        {/* Map */}
        <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-800">Live Station Map</h2>
            <span className="text-xs text-slate-400">{MOCK_STATIONS.length} stations active</span>
          </div>
          <StationMap stations={MOCK_STATIONS} selectedStation={selected} onSelect={setSelected} />
        </div>

        {/* Sensor Table */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Sensor Data Table</h2>
            <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
              <ArrowUpDown className="w-3 h-3" /> Sort
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Station', 'AQI', 'PM2.5', 'PM10', 'Status', 'Last Updated'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const band = getAQIBand(s.aqi)
                  const isSelected = selected?.station_id === s.station_id
                  return (
                    <tr
                      key={s.station_id}
                      onClick={() => setSelected(s)}
                      className={`border-b border-slate-50 cursor-pointer transition-colors ${isSelected ? 'bg-[#DBEAFE]' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-2.5 font-medium text-slate-800">{s.name}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold tabular-nums" style={{ color: band.color }}>{s.aqi}</span>
                          <SeverityBadge aqi={s.aqi} />
                        </div>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-600">{s.pm25}</td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-600">{s.pm10}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Online
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-400">Just now</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Predicted AQI Trend for selected station */}
        {selected && (
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">
              72-Hour Predicted AQI — <span className="text-[#2563EB]">{selected.name}</span>
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={MOCK_HISTORY_TREND.slice(-10)} margin={{ top: 5, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }} />
                <Line dataKey="observed" name="Observed" stroke="#2563EB" strokeWidth={2} dot={false} />
                <Line dataKey="predicted" name="Predicted" stroke="#F97316" strokeWidth={2} strokeDasharray="4 3" dot={false} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
