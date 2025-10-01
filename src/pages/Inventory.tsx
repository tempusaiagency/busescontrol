import React, { useState, useEffect } from 'react';
import { Package, Plus, Minus, CreditCard as Edit2, Trash2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface InventoryItem {
  id: string;
  name: string;
  category: 'parts' | 'supplies' | 'tools' | 'fuel' | 'other';
  quantity: number;
  unit: string;
  min_quantity: number;
  max_quantity: number;
  unit_cost: number;
  supplier: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface InventoryTransaction {
  id: string;
  item_id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  unit_cost: number | null;
  reference: string | null;
  bus_id: string | null;
  notes: string | null;
  created_at: string;
}

const Inventory: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    category: 'parts' as InventoryItem['category'],
    quantity: 0,
    unit: 'pieces',
    min_quantity: 10,
    max_quantity: 1000,
    unit_cost: 0,
    supplier: '',
    location: '',
    notes: ''
  });

  const [transactionData, setTransactionData] = useState({
    type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 0,
    unit_cost: 0,
    reference: '',
    bus_id: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadInventory();
      loadTransactions();
    }
  }, [user]);

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (selectedItem) {
        const { error } = await supabase
          .from('inventory_items')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('inventory_items')
          .insert([{
            ...formData,
            user_id: user.id
          }]);

        if (error) throw error;
      }

      setShowAddModal(false);
      setSelectedItem(null);
      resetForm();
      loadInventory();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error al guardar el artículo');
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedItem) return;

    try {
      const { error: transError } = await supabase
        .from('inventory_transactions')
        .insert([{
          ...transactionData,
          item_id: selectedItem.id,
          user_id: user.id
        }]);

      if (transError) throw transError;

      let newQuantity = selectedItem.quantity;
      if (transactionData.type === 'in') {
        newQuantity += transactionData.quantity;
      } else if (transactionData.type === 'out') {
        newQuantity -= transactionData.quantity;
      } else {
        newQuantity = transactionData.quantity;
      }

      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({
          quantity: Math.max(0, newQuantity),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItem.id);

      if (updateError) throw updateError;

      setShowTransactionModal(false);
      setSelectedItem(null);
      resetTransactionForm();
      loadInventory();
      loadTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Error al guardar la transacción');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este artículo?')) return;

    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error al eliminar el artículo');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'parts',
      quantity: 0,
      unit: 'pieces',
      min_quantity: 10,
      max_quantity: 1000,
      unit_cost: 0,
      supplier: '',
      location: '',
      notes: ''
    });
  };

  const resetTransactionForm = () => {
    setTransactionData({
      type: 'in',
      quantity: 0,
      unit_cost: 0,
      reference: '',
      bus_id: '',
      notes: ''
    });
  };

  const openEditModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      min_quantity: item.min_quantity,
      max_quantity: item.max_quantity,
      unit_cost: item.unit_cost,
      supplier: item.supplier || '',
      location: item.location || '',
      notes: item.notes || ''
    });
    setShowAddModal(true);
  };

  const openTransactionModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setTransactionData({
      type: 'in',
      quantity: 0,
      unit_cost: item.unit_cost,
      reference: '',
      bus_id: '',
      notes: ''
    });
    setShowTransactionModal(true);
  };

  const filteredItems = items.filter(item =>
    filterCategory === 'all' || item.category === filterCategory
  );

  const lowStockItems = items.filter(item => item.quantity <= item.min_quantity);
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);

  const categoryNames = {
    parts: 'Repuestos',
    supplies: 'Suministros',
    tools: 'Herramientas',
    fuel: 'Combustible',
    other: 'Otros'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Cargando inventario...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
        <button
          onClick={() => {
            setSelectedItem(null);
            resetForm();
            setShowAddModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Agregar Artículo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Artículos</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
            <Package className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">
                ₲{totalValue.toLocaleString('es-PY')}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">Alertas de Stock Bajo</h3>
              <p className="text-sm text-red-700 mt-1">
                Los siguientes artículos están por debajo del nivel mínimo:
              </p>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {lowStockItems.map(item => (
                  <li key={item.id}>
                    {item.name} - {item.quantity} {item.unit} (mínimo: {item.min_quantity})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {Object.entries(categoryNames).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilterCategory(key)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterCategory === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Artículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo Unitario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.supplier && (
                          <div className="text-xs text-gray-500">Proveedor: {item.supplier}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {categoryNames[item.category]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900">
                        {item.quantity} {item.unit}
                      </div>
                      {item.quantity <= item.min_quantity && (
                        <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Min: {item.min_quantity} / Max: {item.max_quantity}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₲{item.unit_cost.toLocaleString('es-PY')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₲{(item.quantity * item.unit_cost).toLocaleString('es-PY')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.location || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openTransactionModal(item)}
                        className="text-green-600 hover:text-green-900"
                        title="Registrar movimiento"
                      >
                        <TrendingUp className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {selectedItem ? 'Editar Artículo' : 'Agregar Artículo'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as InventoryItem['category'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {Object.entries(categoryNames).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidad
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad Mínima
                    </label>
                    <input
                      type="number"
                      value={formData.min_quantity}
                      onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad Máxima
                    </label>
                    <input
                      type="number"
                      value={formData.max_quantity}
                      onChange={(e) => setFormData({ ...formData, max_quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Costo Unitario
                    </label>
                    <input
                      type="number"
                      value={formData.unit_cost}
                      onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proveedor
                    </label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedItem(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {selectedItem ? 'Actualizar' : 'Agregar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showTransactionModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Registrar Movimiento</h2>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Artículo</p>
                <p className="font-medium">{selectedItem.name}</p>
                <p className="text-sm text-gray-600 mt-2">Stock actual: {selectedItem.quantity} {selectedItem.unit}</p>
              </div>

              <form onSubmit={handleTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Movimiento
                  </label>
                  <select
                    value={transactionData.type}
                    onChange={(e) => setTransactionData({ ...transactionData, type: e.target.value as 'in' | 'out' | 'adjustment' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="in">Entrada</option>
                    <option value="out">Salida</option>
                    <option value="adjustment">Ajuste</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    value={transactionData.quantity}
                    onChange={(e) => setTransactionData({ ...transactionData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo Unitario
                  </label>
                  <input
                    type="number"
                    value={transactionData.unit_cost}
                    onChange={(e) => setTransactionData({ ...transactionData, unit_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referencia
                  </label>
                  <input
                    type="text"
                    value={transactionData.reference}
                    onChange={(e) => setTransactionData({ ...transactionData, reference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Orden de compra #123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bus ID (opcional)
                  </label>
                  <input
                    type="text"
                    value={transactionData.bus_id}
                    onChange={(e) => setTransactionData({ ...transactionData, bus_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Si aplica a un bus específico"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={transactionData.notes}
                    onChange={(e) => setTransactionData({ ...transactionData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransactionModal(false);
                      setSelectedItem(null);
                      resetTransactionForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

export default Inventory;
