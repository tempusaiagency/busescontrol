/*
  # Clean Database - Drop All Tables and Data

  ## Overview
  This migration drops all existing tables, functions, and data to create a clean slate.

  ## Actions
  1. Drop all existing tables in cascade mode
  2. Drop all custom functions
  3. Reset database to clean state

  ## Important Notes
  - ALL DATA WILL BE DELETED
  - This is irreversible
  - Auth users table is not dropped (managed by Supabase Auth)
*/

-- Drop all existing tables in cascade mode to handle foreign key dependencies
DROP TABLE IF EXISTS fare_confirmations CASCADE;
DROP TABLE IF EXISTS fare_quotes CASCADE;
DROP TABLE IF EXISTS fare_pricing_rules CASCADE;
DROP TABLE IF EXISTS destinations CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS bus_locations CASCADE;
DROP TABLE IF EXISTS buses CASCADE;
DROP TABLE IF EXISTS maintenance_schedules CASCADE;
DROP TABLE IF EXISTS maintenance_records CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS user_role_assignments CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS item_catalog CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS inventory_transactions CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS ai_predictions CASCADE;
DROP TABLE IF EXISTS ai_training_data CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;

-- Drop any custom functions that might exist
DROP FUNCTION IF EXISTS get_system_stats() CASCADE;
DROP FUNCTION IF EXISTS calculate_fare(numeric, numeric, text) CASCADE;
