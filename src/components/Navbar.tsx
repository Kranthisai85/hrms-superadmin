import { Building2, Home, LogOut, Shield } from 'lucide-react';
import type { PageType } from '../types';

interface NavbarProps {
  onNavigate: (page: PageType) => void;
  onLogout: () => void;
}

export default function Navbar({ onNavigate, onLogout }: NavbarProps) {
  const handleLogout = () => {
    // Remove token from localStorage on logout
    localStorage.removeItem('token');
    // Trigger the onLogout function to update the app state
    onLogout();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-lg">
      <div className="w-full px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* 3D Logo Container */}
              <div className="w-10 h-10 relative transform rotate-3 hover:rotate-0 transition-transform duration-300">
                {/* 3D Effect Layers */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg transform translate-x-1 translate-y-1"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-500 rounded-lg shadow-md transform translate-x-0.5 translate-y-0.5"></div>
                <div className="relative bg-gradient-to-br from-red-300 to-red-400 rounded-lg shadow-sm flex items-center justify-center h-full w-full">
                  {/* PaceHRM Logo Design */}
                  <div className="text-white font-bold text-sm">
                    <div className="flex items-center">
                      <span className="text-red-600 font-black italic">P</span>
                      <span className="text-red-500 font-bold italic text-xs">ACE</span>
                      <span className="text-gray-800 font-black ml-0.5">HRM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 font-medium"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </button>

            <button
              onClick={() => onNavigate('companies')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 font-medium"
            >
              <Building2 className="h-4 w-4" />
              Organizations
            </button>

            <div className="h-6 w-px bg-gray-300 mx-2"></div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200 font-medium"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
