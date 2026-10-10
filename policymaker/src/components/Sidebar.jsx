import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Wind, Map, TrendingUp, FlaskConical,
  Car, FileBarChart, ChevronLeft, ChevronRight, Leaf
} from 'lucide-react'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { to: '/',              icon: LayoutDashboard, label: 'City Overview' },
  { to: '/live',          icon: Wind,            label: 'Live Air Quality' },
  { to: '/hotspots',      icon: Map,             label: 'Pollution Hotspots' },
  { to: '/forecast',      icon: TrendingUp,      label: 'Forecast & Warnings' },
  { to: '/simulator',     icon: FlaskConical,    label: 'Policy Simulator' },
  { to: '/traffic',       icon: Car,             label: 'Traffic & Urban' },
  { to: '/reports',       icon: FileBarChart,    label: 'Reports & Exports' },
]

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={clsx(
        'fixed top-0 left-0 h-full z-30 flex flex-col transition-all duration-300 select-none',
        'bg-[#0F172A] border-r border-[#1E3A5F]',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1E3A5F] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shrink-0">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="text-white font-bold text-sm truncate">VayuMitra 2.0</span>
            <span className="text-slate-400 text-xs truncate">Policy Dashboard</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative group',
                isActive
                  ? 'bg-[#2563EB]/15 text-[#2563EB] border-l-2 border-[#2563EB] ml-2'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md
                            opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center mx-3 my-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
      </button>
    </aside>
  )
}
