-- Fix RLS policies to allow super admin to view all shops
-- Run this in your Supabase SQL Editor

-- Add policy for super admins to view all shops
DROP POLICY IF EXISTS "Super admins can view all shops" ON shops;

CREATE POLICY "Super admins can view all shops"
  ON shops FOR SELECT
  USING (
    -- Allow super admin emails (@digiget.uk)
    auth.jwt() ->> 'email' LIKE '%@digiget.uk'
    OR
    -- Allow users with super role in metadata
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super'
    OR
    -- Allow users with is_super_admin flag
    (auth.jwt() -> 'user_metadata' ->> 'is_super_admin') = 'true'
    OR
    -- Allow users to view their own shop (existing rule)
    auth.uid() = user_id
  );

-- Add policy for super admins to update all shops
DROP POLICY IF EXISTS "Super admins can update all shops" ON shops;

CREATE POLICY "Super admins can update all shops"
  ON shops FOR UPDATE
  USING (
    auth.jwt() ->> 'email' LIKE '%@digiget.uk'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'is_super_admin') = 'true'
    OR
    auth.uid() = user_id
  );

-- Add policy for super admins to view all customers
DROP POLICY IF EXISTS "Super admins can view all customers" ON customers;

CREATE POLICY "Super admins can view all customers"
  ON customers FOR SELECT
  USING (
    auth.jwt() ->> 'email' LIKE '%@digiget.uk'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'is_super_admin') = 'true'
    OR
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = customers.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- Add policy for super admins to view all employees
DROP POLICY IF EXISTS "Super admins can view all employees" ON employees;

CREATE POLICY "Super admins can view all employees"
  ON employees FOR SELECT
  USING (
    auth.jwt() ->> 'email' LIKE '%@digiget.uk'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'is_super_admin') = 'true'
    OR
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = employees.shop_id
      AND shops.user_id = auth.uid()
    )
  );

-- Add policy for super admins to view all loyalty transactions
DROP POLICY IF EXISTS "Super admins can view all loyalty transactions" ON loyalty_transactions;

CREATE POLICY "Super admins can view all loyalty transactions"
  ON loyalty_transactions FOR SELECT
  USING (
    auth.jwt() ->> 'email' LIKE '%@digiget.uk'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'is_super_admin') = 'true'
    OR
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = loyalty_transactions.shop_id
      AND shops.user_id = auth.uid()
    )
  );

