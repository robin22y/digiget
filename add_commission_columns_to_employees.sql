-- =====================================================
-- Add Commission Columns to Employees Table
-- Run this in Supabase SQL Editor
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

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'employees'
AND column_name IN ('payment_type', 'commission_percentage', 'base_hourly_rate')
ORDER BY column_name;

