import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import {
  MapPin, Clock, Calendar, TrendingUp, AlertTriangle, CloudRain,
  Wind, Activity, Info, AlertCircle, RefreshCw, CheckCircle2, Search
} from 'lucide-react';
import { Marker, Popup } from 'react-leaflet';
import BaseMap from '../components/BaseMap';
import { getAqiBand } from '../utils/aqiBand';
import { fetchApi } from '../api/client';
import { ADVICE } from '../data/advice';
import { REGION_CONFIG } from '../config/region';

export default function Dashboard({ sourceLabel = "Nearest station" }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [nearestStation, setNearestStation] = useState(null);
  const [stations, setStations] = useState([]);
  const [forecast, setForecast] = useState(null);

  const [profile, setProfile] = useState(() => localStorage.getItem('vayu_profile') || 'general');
  const [outOfBounds, setOutOfBounds] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('vayu_profile', profile);
  }, [profile]);

  const loadData = async (lat = 28.6469, lng = 77.3152, stationIdOverride = null) => {
    setLoading(true);
    setError(null);
    try {
      const [stationRes, stationsRes, forecastRes] = await Promise.all([
        stationIdOverride
          ? fetchApi(`/stations/${stationIdOverride}`)
          : fetchApi(`/nearest-station?lat=${lat}&lng=${lng}`),
        fetchApi('/stations'),
        fetchApi(`/forecast?station_id=${stationIdOverride || 'DL_ANANDVIHAR'}`)
      ]);

      setNearestStation(stationRes);
      setStations(Array.isArray(stationsRes) ? stationsRes : []);
      setForecast(forecastRes);
      if (stationRes.station_id) {
        setSelectedStationId(stationRes.station_id);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load Delhi air quality monitors. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (!REGION_CONFIG.isWithinBounds(latitude, longitude)) {
            setOutOfBounds(true);
            loadData(28.6469, 77.3152); // Default to Anand Vihar
          } else {
            setOutOfBounds(false);
            loadData(latitude, longitude);
          }
        },
        () => {
          setOutOfBounds(false);
          loadData(28.6469, 77.3152);
        },
        { timeout: 6000 }
      );
    } else {
      loadData(28.6469, 77.3152);
    }
  }, []);

  const handleStationSelect = (e) => {
    const stId = e.target.value;
    setSelectedStationId(stId);
    const chosen = stations.find(s => s.station_id === stId);
    if (chosen) {
      loadData(chosen.lat, chosen.lng, stId);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-brand-600">
        <RefreshCw className="w-8 h-8 animate-spin mb-4" />
        <p className="font-medium text-gray-500">Loading Delhi air quality monitoring feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-red-500">
        <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
        <p className="font-bold text-lg mb-2">Unable to connect</p>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button onClick={() => loadData()} className="px-6 py-2 bg-brand-600 text-white rounded-xl font-medium">Retry</button>
      </div>
    );
  }

  if (!nearestStation || !forecast) return null;

  const band = getAqiBand(nearestStation.aqi);
  const advice = ADVICE[band.label] ? ADVICE[band.label][profile] : ADVICE['Moderate'][profile];
  
  // Calculate if data is stale (> 3 hours old)
  const isStale = (new Date() - new Date(nearestStation.updated_at)) > 3 * 60 * 60 * 1000;
  const isDemo = nearestStation.data_source === 'demo' || forecast.data_source === 'demo';

  const mapCenter = [nearestStation.lat || 28.6469, nearestStation.lng || 77.3152];

  // Best hours chips formatted
  const bestHoursText = Array.isArray(forecast.best_hours)
    ? forecast.best_hours.map(bh => typeof bh === 'string' ? bh : `${bh.start} – ${bh.end}`)
    : ["01:00 AM", "02:00 AM", "03:00 AM"];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* ── Delhi Out-of-Bounds Notification Banner ─────────────────────────── */}
      {outOfBounds && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm font-medium text-amber-900">
              VayuMitra currently covers <strong>Delhi NCR</strong> only. Showing nearest available Delhi monitoring station.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg shrink-0">
            Delhi Coverage
          </span>
        </div>
      )}

      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-brand-700">
          <div className="w-10 h-10 bg-brand-100 rounded-2xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Delhi Air Quality Dashboard</h1>
            <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              <span>{nearestStation.name}, Delhi</span>
              {isDemo ? (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  Demo data
                </span>
              ) : (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Delhi Stations Searchable Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedStationId}
              onChange={handleStationSelect}
              className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {stations.map(st => (
                <option key={st.station_id} value={st.station_id}>
                  {st.name} (AQI {st.aqi})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 3-Column Top Grid: AQI Card (Left) vs Health Advice & Map (Right) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: AQI Card */}
        <div className="xl:col-span-1 bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
                  <MapPin className={`w-5 h-5 ${band.text}`} />
                  {nearestStation.name}
                </div>
                <div className="text-xs text-gray-400 flex flex-col gap-1 mt-1.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Updated: {new Date(nearestStation.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isStale && (
                    <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded text-[11px] flex items-center gap-1 w-max mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Outdated
                    </span>
                  )}
                  {nearestStation.distance_km > 5 && (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] flex items-center gap-1 w-max mt-1">
                      <Info className="w-3.5 h-3.5" /> Nearest monitor is {nearestStation.distance_km} km from you
                    </span>
                  )}
                </div>
              </div>
              <div className={`${band.color} text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm`}>
                {band.label}
              </div>
            </div>

            <div className={`relative bg-gradient-to-b from-white to-gray-50/50 border-2 ${band.border} rounded-3xl p-8 flex flex-col justify-center items-center text-center my-4`}>
              <div className={`text-7xl font-black ${band.text} mb-1 tracking-tighter`}>
                {nearestStation.aqi}
              </div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">
                CPCB AIR QUALITY INDEX
              </div>

              <div className="grid grid-cols-3 w-full gap-2 border-t border-gray-100 pt-5">
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Main</div>
                  <div className="font-bold text-gray-800 text-sm mt-0.5">{nearestStation.main_pollutant || 'PM2.5'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">PM2.5</div>
                  <div className="font-bold text-gray-800 text-sm mt-0.5">{Math.round(nearestStation.pm2_5 || 0)} <span className="text-[10px] text-gray-400 font-normal">µg/m³</span></div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">PM10</div>
                  <div className="font-bold text-gray-800 text-sm mt-0.5">{Math.round(nearestStation.pm10 || 0)} <span className="text-[10px] text-gray-400 font-normal">µg/m³</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-center text-gray-400 pt-2 border-t border-gray-50">
            Source: <span className="font-medium text-gray-600">{sourceLabel}</span>
          </div>
        </div>

        {/* Right Column: Health Advice & Delhi Station Map */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Health Advice Lookup */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${band.text}`} /> Health Advisory &amp; Action Plan
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">Profile:</span>
                <select
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                  className="text-xs bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 font-semibold text-gray-700 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="general">General Citizen</option>
                  <option value="child">Child / Student</option>
                  <option value="elderly">Elderly Citizen</option>
                  <option value="asthma">Asthma / Heart Condition</option>
                  <option value="worker">Outdoor Worker</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3.5">
              <div className={`${band.bgLight} rounded-2xl p-4 border border-white/60 shadow-sm`}>
                <div className={`text-[11px] font-bold uppercase tracking-wider ${band.text} mb-1 opacity-90`}>Mask Requirement</div>
                <div className="text-xs font-semibold text-gray-800">{advice.mask}</div>
              </div>
              <div className={`${band.bgLight} rounded-2xl p-4 border border-white/60 shadow-sm`}>
                <div className={`text-[11px] font-bold uppercase tracking-wider ${band.text} mb-1 opacity-90`}>Outdoor Exercise</div>
                <div className="text-xs font-semibold text-gray-800">{advice.outdoor}</div>
              </div>
              <div className={`${band.bgLight} rounded-2xl p-4 border border-white/60 shadow-sm`}>
                <div className={`text-[11px] font-bold uppercase tracking-wider ${band.text} mb-1 opacity-90`}>Indoor Ventilation</div>
                <div className="text-xs font-semibold text-gray-800">{advice.ventilation}</div>
              </div>
              <div className={`${band.bgLight} rounded-2xl p-4 border border-white/60 shadow-sm`}>
                <div className={`text-[11px] font-bold uppercase tracking-wider ${band.text} mb-1 opacity-90`}>Children Protection</div>
                <div className="text-xs font-semibold text-gray-800">{advice.children}</div>
              </div>
            </div>
            <div className="text-right mt-3 text-[10px] text-gray-400">Sources: CPCB, WHO</div>
          </div>

          {/* Delhi Station Map via shared BaseMap */}
          <div className="bg-white rounded-3xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex-1 min-h-[300px] overflow-hidden relative">
            <BaseMap center={mapCenter} zoom={11}>
              {stations.map(st => (
                <Marker
                  key={st.station_id}
                  position={[st.lat, st.lng]}
                  eventHandlers={{
                    click: () => {
                      loadData(st.lat, st.lng, st.station_id);
                    }
                  }}
                >
                  <Popup>
                    <div className="p-1 text-center">
                      <div className="font-bold text-sm text-gray-900">{st.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Delhi Station</div>
                      <div className={`inline-block mt-2 px-2.5 py-1 rounded-lg text-white text-xs font-bold ${getAqiBand(st.aqi).color}`}>
                        AQI {st.aqi} • {st.band}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </BaseMap>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Best Time to Go Outdoors (Forecast Bar Chart) ────── */}
      <div className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-600" /> Best Time to Go Outdoors
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Hourly forecast trend powered by physics dispersion model
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Safe (&le; 200)
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Unsafe (&gt; 200)
            </div>
          </div>
        </div>

        <div className="h-60 w-full mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={forecast.hourly} margin={{ top: 15, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <RechartsTooltip
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload;
                    const b = getAqiBand(row.aqi);
                    return (
                      <div className="bg-white border border-gray-100 p-3 rounded-2xl shadow-xl text-xs">
                        <div className="font-bold text-gray-900 text-sm mb-1">{row.time}</div>
                        <div className="font-semibold text-brand-700">AQI: {row.aqi} ({b.label})</div>
                        {row.low && row.high && (
                          <div className="text-[10px] text-gray-400 mt-0.5">Uncertainty range: {row.low} – {row.high}</div>
                        )}
                        <div className="mt-2 font-medium">
                          {row.aqi > 200 ? (
                            <span className="text-red-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Stay indoors</span>
                          ) : (
                            <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Safe for light activity</span>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="aqi" radius={[6, 6, 6, 6]} barSize={36}>
                {forecast.hourly.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.aqi > 200 ? '#ef4444' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
              <Wind className="w-4 h-4 text-emerald-600" /> Recommended Best Hours Today
            </div>
            <div className="flex flex-wrap gap-2">
              {bestHoursText.map((time, idx) => (
                <div key={idx} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold">
                  {time}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4.5">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
              <CloudRain className="w-4 h-4 text-blue-600" /> Live Atmospheric Dispersion
            </div>
            <div className="text-xs text-blue-900 font-medium leading-relaxed">
              {forecast.weather || "Open-Meteo live index: boundary layer dispersion moderate with low inversion."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
