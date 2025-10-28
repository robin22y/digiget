-- =====================================================
-- Add Customer Classification and Appointment Check-in Support
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add classification column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS classification TEXT CHECK (classification IN ('VIP', 'Regular', 'New')) DEFAULT 'New';

-- Add target_classifications column to flash_offers table (array of classifications)
ALTER TABLE flash_offers 
ADD COLUMN IF NOT EXISTS target_classifications TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update appointments table to add index on customer_phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_appointments_customer_phone ON appointments(customer_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_phone_date ON appointments(customer_phone, appointment_date);

-- Done! Customer classification and appointment check-in support is now enabled.

