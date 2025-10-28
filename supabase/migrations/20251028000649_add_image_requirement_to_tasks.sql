/*
  # Add image requirement to tasks

  1. Changes
    - Add require_image column to tasks table
    - Add image_url column to task_completions table
    - Allows shop owners to require photo evidence for specific tasks
  
  2. Notes
    - require_image defaults to false for existing tasks
    - image_url stores the submitted photo proof
    - Images will be compressed and converted to WebP like incident photos
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'require_image'
  ) THEN
    ALTER TABLE tasks ADD COLUMN require_image BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_completions' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE task_completions ADD COLUMN image_url TEXT;
  END IF;
END $$;