import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TopNav from './components/TopNav';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import Act from './pages/Act';
import Drives from './pages/Drives';
import Profile from './pages/Profile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route
          path="/*"
          element={
            <div className="min-h-screen flex flex-col">
              <TopNav />
              <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/learn" element={<Learn />} />
                  <Route path="/act" element={<Act />} />
                  <Route path="/drives" element={<Drives />} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </main>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
