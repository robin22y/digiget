-- Add days_between_points column to shops table
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS days_between_points INTEGER DEFAULT 7;

-- Update existing shops to have 7 days as default
UPDATE shops 
SET days_between_points = 7 
WHERE days_between_points IS NULL;

