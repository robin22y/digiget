-- =====================================================
-- Add Commission-Based Payroll System
-- Supports hourly, commission-only, and hybrid payment models
-- =====================================================

-- Add commission fields to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'hourly',
ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS base_hourly_rate DECIMAL(10,2) DEFAULT 0;

-- payment_type: 'hourly', 'commission', 'hybrid'
-- commission_percentage: 0-100 (e.g., 50 = 50%)
-- base_hourly_rate: hourly wage for hybrid model (0 for commission-only)

COMMENT ON COLUMN employees.payment_type IS 'hourly, commission, or hybrid';
COMMENT ON COLUMN employees.commission_percentage IS 'Commission % (0-100)';
COMMENT ON COLUMN employees.base_hourly_rate IS 'Hourly rate for hybrid model';

-- Add bill amount to customer_checkins (if table exists)
-- First check if customer_checkins exists, otherwise we'll use customer_visits
DO $$
BEGIN
  -- Try to add to customer_checkins
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customer_checkins') THEN
    ALTER TABLE customer_checkins
    ADD COLUMN IF NOT EXISTS bill_amount DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS commission_earned DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS checked_in_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;
    
    COMMENT ON COLUMN customer_checkins.bill_amount IS 'Total bill amount for this visit';
    COMMENT ON COLUMN customer_checkins.commission_earned IS 'Commission earned by staff for this visit';
  END IF;
  
  -- Also check for customer_visits table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customer_visits') THEN
    ALTER TABLE customer_visits
    ADD COLUMN IF NOT EXISTS bill_amount DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS commission_earned DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS checked_in_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;
    
    COMMENT ON COLUMN customer_visits.bill_amount IS 'Total bill amount for this visit';
    COMMENT ON COLUMN customer_visits.commission_earned IS 'Commission earned by staff for this visit';
  END IF;
END $$;

-- Create employee contribution tracking table
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

CREATE INDEX IF NOT EXISTS idx_employee_contributions_shop ON employee_contributions(shop_id);
CREATE INDEX IF NOT EXISTS idx_employee_contributions_employee ON employee_contributions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_contributions_date ON employee_contributions(contribution_date);

-- Enable RLS
ALTER TABLE employee_contributions ENABLE ROW LEVEL SECURITY;

-- Policies for employee_contributions
DROP POLICY IF EXISTS "Shop owners can view their contributions" ON employee_contributions;
DROP POLICY IF EXISTS "Staff can view their own contributions" ON employee_contributions;

CREATE POLICY "Shop owners can view their contributions"
  ON employee_contributions
  FOR SELECT
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- Note: For staff to view their own contributions, they need to be authenticated
-- This requires employees table to have user_id or we use PIN lookup
-- For now, allowing public read but this should be secured based on your auth system
CREATE POLICY "Staff can view their own contributions"
  ON employee_contributions
  FOR SELECT
  USING (true); -- TODO: Update this with proper auth when staff authentication is implemented

-- Create shop revenue summary table
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

CREATE INDEX IF NOT EXISTS idx_daily_revenue_shop ON daily_revenue_summary(shop_id);
CREATE INDEX IF NOT EXISTS idx_daily_revenue_date ON daily_revenue_summary(summary_date);

-- Enable RLS
ALTER TABLE daily_revenue_summary ENABLE ROW LEVEL SECURITY;

-- Policies for daily_revenue_summary
DROP POLICY IF EXISTS "Shop owners can view their revenue" ON daily_revenue_summary;

CREATE POLICY "Shop owners can view their revenue"
  ON daily_revenue_summary
  FOR ALL
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE employee_contributions IS 'Tracks employee revenue contributions and earnings';
COMMENT ON TABLE daily_revenue_summary IS 'Daily aggregated revenue and payroll metrics per shop';

