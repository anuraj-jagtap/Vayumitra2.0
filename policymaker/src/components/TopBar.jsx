import { useState, useRef, useEffect } from 'react'
import { Bell, User, ChevronDown, LogOut, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { REGIONS } from '../utils/regions'

export default function TopBar({ currentPage, region, onRegionChange }) {
  const { user, logout } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const menuRef = useRef(null)
  const notifRef = useRef(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    window.location.href = 'http://localhost:5173/'
  }

  const displayName = user
    ? (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username)
    : 'Policymaker'

  const deptName = user?.department || user?.organization || 'DPCC Central Admin'

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 px-6 py-3 bg-[#1E293B] border-b border-[#1E3A5F] shrink-0">
      {/* Page title / breadcrumb */}
      <div className="flex-1 min-w-0">
        <span className="text-xs text-slate-400 uppercase tracking-widest block">Ministry of Environment & Climate</span>
        <h1 className="text-white font-semibold text-sm truncate">{currentPage}</h1>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 bg-green-900/30 border border-green-800/50 rounded-full px-3 py-1">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot" />
        <span className="text-green-400 text-xs font-medium">Live Telemetry</span>
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
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setNotifOpen(prev => !prev)}
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none"
          title="System Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </button>

        {notifOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-[#0F172A] border border-[#1E3A5F] rounded-xl shadow-xl py-2 z-50 text-xs text-slate-200">
            <div className="px-4 py-2 border-b border-slate-800 font-semibold text-white flex items-center justify-between">
              <span>Notifications & Alerts</span>
              <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono">Live</span>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-800">
              <div className="p-3 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-1.5 text-red-400 font-medium mb-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>North Campus AQI Breach (164)</span>
                </div>
                <p className="text-slate-400 text-[11px]">PM2.5 spike detected in North Delhi. Advisory recommended.</p>
                <span className="text-[10px] text-slate-500 mt-1 block">15m ago</span>
              </div>
              <div className="p-3 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-1.5 text-amber-400 font-medium mb-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Sector-1 Noida Advisory (158)</span>
                </div>
                <p className="text-slate-400 text-[11px]">Rising ozone and PM2.5 concentrations under low surface winds.</p>
                <span className="text-[10px] text-slate-500 mt-1 block">42m ago</span>
              </div>
              <div className="p-3 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-1.5 text-green-400 font-medium mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>20 CPCB Stations Reporting</span>
                </div>
                <p className="text-slate-400 text-[11px]">Real-time ingestion pipeline active across Delhi NCR.</p>
                <span className="text-[10px] text-slate-500 mt-1 block">Live stream</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User profile with dropdown */}
      <div className="relative" ref={menuRef}>
        <div
          onClick={() => setUserMenuOpen(prev => !prev)}
          className="flex items-center gap-2 cursor-pointer group hover:opacity-90 select-none"
        >
          <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center font-bold text-white text-xs shadow-sm">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block text-right">
            <div className="text-white text-xs font-medium leading-tight">{displayName}</div>
            <div className="text-slate-400 text-xs leading-tight truncate max-w-[120px]">{deptName}</div>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors" />
        </div>

        {userMenuOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-[#0F172A] border border-[#1E3A5F] rounded-xl shadow-xl py-2 z-50 text-xs text-slate-300">
            <div className="px-4 py-2 border-b border-slate-800">
              <div className="font-semibold text-white text-sm">{displayName}</div>
              <div className="text-slate-400 truncate">{user?.email || 'admin@dpcc.delhi.gov.in'}</div>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-900/40 text-blue-400 border border-blue-800/40">
                {user?.role || 'POLICYMAKER'}
              </span>
            </div>
            <div className="px-2 pt-1">
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
