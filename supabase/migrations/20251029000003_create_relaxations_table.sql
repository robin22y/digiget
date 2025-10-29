/*
  # Create relaxations table
  
  1. New Tables
    - relaxations for tracking staff-granted relaxations (redemption and point-earning cooldowns)
  
  2. Security
    - Enable RLS
    - Shop owners and staff can manage relaxations
*/

CREATE TABLE IF NOT EXISTS relaxations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  
  relaxation_type TEXT CHECK (relaxation_type IN ('redemption', 'point_earning')) NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE relaxations ENABLE ROW LEVEL SECURITY;

-- Shop owners can manage relaxations
CREATE POLICY "Shop owners can manage relaxations"
  ON relaxations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = relaxations.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- Public can view relaxations (for customer area to check if relaxation exists)
CREATE POLICY "Public can view relaxations"
  ON relaxations FOR SELECT
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_relaxations_customer_id ON relaxations(customer_id);
CREATE INDEX IF NOT EXISTS idx_relaxations_shop_id ON relaxations(shop_id);
CREATE INDEX IF NOT EXISTS idx_relaxations_employee_id ON relaxations(employee_id);
CREATE INDEX IF NOT EXISTS idx_relaxations_granted_at ON relaxations(granted_at DESC);

