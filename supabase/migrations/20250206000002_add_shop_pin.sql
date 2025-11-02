-- =====================================================
-- Add Shop PIN Column
-- Allows shop tablet to stay logged in with shop PIN
-- Staff identify themselves per action with their own PIN
-- =====================================================

-- Add shop_pin column to shops table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'shop_pin'
  ) THEN
    ALTER TABLE shops ADD COLUMN shop_pin VARCHAR(6);
    
    -- Generate default shop PIN from short_code or use default
    -- Will be set during shop setup, but provide a default for existing shops
    UPDATE shops 
    SET shop_pin = '999999' 
    WHERE shop_pin IS NULL OR shop_pin = '';
    
    COMMENT ON COLUMN shops.shop_pin IS 'Shared 6-digit PIN for shop tablet access. All staff use this to unlock tablet, then enter their own PIN for actions.';
  END IF;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shops_shop_pin ON shops(shop_pin) WHERE shop_pin IS NOT NULL;

