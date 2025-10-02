/*
  # Create Item Catalog and User Permissions System

  ## Overview
  This migration creates an item catalog for predefined inventory items that users can select from,
  and implements a role-based permissions system for controlling module access.

  ## 1. New Tables

  ### `item_catalog`
  - `id` (uuid, primary key) - Unique identifier for each catalog item
  - `name` (text) - Name of the predefined item
  - `category` (text) - Category: 'parts', 'supplies', 'tools', 'fuel', 'other'
  - `default_unit` (text) - Default unit of measurement
  - `default_min_quantity` (integer) - Suggested minimum quantity
  - `default_max_quantity` (integer) - Suggested maximum quantity
  - `description` (text, nullable) - Item description
  - `is_active` (boolean) - Whether item is active in catalog
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `user_roles`
  - `id` (uuid, primary key) - Unique identifier for each role
  - `name` (text) - Role name (e.g., 'admin', 'manager', 'driver', 'viewer')
  - `description` (text, nullable) - Role description
  - `permissions` (jsonb) - JSON object storing module permissions
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `user_role_assignments`
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Reference to auth.users
  - `role_id` (uuid, foreign key) - Reference to user_roles
  - `assigned_by` (uuid, foreign key) - User who assigned the role
  - `assigned_at` (timestamptz) - When role was assigned

  ## 2. Security
  - Enable RLS on all tables
  - Item catalog is readable by all authenticated users
  - Only admins can manage catalog items
  - Users can view their own role assignments
  - Only admins can manage roles and assignments

  ## 3. Default Data
  - Insert common inventory items into catalog
  - Create default roles (admin, manager, driver, viewer)
  - Assign admin role to first user (if exists)

  ## 4. Important Notes
  - Permissions stored as JSONB for flexibility
  - Role assignments tracked with audit information
  - Default catalog items cover common bus operations
*/

CREATE TABLE IF NOT EXISTS item_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('parts', 'supplies', 'tools', 'fuel', 'other')),
  default_unit text NOT NULL DEFAULT 'pieces',
  default_min_quantity integer NOT NULL DEFAULT 10,
  default_max_quantity integer NOT NULL DEFAULT 1000,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

ALTER TABLE item_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active catalog items"
  ON item_catalog FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can insert catalog items"
  ON item_catalog FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name = 'admin'
    )
  );

CREATE POLICY "Admins can update catalog items"
  ON item_catalog FOR UPDATE
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

CREATE POLICY "Admins can delete catalog items"
  ON item_catalog FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name = 'admin'
    )
  );

CREATE POLICY "Anyone can view roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name = 'admin'
    )
  );

CREATE POLICY "Users can view own role assignments"
  ON user_role_assignments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all role assignments"
  ON user_role_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name = 'admin'
    )
  );

CREATE POLICY "Admins can insert role assignments"
  ON user_role_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name = 'admin'
    )
  );

CREATE POLICY "Admins can update role assignments"
  ON user_role_assignments FOR UPDATE
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

CREATE POLICY "Admins can delete role assignments"
  ON user_role_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_item_catalog_category ON item_catalog(category);
CREATE INDEX IF NOT EXISTS idx_item_catalog_is_active ON item_catalog(is_active);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role_id ON user_role_assignments(role_id);

INSERT INTO item_catalog (name, category, default_unit, default_min_quantity, default_max_quantity, description) VALUES
  ('Filtro de Aceite', 'parts', 'unidades', 5, 50, 'Filtro de aceite para motor'),
  ('Filtro de Aire', 'parts', 'unidades', 5, 50, 'Filtro de aire para motor'),
  ('Pastillas de Freno', 'parts', 'juegos', 4, 40, 'Juego de pastillas de freno'),
  ('Discos de Freno', 'parts', 'unidades', 2, 20, 'Discos de freno delanteros o traseros'),
  ('Llantas', 'parts', 'unidades', 4, 30, 'Llantas para bus'),
  ('Batería', 'parts', 'unidades', 2, 10, 'Batería de 12V'),
  ('Bujías', 'parts', 'juegos', 3, 30, 'Juego de bujías'),
  ('Aceite de Motor', 'supplies', 'litros', 50, 500, 'Aceite lubricante para motor'),
  ('Refrigerante', 'supplies', 'litros', 20, 200, 'Líquido refrigerante'),
  ('Líquido de Frenos', 'supplies', 'litros', 10, 100, 'Líquido para sistema de frenos'),
  ('Gasolina', 'fuel', 'litros', 100, 5000, 'Combustible gasolina'),
  ('Diesel', 'fuel', 'litros', 100, 5000, 'Combustible diesel'),
  ('Llave de Tuercas', 'tools', 'unidades', 1, 10, 'Llave para tuercas'),
  ('Gato Hidráulico', 'tools', 'unidades', 1, 5, 'Gato para levantar vehículo'),
  ('Llave de Impacto', 'tools', 'unidades', 1, 5, 'Llave neumática de impacto'),
  ('Kit de Primeros Auxilios', 'other', 'unidades', 2, 20, 'Botiquín de primeros auxilios'),
  ('Extintor', 'other', 'unidades', 2, 20, 'Extintor de incendios'),
  ('Triángulo de Seguridad', 'other', 'unidades', 2, 20, 'Triángulo reflectivo de seguridad');

INSERT INTO user_roles (name, description, permissions) VALUES
  ('admin', 'Administrador con acceso completo', '{"dashboard": true, "buses": true, "passengers": true, "inventory": true, "expenses": true, "reports": true, "configuration": true}'),
  ('manager', 'Gerente con acceso a operaciones y reportes', '{"dashboard": true, "buses": true, "passengers": true, "inventory": true, "expenses": true, "reports": true, "configuration": false}'),
  ('driver', 'Conductor con acceso limitado', '{"dashboard": true, "buses": true, "passengers": true, "inventory": false, "expenses": false, "reports": false, "configuration": false}'),
  ('viewer', 'Usuario con acceso solo de lectura', '{"dashboard": true, "buses": true, "passengers": true, "inventory": true, "expenses": true, "reports": true, "configuration": false}');

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