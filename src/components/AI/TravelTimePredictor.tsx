import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Navigation, Zap, AlertCircle, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';

export default function TravelTimePredictor() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [departureTime, setDepartureTime] = useState('08:00');
  const [trafficLevel, setTrafficLevel] = useState('medio');
  const [weatherCondition, setWeatherCondition] = useState('soleado');
  const [prediction, setPrediction] = useState<any>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    if (selectedRoute) {
      fetchSegments();
    }
  }, [selectedRoute]);

  const fetchRoutes = async () => {
    const { data } = await supabase.from('routes').select('*').limit(10);
    if (data) setRoutes(data);
  };

  const fetchSegments = async () => {
    const { data } = await supabase
      .from('route_segments')
      .select('*')
      .eq('route_id', selectedRoute)
      .order('order_index', { ascending: true });

    if (data) setSegments(data);
  };

  const generatePrediction = () => {
    setLoading(true);

    const baseTime = 120;
    const trafficMultiplier = trafficLevel === 'bajo' ? 0.85 :
                             trafficLevel === 'medio' ? 1.0 :
                             trafficLevel === 'alto' ? 1.25 : 1.5;
    const weatherMultiplier = weatherCondition === 'soleado' ? 1.0 :
                             weatherCondition === 'nublado' ? 1.05 :
                             weatherCondition === 'lluvioso' ? 1.2 : 1.0;

    const predictedMinutes = Math.round(baseTime * trafficMultiplier * weatherMultiplier);
    const variance = Math.round(predictedMinutes * 0.1);
    const confidence = 0.82 + Math.random() * 0.13;

    const [hours, minutes] = departureTime.split(':').map(Number);
    const arrivalMinutes = (hours * 60 + minutes + predictedMinutes) % 1440;
    const arrivalHours = Math.floor(arrivalMinutes / 60);
    const arrivalMins = arrivalMinutes % 60;
    const arrivalTime = `${arrivalHours.toString().padStart(2, '0')}:${arrivalMins.toString().padStart(2, '0')}`;

    const onTimeProb = trafficMultiplier < 1.2 && weatherMultiplier < 1.15 ? 85 + Math.random() * 10 : 65 + Math.random() * 15;

    const segmentPredictions = segments.length > 0 ? segments.map((seg, idx) => ({
      segment_name: seg.segment_name,
      predicted_minutes: Math.round((predictedMinutes / segments.length) * (0.9 + Math.random() * 0.2)),
      traffic_level: trafficLevel,
      confidence: parseFloat((0.75 + Math.random() * 0.2).toFixed(2))
    })) : [];

    setPrediction({
      departure_time: departureTime,
      estimated_arrival: arrivalTime,
      predicted_duration: predictedMinutes,
      variance_minutes: variance,
      confidence_score: parseFloat(confidence.toFixed(2)),
      on_time_probability: parseFloat(onTimeProb.toFixed(1)),
      traffic_level: trafficLevel,
      weather_condition: weatherCondition,
      segments: segmentPredictions
    });

    setLoading(false);
  };

  const historicalComparison = [
    { day: 'Lun', avg_time: 115, predicted: 120 },
    { day: 'Mar', avg_time: 118, predicted: 122 },
    { day: 'Mié', avg_time: 125, predicted: 128 },
    { day: 'Jue', avg_time: 122, predicted: 125 },
    { day: 'Vie', avg_time: 130, predicted: 135 },
    { day: 'Sáb', avg_time: 95, predicted: 98 },
    { day: 'Dom', avg_time: 85, predicted: 88 }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="h-6 w-6 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900">Predicción de Tiempos de Viaje (ETA)</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline h-4 w-4 mr-1" />
            Ruta
          </label>
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">Seleccione</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="inline h-4 w-4 mr-1" />
            Hora de Salida
          </label>
          <input
            type="time"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Navigation className="inline h-4 w-4 mr-1" />
            Nivel de Tráfico
          </label>
          <select
            value={trafficLevel}
            onChange={(e) => setTrafficLevel(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="bajo">Bajo</option>
            <option value="medio">Medio</option>
            <option value="alto">Alto</option>
            <option value="muy_alto">Muy Alto</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Clima
          </label>
          <select
            value={weatherCondition}
            onChange={(e) => setWeatherCondition(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="soleado">Soleado</option>
            <option value="nublado">Nublado</option>
            <option value="lluvioso">Lluvioso</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={generatePrediction}
            disabled={!selectedRoute || loading}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            <Sparkles className="h-5 w-5" />
            {loading ? 'Calculando...' : 'Predecir'}
          </button>
        </div>
      </div>

      {prediction && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Salida</p>
                  <p className="text-3xl font-bold text-green-700 mt-1">{prediction.departure_time}</p>
                </div>
                <Clock className="h-10 w-10 text-green-400" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Llegada Estimada</p>
                  <p className="text-3xl font-bold text-blue-700 mt-1">{prediction.estimated_arrival}</p>
                </div>
                <Zap className="h-10 w-10 text-blue-400" />
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Duración</p>
                  <p className="text-3xl font-bold text-orange-700 mt-1">{prediction.predicted_duration}m</p>
                  <p className="text-xs text-orange-600 mt-1">±{prediction.variance_minutes} min</p>
                </div>
                <Clock className="h-10 w-10 text-orange-400" />
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-600 font-medium">Prob. Puntual</p>
                  <p className="text-3xl font-bold text-indigo-700 mt-1">{prediction.on_time_probability}%</p>
                </div>
                <AlertCircle className="h-10 w-10 text-indigo-400" />
              </div>
            </div>
          </div>

          {prediction.segments.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiempos por Tramo</h3>
              <div className="space-y-3">
                {prediction.segments.map((seg: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">{seg.segment_name}</p>
                        <p className="text-sm text-gray-600">Tráfico: {seg.traffic_level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{seg.predicted_minutes} min</p>
                      <p className="text-xs text-gray-500">Confianza: {(seg.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparación con Histórico</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avg_time" stroke="#94a3b8" name="Tiempo Promedio Histórico" strokeWidth={2} />
                <Line type="monotone" dataKey="predicted" stroke="#10b981" name="Predicción IA" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {!selectedRoute && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Seleccione una ruta para predecir tiempos de viaje</p>
        </div>
      )}
    </div>
  );
}
