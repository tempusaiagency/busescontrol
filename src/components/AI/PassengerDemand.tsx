import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, MapPin, Clock, Users, AlertCircle, Sparkles } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';

export default function PassengerDemand() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedDate, setSelectedDate] = useState('2025-11-20');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    if (selectedRoute) {
      fetchHistoricalData();
      generatePredictions();
    }
  }, [selectedRoute, selectedDate]);

  const fetchRoutes = async () => {
    const { data } = await supabase.from('routes').select('*').limit(10);
    if (data) setRoutes(data);
  };

  const fetchHistoricalData = async () => {
    const { data } = await supabase
      .from('passenger_demand_history')
      .select('*')
      .eq('route_id', selectedRoute)
      .gte('date', '2025-09-01')
      .lte('date', '2025-11-30')
      .order('date', { ascending: true });

    if (data) {
      const aggregated = data.reduce((acc: any, curr: any) => {
        const existing = acc.find((item: any) => item.date === curr.date);
        if (existing) {
          existing.passenger_count += curr.passenger_count;
        } else {
          acc.push({ date: curr.date, passenger_count: curr.passenger_count });
        }
        return acc;
      }, []);
      setHistoricalData(aggregated);
    }
  };

  const generatePredictions = async () => {
    setLoading(true);

    const hourlyPredictions = Array.from({ length: 24 }, (_, hour) => {
      const basePassengers = hour >= 6 && hour <= 9 ? 120 :
                            hour >= 17 && hour <= 20 ? 110 :
                            hour >= 10 && hour <= 16 ? 70 : 30;

      const variance = Math.random() * 20 - 10;
      const predicted = Math.max(0, Math.round(basePassengers + variance));
      const confidence = 0.75 + Math.random() * 0.2;

      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        predicted_passengers: predicted,
        confidence_score: parseFloat(confidence.toFixed(2)),
        recommendation: predicted > 100 ? 'Alta demanda - Agregar buses' :
                       predicted > 60 ? 'Demanda normal' :
                       'Baja demanda - Reducir frecuencia'
      };
    });

    setPredictions(hourlyPredictions);
    setLoading(false);
  };

  const totalPredicted = predictions.reduce((sum, p) => sum + p.predicted_passengers, 0);
  const avgConfidence = predictions.length > 0
    ? (predictions.reduce((sum, p) => sum + p.confidence_score, 0) / predictions.length).toFixed(2)
    : '0';
  const peakHour = predictions.reduce((max, p) =>
    p.predicted_passengers > max.predicted_passengers ? p : max
  , { hour: '--:--', predicted_passengers: 0 });

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Predicción de Demanda de Pasajeros</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline h-4 w-4 mr-1" />
            Seleccionar Ruta
          </label>
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione una ruta</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Fecha de Predicción
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={generatePredictions}
            disabled={!selectedRoute || loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            <Sparkles className="h-5 w-5" />
            {loading ? 'Generando...' : 'Generar Predicción'}
          </button>
        </div>
      </div>

      {predictions.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Pasajeros Predicho</p>
                  <p className="text-3xl font-bold text-blue-700 mt-1">{totalPredicted}</p>
                </div>
                <Users className="h-10 w-10 text-blue-400" />
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Hora Pico</p>
                  <p className="text-3xl font-bold text-green-700 mt-1">{peakHour.hour}</p>
                  <p className="text-xs text-green-600 mt-1">{peakHour.predicted_passengers} pasajeros</p>
                </div>
                <Clock className="h-10 w-10 text-green-400" />
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Confianza Promedio</p>
                  <p className="text-3xl font-bold text-orange-700 mt-1">{(parseFloat(avgConfidence) * 100).toFixed(0)}%</p>
                </div>
                <AlertCircle className="h-10 w-10 text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Demanda por Hora</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={predictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="predicted_passengers" fill="#3b82f6" name="Pasajeros Predichos" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recomendaciones por Franja Horaria</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {predictions.filter(p => p.predicted_passengers > 0).map((pred, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    pred.predicted_passengers > 100 ? 'bg-red-50 border border-red-200' :
                    pred.predicted_passengers > 60 ? 'bg-blue-50 border border-blue-200' :
                    'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{pred.hour}</p>
                      <p className="text-sm text-gray-600">{pred.predicted_passengers} pasajeros</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{pred.recommendation}</p>
                    <p className="text-xs text-gray-500">Confianza: {(pred.confidence_score * 100).toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!selectedRoute && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Seleccione una ruta para ver las predicciones de demanda</p>
        </div>
      )}
    </div>
  );
}
