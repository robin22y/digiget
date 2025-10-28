/*
  # Create employees table
  
  1. New Tables
    - employees table for staff management (Pro plan feature)
  
  2. Security
    - Enable RLS
    - Shop owners can manage their employees
*/

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  
  first_name TEXT NOT NULL,
  last_name TEXT,
  pin TEXT NOT NULL,
  
  role TEXT DEFAULT 'staff' CHECK (role IN ('staff', 'manager')),
  
  photo_url TEXT,
  phone TEXT,
  hourly_rate DECIMAL(5,2),
  
  active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage employees"
  ON employees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = employees.shop_id
      AND shops.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_employees_shop_id ON employees(shop_id);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(active) WHERE active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_shop_pin ON employees(shop_id, pin);