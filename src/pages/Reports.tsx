import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, Download, Calendar, TrendingUp, TrendingDown, DollarSign, Users, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Reports: React.FC = () => {
  const { buses, getDailyReport } = useData();
  const [selectedBus, setSelectedBus] = useState('');
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportType, setReportType] = useState<'daily' | 'comparative'>('daily');

  // Generate date range
  const generateDateRange = (from: string, to: string) => {
    const dates = [];
    const start = new Date(from);
    const end = new Date(to);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(format(d, 'yyyy-MM-dd'));
    }
    
    return dates;
  };

  const dateRange = generateDateRange(dateFrom, dateTo);

  // Generate report data
  const generateReportData = () => {
    if (reportType === 'daily') {
      // Daily report for all buses or selected bus
      const targetBuses = selectedBus ? [buses.find(b => b.id === selectedBus)!].filter(Boolean) : buses;
      
      return dateRange.map(date => {
        const dayData = targetBuses.reduce((acc, bus) => {
          const report = getDailyReport(bus.id, date);
          acc.passengers += report.passengers;
          acc.revenue += report.revenue;
          acc.expenses += report.total_expenses;
          acc.profit += report.profit;
          return acc;
        }, { passengers: 0, revenue: 0, expenses: 0, profit: 0 });

        return {
          date: format(new Date(date), 'dd/MM', { locale: es }),
          fullDate: date,
          passengers: dayData.passengers,
          revenue: dayData.revenue / 1000,
          expenses: dayData.expenses / 1000,
          profit: dayData.profit / 1000
        };
      });
    } else {
      // Comparative report between buses
      return buses.map(bus => {
        const busData = dateRange.reduce((acc, date) => {
          const report = getDailyReport(bus.id, date);
          acc.passengers += report.passengers;
          acc.revenue += report.revenue;
          acc.expenses += report.total_expenses;
          acc.profit += report.profit;
          return acc;
        }, { passengers: 0, revenue: 0, expenses: 0, profit: 0 });

        return {
          busId: bus.id,
          busName: bus.license_plate,
          passengers: busData.passengers,
          revenue: busData.revenue / 1000,
          expenses: busData.expenses / 1000,
          profit: busData.profit / 1000,
          profitMargin: busData.revenue > 0 ? ((busData.profit / busData.revenue) * 100) : 0
        };
      });
    }
  };

  const reportData = generateReportData();

  // Calculate summary statistics
  const summaryStats = reportData.reduce((acc, item) => {
    if (reportType === 'daily') {
      acc.totalPassengers += (item as any).passengers;
      acc.totalRevenue += (item as any).revenue * 1000;
      acc.totalExpenses += (item as any).expenses * 1000;
      acc.totalProfit += (item as any).profit * 1000;
    } else {
      acc.totalPassengers += (item as any).passengers;
      acc.totalRevenue += (item as any).revenue * 1000;
      acc.totalExpenses += (item as any).expenses * 1000;
      acc.totalProfit += (item as any).profit * 1000;
    }
    return acc;
  }, { totalPassengers: 0, totalRevenue: 0, totalExpenses: 0, totalProfit: 0 });

  const profitMargin = summaryStats.totalRevenue > 0 ? 
    ((summaryStats.totalProfit / summaryStats.totalRevenue) * 100) : 0;

  // Export to CSV
  const exportToCSV = () => {
    const headers = reportType === 'daily' 
      ? ['Fecha', 'Pasajeros', 'Ingresos', 'Gastos', 'Utilidad']
      : ['Bus', 'Pasajeros', 'Ingresos', 'Gastos', 'Utilidad', 'Margen'];
      
    const rows = reportData.map(item => {
      if (reportType === 'daily') {
        const dayItem = item as any;
        return [
          dayItem.fullDate,
          dayItem.passengers,
          dayItem.revenue * 1000,
          dayItem.expenses * 1000,
          dayItem.profit * 1000
        ];
      } else {
        const busItem = item as any;
        return [
          busItem.busName,
          busItem.passengers,
          busItem.revenue * 1000,
          busItem.expenses * 1000,
          busItem.profit * 1000,
          `${busItem.profitMargin.toFixed(1)}%`
        ];
      }
    });

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${reportType}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getBusName = (busId: string) => {
    const bus = buses.find(b => b.id === busId);
    return bus ? `${bus.license_plate} - ${bus.route}` : busId;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="mt-2 text-gray-600">
            Análisis de rendimiento y reportes financieros
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <Download className="h-5 w-5" />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Report Configuration */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Configuración del Reporte</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Reporte
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'daily' | 'comparative')}
            >
              <option value="daily">Reporte Diario</option>
              <option value="comparative">Comparativo por Bus</option>
            </select>
          </div>

          {reportType === 'daily' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bus (Opcional)
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={selectedBus}
                onChange={(e) => setSelectedBus(e.target.value)}
              >
                <option value="">Todos los buses</option>
                {buses.map(bus => (
                  <option key={bus.id} value={bus.id}>
                    {bus.license_plate} - {bus.route}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Desde
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Hasta
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h4 className="text-2xl font-bold text-gray-900">
                {summaryStats.totalPassengers.toLocaleString()}
              </h4>
              <p className="text-sm text-gray-600">Total Pasajeros</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h4 className="text-2xl font-bold text-gray-900">
                ${summaryStats.totalRevenue.toLocaleString()}
              </h4>
              <p className="text-sm text-gray-600">Total Ingresos</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <CreditCard className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h4 className="text-2xl font-bold text-gray-900">
                ${summaryStats.totalExpenses.toLocaleString()}
              </h4>
              <p className="text-sm text-gray-600">Total Gastos</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${profitMargin >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {profitMargin >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div className="ml-4">
              <h4 className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${summaryStats.totalProfit.toLocaleString()}
              </h4>
              <p className="text-sm text-gray-600">
                Utilidad ({profitMargin.toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {reportType === 'daily' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tendencia de Ingresos vs Gastos
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData as any[]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `$${value}k`} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `$${(value * 1000).toLocaleString()}`,
                      name === 'revenue' ? 'Ingresos' : name === 'expenses' ? 'Gastos' : 'Utilidad'
                    ]}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#22C55E" strokeWidth={3} name="Ingresos" />
                  <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} name="Gastos" />
                  <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={3} name="Utilidad" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Pasajeros por Día
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData as any[]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Pasajeros']}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Bar dataKey="passengers" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Comparativo de Rendimiento por Bus
          </h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData as any[]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="busName" />
                <YAxis tickFormatter={(value) => `$${value}k`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${(value * 1000).toLocaleString()}`,
                    name === 'revenue' ? 'Ingresos' : name === 'expenses' ? 'Gastos' : 'Utilidad'
                  ]}
                />
                <Bar dataKey="revenue" fill="#22C55E" name="Ingresos" />
                <Bar dataKey="expenses" fill="#EF4444" name="Gastos" />
                <Bar dataKey="profit" fill="#3B82F6" name="Utilidad" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Datos Detallados del Reporte
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {reportType === 'daily' ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pasajeros
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ingresos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gastos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilidad
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pasajeros
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ingresos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gastos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Margen
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.length > 0 ? reportData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {reportType === 'daily' ? (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date((item as any).fullDate), 'dd/MM/yyyy', { locale: es })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(item as any).passengers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ${((item as any).revenue * 1000).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        ${((item as any).expenses * 1000).toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        (item as any).profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${((item as any).profit * 1000).toLocaleString()}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(item as any).busName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(item as any).passengers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ${((item as any).revenue * 1000).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        ${((item as any).expenses * 1000).toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        (item as any).profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${((item as any).profit * 1000).toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        (item as any).profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(item as any).profitMargin.toFixed(1)}%
                      </td>
                    </>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={reportType === 'daily' ? 5 : 6} className="px-6 py-12 text-center text-gray-500">
                    No hay datos disponibles para el rango seleccionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;