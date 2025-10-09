import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface DashboardStats {
  totalTrips: number;
  totalRevenue: number;
  totalPassengers: number;
  totalIncidents: number;
  maintenanceCost: number;
  expensesCost: number;
  incidentsCost: number;
  avgOccupancy: number;
}

export interface DashboardData {
  stats: DashboardStats;
  trips: any[];
  incidents: any[];
  maintenance: any[];
  expenses: any[];
  routes: any[];
  routeKmData: any[];
  passengersByHourData: any[];
  paymentMethodsData: any[];
  maintenanceByTypeData: any[];
  avgTripDuration: number;
  revenueByDateData: any[];
  loading: boolean;
  error: string | null;
}

export const useDashboardData = (startDate: string, endDate: string) => {
  const [data, setData] = useState<DashboardData>({
    stats: {
      totalTrips: 0,
      totalRevenue: 0,
      totalPassengers: 0,
      totalIncidents: 0,
      maintenanceCost: 0,
      expensesCost: 0,
      incidentsCost: 0,
      avgOccupancy: 0
    },
    trips: [],
    incidents: [],
    maintenance: [],
    expenses: [],
    routes: [],
    routeKmData: [],
    passengersByHourData: [],
    paymentMethodsData: [],
    maintenanceByTypeData: [],
    avgTripDuration: 0,
    revenueByDateData: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const loadData = async () => {
      setData(prev => ({ ...prev, loading: true, error: null }));

      try {
        const [fareConfirmationsResult, maintenanceResult, expensesResult, busesResult] = await Promise.all([
          supabase
            .from('fare_confirmations')
            .select('*')
            .gte('confirmed_at', startDate)
            .lte('confirmed_at', endDate + 'T23:59:59')
            .order('confirmed_at', { ascending: true }),
          supabase
            .from('maintenance_records')
            .select('*')
            .gte('scheduled_date', startDate)
            .lte('scheduled_date', endDate),
          supabase
            .from('expenses')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate),
          supabase
            .from('buses')
            .select('*')
        ]);

        if (fareConfirmationsResult.error) throw fareConfirmationsResult.error;
        if (maintenanceResult.error) throw maintenanceResult.error;
        if (expensesResult.error) throw expensesResult.error;
        if (busesResult.error) throw busesResult.error;

        const fareConfirmations = fareConfirmationsResult.data || [];
        const maintenance = maintenanceResult.data || [];
        const expenses = expensesResult.data || [];
        const buses = busesResult.data || [];

        const totalRevenue = fareConfirmations.reduce((sum, f) => sum + Number(f.total_fare || 0), 0);
        const totalPassengers = fareConfirmations.reduce((sum, f) => sum + Number(f.passenger_count || 0), 0);
        const maintenanceCost = maintenance.reduce((sum, m) => sum + Number(m.cost || 0), 0);
        const expensesCost = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

        const busRouteMap = new Map();
        buses.forEach(bus => {
          const route = bus.route || 'Sin Ruta';
          busRouteMap.set(route, (busRouteMap.get(route) || 0) + 1);
        });
        const routeKmData = Array.from(busRouteMap.entries()).map(([route, count]) => ({
          route: route.replace('Línea ', '').split(' -')[0],
          km: count * 50
        }));

        const hourMap = new Map();
        fareConfirmations.forEach((fare: any) => {
          if (fare.confirmed_at) {
            const hour = new Date(fare.confirmed_at).getHours();
            const hourLabel = `${hour}:00`;
            const current = hourMap.get(hourLabel) || 0;
            hourMap.set(hourLabel, current + Number(fare.passenger_count || 0));
          }
        });
        const passengersByHourData = Array.from(hourMap.entries())
          .map(([hour, passengers]) => ({ hour, passengers }))
          .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

        const paymentMethodMap = new Map();
        fareConfirmations.forEach((fare: any) => {
          const method = fare.payment_method || 'cash';
          paymentMethodMap.set(method, (paymentMethodMap.get(method) || 0) + Number(fare.total_fare || 0));
        });

        const paymentMethodsData = [
          { name: 'Efectivo', value: paymentMethodMap.get('cash') || 0, color: '#10b981' },
          { name: 'Tarjeta', value: paymentMethodMap.get('card') || 0, color: '#3b82f6' },
          { name: 'QR', value: paymentMethodMap.get('qr') || 0, color: '#8b5cf6' },
          { name: 'Otro', value: paymentMethodMap.get('other') || 0, color: '#f59e0b' }
        ];

        const maintenanceTypeMap = new Map();
        maintenance.forEach((m: any) => {
          const type = m.maintenance_type || 'Otro';
          maintenanceTypeMap.set(type, (maintenanceTypeMap.get(type) || 0) + 1);
        });
        const maintenanceByTypeData = Array.from(maintenanceTypeMap.entries()).map(([type, count]) => ({
          type,
          count
        }));

        const revenueByDateMap = new Map();
        fareConfirmations.forEach((fare: any) => {
          if (fare.confirmed_at) {
            const dateFormatted = new Date(fare.confirmed_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            const existing = revenueByDateMap.get(dateFormatted) || { date: dateFormatted, ingresos: 0, pasajeros: 0 };
            existing.ingresos += Number(fare.total_fare || 0);
            existing.pasajeros += Number(fare.passenger_count || 0);
            revenueByDateMap.set(dateFormatted, existing);
          }
        });
        const revenueByDateData = Array.from(revenueByDateMap.values());

        setData({
          stats: {
            totalTrips: fareConfirmations.length,
            totalRevenue,
            totalPassengers,
            totalIncidents: 0,
            maintenanceCost,
            expensesCost,
            incidentsCost: 0,
            avgOccupancy: totalPassengers > 0 ? (totalPassengers / (buses.length * 40)) * 100 : 0
          },
          trips: fareConfirmations,
          incidents: [],
          maintenance,
          expenses,
          routes: buses,
          routeKmData,
          passengersByHourData,
          paymentMethodsData,
          maintenanceByTypeData,
          avgTripDuration: 45,
          revenueByDateData,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Error loading data'
        }));
      }
    };

    loadData();
  }, [startDate, endDate]);

  return data;
};
