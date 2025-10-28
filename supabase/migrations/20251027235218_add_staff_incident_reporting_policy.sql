/*
  # Add staff incident reporting policy

  1. Changes
    - Add RLS policy allowing employees to create and view incidents
    - Employees can only view incidents they created
    - Shop owners retain full access through existing policy
  
  2. Security
    - Employees can insert incidents for their shop
    - Employees can view their own incidents
    - Shop owners can manage all incidents (existing policy)
*/

-- Allow staff to create incidents for their shop
CREATE POLICY "Staff can create incidents"
  ON incidents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = incidents.employee_id
      AND employees.shop_id = incidents.shop_id
      AND employees.active = true
    )
  );

-- Allow staff to view their own incidents
CREATE POLICY "Staff can view own incidents"
  ON incidents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = incidents.employee_id
      AND employees.active = true
    )
  );