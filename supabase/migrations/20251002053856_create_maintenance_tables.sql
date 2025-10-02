/*
  # Create Maintenance Management Tables

  1. New Tables
    - `maintenance_records`
      - `id` (uuid, primary key)
      - `bus_id` (text, references buses)
      - `type` (text: 'preventive', 'corrective', 'inspection')
      - `status` (text: 'scheduled', 'in_progress', 'completed', 'cancelled')
      - `description` (text)
      - `scheduled_date` (date)
      - `completed_date` (date, nullable)
      - `cost` (numeric)
      - `labor_cost` (numeric)
      - `parts_cost` (numeric)
      - `service_provider` (text, nullable)
      - `technician` (text, nullable)
      - `odometer_reading` (integer, nullable)
      - `next_service_date` (date, nullable)
      - `next_service_km` (integer, nullable)
      - `notes` (text, nullable)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `maintenance_items`
      - `id` (uuid, primary key)
      - `maintenance_id` (uuid, references maintenance_records)
      - `item_name` (text)
      - `item_catalog_id` (uuid, references item_catalog, nullable)
      - `quantity` (integer)
      - `unit_cost` (numeric)
      - `total_cost` (numeric)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)

    - `bus_service_schedules`
      - `id` (uuid, primary key)
      - `bus_id` (text, references buses)
      - `service_type` (text)
      - `interval_km` (integer, nullable)
      - `interval_days` (integer, nullable)
      - `last_service_date` (date, nullable)
      - `last_service_km` (integer, nullable)
      - `next_service_date` (date, nullable)
      - `next_service_km` (integer, nullable)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage maintenance records
*/

-- Create maintenance_records table
CREATE TABLE IF NOT EXISTS maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('preventive', 'corrective', 'inspection')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  description text NOT NULL,
  scheduled_date date NOT NULL,
  completed_date date,
  cost numeric DEFAULT 0,
  labor_cost numeric DEFAULT 0,
  parts_cost numeric DEFAULT 0,
  service_provider text,
  technician text,
  odometer_reading integer,
  next_service_date date,
  next_service_km integer,
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create maintenance_items table
CREATE TABLE IF NOT EXISTS maintenance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id uuid NOT NULL REFERENCES maintenance_records(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  item_catalog_id uuid REFERENCES item_catalog(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_cost numeric DEFAULT 0,
  total_cost numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create bus_service_schedules table
CREATE TABLE IF NOT EXISTS bus_service_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id text NOT NULL,
  service_type text NOT NULL,
  interval_km integer,
  interval_days integer,
  last_service_date date,
  last_service_km integer,
  next_service_date date,
  next_service_km integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_service_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for maintenance_records
CREATE POLICY "Authenticated users can view maintenance records"
  ON maintenance_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert maintenance records"
  ON maintenance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update maintenance records"
  ON maintenance_records
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete maintenance records"
  ON maintenance_records
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for maintenance_items
CREATE POLICY "Authenticated users can view maintenance items"
  ON maintenance_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert maintenance items"
  ON maintenance_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update maintenance items"
  ON maintenance_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete maintenance items"
  ON maintenance_items
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for bus_service_schedules
CREATE POLICY "Authenticated users can view service schedules"
  ON bus_service_schedules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert service schedules"
  ON bus_service_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update service schedules"
  ON bus_service_schedules
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete service schedules"
  ON bus_service_schedules
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_maintenance_records_bus_id ON maintenance_records(bus_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_status ON maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_scheduled_date ON maintenance_records(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_items_maintenance_id ON maintenance_items(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_bus_service_schedules_bus_id ON bus_service_schedules(bus_id);