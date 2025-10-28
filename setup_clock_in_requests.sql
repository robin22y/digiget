-- =====================================================
-- Create Clock In Requests Table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create clock_in_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS clock_in_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  request_latitude DECIMAL(10, 8) NOT NULL,
  request_longitude DECIMAL(11, 8) NOT NULL,
  distance_from_shop DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE clock_in_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-running)
DROP POLICY IF EXISTS "Authenticated users can create clock in requests" ON clock_in_requests;
DROP POLICY IF EXISTS "Users can view their employee requests" ON clock_in_requests;
DROP POLICY IF EXISTS "Shop owners can update requests" ON clock_in_requests;
DROP POLICY IF EXISTS "Public can view clock in requests" ON clock_in_requests;

-- Create RLS policies
CREATE POLICY "Authenticated users can create clock in requests"
  ON clock_in_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow employees to view their own requests and shop owners to view all requests for their shop
CREATE POLICY "Users can view their employee requests"
  ON clock_in_requests
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE shop_id IN (
        SELECT id FROM shops WHERE user_id = auth.uid()
      )
    )
    OR
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- Allow public read for staff portal (employees clocking in from outside)
CREATE POLICY "Public can view clock in requests"
  ON clock_in_requests
  FOR SELECT
  USING (true);

-- Shop owners can update requests (approve/reject)
CREATE POLICY "Shop owners can update requests"
  ON clock_in_requests
  FOR UPDATE
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clock_in_requests_shop_id ON clock_in_requests(shop_id);
CREATE INDEX IF NOT EXISTS idx_clock_in_requests_employee_id ON clock_in_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_clock_in_requests_status ON clock_in_requests(status);
CREATE INDEX IF NOT EXISTS idx_clock_in_requests_requested_at ON clock_in_requests(requested_at DESC);

-- Done! The clock_in_requests table is now set up.

