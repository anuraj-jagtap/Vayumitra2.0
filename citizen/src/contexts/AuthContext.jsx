import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const LANDING_URL = import.meta.env.VITE_LANDING_URL || 'http://localhost:5173';

const MOCK_USER = {
  id: 'mock-user-001',
  name: 'Arjun Mehta',
  email: 'arjun.mehta@example.com',
  ward: 'Anand Vihar, East Delhi',
  health_profile: 'general',
  language: 'en',
  points: 240,
  badges: ['First Report', 'Drive Participant', 'Air Guardian'],
  my_drives: ['dr-003', 'dr-005'],
  reports_filed: 4,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('access_token') || localStorage.getItem('vayu_token'));
  const [loading, setLoading] = useState(true);

  // Restore session from URL or localStorage on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlAccess = params.get('access_token');
    const urlRefresh = params.get('refresh_token');

    if (urlAccess && urlRefresh) {
      localStorage.setItem('access_token', urlAccess);
      localStorage.setItem('refresh_token', urlRefresh);
      localStorage.setItem('vayu_token', urlAccess);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const accessToken = localStorage.getItem('access_token') || localStorage.getItem('vayu_token');
    if (!accessToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    setToken(accessToken);

    // Verify session with backend API
    fetch(`${API_BASE}/api/auth/me/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Auth check failed with status ${res.status}`);
        }
        const data = await res.json();
        if (data.role && data.role !== 'CITIZEN') {
          throw new Error('Not a citizen account');
        }

        const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.username || 'Citizen';
        const citizenUser = {
          id: data.id,
          username: data.username,
          name: fullName,
          email: data.email,
          role: data.role,
          ward: 'Anand Vihar, East Delhi',
          health_profile: 'general',
          language: 'en',
          points: 240,
          badges: ['First Report', 'Drive Participant', 'Air Guardian'],
          my_drives: ['dr-003', 'dr-005'],
          reports_filed: 4,
          ...data,
          name: fullName,
        };

        setUser(citizenUser);
        localStorage.setItem('vayu_user', JSON.stringify(citizenUser));
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Session check error:', err.message);
        // Fallback: If mock token was stored for offline testing
        const storedMock = localStorage.getItem('vayu_user');
        if (accessToken === 'mock-token-xyz' && storedMock) {
          try {
            setUser(JSON.parse(storedMock));
            setLoading(false);
            return;
          } catch (_) {
            // ignore
          }
        }
        // Invalidate invalid token
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('vayu_user');
        localStorage.removeItem('vayu_token');
        setUser(null);
        setToken(null);
        setLoading(false);
      });
  }, []);

  const login = useCallback((userData, tokenValue) => {
    const u = userData || MOCK_USER;
    const t = tokenValue || 'mock-token-xyz';
    setUser(u);
    setToken(t);
    localStorage.setItem('vayu_user', JSON.stringify(u));
    localStorage.setItem('access_token', t);
    localStorage.setItem('vayu_token', t);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('vayu_user');
    localStorage.removeItem('vayu_token');
    setUser(null);
    setToken(null);
    window.location.href = `${LANDING_URL}/login`;
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, MOCK_USER }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

