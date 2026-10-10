// Mock data for all dashboard screens — uses only native Date, no external deps

function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n); return d
}
function fmt(d, type = 'date') {
  if (type === 'date') return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const MOCK_CITY_AQI = 187
export const MOCK_TREND = +12
export const MOCK_UPDATED = '3m ago'

export const MOCK_KPIS = [
  { label: 'Active Sources',   value: 34,  icon: 'Wind',     delta: 2,    deltaLabel: 'new today' },
  { label: 'Active Alerts',    value: 7,   icon: 'AlertTriangle', delta: 3, deltaLabel: 'since yesterday' },
  { label: 'Stations Online',  value: 28,  icon: 'Wifi',     delta: -2,   deltaLabel: 'offline' },
  { label: 'Weekly Avg AQI',   value: 201, icon: 'BarChart2', delta: +18, deltaLabel: 'vs last week' },
]

export const MOCK_HOTSPOTS = [
  { name: 'Anand Vihar',   aqi: 342, zone: 'East Delhi'  },
  { name: 'Rohini',        aqi: 298, zone: 'North Delhi'  },
  { name: 'Jahangirpuri',  aqi: 271, zone: 'North Delhi'  },
  { name: 'Wazirpur',      aqi: 234, zone: 'North Delhi'  },
  { name: 'Punjabi Bagh',  aqi: 218, zone: 'West Delhi'   },
]

export const MOCK_POLLUTANTS = [
  { name: 'PM2.5', value: 98,  max: 120, unit: 'µg/m³', limit: 60  },
  { name: 'PM10',  value: 167, max: 200, unit: 'µg/m³', limit: 100 },
  { name: 'NO₂',   value: 54,  max: 80,  unit: 'ppb',   limit: 40  },
  { name: 'O₃',    value: 41,  max: 100, unit: 'ppb',   limit: 70  },
  { name: 'SO₂',   value: 22,  max: 60,  unit: 'ppb',   limit: 30  },
  { name: 'CO',    value: 1.8, max: 4,   unit: 'ppm',   limit: 2   },
]

export const MOCK_WEEKLY_TREND = Array.from({ length: 7 }, (_, i) => ({
  date: fmt(daysAgo(6 - i)),
  aqi: [156, 178, 201, 234, 187, 198, 187][i],
  forecast: [null, null, null, null, null, 210, 225][i],
}))

export const MOCK_ALERTS = [
  { severity: 'critical', title: 'Severe AQI at Anand Vihar', description: 'AQI has crossed 340. Immediate advisory required for school closures in East Delhi zone.', zone: 'East Delhi', timestamp: '9m ago' },
  { severity: 'high',     title: 'PM2.5 Spike — Rohini',      description: 'PM2.5 recorded at 198 µg/m³, 3× above safe limit. Industrial contribution suspected.', zone: 'North Delhi', timestamp: '24m ago' },
  { severity: 'medium',   title: 'No2 Rising — Dwarka',       description: 'NO₂ levels trending upward for 4 consecutive hours. Monitor traffic patterns.', zone: 'West Delhi', timestamp: '1h ago' },
  { severity: 'low',      title: 'Forecast Warning: Thursday', description: 'Model predicts Severe AQI band 09:00–18:00 on Thursday across North and East zones.', zone: 'Multiple', timestamp: '2h ago' },
]

export const MOCK_STATIONS = [
  { station_id: 'S1', name: 'Anand Vihar',   lat: 28.6508, lon: 77.3152, aqi: 342, pm25: 198, pm10: 312 },
  { station_id: 'S2', name: 'Rohini',         lat: 28.7041, lon: 77.1025, aqi: 298, pm25: 167, pm10: 254 },
  { station_id: 'S3', name: 'ITO',            lat: 28.6274, lon: 77.2405, aqi: 178, pm25: 92,  pm10: 154 },
  { station_id: 'S4', name: 'Lodhi Road',     lat: 28.5918, lon: 77.2273, aqi: 134, pm25: 64,  pm10: 118 },
  { station_id: 'S5', name: 'Punjabi Bagh',   lat: 28.6726, lon: 77.1314, aqi: 218, pm25: 121, pm10: 187 },
  { station_id: 'S6', name: 'Dwarka',         lat: 28.5921, lon: 77.0459, aqi: 156, pm25: 78,  pm10: 134 },
  { station_id: 'S7', name: 'Jahangirpuri',   lat: 28.7257, lon: 77.1637, aqi: 271, pm25: 154, pm10: 228 },
  { station_id: 'S8', name: 'Okhla',          lat: 28.5376, lon: 77.2716, aqi: 193, pm25: 108, pm10: 167 },
]

function makeHeatmapData() {
  const rows = []
  const now = new Date()
  for (let d = 2; d >= 0; d--) {
    const day = new Date(now); day.setDate(day.getDate() + d)
    const hours = Array.from({ length: 24 }, (_, h) => {
      const base = d === 0 ? 200 : d === 1 ? 180 : 160
      const aqi = Math.max(50, Math.round(base + Math.sin(h / 4) * 60 + (Math.random() - 0.5) * 30))
      return { hour: h, aqi, pm25: Math.round(aqi * 0.5), pm10: Math.round(aqi * 0.85) }
    })
    rows.push({ date: day.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }), hours })
  }
  return rows
}
export const MOCK_HEATMAP = makeHeatmapData()

export const MOCK_HEALTH = [
  { label: 'Respiratory Cases', value: 2847, delta: 14, severity: 'high', icon: 'Lungs', note: 'High respiratory risk — advise sensitive groups to limit outdoor exposure' },
  { label: 'Cardiac Events',    value: 312,  delta: 8,  severity: 'high', icon: 'HeartPulse', note: 'Elevated cardiac risk — recommend vulnerable groups avoid outdoor exertion' },
  { label: 'Asthma ER Visits',  value: 184,  delta: 22, severity: 'severe', icon: 'Activity', note: 'Severe asthma spike — coordinate with hospitals for surge preparedness' },
  { label: 'Economic Loss',     value: '₹4.2Cr', delta: 9, severity: 'medium', icon: 'IndianRupee', note: 'Productivity impact from reduced outdoor activity and healthcare burden' },
]

export const MOCK_FORECAST_ADVISORIES = [
  { zone: 'East Delhi (Zone E)', window: 'Thu 09:00 – 18:00', aqi: 412, band: 'Severe', action: 'School closure advisory recommended' },
  { zone: 'North Delhi (Zone B)', window: 'Thu 12:00 – 22:00', aqi: 367, band: 'Severe', action: 'Industrial shutdown order pending' },
  { zone: 'West Delhi (Zone C)', window: 'Fri 06:00 – 14:00', aqi: 298, band: 'Very Poor', action: 'Odd-even traffic restriction recommended' },
]

export const MOCK_HISTORY_TREND = Array.from({ length: 14 }, (_, i) => ({
  date: fmt(daysAgo(13 - i)),
  observed: [178, 201, 234, 198, 187, 210, 245, 231, 198, 167, 178, 190, 201, 187][i],
  predicted: [182, 207, 229, 203, 190, 214, 241, 235, 202, 171, 182, 195, 204, 191][i],
  respiratory: [2100, 2340, 2700, 2450, 2290, 2600, 2980, 2870, 2500, 2150, 2280, 2410, 2610, 2450][i],
}))
