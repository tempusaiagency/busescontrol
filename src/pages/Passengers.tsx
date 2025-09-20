import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Users, ArrowRight, ArrowLeft, Filter, Plus, Activity } from 'lucide-react';

const Passengers: React.FC = () => {
  const { buses, passengerCounts, addPassengerCount } = useData();
  const [selectedBus, setSelectedBus] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCount, setNewCount] = useState({
    bus_id: '',
    door: 'front' as const,
    direction: 'in' as const,
    count: 1
  });

  // Filter passenger counts based on selected filters
  const filteredCounts = passengerCounts.filter(count => {
    const countDate = format(new Date(count.timestamp), 'yyyy-MM-dd');
    const matchesBus = !selectedBus || count.bus_id === selectedBus;
    const matchesDate = countDate === selectedDate;
    return matchesBus && matchesDate;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Calculate daily summary
  const dailySummary = filteredCounts.reduce((acc, count) => {
    if (!acc[count.bus_id]) {
      acc[count.bus_id] = { in: 0, out: 0, net: 0 };
    }
    if (count.direction === 'in') {
      acc[count.bus_id].in += count.count;
      acc[count.bus_id].net += count.count;
    } else {
      acc[count.bus_id].out += count.count;
      acc[count.bus_id].net -= count.count;
    }
    return acc;
  }, {} as Record<string, { in: number; out: number; net: number }>);

  const handleAddCount = (e: React.FormEvent) => {
    e.preventDefault();
    addPassengerCount({
      ...newCount,
      timestamp: new Date().toISOString()
    });
    setIsAddModalOpen(false);
    setNewCount({
      bus_id: '',
      door: 'front',
      direction: 'in',
      count: 1
    });
  };

  const getBusName = (busId: string) => {
    const bus = buses.find(b => b.id === busId);
    return bus ? `${bus.license_plate} - ${bus.route}` : busId;
  };

  const totalPassengers = Object.values(dailySummary).reduce((sum, data) => sum + data.in, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Control de Pasajeros</h1>
          <p className="mt-2 text-gray-600">
            Monitoreo y registro de entrada y salida de pasajeros
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Registrar Conteo</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="bus-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Bus
            </label>
            <select
              id="bus-filter"
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
          
          <div>
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              id="date-filter"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Día</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h4 className="text-2xl font-bold text-gray-900">{totalPassengers}</h4>
                <p className="text-sm text-gray-600">Total de Pasajeros</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <ArrowRight className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h4 className="text-2xl font-bold text-gray-900">
                  {Object.values(dailySummary).reduce((sum, data) => sum + data.in, 0)}
                </h4>
                <p className="text-sm text-gray-600">Subieron</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100">
                <ArrowLeft className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h4 className="text-2xl font-bold text-gray-900">
                  {Object.values(dailySummary).reduce((sum, data) => sum + data.out, 0)}
                </h4>
                <p className="text-sm text-gray-600">Bajaron</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bus Summary Cards */}
        {Object.keys(dailySummary).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(dailySummary).map(([busId, data]) => (
              <div key={busId} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{getBusName(busId)}</h4>
                  <Activity className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subieron:</span>
                    <span className="text-sm font-medium text-green-600">{data.in}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Bajaron:</span>
                    <span className="text-sm font-medium text-red-600">{data.out}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium text-gray-900">Neto:</span>
                    <span className={`text-sm font-bold ${data.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {data.net > 0 ? '+' : ''}{data.net}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Passenger Counts Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Registro de Pasajeros - {format(new Date(selectedDate), 'dd/MM/yyyy', { locale: es })}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puerta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dirección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCounts.length > 0 ? filteredCounts.map((count) => (
                <tr key={count.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(count.timestamp), 'HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getBusName(count.bus_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {count.door === 'front' ? 'Delantera' : 'Trasera'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {count.direction === 'in' ? (
                        <>
                          <ArrowRight className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-sm font-medium text-green-600">Entrada</span>
                        </>
                      ) : (
                        <>
                          <ArrowLeft className="h-4 w-4 text-red-600 mr-1" />
                          <span className="text-sm font-medium text-red-600">Salida</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {count.count}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No hay registros para los filtros seleccionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Count Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Registrar Conteo de Pasajeros</h3>
                <p className="text-sm text-gray-600 mt-1">Agrega un nuevo registro de entrada o salida</p>
              </div>

              <form onSubmit={handleAddCount} className="space-y-4">
                <div>
                  <label htmlFor="bus_id" className="block text-sm font-medium text-gray-700">
                    Bus
                  </label>
                  <select
                    id="bus_id"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={newCount.bus_id}
                    onChange={(e) => setNewCount({ ...newCount, bus_id: e.target.value })}
                  >
                    <option value="">Selecciona un bus</option>
                    {buses.filter(bus => bus.status === 'active').map(bus => (
                      <option key={bus.id} value={bus.id}>
                        {bus.license_plate} - {bus.route}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="direction" className="block text-sm font-medium text-gray-700">
                    Dirección
                  </label>
                  <select
                    id="direction"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={newCount.direction}
                    onChange={(e) => setNewCount({ ...newCount, direction: e.target.value as 'in' | 'out' })}
                  >
                    <option value="in">Entrada (Suben)</option>
                    <option value="out">Salida (Bajan)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="door" className="block text-sm font-medium text-gray-700">
                    Puerta
                  </label>
                  <select
                    id="door"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={newCount.door}
                    onChange={(e) => setNewCount({ ...newCount, door: e.target.value as 'front' | 'back' })}
                  >
                    <option value="front">Delantera</option>
                    <option value="back">Trasera</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="count" className="block text-sm font-medium text-gray-700">
                    Cantidad de Pasajeros
                  </label>
                  <input
                    type="number"
                    id="count"
                    required
                    min="1"
                    max="10"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={newCount.count}
                    onChange={(e) => setNewCount({ ...newCount, count: parseInt(e.target.value) })}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Registrar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Passengers;