-- Migration: Create NFC tag re-issue system
-- Date: 2025-02-04
-- 
-- Allows shops to request replacement NFC tags when lost/damaged
-- Tracks request history and prevents abuse

-- Step 1: Add re-issue tracking columns to shops table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'nfc_reissue_count'
  ) THEN
    ALTER TABLE shops ADD COLUMN nfc_reissue_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added nfc_reissue_count column';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'last_reissue_date'
  ) THEN
    ALTER TABLE shops ADD COLUMN last_reissue_date TIMESTAMPTZ;
    RAISE NOTICE 'Added last_reissue_date column';
  END IF;
END $$;

-- Step 2: Create re-issue requests table
CREATE TABLE IF NOT EXISTS nfc_reissue_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  old_tag_id VARCHAR(50),
  new_tag_id VARCHAR(50),
  reason TEXT NOT NULL,
  request_date TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'denied', 'shipped', 'completed')) DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_date TIMESTAMPTZ,
  denial_reason TEXT,
  shipping_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reissue_shop ON nfc_reissue_requests(shop_id);
CREATE INDEX IF NOT EXISTS idx_reissue_status ON nfc_reissue_requests(status);
CREATE INDEX IF NOT EXISTS idx_reissue_request_date ON nfc_reissue_requests(request_date);

-- Step 4: Enable RLS on re-issue requests
ALTER TABLE nfc_reissue_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Shop owners can view their own requests
CREATE POLICY "Shop owners can view own re-issue requests"
  ON nfc_reissue_requests FOR SELECT
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- Shop owners can insert their own requests
CREATE POLICY "Shop owners can create re-issue requests"
  ON nfc_reissue_requests FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- Super admins can view all requests
CREATE POLICY "Super admins can view all re-issue requests"
  ON nfc_reissue_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'super_admin'
    )
  );

-- Super admins can update all requests
CREATE POLICY "Super admins can update re-issue requests"
  ON nfc_reissue_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'super_admin'
    )
  );

-- Step 5: Add comments for documentation
COMMENT ON TABLE nfc_reissue_requests IS 'Tracks NFC tag replacement requests from shops. Includes request reason, approval workflow, and shipping status.';
COMMENT ON COLUMN nfc_reissue_requests.old_tag_id IS 'The NFC tag ID that needs to be replaced (for security tracking).';
COMMENT ON COLUMN nfc_reissue_requests.new_tag_id IS 'The new NFC tag ID assigned when request is approved.';
COMMENT ON COLUMN nfc_reissue_requests.status IS 'Request status: pending (awaiting review), approved (new tag generated), denied (rejected), shipped (new tag sent), completed (shop confirmed receipt).';
COMMENT ON COLUMN shops.nfc_reissue_count IS 'Total number of NFC tag re-issues requested by this shop. Used to detect patterns and potential abuse.';
COMMENT ON COLUMN shops.last_reissue_date IS 'Date of the most recent re-issue request. Used to enforce minimum time between requests (prevent abuse).';

-- Step 6: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_nfc_reissue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger for updated_at
DROP TRIGGER IF EXISTS update_nfc_reissue_requests_updated_at ON nfc_reissue_requests;
CREATE TRIGGER update_nfc_reissue_requests_updated_at
  BEFORE UPDATE ON nfc_reissue_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_nfc_reissue_updated_at();

