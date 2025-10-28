-- =====================================================
-- Fix RLS Policies for Staff Portal (Anonymous Access)
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Fix clock_entries - Allow anonymous users to manage clock entries for staff portal
DROP POLICY IF EXISTS "Anyone can manage clock entries for staff portal" ON clock_entries;

CREATE POLICY "Anyone can manage clock entries for staff portal"
  ON clock_entries FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 2. Fix clock_in_requests - Allow anonymous users to create clock-in requests
DROP POLICY IF EXISTS "Anyone can create clock in requests for staff portal" ON clock_in_requests;

CREATE POLICY "Anyone can create clock in requests for staff portal"
  ON clock_in_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 3. Fix staff_location_checkins - Allow anonymous users to manage location check-ins
DROP POLICY IF EXISTS "Anyone can manage location checkins for staff portal" ON staff_location_checkins;

CREATE POLICY "Anyone can manage location checkins for staff portal"
  ON staff_location_checkins FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 4. Fix staff_requests - Allow anonymous users to create requests (already has public policy, but ensure it exists)
DROP POLICY IF EXISTS "Anyone can create requests for staff portal" ON staff_requests;

CREATE POLICY "Anyone can create requests for staff portal"
  ON staff_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Done! Staff can now use all portal features from mobile devices.

-- Note: If you get errors about policies already existing, this is normal if you've run parts of the script before.
-- The DROP POLICY IF EXISTS statements will handle this gracefully.

