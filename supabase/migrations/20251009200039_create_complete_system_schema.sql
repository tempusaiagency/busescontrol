/*
  # Complete Bus Management System Schema

  ## Overview
  Creates complete database schema for bus management system.

  ## Tables Created
  - user_roles: User role definitions
  - user_role_assignments: Role assignments to users
  - employees: Employee information
  - buses: Bus fleet
  - bus_locations: GPS tracking
  - destinations: Fare destinations
  - fare_pricing_rules: Pricing configuration
  - fare_quotes: Fare quotations
  - fare_confirmations: Confirmed transactions
  - inventory_items: Inventory management
  - expenses: Expense tracking
  - maintenance_records: Maintenance history

  ## Security
  - RLS enabled on all tables
  - Role-based access policies
*/

-- User Roles
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  permissions jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view roles" ON user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view own assignments" ON user_role_assignments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage roles" ON user_roles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_role_assignments ura JOIN user_roles ur ON ura.role_id = ur.id WHERE ura.user_id = auth.uid() AND ur.name = 'admin'));
CREATE POLICY "Admins manage assignments" ON user_role_assignments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_role_assignments ura JOIN user_roles ur ON ura.role_id = ur.id WHERE ura.user_id = auth.uid() AND ur.name = 'admin'));

-- Employees
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
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View employees" ON employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage employees" ON employees FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_role_assignments ura JOIN user_roles ur ON ura.role_id = ur.id WHERE ura.user_id = auth.uid() AND ur.name IN ('admin', 'manager')));

-- Buses
CREATE TABLE IF NOT EXISTS buses (
  id text PRIMARY KEY,
  license_plate text NOT NULL,
  driver_name text NOT NULL,
  driver_id uuid REFERENCES employees(id),
  route text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'maintenance', 'inactive')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bus_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id text NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  speed decimal(5, 2) DEFAULT 0,
  heading decimal(5, 2) DEFAULT 0,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View buses" ON buses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage buses" ON buses FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_role_assignments ura JOIN user_roles ur ON ura.role_id = ur.id WHERE ura.user_id = auth.uid() AND ur.name IN ('admin', 'manager')));
CREATE POLICY "View locations" ON bus_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert locations" ON bus_locations FOR INSERT TO authenticated WITH CHECK (true);

-- Destinations and Fares
CREATE TABLE IF NOT EXISTS destinations (
  id text PRIMARY KEY,
  name text NOT NULL,
  address text NOT NULL,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  zone text NOT NULL DEFAULT 'general',
  is_active boolean DEFAULT true,
  is_frequent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fare_pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  base_fare decimal(10, 2) NOT NULL,
  per_km_rate decimal(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'PYG',
  zone_from text,
  zone_to text,
  is_active boolean DEFAULT true,
  priority integer NOT NULL DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fare_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id text REFERENCES buses(id),
  driver_id uuid REFERENCES employees(id),
  origin_lat decimal(10, 8) NOT NULL,
  origin_lng decimal(11, 8) NOT NULL,
  destination_id text REFERENCES destinations(id),
  distance_km decimal(8, 2) NOT NULL,
  base_fare decimal(10, 2) NOT NULL,
  per_km_rate decimal(10, 2) NOT NULL,
  total_fare decimal(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'PYG',
  eta_minutes integer,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
  quoted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fare_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES fare_quotes(id),
  bus_id text REFERENCES buses(id),
  passenger_count integer NOT NULL DEFAULT 1,
  total_fare decimal(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'PYG',
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card', 'qr', 'other')) DEFAULT 'cash',
  payment_status text NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed')) DEFAULT 'completed',
  confirmed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fare_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE fare_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fare_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View destinations" ON destinations FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Manage destinations" ON destinations FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_role_assignments ura JOIN user_roles ur ON ura.role_id = ur.id WHERE ura.user_id = auth.uid() AND ur.name IN ('admin', 'manager')));
CREATE POLICY "View pricing" ON fare_pricing_rules FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Manage pricing" ON fare_pricing_rules FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_role_assignments ura JOIN user_roles ur ON ura.role_id = ur.id WHERE ura.user_id = auth.uid() AND ur.name IN ('admin', 'manager')));
CREATE POLICY "View quotes" ON fare_quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create quotes" ON fare_quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update quotes" ON fare_quotes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "View confirmations" ON fare_confirmations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create confirmations" ON fare_confirmations FOR INSERT TO authenticated WITH CHECK (true);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('parts', 'supplies', 'tools', 'fuel', 'other')),
  quantity integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'pieces',
  min_quantity integer NOT NULL DEFAULT 10,
  max_quantity integer NOT NULL DEFAULT 1000,
  unit_cost decimal(10, 2) DEFAULT 0,
  location text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View inventory" ON inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage inventory" ON inventory_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_role_assignments ura JOIN user_roles ur ON ura.role_id = ur.id WHERE ura.user_id = auth.uid() AND ur.name IN ('admin', 'manager')));

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount decimal(10, 2) NOT NULL,
  bus_id text REFERENCES buses(id),
  payment_method text,
  receipt_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View expenses" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage expenses" ON expenses FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_role_assignments ura JOIN user_roles ur ON ura.role_id = ur.id WHERE ura.user_id = auth.uid() AND ur.name IN ('admin', 'manager')));

-- Maintenance
CREATE TABLE IF NOT EXISTS maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id text NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL,
  description text NOT NULL,
  scheduled_date date NOT NULL,
  completed_date date,
  cost decimal(10, 2) DEFAULT 0,
  mechanic_name text,
  status text NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View maintenance" ON maintenance_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage maintenance" ON maintenance_records FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_role_assignments ura JOIN user_roles ur ON ura.role_id = ur.id WHERE ura.user_id = auth.uid() AND ur.name IN ('admin', 'manager')));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(status);
CREATE INDEX IF NOT EXISTS idx_bus_locations_bus_id ON bus_locations(bus_id);
CREATE INDEX IF NOT EXISTS idx_destinations_is_active ON destinations(is_active);
CREATE INDEX IF NOT EXISTS idx_fare_quotes_bus_id ON fare_quotes(bus_id);
CREATE INDEX IF NOT EXISTS idx_fare_confirmations_confirmed_at ON fare_confirmations(confirmed_at DESC);
