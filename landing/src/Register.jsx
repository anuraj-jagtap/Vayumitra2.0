import { useState } from 'react';
import axios from 'axios';
import { Wind, AlertCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const CITIZEN_URL = import.meta.env.VITE_CITIZEN_APP_URL || 'http://localhost:5174';
const POLICYMAKER_URL = import.meta.env.VITE_POLICYMAKER_APP_URL || 'http://localhost:5175';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CITIZEN'); // Default to citizen
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Create account
      const username = email.split('@')[0] + Math.floor(Math.random() * 10000);
      
      await axios.post(`${API_URL}/api/auth/register/`, {
        username,
        email,
        password,
        role,
        first_name: firstName,
        last_name: lastName
      });

      // Auto-login after successful registration
      const loginRes = await axios.post(`${API_URL}/api/auth/login/`, { email, password });
      const { access, refresh } = loginRes.data;

      // Redirect to appropriate dashboard passing tokens in URL
      const targetBase = role === 'POLICYMAKER' ? POLICYMAKER_URL : CITIZEN_URL;
      const targetUrl = new URL(targetBase);
      targetUrl.searchParams.set('access_token', access);
      targetUrl.searchParams.set('refresh_token', refresh);
      
      window.location.href = targetUrl.toString();
    } catch (err) {
      if (err.response?.data) {
        // Extract validation errors
        const errData = err.response.data;
        const messages = [];
        for (const key in errData) {
          if (Array.isArray(errData[key])) {
            messages.push(`${key}: ${errData[key].join(' ')}`);
          } else {
            messages.push(`${key}: ${errData[key]}`);
          }
        }
        setError(messages.join(' | ') || 'An error occurred during registration.');
      } else {
        setError('An error occurred during registration.');
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
          Create your account
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('CITIZEN')}
                  className={`py-3 px-4 rounded-xl border text-sm font-medium flex items-center justify-center transition-all ${
                    role === 'CITIZEN'
                      ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Citizen
                </button>
                <button
                  type="button"
                  onClick={() => setRole('POLICYMAKER')}
                  className={`py-3 px-4 rounded-xl border text-sm font-medium flex items-center justify-center transition-all ${
                    role === 'POLICYMAKER'
                      ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Policymaker
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">Already have an account? </span>
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
