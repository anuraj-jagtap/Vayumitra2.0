import { Wind, Shield, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const citizenUrl = import.meta.env.VITE_CITIZEN_APP_URL || 'http://localhost:5174';

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/50 to-white">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center">
            <Wind className="w-6 h-6" />
          </div>
          <span className="font-bold text-2xl text-brand-700 tracking-tight">VāyuMitra</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight max-w-4xl mb-6">
          Breathe easier with community-driven <span className="text-brand-600">air quality insights</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-12">
          Join the movement to monitor, report, and improve air quality in your neighborhood. Real-time data empowering citizens and authorities to act.
        </p>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Public Citizen Portal (no auth required to view) */}
          <a
            href={citizenUrl}
            className="group relative bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">I am a Citizen</h2>
            <p className="text-gray-500 mb-6">Check your local air quality, get health advice, and report pollution.</p>
            <div className="mt-auto flex items-center text-brand-600 font-medium">
              Enter Citizen Portal <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>

          {/* Login Portal (Unified) */}
          <Link
            to="/login"
            className="group relative bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-slate-50 text-slate-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Portal</h2>
            <p className="text-gray-500 mb-6">Sign in to your account to access your personalized dashboard.</p>
            <div className="mt-auto flex items-center text-slate-700 font-medium">
              Sign In <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        <div className="mt-24 pt-12 border-t border-gray-100 w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">The Air Pollution Crisis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-4xl font-bold text-red-500 mb-2">99%</h3>
              <p className="text-gray-900 font-medium mb-2">of the global population</p>
              <p className="text-gray-500 text-sm">breathes air that exceeds WHO guideline limits.</p>
              <p className="text-xs text-gray-400 mt-4">Source: World Health Organization (WHO)</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-4xl font-bold text-red-500 mb-2">7M</h3>
              <p className="text-gray-900 font-medium mb-2">premature deaths</p>
              <p className="text-gray-500 text-sm">annually linked to ambient and household air pollution.</p>
              <p className="text-xs text-gray-400 mt-4">Source: WHO</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-4xl font-bold text-red-500 mb-2">35+</h3>
              <p className="text-gray-900 font-medium mb-2">Monitoring Stations</p>
              <p className="text-gray-500 text-sm">active in your city to track pollution levels in real time.</p>
              <p className="text-xs text-gray-400 mt-4">Source: Central Pollution Control Board (CPCB)</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
