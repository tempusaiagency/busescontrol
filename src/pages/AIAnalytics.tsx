import React, { useState } from 'react';
import { Brain, TrendingUp, Clock, DollarSign, AlertTriangle, Map, BarChart3 } from 'lucide-react';
import PassengerDemand from '../components/AI/PassengerDemand';
import TravelTimePredictor from '../components/AI/TravelTimePredictor';
import CostForecasting from '../components/AI/CostForecasting';
import RiskyDrivingDetection from '../components/AI/RiskyDrivingDetection';

type AIModule = 'demand' | 'travel-time' | 'cost' | 'risky-driving';

export default function AIAnalytics() {
  const [activeModule, setActiveModule] = useState<AIModule>('demand');

  const modules = [
    {
      id: 'demand' as AIModule,
      name: 'Demanda de Pasajeros',
      icon: TrendingUp,
      description: 'Predicción de demanda por ruta, parada y horario',
      color: 'blue'
    },
    {
      id: 'travel-time' as AIModule,
      name: 'Tiempos de Viaje',
      icon: Clock,
      description: 'ETA y puntualidad por tramo',
      color: 'green'
    },
    {
      id: 'cost' as AIModule,
      name: 'Pronóstico de Costos',
      icon: DollarSign,
      description: 'Predicción de combustible y utilidades',
      color: 'orange'
    },
    {
      id: 'risky-driving' as AIModule,
      name: 'Conducción Riesgosa',
      icon: AlertTriangle,
      description: 'Detección de eventos de riesgo en tiempo real',
      color: 'red'
    }
  ];

  const renderModule = () => {
    switch (activeModule) {
      case 'demand':
        return <PassengerDemand />;
      case 'travel-time':
        return <TravelTimePredictor />;
      case 'cost':
        return <CostForecasting />;
      case 'risky-driving':
        return <RiskyDrivingDetection />;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Analítica con IA</h1>
        </div>
        <p className="text-gray-600">
          Predicciones inteligentes para optimizar operaciones y reducir costos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {modules.map((module) => {
          const Icon = module.icon;
          const isActive = activeModule === module.id;

          return (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                isActive
                  ? `border-${module.color}-500 bg-${module.color}-50 shadow-md`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Icon
                className={`h-8 w-8 mb-3 ${
                  isActive ? `text-${module.color}-600` : 'text-gray-400'
                }`}
              />
              <h3 className="font-semibold text-gray-900 mb-1">{module.name}</h3>
              <p className="text-sm text-gray-600">{module.description}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {renderModule()}
      </div>
    </div>
  );
}
