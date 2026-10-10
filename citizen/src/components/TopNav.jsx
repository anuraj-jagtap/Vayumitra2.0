import { Link, useLocation } from 'react-router-dom';
import { Wind, Home, BookOpen, Activity, Users, User, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function TopNav() {
  const location = useLocation();

  const navLinks = [
    { name: 'My Air', path: '/dashboard', icon: Home },
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
              const isActive = location.pathname === link.path;
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
            <Link to="/landing" className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Landing
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-semibold text-xs">
                RK
              </div>
              <div className="hidden sm:block text-sm">
                <p className="font-medium text-gray-900 leading-none">Rajesh Kumar</p>
                <p className="text-gray-500 text-xs">Citizen</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
