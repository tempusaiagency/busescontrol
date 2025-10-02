import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { format, startOfDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Users,
  DollarSign,
  CreditCard,
  TrendingUp,
  Bus,
  Activity,
  MapPin
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { buses, passengerCounts, expenses, getDailyReport } = useData();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Calculate today's metrics
  const todayMetrics = buses.reduce((acc, bus) => {
    const report = getDailyReport(bus.id, today);
    acc.passengers += report.passengers;
    acc.revenue += report.revenue;
    acc.expenses += report.total_expenses;
    acc.profit += report.profit;
    return acc;
  }, { passengers: 0, revenue: 0, expenses: 0, profit: 0 });

  // Get current passengers across all buses
  const currentPassengers = buses.reduce((sum, bus) => sum + bus.current_passengers, 0);
  const totalCapacity = buses.reduce((sum, bus) => sum + bus.max_capacity, 0);

  // Prepare chart data for the last 7 days
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayName = format(date, 'EEE', { locale: es });
    
    const dayMetrics = buses.reduce((acc, bus) => {
      const report = getDailyReport(bus.id, dateStr);
      acc.passengers += report.passengers;
      acc.revenue += report.revenue;
      acc.expenses += report.total_expenses;
      return acc;
    }, { passengers: 0, revenue: 0, expenses: 0 });

    chartData.push({
      date: dayName,
      passengers: dayMetrics.passengers,
      revenue: dayMetrics.revenue / 1000, // Convert to thousands
      expenses: dayMetrics.expenses / 1000
    });
  }

  // Prepare expense breakdown for pie chart
  const expenseBreakdown = expenses
    .filter(expense => expense.date === today)
    .reduce((acc, expense) => {
      acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expenseBreakdown).map(([type, amount]) => ({
    name: {
      fuel: 'Combustible',
      maintenance: 'Mantenimiento',
      tolls: 'Peajes',
      salary: 'Sueldos',
      insurance: 'Seguros',
      other: 'Otros'
    }[type] || type,
    value: amount,
    color: {
      fuel: '#EF4444',
      maintenance: '#F97316',
      tolls: '#EAB308',
      salary: '#22C55E',
      insurance: '#3B82F6',
      other: '#8B5CF6'
    }[type] || '#64748B'
  }));

  const COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6'];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Resumen general de la operación de buses - {format(new Date(), 'dd/MM/yyyy')}
          </p>
        </div>
        <button
          onClick={() => navigate('/tracking')}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg"
        >
          <MapPin className="h-5 w-5" />
          Ver Buses en Tiempo Real
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pasajeros Hoy
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {todayMetrics.passengers.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                <Activity className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">
                  {currentPassengers}/{totalCapacity} en tránsito
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Ingresos Hoy
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    ₲{todayMetrics.revenue.toLocaleString('es-PY')}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCard className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Gastos Hoy
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    ₲{todayMetrics.expenses.toLocaleString('es-PY')}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className={`h-8 w-8 ${todayMetrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Utilidad Hoy
                  </dt>
                  <dd className={`text-2xl font-bold ${todayMetrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₲{todayMetrics.profit.toLocaleString('es-PY')}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue vs Expenses Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ingresos vs Gastos (Últimos 7 días)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `₲${value}k`} />
                <Tooltip
                  formatter={(value: number) => [`₲${value.toFixed(0)}k`, '']}
                  labelFormatter={(label) => `Día: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#22C55E" 
                  strokeWidth={3}
                  name="Ingresos"
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#EF4444" 
                  strokeWidth={3}
                  name="Gastos"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Desglose de Gastos Hoy
          </h3>
          <div className="h-80">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`₲${value.toLocaleString('es-PY')}`, '']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No hay gastos registrados para hoy
              </div>
            )}
          </div>
        </div>

        {/* Passenger Trend Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tendencia de Pasajeros (Últimos 7 días)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [value, 'Pasajeros']}
                  labelFormatter={(label) => `Día: ${label}`}
                />
                <Bar dataKey="passengers" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bus Status Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado Actual de Buses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buses.map((bus) => {
            const todayReport = getDailyReport(bus.id, today);
            const occupancyPercentage = (bus.current_passengers / bus.max_capacity) * 100;
            
            return (
              <div key={bus.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Bus className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{bus.license_plate}</h4>
                      <p className="text-sm text-gray-500">{bus.route}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    bus.status === 'active' ? 'bg-green-100 text-green-800' :
                    bus.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {bus.status === 'active' ? 'Activo' : 
                     bus.status === 'maintenance' ? 'Mantenimiento' : 'Inactivo'}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ocupación:</span>
                    <span className="text-sm font-medium">
                      {bus.current_passengers}/{bus.max_capacity} ({occupancyPercentage.toFixed(0)}%)
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        occupancyPercentage > 80 ? 'bg-red-500' :
                        occupancyPercentage > 60 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Hoy:</span>
                      <span className="font-medium">{todayReport.passengers} pasajeros</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ingresos:</span>
                      <span className="font-medium text-green-600">₲{todayReport.revenue.toLocaleString('es-PY')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Utilidad:</span>
                      <span className={`font-medium ${todayReport.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₲{todayReport.profit.toLocaleString('es-PY')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;