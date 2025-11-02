-- =====================================================
-- Fix Missing Columns in shops Table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add slug column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'slug'
  ) THEN
    ALTER TABLE shops ADD COLUMN slug TEXT;
  END IF;
END $$;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_shops_slug ON shops(slug) WHERE slug IS NOT NULL;

-- Generate slugs for existing shops (if any exist without slugs)
DO $$
DECLARE
  shop_record RECORD;
  new_slug TEXT;
  slug_counter INTEGER;
BEGIN
  FOR shop_record IN SELECT id, shop_name FROM shops WHERE slug IS NULL OR slug = '' LOOP
    -- Generate base slug from shop name
    new_slug := lower(regexp_replace(shop_record.shop_name, '[^a-zA-Z0-9]+', '-', 'g'));
    new_slug := regexp_replace(new_slug, '^-+|-+$', '', 'g'); -- Remove leading/trailing dashes
    
    -- If empty, use default
    IF new_slug = '' OR new_slug IS NULL THEN
      new_slug := 'shop-' || substring(shop_record.id::text from 1 for 8);
    END IF;
    
    -- Ensure uniqueness
    slug_counter := 0;
    WHILE EXISTS (SELECT 1 FROM shops WHERE slug = new_slug AND id != shop_record.id) LOOP
      slug_counter := slug_counter + 1;
      new_slug := new_slug || '-' || slug_counter;
    END LOOP;
    
    UPDATE shops SET slug = new_slug WHERE id = shop_record.id;
  END LOOP;
END $$;

COMMENT ON COLUMN shops.slug IS 'Unique URL-friendly identifier for the shop (used in staff portal URLs)';

-- Add short_code column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'short_code'
  ) THEN
    ALTER TABLE shops ADD COLUMN short_code VARCHAR(6);
  END IF;
END $$;

-- Create unique index on short_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_shops_short_code ON shops(short_code) WHERE short_code IS NOT NULL;

COMMENT ON COLUMN shops.short_code IS 'Unique 6-character code for short URLs (e.g., K7M9P3). Used in /s/:code for clock-in and /p/:code for portal';

-- Add branded QR columns if they don't exist
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

-- Done! All missing columns have been added to the shops table.
-- The 400 errors should be resolved now.

