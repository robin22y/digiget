-- =====================================================
-- Supabase RLS Policy Examples & Patterns
-- Common use-cases for Row Level Security
-- =====================================================

-- =====================================================
-- PATTERN 1: User owns rows (user_id column)
-- =====================================================
-- Table: user_profiles, user_settings, user_preferences

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- PATTERN 2: Shop ownership (shop belongs to user)
-- =====================================================
-- Table: products, inventory, orders

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Shop owners can manage products for their shops
CREATE POLICY "Shop owners manage their products"
  ON products FOR ALL
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

-- =====================================================
-- PATTERN 3: Staff can view own data + owner can view all
-- =====================================================
-- Table: employee_performance, staff_notes

-- Enable RLS
ALTER TABLE employee_performance ENABLE ROW LEVEL SECURITY;

-- Policy 1: Staff can view their own records
CREATE POLICY "Staff view own performance"
  ON employee_performance FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Shop owners can view all employee records
CREATE POLICY "Shop owners view all performance"
  ON employee_performance FOR SELECT
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- Policy 3: Only shop owners can insert/update
CREATE POLICY "Shop owners manage performance"
  ON employee_performance FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- PATTERN 4: Public read, authenticated write
-- =====================================================
-- Table: blog_posts, announcements, public_data

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read
CREATE POLICY "Public can read posts"
  ON blog_posts FOR SELECT
  USING (true);

-- Policy: Only authenticated users can write
CREATE POLICY "Authenticated users can create posts"
  ON blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authors can update/delete their posts
CREATE POLICY "Authors can update own posts"
  ON blog_posts FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can delete own posts"
  ON blog_posts FOR DELETE
  USING (author_id = auth.uid());

-- =====================================================
-- PATTERN 5: Anonymous access (for tablet/portal)
-- =====================================================
-- Table: clock_entries, check_ins (PIN-based access)

-- Enable RLS
ALTER TABLE clock_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Anonymous users (tablet) can create clock entries
CREATE POLICY "Anonymous can create clock entries"
  ON clock_entries FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Anyone can read (for tablet display)
CREATE POLICY "Anyone can read clock entries"
  ON clock_entries FOR SELECT
  USING (true);

-- =====================================================
-- PATTERN 6: Service role bypass (server operations)
-- =====================================================
-- Table: system_logs, scheduled_jobs

-- Enable RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (Edge Functions, cron jobs)
CREATE POLICY "Service role full access"
  ON system_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- PATTERN 7: Conditional access based on role
-- =====================================================
-- Table: admin_settings, system_config

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only super admins can access
CREATE POLICY "Super admins only"
  ON admin_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- =====================================================
-- PATTERN 8: Time-based access
-- =====================================================
-- Table: scheduled_posts, time_sensitive_data

-- Enable RLS
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Only show posts where publish_date is in past
CREATE POLICY "Published posts visible"
  ON scheduled_posts FOR SELECT
  USING (publish_date <= NOW());

-- Policy: Authors can manage future posts
CREATE POLICY "Authors manage future posts"
  ON scheduled_posts FOR ALL
  USING (
    author_id = auth.uid()
    AND publish_date > NOW()
  )
  WITH CHECK (
    author_id = auth.uid()
    AND publish_date > NOW()
  );

-- =====================================================
-- BEST PRACTICES:
-- =====================================================
-- 1. Always enable RLS: ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
-- 2. Drop policies before recreating: DROP POLICY IF EXISTS ...
-- 3. Use USING for SELECT/UPDATE/DELETE checks
-- 4. Use WITH CHECK for INSERT/UPDATE validation
-- 5. Test policies with both authenticated and anonymous users
-- 6. Service role policies allow server-side operations
-- 7. Use subqueries for relationship checks (shop ownership, etc.)
-- 8. Be explicit about TO roles (authenticated, anon, service_role)
-- 9. Comment policies for future maintainers
-- 10. Test edge cases (NULL values, missing relationships)

-- =====================================================
-- DEBUGGING RLS:
-- =====================================================
-- Check if RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- See all policies for a table:
-- SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Test as different role (in Supabase dashboard):
-- SET ROLE authenticated;
-- SELECT * FROM your_table;
-- RESET ROLE;

-- =====================================================
-- COMMON MISTAKES:
-- =====================================================
-- ❌ Forgetting to enable RLS
-- ❌ Using USING instead of WITH CHECK for INSERT
-- ❌ Not handling NULL values in checks
-- ❌ Forgetting service role policies for background jobs
-- ❌ Using = instead of IN for multi-value checks
-- ❌ Not considering anonymous users (tablet access)

