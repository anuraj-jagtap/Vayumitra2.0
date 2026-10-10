import HeatmapGrid from '../components/HeatmapGrid'
import { MOCK_HEATMAP, MOCK_FORECAST_ADVISORIES } from '../data/mock'
import { getAQIBand } from '../utils/aqi'

export default function ForecastWarnings() {
  return (
    <div className="p-6 flex flex-col gap-6 max-w-screen-2xl mx-auto">
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-1">72-Hour AQI Forecast Matrix</h2>
        <p className="text-sm text-slate-500">Latest model run — cells colored by AQI severity band. Hover for full pollutant breakdown.</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
        <HeatmapGrid data={MOCK_HEATMAP} />
      </div>

      {/* Early-warning advisories */}
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-3">⚠️ Early-Warning Advisories</h2>
        <div className="flex flex-col gap-3">
          {MOCK_FORECAST_ADVISORIES.map((a, i) => {
            const band = getAQIBand(a.aqi)
            return (
              <div
                key={i}
                className="flex flex-col md:flex-row md:items-center gap-3 bg-white border border-slate-100 rounded-xl p-4 shadow-sm border-l-4"
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
                    <span className="text-xs tabular-nums font-bold" style={{ color: band.color }}>AQI {a.aqi}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">📅 {a.window}</p>
                </div>
                <div className="shrink-0">
                  <button
                    className="text-xs font-medium px-4 py-2 rounded-lg text-white transition-colors"
                    style={{ backgroundColor: band.color }}
                  >
                    {a.action}
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
