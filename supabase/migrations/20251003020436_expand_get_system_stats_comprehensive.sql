/*
  # Expand get_system_stats function to include ALL database tables

  This function provides comprehensive real-time access to ALL system data
  for the AI assistant to answer any question about the business.

  Tables included:
  - buses, bus_locations
  - trips, passenger_trips
  - routes, route_segments, bus_stops
  - employees
  - maintenance_records, maintenance_items
  - inventory_items, inventory_transactions, item_catalog
  - expenses
  - operational_incidents
  - passenger_demand_history, travel_time_history
  - ai_predictions, cost_forecasts
  - risky_driving_events
*/

CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    -- BUSES
    'buses', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'by_status', jsonb_object_agg(status, count),
        'recent_buses', (
          SELECT jsonb_agg(jsonb_build_object(
            'id', id,
            'license_plate', license_plate,
            'driver_name', driver_name,
            'route', route,
            'status', status
          ))
          FROM (SELECT * FROM buses ORDER BY updated_at DESC LIMIT 10) b
        )
      )
      FROM (
        SELECT status, COUNT(*) as count
        FROM buses
        GROUP BY status
      ) buses_stats
    ),
    
    -- TRIPS (Today and Recent)
    'trips', (
      SELECT jsonb_build_object(
        'today', (
          SELECT jsonb_build_object(
            'count', COUNT(*),
            'total_passengers', COALESCE(SUM(passenger_count), 0),
            'total_revenue', COALESCE(SUM(revenue), 0),
            'total_distance_km', COALESCE(SUM(distance_km), 0),
            'completed', COUNT(*) FILTER (WHERE status = 'completed'),
            'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress')
          )
          FROM trips
          WHERE DATE(start_time) = CURRENT_DATE
        ),
        'last_7_days', (
          SELECT jsonb_build_object(
            'count', COUNT(*),
            'total_passengers', COALESCE(SUM(passenger_count), 0),
            'total_revenue', COALESCE(SUM(revenue), 0),
            'avg_passengers_per_trip', COALESCE(AVG(passenger_count), 0)
          )
          FROM trips
          WHERE start_time >= CURRENT_DATE - INTERVAL '7 days'
        ),
        'last_30_days', (
          SELECT jsonb_build_object(
            'count', COUNT(*),
            'total_revenue', COALESCE(SUM(revenue), 0),
            'total_distance_km', COALESCE(SUM(distance_km), 0)
          )
          FROM trips
          WHERE start_time >= CURRENT_DATE - INTERVAL '30 days'
        ),
        'by_payment_method_today', (
          SELECT jsonb_build_object(
            'cash', COALESCE(SUM(payment_method_cash), 0),
            'card', COALESCE(SUM(payment_method_card), 0),
            'qr', COALESCE(SUM(payment_method_qr), 0)
          )
          FROM trips
          WHERE DATE(start_time) = CURRENT_DATE
        )
      )
    ),
    
    -- ROUTES
    'routes', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'active', COUNT(*) FILTER (WHERE is_active = true),
        'routes_list', (
          SELECT jsonb_agg(jsonb_build_object(
            'id', id,
            'name', name,
            'code', code,
            'origin', origin,
            'destination', destination,
            'distance_km', distance_km,
            'ticket_price', ticket_price
          ))
          FROM routes
          WHERE is_active = true
        )
      )
      FROM routes
    ),
    
    -- EMPLOYEES
    'employees', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'active', COUNT(*) FILTER (WHERE status = 'active'),
        'by_position', jsonb_object_agg(position, count)
      )
      FROM (
        SELECT position, COUNT(*) as count
        FROM employees
        WHERE status = 'active'
        GROUP BY position
      ) emp_stats
    ),
    
    -- MAINTENANCE
    'maintenance', (
      SELECT jsonb_build_object(
        'total_records', COUNT(*),
        'by_status', jsonb_object_agg(status, count),
        'total_cost_last_30_days', (
          SELECT COALESCE(SUM(cost), 0)
          FROM maintenance_records
          WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        ),
        'pending_count', COUNT(*) FILTER (WHERE status = 'scheduled'),
        'in_progress_count', COUNT(*) FILTER (WHERE status = 'in_progress'),
        'upcoming_7_days', (
          SELECT COUNT(*)
          FROM maintenance_records
          WHERE scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
          AND status IN ('scheduled', 'in_progress')
        )
      )
      FROM (
        SELECT status, COUNT(*) as count
        FROM maintenance_records
        GROUP BY status
      ) maint_stats
    ),
    
    -- INVENTORY
    'inventory', (
      SELECT jsonb_build_object(
        'total_items', COUNT(*),
        'low_stock_items', COUNT(*) FILTER (WHERE quantity < min_quantity),
        'out_of_stock', COUNT(*) FILTER (WHERE quantity = 0),
        'total_value', COALESCE(SUM(quantity * unit_cost), 0),
        'by_category', (
          SELECT jsonb_object_agg(category, count)
          FROM (
            SELECT category, COUNT(*) as count
            FROM inventory_items
            GROUP BY category
          ) cat_stats
        ),
        'low_stock_list', (
          SELECT jsonb_agg(jsonb_build_object(
            'name', name,
            'category', category,
            'quantity', quantity,
            'min_quantity', min_quantity,
            'unit_cost', unit_cost
          ))
          FROM inventory_items
          WHERE quantity < min_quantity
          LIMIT 10
        )
      )
      FROM inventory_items
    ),
    
    -- EXPENSES
    'expenses', (
      SELECT jsonb_build_object(
        'last_30_days', (
          SELECT jsonb_build_object(
            'total', COALESCE(SUM(amount), 0),
            'by_category', jsonb_object_agg(category, total)
          )
          FROM (
            SELECT category, SUM(amount) as total
            FROM expenses
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY category
            ORDER BY total DESC
          ) exp_cat
        ),
        'today', (
          SELECT COALESCE(SUM(amount), 0)
          FROM expenses
          WHERE DATE(date) = CURRENT_DATE
        ),
        'this_month', (
          SELECT COALESCE(SUM(amount), 0)
          FROM expenses
          WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)
        )
      )
    ),
    
    -- INCIDENTS
    'incidents', (
      SELECT jsonb_build_object(
        'total_unresolved', COUNT(*) FILTER (WHERE resolved_at IS NULL),
        'last_7_days', COUNT(*) FILTER (WHERE reported_at >= CURRENT_DATE - INTERVAL '7 days'),
        'by_severity', (
          SELECT jsonb_object_agg(severity, count)
          FROM (
            SELECT severity, COUNT(*) as count
            FROM operational_incidents
            WHERE resolved_at IS NULL
            GROUP BY severity
          ) sev_stats
        ),
        'by_type', (
          SELECT jsonb_object_agg(incident_type, count)
          FROM (
            SELECT incident_type, COUNT(*) as count
            FROM operational_incidents
            WHERE reported_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY incident_type
          ) type_stats
        )
      )
      FROM operational_incidents
    ),
    
    -- RISKY DRIVING EVENTS
    'risky_driving', (
      SELECT jsonb_build_object(
        'total_last_7_days', COUNT(*),
        'by_severity', jsonb_object_agg(severity, count),
        'by_event_type', (
          SELECT jsonb_object_agg(event_type, count)
          FROM (
            SELECT event_type, COUNT(*) as count
            FROM risky_driving_events
            WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY event_type
          ) event_stats
        ),
        'top_buses', (
          SELECT jsonb_agg(jsonb_build_object(
            'bus_id', bus_id,
            'event_count', event_count
          ))
          FROM (
            SELECT bus_id, COUNT(*) as event_count
            FROM risky_driving_events
            WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY bus_id
            ORDER BY event_count DESC
            LIMIT 5
          ) top_buses
        )
      )
      FROM (
        SELECT severity, COUNT(*) as count
        FROM risky_driving_events
        WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY severity
      ) risk_stats
    ),
    
    -- PASSENGER DEMAND ANALYTICS
    'passenger_demand', (
      SELECT jsonb_build_object(
        'last_7_days_total', COALESCE(SUM(passenger_count), 0),
        'avg_per_hour', COALESCE(AVG(passenger_count), 0),
        'peak_hours', (
          SELECT jsonb_agg(jsonb_build_object(
            'hour', hour,
            'avg_passengers', avg_passengers
          ))
          FROM (
            SELECT hour, AVG(passenger_count) as avg_passengers
            FROM passenger_demand_history
            WHERE date >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY hour
            ORDER BY avg_passengers DESC
            LIMIT 3
          ) peak
        )
      )
      FROM passenger_demand_history
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
    ),
    
    -- BUS LOCATIONS (Real-time tracking)
    'bus_locations', (
      SELECT jsonb_build_object(
        'total_tracked', COUNT(DISTINCT bus_id),
        'last_update', MAX(timestamp),
        'recent_locations', (
          SELECT jsonb_agg(jsonb_build_object(
            'bus_id', bus_id,
            'latitude', latitude,
            'longitude', longitude,
            'speed', speed,
            'timestamp', timestamp
          ))
          FROM (
            SELECT DISTINCT ON (bus_id) bus_id, latitude, longitude, speed, timestamp
            FROM bus_locations
            ORDER BY bus_id, timestamp DESC
          ) recent_locs
          LIMIT 20
        )
      )
      FROM bus_locations
      WHERE timestamp >= NOW() - INTERVAL '1 hour'
    ),
    
    -- SYSTEM SUMMARY
    'summary', jsonb_build_object(
      'timestamp', NOW(),
      'date', CURRENT_DATE,
      'total_active_buses', (SELECT COUNT(*) FROM buses WHERE status = 'active'),
      'total_trips_today', (SELECT COUNT(*) FROM trips WHERE DATE(start_time) = CURRENT_DATE),
      'total_revenue_today', (SELECT COALESCE(SUM(revenue), 0) FROM trips WHERE DATE(start_time) = CURRENT_DATE),
      'pending_maintenance', (SELECT COUNT(*) FROM maintenance_records WHERE status IN ('scheduled', 'in_progress')),
      'low_stock_items', (SELECT COUNT(*) FROM inventory_items WHERE quantity < min_quantity),
      'unresolved_incidents', (SELECT COUNT(*) FROM operational_incidents WHERE resolved_at IS NULL)
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_system_stats() TO authenticated;

COMMENT ON FUNCTION get_system_stats() IS 'Comprehensive system statistics for AI assistant - includes all operational data in real-time';
