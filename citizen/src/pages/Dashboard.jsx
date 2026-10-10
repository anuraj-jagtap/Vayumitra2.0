import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { MapPin, Clock, Calendar, TrendingUp, AlertTriangle, CloudRain, Wind, Activity, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getAqiBand } from '../utils/aqiBand';
import { fetchApi } from '../api/client';
import { ADVICE } from '../data/advice';

// Fix leafet marker icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 12);
  }, [center, map]);
  return null;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [nearestStation, setNearestStation] = useState(null);
  const [stations, setStations] = useState([]);
  const [forecast, setForecast] = useState(null);
  
  const [profile, setProfile] = useState(() => localStorage.getItem('vayu_profile') || 'general');
  const [locationDenied, setLocationDenied] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Delhi'); // Default if denied

  useEffect(() => {
    localStorage.setItem('vayu_profile', profile);
  }, [profile]);

  const loadData = async (lat = 28.6139, lng = 77.2090) => {
    setLoading(true);
    setError(null);
    try {
      const [stationRes, stationsRes, forecastRes] = await Promise.all([
        fetchApi(`/nearest-station?lat=${lat}&lng=${lng}`),
        fetchApi('/stations'),
        fetchApi('/forecast')
      ]);
      setNearestStation(stationRes);
      setStations(stationsRes);
      setForecast(forecastRes);
    } catch (err) {
      console.error(err);
      setError('Failed to load air quality data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          loadData(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("Geolocation denied or failed", error);
          setLocationDenied(true);
          loadData(); // Load default (Delhi)
        },
        { timeout: 5000 }
      );
    } else {
      setLocationDenied(true);
      loadData();
    }
  }, []);

  const handleCitySelect = (e) => {
    setSelectedCity(e.target.value);
    // In a real app we'd fetch coords for the city. For now just reload data.
    loadData();
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-brand-600">
        <RefreshCw className="w-8 h-8 animate-spin mb-4" />
        <p className="font-medium text-gray-500">Loading your air quality data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-red-500">
        <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
        <p className="font-bold text-lg mb-2">Oops!</p>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button onClick={() => loadData()} className="px-6 py-2 bg-brand-600 text-white rounded-xl font-medium">Try Again</button>
      </div>
    );
  }

  if (!nearestStation || !forecast) return null;

  const band = getAqiBand(nearestStation.aqi);
  const advice = ADVICE[band.label][profile];
  
  // Calculate if data is stale (> 3 hours old)
  const isStale = (new Date() - new Date(nearestStation.updated_at)) > 3 * 60 * 60 * 1000;
  
  const mapCenter = [
    stations.find(s => s.station_id === nearestStation.station_id)?.lat || 28.6139,
    stations.find(s => s.station_id === nearestStation.station_id)?.lng || 77.2090
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-brand-700">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Air Quality Dashboard</h1>
            <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {selectedCity}
            </p>
          </div>
        </div>
        
        {locationDenied ? (
          <select 
            value={selectedCity}
            onChange={handleCitySelect}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="Delhi">Delhi, Delhi</option>
            <option value="Mumbai">Mumbai, Maharashtra</option>
            <option value="Bangalore">Bangalore, Karnataka</option>
          </select>
        ) : (
          <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-500" /> Current Location
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: AQI Card */}
        <div className="xl:col-span-1 bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-gray-800 font-bold text-lg mb-1">
                <MapPin className={`w-5 h-5 ${band.text}`} />
                {nearestStation.name}
              </div>
              <div className="text-xs text-gray-400 flex flex-col gap-1 mt-2">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Updated: {new Date(nearestStation.updated_at).toLocaleString()}</span>
                {isStale && <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded flex items-center gap-1 w-max"><AlertCircle className="w-3 h-3"/> Outdated</span>}
                {nearestStation.distance_km > 5 && (
                  <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1 w-max mt-1"><Info className="w-3 h-3"/> Nearest monitor is {nearestStation.distance_km} km away</span>
                )}
              </div>
            </div>
            <div className={`${band.color} text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm`}>
              {band.label}
            </div>
          </div>

          <div className={`relative bg-white border-2 ${band.border} rounded-3xl p-8 flex flex-col justify-center items-center text-center flex-1 min-h-[250px]`}>
            <div className={`text-7xl font-black ${band.text} mb-2 tracking-tighter`}>{nearestStation.aqi}</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">CURRENT AQI</div>
            
            <div className="grid grid-cols-3 w-full gap-2 border-t border-gray-100 pt-6">
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">Main</div>
                <div className="font-bold text-gray-800">{nearestStation.main_pollutant}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">PM2.5</div>
                <div className="font-bold text-gray-800">{nearestStation.pm2_5}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">PM10</div>
                <div className="font-bold text-gray-800">{nearestStation.pm10}</div>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-center text-gray-400 mt-4">Source: Nearest station (estimated for your ward)</div>
        </div>

        {/* Right Column: Health Advice & Map */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${band.text}`} /> Health Advice
              </h3>
              <select 
                value={profile} 
                onChange={(e) => setProfile(e.target.value)}
                className="text-sm bg-gray-50 border-none rounded-lg px-3 py-1.5 font-medium focus:ring-2 focus:ring-brand-500"
              >
                <option value="general">General</option>
                <option value="child">Child</option>
                <option value="elderly">Elderly</option>
                <option value="asthma">Asthma/Heart Condition</option>
                <option value="worker">Outdoor Worker</option>
              </select>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className={`${band.bgLight} rounded-xl p-4 border border-white/50`}>
                <div className={`text-xs font-bold uppercase ${band.text} mb-1 opacity-80`}>Mask</div>
                <div className="text-sm font-medium text-gray-800">{advice.mask}</div>
              </div>
              <div className={`${band.bgLight} rounded-xl p-4 border border-white/50`}>
                <div className={`text-xs font-bold uppercase ${band.text} mb-1 opacity-80`}>Outdoor Activity</div>
                <div className="text-sm font-medium text-gray-800">{advice.outdoor}</div>
              </div>
              <div className={`${band.bgLight} rounded-xl p-4 border border-white/50`}>
                <div className={`text-xs font-bold uppercase ${band.text} mb-1 opacity-80`}>Ventilation</div>
                <div className="text-sm font-medium text-gray-800">{advice.ventilation}</div>
              </div>
              <div className={`${band.bgLight} rounded-xl p-4 border border-white/50`}>
                <div className={`text-xs font-bold uppercase ${band.text} mb-1 opacity-80`}>Children</div>
                <div className="text-sm font-medium text-gray-800">{advice.children}</div>
              </div>
            </div>
            <div className="text-right mt-3 text-[10px] text-gray-400">Sources: CPCB, WHO</div>
          </div>

          <div className="bg-white rounded-3xl p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex-1 min-h-[300px] overflow-hidden relative z-0">
             <MapContainer center={mapCenter} zoom={12} className="w-full h-full rounded-[20px]" zoomControl={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              <MapUpdater center={mapCenter} />
              {stations.map(station => (
                <Marker key={station.station_id} position={[station.lat, station.lng]}>
                  <Popup>
                    <div className="text-center p-1">
                      <div className="font-bold text-sm mb-1">{station.name}</div>
                      <div className={`inline-block px-2 py-1 rounded text-white text-xs font-bold ${getAqiBand(station.aqi).color}`}>
                        AQI: {station.aqi} ({station.band})
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Bottom Chart */}
      <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <h2 className="text-xl font-bold text-brand-700 flex items-center gap-2">
            <Clock className="w-5 h-5" /> Best Time to Go Outdoors
          </h2>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mr-4">
              <div className="w-2 h-2 rounded-full bg-green-500"></div> Safe
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <div className="w-2 h-2 rounded-full bg-red-400"></div> Unsafe
            </div>
          </div>
        </div>

        <div className="h-64 w-full mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={forecast.hourly} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <RechartsTooltip 
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white/90 backdrop-blur-md border border-gray-100 p-3 rounded-xl shadow-xl shadow-black/5">
                        <div className="font-bold text-sm mb-1">{payload[0].payload.time}</div>
                        <div className="text-xs text-gray-600 mb-0.5">AQI: {payload[0].value}</div>
                        {payload[0].value > 200 ? (
                           <div className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Stay indoors</div>
                        ) : (
                           <div className="text-xs font-bold text-green-500 flex items-center gap-1"><Wind className="w-3 h-3" /> Safe for outdoors</div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="aqi" radius={[4, 4, 4, 4]} barSize={40}>
                {forecast.hourly.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.aqi > 200 ? '#f87171' : '#4ade80'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50/50 border border-green-100 rounded-xl p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-green-800 mb-3">
              <Wind className="w-4 h-4" /> Best Hours
            </div>
            <div className="flex gap-2">
              {forecast.best_hours.map(time => (
                <div key={time} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                  {time}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-800 mb-3">
              <CloudRain className="w-4 h-4" /> Weather Conditions
            </div>
            <div className="text-xs text-blue-800/80 leading-relaxed">
              {forecast.weather}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
