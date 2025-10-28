/*
  # Add geolocation to clock entries

  1. Changes
    - Add clock_in_latitude column to clock_entries table
    - Add clock_in_longitude column to clock_entries table
    - Add clock_out_latitude column to clock_entries table
    - Add clock_out_longitude column to clock_entries table
  
  2. Notes
    - Captures GPS coordinates when staff clocks in and out
    - Helps verify staff are at correct location
    - Nullable fields (staff may deny location permission)
    - Stored as DECIMAL for precision
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clock_entries' AND column_name = 'clock_in_latitude'
  ) THEN
    ALTER TABLE clock_entries ADD COLUMN clock_in_latitude DECIMAL(10, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clock_entries' AND column_name = 'clock_in_longitude'
  ) THEN
    ALTER TABLE clock_entries ADD COLUMN clock_in_longitude DECIMAL(11, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clock_entries' AND column_name = 'clock_out_latitude'
  ) THEN
    ALTER TABLE clock_entries ADD COLUMN clock_out_latitude DECIMAL(10, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clock_entries' AND column_name = 'clock_out_longitude'
  ) THEN
    ALTER TABLE clock_entries ADD COLUMN clock_out_longitude DECIMAL(11, 8);
  END IF;
END $$;