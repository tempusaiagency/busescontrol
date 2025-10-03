import React, { useState } from 'react';
import { DollarSign, TrendingUp, Fuel, Wrench, Calendar, BarChart3, Sparkles } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatGuarani } from '../../utils/currency';

export default function CostForecasting() {
  const [forecastMonths, setForecastMonths] = useState(3);
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState(7500);
  const [expectedKm, setExpectedKm] = useState(150000);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const generateForecasts = () => {
    setLoading(true);

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const currentMonth = 10;
    const currentYear = 2025;

    const newForecasts = Array.from({ length: forecastMonths }, (_, i) => {
      const monthIndex = (currentMonth + i) % 12;
      const year = currentYear + Math.floor((currentMonth + i) / 12);
      const monthName = monthNames[monthIndex];

      const fuelPriceVariance = (Math.random() - 0.5) * 500;
      const adjustedFuelPrice = fuelPricePerLiter + (i * 100) + fuelPriceVariance;

      const kmPerMonth = expectedKm / 12;
      const averageConsumption = 3.5;
      const litersNeeded = kmPerMonth / averageConsumption;
      const fuelCost = litersNeeded * adjustedFuelPrice;

      const baseMaintenance = 8000000;
      const maintenanceVariance = (Math.random() - 0.3) * 2000000;
      const maintenanceCost = baseMaintenance + maintenanceVariance + (i * 500000);

      const salariesCost = 45000000;
      const insuranceCost = 12000000;
      const otherCosts = 8000000;

      const totalCost = fuelCost + maintenanceCost + salariesCost + insuranceCost + otherCosts;

      const confidenceLower = totalCost * 0.92;
      const confidenceUpper = totalCost * 1.08;

      return {
        month: `${monthName} ${year}`,
        month_short: monthName.substring(0, 3),
        fuel_cost: Math.round(fuelCost),
        maintenance_cost: Math.round(maintenanceCost),
        salaries_cost: salariesCost,
        insurance_cost: insuranceCost,
        other_costs: otherCosts,
        total_cost: Math.round(totalCost),
        fuel_price_per_liter: Math.round(adjustedFuelPrice),
        km_expected: Math.round(kmPerMonth),
        confidence_lower: Math.round(confidenceLower),
        confidence_upper: Math.round(confidenceUpper)
      };
    });

    setForecasts(newForecasts);
    setLoading(false);
  };

  const totalForecastedCost = forecasts.reduce((sum, f) => sum + f.total_cost, 0);
  const avgMonthlyFuel = forecasts.length > 0
    ? Math.round(forecasts.reduce((sum, f) => sum + f.fuel_cost, 0) / forecasts.length)
    : 0;
  const avgMonthlyMaintenance = forecasts.length > 0
    ? Math.round(forecasts.reduce((sum, f) => sum + f.maintenance_cost, 0) / forecasts.length)
    : 0;

  const costBreakdown = forecasts.length > 0 ? [
    { name: 'Combustible', value: avgMonthlyFuel, color: '#f59e0b' },
    { name: 'Mantenimiento', value: avgMonthlyMaintenance, color: '#3b82f6' },
    { name: 'Salarios', value: 45000000, color: '#10b981' },
    { name: 'Seguros', value: 12000000, color: '#8b5cf6' },
    { name: 'Otros', value: 8000000, color: '#6b7280' }
  ] : [];

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="h-6 w-6 text-orange-600" />
        <h2 className="text-2xl font-bold text-gray-900">Pronóstico de Costos Operacionales</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Meses a Pronosticar
          </label>
          <select
            value={forecastMonths}
            onChange={(e) => setForecastMonths(parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            {[3, 6, 12].map((months) => (
              <option key={months} value={months}>
                {months} meses
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Fuel className="inline h-4 w-4 mr-1" />
            Precio Combustible/L
          </label>
          <input
            type="number"
            value={fuelPricePerLiter}
            onChange={(e) => setFuelPricePerLiter(parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            KM Esperados/Año
          </label>
          <input
            type="number"
            value={expectedKm}
            onChange={(e) => setExpectedKm(parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={generateForecasts}
            disabled={loading}
            className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            <Sparkles className="h-5 w-5" />
            {loading ? 'Calculando...' : 'Generar Pronóstico'}
          </button>
        </div>
      </div>

      {forecasts.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Costo Total Pronosticado</p>
                  <p className="text-2xl font-bold text-orange-700 mt-1">{formatGuarani(totalForecastedCost)}</p>
                  <p className="text-xs text-orange-600 mt-1">{forecastMonths} meses</p>
                </div>
                <DollarSign className="h-10 w-10 text-orange-400" />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Combustible Mensual</p>
                  <p className="text-2xl font-bold text-yellow-700 mt-1">{formatGuarani(avgMonthlyFuel)}</p>
                  <p className="text-xs text-yellow-600 mt-1">Promedio</p>
                </div>
                <Fuel className="h-10 w-10 text-yellow-400" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Mantenimiento Mensual</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{formatGuarani(avgMonthlyMaintenance)}</p>
                  <p className="text-xs text-blue-600 mt-1">Promedio</p>
                </div>
                <Wrench className="h-10 w-10 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolución de Costos Totales</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={forecasts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month_short" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatGuarani(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="confidence_upper" stroke="#f59e0b" fill="#fed7aa" fillOpacity={0.3} name="Límite Superior" />
                  <Area type="monotone" dataKey="total_cost" stroke="#f59e0b" fill="#f59e0b" name="Costo Predicho" />
                  <Area type="monotone" dataKey="confidence_lower" stroke="#f59e0b" fill="#fff" fillOpacity={0} name="Límite Inferior" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Desglose por Categoría (Mensual Promedio)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatGuarani(value)} />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalle Mensual</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mes</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Combustible</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Mantenimiento</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Salarios</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Seguros</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Otros</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {forecasts.map((forecast, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{forecast.month}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatGuarani(forecast.fuel_cost)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatGuarani(forecast.maintenance_cost)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatGuarani(forecast.salaries_cost)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatGuarani(forecast.insurance_cost)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatGuarani(forecast.other_costs)}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{formatGuarani(forecast.total_cost)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">TOTAL</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                      {formatGuarani(forecasts.reduce((sum, f) => sum + f.fuel_cost, 0))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                      {formatGuarani(forecasts.reduce((sum, f) => sum + f.maintenance_cost, 0))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                      {formatGuarani(forecasts.reduce((sum, f) => sum + f.salaries_cost, 0))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                      {formatGuarani(forecasts.reduce((sum, f) => sum + f.insurance_cost, 0))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                      {formatGuarani(forecasts.reduce((sum, f) => sum + f.other_costs, 0))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-orange-700">{formatGuarani(totalForecastedCost)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {forecasts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Configure los parámetros y genere el pronóstico de costos</p>
        </div>
      )}
    </div>
  );
}
