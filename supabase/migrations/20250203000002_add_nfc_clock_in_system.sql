-- Migration: Add NFC tag clock-in system
-- Date: 2025-02-03
-- 
-- Adds NFC tag support for shop clock-in system
-- NFC tags provide instant, reliable clock-in (no GPS required)
-- GPS remains as fallback option

-- Step 1: Add NFC columns to shops table
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS nfc_tag_id VARCHAR(50);

ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS nfc_tag_active BOOLEAN DEFAULT false;

ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS require_nfc BOOLEAN DEFAULT false;

ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS allow_gps_fallback BOOLEAN DEFAULT true;

-- Step 1.5: Add method enable flags for 4-tier system
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS qr_code_enabled BOOLEAN DEFAULT true;

ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS nfc_enabled BOOLEAN DEFAULT false;

ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS tablet_pin_enabled BOOLEAN DEFAULT true;

ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS gps_enabled BOOLEAN DEFAULT false;

-- Step 2: Create unique index on nfc_tag_id (one tag per shop, globally unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_shops_nfc_tag_id 
ON shops(nfc_tag_id) 
WHERE nfc_tag_id IS NOT NULL;

-- Step 3: Add method tracking columns to clock_entries table
ALTER TABLE clock_entries 
ADD COLUMN IF NOT EXISTS clock_in_method VARCHAR(20) 
DEFAULT 'gps';

ALTER TABLE clock_entries 
ADD COLUMN IF NOT EXISTS clock_out_method VARCHAR(20);

ALTER TABLE clock_entries 
ADD COLUMN IF NOT EXISTS nfc_tag_id VARCHAR(50);

-- Step 4: Add constraint for clock methods (4-tier system: nfc, qr_code, shop_tablet, gps, manual_override)
ALTER TABLE clock_entries 
DROP CONSTRAINT IF EXISTS clock_in_method_check;

ALTER TABLE clock_entries 
ADD CONSTRAINT clock_in_method_check 
CHECK (clock_in_method IN ('nfc', 'qr_code', 'shop_tablet', 'gps', 'manual_override'));

ALTER TABLE clock_entries 
DROP CONSTRAINT IF EXISTS clock_out_method_check;

ALTER TABLE clock_entries 
ADD CONSTRAINT clock_out_method_check 
CHECK (clock_out_method IN ('nfc', 'qr_code', 'shop_tablet', 'gps', 'manual_override') OR clock_out_method IS NULL);

-- Step 5: Create index for querying by NFC tag
CREATE INDEX IF NOT EXISTS idx_clock_entries_nfc_tag 
ON clock_entries(nfc_tag_id) 
WHERE nfc_tag_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clock_entries_clock_method 
ON clock_entries(clock_in_method);

-- Step 6: Add comment for documentation
COMMENT ON COLUMN shops.nfc_tag_id IS 'Unique NFC tag ID assigned to this shop. Format: DIGIGET-XXXXXXXXXXXX. Used for NFC-based clock-in system.';
COMMENT ON COLUMN shops.nfc_tag_active IS 'Whether the NFC tag is active and should accept clock-ins. Shop owner can disable if tag is lost/damaged.';
COMMENT ON COLUMN shops.require_nfc IS 'If true, staff MUST use NFC tag for clock-in (GPS clock-in disabled). If false, GPS is allowed as fallback.';
COMMENT ON COLUMN shops.allow_gps_fallback IS 'If true, GPS clock-in is allowed even when NFC tag is active (hybrid mode). If false and require_nfc is true, only NFC works.';
COMMENT ON COLUMN clock_entries.clock_in_method IS 'Method used for clock-in: nfc (NFC tag), qr_code (QR code scan), shop_tablet (tablet PIN entry), gps (GPS location), manual_override (owner approval).';
COMMENT ON COLUMN clock_entries.clock_out_method IS 'Method used for clock-out: nfc (NFC tag), qr_code (QR code scan), shop_tablet (tablet PIN entry), gps (GPS location), manual_override (owner approval).';
COMMENT ON COLUMN shops.qr_code_enabled IS 'Whether QR code clock-in is enabled for this shop. Recommended to keep enabled (universal compatibility).';
COMMENT ON COLUMN shops.nfc_enabled IS 'Whether NFC tag clock-in is enabled. Requires nfc_tag_id and nfc_tag_active to be set.';
COMMENT ON COLUMN shops.tablet_pin_enabled IS 'Whether shop tablet PIN clock-in is enabled. Traditional method, works for all staff.';
COMMENT ON COLUMN shops.gps_enabled IS 'Whether GPS-based clock-in is enabled. Recommended only for mobile barbers or as emergency fallback.';
COMMENT ON COLUMN clock_entries.nfc_tag_id IS 'NFC tag ID that was used for this clock entry (if method was NFC).';

-- Step 7: Set defaults for existing clock entries
UPDATE clock_entries 
SET clock_in_method = 'gps' 
WHERE clock_in_method IS NULL;

