-- Create notices table for Super Admin notices system
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience_filter TEXT NOT NULL DEFAULT 'all',
  -- audience_filter can be: 'all', 'active', 'trial', 'shop:{shop_id}', 'postcode:{postcode}', 'type:{type}'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_by TEXT NOT NULL,
  show_on_dashboard BOOLEAN DEFAULT FALSE
);

-- Add RLS policies if needed (adjust based on your security requirements)
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can do everything
CREATE POLICY "Super admins can manage notices" ON notices
  FOR ALL
  USING (auth.jwt() ->> 'email' LIKE '%@digiget.uk' OR auth.jwt() ->> 'role' = 'super');

-- Policy: Shop owners can read notices that apply to them
-- This is a simplified version - you'd need more complex logic in production
CREATE POLICY "Shop owners can read notices" ON notices
  FOR SELECT
  USING (
    audience_filter = 'all' OR 
    audience_filter = 'active' OR 
    audience_filter = 'trial'
  );

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_notices_audience_filter ON notices(audience_filter);
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_show_on_dashboard ON notices(show_on_dashboard) WHERE show_on_dashboard = true;

