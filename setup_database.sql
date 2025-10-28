-- =====================================================
-- DigiGet Database Setup - Run this in Supabase SQL Editor
-- =====================================================

-- Drop existing tables if they exist (CASCADE will also drop policies)
DROP TABLE IF EXISTS clock_entries CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS shops CASCADE;

-- 1. Create shops table
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
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
  auto_logout_hours INTEGER DEFAULT 0,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own shop" ON shops;
DROP POLICY IF EXISTS "Users can update own shop" ON shops;
DROP POLICY IF EXISTS "Users can insert own shop" ON shops;
DROP POLICY IF EXISTS "Public can view shops" ON shops;

CREATE POLICY "Users can view own shop"
  ON shops FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own shop"
  ON shops FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shop"
  ON shops FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable public read for staff portal
CREATE POLICY "Public can view shops"
  ON shops FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_shops_user_id ON shops(user_id);

-- 2. Create employees table
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  
  first_name TEXT NOT NULL,
  last_name TEXT,
  pin TEXT NOT NULL,
  email TEXT,
  
  role TEXT DEFAULT 'staff' CHECK (role IN ('staff', 'manager')),
  
  photo_url TEXT,
  phone TEXT,
  hourly_rate DECIMAL(5,2),
  
  active BOOLEAN DEFAULT true,
  
  -- PIN management
  last_pin_change_at TIMESTAMPTZ,
  pin_expires_at TIMESTAMPTZ,
  pin_change_required BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop owners can manage employees" ON employees;
DROP POLICY IF EXISTS "Public can view employees" ON employees;

CREATE POLICY "Shop owners can manage employees"
  ON employees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = employees.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- Enable public read for staff portal
CREATE POLICY "Public can view employees"
  ON employees FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_employees_shop_id ON employees(shop_id);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(active) WHERE active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_shop_pin ON employees(shop_id, pin);

-- 3. Create customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  
  phone TEXT NOT NULL,
  name TEXT,
  classification TEXT CHECK (classification IN ('VIP', 'Regular', 'New')) DEFAULT 'New',
  
  current_points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  rewards_redeemed INTEGER DEFAULT 0,
  
  active BOOLEAN DEFAULT true,
  
  first_visit_at TIMESTAMPTZ DEFAULT NOW(),
  last_visit_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop owners can manage customers" ON customers;
DROP POLICY IF EXISTS "Public can view customer by phone" ON customers;

CREATE POLICY "Shop owners can manage customers"
  ON customers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = customers.shop_id
      AND shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view customer by phone"
  ON customers FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_shop_phone_unique ON customers(shop_id, phone);

-- 4. Create clock_entries table
CREATE TABLE clock_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  
  clock_in_time TIMESTAMPTZ NOT NULL,
  clock_out_time TIMESTAMPTZ,
  hours_worked DECIMAL(5,2),
  
  tasks_complete BOOLEAN DEFAULT false,
  tasks_assigned JSONB DEFAULT '[]'::jsonb,
  tasks_completed_at TIMESTAMPTZ,
  
  clock_in_latitude DECIMAL(10, 8),
  clock_in_longitude DECIMAL(11, 8),
  clock_out_latitude DECIMAL(10, 8),
  clock_out_longitude DECIMAL(11, 8),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clock_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop owners can manage clock entries" ON clock_entries;
DROP POLICY IF EXISTS "Anyone can manage clock entries for staff portal" ON clock_entries;

CREATE POLICY "Shop owners can manage clock entries"
  ON clock_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = clock_entries.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- Allow anonymous users to manage clock entries for staff portal
CREATE POLICY "Anyone can manage clock entries for staff portal"
  ON clock_entries FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_clock_entries_shop_id ON clock_entries(shop_id);
CREATE INDEX IF NOT EXISTS idx_clock_entries_employee_id ON clock_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_clock_entries_clock_in ON clock_entries(clock_in_time);

-- 5. Create loyalty_transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  transaction_type TEXT CHECK (transaction_type IN ('point_added', 'reward_redeemed', 'points_adjusted', 'point_redeemed')),
  points_change INTEGER NOT NULL,
  
  added_by_employee_id UUID REFERENCES employees(id),
  
  balance_after INTEGER NOT NULL,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop owners can view transactions" ON loyalty_transactions;
DROP POLICY IF EXISTS "Shop owners can insert transactions" ON loyalty_transactions;
DROP POLICY IF EXISTS "Public can view transactions" ON loyalty_transactions;

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

-- Allow public read for tablet interface and customer balance pages
CREATE POLICY "Public can view transactions"
  ON loyalty_transactions FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_loyalty_trans_shop_id ON loyalty_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_trans_customer_id ON loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_trans_employee_id ON loyalty_transactions(added_by_employee_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_trans_created ON loyalty_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_trans_shop_created ON loyalty_transactions(shop_id, created_at DESC);

-- 6. Create clock_in_requests table (for remote clock-in approvals)
CREATE TABLE IF NOT EXISTS clock_in_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  request_latitude DECIMAL(10, 8) NOT NULL,
  request_longitude DECIMAL(11, 8) NOT NULL,
  distance_from_shop DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE clock_in_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can create clock in requests" ON clock_in_requests;
DROP POLICY IF EXISTS "Users can view their employee requests" ON clock_in_requests;
DROP POLICY IF EXISTS "Public can view clock in requests" ON clock_in_requests;
DROP POLICY IF EXISTS "Anyone can create clock in requests for staff portal" ON clock_in_requests;
DROP POLICY IF EXISTS "Shop owners can update requests" ON clock_in_requests;

CREATE POLICY "Authenticated users can create clock in requests"
  ON clock_in_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their employee requests"
  ON clock_in_requests
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE shop_id IN (
        SELECT id FROM shops WHERE user_id = auth.uid()
      )
    )
    OR
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view clock in requests"
  ON clock_in_requests
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create clock in requests for staff portal"
  ON clock_in_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Shop owners can update requests"
  ON clock_in_requests
  FOR UPDATE
  TO authenticated
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_clock_in_requests_shop_id ON clock_in_requests(shop_id);
CREATE INDEX IF NOT EXISTS idx_clock_in_requests_employee_id ON clock_in_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_clock_in_requests_status ON clock_in_requests(status);
CREATE INDEX IF NOT EXISTS idx_clock_in_requests_requested_at ON clock_in_requests(requested_at DESC);

-- 7. Create staff_location_checkins table (for traveling staff location tracking)
CREATE TABLE IF NOT EXISTS staff_location_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  clock_entry_id UUID REFERENCES clock_entries(id) ON DELETE CASCADE NOT NULL,
  
  location_name TEXT,
  check_in_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  check_out_time TIMESTAMPTZ,
  check_in_latitude DECIMAL(10, 8) NOT NULL,
  check_in_longitude DECIMAL(11, 8) NOT NULL,
  check_out_latitude DECIMAL(10, 8),
  check_out_longitude DECIMAL(11, 8),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE staff_location_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employees can manage their own location checkins" ON staff_location_checkins;
DROP POLICY IF EXISTS "Shop owners can view location checkins" ON staff_location_checkins;
DROP POLICY IF EXISTS "Public can view location checkins" ON staff_location_checkins;
DROP POLICY IF EXISTS "Anyone can manage location checkins for staff portal" ON staff_location_checkins;

CREATE POLICY "Employees can manage their own location checkins"
  ON staff_location_checkins
  FOR ALL
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE shop_id IN (
        SELECT id FROM shops WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Shop owners can view location checkins"
  ON staff_location_checkins
  FOR SELECT
  TO authenticated
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view location checkins"
  ON staff_location_checkins
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can manage location checkins for staff portal"
  ON staff_location_checkins FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_location_checkins_shop_id ON staff_location_checkins(shop_id);
CREATE INDEX IF NOT EXISTS idx_location_checkins_employee_id ON staff_location_checkins(employee_id);
CREATE INDEX IF NOT EXISTS idx_location_checkins_clock_entry_id ON staff_location_checkins(clock_entry_id);
CREATE INDEX IF NOT EXISTS idx_location_checkins_check_in_time ON staff_location_checkins(check_in_time DESC);
CREATE INDEX IF NOT EXISTS idx_location_checkins_active ON staff_location_checkins(employee_id, check_out_time) WHERE check_out_time IS NULL;

-- 8. Create remote_clock_in_approvals table (for pre-approving remote clock-ins)
CREATE TABLE IF NOT EXISTS remote_clock_in_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  days_of_week INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- 0=Sunday, 1=Monday, ..., 6=Saturday
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE remote_clock_in_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop owners can manage remote approvals" ON remote_clock_in_approvals;
DROP POLICY IF EXISTS "Employees can view their approvals" ON remote_clock_in_approvals;
DROP POLICY IF EXISTS "Public can view remote approvals" ON remote_clock_in_approvals;

CREATE POLICY "Shop owners can manage remote approvals"
  ON remote_clock_in_approvals
  FOR ALL
  TO authenticated
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can view their approvals"
  ON remote_clock_in_approvals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view remote approvals"
  ON remote_clock_in_approvals
  FOR SELECT
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_remote_approvals_shop_id ON remote_clock_in_approvals(shop_id);
CREATE INDEX IF NOT EXISTS idx_remote_approvals_employee_id ON remote_clock_in_approvals(employee_id);
CREATE INDEX IF NOT EXISTS idx_remote_approvals_active ON remote_clock_in_approvals(shop_id, is_active, start_date, end_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_remote_approvals_date_range ON remote_clock_in_approvals(start_date, end_date);

-- 9. Create staff_requests table (for staff to submit requests for uniforms, equipment, etc.)
CREATE TABLE IF NOT EXISTS staff_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  
  request_type TEXT NOT NULL CHECK (request_type IN ('uniform', 'equipment', 'supplies', 'time_off', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  response_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES auth.users(id)
);

ALTER TABLE staff_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employees can create requests" ON staff_requests;
DROP POLICY IF EXISTS "Public can create requests" ON staff_requests;
DROP POLICY IF EXISTS "Employees can view their requests" ON staff_requests;
DROP POLICY IF EXISTS "Shop owners can view all requests" ON staff_requests;
DROP POLICY IF EXISTS "Shop owners can manage requests" ON staff_requests;

CREATE POLICY "Employees can create requests"
  ON staff_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Public can create requests"
  ON staff_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Employees can view their requests"
  ON staff_requests
  FOR SELECT
  USING (true);

CREATE POLICY "Shop owners can view all requests"
  ON staff_requests
  FOR SELECT
  TO authenticated
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Shop owners can manage requests"
  ON staff_requests
  FOR UPDATE
  TO authenticated
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_staff_requests_shop_id ON staff_requests(shop_id);
CREATE INDEX IF NOT EXISTS idx_staff_requests_employee_id ON staff_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_requests_status ON staff_requests(status);
CREATE INDEX IF NOT EXISTS idx_staff_requests_created_at ON staff_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_requests_pending ON staff_requests(shop_id, status) WHERE status = 'pending';

-- Run this SQL in Supabase Dashboard to create the essential tables!

