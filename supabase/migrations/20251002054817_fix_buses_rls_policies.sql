/*
  # Fix Buses RLS Policies

  1. Changes
    - Drop all recursive policies on buses table
    - Create simple non-recursive policies
    - Allow authenticated users to manage buses

  2. Security
    - Maintains RLS protection
    - Removes all infinite recursion issues
    - All authenticated users can manage buses
*/

-- Drop all existing policies on buses
DROP POLICY IF EXISTS "Anyone can view buses" ON buses;
DROP POLICY IF EXISTS "Admins can insert buses" ON buses;
DROP POLICY IF EXISTS "Admins can update buses" ON buses;
DROP POLICY IF EXISTS "Admins can delete buses" ON buses;

-- Create simple non-recursive policies
CREATE POLICY "Authenticated users can view buses"
  ON buses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert buses"
  ON buses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update buses"
  ON buses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete buses"
  ON buses
  FOR DELETE
  TO authenticated
  USING (true);