/*
  # Add incident date field to incidents table

  1. Changes
    - Add incident_date column to store when the incident actually occurred
    - Different from created_at which is when the report was submitted
    - Defaults to current timestamp if not specified
  
  2. Notes
    - This allows staff to report incidents that happened earlier
    - Provides more accurate incident tracking
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'incident_date'
  ) THEN
    ALTER TABLE incidents ADD COLUMN incident_date TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;