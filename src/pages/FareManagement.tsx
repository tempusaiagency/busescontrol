import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Download, Upload, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FareRule {
  id?: string;
  origin: string;
  destination: string;
  price: number;
  currency: string;
  is_active: boolean;
  created_at?: string;
}

export default function FareManagement() {
  const [fares, setFares] = useState<FareRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<FareRule>({
    origin: '',
    destination: '',
    price: 0,
    currency: 'PYG',
    is_active: true
  });

  useEffect(() => {
    loadFares();
  }, []);

  const loadFares = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('route_segments')
        .select('*')
        .eq('is_active', true)
        .order('route_id', { ascending: true })
        .order('segment_number', { ascending: true });

      if (error) throw error;

      const formattedFares: FareRule[] = (data || []).map(segment => ({
        id: segment.id,
        origin: segment.name.split(' - ')[0] || segment.name,
        destination: segment.name.split(' - ')[1] || 'Destino',
        price: segment.fare_amount,
        currency: segment.currency,
        is_active: segment.is_active,
        created_at: segment.created_at
      }));

      setFares(formattedFares);
    } catch (error) {
      console.error('Error loading fares:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.origin || !formData.destination || formData.price <= 0) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }

    try {
      const newSegment = {
        route_id: 'route_custom',
        segment_number: fares.length + 1,
        name: `${formData.origin} - ${formData.destination}`,
        description: `Tarifa de ${formData.origin} a ${formData.destination}`,
        start_lat: -25.2814,
        start_lng: -57.6280,
        end_lat: -25.2814,
        end_lng: -57.6280,
        center_lat: -25.2814,
        center_lng: -57.6280,
        radius_km: 1,
        fare_amount: formData.price,
        currency: formData.currency,
        is_active: formData.is_active
      };

      const { error } = await supabase
        .from('route_segments')
        .insert([newSegment]);

      if (error) throw error;

      setShowAddForm(false);
      setFormData({
        origin: '',
        destination: '',
        price: 0,
        currency: 'PYG',
        is_active: true
      });
      loadFares();
    } catch (error) {
      console.error('Error adding fare:', error);
      alert('Error al agregar tarifa');
    }
  };

  const handleUpdate = async (id: string) => {
    const fare = fares.find(f => f.id === id);
    if (!fare) return;

    try {
      const { error } = await supabase
        .from('route_segments')
        .update({
          name: `${fare.origin} - ${fare.destination}`,
          fare_amount: fare.price
        })
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      loadFares();
    } catch (error) {
      console.error('Error updating fare:', error);
      alert('Error al actualizar tarifa');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta tarifa?')) return;

    try {
      const { error } = await supabase
        .from('route_segments')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      loadFares();
    } catch (error) {
      console.error('Error deleting fare:', error);
      alert('Error al eliminar tarifa');
    }
  };

  const exportToCSV = () => {
    const headers = ['Inicio', 'Destino', 'Precio'];
    const rows = fares.map(fare => [
      fare.origin,
      fare.destination,
      fare.price
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tarifas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          alert('El archivo CSV está vacío o no tiene el formato correcto');
          return;
        }

        const dataLines = lines.slice(1);
        const newFares = [];

        for (const line of dataLines) {
          const [origin, destination, priceStr] = line.split(',').map(s => s.trim());
          const price = parseFloat(priceStr);

          if (origin && destination && !isNaN(price) && price > 0) {
            newFares.push({
              route_id: 'route_custom',
              segment_number: fares.length + newFares.length + 1,
              name: `${origin} - ${destination}`,
              description: `Tarifa de ${origin} a ${destination}`,
              start_lat: -25.2814,
              start_lng: -57.6280,
              end_lat: -25.2814,
              end_lng: -57.6280,
              center_lat: -25.2814,
              center_lng: -57.6280,
              radius_km: 1,
              fare_amount: price,
              currency: 'PYG',
              is_active: true
            });
          }
        }

        if (newFares.length === 0) {
          alert('No se encontraron tarifas válidas en el archivo');
          return;
        }

        const { error } = await supabase
          .from('route_segments')
          .insert(newFares);

        if (error) throw error;

        alert(`Se importaron ${newFares.length} tarifas correctamente`);
        loadFares();
      } catch (error) {
        console.error('Error importing CSV:', error);
        alert('Error al importar archivo CSV');
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const updateFareField = (id: string, field: keyof FareRule, value: any) => {
    setFares(fares.map(fare =>
      fare.id === id ? { ...fare, [field]: value } : fare
    ));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Tarifas</h1>
        <p className="text-gray-600">Administre las tarifas del sistema de cobro</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva Tarifa
        </button>

        <button
          onClick={exportToCSV}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-5 w-5 mr-2" />
          Exportar CSV
        </button>

        <label className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
          <Upload className="h-5 w-5 mr-2" />
          Importar CSV
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {showAddForm && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Nueva Tarifa</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inicio
              </label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Terminal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destino
              </label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Centro"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio (₲)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5000"
                min="0"
                step="1000"
              />
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="h-5 w-5 mr-2" />
            Guardar Tarifa
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Cargando tarifas...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fares.map((fare) => (
                  <tr key={fare.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === fare.id ? (
                        <input
                          type="text"
                          value={fare.origin}
                          onChange={(e) => updateFareField(fare.id!, 'origin', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{fare.origin}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === fare.id ? (
                        <input
                          type="text"
                          value={fare.destination}
                          onChange={(e) => updateFareField(fare.id!, 'destination', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{fare.destination}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === fare.id ? (
                        <input
                          type="number"
                          value={fare.price}
                          onChange={(e) => updateFareField(fare.id!, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          min="0"
                          step="1000"
                        />
                      ) : (
                        <div className="text-sm font-semibold text-gray-900">
                          ₲ {fare.price.toLocaleString('es-PY')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === fare.id ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleUpdate(fare.id!)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Guardar"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Cancelar"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setEditingId(fare.id!)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(fare.id!)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {fares.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No hay tarifas registradas. Agregue una nueva tarifa o importe desde CSV.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Formato CSV para Importación</h4>
        <p className="text-sm text-blue-800 mb-2">
          El archivo CSV debe tener la siguiente estructura (primera línea de encabezados):
        </p>
        <div className="bg-white rounded p-3 font-mono text-sm text-gray-700">
          Inicio,Destino,Precio<br />
          Terminal,Centro,5000<br />
          Centro,Costanera,7000<br />
          Costanera,Recoleta,8000
        </div>
      </div>
    </div>
  );
}
