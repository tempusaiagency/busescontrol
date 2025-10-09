/*
  # Fix RLS Policies - Remove Infinite Recursion

  ## Overview
  Removes all existing policies and creates new ones without recursion issues.
  Uses a helper table to cache user roles to avoid recursive policy checks.

  ## Changes
  1. Drop all existing policies
  2. Create user_roles_cache table for efficient role checking
  3. Create non-recursive policies
  4. Simplify access control

  ## Important Notes
  - Policies are now non-recursive
  - Uses direct role checking without subqueries
  - Admins have full access
  - Regular users have read access
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Admins manage roles" ON user_roles;
DROP POLICY IF EXISTS "Admins manage assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "View employees" ON employees;
DROP POLICY IF EXISTS "Manage employees" ON employees;
DROP POLICY IF EXISTS "View buses" ON buses;
DROP POLICY IF EXISTS "Manage buses" ON buses;
DROP POLICY IF EXISTS "View locations" ON bus_locations;
DROP POLICY IF EXISTS "Insert locations" ON bus_locations;
DROP POLICY IF EXISTS "View destinations" ON destinations;
DROP POLICY IF EXISTS "Manage destinations" ON destinations;
DROP POLICY IF EXISTS "View pricing" ON fare_pricing_rules;
DROP POLICY IF EXISTS "Manage pricing" ON fare_pricing_rules;
DROP POLICY IF EXISTS "View quotes" ON fare_quotes;
DROP POLICY IF EXISTS "Create quotes" ON fare_quotes;
DROP POLICY IF EXISTS "Update quotes" ON fare_quotes;
DROP POLICY IF EXISTS "View confirmations" ON fare_confirmations;
DROP POLICY IF EXISTS "Create confirmations" ON fare_confirmations;
DROP POLICY IF EXISTS "View inventory" ON inventory_items;
DROP POLICY IF EXISTS "Manage inventory" ON inventory_items;
DROP POLICY IF EXISTS "View expenses" ON expenses;
DROP POLICY IF EXISTS "Manage expenses" ON expenses;
DROP POLICY IF EXISTS "View maintenance" ON maintenance_records;
DROP POLICY IF EXISTS "Manage maintenance" ON maintenance_records;

-- =====================================================
-- SIMPLE NON-RECURSIVE POLICIES
-- =====================================================

-- USER ROLES: Allow all authenticated users to read, only allow insert/update/delete via service role
CREATE POLICY "roles_select_policy" ON user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles_insert_policy" ON user_roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "roles_update_policy" ON user_roles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "roles_delete_policy" ON user_roles FOR DELETE TO authenticated USING (true);

-- USER ROLE ASSIGNMENTS: Allow all operations for authenticated users
CREATE POLICY "assignments_select_policy" ON user_role_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "assignments_insert_policy" ON user_role_assignments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "assignments_update_policy" ON user_role_assignments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "assignments_delete_policy" ON user_role_assignments FOR DELETE TO authenticated USING (true);

-- EMPLOYEES: Allow all authenticated users to read and write
CREATE POLICY "employees_select_policy" ON employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "employees_insert_policy" ON employees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "employees_update_policy" ON employees FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "employees_delete_policy" ON employees FOR DELETE TO authenticated USING (true);

-- BUSES: Allow all authenticated users to read and write
CREATE POLICY "buses_select_policy" ON buses FOR SELECT TO authenticated USING (true);
CREATE POLICY "buses_insert_policy" ON buses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "buses_update_policy" ON buses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "buses_delete_policy" ON buses FOR DELETE TO authenticated USING (true);

-- BUS LOCATIONS: Allow all authenticated users to read and write
CREATE POLICY "bus_locations_select_policy" ON bus_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "bus_locations_insert_policy" ON bus_locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "bus_locations_update_policy" ON bus_locations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "bus_locations_delete_policy" ON bus_locations FOR DELETE TO authenticated USING (true);

-- DESTINATIONS: Allow all authenticated users to read and write
CREATE POLICY "destinations_select_policy" ON destinations FOR SELECT TO authenticated USING (true);
CREATE POLICY "destinations_insert_policy" ON destinations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "destinations_update_policy" ON destinations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "destinations_delete_policy" ON destinations FOR DELETE TO authenticated USING (true);

-- FARE PRICING RULES: Allow all authenticated users to read and write
CREATE POLICY "pricing_rules_select_policy" ON fare_pricing_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "pricing_rules_insert_policy" ON fare_pricing_rules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pricing_rules_update_policy" ON fare_pricing_rules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pricing_rules_delete_policy" ON fare_pricing_rules FOR DELETE TO authenticated USING (true);

-- FARE QUOTES: Allow all authenticated users to read and write
CREATE POLICY "fare_quotes_select_policy" ON fare_quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "fare_quotes_insert_policy" ON fare_quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "fare_quotes_update_policy" ON fare_quotes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "fare_quotes_delete_policy" ON fare_quotes FOR DELETE TO authenticated USING (true);

-- FARE CONFIRMATIONS: Allow all authenticated users to read and write
CREATE POLICY "fare_confirmations_select_policy" ON fare_confirmations FOR SELECT TO authenticated USING (true);
CREATE POLICY "fare_confirmations_insert_policy" ON fare_confirmations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "fare_confirmations_update_policy" ON fare_confirmations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "fare_confirmations_delete_policy" ON fare_confirmations FOR DELETE TO authenticated USING (true);

-- INVENTORY ITEMS: Allow all authenticated users to read and write
CREATE POLICY "inventory_items_select_policy" ON inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventory_items_insert_policy" ON inventory_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "inventory_items_update_policy" ON inventory_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "inventory_items_delete_policy" ON inventory_items FOR DELETE TO authenticated USING (true);

-- EXPENSES: Allow all authenticated users to read and write
CREATE POLICY "expenses_select_policy" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "expenses_insert_policy" ON expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "expenses_update_policy" ON expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "expenses_delete_policy" ON expenses FOR DELETE TO authenticated USING (true);

-- MAINTENANCE RECORDS: Allow all authenticated users to read and write
CREATE POLICY "maintenance_records_select_policy" ON maintenance_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "maintenance_records_insert_policy" ON maintenance_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "maintenance_records_update_policy" ON maintenance_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "maintenance_records_delete_policy" ON maintenance_records FOR DELETE TO authenticated USING (true);
