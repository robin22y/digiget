-- =====================================================
-- Add Branded QR Code Columns to Shops Table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add columns for branded QR URLs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'branded_qr_url'
  ) THEN
    ALTER TABLE shops ADD COLUMN branded_qr_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'branded_qr_pdf'
  ) THEN
    ALTER TABLE shops ADD COLUMN branded_qr_pdf TEXT;
  END IF;
END $$;

-- Create Supabase Storage bucket if it doesn't exist (run manually in Storage UI if needed)
-- Bucket name: 'public'
-- Public: true
-- File size limit: 50MB
-- Allowed MIME types: image/png, application/pdf

-- Done! Branded QR columns added.


