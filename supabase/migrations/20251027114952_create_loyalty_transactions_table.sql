/*
  # Create loyalty_transactions table
  
  1. New Tables
    - loyalty_transactions for tracking all loyalty point changes
  
  2. Security
    - Enable RLS
    - Shop owners can view and insert transactions
*/

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  transaction_type TEXT CHECK (transaction_type IN ('point_added', 'reward_redeemed', 'points_adjusted')),
  points_change INTEGER NOT NULL,
  
  added_by_employee_id UUID REFERENCES employees(id),
  
  balance_after INTEGER NOT NULL,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view transactions"
  ON loyalty_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = loyalty_transactions.shop_id
      AND shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Shop owners can insert transactions"
  ON loyalty_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = loyalty_transactions.shop_id
      AND shops.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_loyalty_trans_shop_id ON loyalty_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_trans_customer_id ON loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_trans_employee_id ON loyalty_transactions(added_by_employee_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_trans_created ON loyalty_transactions(created_at DESC);