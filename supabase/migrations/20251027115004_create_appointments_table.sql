/*
  # Create appointments table
  
  1. New Tables
    - appointments for diary/scheduling feature
  
  2. Security
    - Enable RLS
    - Shop owners can manage appointments
*/

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  service_type TEXT,
  notes TEXT,
  
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  
  checked_in_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage appointments"
  ON appointments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = appointments.shop_id
      AND shops.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_appointments_shop_id ON appointments(shop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_shop_date ON appointments(shop_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);