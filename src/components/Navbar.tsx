import { Building2, Home, LogOut, Menu, Users } from 'lucide-react';
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
    <div className="fixed top-0 left-0 h-full w-64 bg-gray-900 text-white p-4">
      <div className="flex items-center gap-2 mb-8">
        <Menu className="h-6 w-6" />
        <h1 className="text-xl font-bold">Super Admin</h1>
      </div>

      <nav>
        <ul className="space-y-2">
          {/* Home Navigation */}
          <li>
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-800 w-full"
            >
              <Home className="h-5 w-5" />
              Home
            </button>
          </li>

          {/* Companies Section */}
          <li>
            <div className="p-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Companies
              </div>
              <ul className="ml-7 mt-2 space-y-1">
                {/* <li>
                  <button 
                    onClick={() => onNavigate('create')}
                    className="block p-1 rounded hover:bg-gray-800 w-full text-left"
                  >
                    Create Company
                  </button>
                </li> */}
                <li>
                  <button
                    onClick={() => onNavigate('companies')}
                    className="block p-1 rounded hover:bg-gray-800 w-full text-left"
                  >
                    Company List
                  </button>
                </li>
              </ul>
            </div>
          </li>

          {/* Users & Roles Section */}
          <li>
            <div className="p-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users & Roles
              </div>
              <ul className="ml-7 mt-2 space-y-1">
                {/* <li>
                  <button
                    onClick={() => onNavigate('users')}
                    className="block p-1 rounded hover:bg-gray-800 w-full text-left"
                  >
                    Manage Users
                  </button>
                </li> */}
                <li>
                  <button
                    onClick={() => onNavigate('roles')}
                    className="block p-1 rounded hover:bg-gray-800 w-full text-left"
                  >
                    Manage Roles
                  </button>
                </li>
              </ul>
            </div>
          </li>

          {/* Logout Section */}
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-800 w-full"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
