import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { MapPin, Clock, Calendar, TrendingUp, AlertTriangle, CloudRain, Wind, Activity } from 'lucide-react';

const forecastData = [
  { time: 'Now', aqi: 421, type: 'current' },
  { time: '7 PM', aqi: 425, type: 'current' },
  { time: '8 PM', aqi: 380, type: 'predicted' },
  { time: '9 PM', aqi: 350, type: 'predicted' },
  { time: '10 PM', aqi: 320, type: 'predicted' },
  { time: '11 PM', aqi: 280, type: 'predicted' },
  { time: '0 AM', aqi: 260, type: 'predicted' },
  { time: '1 AM', aqi: 240, type: 'predicted' },
  { time: '2 AM', aqi: 200, type: 'predicted' },
  { time: '3 AM', aqi: 180, type: 'predicted' },
  { time: '4 AM', aqi: 185, type: 'predicted' },
  { time: '5 AM', aqi: 195, type: 'predicted' },
];

export default function Dashboard() {
  const [forecastTab, setForecastTab] = useState('24h');

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
              <MapPin className="w-3 h-3" /> Delhi, Delhi
            </p>
          </div>
        </div>
        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors">
          Change City
        </button>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50/50">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-gray-800 font-bold text-lg mb-1">
              <MapPin className="w-5 h-5 text-red-500" />
              Pimpri, Maharashtra
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Last updated: 27/1/2026, 7:15:56 pm
            </div>
          </div>
          <div className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm shadow-red-200">
            Unhealthy
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative bg-white border-2 border-red-500 rounded-2xl p-6 shadow-lg shadow-red-500/10 flex flex-col justify-center items-center text-center">
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white shadow-sm">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-5xl font-black text-red-500 mb-1 tracking-tighter">199</div>
            <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">CURRENT AQI</div>
          </div>

          <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">TODAY'S PEAK</div>
              <div className="w-6 h-6 bg-blue-50 text-blue-500 rounded-md flex items-center justify-center"><TrendingUp className="w-3 h-3" /></div>
            </div>
            <div className="text-3xl font-black text-slate-800 mb-1">370</div>
            <div className="text-xs text-gray-500 font-medium">Expected maximum</div>
          </div>

          <div className="bg-white border border-green-100 rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider">BEST HOUR</div>
              <div className="w-6 h-6 bg-green-50 text-green-500 rounded-md flex items-center justify-center"><Clock className="w-3 h-3" /></div>
            </div>
            <div className="text-3xl font-black text-slate-800 mb-1">5 AM</div>
            <div className="text-xs text-gray-500 font-medium">Best time to go out</div>
          </div>

          <div className="bg-white border border-purple-100 rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">7-DAY AVG</div>
              <div className="w-6 h-6 bg-purple-50 text-purple-500 rounded-md flex items-center justify-center"><Calendar className="w-3 h-3" /></div>
            </div>
            <div className="text-3xl font-black text-slate-800 mb-1">274</div>
            <div className="text-xs text-gray-500 font-medium">Weekly forecast</div>
          </div>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-4 flex items-start gap-3">
          <div className="mt-0.5"><AlertTriangle className="w-5 h-5 text-amber-500" /></div>
          <div>
            <div className="text-sm font-bold text-amber-800 mb-0.5">Health Advisory</div>
            <div className="text-xs text-amber-700/80">Avoid outdoor activities. Use N95 masks if going out.</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50/50">
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
            <BarChart data={forecastData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
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
                        <div className="text-xs text-gray-600 mb-2">Weather: Smog</div>
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
                {forecastData.map((entry, index) => (
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
              {['1 AM', '2 AM', '3 AM'].map(time => (
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
              Clear skies expected in the afternoon. Wind speed: 12 km/h. UV Index: Moderate
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50/50">
        <h2 className="text-xl font-bold text-brand-700 flex items-center gap-2 mb-6">
          <AlertTriangle className="w-5 h-5" /> AQI Shock Predictor
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4" /> Active Alerts
            </div>
            
            <div className="bg-red-50 border border-red-100 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">High</span>
              </div>
              <div className="flex items-center gap-2 text-red-700 font-bold mb-1">
                <AlertTriangle className="w-4 h-4" /> High Pollution Alert
              </div>
              <div className="text-xs text-red-500 mb-3 font-medium">Current</div>
              <p className="text-sm text-red-900/80">Current AQI is 370, which is hazardous. Avoid outdoors.</p>
            </div>
            
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">Moderate</span>
              </div>
              <div className="flex items-center gap-2 text-orange-700 font-bold mb-1">
                <AlertTriangle className="w-4 h-4" /> Evening Traffic Spike
              </div>
              <div className="text-xs text-orange-500 mb-3 font-medium">Next 2 hours</div>
              <p className="text-sm text-orange-900/80">Expect higher pollution levels due to peak traffic.</p>
            </div>
            
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-5">
              <div className="flex items-center gap-2 text-brand-700 font-bold mb-2">
                <Activity className="w-4 h-4" /> AI Prediction
              </div>
              <p className="text-xs text-brand-900/70 leading-relaxed">
                Using machine learning models to predict pollution spikes based on traffic patterns, weather data, and historical trends.
              </p>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-6">
              <TrendingUp className="w-4 h-4" /> 12-Hour Forecast
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <RechartsTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/90 backdrop-blur-md border border-gray-100 p-3 rounded-xl shadow-xl shadow-brand-500/10">
                            <div className="font-bold text-sm mb-1">{payload[0].payload.time}</div>
                            <div className="text-sm font-medium text-brand-600">aqi : {payload[0].value}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="aqi" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorAqi)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div> Current
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-500"></div> Predicted
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
