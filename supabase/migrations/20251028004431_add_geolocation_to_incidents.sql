/*
  # Add geolocation to incidents

  1. Changes
    - Add latitude column to incidents table
    - Add longitude column to incidents table
  
  2. Notes
    - Captures GPS coordinates when staff reports incidents
    - Helps identify incident location
    - Nullable fields (staff may deny location permission)
    - Stored as DECIMAL for precision
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE incidents ADD COLUMN latitude DECIMAL(10, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE incidents ADD COLUMN longitude DECIMAL(11, 8);
  END IF;
END $$;