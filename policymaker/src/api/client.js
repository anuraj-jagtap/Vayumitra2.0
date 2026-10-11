import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname ? `http://${window.location.hostname}:8000` : 'http://localhost:8000')

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request
client.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, try refreshing the token once
client.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('No refresh token')
        const { data } = await axios.post(`${BASE_URL}/api/auth/login/refresh/`, { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return client(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        const landingUrl = import.meta.env.VITE_LANDING_URL || 'http://localhost:5173'
        window.location.href = `${landingUrl}/login`
      }
    }
    return Promise.reject(error)
  }
)

export default client
