import { Link } from 'react-router-dom';
import { Wind, Shield, Users, ArrowRight } from 'lucide-react';

export default function Landing() {
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
          <Link
            to="/dashboard"
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
          </Link>

          <a
            href="#"
            className="group relative bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-slate-50 text-slate-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">I am an Authority</h2>
            <p className="text-gray-500 mb-6">View actionable intelligence and respond to community reports.</p>
            <div className="mt-auto flex items-center text-slate-700 font-medium">
              Authority Login <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
        </div>

        <div className="mt-24 pt-12 border-t border-gray-100 w-full grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-4xl font-bold text-brand-600 mb-2">35+</h3>
            <p className="text-gray-600">Monitoring Stations Active</p>
          </div>
          <div>
            <h3 className="text-4xl font-bold text-brand-600 mb-2">10k+</h3>
            <p className="text-gray-600">Community Reports</p>
          </div>
          <div>
            <h3 className="text-4xl font-bold text-brand-600 mb-2">99%</h3>
            <p className="text-gray-600">Data Reliability Rate</p>
          </div>
        </div>
      </main>
    </div>
  );
}
