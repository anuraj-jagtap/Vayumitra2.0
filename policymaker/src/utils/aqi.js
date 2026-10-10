// AQI severity bands utility — single source of truth for colors + labels
export const AQI_BANDS = [
  { min: 0,   max: 50,  label: 'Good',        color: '#22C55E', bg: '#F0FDF4', text: '#15803D' },
  { min: 51,  max: 100, label: 'Satisfactory', color: '#84CC16', bg: '#F7FEE7', text: '#4D7C0F' },
  { min: 101, max: 200, label: 'Moderate',     color: '#EAB308', bg: '#FEFCE8', text: '#A16207' },
  { min: 201, max: 300, label: 'Poor',         color: '#F97316', bg: '#FFF7ED', text: '#C2410C' },
  { min: 301, max: 400, label: 'Very Poor',    color: '#EF4444', bg: '#FEF2F2', text: '#B91C1C' },
  { min: 401, max: 999, label: 'Severe',       color: '#7F1D1D', bg: '#FFF1F2', text: '#7F1D1D' },
]

export function getAQIBand(aqi) {
  return AQI_BANDS.find(b => aqi >= b.min && aqi <= b.max) || AQI_BANDS[AQI_BANDS.length - 1]
}

export function formatNumber(n, decimals = 0) {
  if (n == null || isNaN(n)) return '—'
  return n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
