-- Add 'Repeat' to customer classification options
-- Run this in Supabase SQL Editor

-- First, update the CHECK constraint to include 'Repeat'
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_classification_check;

ALTER TABLE customers 
ADD CONSTRAINT customers_classification_check 
CHECK (classification IN ('VIP', 'Regular', 'New', 'Repeat'));

-- If classification column doesn't exist, add it
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS classification TEXT DEFAULT 'New';

-- Update the constraint again to ensure it's set
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_classification_check;

ALTER TABLE customers 
ADD CONSTRAINT customers_classification_check 
CHECK (classification IN ('VIP', 'Regular', 'New', 'Repeat'));

-- Set default for existing customers without classification
UPDATE customers 
SET classification = 'New' 
WHERE classification IS NULL;

COMMENT ON COLUMN customers.classification IS 'Customer classification: New, Repeat, VIP, or Regular';

