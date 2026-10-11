import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Wind, Shield, Lock, Mail, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const LANDING_URL = import.meta.env.VITE_LANDING_URL || 'http://localhost:5173'

  useEffect(() => {
    window.location.href = `${LANDING_URL}/login`
  }, [LANDING_URL])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const user = await login(email, password)
      if (user.role && user.role !== 'POLICYMAKER') {
        setError('This portal is restricted to Policymaker and DPCC/CPCB administration accounts.')
        return
      }
      navigate('/')
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid credentials. Please verify your email and password.')
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else {
        setError(err.message || 'Unable to connect to authentication server.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B132B] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Emblem / Logo */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 border border-blue-400/30">
          <Wind className="w-8 h-8 text-white" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400 bg-blue-900/40 border border-blue-800/50 px-3 py-1 rounded-full">
          Ministry of Environment & Climate
        </span>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
          VayuMitra 2.0 Policy Portal
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          DPCC Central Admin & Decision Support System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#131F37] border border-[#1E3A5F] py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@dpcc.delhi.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#1E3A5F] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#1E3A5F] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Credentials…
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" /> Sign In to Policy Portal
                </>
              )}
            </button>
          </form>

          {/* Guest Access Alternative */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors font-medium cursor-pointer"
            >
              Continue to Dashboard as Guest <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          VayuMitra 2.0 Environmental Intelligence Network
        </p>
      </div>
    </div>
  )
}
