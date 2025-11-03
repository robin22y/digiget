-- =====================================================
-- Create employee_contributions Table and Apply RLS
-- Run this in Supabase SQL Editor FIRST
-- =====================================================

-- Create employee contribution tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS employee_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  customer_checkin_id UUID, -- Will reference customer_checkins or customer_visits
  contribution_date DATE NOT NULL,
  bill_amount DECIMAL(10,2) NOT NULL,
  commission_earned DECIMAL(10,2) DEFAULT 0,
  hours_worked DECIMAL(5,2) DEFAULT 0,
  hourly_wages DECIMAL(10,2) DEFAULT 0,
  total_earnings DECIMAL(10,2) NOT NULL,
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

-- Policy 1: Shop owners can view all contributions for their shops
-- Explanation: Shop owners need to see all employee contributions for payroll/analytics
CREATE POLICY "Shop owners can view their contributions"
  ON employee_contributions
  FOR SELECT
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Employees can view their own contributions (if they have user_id in employees table)
-- Explanation: Staff members need to see their own earnings and performance
-- Note: If employees don't have user_id, this will need to be adjusted based on your auth system
CREATE POLICY "Staff can view their own contributions"
  ON employee_contributions
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees 
      WHERE EXISTS (
        SELECT 1 FROM shops
        WHERE shops.id = employee_contributions.shop_id
        AND shops.user_id = auth.uid()
      )
      OR employee_id IN (
        -- Allow if employee has matching user_id (if your employees table has user_id column)
        SELECT id FROM employees 
        WHERE id = employee_contributions.employee_id
        AND EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'employees' AND column_name = 'user_id'
        )
        AND (
          SELECT user_id FROM employees 
          WHERE id = employee_contributions.employee_id
        ) = auth.uid()
      )
    )
  );

-- Policy 3: Shop owners can insert contributions (for system-generated records)
-- Explanation: When check-ins happen, the system needs to create contribution records
CREATE POLICY "Shop owners can insert contributions"
  ON employee_contributions
  FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- Policy 4: Service role can manage everything (for server-side operations)
-- Explanation: Service role bypasses RLS and is used by Edge Functions/background jobs
CREATE POLICY "Service role can manage contributions"
  ON employee_contributions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 5: Allow anonymous insert (for shop portal check-in without auth)
-- Explanation: Shop portal (tablet) may need to create contributions without user authentication
CREATE POLICY "Anonymous can insert contributions for shop portal"
  ON employee_contributions
  FOR INSERT
  TO anon
  WITH CHECK (true);

COMMENT ON TABLE employee_contributions IS 'Tracks employee revenue contributions and earnings';

