-- =====================================================
-- QR Code System Database Setup
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add qr_url column to shops table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'qr_url'
  ) THEN
    ALTER TABLE shops ADD COLUMN qr_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'qr_code_active'
  ) THEN
    ALTER TABLE shops ADD COLUMN qr_code_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Update existing shops to have QR URLs
UPDATE shops
SET qr_url = 'https://digiget.uk/dashboard/' || id::text || '/checkin'
WHERE qr_url IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_shops_qr_url ON shops(qr_url);
CREATE INDEX IF NOT EXISTS idx_shops_qr_active ON shops(qr_code_active) WHERE qr_code_active = true;

-- Done! QR Code system database setup complete.

