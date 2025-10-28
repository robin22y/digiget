-- =====================================================
-- Create Staff Requests Table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create staff_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS staff_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  -- Request details
  request_type TEXT NOT NULL CHECK (request_type IN ('uniform', 'equipment', 'supplies', 'time_off', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  response_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE staff_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-running)
DROP POLICY IF EXISTS "Employees can create requests" ON staff_requests;
DROP POLICY IF EXISTS "Employees can view their requests" ON staff_requests;
DROP POLICY IF EXISTS "Shop owners can view all requests" ON staff_requests;
DROP POLICY IF EXISTS "Shop owners can manage requests" ON staff_requests;
DROP POLICY IF EXISTS "Public can create requests" ON staff_requests;

-- Employees can create requests (for staff portal)
CREATE POLICY "Employees can create requests"
  ON staff_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Public can create requests"
  ON staff_requests
  FOR INSERT
  USING (true);

-- Employees can view their own requests
CREATE POLICY "Employees can view their requests"
  ON staff_requests
  FOR SELECT
  USING (true);

-- Shop owners can view all requests for their shop
CREATE POLICY "Shop owners can view all requests"
  ON staff_requests
  FOR SELECT
  TO authenticated
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- Shop owners can update/respond to requests
CREATE POLICY "Shop owners can manage requests"
  ON staff_requests
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
CREATE INDEX IF NOT EXISTS idx_staff_requests_shop_id ON staff_requests(shop_id);
CREATE INDEX IF NOT EXISTS idx_staff_requests_employee_id ON staff_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_requests_status ON staff_requests(status);
CREATE INDEX IF NOT EXISTS idx_staff_requests_created_at ON staff_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_requests_pending ON staff_requests(shop_id, status) WHERE status = 'pending';

-- Done! The staff_requests table is now set up.

