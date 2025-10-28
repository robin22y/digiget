-- =====================================================
-- Create Staff Location Check-ins Table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create staff_location_checkins table if it doesn't exist
CREATE TABLE IF NOT EXISTS staff_location_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  clock_entry_id UUID REFERENCES clock_entries(id) ON DELETE CASCADE NOT NULL,
  
  location_name TEXT,
  check_in_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  check_out_time TIMESTAMPTZ,
  check_in_latitude DECIMAL(10, 8) NOT NULL,
  check_in_longitude DECIMAL(11, 8) NOT NULL,
  check_out_latitude DECIMAL(10, 8),
  check_out_longitude DECIMAL(11, 8),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE staff_location_checkins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-running)
DROP POLICY IF EXISTS "Employees can manage their own location checkins" ON staff_location_checkins;
DROP POLICY IF EXISTS "Shop owners can view location checkins" ON staff_location_checkins;
DROP POLICY IF EXISTS "Public can view location checkins" ON staff_location_checkins;

-- Employees can create and update their own location check-ins
CREATE POLICY "Employees can manage their own location checkins"
  ON staff_location_checkins
  FOR ALL
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE shop_id IN (
        SELECT id FROM shops WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE shop_id IN (
        SELECT id FROM shops WHERE user_id = auth.uid()
      )
    )
  );

-- Shop owners can view all location check-ins for their shop
CREATE POLICY "Shop owners can view location checkins"
  ON staff_location_checkins
  FOR SELECT
  TO authenticated
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- Allow public read for staff portal
CREATE POLICY "Public can view location checkins"
  ON staff_location_checkins
  FOR SELECT
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_location_checkins_shop_id ON staff_location_checkins(shop_id);
CREATE INDEX IF NOT EXISTS idx_location_checkins_employee_id ON staff_location_checkins(employee_id);
CREATE INDEX IF NOT EXISTS idx_location_checkins_clock_entry_id ON staff_location_checkins(clock_entry_id);
CREATE INDEX IF NOT EXISTS idx_location_checkins_check_in_time ON staff_location_checkins(check_in_time DESC);
CREATE INDEX IF NOT EXISTS idx_location_checkins_active ON staff_location_checkins(employee_id, check_out_time) WHERE check_out_time IS NULL;

-- Done! The staff_location_checkins table is now set up.

