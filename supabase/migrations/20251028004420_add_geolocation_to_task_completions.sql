/*
  # Add geolocation to task completions

  1. Changes
    - Add latitude column to task_completions table
    - Add longitude column to task_completions table
  
  2. Notes
    - Captures GPS coordinates when staff completes tasks
    - Verifies task was completed at correct location
    - Nullable fields (staff may deny location permission)
    - Stored as DECIMAL for precision
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_completions' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE task_completions ADD COLUMN latitude DECIMAL(10, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_completions' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE task_completions ADD COLUMN longitude DECIMAL(11, 8);
  END IF;
END $$;