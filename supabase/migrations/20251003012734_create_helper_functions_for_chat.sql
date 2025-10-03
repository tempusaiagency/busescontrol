/*
  # Helper Functions for Chat Assistant

  1. Functions
    - `get_system_stats()` - Obtener estadísticas del sistema
    - Helper para el chat assistant

  2. Security
    - Solo usuarios autenticados pueden ejecutar
*/

-- Function to get comprehensive system statistics
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  buses_data jsonb;
  trips_today_data jsonb;
  expenses_data jsonb;
  maintenance_data jsonb;
  inventory_data jsonb;
  employees_data jsonb;
BEGIN
  -- Buses stats
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'active', COUNT(*) FILTER (WHERE status = 'active'),
    'maintenance', COUNT(*) FILTER (WHERE status = 'maintenance'),
    'inactive', COUNT(*) FILTER (WHERE status = 'inactive')
  ) INTO buses_data
  FROM buses;

  -- Today's trips
  SELECT jsonb_build_object(
    'count', COUNT(*),
    'passengers', COALESCE(SUM(passenger_count), 0),
    'revenue', COALESCE(SUM(revenue), 0),
    'distance_km', COALESCE(SUM(distance_km), 0)
  ) INTO trips_today_data
  FROM trips
  WHERE DATE(start_time) = CURRENT_DATE;

  -- Recent expenses (last 30 days)
  SELECT jsonb_agg(
    jsonb_build_object(
      'category', category,
      'total', total
    )
  ) INTO expenses_data
  FROM (
    SELECT category, SUM(amount) as total
    FROM expenses
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY category
    ORDER BY total DESC
    LIMIT 5
  ) e;

  -- Maintenance pending
  SELECT jsonb_build_object(
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'completed', COUNT(*) FILTER (WHERE status = 'completed')
  ) INTO maintenance_data
  FROM maintenance_records;

  -- Inventory low stock
  SELECT jsonb_build_object(
    'low_stock_items', COUNT(*) FILTER (WHERE quantity < minimum_quantity),
    'total_items', COUNT(*)
  ) INTO inventory_data
  FROM inventory;

  -- Employees by position
  SELECT jsonb_agg(
    jsonb_build_object(
      'position', position,
      'count', count
    )
  ) INTO employees_data
  FROM (
    SELECT position, COUNT(*) as count
    FROM employees
    WHERE status = 'active'
    GROUP BY position
  ) emp;

  -- Build final result
  result := jsonb_build_object(
    'buses', buses_data,
    'trips_today', trips_today_data,
    'expenses_last_30_days', COALESCE(expenses_data, '[]'::jsonb),
    'maintenance', maintenance_data,
    'inventory', inventory_data,
    'employees', COALESCE(employees_data, '[]'::jsonb),
    'timestamp', NOW()
  );

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_system_stats() TO authenticated;
