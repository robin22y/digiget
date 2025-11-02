-- =====================================================
-- Fix Missing Columns in clock_entries Table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add geolocation columns if they don't exist
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

-- Add method tracking columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clock_entries' AND column_name = 'clock_in_method'
  ) THEN
    ALTER TABLE clock_entries ADD COLUMN clock_in_method TEXT CHECK (clock_in_method IN ('nfc', 'qr_code', 'shop_tablet', 'gps'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clock_entries' AND column_name = 'clock_out_method'
  ) THEN
    ALTER TABLE clock_entries ADD COLUMN clock_out_method TEXT CHECK (clock_out_method IN ('nfc', 'qr_code', 'shop_tablet', 'gps'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clock_entries' AND column_name = 'nfc_tag_id'
  ) THEN
    ALTER TABLE clock_entries ADD COLUMN nfc_tag_id TEXT;
  END IF;
END $$;

-- Ensure RLS policy allows anonymous users to insert (for staff portal)
DROP POLICY IF EXISTS "Anyone can manage clock entries for staff portal" ON clock_entries;

CREATE POLICY "Anyone can manage clock entries for staff portal"
  ON clock_entries FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Add index for nfc_tag_id if needed
CREATE INDEX IF NOT EXISTS idx_clock_entries_nfc_tag_id ON clock_entries(nfc_tag_id) WHERE nfc_tag_id IS NOT NULL;

COMMENT ON COLUMN clock_entries.clock_in_method IS 'Method used for clock-in: nfc, qr_code, shop_tablet, or gps';
COMMENT ON COLUMN clock_entries.clock_out_method IS 'Method used for clock-out: nfc, qr_code, shop_tablet, or gps';
COMMENT ON COLUMN clock_entries.nfc_tag_id IS 'NFC tag ID used for clock-in/out (if applicable)';

-- Done! This will fix the 400 error when inserting clock entries.

