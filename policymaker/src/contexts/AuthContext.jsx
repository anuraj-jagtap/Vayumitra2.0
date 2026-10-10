import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)  // checking stored token on mount

  // On mount: restore session from localStorage or URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlAccess = params.get('access_token')
    const urlRefresh = params.get('refresh_token')

    if (urlAccess && urlRefresh) {
      localStorage.setItem('access_token', urlAccess)
      localStorage.setItem('refresh_token', urlRefresh)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    const token = localStorage.getItem('access_token')
    if (!token) { setLoading(false); return }

    client.get('/api/auth/me/')
      .then(res => {
        if (res.data.role !== 'POLICYMAKER') {
          throw new Error('Not a policymaker')
        }
        setUser(res.data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Auth me error", err);
        document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;"><h1>Auth Error</h1><pre>${err.message}</pre><pre>${JSON.stringify(err.response?.data || 'No response data')}</pre><pre>${err.stack}</pre></div>`;
      })
  }, [])

  const login = useCallback(async (email, password) => {
    // POST email + password to our custom email login endpoint
    const { data } = await client.post('/api/auth/login/', { email, password })
    localStorage.setItem('access_token',  data.access)
    localStorage.setItem('refresh_token', data.refresh)

    // Fetch user profile to get role
    const me = await client.get('/api/auth/me/')
    setUser(me.data)
    return me.data  // caller checks role
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
