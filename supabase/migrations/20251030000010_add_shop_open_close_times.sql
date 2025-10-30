-- Add open and close time columns to shops
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'open_time'
  ) THEN
    ALTER TABLE shops ADD COLUMN open_time TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'close_time'
  ) THEN
    ALTER TABLE shops ADD COLUMN close_time TEXT;
  END IF;
END $$;
