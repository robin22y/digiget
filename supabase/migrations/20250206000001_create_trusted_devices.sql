-- =====================================================
-- Create Trusted Devices Table
-- Allows shop owners to authorize specific devices (tablets/computers)
-- that don't need GPS verification for clock-ins
-- =====================================================

-- Create trusted_devices table
CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  device_name VARCHAR(100) NOT NULL,
  device_fingerprint VARCHAR(255) NOT NULL,
  authorized_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  authorized_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create unique constraint on device_fingerprint per shop
CREATE UNIQUE INDEX IF NOT EXISTS idx_trusted_devices_shop_fingerprint 
  ON trusted_devices(shop_id, device_fingerprint) 
  WHERE is_active = true;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trusted_devices_shop ON trusted_devices(shop_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_active ON trusted_devices(shop_id, is_active) WHERE is_active = true;

-- Add trusted_devices_enabled setting to shops table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'trusted_devices_enabled'
  ) THEN
    ALTER TABLE shops ADD COLUMN trusted_devices_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

-- Shop owners can view their trusted devices
CREATE POLICY "Shop owners can view trusted devices"
  ON trusted_devices FOR SELECT
  TO authenticated
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- Shop owners can manage (insert/update/delete) their trusted devices
CREATE POLICY "Shop owners can manage trusted devices"
  ON trusted_devices FOR ALL
  TO authenticated
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- Allow anonymous users to check if device is trusted (for clock-in)
CREATE POLICY "Anyone can check device trust status"
  ON trusted_devices FOR SELECT
  TO anon
  USING (is_active = true);

-- Add verification method columns to clock_entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clock_entries' AND column_name = 'verification_method'
  ) THEN
    ALTER TABLE clock_entries ADD COLUMN verification_method VARCHAR(20);
    COMMENT ON COLUMN clock_entries.verification_method IS 'How clock-in was verified: trusted_device, gps_verified, no_verification, manual_override';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clock_entries' AND column_name = 'device_fingerprint'
  ) THEN
    ALTER TABLE clock_entries ADD COLUMN device_fingerprint VARCHAR(255);
    COMMENT ON COLUMN clock_entries.device_fingerprint IS 'Device fingerprint if clocked in from trusted device';
  END IF;
END $$;

-- Add trigger to update last_used_at when device is used for clock-in
CREATE OR REPLACE FUNCTION update_trusted_device_last_used()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_method = 'trusted_device' AND NEW.device_fingerprint IS NOT NULL THEN
    UPDATE trusted_devices
    SET last_used_at = NEW.clock_in_time
    WHERE shop_id = NEW.shop_id 
      AND device_fingerprint = NEW.device_fingerprint
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_trusted_device_last_used ON clock_entries;
CREATE TRIGGER trigger_update_trusted_device_last_used
  AFTER INSERT ON clock_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_trusted_device_last_used();

COMMENT ON TABLE trusted_devices IS 'Authorized devices that can clock in without GPS verification';
COMMENT ON COLUMN trusted_devices.device_fingerprint IS 'Unique hash identifying the device';
COMMENT ON COLUMN trusted_devices.last_used_at IS 'When device was last used for a clock-in';

