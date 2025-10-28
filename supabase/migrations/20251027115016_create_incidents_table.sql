/*
  # Create incidents table
  
  1. New Tables
    - incidents for reporting issues (Pro plan feature)
  
  2. Security
    - Enable RLS
    - Shop owners can manage incidents
*/

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id),
  
  incident_type TEXT CHECK (incident_type IN ('shoplifting', 'customer_complaint', 'safety_issue', 'equipment_broken', 'staff_issue', 'other')),
  description TEXT NOT NULL,
  photo_url TEXT,
  
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage incidents"
  ON incidents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = incidents.shop_id
      AND shops.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_incidents_shop_id ON incidents(shop_id);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_resolved ON incidents(resolved);