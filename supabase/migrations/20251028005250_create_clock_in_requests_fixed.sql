/*
  # Create clock in approval requests table

  1. New Tables
    - `clock_in_requests`
      - `id` (uuid, primary key)
      - `shop_id` (uuid, foreign key to shops)
      - `employee_id` (uuid, foreign key to employees)
      - `requested_at` (timestamptz)
      - `request_latitude` (decimal)
      - `request_longitude` (decimal)
      - `distance_from_shop` (decimal, in meters)
      - `status` (text: pending, approved, rejected)
      - `reviewed_at` (timestamptz, nullable)
      - `reviewed_by` (text, nullable)
      - `rejection_reason` (text, nullable)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `clock_in_requests` table
    - Add policy for authenticated users to create requests
    - Add policy for authenticated users to view their own requests
    - Add policy for authenticated users to view shop requests
    - Add policy for authenticated users to update shop requests
*/

CREATE TABLE IF NOT EXISTS clock_in_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  requested_at timestamptz DEFAULT now() NOT NULL,
  request_latitude DECIMAL(10, 8) NOT NULL,
  request_longitude DECIMAL(11, 8) NOT NULL,
  distance_from_shop DECIMAL(10, 2) NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by text,
  rejection_reason text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE clock_in_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can create clock in requests"
  ON clock_in_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their employee requests"
  ON clock_in_requests
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth.uid() = id
    )
    OR
    shop_id IN (
      SELECT id FROM shops WHERE auth.uid() = user_id
    )
  );

CREATE POLICY "Shop owners can update requests"
  ON clock_in_requests
  FOR UPDATE
  TO authenticated
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE auth.uid() = user_id
    )
  )
  WITH CHECK (
    shop_id IN (
      SELECT id FROM shops WHERE auth.uid() = user_id
    )
  );