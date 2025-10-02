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
        const [tripsResult, incidentsResult, maintenanceResult, expensesResult, routesResult] = await Promise.all([
          supabase
            .from('trips')
            .select('*, routes(name, distance_km)')
            .gte('start_time', startDate)
            .lte('start_time', endDate + 'T23:59:59')
            .order('start_time', { ascending: true }),
          supabase
            .from('operational_incidents')
            .select('*')
            .gte('reported_at', startDate)
            .lte('reported_at', endDate + 'T23:59:59'),
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
            .from('routes')
            .select('*')
        ]);

        if (tripsResult.error) throw tripsResult.error;
        if (incidentsResult.error) throw incidentsResult.error;
        if (maintenanceResult.error) throw maintenanceResult.error;
        if (expensesResult.error) throw expensesResult.error;
        if (routesResult.error) throw routesResult.error;

        const trips = tripsResult.data || [];
        const incidents = incidentsResult.data || [];
        const maintenance = maintenanceResult.data || [];
        const expenses = expensesResult.data || [];
        const routes = routesResult.data || [];

        const totalRevenue = trips.reduce((sum, t) => sum + Number(t.revenue || 0), 0);
        const totalPassengers = trips.reduce((sum, t) => sum + Number(t.passenger_count || 0), 0);
        const maintenanceCost = maintenance.reduce((sum, m) => sum + Number(m.cost || 0), 0);
        const expensesCost = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const incidentsCost = incidents.reduce((sum, i) => sum + Number(i.cost || 0), 0);

        const tripsWithSeats = trips.filter(t => t.seats_available > 0);
        const avgOccupancy = tripsWithSeats.length > 0
          ? tripsWithSeats.reduce((sum, t) => {
              const totalSeats = Number(t.passenger_count) + Number(t.seats_available);
              return sum + (totalSeats > 0 ? (Number(t.passenger_count) / totalSeats) * 100 : 0);
            }, 0) / tripsWithSeats.length
          : 0;

        const routeKmMap = new Map();
        trips.forEach((trip: any) => {
          if (trip.routes && trip.distance_km) {
            const routeName = trip.routes.name || 'Sin Ruta';
            const currentKm = routeKmMap.get(routeName) || 0;
            routeKmMap.set(routeName, currentKm + Number(trip.distance_km));
          }
        });
        const routeKmData = Array.from(routeKmMap.entries()).map(([route, km]) => ({
          route: route.replace('Ruta ', '').split(' -')[0],
          km: Math.round(km as number)
        }));

        const hourMap = new Map();
        trips.forEach((trip: any) => {
          if (trip.start_time) {
            const hour = new Date(trip.start_time).getHours();
            const hourLabel = `${hour}:00`;
            const current = hourMap.get(hourLabel) || 0;
            hourMap.set(hourLabel, current + Number(trip.passenger_count || 0));
          }
        });
        const passengersByHourData = Array.from(hourMap.entries())
          .map(([hour, passengers]) => ({ hour, passengers }))
          .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

        const totalCash = trips.reduce((sum: number, t: any) => sum + Number(t.payment_method_cash || 0), 0);
        const totalCard = trips.reduce((sum: number, t: any) => sum + Number(t.payment_method_card || 0), 0);
        const totalQR = trips.reduce((sum: number, t: any) => sum + Number(t.payment_method_qr || 0), 0);
        const paymentMethodsData = [
          { name: 'Efectivo', value: totalCash, color: '#10b981' },
          { name: 'Tarjeta', value: totalCard, color: '#3b82f6' },
          { name: 'QR', value: totalQR, color: '#8b5cf6' }
        ];

        const maintenanceTypeMap = new Map();
        maintenance.forEach((m: any) => {
          const type = m.type || 'other';
          const typeLabel = type === 'preventive' ? 'Preventivo' :
                           type === 'corrective' ? 'Correctivo' :
                           type === 'inspection' ? 'Inspección' : 'Otro';
          const count = maintenanceTypeMap.get(typeLabel) || 0;
          maintenanceTypeMap.set(typeLabel, count + 1);
        });
        const maintenanceByTypeData = Array.from(maintenanceTypeMap.entries()).map(([type, count]) => ({
          type,
          count
        }));

        const tripsWithDuration = trips.filter((t: any) => t.start_time && t.end_time);
        const avgTripDuration = tripsWithDuration.length > 0
          ? Math.round(tripsWithDuration.reduce((sum: number, t: any) => {
              const start = new Date(t.start_time).getTime();
              const end = new Date(t.end_time).getTime();
              return sum + (end - start);
            }, 0) / tripsWithDuration.length / 60000)
          : 0;

        const revenueByDateMap = new Map();
        trips.forEach((trip: any) => {
          if (trip.start_time) {
            const date = new Date(trip.start_time).toISOString().split('T')[0];
            const dateFormatted = new Date(trip.start_time).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            const existing = revenueByDateMap.get(dateFormatted) || { date: dateFormatted, ingresos: 0, pasajeros: 0 };
            existing.ingresos += Number(trip.revenue || 0);
            existing.pasajeros += Number(trip.passenger_count || 0);
            revenueByDateMap.set(dateFormatted, existing);
          }
        });
        const revenueByDateData = Array.from(revenueByDateMap.values());

        setData({
          stats: {
            totalTrips: trips.length,
            totalRevenue,
            totalPassengers,
            totalIncidents: incidents.length,
            maintenanceCost,
            expensesCost,
            incidentsCost,
            avgOccupancy
          },
          trips,
          incidents,
          maintenance,
          expenses,
          routes,
          routeKmData,
          passengersByHourData,
          paymentMethodsData,
          maintenanceByTypeData,
          avgTripDuration,
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
