import { Map, AlertTriangle } from 'lucide-react'
import { MOCK_HOTSPOTS } from '../data/mock'
import { getAQIBand } from '../utils/aqi'
import { SeverityBadge } from '../components/ui'
import StationMap from '../components/StationMap'
import { MOCK_STATIONS } from '../data/mock'

export default function Hotspots() {
  return (
    <div className="p-6 flex flex-col gap-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Map className="w-5 h-5 text-[#EF4444]" />
        <div>
          <h1 className="text-base font-semibold text-slate-800">Pollution Hotspots</h1>
          <p className="text-sm text-slate-500">Geographic concentration of high-pollution zones across Delhi NCR.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Map */}
        <div className="xl:col-span-2 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
          <StationMap stations={MOCK_STATIONS} />
        </div>

        {/* Hotspot list */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Critical Zones
          </h2>
          <div className="flex flex-col gap-3">
            {MOCK_HOTSPOTS.map((h, i) => {
              const band = getAQIBand(h.aqi)
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white tabular-nums"
                    style={{ backgroundColor: band.color }}
                  >
                    {h.aqi}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{h.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <SeverityBadge aqi={h.aqi} />
                      <span className="text-xs text-slate-400">{h.zone}</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-red-500">#{i + 1}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
