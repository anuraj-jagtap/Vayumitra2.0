import { useState, useEffect } from 'react'
import client from './client'

function useFetch(url, params = {}, deps = []) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    client.get(url, { params })
      .then(res => { if (!cancelled) setData(res.data) })
      .catch(err => { if (!cancelled) setError(err?.response?.data || err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}

// Stations list  →  GET /api/v1/stations/
export function useStations(params = {}) {
  return useFetch('/api/v1/stations/', params, [JSON.stringify(params)])
}

// Current AQI  →  GET /api/v1/aqi/current/
export function useCurrentAQI(params = {}) {
  return useFetch('/api/v1/aqi/current/', params, [JSON.stringify(params)])
}

// Hourly forecast  →  GET /api/v1/forecasts/hourly/
export function useHourlyForecast(params = {}) {
  return useFetch('/api/v1/forecasts/hourly/', params, [JSON.stringify(params)])
}

// Daily forecast  →  GET /api/v1/forecasts/daily/
export function useDailyForecast(params = {}) {
  return useFetch('/api/v1/forecasts/daily/', params, [JSON.stringify(params)])
}

// Historical Trends  →  GET /api/v1/policymaker/trends/  (requires Policymaker JWT)
export function useTrends(params = {}) {
  const enabled = !!(params.start_date && params.end_date)
  const { data, loading, error } = useFetch(
    enabled ? '/api/v1/policymaker/trends/' : null,
    params,
    [JSON.stringify(params)]
  )
  return { data, loading: enabled ? loading : false, error }
}
