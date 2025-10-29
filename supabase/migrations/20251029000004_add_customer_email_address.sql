/*
  # Add email and address columns to customers table
*/

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS address TEXT;

