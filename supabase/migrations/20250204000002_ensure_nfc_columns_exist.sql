-- Migration: Ensure NFC columns exist in shops table
-- Date: 2025-02-04
-- 
-- Safely adds NFC tag columns if they don't exist
-- This is a safety migration to ensure columns are present

-- Step 1: Add NFC columns to shops table (if they don't exist)
DO $$
BEGIN
  -- Add nfc_tag_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'nfc_tag_id'
  ) THEN
    ALTER TABLE shops ADD COLUMN nfc_tag_id VARCHAR(50);
    RAISE NOTICE 'Added nfc_tag_id column';
  END IF;

  -- Add nfc_tag_active column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'nfc_tag_active'
  ) THEN
    ALTER TABLE shops ADD COLUMN nfc_tag_active BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added nfc_tag_active column';
  END IF;

  -- Add require_nfc column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'require_nfc'
  ) THEN
    ALTER TABLE shops ADD COLUMN require_nfc BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added require_nfc column';
  END IF;

  -- Add allow_gps_fallback column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'allow_gps_fallback'
  ) THEN
    ALTER TABLE shops ADD COLUMN allow_gps_fallback BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added allow_gps_fallback column';
  END IF;

  -- Add nfc_enabled column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'nfc_enabled'
  ) THEN
    ALTER TABLE shops ADD COLUMN nfc_enabled BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added nfc_enabled column';
  END IF;
END $$;

-- Step 2: Create unique index on nfc_tag_id (if it doesn't exist)
CREATE UNIQUE INDEX IF NOT EXISTS idx_shops_nfc_tag_id 
ON shops(nfc_tag_id) 
WHERE nfc_tag_id IS NOT NULL;

-- Step 3: Add comments for documentation
COMMENT ON COLUMN shops.nfc_tag_id IS 'Unique NFC tag ID assigned to this shop. Format: DIGIGET-XXXXXXXX. Used for NFC-based clock-in system.';
COMMENT ON COLUMN shops.nfc_tag_active IS 'Whether the NFC tag is active and should accept clock-ins. Shop owner can disable if tag is lost/damaged.';
COMMENT ON COLUMN shops.require_nfc IS 'If true, staff MUST use NFC tag for clock-in (GPS clock-in disabled). If false, GPS is allowed as fallback.';
COMMENT ON COLUMN shops.allow_gps_fallback IS 'If true, GPS clock-in is allowed even when NFC tag is active (hybrid mode). If false and require_nfc is true, only NFC works.';
COMMENT ON COLUMN shops.nfc_enabled IS 'Whether NFC tag clock-in is enabled. Requires nfc_tag_id and nfc_tag_active to be set.';

