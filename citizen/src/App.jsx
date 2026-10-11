import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import TopNav from './components/TopNav';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import Act from './pages/Act';
import Drives from './pages/Drives';
import Profile from './pages/Profile';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const landingLoginUrl = (import.meta.env.VITE_LANDING_URL || 'http://localhost:5173') + '/login';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-brand-600 font-medium text-sm animate-pulse flex items-center gap-2">
          <span>Verifying session…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = landingLoginUrl;
    return null;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col">
          <TopNav />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/act" element={<Act />} />
              <Route path="/drives" element={<Drives />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
        </div>
      </ProtectedRoute>
    </BrowserRouter>
  );
}

export default App;

