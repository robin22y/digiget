/*
  # Add location coordinates to shops

  1. Changes
    - Add latitude column to shops table
    - Add longitude column to shops table
  
  2. Notes
    - Shop owners will set their shop location
    - Used to validate staff clock-in distance
    - Required for geofencing feature
    - Stored as DECIMAL for precision
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE shops ADD COLUMN latitude DECIMAL(10, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE shops ADD COLUMN longitude DECIMAL(11, 8);
  END IF;
END $$;