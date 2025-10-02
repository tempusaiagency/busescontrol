/*
  # Create Bus Locations and Human Resources Tables

  ## Overview
  This migration creates tables for real-time bus tracking and human resources management.

  ## 1. New Tables

  ### `employees`
  - `id` (uuid, primary key) - Unique identifier for each employee
  - `user_id` (uuid, foreign key, nullable) - Link to auth.users if they have system access
  - `first_name` (text) - Employee first name
  - `last_name` (text) - Employee last name
  - `email` (text, nullable) - Employee email
  - `phone` (text, nullable) - Employee phone number
  - `position` (text) - Job position (driver, mechanic, supervisor, etc.)
  - `hire_date` (date) - Date hired
  - `status` (text) - Employment status: 'active', 'inactive', 'suspended'
  - `salary` (decimal, nullable) - Monthly salary
  - `address` (text, nullable) - Home address
  - `emergency_contact_name` (text, nullable) - Emergency contact person
  - `emergency_contact_phone` (text, nullable) - Emergency contact phone
  - `notes` (text, nullable) - Additional notes
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `created_by` (uuid) - User who created the record

  ### `buses`
  - `id` (text, primary key) - Bus identifier
  - `license_plate` (text) - License plate number
  - `driver_name` (text) - Current driver name
  - `driver_id` (uuid, nullable) - Link to employees table
  - `route` (text) - Bus route
  - `status` (text) - Bus status: 'active', 'maintenance', 'inactive'
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `user_id` (uuid) - User who manages this bus

  ### `bus_locations`
  - `id` (uuid, primary key) - Unique identifier for each location record
  - `bus_id` (text) - Reference to bus identifier
  - `latitude` (decimal) - GPS latitude coordinate
  - `longitude` (decimal) - GPS longitude coordinate
  - `speed` (decimal) - Current speed in km/h
  - `heading` (decimal) - Direction heading in degrees (0-360)
  - `timestamp` (timestamptz) - When location was recorded
  - `created_at` (timestamptz) - Record creation timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Bus locations viewable by authenticated users
  - Only admins can insert bus locations (for GPS device integration)
  - Employee data restricted to admins and managers only
  - Buses viewable by all authenticated users
  - Only admins can modify bus records

  ## 3. Important Notes
  - Bus locations updated frequently for real-time tracking
  - Employee data contains sensitive information
  - Proper indexes for performance on location queries
*/

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  position text NOT NULL,
  hire_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
  salary decimal(10, 2),
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS buses (
  id text PRIMARY KEY,
  license_plate text NOT NULL,
  driver_name text NOT NULL,
  driver_id uuid REFERENCES employees(id),
  route text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'maintenance', 'inactive')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS bus_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id text NOT NULL,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  speed decimal(5, 2) DEFAULT 0,
  heading decimal(5, 2) DEFAULT 0,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can view employees"
  ON employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name = 'admin'
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Admins can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name = 'admin'
    )
  );

CREATE POLICY "Admins can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name = 'admin'
    )
  );

CREATE POLICY "Anyone can view buses"
  ON buses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert buses"
  ON buses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name = 'admin'
    )
  );

CREATE POLICY "Admins can update buses"
  ON buses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name = 'admin'
    )
  );

CREATE POLICY "Admins can delete buses"
  ON buses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name = 'admin'
    )
  );

CREATE POLICY "Anyone can view bus locations"
  ON bus_locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert bus locations"
  ON bus_locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('admin', 'manager')
    )
  );

CREATE INDEX IF NOT EXISTS idx_bus_locations_bus_id ON bus_locations(bus_id);
CREATE INDEX IF NOT EXISTS idx_bus_locations_timestamp ON bus_locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(status);
CREATE INDEX IF NOT EXISTS idx_buses_driver_id ON buses(driver_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_position ON employees(position);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);