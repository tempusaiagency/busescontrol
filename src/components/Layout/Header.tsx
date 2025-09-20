import React from 'react';
import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm lg:static lg:overflow-y-visible">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between xl:grid xl:grid-cols-12 lg:gap-8">
          <div className="flex md:absolute md:left-0 md:inset-y-0 lg:static xl:col-span-2">
            <div className="flex-shrink-0 flex items-center">
              <button
                type="button"
                className="bg-white p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Abrir sidebar</span>
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="min-w-0 flex-1 md:px-8 lg:px-0 xl:col-span-6">
            <div className="flex items-center px-6 py-4 md:max-w-3xl md:mx-auto lg:max-w-none lg:mx-0 xl:px-0">
              <div className="w-full">
                <div className="relative">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Sistema de Control de Buses
                  </h1>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center md:absolute md:right-0 md:inset-y-0 lg:hidden xl:col-span-4">
            {/* User menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">{user?.name}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {user?.role === 'admin' ? 'Admin' : 'Operador'}
                </span>
              </div>
              <button
                onClick={logout}
                className="bg-white p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="hidden lg:flex lg:items-center lg:justify-end xl:col-span-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">{user?.name}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {user?.role === 'admin' ? 'Admin' : 'Operador'}
                </span>
              </div>
              <button
                onClick={logout}
                className="bg-white p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;