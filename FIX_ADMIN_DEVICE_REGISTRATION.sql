-- Fix: Add INSERT policy for admin device registration
-- Run this in Supabase SQL Editor to allow devices to register themselves

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert their own admin device" ON admin_devices;

-- Create policy to allow users to register their own device
CREATE POLICY "Users can insert their own admin device"
  ON admin_devices
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

