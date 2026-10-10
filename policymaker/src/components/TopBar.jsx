import { Bell, User, ChevronDown } from 'lucide-react'
import { getAQIBand } from '../utils/aqi'

const REGIONS = ['Delhi NCR', 'South Delhi', 'North Delhi', 'East Delhi', 'West Delhi', 'Noida', 'Gurgaon', 'Faridabad']

export default function TopBar({ currentPage, region, onRegionChange }) {
  const mockAqi = 187

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 px-6 py-3 bg-[#1E293B] border-b border-[#1E3A5F] shrink-0">
      {/* Page title / breadcrumb */}
      <div className="flex-1 min-w-0">
        <span className="text-xs text-slate-400 uppercase tracking-widest block">Ministry of Environment</span>
        <h1 className="text-white font-semibold text-sm truncate">{currentPage}</h1>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 bg-green-900/30 border border-green-800/50 rounded-full px-3 py-1">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot" />
        <span className="text-green-400 text-xs font-medium">Live</span>
      </div>

      {/* Region selector */}
      <div className="relative">
        <select
          value={region}
          onChange={e => onRegionChange(e.target.value)}
          className="appearance-none bg-[#0F172A] border border-[#1E3A5F] text-white text-sm rounded-lg px-3 py-1.5 pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
        >
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
      </div>

      {/* Notifications */}
      <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
      </button>

      {/* User */}
      <div className="flex items-center gap-2 cursor-pointer group">
        <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="hidden md:block text-right">
          <div className="text-white text-xs font-medium leading-tight">Policymaker</div>
          <div className="text-slate-400 text-xs leading-tight">DPCC</div>
        </div>
      </div>
    </header>
  )
}
