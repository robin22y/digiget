-- =====================================================
-- Create Remote Clock-In Approvals Table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create remote_clock_in_approvals table if it doesn't exist
CREATE TABLE IF NOT EXISTS remote_clock_in_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  -- Approval configuration
  days_of_week INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- 0=Sunday, 1=Monday, ..., 6=Saturday
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE remote_clock_in_approvals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-running)
DROP POLICY IF EXISTS "Shop owners can manage remote approvals" ON remote_clock_in_approvals;
DROP POLICY IF EXISTS "Employees can view their approvals" ON remote_clock_in_approvals;
DROP POLICY IF EXISTS "Public can view remote approvals" ON remote_clock_in_approvals;

-- Shop owners can manage all remote approvals for their shop
CREATE POLICY "Shop owners can manage remote approvals"
  ON remote_clock_in_approvals
  FOR ALL
  TO authenticated
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- Employees can view their own approvals
CREATE POLICY "Employees can view their approvals"
  ON remote_clock_in_approvals
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow public read for staff portal
CREATE POLICY "Public can view remote approvals"
  ON remote_clock_in_approvals
  FOR SELECT
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_remote_approvals_shop_id ON remote_clock_in_approvals(shop_id);
CREATE INDEX IF NOT EXISTS idx_remote_approvals_employee_id ON remote_clock_in_approvals(employee_id);
CREATE INDEX IF NOT EXISTS idx_remote_approvals_active ON remote_clock_in_approvals(shop_id, is_active, start_date, end_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_remote_approvals_date_range ON remote_clock_in_approvals(start_date, end_date);

-- Done! The remote_clock_in_approvals table is now set up.

