-- =====================================================
-- SECURITY AUDIT: RLS AND INDEXES
-- Run this in Supabase SQL Editor
-- =====================================================

-- STEP 1: ENABLE RLS ON ALL CRITICAL TABLES
-- Check current RLS status first
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND tablename IN (
      'shops', 'employees', 'clock_entries', 'customers', 
      'customer_visits', 'shop_settings', 'notifications', 
      'staff_requests', 'tasks', 'incidents', 'email_templates'
    )
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.tablename);
    RAISE NOTICE 'Enabled RLS on table: %', r.tablename;
  END LOOP;
END $$;

-- STEP 2: CREATE/UPDATE USER_SHOP_ACCESS TABLE IF NEEDED
CREATE TABLE IF NOT EXISTS user_shop_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, shop_id)
);

ALTER TABLE user_shop_access ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'email' LIKE '%@digiget.uk'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'super'
    OR (auth.jwt() -> 'user_metadata' ->> 'is_super_admin') = 'true'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: RLS POLICIES FOR SHOPS
DROP POLICY IF EXISTS "Users see their own shops" ON shops;
DROP POLICY IF EXISTS "Users see shops they have access to" ON shops;
DROP POLICY IF EXISTS "Super admin sees all shops" ON shops;
DROP POLICY IF EXISTS "Users can insert their own shops" ON shops;
DROP POLICY IF EXISTS "Users can update their own shops" ON shops;

CREATE POLICY "Users see shops they own"
ON shops FOR SELECT
USING (
  user_id = auth.uid()
  OR shop_id IN (
    SELECT shop_id FROM user_shop_access 
    WHERE user_id = auth.uid()
  )
  OR is_super_admin()
);

CREATE POLICY "Users can insert their own shops"
ON shops FOR INSERT
WITH CHECK (user_id = auth.uid() OR is_super_admin());

CREATE POLICY "Users can update their own shops"
ON shops FOR UPDATE
USING (
  user_id = auth.uid()
  OR shop_id IN (
    SELECT shop_id FROM user_shop_access 
    WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
  )
  OR is_super_admin()
);

-- STEP 4: RLS POLICIES FOR CUSTOMERS
DROP POLICY IF EXISTS "Users see customers from their shops" ON customers;
DROP POLICY IF EXISTS "Users can insert customers to their shops" ON customers;
DROP POLICY IF EXISTS "Users can update customers from their shops" ON customers;

CREATE POLICY "Users see customers from their shops"
ON customers FOR ALL
USING (
  shop_id IN (
    SELECT id FROM shops WHERE user_id = auth.uid()
    UNION
    SELECT shop_id FROM user_shop_access WHERE user_id = auth.uid()
  )
  OR is_super_admin()
)
WITH CHECK (
  shop_id IN (
    SELECT id FROM shops WHERE user_id = auth.uid()
    UNION
    SELECT shop_id FROM user_shop_access WHERE user_id = auth.uid()
  )
  OR is_super_admin()
);

-- STEP 5: RLS POLICIES FOR EMPLOYEES
DROP POLICY IF EXISTS "Users see employees from their shops" ON employees;
DROP POLICY IF EXISTS "Users can manage employees in their shops" ON employees;

CREATE POLICY "Users see employees from their shops"
ON employees FOR ALL
USING (
  shop_id IN (
    SELECT id FROM shops WHERE user_id = auth.uid()
    UNION
    SELECT shop_id FROM user_shop_access WHERE user_id = auth.uid()
  )
  OR is_super_admin()
)
WITH CHECK (
  shop_id IN (
    SELECT id FROM shops WHERE user_id = auth.uid()
    UNION
    SELECT shop_id FROM user_shop_access WHERE user_id = auth.uid()
  )
  OR is_super_admin()
);

-- STEP 6: RLS POLICIES FOR CLOCK ENTRIES
DROP POLICY IF EXISTS "Users see clock entries from their shops" ON clock_entries;

CREATE POLICY "Users see clock entries from their shops"
ON clock_entries FOR ALL
USING (
  shop_id IN (
    SELECT id FROM shops WHERE user_id = auth.uid()
    UNION
    SELECT shop_id FROM user_shop_access WHERE user_id = auth.uid()
  )
  OR is_super_admin()
)
WITH CHECK (
  shop_id IN (
    SELECT id FROM shops WHERE user_id = auth.uid()
    UNION
    SELECT shop_id FROM user_shop_access WHERE user_id = auth.uid()
  )
  OR is_super_admin()
);

-- STEP 7: RLS POLICIES FOR EMAIL TEMPLATES (Super Admin Only)
DROP POLICY IF EXISTS "Super admins can manage email templates" ON email_templates;

CREATE POLICY "Super admins can manage email templates"
ON email_templates
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- STEP 8: CREATE INDEXES FOR PERFORMANCE
-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_shop ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_shop_phone ON customers(shop_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers USING gin(to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')));

-- Employee indexes
CREATE INDEX IF NOT EXISTS idx_employees_shop ON employees(shop_id);
CREATE INDEX IF NOT EXISTS idx_employees_shop_pin ON employees(shop_id, pin);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(shop_id) WHERE is_active = true;

-- Clock entries indexes
CREATE INDEX IF NOT EXISTS idx_clock_entries_shop ON clock_entries(shop_id);
CREATE INDEX IF NOT EXISTS idx_clock_entries_employee ON clock_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_clock_entries_date ON clock_entries(clock_in_time DESC);
CREATE INDEX IF NOT EXISTS idx_clock_entries_shop_date ON clock_entries(shop_id, clock_in_time DESC);
CREATE INDEX IF NOT EXISTS idx_clock_entries_active ON clock_entries(employee_id) WHERE clock_out_time IS NULL;

-- Customer visits indexes
CREATE INDEX IF NOT EXISTS idx_customer_visits_customer ON customer_visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_visits_shop ON customer_visits(shop_id);
CREATE INDEX IF NOT EXISTS idx_customer_visits_date ON customer_visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_customer_visits_shop_date ON customer_visits(shop_id, visit_date DESC);

-- User shop access indexes
CREATE INDEX IF NOT EXISTS idx_user_shop_access_user ON user_shop_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shop_access_shop ON user_shop_access(shop_id);
CREATE INDEX IF NOT EXISTS idx_user_shop_access_user_shop ON user_shop_access(user_id, shop_id);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_shop ON tasks(shop_id);
CREATE INDEX IF NOT EXISTS idx_tasks_employee ON tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(shop_id, due_date) WHERE status != 'completed';

-- Incidents indexes
CREATE INDEX IF NOT EXISTS idx_incidents_shop ON incidents(shop_id);
CREATE INDEX IF NOT EXISTS idx_incidents_date ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_shop_date ON incidents(shop_id, created_at DESC);

-- Staff requests indexes
CREATE INDEX IF NOT EXISTS idx_staff_requests_shop ON staff_requests(shop_id);
CREATE INDEX IF NOT EXISTS idx_staff_requests_status ON staff_requests(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_staff_requests_date ON staff_requests(created_at DESC);

-- Shops indexes
CREATE INDEX IF NOT EXISTS idx_shops_user ON shops(user_id);
CREATE INDEX IF NOT EXISTS idx_shops_plan ON shops(plan_type, subscription_status);

-- Notifications indexes (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_shop ON notifications(shop_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(shop_id, is_read) WHERE is_read = false;
    CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(created_at DESC);
  END IF;
END $$;

-- STEP 9: CREATE ATOMIC FUNCTIONS FOR POINTS AND VISITS
CREATE OR REPLACE FUNCTION add_customer_point(
  p_customer_id UUID,
  p_shop_id UUID,
  p_points_to_add INTEGER DEFAULT 1
)
RETURNS customers AS $$
DECLARE
  v_customer customers;
BEGIN
  UPDATE customers
  SET 
    points = points + p_points_to_add,
    total_visits = total_visits + 1,
    last_visit_date = NOW(),
    updated_at = NOW()
  WHERE id = p_customer_id
    AND shop_id = p_shop_id
  RETURNING * INTO v_customer;
  
  IF v_customer IS NULL THEN
    RAISE EXCEPTION 'Customer not found or access denied';
  END IF;
  
  RETURN v_customer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely check in a customer
CREATE OR REPLACE FUNCTION check_in_customer(
  p_customer_id UUID,
  p_shop_id UUID,
  p_points_to_add INTEGER DEFAULT 1
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  customer_data customers
) AS $$
DECLARE
  v_customer customers;
  v_loyalty_settings JSONB;
BEGIN
  -- Verify shop ownership/access
  IF NOT EXISTS (
    SELECT 1 FROM shops 
    WHERE id = p_shop_id 
    AND (user_id = auth.uid() OR id IN (SELECT shop_id FROM user_shop_access WHERE user_id = auth.uid()))
  ) THEN
    RETURN QUERY SELECT false, 'Access denied to this shop', NULL::customers;
    RETURN;
  END IF;

  -- Get customer
  SELECT * INTO v_customer 
  FROM customers 
  WHERE id = p_customer_id AND shop_id = p_shop_id;

  IF v_customer IS NULL THEN
    RETURN QUERY SELECT false, 'Customer not found', NULL::customers;
    RETURN;
  END IF;

  -- Get shop loyalty settings
  SELECT 
    jsonb_build_object(
      'enabled', loyalty_enabled,
      'points_type', points_type,
      'points_needed', points_needed,
      'days_between_points', days_between_points
    ) INTO v_loyalty_settings
  FROM shops 
  WHERE id = p_shop_id;

  -- Check if enough days have passed (if configured)
  IF (v_loyalty_settings->>'days_between_points')::INTEGER > 0 THEN
    IF EXISTS (
      SELECT 1 FROM customer_visits
      WHERE customer_id = p_customer_id
      AND shop_id = p_shop_id
      AND visit_date > NOW() - ((v_loyalty_settings->>'days_between_points')::INTEGER || ' days')::INTERVAL
    ) THEN
      RETURN QUERY SELECT false, 'Not enough days since last visit', v_customer;
      RETURN;
    END IF;
  END IF;

  -- Add points and visit
  UPDATE customers
  SET 
    points = CASE 
      WHEN (v_loyalty_settings->>'enabled')::BOOLEAN THEN points + p_points_to_add
      ELSE points
    END,
    total_visits = total_visits + 1,
    last_visit_date = NOW(),
    updated_at = NOW()
  WHERE id = p_customer_id
  RETURNING * INTO v_customer;

  -- Create visit record
  INSERT INTO customer_visits (customer_id, shop_id, visit_date, points_added)
  VALUES (p_customer_id, p_shop_id, NOW(), p_points_to_add);

  RETURN QUERY SELECT true, 'Customer checked in successfully', v_customer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_customer_point(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_in_customer(UUID, UUID, INTEGER) TO authenticated;

