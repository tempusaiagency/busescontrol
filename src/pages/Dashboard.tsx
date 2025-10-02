import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ReportSelector, ReportCategory } from '../components/Dashboard/ReportSelector';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatGuarani } from '../utils/currency';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

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

type DateFilterType = 'custom' | 'month' | 'year' | 'all';

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
  const [tripsData, setTripsData] = useState<any[]>([]);
  const [routeKmData, setRouteKmData] = useState<any[]>([]);
  const [passengersByHourData, setPassengersByHourData] = useState<any[]>([]);
  const [paymentMethodsData, setPaymentMethodsData] = useState<any[]>([]);
  const [maintenanceByTypeData, setMaintenanceByTypeData] = useState<any[]>([]);
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [maintenanceData, setMaintenanceData] = useState<any[]>([]);
  const [avgTripDuration, setAvgTripDuration] = useState(0);

  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('month');
  const [startDate, setStartDate] = useState('2025-09-01');
  const [endDate, setEndDate] = useState('2025-09-30');
  const [selectedMonth, setSelectedMonth] = useState('2025-09');
  const [selectedYear, setSelectedYear] = useState('2025');

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, startDate, endDate]);

  const handleDateFilterChange = (type: DateFilterType) => {
    setDateFilterType(type);
    const now = new Date();

    switch (type) {
      case 'month':
        const monthDate = selectedMonth ? new Date(selectedMonth + '-01') : now;
        setStartDate(format(startOfMonth(monthDate), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(monthDate), 'yyyy-MM-dd'));
        break;
      case 'year':
        const yearDate = selectedYear ? new Date(selectedYear + '-01-01') : now;
        setStartDate(format(startOfYear(yearDate), 'yyyy-MM-dd'));
        setEndDate(format(endOfYear(yearDate), 'yyyy-MM-dd'));
        break;
      case 'all':
        setStartDate('2000-01-01');
        setEndDate(format(new Date(), 'yyyy-MM-dd'));
        break;
      case 'custom':
        break;
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    const monthDate = new Date(month + '-01');
    setStartDate(format(startOfMonth(monthDate), 'yyyy-MM-dd'));
    setEndDate(format(endOfMonth(monthDate), 'yyyy-MM-dd'));
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    const yearDate = new Date(year + '-01-01');
    setStartDate(format(startOfYear(yearDate), 'yyyy-MM-dd'));
    setEndDate(format(endOfYear(yearDate), 'yyyy-MM-dd'));
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [tripsResult, incidentsData, maintenanceResult, expensesResult, routesResult] = await Promise.all([
        supabase
          .from('trips')
          .select('*, routes(name, distance_km)')
          .gte('start_time', startDate)
          .lte('start_time', endDate + 'T23:59:59')
          .order('start_time', { ascending: true }),
        supabase
          .from('operational_incidents')
          .select('*')
          .gte('reported_at', startDate)
          .lte('reported_at', endDate + 'T23:59:59'),
        supabase
          .from('maintenance_records')
          .select('*')
          .gte('scheduled_date', startDate)
          .lte('scheduled_date', endDate),
        supabase
          .from('expenses')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('routes')
          .select('*')
      ]);

      const trips = tripsResult.data || [];
      const incidents = incidentsData.data || [];
      const maintenance = maintenanceResult.data || [];
      const expenses = expensesResult.data || [];
      const routes = routesResult.data || [];

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

      setTripsData(trips);
      setExpensesData(expenses);
      setMaintenanceData(maintenance);

      // Calculate route kilometers
      const routeKmMap = new Map();
      trips.forEach((trip: any) => {
        if (trip.routes && trip.distance_km) {
          const routeName = trip.routes.name || 'Sin Ruta';
          const currentKm = routeKmMap.get(routeName) || 0;
          routeKmMap.set(routeName, currentKm + Number(trip.distance_km));
        }
      });
      const routeKm = Array.from(routeKmMap.entries()).map(([route, km]) => ({
        route: route.replace('Ruta ', '').split(' -')[0],
        km: Math.round(km)
      }));
      setRouteKmData(routeKm);

      // Calculate passengers by hour
      const hourMap = new Map();
      trips.forEach((trip: any) => {
        if (trip.start_time) {
          const hour = new Date(trip.start_time).getHours();
          const hourLabel = `${hour}:00`;
          const current = hourMap.get(hourLabel) || 0;
          hourMap.set(hourLabel, current + Number(trip.passenger_count || 0));
        }
      });
      const passengersByHour = Array.from(hourMap.entries())
        .map(([hour, passengers]) => ({ hour, passengers }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
      setPassengersByHourData(passengersByHour);

      // Calculate payment methods from trips
      const totalCash = trips.reduce((sum: number, t: any) => sum + Number(t.payment_method_cash || 0), 0);
      const totalCard = trips.reduce((sum: number, t: any) => sum + Number(t.payment_method_card || 0), 0);
      const totalQR = trips.reduce((sum: number, t: any) => sum + Number(t.payment_method_qr || 0), 0);
      setPaymentMethodsData([
        { name: 'Efectivo', value: totalCash, color: '#10b981' },
        { name: 'Tarjeta', value: totalCard, color: '#3b82f6' },
        { name: 'QR', value: totalQR, color: '#8b5cf6' }
      ]);

      // Calculate maintenance by type
      const maintenanceTypeMap = new Map();
      maintenance.forEach((m: any) => {
        const type = m.type || 'other';
        const count = maintenanceTypeMap.get(type) || 0;
        maintenanceTypeMap.set(type, count + 1);
      });
      const maintenanceByType = Array.from(maintenanceTypeMap.entries()).map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count
      }));
      setMaintenanceByTypeData(maintenanceByType);

      // Calculate average trip duration
      const tripsWithDuration = trips.filter((t: any) => t.start_time && t.end_time);
      if (tripsWithDuration.length > 0) {
        const avgDuration = tripsWithDuration.reduce((sum: number, t: any) => {
          const start = new Date(t.start_time).getTime();
          const end = new Date(t.end_time).getTime();
          return sum + (end - start);
        }, 0) / tripsWithDuration.length;
        setAvgTripDuration(Math.round(avgDuration / 60000));
      } else {
        setAvgTripDuration(0);
      }
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
          <p className="text-3xl font-bold text-gray-900">{avgTripDuration} min</p>
          <p className="text-sm text-gray-500 mt-1">Por viaje</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Incidencias</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalIncidents}</p>
          <p className="text-sm text-gray-500 mt-1">Reportadas</p>
        </div>
      </div>

      {routeKmData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kilómetros Recorridos por Ruta</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={routeKmData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="route" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="km" fill="#3b82f6" name="Kilómetros" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderPassengersReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pasajeros Totales</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalPassengers}</p>
          <p className="text-sm text-gray-500 mt-1">En {stats.totalTrips} viajes</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Ocupación Promedio</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.avgOccupancy.toFixed(1)}%</p>
          <p className="text-sm text-gray-500 mt-1">De capacidad total</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Ingreso por Pasajero</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalPassengers > 0 ? formatGuarani(stats.totalRevenue / stats.totalPassengers) : formatGuarani(0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Promedio por viaje</p>
        </div>
      </div>

      {passengersByHourData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pasajeros por Hora de Salida</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={passengersByHourData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="passengers" stroke="#10b981" strokeWidth={2} name="Pasajeros" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderFinanceReport = () => {

    const revenueByDateData = tripsData.reduce((acc: any[], trip) => {
      const date = format(new Date(trip.start_time), 'dd/MM');
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.ingresos += Number(trip.revenue || 0);
        existing.pasajeros += Number(trip.passenger_count || 0);
      } else {
        acc.push({
          date,
          ingresos: Number(trip.revenue || 0),
          pasajeros: Number(trip.passenger_count || 0)
        });
      }
      return acc;
    }, []);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Ingresos Totales</h3>
            <p className="text-3xl font-bold text-gray-900">{formatGuarani(stats.totalRevenue)}</p>
            <p className="text-sm text-gray-600 mt-1">{stats.totalPassengers} pasajeros</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Costos Totales</h3>
            <p className="text-3xl font-bold text-gray-900">{formatGuarani(stats.maintenanceCost + stats.expensesCost + stats.incidentsCost)}</p>
            <p className="text-sm text-yellow-600 mt-1">Gastos operativos</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Utilidad Neta</h3>
            <p className="text-3xl font-bold text-gray-900">
              {formatGuarani(stats.totalRevenue - (stats.maintenanceCost + stats.expensesCost + stats.incidentsCost))}
            </p>
            <p className="text-sm text-green-600 mt-1">Ingreso por pasajero: {formatGuarani(stats.totalPassengers > 0 ? stats.totalRevenue / stats.totalPassengers : 0)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Movimiento de Ingresos por Pasajeros</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueByDateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" stroke="#10b981" />
              <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'ingresos') return formatGuarani(value);
                  return value;
                }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2} name="Ingresos" />
              <Line yAxisId="right" type="monotone" dataKey="pasajeros" stroke="#3b82f6" strokeWidth={2} name="Pasajeros" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paymentMethodsData.length > 0 && paymentMethodsData.some(p => p.value > 0) && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Métodos de Pago</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentMethodsData.filter(p => p.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodsData.filter(p => p.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatGuarani(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Desglose de Costos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { category: 'Mantenimiento', costo: stats.maintenanceCost },
                { category: 'Gastos', costo: stats.expensesCost },
                { category: 'Incidentes', costo: stats.incidentsCost }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatGuarani(value)} />
                <Bar dataKey="costo" fill="#f59e0b" />
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
          <p className="text-sm text-gray-500 mt-1">{maintenanceData.length} registros</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Mantenimientos</h3>
          <p className="text-3xl font-bold text-gray-900">{maintenanceData.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total de registros</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Costo Promedio</h3>
          <p className="text-3xl font-bold text-gray-900">
            {maintenanceData.length > 0 ? formatGuarani(stats.maintenanceCost / maintenanceData.length) : formatGuarani(0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Por mantenimiento</p>
        </div>
      </div>

      {maintenanceByTypeData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mantenimientos por Tipo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={maintenanceByTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#f97316" name="Cantidad" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
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

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtro de Fecha</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <button
            onClick={() => handleDateFilterChange('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateFilterType === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Por Mes
          </button>
          <button
            onClick={() => handleDateFilterChange('year')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateFilterType === 'year'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Por Año
          </button>
          <button
            onClick={() => handleDateFilterChange('custom')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateFilterType === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rango Personalizado
          </button>
          <button
            onClick={() => handleDateFilterChange('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateFilterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todo
          </button>
        </div>

        {dateFilterType === 'month' && (
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Seleccionar Mes:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {dateFilterType === 'year' && (
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Seleccionar Año:</label>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {dateFilterType === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Desde:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Hasta:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      <ReportSelector selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

      {renderSelectedReport()}
    </div>
  );
};

export default Dashboard;
