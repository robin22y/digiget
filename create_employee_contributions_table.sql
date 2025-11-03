-- =====================================================
-- Create employee_contributions Table
-- Run this in Supabase SQL Editor if table doesn't exist
-- =====================================================

-- Create employee contribution tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS employee_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  customer_checkin_id UUID, -- Will reference customer_visits or customer_checkins
  contribution_date DATE NOT NULL,
  bill_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  commission_earned DECIMAL(10,2) DEFAULT 0,
  hours_worked DECIMAL(5,2) DEFAULT 0,
  hourly_wages DECIMAL(10,2) DEFAULT 0,
  total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_employee_contributions_shop ON employee_contributions(shop_id);
CREATE INDEX IF NOT EXISTS idx_employee_contributions_employee ON employee_contributions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_contributions_date ON employee_contributions(contribution_date);

-- Enable RLS
ALTER TABLE employee_contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-running)
DROP POLICY IF EXISTS "Shop owners can view their contributions" ON employee_contributions;
DROP POLICY IF EXISTS "Staff can view their own contributions" ON employee_contributions;
DROP POLICY IF EXISTS "Shop owners can insert contributions" ON employee_contributions;
DROP POLICY IF EXISTS "Service role can manage contributions" ON employee_contributions;
DROP POLICY IF EXISTS "Anonymous can insert contributions for shop portal" ON employee_contributions;

-- Policy 1: Shop owners can view all contributions for their shops
CREATE POLICY "Shop owners can view their contributions"
  ON employee_contributions
  FOR SELECT
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Employees can view their own contributions
-- Note: This allows public access if employees don't have user_id
-- Adjust based on your authentication system
CREATE POLICY "Staff can view their own contributions"
  ON employee_contributions
  FOR SELECT
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- Policy 3: Shop owners can insert contributions
CREATE POLICY "Shop owners can insert contributions"
  ON employee_contributions
  FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- Policy 4: Service role can manage everything
CREATE POLICY "Service role can manage contributions"
  ON employee_contributions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 5: Allow anonymous insert (for shop portal check-in without auth)
-- This is CRITICAL for shop tablet portal to work
CREATE POLICY "Anonymous can insert contributions for shop portal"
  ON employee_contributions
  FOR INSERT
  TO anon
  WITH CHECK (true);

COMMENT ON TABLE employee_contributions IS 'Tracks employee revenue contributions and earnings';
