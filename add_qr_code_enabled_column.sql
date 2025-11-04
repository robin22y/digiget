-- =====================================================
-- Add qr_code_enabled column to shops table
-- Run this in Supabase SQL Editor if the column is missing
-- =====================================================

DO $$
BEGIN
  -- Add qr_code_enabled column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'shops' 
    AND column_name = 'qr_code_enabled'
  ) THEN
    ALTER TABLE public.shops ADD COLUMN qr_code_enabled BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added qr_code_enabled column';
  ELSE
    RAISE NOTICE 'qr_code_enabled column already exists';
  END IF;

  -- Add nfc_enabled column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'shops' 
    AND column_name = 'nfc_enabled'
  ) THEN
    ALTER TABLE public.shops ADD COLUMN nfc_enabled BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added nfc_enabled column';
  ELSE
    RAISE NOTICE 'nfc_enabled column already exists';
  END IF;

  -- Add tablet_pin_enabled column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'shops' 
    AND column_name = 'tablet_pin_enabled'
  ) THEN
    ALTER TABLE public.shops ADD COLUMN tablet_pin_enabled BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added tablet_pin_enabled column';
  ELSE
    RAISE NOTICE 'tablet_pin_enabled column already exists';
  END IF;

  -- Add gps_enabled column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'shops' 
    AND column_name = 'gps_enabled'
  ) THEN
    ALTER TABLE public.shops ADD COLUMN gps_enabled BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added gps_enabled column';
  ELSE
    RAISE NOTICE 'gps_enabled column already exists';
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.shops.qr_code_enabled IS 'Whether QR code clock-in is enabled for this shop. Recommended to keep enabled (universal compatibility).';
COMMENT ON COLUMN public.shops.nfc_enabled IS 'Whether NFC tag clock-in is enabled. Requires nfc_tag_id and nfc_tag_active to be set.';
COMMENT ON COLUMN public.shops.tablet_pin_enabled IS 'Whether shop tablet PIN clock-in is enabled. Traditional method, works for all staff.';
COMMENT ON COLUMN public.shops.gps_enabled IS 'Whether GPS-based clock-in is enabled. Recommended only for mobile barbers or as emergency fallback.';

-- Update existing shops to have default values
UPDATE public.shops
SET 
  qr_code_enabled = COALESCE(qr_code_enabled, true),
  nfc_enabled = COALESCE(nfc_enabled, false),
  tablet_pin_enabled = COALESCE(tablet_pin_enabled, true),
  gps_enabled = COALESCE(gps_enabled, false)
WHERE 
  qr_code_enabled IS NULL 
  OR nfc_enabled IS NULL 
  OR tablet_pin_enabled IS NULL 
  OR gps_enabled IS NULL;

-- Done! Columns added successfully.

