/*
  # Create Inventory Management System

  ## Overview
  This migration creates the inventory management system for tracking bus parts, supplies, and equipment.

  ## 1. New Tables
    
  ### `inventory_items`
  - `id` (uuid, primary key) - Unique identifier for each inventory item
  - `name` (text) - Name of the inventory item
  - `category` (text) - Category: 'parts', 'supplies', 'tools', 'fuel', 'other'
  - `quantity` (integer) - Current quantity in stock
  - `unit` (text) - Unit of measurement (e.g., 'pieces', 'liters', 'boxes')
  - `min_quantity` (integer) - Minimum quantity threshold for alerts
  - `max_quantity` (integer) - Maximum quantity capacity
  - `unit_cost` (decimal) - Cost per unit
  - `supplier` (text, nullable) - Supplier name
  - `location` (text, nullable) - Storage location
  - `notes` (text, nullable) - Additional notes
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `user_id` (uuid) - User who owns/manages this inventory

  ### `inventory_transactions`
  - `id` (uuid, primary key) - Unique identifier for each transaction
  - `item_id` (uuid, foreign key) - Reference to inventory item
  - `type` (text) - Transaction type: 'in', 'out', 'adjustment'
  - `quantity` (integer) - Quantity changed
  - `unit_cost` (decimal, nullable) - Cost per unit for this transaction
  - `reference` (text, nullable) - Reference number or document
  - `bus_id` (text, nullable) - Related bus if applicable
  - `notes` (text, nullable) - Transaction notes
  - `created_at` (timestamptz) - Transaction timestamp
  - `user_id` (uuid) - User who performed the transaction

  ## 2. Security
  - Enable RLS on both tables
  - Add policies for authenticated users to manage their own inventory
  - Users can only access inventory items they created
  - Users can only view transactions for their inventory items

  ## 3. Important Notes
  - Default values set for timestamps and quantity fields
  - Cascading delete for transactions when inventory item is deleted
  - Indexes added for performance on frequently queried columns
*/

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('parts', 'supplies', 'tools', 'fuel', 'other')),
  quantity integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'pieces',
  min_quantity integer NOT NULL DEFAULT 0,
  max_quantity integer NOT NULL DEFAULT 1000,
  unit_cost decimal(10,2) NOT NULL DEFAULT 0,
  supplier text,
  location text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  quantity integer NOT NULL,
  unit_cost decimal(10,2),
  reference text,
  bus_id text,
  notes text,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory items"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory items"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory items"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory items"
  ON inventory_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view transactions for own inventory"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inventory_items
      WHERE inventory_items.id = inventory_transactions.item_id
      AND inventory_items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert transactions for own inventory"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM inventory_items
      WHERE inventory_items.id = inventory_transactions.item_id
      AND inventory_items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update transactions for own inventory"
  ON inventory_transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inventory_items
      WHERE inventory_items.id = inventory_transactions.item_id
      AND inventory_items.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM inventory_items
      WHERE inventory_items.id = inventory_transactions.item_id
      AND inventory_items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete transactions for own inventory"
  ON inventory_transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inventory_items
      WHERE inventory_items.id = inventory_transactions.item_id
      AND inventory_items.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_user_id ON inventory_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON inventory_transactions(created_at);