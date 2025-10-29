-- Add QR Code columns to shops table if they don't exist
-- Run this in Supabase SQL Editor

DO $$
BEGIN
    -- Add qr_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'qr_url'
    ) THEN
        ALTER TABLE shops ADD COLUMN qr_url TEXT;
        CREATE INDEX IF NOT EXISTS idx_shops_qr_url ON shops(qr_url);
    END IF;

    -- Add qr_code_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'qr_code_active'
    ) THEN
        ALTER TABLE shops ADD COLUMN qr_code_active BOOLEAN DEFAULT true;
        CREATE INDEX IF NOT EXISTS idx_shops_qr_active ON shops(qr_code_active) WHERE qr_code_active = true;
    END IF;

    -- Update existing shops to have qr_code_active = true if NULL
    UPDATE shops SET qr_code_active = true WHERE qr_code_active IS NULL;
END $$;

-- Add branded QR columns if they don't exist (for future use)
DO $$
BEGIN
    -- Add branded_qr_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'branded_qr_url'
    ) THEN
        ALTER TABLE shops ADD COLUMN branded_qr_url TEXT;
    END IF;

    -- Add branded_qr_pdf column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'branded_qr_pdf'
    ) THEN
        ALTER TABLE shops ADD COLUMN branded_qr_pdf TEXT;
    END IF;
END $$;

