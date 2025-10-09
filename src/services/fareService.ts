import { supabase } from '../lib/supabase';

export interface Location {
  lat: number;
  lng: number;
}

export interface Destination {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  zone: string | null;
  is_active: boolean;
}

export interface FareQuote {
  id: string;
  fare: number;
  currency: string;
  breakdown: {
    base: number;
    per_km: number;
    distance_km: number;
  };
  distance_km: number;
  eta_minutes: number;
}

export interface Ticket {
  ticketId: string;
  fare: number;
  currency: string;
}

const FARE_CONFIG = {
  baseFare: 5000,
  perKmRate: 1500,
  currency: 'PYG',
  avgSpeedKmh: 30,
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function getDestinations(near?: Location): Promise<Destination[]> {
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;

  if (near && data) {
    return data
      .map(dest => ({
        ...dest,
        distance: haversineDistance(near.lat, near.lng, dest.latitude, dest.longitude)
      }))
      .sort((a, b) => (a as any).distance - (b as any).distance);
  }

  return data || [];
}

export async function createFareQuote(
  origin: Location,
  destinationId: string,
  busId?: string,
  driverId?: string
): Promise<FareQuote> {
  const { data: destination, error: destError } = await supabase
    .from('destinations')
    .select('*')
    .eq('id', destinationId)
    .maybeSingle();

  if (destError) throw destError;
  if (!destination) throw new Error('Destination not found');

  const distance = haversineDistance(
    origin.lat,
    origin.lng,
    destination.latitude,
    destination.longitude
  );

  const fare = FARE_CONFIG.baseFare + (distance * FARE_CONFIG.perKmRate);
  const etaMinutes = Math.ceil((distance / FARE_CONFIG.avgSpeedKmh) * 60);

  const breakdown = {
    base: FARE_CONFIG.baseFare,
    per_km: FARE_CONFIG.perKmRate,
    distance_km: Number(distance.toFixed(2)),
  };

  const { data, error } = await supabase
    .from('fare_quotes')
    .insert({
      origin_lat: origin.lat,
      origin_lng: origin.lng,
      destination_id: destinationId,
      fare: Math.round(fare),
      currency: FARE_CONFIG.currency,
      breakdown,
      distance_km: distance,
      eta_minutes: etaMinutes,
      bus_id: busId,
      driver_id: driverId,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    fare: data.fare,
    currency: data.currency,
    breakdown: data.breakdown,
    distance_km: data.distance_km,
    eta_minutes: data.eta_minutes,
  };
}

export async function confirmFare(
  quoteId: string,
  busId?: string,
  driverId?: string
): Promise<Ticket> {
  const { data: quote, error: quoteError } = await supabase
    .from('fare_quotes')
    .select('*')
    .eq('id', quoteId)
    .maybeSingle();

  if (quoteError) throw quoteError;
  if (!quote) throw new Error('Quote not found');

  const ticketId = `tkt_${Date.now()}`;

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      id: ticketId,
      quote_id: quoteId,
      bus_id: busId || quote.bus_id,
      driver_id: driverId || quote.driver_id,
      origin_lat: quote.origin_lat,
      origin_lng: quote.origin_lng,
      destination_id: quote.destination_id,
      fare: quote.fare,
      currency: quote.currency,
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return {
    ticketId: data.id,
    fare: data.fare,
    currency: data.currency,
  };
}

export async function getCurrentBusLocation(busId: string): Promise<Location | null> {
  const { data, error } = await supabase
    .from('bus_locations')
    .select('latitude, longitude')
    .eq('bus_id', busId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    lat: Number(data.latitude),
    lng: Number(data.longitude),
  };
}

export async function updateBusLocation(
  busId: string,
  location: Location,
  speed?: number,
  heading?: number
): Promise<void> {
  const { error } = await supabase
    .from('bus_locations')
    .insert({
      bus_id: busId,
      latitude: location.lat,
      longitude: location.lng,
      speed: speed || 0,
      heading: heading || 0,
      timestamp: new Date().toISOString(),
    });

  if (error) throw error;
}
