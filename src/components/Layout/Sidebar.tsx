import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Bus,
  Users,
  CreditCard,
  FileText,
  X,
  Home,
  Package
} from 'lucide-react';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Buses', href: '/buses', icon: Bus },
    { name: 'Pasajeros', href: '/passengers', icon: Users },
    { name: 'Inventario', href: '/inventory', icon: Package },
    { name: 'Gastos', href: '/expenses', icon: CreditCard },
    { name: 'Reportes', href: '/reports', icon: FileText },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 bg-blue-800">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-white" />
            <span className="ml-2 text-xl font-bold text-white">BusControl</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-5 px-2 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive(item.href)
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="mr-3 h-6 w-6 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;