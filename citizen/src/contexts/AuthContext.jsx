import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

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
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('vayu_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('vayu_token'));

  const login = (userData, tokenValue) => {
    const u = userData || MOCK_USER;
    const t = tokenValue || 'mock-token-xyz';
    setUser(u);
    setToken(t);
    localStorage.setItem('vayu_user', JSON.stringify(u));
    localStorage.setItem('vayu_token', t);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vayu_user');
    localStorage.removeItem('vayu_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, MOCK_USER }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
