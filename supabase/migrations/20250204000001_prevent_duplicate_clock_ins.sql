-- Migration: Prevent duplicate active clock-ins
-- Date: 2025-02-04
-- 
-- Ensures staff can't have multiple open clock-ins
-- This prevents race conditions and data corruption

-- Create unique partial index on active clock-ins
-- This ensures only ONE active clock-in per staff member per shop
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_active_clock 
ON clock_entries(employee_id, shop_id) 
WHERE clock_out_time IS NULL;

-- Add comment
COMMENT ON INDEX idx_staff_active_clock IS 'Ensures only one active clock-in per employee per shop. Prevents duplicate clock-ins from race conditions or simultaneous submissions from different methods.';

