/*
  # Create tasks table
  
  1. New Tables
    - tasks for daily task checklists (Pro plan feature)
  
  2. Security
    - Enable RLS
    - Shop owners can manage tasks
*/

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  
  task_name TEXT NOT NULL,
  task_description TEXT,
  
  assigned_to TEXT DEFAULT 'all' CHECK (assigned_to IN ('all', 'specific')),
  assigned_employee_ids UUID[],
  
  active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage tasks"
  ON tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = tasks.shop_id
      AND shops.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_tasks_shop_id ON tasks(shop_id);
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(active) WHERE active = true;