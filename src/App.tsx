import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import Buses from './pages/Buses';
import Passengers from './pages/Passengers';
import Inventory from './pages/Inventory';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Configuration from './pages/Configuration';
import RealTimeTracking from './pages/RealTimeTracking';
import HumanResources from './pages/HumanResources';
import Maintenance from './pages/Maintenance';
import AIAnalytics from './pages/AIAnalytics';
import ChatAssistant from './pages/ChatAssistant';
import DriverFareAuto from './pages/DriverFareAuto';
import FareManagement from './pages/FareManagement';
import PassengerDisplay from './pages/PassengerDisplay';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isPassengerDisplay = location.pathname === '/passenger-display';
  const isDriverInterface = location.pathname === '/driver';

  if (isPassengerDisplay) {
    return <PassengerDisplay />;
  }

  if (isDriverInterface) {
    return <DriverInterface />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/buses" element={<Buses />} />
              <Route path="/passengers" element={<Passengers />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/ai-analytics" element={<AIAnalytics />} />
              <Route path="/chat-assistant" element={<ChatAssistant />} />
              <Route path="/configuration" element={<Configuration />} />
              <Route path="/tracking" element={<RealTimeTracking />} />
              <Route path="/hr" element={<HumanResources />} />
              <Route path="/fare-management" element={<FareManagement />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <AppContent />
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;