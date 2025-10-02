import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export type DateFilterType = 'custom' | 'month' | 'year' | 'all';

interface DateFilterProps {
  dateFilterType: DateFilterType;
  selectedMonth: string;
  selectedYear: string;
  startDate: string;
  endDate: string;
  onFilterTypeChange: (type: DateFilterType) => void;
  onMonthChange: (month: string) => void;
  onYearChange: (year: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export const DateFilter: React.FC<DateFilterProps> = ({
  dateFilterType,
  selectedMonth,
  selectedYear,
  startDate,
  endDate,
  onFilterTypeChange,
  onMonthChange,
  onYearChange,
  onStartDateChange,
  onEndDateChange
}) => {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Calendar className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Filtro de Periodo</h3>
          <p className="text-sm text-gray-500">Selecciona el rango de fechas para analizar</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => onFilterTypeChange('month')}
          className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
            dateFilterType === 'month'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <div className="flex flex-col items-center">
            <span className="text-sm">Por Mes</span>
            {dateFilterType === 'month' && (
              <span className="text-xs opacity-90 mt-1 capitalize">
                {(() => {
                  const [year, month] = selectedMonth.split('-');
                  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                  return `${monthNames[parseInt(month) - 1]} ${year}`;
                })()}
              </span>
            )}
          </div>
        </button>

        <button
          onClick={() => onFilterTypeChange('year')}
          className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
            dateFilterType === 'year'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <div className="flex flex-col items-center">
            <span className="text-sm">Por Año</span>
            {dateFilterType === 'year' && (
              <span className="text-xs opacity-90 mt-1">{selectedYear}</span>
            )}
          </div>
        </button>

        <button
          onClick={() => onFilterTypeChange('custom')}
          className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
            dateFilterType === 'custom'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <div className="flex flex-col items-center">
            <span className="text-sm">Personalizado</span>
            {dateFilterType === 'custom' && (
              <span className="text-xs opacity-90 mt-1">Rango</span>
            )}
          </div>
        </button>

        <button
          onClick={() => onFilterTypeChange('all')}
          className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
            dateFilterType === 'all'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <div className="flex flex-col items-center">
            <span className="text-sm">Todo</span>
            {dateFilterType === 'all' && (
              <span className="text-xs opacity-90 mt-1">Histórico</span>
            )}
          </div>
        </button>
      </div>

      {dateFilterType === 'month' && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Mes
          </label>
          <div className="relative">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
            />
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Mostrando datos desde {startDate.split('-').reverse().join('/')} hasta {endDate.split('-').reverse().join('/')}
          </p>
        </div>
      )}

      {dateFilterType === 'year' && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Año
          </label>
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
            >
              {Array.from({ length: 10 }, (_, i) => {
                const year = 2025 - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Mostrando todo el año {selectedYear}
          </p>
        </div>
      )}

      {dateFilterType === 'custom' && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Rango: {startDate.split('-').reverse().join('/')} - {endDate.split('-').reverse().join('/')}
          </p>
        </div>
      )}

      {dateFilterType === 'all' && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <p className="text-sm text-blue-800">
            Mostrando todos los datos históricos disponibles en el sistema
          </p>
        </div>
      )}
    </div>
  );
};
