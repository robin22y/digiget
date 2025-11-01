-- Add slug column to shops table for short URLs
ALTER TABLE shops ADD COLUMN IF NOT EXISTS slug TEXT;

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

-- Add comment
COMMENT ON COLUMN shops.slug IS 'Unique URL-friendly identifier for the shop (used in staff portal URLs)';

