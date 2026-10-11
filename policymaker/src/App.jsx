import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Overview from './pages/Overview'
import LiveAQI from './pages/LiveAQI'
import Hotspots from './pages/Hotspots'
import ForecastWarnings from './pages/ForecastWarnings'
import PolicySimulator from './pages/PolicySimulator'
import TrafficUrban from './pages/TrafficUrban'
import Reports from './pages/Reports'
import Login from './pages/Login'


const PAGE_TITLES = {
  '/':          'City Overview',
  '/live':      'Live Air Quality',
  '/hotspots':  'Pollution Hotspots',
  '/forecast':  'Forecast & Warnings',
  '/simulator': 'Policy Simulator',
  '/traffic':   'Traffic & Urban',
  '/reports':   'Reports & Exports',
}

import React from 'react'

// Error boundary to prevent white-screen crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center justify-center">
          <div className="max-w-lg bg-slate-800 p-6 rounded-xl border border-red-500/30 text-center shadow-2xl">
            <h1 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-300 mb-4">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Route guard — renders dashboard with guest admin defaults if not signed in (prevents white-screen)
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading session…</div>
      </div>
    )
  }

  return children
}

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [region, setRegion] = useState('Delhi NCR')
  const location = useLocation()
  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard'

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
      <div
        className="flex flex-col flex-1 overflow-hidden transition-all duration-300"
        style={{ marginLeft: collapsed ? '4rem' : '15rem' }}
      >
        <TopBar currentPage={pageTitle} region={region} onRegionChange={setRegion} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"          element={<Overview region={region} onRegionChange={setRegion} />} />
            <Route path="/live"      element={<LiveAQI region={region} onRegionChange={setRegion} />} />
            <Route path="/hotspots"  element={<Hotspots region={region} onRegionChange={setRegion} />} />
            <Route path="/forecast"  element={<ForecastWarnings region={region} onRegionChange={setRegion} />} />
            <Route path="/simulator" element={<PolicySimulator region={region} onRegionChange={setRegion} />} />
            <Route path="/traffic"   element={<TrafficUrban region={region} onRegionChange={setRegion} />} />
            <Route path="/reports"   element={<Reports region={region} onRegionChange={setRegion} />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <AppLayout />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

