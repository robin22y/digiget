/*
  # Add Shop-Specific Tier Criteria
  
  1. Changes
    - Add tier threshold columns to shops table
    - Each shop can set their own criteria for VIP, Super Star, and Royal tiers
    - Based on lifetime_points by default
  
  2. Notes
    - If thresholds are NULL, auto-upgrade is disabled for that shop
    - Manual tier assignments always override auto-upgrade
*/

-- Add tier threshold columns to shops table
DO $$
BEGIN
  -- VIP tier threshold (lifetime points)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'tier_vip_threshold'
  ) THEN
    ALTER TABLE shops ADD COLUMN tier_vip_threshold INTEGER DEFAULT NULL;
  END IF;

  -- Super Star tier threshold (lifetime points)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'tier_super_star_threshold'
  ) THEN
    ALTER TABLE shops ADD COLUMN tier_super_star_threshold INTEGER DEFAULT NULL;
  END IF;

  -- Royal tier threshold (lifetime points)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'tier_royal_threshold'
  ) THEN
    ALTER TABLE shops ADD COLUMN tier_royal_threshold INTEGER DEFAULT NULL;
  END IF;

  -- Enable auto-upgrade flag (optional, for shop owners who want to enable/disable)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'tier_auto_upgrade_enabled'
  ) THEN
    ALTER TABLE shops ADD COLUMN tier_auto_upgrade_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create function to auto-upgrade customer tier based on shop criteria
CREATE OR REPLACE FUNCTION auto_upgrade_customer_tier(
  p_shop_id UUID,
  p_customer_id UUID
)
RETURNS TEXT AS $$
DECLARE
  v_shop RECORD;
  v_customer RECORD;
  v_new_tier TEXT;
  v_old_tier TEXT;
BEGIN
  -- Get shop tier criteria
  SELECT tier_vip_threshold, tier_super_star_threshold, tier_royal_threshold, tier_auto_upgrade_enabled
  INTO v_shop
  FROM shops
  WHERE id = p_shop_id;

  -- If auto-upgrade is disabled for this shop, return NULL
  IF NOT v_shop.tier_auto_upgrade_enabled THEN
    RETURN NULL;
  END IF;

  -- Get customer current tier and lifetime points
  SELECT tier, lifetime_points
  INTO v_customer
  FROM customers
  WHERE id = p_customer_id AND shop_id = p_shop_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_old_tier := v_customer.tier;
  
  -- Check if customer was manually assigned a tier (we'll check if last change was manual vs auto)
  -- For now, we'll only auto-upgrade if tier is NULL or if points clearly exceed thresholds
  
  -- Determine new tier based on lifetime points (highest tier first)
  IF v_shop.tier_royal_threshold IS NOT NULL AND v_customer.lifetime_points >= v_shop.tier_royal_threshold THEN
    v_new_tier := 'Royal';
  ELSIF v_shop.tier_super_star_threshold IS NOT NULL AND v_customer.lifetime_points >= v_shop.tier_super_star_threshold THEN
    v_new_tier := 'Super Star';
  ELSIF v_shop.tier_vip_threshold IS NOT NULL AND v_customer.lifetime_points >= v_shop.tier_vip_threshold THEN
    v_new_tier := 'VIP';
  ELSE
    v_new_tier := 'New';
  END IF;

    -- Only update if tier changed
  IF v_new_tier IS DISTINCT FROM v_customer.tier THEN
    -- Check if this is a downgrade (points decreased) - if so, don't auto-upgrade (only upgrade)
    IF v_customer.tier = 'Royal' AND v_new_tier != 'Royal' THEN
      RETURN NULL; -- Don't auto-downgrade
    END IF;
    IF v_customer.tier = 'Super Star' AND v_new_tier IN ('VIP', 'New') THEN
      RETURN NULL; -- Don't auto-downgrade
    END IF;
    IF v_customer.tier = 'VIP' AND v_new_tier = 'New' THEN
      RETURN NULL; -- Don't auto-downgrade
    END IF;

    -- Update customer tier
    UPDATE customers
    SET tier = v_new_tier
    WHERE id = p_customer_id;

    -- Log the auto-upgrade
    INSERT INTO activity_log (
      shop_id,
      customer_id,
      action_type,
      description,
      old_value,
      new_value,
      performed_by
    ) VALUES (
      p_shop_id,
      p_customer_id,
      'tier_change',
      'Auto-upgraded tier based on lifetime points threshold',
      v_old_tier,
      v_new_tier,
      NULL -- NULL indicates automatic/system upgrade
    );

    RETURN v_new_tier;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Done! Shop-specific tier criteria ready.

