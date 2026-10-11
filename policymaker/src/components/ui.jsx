import { getAQIBand } from '../utils/aqi'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// --- SeverityBadge ---
export function SeverityBadge({ aqi, size = 'sm' }) {
  const band = getAQIBand(aqi)
  const sz = size === 'lg' ? 'px-3 py-1 text-sm font-semibold' : 'px-2 py-0.5 text-xs font-medium'
  return (
    <span
      className={`inline-flex items-center rounded-full ${sz}`}
      style={{ backgroundColor: band.bg, color: band.text, border: `1px solid ${band.color}33` }}
    >
      {band.label}
    </span>
  )
}

// --- AQIHero ---
export function AQIHero({ aqi, trend, updatedAt, city }) {
  const band = getAQIBand(aqi)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-4">
        <span
          className="text-8xl font-extrabold tabular-nums leading-none"
          style={{ color: band.color }}
        >
          {aqi}
        </span>
        <div className="flex flex-col gap-1">
          <SeverityBadge aqi={aqi} size="lg" />
          <span className="text-sm text-slate-500">AQI · {city}</span>
          {updatedAt && <span className="text-xs text-slate-400">Updated {updatedAt}</span>}
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 text-sm mt-1">
          {trend > 0
            ? <TrendingUp className="w-4 h-4 text-red-500" />
            : trend < 0
              ? <TrendingDown className="w-4 h-4 text-green-500" />
              : <Minus className="w-4 h-4 text-slate-400" />}
          <span className={trend > 0 ? 'text-red-500' : trend < 0 ? 'text-green-500' : 'text-slate-400'}>
            {trend > 0 ? '+' : ''}{trend} vs yesterday
          </span>
        </div>
      )}
    </div>
  )
}

// --- StatCard ---
export function StatCard({ icon: Icon, label, value, unit, delta, deltaLabel, loading }) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-8 w-16 mt-1" />
        <div className="skeleton h-3 w-20 mt-1" />
      </div>
    )
  }
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 text-slate-500">
        {Icon && <Icon className="w-4 h-4" />}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-2xl font-bold tabular-nums text-slate-900">{value}</span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>
      {delta !== undefined && (
        <div className={`text-xs flex items-center gap-1 ${typeof delta === 'number' && delta > 0 ? 'text-red-500' : typeof delta === 'number' && delta < 0 ? 'text-green-600' : 'text-slate-500'}`}>
          {typeof delta === 'number'
            ? `${delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} ${Math.abs(delta)}`
            : delta}
          {deltaLabel && ` ${deltaLabel}`}
        </div>
      )}
    </div>
  )
}

// --- PollutantBar ---
export function PollutantBar({ name, value, max, unit, limit }) {
  const pct = Math.min(100, (value / max) * 100)
  const overLimit = limit && value > limit
  const barColor = overLimit ? '#EF4444' : value / max > 0.7 ? '#F97316' : value / max > 0.4 ? '#EAB308' : '#22C55E'
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-slate-500 w-10 shrink-0">{name}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <span className="text-xs tabular-nums font-semibold text-slate-700 w-16 text-right">
        {value} <span className="text-slate-400 font-normal">{unit}</span>
      </span>
      {overLimit && (
        <span className="text-xs text-red-500 font-medium shrink-0">⚠ Over limit</span>
      )}
    </div>
  )
}

// --- AlertCard ---
export function AlertCard({ severity, title, description, zone, timestamp }) {
  const colors = {
    critical: { border: '#7F1D1D', bg: '#FFF1F2', icon: '🚨' },
    high: { border: '#EF4444', bg: '#FEF2F2', icon: '🔴' },
    medium: { border: '#F97316', bg: '#FFF7ED', icon: '🟠' },
    low: { border: '#EAB308', bg: '#FEFCE8', icon: '🟡' },
  }
  const c = colors[severity] || colors.low
  return (
    <div
      className="rounded-xl p-3 border-l-4 flex gap-3 items-start"
      style={{ borderLeftColor: c.border, backgroundColor: c.bg }}
    >
      <span className="text-lg shrink-0 mt-0.5">{c.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-slate-800 truncate">{title}</span>
          <span className="text-xs text-slate-400 shrink-0">{timestamp}</span>
        </div>
        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{description}</p>
        {zone && <span className="text-xs text-slate-500 mt-1 inline-block">📍 {zone}</span>}
      </div>
    </div>
  )
}

// --- SkeletonCard ---
export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-4 ${i === 0 ? 'w-3/4' : i === 1 ? 'w-full' : 'w-1/2'}`} />
      ))}
    </div>
  )
}

// --- EmptyState ---
export function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
      {Icon && <Icon className="w-10 h-10 opacity-30" />}
      <span className="text-sm">{message || 'No data available'}</span>
    </div>
  )
}
