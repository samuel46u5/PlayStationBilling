-- =============================================
-- TEMPORARY FIX FOR DEMO MODE
-- Disable RLS for key tables to allow demo functionality
-- =============================================

-- Temporarily disable RLS for suppliers table
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;

-- Temporarily disable RLS for products table  
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Temporarily disable RLS for purchase_orders table
ALTER TABLE purchase_orders DISABLE ROW LEVEL SECURITY;

-- Temporarily disable RLS for purchase_order_items table
ALTER TABLE purchase_order_items DISABLE ROW LEVEL SECURITY;

-- Temporarily disable RLS for customers table
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Keep other tables with RLS but add permissive policies
-- Update users table to allow demo access
DROP POLICY IF EXISTS "users_demo_access" ON users;
CREATE POLICY "users_demo_access" ON users FOR ALL TO public USING (true) WITH CHECK (true);

-- Update roles table to allow demo access
DROP POLICY IF EXISTS "roles_demo_access" ON roles;
CREATE POLICY "roles_demo_access" ON roles FOR ALL TO public USING (true) WITH CHECK (true);

-- Update consoles table to allow demo access
DROP POLICY IF EXISTS "consoles_demo_access" ON consoles;
CREATE POLICY "consoles_demo_access" ON consoles FOR ALL TO public USING (true) WITH CHECK (true);

-- Update equipment_types table to allow demo access
DROP POLICY IF EXISTS "equipment_types_demo_access" ON equipment_types;
CREATE POLICY "equipment_types_demo_access" ON equipment_types FOR ALL TO public USING (true) WITH CHECK (true);

-- Update rate_profiles table to allow demo access
DROP POLICY IF EXISTS "rate_profiles_demo_access" ON rate_profiles;
CREATE POLICY "rate_profiles_demo_access" ON rate_profiles FOR ALL TO public USING (true) WITH CHECK (true);

-- Update rental_sessions table to allow demo access
DROP POLICY IF EXISTS "rental_sessions_demo_access" ON rental_sessions;
CREATE POLICY "rental_sessions_demo_access" ON rental_sessions FOR ALL TO public USING (true) WITH CHECK (true);

-- Update scheduled_bookings table to allow demo access
DROP POLICY IF EXISTS "scheduled_bookings_demo_access" ON scheduled_bookings;
CREATE POLICY "scheduled_bookings_demo_access" ON scheduled_bookings FOR ALL TO public USING (true) WITH CHECK (true);

-- Update sales table to allow demo access
DROP POLICY IF EXISTS "sales_demo_access" ON sales;
CREATE POLICY "sales_demo_access" ON sales FOR ALL TO public USING (true) WITH CHECK (true);

-- Update sale_items table to allow demo access
DROP POLICY IF EXISTS "sale_items_demo_access" ON sale_items;
CREATE POLICY "sale_items_demo_access" ON sale_items FOR ALL TO public USING (true) WITH CHECK (true);

-- Update vouchers table to allow demo access
DROP POLICY IF EXISTS "vouchers_demo_access" ON vouchers;
CREATE POLICY "vouchers_demo_access" ON vouchers FOR ALL TO public USING (true) WITH CHECK (true);

-- Update voucher_usages table to allow demo access
DROP POLICY IF EXISTS "voucher_usages_demo_access" ON voucher_usages;
CREATE POLICY "voucher_usages_demo_access" ON voucher_usages FOR ALL TO public USING (true) WITH CHECK (true);

-- Update cashier_sessions table to allow demo access
DROP POLICY IF EXISTS "cashier_sessions_demo_access" ON cashier_sessions;
CREATE POLICY "cashier_sessions_demo_access" ON cashier_sessions FOR ALL TO public USING (true) WITH CHECK (true);

-- Update cashier_transactions table to allow demo access
DROP POLICY IF EXISTS "cashier_transactions_demo_access" ON cashier_transactions;
CREATE POLICY "cashier_transactions_demo_access" ON cashier_transactions FOR ALL TO public USING (true) WITH CHECK (true);

-- Update spare_parts table to allow demo access
DROP POLICY IF EXISTS "spare_parts_demo_access" ON spare_parts;
CREATE POLICY "spare_parts_demo_access" ON spare_parts FOR ALL TO public USING (true) WITH CHECK (true);

-- Update maintenance_transactions table to allow demo access
DROP POLICY IF EXISTS "maintenance_transactions_demo_access" ON maintenance_transactions;
CREATE POLICY "maintenance_transactions_demo_access" ON maintenance_transactions FOR ALL TO public USING (true) WITH CHECK (true);

-- Update maintenance_part_usages table to allow demo access
DROP POLICY IF EXISTS "maintenance_part_usages_demo_access" ON maintenance_part_usages;
CREATE POLICY "maintenance_part_usages_demo_access" ON maintenance_part_usages FOR ALL TO public USING (true) WITH CHECK (true);

-- Update bookkeeping_entries table to allow demo access
DROP POLICY IF EXISTS "bookkeeping_entries_demo_access" ON bookkeeping_entries;
CREATE POLICY "bookkeeping_entries_demo_access" ON bookkeeping_entries FOR ALL TO public USING (true) WITH CHECK (true);

-- Update payments table to allow demo access
DROP POLICY IF EXISTS "payments_demo_access" ON payments;
CREATE POLICY "payments_demo_access" ON payments FOR ALL TO public USING (true) WITH CHECK (true);

-- Update activity_logs table to allow demo access
DROP POLICY IF EXISTS "activity_logs_demo_access" ON activity_logs;
CREATE POLICY "activity_logs_demo_access" ON activity_logs FOR ALL TO public USING (true) WITH CHECK (true);

-- Update user_sessions table to allow demo access
DROP POLICY IF EXISTS "user_sessions_demo_access" ON user_sessions;
CREATE POLICY "user_sessions_demo_access" ON user_sessions FOR ALL TO public USING (true) WITH CHECK (true);