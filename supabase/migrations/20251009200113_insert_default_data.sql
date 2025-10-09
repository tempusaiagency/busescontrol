/*
  # Insert Default Data

  ## Overview
  Populates database with default data including:
  - User roles (admin, manager, driver, viewer)
  - Sample destinations in Asunción area
  - Default fare pricing rules
  - Sample buses

  ## Default Data
  - 4 user roles with permissions
  - 10 destinations
  - 2 pricing rules
  - 3 sample buses
*/

-- Insert User Roles
INSERT INTO user_roles (name, description, permissions) VALUES
  ('admin', 'Administrador con acceso completo', '{"dashboard": true, "buses": true, "passengers": true, "inventory": true, "expenses": true, "reports": true, "configuration": true, "hr": true, "maintenance": true}'::jsonb),
  ('manager', 'Gerente con acceso a operaciones', '{"dashboard": true, "buses": true, "passengers": true, "inventory": true, "expenses": true, "reports": true, "configuration": false, "hr": true, "maintenance": true}'::jsonb),
  ('driver', 'Conductor con acceso limitado', '{"dashboard": true, "buses": true, "passengers": true, "inventory": false, "expenses": false, "reports": false, "configuration": false, "hr": false, "maintenance": false}'::jsonb),
  ('viewer', 'Usuario con acceso de solo lectura', '{"dashboard": true, "buses": true, "passengers": true, "inventory": true, "expenses": true, "reports": true, "configuration": false, "hr": false, "maintenance": false}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Assign admin role to first user if exists
DO $$
DECLARE
  first_user_id uuid;
  admin_role_id uuid;
BEGIN
  SELECT id INTO first_user_id FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO admin_role_id FROM user_roles WHERE name = 'admin';
  
  IF first_user_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
    INSERT INTO user_role_assignments (user_id, role_id, assigned_by)
    VALUES (first_user_id, admin_role_id, first_user_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END $$;

-- Insert Destinations
INSERT INTO destinations (id, name, address, latitude, longitude, zone, is_frequent, is_active) VALUES
  ('dest_terminal', 'Terminal de Ómnibus', 'Av. Fernando de la Mora, Asunción', -25.2808, -57.6311, 'centro', true, true),
  ('dest_sol', 'Shopping del Sol', 'Av. Aviadores del Chaco, Asunción', -25.2865, -57.5679, 'este', true, true),
  ('dest_mercado4', 'Mercado 4', 'Pettirossi, Asunción', -25.2820, -57.6250, 'centro', true, true),
  ('dest_costanera', 'Costanera', 'Av. Costanera, Asunción', -25.2890, -57.6440, 'centro', true, true),
  ('dest_mariscal', 'Shopping Mariscal López', 'Av. Mariscal López, Asunción', -25.2930, -57.5790, 'este', true, true),
  ('dest_aeropuerto', 'Aeropuerto Silvio Pettirossi', 'Luque, Central', -25.2395, -57.5196, 'aeropuerto', true, true),
  ('dest_sanlorenzo', 'San Lorenzo Centro', 'San Lorenzo, Central', -25.3400, -57.5080, 'sur', false, true),
  ('dest_fernando', 'Fernando de la Mora Centro', 'Fernando de la Mora, Central', -25.3260, -57.5720, 'este', false, true),
  ('dest_lambare', 'Lambaré Centro', 'Lambaré, Central', -25.3420, -57.6140, 'sur', false, true),
  ('dest_villa', 'Villa Elisa Centro', 'Villa Elisa, Central', -25.3720, -57.5900, 'sur', false, true)
ON CONFLICT (id) DO NOTHING;

-- Insert Pricing Rules
INSERT INTO fare_pricing_rules (name, base_fare, per_km_rate, currency, zone_to, is_active, priority) VALUES
  ('Tarifa Estándar', 5000, 1500, 'PYG', NULL, true, 100),
  ('Tarifa Aeropuerto', 10000, 2000, 'PYG', 'aeropuerto', true, 200)
ON CONFLICT DO NOTHING;

-- Insert Sample Buses
INSERT INTO buses (id, license_plate, driver_name, route, status) VALUES
  ('BUS-001', 'ABC-123', 'Juan Pérez', 'Línea 1 - Centro', 'active'),
  ('BUS-002', 'DEF-456', 'María González', 'Línea 2 - Este', 'active'),
  ('BUS-003', 'GHI-789', 'Carlos Rodríguez', 'Línea 3 - Sur', 'maintenance')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Inventory Items
INSERT INTO inventory_items (name, category, quantity, unit, min_quantity, max_quantity, unit_cost) VALUES
  ('Filtro de Aceite', 'parts', 25, 'unidades', 10, 100, 45000),
  ('Filtro de Aire', 'parts', 20, 'unidades', 10, 100, 35000),
  ('Pastillas de Freno', 'parts', 15, 'juegos', 8, 50, 180000),
  ('Aceite de Motor', 'supplies', 150, 'litros', 50, 500, 25000),
  ('Refrigerante', 'supplies', 80, 'litros', 30, 300, 18000),
  ('Diesel', 'fuel', 2000, 'litros', 500, 10000, 8500),
  ('Llave de Tuercas', 'tools', 5, 'unidades', 2, 20, 125000),
  ('Extintor', 'other', 6, 'unidades', 3, 15, 95000)
ON CONFLICT DO NOTHING;
