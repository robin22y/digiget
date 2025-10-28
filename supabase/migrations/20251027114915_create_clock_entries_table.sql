/*
  # Create clock_entries table
  
  1. New Tables
    - clock_entries for staff time tracking
  
  2. Security
    - Enable RLS
    - Shop owners can view and manage clock entries
*/

CREATE TABLE IF NOT EXISTS clock_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  
  clock_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out_time TIMESTAMPTZ,
  
  hours_worked DECIMAL(5,2),
  
  tasks_complete BOOLEAN DEFAULT false,
  tasks_assigned JSONB,
  tasks_completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT clock_out_after_clock_in CHECK (clock_out_time IS NULL OR clock_out_time > clock_in_time)
);

ALTER TABLE clock_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view clock entries"
  ON clock_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = clock_entries.shop_id
      AND shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Shop owners can manage clock entries"
  ON clock_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = clock_entries.shop_id
      AND shops.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_clock_entries_shop_id ON clock_entries(shop_id);
CREATE INDEX IF NOT EXISTS idx_clock_entries_employee_id ON clock_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_clock_entries_clock_in ON clock_entries(clock_in_time);