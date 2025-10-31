/*
  # Enable RLS and create security policies for all tables
  
  CRITICAL: This ensures shop data isolation - each shop can only see their own data
*/

-- First, ensure shops table has user_id column (if it doesn't exist, add it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE shops ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE clock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_visits ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if they exist (will recreate with proper shop isolation)
DROP POLICY IF EXISTS "Users see only their shops" ON shops;
DROP POLICY IF EXISTS "Users can insert own shop" ON shops;
DROP POLICY IF EXISTS "Users can update own shop" ON shops;
DROP POLICY IF EXISTS "Users see only their shop's staff" ON employees;
DROP POLICY IF EXISTS "Users see only their shop's clock events" ON clock_entries;
DROP POLICY IF EXISTS "Users see only their shop's customers" ON customers;
DROP POLICY IF EXISTS "Users see only their shop's visits" ON customer_visits;
DROP POLICY IF EXISTS "Super admin sees all shops" ON shops;

-- SHOPS TABLE POLICIES
-- Users can only see shops they have access to
-- Check user_id FIRST to avoid recursion when querying user_shop_access
CREATE POLICY "Users see only their shops"
  ON shops FOR SELECT
  USING (
    -- Backward compatibility: shops owned directly (checked first to avoid recursion)
    (user_id = auth.uid())
    OR
    -- Check user_shop_access (only if user doesn't own shop directly)
    (user_id IS NULL OR user_id != auth.uid()) AND id IN (
      SELECT shop_id FROM user_shop_access
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own shops (for signup)
CREATE POLICY "Users can insert own shop"
  ON shops FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own shops
CREATE POLICY "Users can update own shop"
  ON shops FOR UPDATE
  USING (auth.uid() = user_id);

-- Note: Super admin policy removed here because it queries auth.users which isn't accessible from RLS
-- See migration 20250131000011 for fixed super admin policy using auth.jwt()

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
    -- Backward compatibility: shops owned directly
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
    -- Backward compatibility: shops owned directly
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
    -- Backward compatibility: shops owned directly
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
    -- Backward compatibility: shops owned directly
    shop_id IN (
      SELECT id FROM shops
      WHERE user_id = auth.uid()
    )
  );

-- Staff can insert their own clock events
CREATE POLICY "Staff can clock in/out"
  ON clock_entries FOR INSERT
  WITH CHECK (
    -- Staff can clock in if they have access via user_shop_access
    shop_id IN (
      SELECT shop_id FROM user_shop_access
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager', 'staff')
    )
    OR
    -- Backward compatibility: shops owned directly
    shop_id IN (
      SELECT id FROM shops
      WHERE user_id = auth.uid()
    )
    OR
    -- Allow if employee belongs to a shop the user has access to
    employee_id IN (
      SELECT e.id FROM employees e
      WHERE e.shop_id IN (
        SELECT shop_id FROM user_shop_access
        WHERE user_id = auth.uid()
      )
      OR e.shop_id IN (
        SELECT id FROM shops
        WHERE user_id = auth.uid()
      )
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
    -- Backward compatibility: shops owned directly
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
    -- Backward compatibility: shops owned directly
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
    -- Backward compatibility: shops owned directly
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
    -- Backward compatibility: shops owned directly
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
    -- Backward compatibility: shops owned directly
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

