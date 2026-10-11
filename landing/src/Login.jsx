import { useState } from 'react';
import axios from 'axios';
import { Wind, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location ? (window.location.protocol === 'https:' ? window.location.origin : (window.location.hostname ? `http://${window.location.hostname}:8000` : 'http://localhost:8000')) : 'http://localhost:8000');
const CITIZEN_URL = import.meta.env.VITE_CITIZEN_APP_URL || (typeof window !== 'undefined' && window.location.hostname ? `http://${window.location.hostname}:5174` : 'http://localhost:5174');
const POLICYMAKER_URL = import.meta.env.VITE_POLICYMAKER_APP_URL || (typeof window !== 'undefined' && window.location.hostname ? `http://${window.location.hostname}:5175` : 'http://localhost:5175');

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Get tokens
      const loginRes = await axios.post(`${API_URL}/api/auth/login/`, { email, password });
      const { access, refresh } = loginRes.data;

      // 2. Fetch user profile to check role
      const meRes = await axios.get(`${API_URL}/api/auth/me/`, {
        headers: { Authorization: `Bearer ${access}` }
      });
      const role = meRes.data.role;

      // 3. Redirect to appropriate dashboard passing tokens in URL
      const targetBase = role === 'POLICYMAKER' ? POLICYMAKER_URL : CITIZEN_URL;
      const targetUrl = new URL(targetBase);
      targetUrl.searchParams.set('access_token', access);
      targetUrl.searchParams.set('refresh_token', refresh);
      
      window.location.href = targetUrl.toString();
    } catch (err) {
      if (err.response?.status === 401) {
        setError('User not present or invalid credentials.');
      } else if (err.response) {
        setError(err.response.data?.detail || 'An error occurred during login.');
      } else {
        setError(`Network error: ${err.message}. Is the backend running at ${API_URL}?`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Link to="/" className="w-12 h-12 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center mb-4">
          <Wind className="w-7 h-7" />
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 flex items-start gap-3 rounded-r-md">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">Don't have an account? </span>
            <Link to="/register" className="font-medium text-brand-600 hover:text-brand-500">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
