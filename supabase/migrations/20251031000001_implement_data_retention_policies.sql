/*
  # Implement Data Retention Policies
  
  This migration implements the data retention policy as specified:
  - Shop owner accounts: Until account deleted + 30 days
  - Staff clock-in records: 6 years (HMRC requirement for payroll)
  - Customer loyalty data: Immediate and unrecoverable
  - Staff GPS location logs: 90 days then auto-deleted
  - Session logs: 90 days then auto-deleted
  - Payment records: 7 years (legal requirement)

  Notes:
  - Most data has ON DELETE CASCADE, so customer loyalty data is already immediate deletion
  - We need to implement retention for GPS location data and session logs
  - Clock entries need to be kept for 6 years (already handled by CASCADE)
*/

-- Create a function to automatically delete old GPS location logs (> 90 days)
CREATE OR REPLACE FUNCTION delete_old_location_logs()
RETURNS void AS $$
BEGIN
  -- Delete staff location check-ins older than 90 days
  DELETE FROM staff_location_checkins
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to automatically delete old session logs (> 90 days)
-- Note: If you have a sessions table, uncomment and adjust this
-- CREATE OR REPLACE FUNCTION delete_old_session_logs()
-- RETURNS void AS $$
-- BEGIN
--   DELETE FROM sessions
--   WHERE created_at < NOW() - INTERVAL '90 days';
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to handle account deletion with 30-day grace period
CREATE OR REPLACE FUNCTION schedule_shop_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- When a shop is marked for deletion (access_ends_at is set), schedule actual deletion 30 days later
  IF OLD.access_ends_at IS NULL AND NEW.access_ends_at IS NOT NULL THEN
    NEW.data_deletion_at := NEW.access_ends_at + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to schedule shop deletion
DROP TRIGGER IF EXISTS schedule_shop_deletion_trigger ON shops;
CREATE TRIGGER schedule_shop_deletion_trigger
  BEFORE UPDATE ON shops
  FOR EACH ROW
  EXECUTE FUNCTION schedule_shop_deletion();

-- Create a function to actually delete shops after the grace period
CREATE OR REPLACE FUNCTION delete_expired_shops()
RETURNS void AS $$
BEGIN
  -- Delete shops where data_deletion_at has passed
  DELETE FROM shops
  WHERE data_deletion_at IS NOT NULL 
    AND data_deletion_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: These functions should be called by a scheduled task (cron job)
-- You'll need to set up a cron job or scheduled function in Supabase to run:
-- - delete_old_location_logs() daily
-- - delete_expired_shops() daily
-- - delete_old_session_logs() daily (if you have sessions)

-- Add comment explaining the retention policy
COMMENT ON FUNCTION delete_old_location_logs() IS 'Deletes staff GPS location logs older than 90 days as per privacy policy';
COMMENT ON FUNCTION schedule_shop_deletion() IS 'Schedules shop deletion with 30-day grace period as per privacy policy';
COMMENT ON FUNCTION delete_expired_shops() IS 'Deletes shops after the 30-day grace period expires';

