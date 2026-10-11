import { Link, useLocation } from 'react-router-dom';
import { Wind, Home, BookOpen, Activity, Users, User, ArrowLeft, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../contexts/AuthContext';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function TopNav() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const landingUrl = import.meta.env.VITE_LANDING_URL || 'http://localhost:5173';

  const navLinks = [
    { name: 'My Air', path: '/', icon: Home },
    { name: 'Learn', path: '/learn', icon: BookOpen },
    { name: 'Act', path: '/act', icon: Activity },
    { name: 'Drives', path: '/drives', icon: Users },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center">
              <Wind className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-brand-700 tracking-tight">VāyuMitra</span>
          </div>

          <div className="hidden md:flex space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-brand-50 text-brand-700" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <a href={landingUrl} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </a>
            
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors text-sm font-medium"
                >
                  <div className="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                    {(user.name || user.username || 'U')[0]?.toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[120px] truncate">{user.name || user.username}</span>
                </Link>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href={`${landingUrl}/login`}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors"
                >
                  Sign in
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

