import React from 'react';
import { TrendingUp, Users, DollarSign, Wrench, Sparkles } from 'lucide-react';

export type ReportCategory = 'operations' | 'passengers' | 'finance' | 'maintenance' | 'intelligence';

interface ReportSelectorProps {
  selectedCategory: ReportCategory;
  onSelectCategory: (category: ReportCategory) => void;
}

export const ReportSelector: React.FC<ReportSelectorProps> = ({ selectedCategory, onSelectCategory }) => {
  const categories = [
    {
      id: 'operations' as ReportCategory,
      name: 'Operaciones',
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      description: 'Kilómetros, tiempos, incidencias'
    },
    {
      id: 'passengers' as ReportCategory,
      name: 'Pasajeros',
      icon: Users,
      color: 'from-green-500 to-green-600',
      description: 'Tendencias, ocupación, retención'
    },
    {
      id: 'finance' as ReportCategory,
      name: 'Finanzas',
      icon: DollarSign,
      color: 'from-yellow-500 to-yellow-600',
      description: 'Utilidad, costos, métodos de pago'
    },
    {
      id: 'maintenance' as ReportCategory,
      name: 'Mantenimiento',
      icon: Wrench,
      color: 'from-orange-500 to-orange-600',
      description: 'Fallas, costos, tiempo fuera'
    },
    {
      id: 'intelligence' as ReportCategory,
      name: 'Inteligencia',
      icon: Sparkles,
      color: 'from-purple-500 to-purple-600',
      description: 'Pronósticos, simulaciones'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {categories.map((category) => {
        const Icon = category.icon;
        const isSelected = selectedCategory === category.id;

        return (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`p-6 rounded-lg shadow-md transition-all transform hover:scale-105 ${
              isSelected
                ? `bg-gradient-to-br ${category.color} text-white ring-4 ring-offset-2 ring-blue-400`
                : 'bg-white hover:shadow-lg'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <Icon className={`h-8 w-8 mb-2 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
              <h3 className={`font-bold text-lg mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                {category.name}
              </h3>
              <p className={`text-sm ${isSelected ? 'text-white opacity-90' : 'text-gray-500'}`}>
                {category.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
