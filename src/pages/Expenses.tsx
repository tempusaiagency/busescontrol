import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreditCard, Plus, Trash2, Filter, DollarSign, Fuel, Wrench, Car, Shield, User, MoreHorizontal } from 'lucide-react';
import type { Expense } from '../contexts/DataContext';

const Expenses: React.FC = () => {
  const { buses, expenses, addExpense, deleteExpense } = useData();
  const [selectedBus, setSelectedBus] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedType, setSelectedType] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    bus_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'fuel' as Expense['type'],
    amount: 0,
    description: ''
  });

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesBus = !selectedBus || expense.bus_id === selectedBus;
    const matchesDate = expense.date === selectedDate;
    const matchesType = !selectedType || expense.type === selectedType;
    return matchesBus && matchesDate && matchesType;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate daily totals
  const dailyTotals = filteredExpenses.reduce((acc, expense) => {
    acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
    acc.total = (acc.total || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense(newExpense);
    setIsAddModalOpen(false);
    setNewExpense({
      bus_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'fuel',
      amount: 0,
      description: ''
    });
  };

  const handleDelete = (expenseId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      deleteExpense(expenseId);
    }
  };

  const getBusName = (busId: string) => {
    const bus = buses.find(b => b.id === busId);
    return bus ? `${bus.license_plate} - ${bus.route}` : busId;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fuel':
        return <Fuel className="h-5 w-5 text-red-600" />;
      case 'maintenance':
        return <Wrench className="h-5 w-5 text-orange-600" />;
      case 'tolls':
        return <Car className="h-5 w-5 text-yellow-600" />;
      case 'salary':
        return <User className="h-5 w-5 text-green-600" />;
      case 'insurance':
        return <Shield className="h-5 w-5 text-blue-600" />;
      default:
        return <MoreHorizontal className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeName = (type: string) => {
    const names = {
      fuel: 'Combustible',
      maintenance: 'Mantenimiento',
      tolls: 'Peajes',
      salary: 'Sueldos',
      insurance: 'Seguros',
      other: 'Otros'
    };
    return names[type as keyof typeof names] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      fuel: 'bg-red-100 text-red-800',
      maintenance: 'bg-orange-100 text-orange-800',
      tolls: 'bg-yellow-100 text-yellow-800',
      salary: 'bg-green-100 text-green-800',
      insurance: 'bg-blue-100 text-blue-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Control de Gastos</h1>
          <p className="mt-2 text-gray-600">
            Registro y seguimiento de gastos operativos por bus
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo Gasto</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Gasto
            </label>
            <select
              id="type-filter"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="fuel">Combustible</option>
              <option value="maintenance">Mantenimiento</option>
              <option value="tolls">Peajes</option>
              <option value="salary">Sueldos</option>
              <option value="insurance">Seguros</option>
              <option value="other">Otros</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Resumen de Gastos - {format(new Date(selectedDate), 'dd/MM/yyyy', { locale: es })}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-gray-100">
                <DollarSign className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <h4 className="text-2xl font-bold text-gray-900">
                  ₲{(dailyTotals.total || 0).toLocaleString('es-PY')}
                </h4>
                <p className="text-sm text-gray-600">Total Gastos</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100">
                <Fuel className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h4 className="text-2xl font-bold text-gray-900">
                  ₲{(dailyTotals.fuel || 0).toLocaleString('es-PY')}
                </h4>
                <p className="text-sm text-gray-600">Combustible</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-100">
                <Wrench className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h4 className="text-2xl font-bold text-gray-900">
                  ₲{(dailyTotals.maintenance || 0).toLocaleString('es-PY')}
                </h4>
                <p className="text-sm text-gray-600">Mantenimiento</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h4 className="text-2xl font-bold text-gray-900">
                  ₲{(dailyTotals.salary || 0).toLocaleString('es-PY')}
                </h4>
                <p className="text-sm text-gray-600">Sueldos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Registro de Gastos - {format(new Date(selectedDate), 'dd/MM/yyyy', { locale: es })}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.length > 0 ? filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getBusName(expense.bus_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTypeIcon(expense.type)}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(expense.type)}`}>
                        {getTypeName(expense.type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₲{expense.amount.toLocaleString('es-PY')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {expense.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-red-600 hover:text-red-900 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No hay gastos registrados para los filtros seleccionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Registrar Nuevo Gasto</h3>
                <p className="text-sm text-gray-600 mt-1">Agrega un gasto operativo al sistema</p>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label htmlFor="expense_bus_id" className="block text-sm font-medium text-gray-700">
                    Bus
                  </label>
                  <select
                    id="expense_bus_id"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={newExpense.bus_id}
                    onChange={(e) => setNewExpense({ ...newExpense, bus_id: e.target.value })}
                  >
                    <option value="">Selecciona un bus</option>
                    {buses.map(bus => (
                      <option key={bus.id} value={bus.id}>
                        {bus.license_plate} - {bus.route}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="expense_date" className="block text-sm font-medium text-gray-700">
                    Fecha
                  </label>
                  <input
                    type="date"
                    id="expense_date"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="expense_type" className="block text-sm font-medium text-gray-700">
                    Tipo de Gasto
                  </label>
                  <select
                    id="expense_type"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={newExpense.type}
                    onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value as Expense['type'] })}
                  >
                    <option value="fuel">Combustible</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="tolls">Peajes</option>
                    <option value="salary">Sueldos</option>
                    <option value="insurance">Seguros</option>
                    <option value="other">Otros</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="expense_amount" className="block text-sm font-medium text-gray-700">
                    Monto
                  </label>
                  <input
                    type="number"
                    id="expense_amount"
                    required
                    min="0"
                    step="100"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label htmlFor="expense_description" className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    id="expense_description"
                    required
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="Describe el gasto..."
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
                    Registrar Gasto
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

export default Expenses;