/*
  # Create expenses table

  1. New Tables
    - `expenses`
      - `id` (uuid, primary key)
      - `category` (text) - Category of expense (fuel, salary, maintenance, toll, insurance, other)
      - `description` (text) - Description of the expense
      - `amount` (numeric) - Amount of the expense
      - `date` (date) - Date of the expense
      - `bus_id` (text, nullable) - Associated bus if applicable
      - `receipt_number` (text, nullable) - Receipt or invoice number
      - `vendor` (text, nullable) - Vendor name
      - `notes` (text, nullable) - Additional notes
      - `created_by` (uuid) - User who created the record
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      
  2. Security
    - Enable RLS on `expenses` table
    - Add policy for authenticated users to read their expenses
    - Add policy for authenticated users to create their expenses
    - Add policy for authenticated users to update their expenses
    - Add policy for authenticated users to delete their expenses
*/

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('fuel', 'salary', 'maintenance', 'toll', 'insurance', 'other')),
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL,
  bus_id text,
  receipt_number text,
  vendor text,
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());