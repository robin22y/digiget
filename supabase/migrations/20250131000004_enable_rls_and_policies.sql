/*
  # Enable RLS and create security policies for all tables
  
  CRITICAL: This ensures shop data isolation - each shop can only see their own data
*/

-- Enable RLS on all tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE clock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_visits ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if they exist (will recreate with proper shop isolation)
DROP POLICY IF EXISTS "Users see only their shops" ON shops;
DROP POLICY IF EXISTS "Users see only their shop's staff" ON employees;
DROP POLICY IF EXISTS "Users see only their shop's clock events" ON clock_entries;
DROP POLICY IF EXISTS "Users see only their shop's customers" ON customers;
DROP POLICY IF EXISTS "Users see only their shop's visits" ON customer_visits;
DROP POLICY IF EXISTS "Super admin sees all shops" ON shops;

-- SHOPS TABLE POLICIES
-- Users can only see shops they have access to
CREATE POLICY "Users see only their shops"
  ON shops FOR SELECT
  USING (
    id IN (
      SELECT shop_id FROM user_shop_access
      WHERE user_id = auth.uid()
    )
    OR
    user_id = auth.uid() -- Backward compatibility: shops owned directly
  );

-- Super admins see all shops
CREATE POLICY "Super admin sees all shops"
  ON shops FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'super_admin'
    )
  );

-- EMPLOYEES TABLE POLICIES
-- Users can only see staff from their shops
CREATE POLICY "Users see only their shop's staff"
  ON employees FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_access
      WHERE user_id = auth.uid()
    )
    OR
    shop_id IN (
      SELECT id FROM shops
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert staff to their shops only
CREATE POLICY "Users can insert staff to their shops only"
  ON employees FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM user_shop_access
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
    OR
    shop_id IN (
      SELECT id FROM shops
      WHERE user_id = auth.uid()
    )
  );

-- Users can update their shop's staff only
CREATE POLICY "Users can update their shop's staff only"
  ON employees FOR UPDATE
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_access
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
    OR
    shop_id IN (
      SELECT id FROM shops
      WHERE user_id = auth.uid()
    )
  );

-- CLOCK_ENTRIES TABLE POLICIES
-- Users can only see clock events from their shops
CREATE POLICY "Users see only their shop's clock events"
  ON clock_entries FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_access
      WHERE user_id = auth.uid()
    )
    OR
    shop_id IN (
      SELECT id FROM shops
      WHERE user_id = auth.uid()
    )
  );

-- Staff can insert their own clock events
CREATE POLICY "Staff can clock in/out"
  ON clock_entries FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees
      WHERE user_id = auth.uid()
    )
    OR
    shop_id IN (
      SELECT shop_id FROM user_shop_access
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager', 'staff')
    )
    OR
    shop_id IN (
      SELECT id FROM shops
      WHERE user_id = auth.uid()
    )
  );

-- CUSTOMERS TABLE POLICIES
-- Users can only see customers from their shops
CREATE POLICY "Users see only their shop's customers"
  ON customers FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_access
      WHERE user_id = auth.uid()
    )
    OR
    shop_id IN (
      SELECT id FROM shops
      WHERE user_id = auth.uid()
    )
  );

-- Staff can add customers to their shop
CREATE POLICY "Staff can add customers to their shop"
  ON customers FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM user_shop_access
      WHERE user_id = auth.uid()
    )
    OR
    shop_id IN (
      SELECT id FROM shops
      WHERE user_id = auth.uid()
    )
  );

-- Staff can update their shop's customers
CREATE POLICY "Staff can update their shop's customers"
  ON customers FOR UPDATE
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_access
      WHERE user_id = auth.uid()
    )
    OR
    shop_id IN (
      SELECT id FROM shops
      WHERE user_id = auth.uid()
    )
  );

-- CUSTOMER_VISITS TABLE POLICIES
-- Users can only see visits from their shops
CREATE POLICY "Users see only their shop's visits"
  ON customer_visits FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_access
      WHERE user_id = auth.uid()
    )
    OR
    shop_id IN (
      SELECT id FROM shops
      WHERE user_id = auth.uid()
    )
  );

-- Staff can record visits for their shop
CREATE POLICY "Staff can record visits for their shop"
  ON customer_visits FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM user_shop_access
      WHERE user_id = auth.uid()
    )
    OR
    shop_id IN (
      SELECT id FROM shops
      WHERE user_id = auth.uid()
    )
  );

-- Allow anonymous users for staff portal (backward compatibility)
DROP POLICY IF EXISTS "Public can insert visits" ON customer_visits;
DROP POLICY IF EXISTS "Public can view own visits" ON customer_visits;

CREATE POLICY "Public can insert visits"
  ON customer_visits FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can view own visits"
  ON customer_visits FOR SELECT
  TO anon
  USING (true);

