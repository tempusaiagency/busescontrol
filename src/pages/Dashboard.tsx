import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ReportSelector, ReportCategory } from '../components/Dashboard/ReportSelector';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatGuarani } from '../utils/currency';

interface DashboardStats {
  totalTrips: number;
  totalRevenue: number;
  totalPassengers: number;
  totalIncidents: number;
  maintenanceCost: number;
  expensesCost: number;
  incidentsCost: number;
  avgOccupancy: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('operations');
  const [stats, setStats] = useState<DashboardStats>({
    totalTrips: 0,
    totalRevenue: 0,
    totalPassengers: 0,
    totalIncidents: 0,
    maintenanceCost: 0,
    expensesCost: 0,
    incidentsCost: 0,
    avgOccupancy: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [tripsData, incidentsData, maintenanceData, expensesData] = await Promise.all([
        supabase.from('trips').select('*'),
        supabase.from('operational_incidents').select('*'),
        supabase.from('maintenance_records').select('cost'),
        supabase.from('expenses').select('*')
      ]);

      const trips = tripsData.data || [];
      const incidents = incidentsData.data || [];
      const maintenance = maintenanceData.data || [];
      const expenses = expensesData.data || [];

      const totalRevenue = trips.reduce((sum, t) => sum + Number(t.revenue || 0), 0);
      const totalPassengers = trips.reduce((sum, t) => sum + Number(t.passenger_count || 0), 0);
      const maintenanceCost = maintenance.reduce((sum, m) => sum + Number(m.cost || 0), 0);
      const expensesCost = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const incidentsCost = incidents.reduce((sum, i) => sum + Number(i.cost || 0), 0);

      const tripsWithSeats = trips.filter(t => t.seats_available > 0);
      const avgOccupancy = tripsWithSeats.length > 0
        ? tripsWithSeats.reduce((sum, t) => {
            const totalSeats = Number(t.passenger_count) + Number(t.seats_available);
            return sum + (totalSeats > 0 ? (Number(t.passenger_count) / totalSeats) * 100 : 0);
          }, 0) / tripsWithSeats.length
        : 0;

      setStats({
        totalTrips: trips.length,
        totalRevenue,
        totalPassengers,
        totalIncidents: incidents.length,
        maintenanceCost,
        expensesCost,
        incidentsCost,
        avgOccupancy
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
    setLoading(false);
  };

  const renderOperationsReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Viajes Totales</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalTrips}</p>
          <p className="text-sm text-green-600 mt-1">+12% vs mes anterior</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Tiempo Promedio</h3>
          <p className="text-3xl font-bold text-gray-900">45 min</p>
          <p className="text-sm text-green-600 mt-1">-5% vs mes anterior</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Incidencias</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalIncidents}</p>
          <p className="text-sm text-yellow-600 mt-1">3 activas</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Kilómetros Recorridos por Ruta</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { route: 'Ruta A', km: 1250 },
            { route: 'Ruta B', km: 980 },
            { route: 'Ruta C', km: 1450 },
            { route: 'Ruta D', km: 750 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="route" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="km" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderPassengersReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pasajeros Totales</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalPassengers}</p>
          <p className="text-sm text-green-600 mt-1">+8% vs mes anterior</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Ocupación Promedio</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.avgOccupancy.toFixed(1)}%</p>
          <p className="text-sm text-green-600 mt-1">+3% vs mes anterior</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Ingreso por Pasajero</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalPassengers > 0 ? formatGuarani(stats.totalRevenue / stats.totalPassengers) : formatGuarani(0)}
          </p>
          <p className="text-sm text-green-600 mt-1">+5% vs mes anterior</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencia de Pasajeros por Hora</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={[
            { hour: '6am', passengers: 45 },
            { hour: '9am', passengers: 120 },
            { hour: '12pm', passengers: 85 },
            { hour: '3pm', passengers: 95 },
            { hour: '6pm', passengers: 150 },
            { hour: '9pm', passengers: 40 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="passengers" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderFinanceReport = () => {
    const paymentMethodsData = [
      { name: 'Efectivo', value: stats.totalRevenue * 0.45, color: '#10b981' },
      { name: 'Tarjeta', value: stats.totalRevenue * 0.35, color: '#3b82f6' },
      { name: 'QR', value: stats.totalRevenue * 0.20, color: '#8b5cf6' }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Ingresos Totales</h3>
            <p className="text-3xl font-bold text-gray-900">{formatGuarani(stats.totalRevenue)}</p>
            <p className="text-sm text-green-600 mt-1">+15% vs mes anterior</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Costos Totales</h3>
            <p className="text-3xl font-bold text-gray-900">{formatGuarani(stats.maintenanceCost + stats.expensesCost + stats.incidentsCost)}</p>
            <p className="text-sm text-yellow-600 mt-1">+8% vs mes anterior</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Utilidad Neta</h3>
            <p className="text-3xl font-bold text-gray-900">
              {formatGuarani(stats.totalRevenue - (stats.maintenanceCost + stats.expensesCost + stats.incidentsCost))}
            </p>
            <p className="text-sm text-green-600 mt-1">Margen: 42%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Métodos de Pago</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Costo por Kilómetro</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { category: 'Combustible', cost: 0.45 },
                { category: 'Mantenimiento', cost: 0.25 },
                { category: 'Peajes', cost: 0.15 },
                { category: 'Sueldos', cost: 0.35 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cost" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderMaintenanceReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Costo Acumulado</h3>
          <p className="text-3xl font-bold text-gray-900">{formatGuarani(stats.maintenanceCost)}</p>
          <p className="text-sm text-yellow-600 mt-1">+12% vs mes anterior</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Tiempo Fuera de Servicio</h3>
          <p className="text-3xl font-bold text-gray-900">48 hrs</p>
          <p className="text-sm text-green-600 mt-1">-15% vs mes anterior</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Cumplimiento</h3>
          <p className="text-3xl font-bold text-gray-900">87%</p>
          <p className="text-sm text-green-600 mt-1">+5% vs mes anterior</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fallas por Tipo</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { type: 'Motor', count: 3 },
            { type: 'Frenos', count: 5 },
            { type: 'Neumáticos', count: 8 },
            { type: 'Eléctrico', count: 2 },
            { type: 'Suspensión', count: 4 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderIntelligenceReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-md text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Pronóstico de Demanda</h3>
          <p className="text-3xl font-bold">↑ 18%</p>
          <p className="text-sm opacity-90 mt-1">Próxima semana</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-md text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Optimización Sugerida</h3>
          <p className="text-lg font-bold">Ruta C</p>
          <p className="text-sm opacity-90 mt-1">Agregar 1 bus en hora pico</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparativa Temporal</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={[
            { month: 'Ene', actual: 8500, lastYear: 7800 },
            { month: 'Feb', actual: 9200, lastYear: 8100 },
            { month: 'Mar', actual: 10100, lastYear: 9200 },
            { month: 'Abr', actual: 9800, lastYear: 8900 },
            { month: 'May', actual: 11200, lastYear: 9500 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="actual" stroke="#8b5cf6" strokeWidth={2} name="2025" />
            <Line type="monotone" dataKey="lastYear" stroke="#94a3b8" strokeWidth={2} name="2024" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Recomendación de IA</h3>
            <p className="mt-1 text-sm text-yellow-700">
              Basado en datos históricos, se recomienda incrementar frecuencia en Ruta B durante las 18:00-20:00 hrs
              para mejorar ocupación en 15% y reducir tiempo de espera de pasajeros.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSelectedReport = () => {
    switch (selectedCategory) {
      case 'operations':
        return renderOperationsReport();
      case 'passengers':
        return renderPassengersReport();
      case 'finance':
        return renderFinanceReport();
      case 'maintenance':
        return renderMaintenanceReport();
      case 'intelligence':
        return renderIntelligenceReport();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Cargando reportes...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Avanzado</h1>
        </div>
        <p className="text-gray-600">Análisis completo del rendimiento operativo</p>
      </div>

      <ReportSelector selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

      {renderSelectedReport()}
    </div>
  );
};

export default Dashboard;
