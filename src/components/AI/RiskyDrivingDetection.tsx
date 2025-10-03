import React, { useState, useEffect } from 'react';
import { AlertTriangle, Car, MapPin, Gauge, Calendar, TrendingDown, Filter } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';

export default function RiskyDrivingDetection() {
  const [events, setEvents] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [selectedBus, setSelectedBus] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [dateRange, setDateRange] = useState('7');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBuses();
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [selectedBus, selectedSeverity, dateRange]);

  const fetchBuses = async () => {
    const { data } = await supabase.from('buses').select('id, license_plate').limit(20);
    if (data) setBuses(data);
  };

  const fetchEvents = async () => {
    setLoading(true);

    let query = supabase
      .from('risky_driving_events')
      .select('*, buses(license_plate)')
      .order('timestamp', { ascending: false });

    if (selectedBus !== 'all') {
      query = query.eq('bus_id', selectedBus);
    }

    if (selectedSeverity !== 'all') {
      query = query.eq('severity', selectedSeverity);
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
    query = query.gte('timestamp', daysAgo.toISOString());

    const { data } = await query.limit(100);
    if (data) setEvents(data);

    setLoading(false);
  };

  const eventTypeLabels: Record<string, string> = {
    hard_brake: 'Frenado Brusco',
    sharp_turn: 'Giro Cerrado',
    speeding: 'Exceso de Velocidad',
    idle_excess: 'Ralentí Excesivo'
  };

  const severityColors: Record<string, string> = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#7f1d1d'
  };

  const severityLabels: Record<string, string> = {
    low: 'Bajo',
    medium: 'Medio',
    high: 'Alto',
    critical: 'Crítico'
  };

  const eventsByType = events.reduce((acc: any, event) => {
    const type = event.event_type;
    if (!acc[type]) {
      acc[type] = { name: eventTypeLabels[type] || type, count: 0 };
    }
    acc[type].count++;
    return acc;
  }, {});

  const eventsByTypeData = Object.values(eventsByType);

  const eventsBySeverity = events.reduce((acc: any, event) => {
    const severity = event.severity;
    if (!acc[severity]) {
      acc[severity] = { name: severityLabels[severity] || severity, count: 0, color: severityColors[severity] };
    }
    acc[severity].count++;
    return acc;
  }, {});

  const eventsBySeverityData = Object.values(eventsBySeverity);

  const totalEvents = events.length;
  const criticalEvents = events.filter(e => e.severity === 'critical' || e.severity === 'high').length;
  const avgSpeed = events.length > 0
    ? Math.round(events.reduce((sum, e) => sum + (e.speed_kmh || 0), 0) / events.length)
    : 0;

  const topRiskyBuses = events.reduce((acc: any, event) => {
    const busId = event.bus_id;
    if (!acc[busId]) {
      acc[busId] = {
        bus_id: busId,
        license_plate: event.buses?.license_plate || busId,
        event_count: 0,
        critical_count: 0
      };
    }
    acc[busId].event_count++;
    if (event.severity === 'critical' || event.severity === 'high') {
      acc[busId].critical_count++;
    }
    return acc;
  }, {});

  const topRiskyBusesArray = Object.values(topRiskyBuses)
    .sort((a: any, b: any) => b.event_count - a.event_count)
    .slice(0, 5);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="h-6 w-6 text-red-600" />
        <h2 className="text-2xl font-bold text-gray-900">Detección de Conducción Riesgosa</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Car className="inline h-4 w-4 mr-1" />
            Bus
          </label>
          <select
            value={selectedBus}
            onChange={(e) => setSelectedBus(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Todos los buses</option>
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.license_plate}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Filter className="inline h-4 w-4 mr-1" />
            Severidad
          </label>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Todas</option>
            <option value="low">Bajo</option>
            <option value="medium">Medio</option>
            <option value="high">Alto</option>
            <option value="critical">Crítico</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Período
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="1">Últimas 24 horas</option>
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Total Eventos</p>
              <p className="text-3xl font-bold text-red-700 mt-1">{totalEvents}</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Eventos Críticos/Altos</p>
              <p className="text-3xl font-bold text-orange-700 mt-1">{criticalEvents}</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-orange-400" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Velocidad Promedio</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">{avgSpeed} km/h</p>
            </div>
            <Gauge className="h-10 w-10 text-blue-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Eventos por Tipo</h3>
          {eventsByTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventsByTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              No hay datos disponibles
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Eventos por Severidad</h3>
          {eventsBySeverityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eventsBySeverityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {eventsBySeverityData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {topRiskyBusesArray.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Buses con Más Eventos de Riesgo</h3>
          <div className="space-y-3">
            {topRiskyBusesArray.map((bus: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">{bus.license_plate}</p>
                    <p className="text-sm text-gray-600">{bus.event_count} eventos totales</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{bus.critical_count}</p>
                  <p className="text-xs text-gray-500">Críticos/Altos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Eventos Recientes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Fecha/Hora</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Bus</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Evento</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Severidad</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Velocidad</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.slice(0, 20).map((event, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(event.timestamp).toLocaleString('es-PY')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {event.buses?.license_plate || event.bus_id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {eventTypeLabels[event.event_type] || event.event_type}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-1 text-xs font-medium rounded"
                      style={{
                        backgroundColor: severityColors[event.severity] + '20',
                        color: severityColors[event.severity]
                      }}
                    >
                      {severityLabels[event.severity] || event.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {event.speed_kmh ? `${event.speed_kmh} km/h` : '--'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {event.description || '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {events.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron eventos con los filtros seleccionados
          </div>
        )}
      </div>
    </div>
  );
}
