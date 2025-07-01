/*
  # Row Level Security Policies for PlayStation Rental & Cafe POS System

  This migration creates comprehensive RLS policies for all tables to ensure
  proper data access control based on user roles and authentication status.
*/

-- =============================================
-- AUTHENTICATION HELPER FUNCTIONS
-- =============================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role_id 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(required_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_permissions JSONB;
BEGIN
  SELECT permissions INTO user_permissions
  FROM roles r
  JOIN users u ON u.role_id = r.id
  WHERE u.id = auth.uid();
  
  RETURN user_permissions @> jsonb_build_array(jsonb_build_object('id', required_permission));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ROLES TABLE POLICIES
-- =============================================

-- Roles: Admin and Manager can manage, others can read
CREATE POLICY "roles_admin_full_access" ON roles
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "roles_manager_read" ON roles
  FOR SELECT USING (get_user_role() IN ('manager', 'cashier', 'staff'));

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

-- Users: Admin can manage all, Manager can view same role, users can view own
CREATE POLICY "users_admin_full_access" ON users
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "users_manager_view_same_role" ON users
  FOR SELECT USING (
    get_user_role() = 'manager' AND 
    role_id IN ('manager', 'cashier', 'staff')
  );

CREATE POLICY "users_view_own" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (id = auth.uid());

-- =============================================
-- USER SESSIONS & ACTIVITY LOGS POLICIES
-- =============================================

-- User sessions: Admin can view all, users can view own
CREATE POLICY "user_sessions_admin_view_all" ON user_sessions
  FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "user_sessions_view_own" ON user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_sessions_create_own" ON user_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Activity logs: Admin and Manager can view all, users can view own
CREATE POLICY "activity_logs_admin_manager_view_all" ON activity_logs
  FOR SELECT USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "activity_logs_view_own" ON activity_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "activity_logs_create" ON activity_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =============================================
-- CUSTOMERS TABLE POLICIES
-- =============================================

-- Customers: Admin and Manager full access, Cashier can create/read/update, Staff read only
CREATE POLICY "customers_admin_manager_full_access" ON customers
  FOR ALL USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "customers_cashier_create_read_update" ON customers
  FOR ALL USING (get_user_role() = 'cashier');

CREATE POLICY "customers_staff_read" ON customers
  FOR SELECT USING (get_user_role() = 'staff');

-- =============================================
-- EQUIPMENT & CONSOLE POLICIES
-- =============================================

-- Equipment types: Admin and Manager can manage, others read
CREATE POLICY "equipment_types_admin_manager_manage" ON equipment_types
  FOR ALL USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "equipment_types_others_read" ON equipment_types
  FOR SELECT USING (get_user_role() IN ('cashier', 'staff'));

-- Rate profiles: Admin and Manager can manage, others read
CREATE POLICY "rate_profiles_admin_manager_manage" ON rate_profiles
  FOR ALL USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "rate_profiles_others_read" ON rate_profiles
  FOR SELECT USING (get_user_role() IN ('cashier', 'staff'));

-- Consoles: Admin and Manager full access, Cashier can read/update status, Staff read
CREATE POLICY "consoles_admin_manager_full_access" ON consoles
  FOR ALL USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "consoles_cashier_read_update" ON consoles
  FOR SELECT USING (get_user_role() = 'cashier');

CREATE POLICY "consoles_cashier_update_status" ON consoles
  FOR UPDATE USING (get_user_role() = 'cashier');

CREATE POLICY "consoles_staff_read" ON consoles
  FOR SELECT USING (get_user_role() = 'staff');

-- =============================================
-- RENTAL & BOOKING POLICIES
-- =============================================

-- Rental sessions: Admin and Manager full access, Cashier can manage, Staff read
CREATE POLICY "rental_sessions_admin_manager_full_access" ON rental_sessions
  FOR ALL USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "rental_sessions_cashier_manage" ON rental_sessions
  FOR ALL USING (get_user_role() = 'cashier');

CREATE POLICY "rental_sessions_staff_read" ON rental_sessions
  FOR SELECT USING (get_user_role() = 'staff');

-- Scheduled bookings: Admin and Manager full access, Cashier can manage, Staff read
CREATE POLICY "scheduled_bookings_admin_manager_full_access" ON scheduled_bookings
  FOR ALL USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "scheduled_bookings_cashier_manage" ON scheduled_bookings
  FOR ALL USING (get_user_role() = 'cashier');

CREATE POLICY "scheduled_bookings_staff_read" ON scheduled_bookings
  FOR SELECT USING (get_user_role() = 'staff');

-- =============================================
-- PRODUCT & SUPPLIER POLICIES
-- =============================================

-- Suppliers: Admin and Manager can manage, others read
CREATE POLICY "suppliers_admin_manager_manage" ON suppliers
  FOR ALL USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "suppliers_others_read" ON suppliers
  FOR SELECT USING (get_user_role() IN ('cashier', 'staff'));

-- Products: Admin and Manager can manage, Cashier read, Staff read
CREATE POLICY "products_admin_manager_manage" ON products
  FOR ALL USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "products_cashier_staff_read" ON products
  FOR SELECT USING (get_user_role() IN ('cashier', 'staff'));

-- Purchase orders: Admin and Manager can manage, others read
CREATE POLICY "purchase_orders_admin_manager_manage" ON purchase_orders
  FOR ALL USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "purchase_orders_others_read" ON purchase_orders
  FOR SELECT USING (get_user_role() IN ('cashier', 'staff'));

-- Purchase order items: Same as purchase orders
CREATE POLICY "purchase_order_items_admin_manager_manage" ON purchase_order_items
  FOR ALL USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "purchase_order_items_others_read" ON purchase_order_items
  FOR SELECT USING (get_user_role() IN ('cashier', 'staff'));

-- =============================================
-- SALES & POS POLICIES
-- =============================================

-- Sales: Admin and Manager full access, Cashier can create and view own, Staff read
CREATE POLICY "sales_admin_manager_full_access" ON sales
  FOR ALL USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "sales_cashier_create" ON sales
  FOR INSERT WITH CHECK (get_user_role() = 'cashier' AND cashier_id = auth.uid());

CREATE POLICY "sales_cashier_view_own" ON sales
  FOR SELECT USING (get_user_role() = 'cashier' AND cashier_id = auth.uid());

CREATE POLICY "sales_staff_read" ON sales
  FOR SELECT USING (get_user_role() = 'staff');

-- Sale items: Follow sales policies
CREATE POLICY "sale_items_admin_manager_full_access" ON sale_items
  FOR ALL USING (
    get_user_role() IN ('admin', 'manager') OR
    EXISTS (
      SELECT 1 FROM sales s 
      WHERE s.id = sale_items.sale_id 
      AND s.cashier_id = auth.uid()
      AND get_user_role() = 'cashier'
    )
  );

CREATE POLICY "sale_items_cashier_create" ON sale_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales s 
      WHERE s.id = sale_items.sale_id 
      AND s.cashier_id = auth.uid()
      AND get_user_role() = 'cashier'
    )
  );

CREATE POLICY "sale_items_staff_read" ON sale_items
  FOR SELECT USING (get_user_role() IN ('staff', 'cashier'));

-- =============================================
-- CASHIER SESSION POLICIES
-- =============================================

-- Cashier sessions: Admin and Manager view all, Cashier view/manage own
CREATE POLICY "cashier_sessions_admin_manager_view_all" ON cashier_sessions
  FOR SELECT USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "cashier_sessions_cashier_manage_own" ON cashier_sessions
  FOR ALL USING (get_user_role() = 'cashier' AND cashier_id = auth.uid());

-- Cashier transactions: Admin and Manager view all, Cashier view/create own
CREATE POLICY "cashier_transactions_admin_manager_view_all" ON cashier_transactions
  FOR SELECT USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "cashier_transactions_cashier_manage_own" ON cashier_transactions
  FOR ALL USING (get_user_role() = 'cashier' AND cashier_id = auth.uid());

-- =============================================
-- VOUCHER POLICIES
-- =============================================

-- Vouchers: Admin and Manager full access, Cashier can create/read/use
CREATE POLICY "vouchers_admin_manager_full_access" ON vouchers
  FOR ALL USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "vouchers_cashier_create_read_use" ON vouchers
  FOR ALL USING (get_user_role() = 'cashier');

CREATE POLICY "vouchers_staff_read" ON vouchers
  FOR SELECT USING (get_user_role() = 'staff');

-- Voucher usages: Admin and Manager view all, Cashier can create and view
CREATE POLICY "voucher_usages_admin_manager_view_all" ON voucher_usages
  FOR SELECT USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "voucher_usages_cashier_create_view" ON voucher_usages
  FOR ALL USING (get_user_role() = 'cashier');

-- =============================================
-- MAINTENANCE POLICIES
-- =============================================

-- Spare parts: Admin and Manager can manage, others read
CREATE POLICY "spare_parts_admin_manager_manage" ON spare_parts
  FOR ALL USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "spare_parts_others_read" ON spare_parts
  FOR SELECT USING (get_user_role() IN ('cashier', 'staff'));

-- Maintenance transactions: Admin and Manager can manage, others read
CREATE POLICY "maintenance_transactions_admin_manager_manage" ON maintenance_transactions
  FOR ALL USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "maintenance_transactions_others_read" ON maintenance_transactions
  FOR SELECT USING (get_user_role() IN ('cashier', 'staff'));

-- Maintenance part usages: Follow maintenance transactions policies
CREATE POLICY "maintenance_part_usages_admin_manager_manage" ON maintenance_part_usages
  FOR ALL USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "maintenance_part_usages_others_read" ON maintenance_part_usages
  FOR SELECT USING (get_user_role() IN ('cashier', 'staff'));

-- =============================================
-- FINANCIAL POLICIES
-- =============================================

-- Bookkeeping entries: Admin and Manager can manage, others read
CREATE POLICY "bookkeeping_entries_admin_manager_manage" ON bookkeeping_entries
  FOR ALL USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "bookkeeping_entries_others_read" ON bookkeeping_entries
  FOR SELECT USING (get_user_role() IN ('cashier', 'staff'));

-- Payments: Admin and Manager view all, Cashier can create and view
CREATE POLICY "payments_admin_manager_view_all" ON payments
  FOR SELECT USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "payments_cashier_create_view" ON payments
  FOR ALL USING (get_user_role() = 'cashier');

CREATE POLICY "payments_staff_read" ON payments
  FOR SELECT USING (get_user_role() = 'staff');