-- Add GPS location consent fields to employees table
-- Consent is required before staff can clock in/out with GPS tracking

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS gps_location_consent BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gps_consent_given_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS gps_consent_version TEXT DEFAULT '1.0';

COMMENT ON COLUMN employees.gps_location_consent IS 'Staff consent for GPS location tracking when clocking in/out. NULL = not asked, TRUE = consented, FALSE = declined';
COMMENT ON COLUMN employees.gps_consent_given_at IS 'Timestamp when consent was given or declined';
COMMENT ON COLUMN employees.gps_consent_version IS 'Version of consent form shown to staff member';

