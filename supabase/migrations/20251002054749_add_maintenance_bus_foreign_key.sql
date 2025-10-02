/*
  # Add Foreign Key for Maintenance Records

  1. Changes
    - Add foreign key constraint from maintenance_records.bus_id to buses.id
    - This ensures data integrity between maintenance records and buses

  2. Note
    - Uses IF NOT EXISTS pattern to avoid errors if constraint already exists
*/

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'maintenance_records_bus_id_fkey' 
    AND table_name = 'maintenance_records'
  ) THEN
    ALTER TABLE maintenance_records
      ADD CONSTRAINT maintenance_records_bus_id_fkey
      FOREIGN KEY (bus_id) REFERENCES buses(id)
      ON DELETE CASCADE;
  END IF;
END $$;