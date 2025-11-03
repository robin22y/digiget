-- =====================================================
-- Create daily_revenue_summary Table and Apply RLS
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create shop revenue summary table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_revenue_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  summary_date DATE NOT NULL,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  total_payroll DECIMAL(10,2) DEFAULT 0,
  net_profit DECIMAL(10,2) DEFAULT 0,
  total_customers INT DEFAULT 0,
  new_customers INT DEFAULT 0,
  returning_customers INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, summary_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_revenue_shop ON daily_revenue_summary(shop_id);
CREATE INDEX IF NOT EXISTS idx_daily_revenue_date ON daily_revenue_summary(summary_date);

-- Enable RLS
ALTER TABLE daily_revenue_summary ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-running)
DROP POLICY IF EXISTS "Shop owners can view their revenue" ON daily_revenue_summary;
DROP POLICY IF EXISTS "Shop owners can manage their revenue" ON daily_revenue_summary;
DROP POLICY IF EXISTS "Service role can manage revenue summaries" ON daily_revenue_summary;

-- Policy 1: Shop owners can view their revenue summaries
-- Explanation: Shop owners need access to their analytics and reports
CREATE POLICY "Shop owners can view their revenue"
  ON daily_revenue_summary
  FOR SELECT
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Shop owners can insert/update revenue summaries
-- Explanation: System needs to create/update daily summaries (can be automated or manual)
CREATE POLICY "Shop owners can manage their revenue"
  ON daily_revenue_summary
  FOR ALL
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

-- Policy 3: Service role can manage everything (for automated jobs)
-- Explanation: Background jobs/scheduled functions need to update summaries
CREATE POLICY "Service role can manage revenue summaries"
  ON daily_revenue_summary
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE daily_revenue_summary IS 'Daily aggregated revenue and payroll metrics per shop';

