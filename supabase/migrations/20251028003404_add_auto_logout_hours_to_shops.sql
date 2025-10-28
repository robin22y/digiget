/*
  # Add auto-logout hours to shops

  1. Changes
    - Add auto_logout_hours column to shops table
    - Default value is 13 hours
    - Used to automatically clock out staff after specified duration
  
  2. Notes
    - Shop owners can configure this in settings
    - Prevents staff from forgetting to clock out
    - Hours are counted from initial clock-in time
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'auto_logout_hours'
  ) THEN
    ALTER TABLE shops ADD COLUMN auto_logout_hours INTEGER DEFAULT 13;
  END IF;
END $$;