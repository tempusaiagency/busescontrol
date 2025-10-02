import React, { useState, useEffect } from 'react';
import { Wrench, Plus, CreditCard as Edit2, Trash2, Save, X, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SortableTable } from '../components/SortableTable';

interface MaintenanceRecord {
  id: string;
  bus_id: string;
  type: 'preventive' | 'corrective' | 'inspection';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  description: string;
  scheduled_date: string;
  completed_date: string | null;
  cost: number;
  labor_cost: number;
  parts_cost: number;
  service_provider: string | null;
  technician: string | null;
  odometer_reading: number | null;
  next_service_date: string | null;
  next_service_km: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Bus {
  id: string;
  license_plate: string;
  driver_name: string;
  route: string;
  status: string;
}

const Maintenance: React.FC = () => {
  const { user } = useAuth();
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);

  const [formData, setFormData] = useState({
    bus_id: '',
    type: 'preventive' as MaintenanceRecord['type'],
    status: 'scheduled' as MaintenanceRecord['status'],
    description: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    completed_date: '',
    cost: 0,
    labor_cost: 0,
    parts_cost: 0,
    service_provider: '',
    technician: '',
    odometer_reading: 0,
    next_service_date: '',
    next_service_km: 0,
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadMaintenanceRecords(), loadBuses()]);
    setLoading(false);
  };

  const loadMaintenanceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      setMaintenanceRecords(data || []);
    } catch (error) {
      console.error('Error loading maintenance records:', error);
    }
  };

  const loadBuses = async () => {
    try {
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .order('id');

      if (error) throw error;
      setBuses(data || []);
    } catch (error) {
      console.error('Error loading buses:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      bus_id: '',
      type: 'preventive',
      status: 'scheduled',
      description: '',
      scheduled_date: new Date().toISOString().split('T')[0],
      completed_date: '',
      cost: 0,
      labor_cost: 0,
      parts_cost: 0,
      service_provider: '',
      technician: '',
      odometer_reading: 0,
      next_service_date: '',
      next_service_km: 0,
      notes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const dataToSave = {
        ...formData,
        cost: Number(formData.cost),
        labor_cost: Number(formData.labor_cost),
        parts_cost: Number(formData.parts_cost),
        odometer_reading: formData.odometer_reading ? Number(formData.odometer_reading) : null,
        next_service_km: formData.next_service_km ? Number(formData.next_service_km) : null,
        completed_date: formData.completed_date || null,
        next_service_date: formData.next_service_date || null,
        service_provider: formData.service_provider || null,
        technician: formData.technician || null,
        notes: formData.notes || null,
        created_by: user.id,
        updated_at: new Date().toISOString()
      };

      if (selectedRecord) {
        const { error } = await supabase
          .from('maintenance_records')
          .update(dataToSave)
          .eq('id', selectedRecord.id);

        if (error) throw error;
        alert('Registro de mantenimiento actualizado exitosamente');
      } else {
        const { error } = await supabase
          .from('maintenance_records')
          .insert([dataToSave]);

        if (error) throw error;
        alert('Registro de mantenimiento creado exitosamente');
      }

      setShowModal(false);
      setSelectedRecord(null);
      resetForm();
      await loadMaintenanceRecords();
    } catch (error: any) {
      console.error('Error saving maintenance record:', error);
      alert('Error al guardar el registro: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este registro de mantenimiento?')) return;

    try {
      const { error } = await supabase
        .from('maintenance_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Registro eliminado exitosamente');
      await loadMaintenanceRecords();
    } catch (error: any) {
      console.error('Error deleting record:', error);
      alert('Error al eliminar el registro: ' + error.message);
    }
  };

  const getStatusBadge = (status: MaintenanceRecord['status']) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const labels = {
      scheduled: 'Programado',
      in_progress: 'En Proceso',
      completed: 'Completado',
      cancelled: 'Cancelado'
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded ${colors[status]}`}>{labels[status]}</span>;
  };

  const getTypeBadge = (type: MaintenanceRecord['type']) => {
    const colors = {
      preventive: 'bg-purple-100 text-purple-800',
      corrective: 'bg-orange-100 text-orange-800',
      inspection: 'bg-cyan-100 text-cyan-800'
    };
    const labels = {
      preventive: 'Preventivo',
      corrective: 'Correctivo',
      inspection: 'Inspección'
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded ${colors[type]}`}>{labels[type]}</span>;
  };

  const getBusName = (busId: string) => {
    const bus = buses.find(b => b.id === busId);
    return bus ? `${bus.id} - ${bus.license_plate}` : busId;
  };

  const totalCost = maintenanceRecords.reduce((sum, record) => sum + Number(record.cost), 0);
  const completedCount = maintenanceRecords.filter(r => r.status === 'completed').length;
  const pendingCount = maintenanceRecords.filter(r => r.status === 'scheduled' || r.status === 'in_progress').length;

  const columns = [
    {
      key: 'bus_id',
      label: 'Bus',
      render: (record: MaintenanceRecord) => (
        <div className="text-sm font-medium text-gray-900">{getBusName(record.bus_id)}</div>
      )
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (record: MaintenanceRecord) => getTypeBadge(record.type)
    },
    {
      key: 'status',
      label: 'Estado',
      render: (record: MaintenanceRecord) => getStatusBadge(record.status)
    },
    {
      key: 'description',
      label: 'Descripción',
      render: (record: MaintenanceRecord) => (
        <div className="text-sm text-gray-900 max-w-xs truncate">{record.description}</div>
      )
    },
    {
      key: 'scheduled_date',
      label: 'Fecha Programada',
      render: (record: MaintenanceRecord) => (
        <div className="text-sm text-gray-500">{new Date(record.scheduled_date).toLocaleDateString()}</div>
      )
    },
    {
      key: 'cost',
      label: 'Costo Total',
      render: (record: MaintenanceRecord) => (
        <div className="text-sm font-medium text-gray-900">${Number(record.cost).toFixed(2)}</div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      render: (record: MaintenanceRecord) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRecord(record);
              setFormData({
                bus_id: record.bus_id,
                type: record.type,
                status: record.status,
                description: record.description,
                scheduled_date: record.scheduled_date,
                completed_date: record.completed_date || '',
                cost: Number(record.cost),
                labor_cost: Number(record.labor_cost),
                parts_cost: Number(record.parts_cost),
                service_provider: record.service_provider || '',
                technician: record.technician || '',
                odometer_reading: record.odometer_reading || 0,
                next_service_date: record.next_service_date || '',
                next_service_km: record.next_service_km || 0,
                notes: record.notes || ''
              });
              setShowModal(true);
            }}
            className="text-blue-600 hover:text-blue-900"
            title="Editar"
          >
            <Edit2 className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(record.id);
            }}
            className="text-red-600 hover:text-red-900"
            title="Eliminar"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Wrench className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Mantenimiento</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Pendientes</p>
                <p className="text-3xl font-bold">{pendingCount}</p>
              </div>
              <AlertTriangle className="h-12 w-12 text-blue-200 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Completados</p>
                <p className="text-3xl font-bold">{completedCount}</p>
              </div>
              <Calendar className="h-12 w-12 text-green-200 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Costo Total</p>
                <p className="text-3xl font-bold">${totalCost.toFixed(2)}</p>
              </div>
              <DollarSign className="h-12 w-12 text-orange-200 opacity-80" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Registros de Mantenimiento</h2>
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  resetForm();
                  setShowModal(true);
                }}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Nuevo Mantenimiento
              </button>
            </div>
          </div>

          <div className="p-6">
            <SortableTable
              data={maintenanceRecords}
              columns={columns}
              keyExtractor={(record) => record.id}
            />
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {selectedRecord ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bus *
                    </label>
                    <select
                      value={formData.bus_id}
                      onChange={(e) => setFormData({ ...formData, bus_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    >
                      <option value="">Seleccionar bus...</option>
                      {buses.map((bus) => (
                        <option key={bus.id} value={bus.id}>
                          {bus.id} - {bus.license_plate}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    >
                      <option value="preventive">Preventivo</option>
                      <option value="corrective">Correctivo</option>
                      <option value="inspection">Inspección</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    >
                      <option value="scheduled">Programado</option>
                      <option value="in_progress">En Proceso</option>
                      <option value="completed">Completado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Programada *
                    </label>
                    <input
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Completación
                    </label>
                    <input
                      type="date"
                      value={formData.completed_date}
                      onChange={(e) => setFormData({ ...formData, completed_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lectura del Odómetro (km)
                    </label>
                    <input
                      type="number"
                      value={formData.odometer_reading}
                      onChange={(e) => setFormData({ ...formData, odometer_reading: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Costo de Mano de Obra
                    </label>
                    <input
                      type="number"
                      value={formData.labor_cost}
                      onChange={(e) => {
                        const laborCost = Number(e.target.value);
                        setFormData({
                          ...formData,
                          labor_cost: laborCost,
                          cost: laborCost + formData.parts_cost
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Costo de Repuestos
                    </label>
                    <input
                      type="number"
                      value={formData.parts_cost}
                      onChange={(e) => {
                        const partsCost = Number(e.target.value);
                        setFormData({
                          ...formData,
                          parts_cost: partsCost,
                          cost: formData.labor_cost + partsCost
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Costo Total
                    </label>
                    <input
                      type="number"
                      value={formData.cost}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proveedor de Servicio
                    </label>
                    <input
                      type="text"
                      value={formData.service_provider}
                      onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Técnico
                    </label>
                    <input
                      type="text"
                      value={formData.technician}
                      onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Próxima Fecha de Servicio
                    </label>
                    <input
                      type="date"
                      value={formData.next_service_date}
                      onChange={(e) => setFormData({ ...formData, next_service_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Próximo Servicio (km)
                    </label>
                    <input
                      type="number"
                      value={formData.next_service_km}
                      onChange={(e) => setFormData({ ...formData, next_service_km: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedRecord(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {selectedRecord ? 'Actualizar' : 'Guardar'}
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

export default Maintenance;
