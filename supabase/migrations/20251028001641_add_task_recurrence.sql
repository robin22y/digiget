/*
  # Add task recurrence and validity

  1. Changes
    - Add recurrence_type to tasks table (daily, weekly, one_time)
    - Add recurrence_day for weekly tasks (monday, tuesday, etc.)
    - Add valid_from and valid_until dates for one-time tasks
    - Add completed boolean for one-time tasks
  
  2. Recurrence Types
    - daily: Task appears every day
    - weekly: Task appears on specific day(s) of the week
    - one_time: Task appears only once or within a date range
  
  3. Notes
    - Existing tasks default to 'daily' recurrence
    - Weekly tasks use recurrence_day to specify which day(s)
    - One-time tasks use valid_from/valid_until for date range
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'recurrence_type'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurrence_type TEXT DEFAULT 'daily' CHECK (recurrence_type IN ('daily', 'weekly', 'one_time'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'recurrence_day'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurrence_day TEXT CHECK (recurrence_day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'valid_from'
  ) THEN
    ALTER TABLE tasks ADD COLUMN valid_from DATE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'valid_until'
  ) THEN
    ALTER TABLE tasks ADD COLUMN valid_until DATE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'completed'
  ) THEN
    ALTER TABLE tasks ADD COLUMN completed BOOLEAN DEFAULT false;
  END IF;
END $$;