import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Bus, Plus, Edit2, Trash2, User, MapPin, Users, DollarSign } from 'lucide-react';
import type { Bus as BusType } from '../contexts/DataContext';

const Buses: React.FC = () => {
  const { buses, addBus, updateBus, deleteBus } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<BusType | null>(null);
  const [formData, setFormData] = useState({
    license_plate: '',
    driver_name: '',
    route: '',
    max_capacity: 40,
    fare_per_passenger: 5000,
    status: 'active' as const
  });

  const handleOpenModal = (bus?: BusType) => {
    if (bus) {
      setEditingBus(bus);
      setFormData({
        license_plate: bus.license_plate,
        driver_name: bus.driver_name,
        route: bus.route,
        max_capacity: bus.max_capacity,
        fare_per_passenger: bus.fare_per_passenger,
        status: bus.status
      });
    } else {
      setEditingBus(null);
      setFormData({
        license_plate: '',
        driver_name: '',
        route: '',
        max_capacity: 40,
        fare_per_passenger: 5000,
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBus(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBus) {
      updateBus({
        ...editingBus,
        ...formData
      });
    } else {
      addBus(formData);
    }
    
    handleCloseModal();
  };

  const handleDelete = (busId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este bus?')) {
      deleteBus(busId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'maintenance':
        return 'Mantenimiento';
      case 'inactive':
        return 'Inactivo';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Buses</h1>
          <p className="mt-2 text-gray-600">
            Administra la flota de buses, conductores y rutas
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo Bus</span>
        </button>
      </div>

      {/* Bus Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buses.map((bus) => {
          const occupancyPercentage = (bus.current_passengers / bus.max_capacity) * 100;
          
          return (
            <div key={bus.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Bus className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{bus.license_plate}</h3>
                      <p className="text-sm text-gray-500">{bus.id}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bus.status)}`}>
                    {getStatusText(bus.status)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{bus.driver_name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{bus.route}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {bus.current_passengers}/{bus.max_capacity} pasajeros
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">
                      ₲{bus.fare_per_passenger.toLocaleString('es-PY')} por pasajero
                    </span>
                  </div>

                  {/* Occupancy Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Ocupación</span>
                      <span className="font-medium">{occupancyPercentage.toFixed(0)}%</span>
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
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleOpenModal(bus)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(bus.id)}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingBus ? 'Editar Bus' : 'Nuevo Bus'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="license_plate" className="block text-sm font-medium text-gray-700">
                    Matrícula
                  </label>
                  <input
                    type="text"
                    id="license_plate"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="driver_name" className="block text-sm font-medium text-gray-700">
                    Conductor
                  </label>
                  <input
                    type="text"
                    id="driver_name"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.driver_name}
                    onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="route" className="block text-sm font-medium text-gray-700">
                    Ruta
                  </label>
                  <input
                    type="text"
                    id="route"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.route}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="max_capacity" className="block text-sm font-medium text-gray-700">
                    Capacidad Máxima
                  </label>
                  <input
                    type="number"
                    id="max_capacity"
                    required
                    min="1"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.max_capacity}
                    onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <label htmlFor="fare_per_passenger" className="block text-sm font-medium text-gray-700">
                    Tarifa por Pasajero
                  </label>
                  <input
                    type="number"
                    id="fare_per_passenger"
                    required
                    min="0"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.fare_per_passenger}
                    onChange={(e) => setFormData({ ...formData, fare_per_passenger: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Estado
                  </label>
                  <select
                    id="status"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="active">Activo</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    {editingBus ? 'Actualizar' : 'Crear'}
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

export default Buses;