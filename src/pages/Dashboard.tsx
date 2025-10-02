import React, { useState } from 'react';
import { BarChart3, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ReportSelector, ReportCategory } from '../components/Dashboard/ReportSelector';
import { DateFilter, DateFilterType } from '../components/Dashboard/DateFilter';
import { useDashboardData } from '../hooks/useDashboardData';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatGuarani } from '../utils/currency';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('operations');

  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('month');
  const [startDate, setStartDate] = useState('2025-09-01');
  const [endDate, setEndDate] = useState('2025-09-30');
  const [selectedMonth, setSelectedMonth] = useState('2025-09');
  const [selectedYear, setSelectedYear] = useState('2025');

  const dashboardData = useDashboardData(startDate, endDate);

  const handleDateFilterChange = (type: DateFilterType) => {
    setDateFilterType(type);
    const now = new Date(2025, 8, 1);

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
        setStartDate('2020-01-01');
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

  const renderOperationsReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Viajes Totales</h3>
          <p className="text-3xl font-bold text-gray-900">{dashboardData.stats.totalTrips}</p>
          <p className="text-sm text-gray-500 mt-1">{dashboardData.stats.totalPassengers} pasajeros</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Tiempo Promedio</h3>
          <p className="text-3xl font-bold text-gray-900">{dashboardData.avgTripDuration} min</p>
          <p className="text-sm text-gray-500 mt-1">Por viaje</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Incidencias</h3>
          <p className="text-3xl font-bold text-gray-900">{dashboardData.stats.totalIncidents}</p>
          <p className="text-sm text-gray-500 mt-1">Reportadas</p>
        </div>
      </div>

      {dashboardData.routeKmData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kilómetros Recorridos por Ruta</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.routeKmData}>
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
          <p className="text-3xl font-bold text-gray-900">{dashboardData.stats.totalPassengers}</p>
          <p className="text-sm text-gray-500 mt-1">En {dashboardData.stats.totalTrips} viajes</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Ocupación Promedio</h3>
          <p className="text-3xl font-bold text-gray-900">{dashboardData.stats.avgOccupancy.toFixed(1)}%</p>
          <p className="text-sm text-gray-500 mt-1">De capacidad total</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Ingreso por Pasajero</h3>
          <p className="text-3xl font-bold text-gray-900">
            {dashboardData.stats.totalPassengers > 0 ? formatGuarani(dashboardData.stats.totalRevenue / dashboardData.stats.totalPassengers) : formatGuarani(0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Promedio por viaje</p>
        </div>
      </div>

      {dashboardData.passengersByHourData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pasajeros por Hora de Salida</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.passengersByHourData}>
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
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Ingresos Totales</h3>
            <p className="text-3xl font-bold text-gray-900">{formatGuarani(dashboardData.stats.totalRevenue)}</p>
            <p className="text-sm text-gray-600 mt-1">{dashboardData.stats.totalPassengers} pasajeros</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Costos Totales</h3>
            <p className="text-3xl font-bold text-gray-900">{formatGuarani(dashboardData.stats.maintenanceCost + dashboardData.stats.expensesCost + dashboardData.stats.incidentsCost)}</p>
            <p className="text-sm text-yellow-600 mt-1">Gastos operativos</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Utilidad Neta</h3>
            <p className="text-3xl font-bold text-gray-900">
              {formatGuarani(dashboardData.stats.totalRevenue - (dashboardData.stats.maintenanceCost + dashboardData.stats.expensesCost + dashboardData.stats.incidentsCost))}
            </p>
            <p className="text-sm text-green-600 mt-1">Ingreso por pasajero: {formatGuarani(dashboardData.stats.totalPassengers > 0 ? dashboardData.stats.totalRevenue / dashboardData.stats.totalPassengers : 0)}</p>
          </div>
        </div>

        {dashboardData.revenueByDateData.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Movimiento de Ingresos por Pasajeros</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.revenueByDateData}>
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
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dashboardData.paymentMethodsData.length > 0 && dashboardData.paymentMethodsData.some(p => p.value > 0) && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Métodos de Pago</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.paymentMethodsData.filter(p => p.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.paymentMethodsData.filter(p => p.value > 0).map((entry, index) => (
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
                { category: 'Mantenimiento', costo: dashboardData.stats.maintenanceCost },
                { category: 'Gastos', costo: dashboardData.stats.expensesCost },
                { category: 'Incidentes', costo: dashboardData.stats.incidentsCost }
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
          <p className="text-3xl font-bold text-gray-900">{formatGuarani(dashboardData.stats.maintenanceCost)}</p>
          <p className="text-sm text-gray-500 mt-1">{dashboardData.maintenance.length} registros</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Mantenimientos</h3>
          <p className="text-3xl font-bold text-gray-900">{dashboardData.maintenance.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total de registros</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Costo Promedio</h3>
          <p className="text-3xl font-bold text-gray-900">
            {dashboardData.maintenance.length > 0 ? formatGuarani(dashboardData.stats.maintenanceCost / dashboardData.maintenance.length) : formatGuarani(0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Por mantenimiento</p>
        </div>
      </div>

      {dashboardData.maintenanceByTypeData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mantenimientos por Tipo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.maintenanceByTypeData}>
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
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-md text-white">
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
            <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} name="2025" />
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Por favor inicia sesión</div>
      </div>
    );
  }

  if (dashboardData.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Cargando reportes...</div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-red-600">Error: {dashboardData.error}</div>
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

      <DateFilter
        dateFilterType={dateFilterType}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        startDate={startDate}
        endDate={endDate}
        onFilterTypeChange={handleDateFilterChange}
        onMonthChange={handleMonthChange}
        onYearChange={handleYearChange}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      <ReportSelector selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

      {renderSelectedReport()}
    </div>
  );
};

export default Dashboard;
