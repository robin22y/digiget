-- Assign short codes to existing shops that don't have one
-- This uses a PL/pgSQL function to generate unique codes

-- Function to generate a random short code
CREATE OR REPLACE FUNCTION generate_short_code() RETURNS VARCHAR(6) AS $$
DECLARE
  allowed_chars VARCHAR(32) := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code VARCHAR(6) := '';
  i INTEGER;
  random_index INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    random_index := floor(random() * length(allowed_chars) + 1)::INTEGER;
    code := code || substring(allowed_chars, random_index, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a unique short code that doesn't exist
CREATE OR REPLACE FUNCTION generate_unique_short_code() RETURNS VARCHAR(6) AS $$
DECLARE
  new_code VARCHAR(6);
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  LOOP
    new_code := generate_short_code();
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM shops WHERE short_code = new_code) THEN
      RETURN new_code;
    END IF;
    
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique short code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Assign short codes to all shops that don't have one
DO $$
DECLARE
  shop_record RECORD;
  new_short_code VARCHAR(6);
BEGIN
  FOR shop_record IN SELECT id, shop_name FROM shops WHERE short_code IS NULL OR short_code = '' LOOP
    BEGIN
      new_short_code := generate_unique_short_code();
      
      UPDATE shops 
      SET short_code = new_short_code 
      WHERE id = shop_record.id;
      
      RAISE NOTICE 'Assigned short code % to shop: % (ID: %)', new_short_code, shop_record.shop_name, shop_record.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to assign short code to shop % (ID: %): %', shop_record.shop_name, shop_record.id, SQLERRM;
    END;
  END LOOP;
END $$;

-- Clean up helper functions (optional - comment out if you want to keep them)
-- DROP FUNCTION IF EXISTS generate_unique_short_code();
-- DROP FUNCTION IF EXISTS generate_short_code();

COMMENT ON FUNCTION generate_short_code() IS 'Generates a random 6-character code from allowed character set (A-Z except I/O, 2-9)';
COMMENT ON FUNCTION generate_unique_short_code() IS 'Generates a unique 6-character code that does not exist in shops table';

