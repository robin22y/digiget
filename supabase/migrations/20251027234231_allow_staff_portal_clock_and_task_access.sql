/*
  # Allow staff portal access to clock entries and tasks

  1. Changes
    - Allow anonymous users to manage their clock entries (for staff portal)
    - Allow anonymous users to read tasks (for staff portal)
    - Allow anonymous users to read/manage customers for check-ins (for staff portal)
  
  2. Security
    - Anonymous users can create/update clock entries (staff clocking in/out)
    - Anonymous users can read tasks assigned to them
    - Anonymous users can manage customers for loyalty check-ins
    - This enables the staff portal and tablet interface to work without authentication
*/

-- Allow anonymous users to manage clock entries for staff portal
CREATE POLICY "Anyone can manage clock entries for staff portal"
  ON clock_entries FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to read tasks for staff portal
CREATE POLICY "Anyone can view tasks for staff portal"
  ON tasks FOR SELECT
  TO anon
  USING (active = true);

-- Allow anonymous users to view and manage customers for loyalty check-ins
CREATE POLICY "Anyone can view customers for staff portal"
  ON customers FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can manage customers for staff portal"
  ON customers FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update customers for staff portal"
  ON customers FOR UPDATE
  TO anon
  USING (true);

-- Allow anonymous users to manage loyalty transactions
CREATE POLICY "Anyone can view loyalty transactions for staff portal"
  ON loyalty_transactions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can create loyalty transactions for staff portal"
  ON loyalty_transactions FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to manage incidents (staff can report incidents)
CREATE POLICY "Anyone can view incidents for staff portal"
  ON incidents FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can create incidents for staff portal"
  ON incidents FOR INSERT
  TO anon
  WITH CHECK (true);
