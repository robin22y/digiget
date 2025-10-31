/*
  # Migrate existing shops to user_shop_access table
  
  This migration creates access records for existing shops.
  Run this AFTER creating the user_shop_access table.
  
  For shops where user_id exists, create 'owner' access.
  For shops without user_id, you'll need to manually assign owners.
*/

-- Insert owner access for all existing shops that have a user_id
INSERT INTO user_shop_access (user_id, shop_id, role)
SELECT 
  user_id,
  id,
  'owner'
FROM shops
WHERE user_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM user_shop_access
  WHERE user_shop_access.user_id = shops.user_id
  AND user_shop_access.shop_id = shops.id
)
ON CONFLICT (user_id, shop_id) DO NOTHING;

-- Log how many records were created
DO $$
DECLARE
  records_created INTEGER;
BEGIN
  SELECT COUNT(*) INTO records_created
  FROM user_shop_access;
  
  RAISE NOTICE 'Created % user_shop_access records', records_created;
END $$;

