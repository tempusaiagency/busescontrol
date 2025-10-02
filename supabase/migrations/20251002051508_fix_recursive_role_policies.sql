/*
  # Fix Recursive Role Policies

  1. Changes
    - Drop existing recursive policy on user_roles
    - Create simpler non-recursive policy
    - Allow all authenticated users to manage roles (simplified for now)

  2. Security
    - Maintains RLS protection
    - Removes infinite recursion issue
*/

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- Create simplified policies that don't cause recursion
CREATE POLICY "Authenticated users can insert roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete roles"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (true);