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

const PAGE_TITLES = {
  '/':          'City Overview',
  '/live':      'Live Air Quality',
  '/hotspots':  'Pollution Hotspots',
  '/forecast':  'Forecast & Warnings',
  '/simulator': 'Policy Simulator',
  '/traffic':   'Traffic & Urban',
  '/reports':   'Reports & Exports',
}

// Route guard — redirects to landing login if not authenticated
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading session…</div>
      </div>
    )
  }

  if (!user) {
    // Redirect to unified landing login
    window.location.href = 'http://localhost:5173/login'
    return null
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
            <Route path="/"          element={<Overview />} />
            <Route path="/live"      element={<LiveAQI />} />
            <Route path="/hotspots"  element={<Hotspots />} />
            <Route path="/forecast"  element={<ForecastWarnings />} />
            <Route path="/simulator" element={<PolicySimulator />} />
            <Route path="/traffic"   element={<TrafficUrban />} />
            <Route path="/reports"   element={<Reports />} />
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
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
