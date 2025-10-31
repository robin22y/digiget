-- Add is_test_shop field to shops table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='is_test_shop'
  ) THEN
    ALTER TABLE shops ADD COLUMN is_test_shop BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add index for test shops
CREATE INDEX IF NOT EXISTS idx_shops_is_test_shop ON shops(is_test_shop);

-- Add comment
COMMENT ON COLUMN shops.is_test_shop IS 'True if this is a test shop with test payment gateway';

