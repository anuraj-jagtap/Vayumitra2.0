import { getAQIBand, AQI_BANDS } from '../utils/aqi'

// HeatmapGrid: rows=dates, cols=hours, cells colored by AQI severity
export default function HeatmapGrid({ data }) {
  // data: array of { date, hours: [{hour, aqi, pm25, pm10}] }
  const hours = Array.from({ length: 24 }, (_, i) => i)

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
        No forecast data available
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      {/* Legend */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {AQI_BANDS.map(b => (
          <div key={b.label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: b.color }} />
            <span className="text-xs text-slate-500">{b.label}</span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="text-xs border-collapse" style={{ minWidth: '900px' }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white border-b border-r border-slate-100 px-3 py-2 text-left text-slate-500 font-medium whitespace-nowrap w-24">
                Date
              </th>
              {hours.map(h => (
                <th key={h} className="border-b border-slate-100 px-1 py-2 text-center text-slate-400 font-normal whitespace-nowrap">
                  {String(h).padStart(2, '0')}:00
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, ri) => (
              <tr key={ri} className="group">
                <td className="sticky left-0 z-10 bg-white border-b border-r border-slate-100 px-3 py-1.5 font-medium text-slate-700 whitespace-nowrap">
                  {row.date}
                </td>
                {hours.map(h => {
                  const cell = row.hours?.find(c => c.hour === h)
                  const aqi = cell?.aqi
                  const band = aqi != null ? getAQIBand(aqi) : null
                  return (
                    <td key={h} className="border-b border-slate-50 p-0 relative">
                      <div
                        className="w-full h-8 flex items-center justify-center cursor-default transition-transform hover:scale-110 hover:z-20 relative"
                        style={{ backgroundColor: band ? `${band.color}CC` : '#F1F5F9' }}
                        title={aqi != null
                          ? `${row.date} ${String(h).padStart(2,'0')}:00 — AQI ${aqi} (${band?.label}) | PM2.5: ${cell?.pm25 ?? '—'} | PM10: ${cell?.pm10 ?? '—'}`
                          : 'No data'}
                      >
                        {aqi != null && (
                          <span className="text-white font-bold text-[10px] tabular-nums drop-shadow-sm">
                            {aqi}
                          </span>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
