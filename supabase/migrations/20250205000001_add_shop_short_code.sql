-- Add short_code column to shops table for short URLs
-- Format: 6 characters, uppercase letters + numbers (no confusing chars like 0,1,I,O)
ALTER TABLE shops ADD COLUMN IF NOT EXISTS short_code VARCHAR(6);

-- Create unique index on short_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_shops_short_code ON shops(short_code) WHERE short_code IS NOT NULL;

-- Add comment
COMMENT ON COLUMN shops.short_code IS 'Unique 6-character code for short URLs (e.g., K7M9P3). Used in /s/:code for clock-in and /p/:code for portal';

