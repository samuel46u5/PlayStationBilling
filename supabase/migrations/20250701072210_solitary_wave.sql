/*
  # Fix Supplier Insert Policy

  1. Security Updates
    - Update RLS policy to allow cashier role to insert suppliers
    - Ensure proper permissions for supplier management
    
  2. Changes
    - Modify existing policy to include INSERT operations for cashier role
    - Add specific INSERT policy for cashier role if needed
*/

-- Drop the existing policy that might be too restrictive
DROP POLICY IF EXISTS "suppliers_admin_manager_manage" ON suppliers;

-- Create comprehensive policy for admin and manager roles
CREATE POLICY "suppliers_admin_manager_full_access"
  ON suppliers
  FOR ALL
  TO authenticated
  USING (get_user_role() = ANY (ARRAY['admin'::text, 'manager'::text]))
  WITH CHECK (get_user_role() = ANY (ARRAY['admin'::text, 'manager'::text]));

-- Create specific INSERT policy for cashier role
CREATE POLICY "suppliers_cashier_insert"
  ON suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'cashier'::text);

-- Update the existing read policy for other roles to include cashier
DROP POLICY IF EXISTS "suppliers_others_read" ON suppliers;

CREATE POLICY "suppliers_others_read"
  ON suppliers
  FOR SELECT
  TO authenticated
  USING (get_user_role() = ANY (ARRAY['cashier'::text, 'staff'::text]));