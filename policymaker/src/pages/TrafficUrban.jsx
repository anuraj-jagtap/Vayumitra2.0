import { Car } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const TRAFFIC_DATA = [
  { zone: 'Anand Vihar',  vehicles: 1820, aqi: 342 },
  { zone: 'Rohini',       vehicles: 1540, aqi: 298 },
  { zone: 'Punjabi Bagh', vehicles: 1210, aqi: 218 },
  { zone: 'Dwarka',       vehicles: 980,  aqi: 156 },
  { zone: 'Lodhi Road',   vehicles: 720,  aqi: 134 },
]

export default function TrafficUrban() {
  return (
    <div className="p-6 flex flex-col gap-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Car className="w-5 h-5 text-[#2563EB]" />
        <div>
          <h1 className="text-base font-semibold text-slate-800">Traffic & Urban Impact</h1>
          <p className="text-sm text-slate-500">Correlation between vehicle density and AQI across Delhi zones.</p>
        </div>
      </div>
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Vehicle Count vs AQI by Zone</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={TRAFFIC_DATA} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="zone" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={50} label={{ value: 'Vehicles/h', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94A3B8' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }} />
            <Bar yAxisId="left"  dataKey="vehicles" name="Vehicles/h" fill="#2563EB" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="aqi"      name="AQI"        fill="#EF4444" radius={[4, 4, 0, 0]} fillOpacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
