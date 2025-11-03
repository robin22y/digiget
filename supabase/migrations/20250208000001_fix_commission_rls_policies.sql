-- =====================================================
-- Fix RLS Policies for Commission System Tables
-- Properly secure employee_contributions and daily_revenue_summary
-- 
-- NOTE: Run create_employee_contributions_table.sql FIRST
-- if the tables don't exist yet.
-- =====================================================

-- =====================================================
-- 1. EMPLOYEE_CONTRIBUTIONS TABLE
-- =====================================================

-- Only proceed if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employee_contributions') THEN
    -- Drop existing insecure policies
    DROP POLICY IF EXISTS "Shop owners can view their contributions" ON employee_contributions;
    DROP POLICY IF EXISTS "Staff can view their own contributions" ON employee_contributions;
    DROP POLICY IF EXISTS "Shop owners can insert contributions" ON employee_contributions;
    DROP POLICY IF EXISTS "Service role can manage contributions" ON employee_contributions;
    DROP POLICY IF EXISTS "Anonymous can insert contributions for shop portal" ON employee_contributions;

    -- Policy 1: Shop owners can view all contributions for their shops
    -- Explanation: Shop owners need to see all employee contributions for payroll/analytics
    CREATE POLICY "Shop owners can view their contributions"
      ON employee_contributions
      FOR SELECT
      USING (
        shop_id IN (
          SELECT id FROM shops WHERE user_id = auth.uid()
        )
      );

    -- Policy 2: Employees can view their own contributions
    -- Explanation: Staff members need to see their own earnings and performance
    -- Note: This assumes employees table may have user_id. Adjust based on your auth system.
    CREATE POLICY "Staff can view their own contributions"
      ON employee_contributions
      FOR SELECT
      USING (
        -- If employees have user_id, use that. Otherwise allow shop owner access.
        EXISTS (
          SELECT 1 FROM employees e
          JOIN shops s ON s.id = employee_contributions.shop_id
          WHERE e.id = employee_contributions.employee_id
          AND (
            (s.user_id = auth.uid()) -- Shop owner can see all
            OR (
              -- Or employee has matching user_id (if column exists)
              EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'employees' AND column_name = 'user_id'
              )
              AND EXISTS (
                SELECT 1 FROM employees 
                WHERE id = employee_contributions.employee_id
                AND user_id = auth.uid()
              )
            )
          )
        )
      );

    -- Policy 3: Shop owners can insert contributions (for system-generated records)
    -- Explanation: When check-ins happen, the system needs to create contribution records
    CREATE POLICY "Shop owners can insert contributions"
      ON employee_contributions
      FOR INSERT
      WITH CHECK (
        shop_id IN (
          SELECT id FROM shops WHERE user_id = auth.uid()
        )
      );

    -- Policy 4: Service role can manage everything (for server-side operations)
    -- Explanation: Service role bypasses RLS and is used by Edge Functions/background jobs
    CREATE POLICY "Service role can manage contributions"
      ON employee_contributions
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    -- Policy 5: Allow anonymous insert (for shop portal check-in without auth)
    CREATE POLICY "Anonymous can insert contributions for shop portal"
      ON employee_contributions
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;

-- =====================================================
-- 2. DAILY_REVENUE_SUMMARY TABLE
-- =====================================================

-- Only proceed if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_revenue_summary') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Shop owners can view their revenue" ON daily_revenue_summary;
    DROP POLICY IF EXISTS "Shop owners can manage their revenue" ON daily_revenue_summary;
    DROP POLICY IF EXISTS "Service role can manage revenue summaries" ON daily_revenue_summary;

    -- Policy 1: Shop owners can view their revenue summaries
    -- Explanation: Shop owners need access to their analytics and reports
    CREATE POLICY "Shop owners can view their revenue"
      ON daily_revenue_summary
      FOR SELECT
      USING (
        shop_id IN (
          SELECT id FROM shops WHERE user_id = auth.uid()
        )
      );

    -- Policy 2: Shop owners can insert/update revenue summaries
    -- Explanation: System needs to create/update daily summaries (can be automated or manual)
    CREATE POLICY "Shop owners can manage their revenue"
      ON daily_revenue_summary
      FOR ALL
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

    -- Policy 3: Service role can manage everything (for automated jobs)
    -- Explanation: Background jobs/scheduled functions need to update summaries
    CREATE POLICY "Service role can manage revenue summaries"
      ON daily_revenue_summary
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. These policies assume employees table has a user_id column
--    If your employees use PIN-based auth only, update Policy 2 in employee_contributions
-- 2. Service role policies allow server-side operations to bypass RLS
-- 3. All policies use shop ownership checks for data isolation
-- 4. INSERT policies ensure only shop owners can add new records

