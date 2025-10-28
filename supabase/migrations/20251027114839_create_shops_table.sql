/*
  # Create shops table
  
  1. New Tables
    - shops table with all business and subscription settings
  
  2. Security
    - Enable RLS
    - Add policies for shop owners
*/

CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  shop_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  business_category TEXT,
  
  plan_type TEXT DEFAULT 'basic' CHECK (plan_type IN ('basic', 'pro')),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired')),
  trial_ends_at TIMESTAMPTZ,
  subscription_started_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  access_ends_at TIMESTAMPTZ,
  data_deletion_at TIMESTAMPTZ,
  
  loyalty_enabled BOOLEAN DEFAULT true,
  points_type TEXT DEFAULT 'per_visit' CHECK (points_type IN ('per_visit', 'per_spend')),
  points_needed INTEGER DEFAULT 6,
  reward_type TEXT DEFAULT 'free_product' CHECK (reward_type IN ('free_product', 'fixed_discount', 'percentage_discount')),
  reward_value DECIMAL(10, 2),
  reward_description TEXT DEFAULT 'Free service',
  
  diary_enabled BOOLEAN DEFAULT false,
  owner_pin TEXT DEFAULT '0000',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shop"
  ON shops FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own shop"
  ON shops FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shop"
  ON shops FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_shops_user_id ON shops(user_id);
CREATE INDEX IF NOT EXISTS idx_shops_trial_ends ON shops(trial_ends_at);