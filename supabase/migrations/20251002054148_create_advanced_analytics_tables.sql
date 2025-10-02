/*
  # Create Advanced Analytics Tables

  1. New Tables
    - `routes`
      - `id` (uuid, primary key)
      - `name` (text)
      - `code` (text, unique)
      - `origin` (text)
      - `destination` (text)
      - `distance_km` (numeric)
      - `estimated_duration_minutes` (integer)
      - `ticket_price` (numeric)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `trips`
      - `id` (uuid, primary key)
      - `bus_id` (text, references buses)
      - `route_id` (uuid, references routes)
      - `driver_id` (uuid, references employees)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz, nullable)
      - `start_odometer` (integer)
      - `end_odometer` (integer, nullable)
      - `distance_km` (numeric)
      - `passenger_count` (integer)
      - `seats_available` (integer)
      - `revenue` (numeric)
      - `fuel_cost` (numeric)
      - `toll_cost` (numeric)
      - `other_costs` (numeric)
      - `payment_method_cash` (numeric)
      - `payment_method_card` (numeric)
      - `payment_method_qr` (numeric)
      - `incidents` (text, nullable)
      - `status` (text: 'in_progress', 'completed', 'cancelled')
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `passenger_trips`
      - `id` (uuid, primary key)
      - `trip_id` (uuid, references trips)
      - `passenger_id` (uuid, references auth.users, nullable)
      - `passenger_name` (text, nullable)
      - `boarding_stop` (text)
      - `alighting_stop` (text)
      - `ticket_price` (numeric)
      - `payment_method` (text: 'cash', 'card', 'qr')
      - `boarded_at` (timestamptz)
      - `created_at` (timestamptz)

    - `operational_incidents`
      - `id` (uuid, primary key)
      - `trip_id` (uuid, references trips, nullable)
      - `bus_id` (text, references buses)
      - `incident_type` (text: 'breakdown', 'accident', 'delay', 'other')
      - `severity` (text: 'low', 'medium', 'high', 'critical')
      - `description` (text)
      - `location` (text, nullable)
      - `reported_at` (timestamptz)
      - `resolved_at` (timestamptz, nullable)
      - `resolution_notes` (text, nullable)
      - `cost` (numeric)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  distance_km numeric DEFAULT 0,
  estimated_duration_minutes integer DEFAULT 0,
  ticket_price numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id text NOT NULL,
  route_id uuid REFERENCES routes(id),
  driver_id uuid REFERENCES employees(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  start_odometer integer,
  end_odometer integer,
  distance_km numeric DEFAULT 0,
  passenger_count integer DEFAULT 0,
  seats_available integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  fuel_cost numeric DEFAULT 0,
  toll_cost numeric DEFAULT 0,
  other_costs numeric DEFAULT 0,
  payment_method_cash numeric DEFAULT 0,
  payment_method_card numeric DEFAULT 0,
  payment_method_qr numeric DEFAULT 0,
  incidents text,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create passenger_trips table
CREATE TABLE IF NOT EXISTS passenger_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  passenger_id uuid REFERENCES auth.users(id),
  passenger_name text,
  boarding_stop text NOT NULL,
  alighting_stop text NOT NULL,
  ticket_price numeric DEFAULT 0,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card', 'qr')),
  boarded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create operational_incidents table
CREATE TABLE IF NOT EXISTS operational_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id),
  bus_id text NOT NULL,
  incident_type text NOT NULL CHECK (incident_type IN ('breakdown', 'accident', 'delay', 'other')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text NOT NULL,
  location text,
  reported_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolution_notes text,
  cost numeric DEFAULT 0,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE passenger_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for routes
CREATE POLICY "Authenticated users can view routes"
  ON routes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert routes"
  ON routes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update routes"
  ON routes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete routes"
  ON routes FOR DELETE TO authenticated USING (true);

-- RLS Policies for trips
CREATE POLICY "Authenticated users can view trips"
  ON trips FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert trips"
  ON trips FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update trips"
  ON trips FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete trips"
  ON trips FOR DELETE TO authenticated USING (true);

-- RLS Policies for passenger_trips
CREATE POLICY "Authenticated users can view passenger trips"
  ON passenger_trips FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert passenger trips"
  ON passenger_trips FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update passenger trips"
  ON passenger_trips FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete passenger trips"
  ON passenger_trips FOR DELETE TO authenticated USING (true);

-- RLS Policies for operational_incidents
CREATE POLICY "Authenticated users can view incidents"
  ON operational_incidents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert incidents"
  ON operational_incidents FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update incidents"
  ON operational_incidents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete incidents"
  ON operational_incidents FOR DELETE TO authenticated USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trips_bus_id ON trips(bus_id);
CREATE INDEX IF NOT EXISTS idx_trips_route_id ON trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_start_time ON trips(start_time);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_passenger_trips_trip_id ON passenger_trips(trip_id);
CREATE INDEX IF NOT EXISTS idx_operational_incidents_bus_id ON operational_incidents(bus_id);
CREATE INDEX IF NOT EXISTS idx_operational_incidents_trip_id ON operational_incidents(trip_id);
CREATE INDEX IF NOT EXISTS idx_operational_incidents_reported_at ON operational_incidents(reported_at);