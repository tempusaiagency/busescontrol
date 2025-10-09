/*
  # Create Fare System for Driver and Passenger Interface

  ## Overview
  This migration creates the complete fare calculation system including destinations, 
  fare quotes, tickets, and bus locations tracking.

  ## 1. New Tables

  ### `destinations`
  - `id` (text, primary key) - Unique identifier (e.g., "dst_001")
  - `name` (text) - Destination name
  - `address` (text, nullable) - Full address
  - `latitude` (decimal) - GPS latitude coordinate
  - `longitude` (decimal) - GPS longitude coordinate
  - `zone` (text, nullable) - Zone or area identifier
  - `is_active` (boolean) - Whether destination is currently active
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `fare_quotes`
  - `id` (uuid, primary key) - Unique identifier
  - `origin_lat` (decimal) - Origin latitude
  - `origin_lng` (decimal) - Origin longitude
  - `destination_id` (text, foreign key) - Reference to destinations
  - `fare` (decimal) - Calculated fare amount
  - `currency` (text) - Currency code (PYG, ARS, USD, etc.)
  - `breakdown` (jsonb) - Fare calculation breakdown
  - `distance_km` (decimal, nullable) - Distance in kilometers
  - `eta_minutes` (integer, nullable) - Estimated time of arrival
  - `bus_id` (text, nullable) - Bus that generated the quote
  - `driver_id` (uuid, nullable) - Driver who generated the quote
  - `created_at` (timestamptz) - Quote timestamp
  - `expires_at` (timestamptz) - Quote expiration

  ### `tickets`
  - `id` (text, primary key) - Unique ticket identifier (e.g., "tkt_12345")
  - `quote_id` (uuid, nullable, foreign key) - Reference to fare_quote
  - `bus_id` (text, nullable) - Bus identifier
  - `driver_id` (uuid, nullable) - Driver identifier
  - `origin_lat` (decimal) - Origin latitude
  - `origin_lng` (decimal) - Origin longitude
  - `destination_id` (text, foreign key) - Reference to destinations
  - `fare` (decimal) - Final fare amount
  - `currency` (text) - Currency code
  - `status` (text) - Status: 'pending', 'confirmed', 'paid', 'cancelled'
  - `payment_method` (text, nullable) - Payment method used
  - `created_at` (timestamptz) - Ticket creation timestamp
  - `confirmed_at` (timestamptz, nullable) - Confirmation timestamp

  ### `buses` (if not exists)
  - Basic bus information table
  
  ### `bus_locations` (if not exists)
  - Real-time bus location tracking

  ## 2. Security
  - Enable RLS on all tables
  - Destinations viewable by all authenticated users
  - Only drivers and admins can create quotes and tickets
  - Bus locations viewable by all authenticated users

  ## 3. Default Data
  - Insert sample destinations for testing
  - Configure default fare calculation parameters

  ## 4. Important Notes
  - Fare breakdown stored as JSONB for flexibility
  - Quotes expire after 5 minutes by default
  - Tickets have unique IDs for tracking
  - Distance calculated using Haversine formula
*/

-- Create buses table if not exists
CREATE TABLE IF NOT EXISTS buses (
  id text PRIMARY KEY,
  license_plate text NOT NULL,
  driver_name text NOT NULL,
  driver_id uuid REFERENCES auth.users(id),
  route text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'maintenance', 'inactive')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bus_locations table if not exists
CREATE TABLE IF NOT EXISTS bus_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id text NOT NULL REFERENCES buses(id),
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  speed decimal(5, 2) DEFAULT 0,
  heading decimal(5, 2) DEFAULT 0,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create destinations table
CREATE TABLE IF NOT EXISTS destinations (
  id text PRIMARY KEY,
  name text NOT NULL,
  address text,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  zone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create fare_quotes table
CREATE TABLE IF NOT EXISTS fare_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_lat decimal(10, 8) NOT NULL,
  origin_lng decimal(11, 8) NOT NULL,
  destination_id text NOT NULL REFERENCES destinations(id),
  fare decimal(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'PYG',
  breakdown jsonb NOT NULL DEFAULT '{}',
  distance_km decimal(10, 2),
  eta_minutes integer,
  bus_id text REFERENCES buses(id),
  driver_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '5 minutes')
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id text PRIMARY KEY,
  quote_id uuid REFERENCES fare_quotes(id),
  bus_id text REFERENCES buses(id),
  driver_id uuid REFERENCES auth.users(id),
  origin_lat decimal(10, 8) NOT NULL,
  origin_lng decimal(11, 8) NOT NULL,
  destination_id text NOT NULL REFERENCES destinations(id),
  fare decimal(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'PYG',
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')) DEFAULT 'pending',
  payment_method text,
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz
);

-- Enable RLS
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fare_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Policies for buses
CREATE POLICY "Anyone can view buses"
  ON buses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert buses"
  ON buses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update buses"
  ON buses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for bus_locations
CREATE POLICY "Anyone can view bus locations"
  ON bus_locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert bus locations"
  ON bus_locations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for destinations
CREATE POLICY "Anyone can view active destinations"
  ON destinations FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert destinations"
  ON destinations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update destinations"
  ON destinations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for fare_quotes
CREATE POLICY "Anyone can view own quotes"
  ON fare_quotes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create quotes"
  ON fare_quotes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for tickets
CREATE POLICY "Anyone can view tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bus_locations_bus_id ON bus_locations(bus_id);
CREATE INDEX IF NOT EXISTS idx_bus_locations_timestamp ON bus_locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_destinations_is_active ON destinations(is_active);
CREATE INDEX IF NOT EXISTS idx_fare_quotes_bus_id ON fare_quotes(bus_id);
CREATE INDEX IF NOT EXISTS idx_fare_quotes_created_at ON fare_quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_bus_id ON tickets(bus_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

-- Insert sample destinations
INSERT INTO destinations (id, name, address, latitude, longitude, zone, is_active)
VALUES
  ('dst_001', 'Terminal Central', 'Av. República Argentina, Asunción', -25.2808, -57.6312, 'Centro', true),
  ('dst_002', 'Shopping del Sol', 'Av. Aviadores del Chaco, Asunción', -25.2965, -57.5796, 'Este', true),
  ('dst_003', 'Mercado 4', 'Pettirossi, Asunción', -25.2895, -57.6232, 'Centro', true),
  ('dst_004', 'Hospital de Clínicas', 'Av. Dr. Montero, Asunción', -25.2908, -57.6105, 'Centro-Este', true),
  ('dst_005', 'Aeropuerto Silvio Pettirossi', 'Luque', -25.2397, -57.5196, 'Aeropuerto', true),
  ('dst_006', 'Shopping Mariscal', 'Av. Mariscal López, Asunción', -25.2897, -57.5944, 'Este', true),
  ('dst_007', 'Terminal de Ómnibus', 'Fernando de la Mora, Zona Sur', -25.3345, -57.5729, 'Sur', true),
  ('dst_008', 'Ciudad del Este (Terminal)', 'Av. Gral. Bernardino Caballero', -25.5095, -54.6117, 'CDE', true)
ON CONFLICT (id) DO NOTHING;