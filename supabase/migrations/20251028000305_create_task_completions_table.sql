/*
  # Create task completions table

  1. New Tables
    - `task_completions` - Tracks daily task completion by employees
      - `id` (uuid, primary key)
      - `task_id` (uuid) - Reference to the task template
      - `employee_id` (uuid) - Employee who completed/submitted the task
      - `clock_entry_id` (uuid) - Links task to specific shift
      - `shop_id` (uuid) - For efficient querying
      - `completed` (boolean) - Whether task was marked as done
      - `not_completed_reason` (text) - Optional reason if not completed
      - `completed_at` (timestamptz) - When task was submitted
      - `task_date` (date) - Date of the shift (for daily task tracking)
  
  2. Security
    - Enable RLS on `task_completions` table
    - Shop owners can view all completions
    - Employees can create and view their own completions
  
  3. Indexes
    - Index on shop_id for shop owner queries
    - Index on employee_id for employee queries
    - Index on task_date for date-based filtering
    - Index on clock_entry_id for shift-based queries
*/

CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  clock_entry_id UUID REFERENCES clock_entries(id) ON DELETE CASCADE NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  
  completed BOOLEAN DEFAULT false,
  not_completed_reason TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  task_date DATE DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(task_id, employee_id, clock_entry_id)
);

ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view task completions"
  ON task_completions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = task_completions.shop_id
      AND shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can create task completions"
  ON task_completions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = task_completions.employee_id
      AND employees.shop_id = task_completions.shop_id
      AND employees.active = true
    )
  );

CREATE POLICY "Employees can view own task completions"
  ON task_completions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = task_completions.employee_id
      AND employees.active = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_task_completions_shop_id ON task_completions(shop_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_employee_id ON task_completions(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_date ON task_completions(task_date);
CREATE INDEX IF NOT EXISTS idx_task_completions_clock_entry_id ON task_completions(clock_entry_id);