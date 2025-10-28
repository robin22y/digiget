/*
  # Add email field to employees

  1. Changes
    - Add email column to employees table
    - Email is optional for backward compatibility
    - Used to send login link and PIN to staff members
  
  2. Notes
    - Existing employees will have NULL email
    - Email can be added/updated later
    - No unique constraint as staff may share work emails
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'email'
  ) THEN
    ALTER TABLE employees ADD COLUMN email TEXT;
  END IF;
END $$;