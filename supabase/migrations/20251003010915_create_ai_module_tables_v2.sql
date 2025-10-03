/*
  # AI Module Database Schema

  1. New Tables
    - `route_segments` - Tramos de rutas con coordenadas GPS
    - `bus_stops` - Paradas de buses
    - `segment_stops` - Relación entre tramos y paradas
    - `passenger_demand_history` - Histórico de demanda de pasajeros
    - `travel_time_history` - Histórico de tiempos de viaje
    - `ai_predictions` - Predicciones generadas por modelos de IA
    - `cost_forecasts` - Pronósticos de costos
    - `risky_driving_events` - Eventos de conducción riesgosa

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users with admin/manager role checks
*/

-- Route Segments Table
CREATE TABLE IF NOT EXISTS route_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE,
  segment_name text NOT NULL,
  start_lat decimal(10, 8) NOT NULL,
  start_lng decimal(11, 8) NOT NULL,
  end_lat decimal(10, 8) NOT NULL,
  end_lng decimal(11, 8) NOT NULL,
  distance_km decimal(10, 2) DEFAULT 0,
  avg_duration_minutes integer DEFAULT 0,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE route_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view route segments"
  ON route_segments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert route segments"
  ON route_segments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can update route segments"
  ON route_segments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete route segments"
  ON route_segments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('admin', 'manager')
    )
  );

-- Bus Stops Table
CREATE TABLE IF NOT EXISTS bus_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_name text NOT NULL,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  address text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bus_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view bus stops"
  ON bus_stops FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage bus stops"
  ON bus_stops FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('admin', 'manager')
    )
  );

-- Segment Stops Junction Table
CREATE TABLE IF NOT EXISTS segment_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id uuid REFERENCES route_segments(id) ON DELETE CASCADE,
  stop_id uuid REFERENCES bus_stops(id) ON DELETE CASCADE,
  stop_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(segment_id, stop_id)
);

ALTER TABLE segment_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view segment stops"
  ON segment_stops FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage segment stops"
  ON segment_stops FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('admin', 'manager')
    )
  );

-- Passenger Demand History
CREATE TABLE IF NOT EXISTS passenger_demand_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE,
  segment_id uuid REFERENCES route_segments(id) ON DELETE SET NULL,
  stop_id uuid REFERENCES bus_stops(id) ON DELETE SET NULL,
  date date NOT NULL,
  hour integer NOT NULL CHECK (hour >= 0 AND hour <= 23),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  passenger_count integer DEFAULT 0,
  boarding_count integer DEFAULT 0,
  alighting_count integer DEFAULT 0,
  weather_condition text,
  temperature_celsius decimal(5, 2),
  is_holiday boolean DEFAULT false,
  is_weekend boolean DEFAULT false,
  special_event text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE passenger_demand_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view passenger demand history"
  ON passenger_demand_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert passenger demand history"
  ON passenger_demand_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Travel Time History
CREATE TABLE IF NOT EXISTS travel_time_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  segment_id uuid REFERENCES route_segments(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  duration_minutes integer NOT NULL,
  traffic_level text DEFAULT 'medio',
  weather_condition text,
  day_of_week integer NOT NULL,
  hour integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE travel_time_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view travel time history"
  ON travel_time_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert travel time history"
  ON travel_time_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- AI Predictions
CREATE TABLE IF NOT EXISTS ai_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_type text NOT NULL,
  route_id uuid REFERENCES routes(id) ON DELETE SET NULL,
  segment_id uuid REFERENCES route_segments(id) ON DELETE SET NULL,
  bus_id text,
  prediction_date date NOT NULL,
  prediction_hour integer CHECK (prediction_hour IS NULL OR (prediction_hour >= 0 AND prediction_hour <= 23)),
  predicted_value decimal(12, 2) NOT NULL,
  confidence_score decimal(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  actual_value decimal(12, 2),
  model_version text DEFAULT 'v1.0',
  features_used jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view AI predictions"
  ON ai_predictions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage AI predictions"
  ON ai_predictions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Cost Forecasts
CREATE TABLE IF NOT EXISTS cost_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_month date NOT NULL,
  fuel_cost_predicted decimal(12, 2) DEFAULT 0,
  maintenance_cost_predicted decimal(12, 2) DEFAULT 0,
  total_cost_predicted decimal(12, 2) DEFAULT 0,
  fuel_price_per_liter decimal(10, 2) DEFAULT 0,
  total_km_expected decimal(12, 2) DEFAULT 0,
  confidence_interval_lower decimal(12, 2) DEFAULT 0,
  confidence_interval_upper decimal(12, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(forecast_month)
);

ALTER TABLE cost_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cost forecasts"
  ON cost_forecasts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage cost forecasts"
  ON cost_forecasts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('admin', 'manager')
    )
  );

-- Risky Driving Events (bus_id references buses.id not bus_id)
CREATE TABLE IF NOT EXISTS risky_driving_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id text REFERENCES buses(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  severity text DEFAULT 'medium',
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  speed_kmh decimal(6, 2),
  timestamp timestamptz NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE risky_driving_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view risky driving events"
  ON risky_driving_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert risky driving events"
  ON risky_driving_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage risky driving events"
  ON risky_driving_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('admin', 'manager')
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_route_segments_route_id ON route_segments(route_id);
CREATE INDEX IF NOT EXISTS idx_segment_stops_segment_id ON segment_stops(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_stops_stop_id ON segment_stops(stop_id);
CREATE INDEX IF NOT EXISTS idx_passenger_demand_date ON passenger_demand_history(date);
CREATE INDEX IF NOT EXISTS idx_passenger_demand_route ON passenger_demand_history(route_id);
CREATE INDEX IF NOT EXISTS idx_travel_time_segment ON travel_time_history(segment_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_type_date ON ai_predictions(prediction_type, prediction_date);
CREATE INDEX IF NOT EXISTS idx_risky_driving_bus ON risky_driving_events(bus_id);
CREATE INDEX IF NOT EXISTS idx_risky_driving_timestamp ON risky_driving_events(timestamp);
