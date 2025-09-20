import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Bus {
  id: string;
  license_plate: string;
  driver_name: string;
  route: string;
  current_passengers: number;
  max_capacity: number;
  fare_per_passenger: number;
  status: 'active' | 'maintenance' | 'inactive';
}

export interface PassengerCount {
  id: string;
  bus_id: string;
  timestamp: string;
  door: 'front' | 'back';
  direction: 'in' | 'out';
  count: number;
}

export interface Expense {
  id: string;
  bus_id: string;
  date: string;
  type: 'fuel' | 'maintenance' | 'tolls' | 'salary' | 'insurance' | 'other';
  amount: number;
  description: string;
}

export interface DailyReport {
  bus_id: string;
  date: string;
  passengers: number;
  revenue: number;
  expenses: {
    fuel: number;
    maintenance: number;
    salary: number;
    other: number;
  };
  total_expenses: number;
  profit: number;
}

interface DataContextType {
  buses: Bus[];
  passengerCounts: PassengerCount[];
  expenses: Expense[];
  addBus: (bus: Omit<Bus, 'id' | 'current_passengers'>) => void;
  updateBus: (bus: Bus) => void;
  deleteBus: (id: string) => void;
  addPassengerCount: (count: Omit<PassengerCount, 'id'>) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  getDailyReport: (busId: string, date: string) => DailyReport;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [buses, setBuses] = useState<Bus[]>([
    {
      id: 'BUS-001',
      license_plate: 'ABC-123',
      driver_name: 'Juan Pérez',
      route: 'Centro - Terminal',
      current_passengers: 0,
      max_capacity: 40,
      fare_per_passenger: 5000,
      status: 'active'
    },
    {
      id: 'BUS-002',
      license_plate: 'DEF-456',
      driver_name: 'María González',
      route: 'Universidad - Centro',
      current_passengers: 0,
      max_capacity: 35,
      fare_per_passenger: 4500,
      status: 'active'
    }
  ]);

  const [passengerCounts, setPassengerCounts] = useState<PassengerCount[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Generate sample data on mount
  useEffect(() => {
    generateSampleData();
  }, []);

  const generateSampleData = () => {
    const today = new Date();
    const sampleCounts: PassengerCount[] = [];
    const sampleExpenses: Expense[] = [];

    // Generate passenger counts for the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      buses.forEach((bus, busIndex) => {
        // Generate random passenger events throughout the day
        for (let hour = 6; hour < 22; hour++) {
          const inPassengers = Math.floor(Math.random() * 5) + 1;
          const outPassengers = Math.floor(Math.random() * 4) + 1;
          
          sampleCounts.push({
            id: `count-${bus.id}-${i}-${hour}-in`,
            bus_id: bus.id,
            timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, Math.floor(Math.random() * 60)).toISOString(),
            door: 'front',
            direction: 'in',
            count: inPassengers
          });

          if (Math.random() > 0.3) { // 70% chance of passengers getting off
            sampleCounts.push({
              id: `count-${bus.id}-${i}-${hour}-out`,
              bus_id: bus.id,
              timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, Math.floor(Math.random() * 60) + 30).toISOString(),
              door: 'back',
              direction: 'out',
              count: outPassengers
            });
          }
        }
      });

      // Generate expenses for some days
      if (Math.random() > 0.4) {
        buses.forEach(bus => {
          const expenseTypes: Expense['type'][] = ['fuel', 'maintenance', 'tolls', 'salary'];
          const randomType = expenseTypes[Math.floor(Math.random() * expenseTypes.length)];
          let amount = 0;
          
          switch (randomType) {
            case 'fuel':
              amount = Math.floor(Math.random() * 200000) + 300000;
              break;
            case 'maintenance':
              amount = Math.floor(Math.random() * 500000) + 100000;
              break;
            case 'tolls':
              amount = Math.floor(Math.random() * 50000) + 10000;
              break;
            case 'salary':
              amount = 300000; // Fixed daily salary
              break;
          }

          sampleExpenses.push({
            id: `expense-${bus.id}-${i}-${randomType}`,
            bus_id: bus.id,
            date: date.toISOString().split('T')[0],
            type: randomType,
            amount,
            description: `${randomType} para ${bus.license_plate}`
          });
        });
      }
    }

    setPassengerCounts(sampleCounts);
    setExpenses(sampleExpenses);
  };

  const addBus = (busData: Omit<Bus, 'id' | 'current_passengers'>) => {
    const newBus: Bus = {
      ...busData,
      id: `BUS-${String(buses.length + 1).padStart(3, '0')}`,
      current_passengers: 0
    };
    setBuses(prev => [...prev, newBus]);
  };

  const updateBus = (updatedBus: Bus) => {
    setBuses(prev => prev.map(bus => bus.id === updatedBus.id ? updatedBus : bus));
  };

  const deleteBus = (id: string) => {
    setBuses(prev => prev.filter(bus => bus.id !== id));
  };

  const addPassengerCount = (countData: Omit<PassengerCount, 'id'>) => {
    const newCount: PassengerCount = {
      ...countData,
      id: `count-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setPassengerCounts(prev => [...prev, newCount]);

    // Update current passengers count for the bus
    setBuses(prev => prev.map(bus => {
      if (bus.id === countData.bus_id) {
        const change = countData.direction === 'in' ? countData.count : -countData.count;
        return {
          ...bus,
          current_passengers: Math.max(0, Math.min(bus.max_capacity, bus.current_passengers + change))
        };
      }
      return bus;
    }));
  };

  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setExpenses(prev => [...prev, newExpense]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const getDailyReport = (busId: string, date: string): DailyReport => {
    const bus = buses.find(b => b.id === busId);
    if (!bus) {
      return {
        bus_id: busId,
        date,
        passengers: 0,
        revenue: 0,
        expenses: { fuel: 0, maintenance: 0, salary: 0, other: 0 },
        total_expenses: 0,
        profit: 0
      };
    }

    // Calculate passengers for the day
    const dayStart = new Date(date + 'T00:00:00');
    const dayEnd = new Date(date + 'T23:59:59');
    
    const dayCounts = passengerCounts.filter(count => {
      const countDate = new Date(count.timestamp);
      return count.bus_id === busId && countDate >= dayStart && countDate <= dayEnd;
    });

    const totalPassengers = dayCounts
      .filter(count => count.direction === 'in')
      .reduce((sum, count) => sum + count.count, 0);

    const revenue = totalPassengers * bus.fare_per_passenger;

    // Calculate expenses for the day
    const dayExpenses = expenses.filter(expense => 
      expense.bus_id === busId && expense.date === date
    );

    const expensesByType = {
      fuel: dayExpenses.filter(e => e.type === 'fuel').reduce((sum, e) => sum + e.amount, 0),
      maintenance: dayExpenses.filter(e => e.type === 'maintenance').reduce((sum, e) => sum + e.amount, 0),
      salary: dayExpenses.filter(e => e.type === 'salary').reduce((sum, e) => sum + e.amount, 0),
      other: dayExpenses.filter(e => ['tolls', 'insurance', 'other'].includes(e.type)).reduce((sum, e) => sum + e.amount, 0)
    };

    const totalExpenses = Object.values(expensesByType).reduce((sum, amount) => sum + amount, 0);

    return {
      bus_id: busId,
      date,
      passengers: totalPassengers,
      revenue,
      expenses: expensesByType,
      total_expenses: totalExpenses,
      profit: revenue - totalExpenses
    };
  };

  const value = {
    buses,
    passengerCounts,
    expenses,
    addBus,
    updateBus,
    deleteBus,
    addPassengerCount,
    addExpense,
    deleteExpense,
    getDailyReport
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};