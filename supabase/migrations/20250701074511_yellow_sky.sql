/*
  # Disable RLS for all tables

  This migration disables Row Level Security (RLS) for all tables in the database
  to allow unrestricted CRUD operations. Security will be handled at the application level.
*/

-- Disable RLS for all tables
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE rate_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE consoles DISABLE ROW LEVEL SECURITY;
ALTER TABLE rental_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE cashier_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE cashier_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_usages DISABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_part_usages DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookkeeping_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "roles_admin_full_access" ON roles;
DROP POLICY IF EXISTS "roles_manager_read" ON roles;
DROP POLICY IF EXISTS "roles_demo_access" ON roles;

DROP POLICY IF EXISTS "users_admin_full_access" ON users;
DROP POLICY IF EXISTS "users_manager_view_same_role" ON users;
DROP POLICY IF EXISTS "users_view_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_demo_access" ON users;

DROP POLICY IF EXISTS "user_sessions_admin_view_all" ON user_sessions;
DROP POLICY IF EXISTS "user_sessions_view_own" ON user_sessions;
DROP POLICY IF EXISTS "user_sessions_create_own" ON user_sessions;
DROP POLICY IF EXISTS "user_sessions_demo_access" ON user_sessions;

DROP POLICY IF EXISTS "activity_logs_admin_manager_view_all" ON activity_logs;
DROP POLICY IF EXISTS "activity_logs_view_own" ON activity_logs;
DROP POLICY IF EXISTS "activity_logs_create" ON activity_logs;
DROP POLICY IF EXISTS "activity_logs_demo_access" ON activity_logs;

DROP POLICY IF EXISTS "customers_admin_manager_full_access" ON customers;
DROP POLICY IF EXISTS "customers_cashier_create_read_update" ON customers;
DROP POLICY IF EXISTS "customers_staff_read" ON customers;
DROP POLICY IF EXISTS "customers_demo_access" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to select customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to insert customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to delete customers" ON customers;

DROP POLICY IF EXISTS "equipment_types_admin_manager_manage" ON equipment_types;
DROP POLICY IF EXISTS "equipment_types_others_read" ON equipment_types;
DROP POLICY IF EXISTS "equipment_types_demo_access" ON equipment_types;

DROP POLICY IF EXISTS "rate_profiles_admin_manager_manage" ON rate_profiles;
DROP POLICY IF EXISTS "rate_profiles_others_read" ON rate_profiles;
DROP POLICY IF EXISTS "rate_profiles_demo_access" ON rate_profiles;

DROP POLICY IF EXISTS "consoles_admin_manager_full_access" ON consoles;
DROP POLICY IF EXISTS "consoles_cashier_read_update" ON consoles;
DROP POLICY IF EXISTS "consoles_cashier_update_status" ON consoles;
DROP POLICY IF EXISTS "consoles_staff_read" ON consoles;
DROP POLICY IF EXISTS "consoles_demo_access" ON consoles;

DROP POLICY IF EXISTS "rental_sessions_admin_manager_full_access" ON rental_sessions;
DROP POLICY IF EXISTS "rental_sessions_cashier_manage" ON rental_sessions;
DROP POLICY IF EXISTS "rental_sessions_staff_read" ON rental_sessions;
DROP POLICY IF EXISTS "rental_sessions_demo_access" ON rental_sessions;

DROP POLICY IF EXISTS "scheduled_bookings_admin_manager_full_access" ON scheduled_bookings;
DROP POLICY IF EXISTS "scheduled_bookings_cashier_manage" ON scheduled_bookings;
DROP POLICY IF EXISTS "scheduled_bookings_staff_read" ON scheduled_bookings;
DROP POLICY IF EXISTS "scheduled_bookings_demo_access" ON scheduled_bookings;

DROP POLICY IF EXISTS "suppliers_admin_manager_full_access" ON suppliers;
DROP POLICY IF EXISTS "suppliers_admin_manager_manage" ON suppliers;
DROP POLICY IF EXISTS "suppliers_cashier_insert" ON suppliers;
DROP POLICY IF EXISTS "suppliers_others_read" ON suppliers;
DROP POLICY IF EXISTS "suppliers_demo_access" ON suppliers;
DROP POLICY IF EXISTS "Allow authenticated users to select suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow authenticated users to insert suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow authenticated users to update suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow authenticated users to delete suppliers" ON suppliers;

DROP POLICY IF EXISTS "products_admin_manager_manage" ON products;
DROP POLICY IF EXISTS "products_cashier_staff_read" ON products;
DROP POLICY IF EXISTS "products_demo_access" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to select products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to update products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON products;

DROP POLICY IF EXISTS "sales_admin_manager_full_access" ON sales;
DROP POLICY IF EXISTS "sales_cashier_create" ON sales;
DROP POLICY IF EXISTS "sales_cashier_view_own" ON sales;
DROP POLICY IF EXISTS "sales_staff_read" ON sales;
DROP POLICY IF EXISTS "sales_demo_access" ON sales;

DROP POLICY IF EXISTS "sale_items_admin_manager_full_access" ON sale_items;
DROP POLICY IF EXISTS "sale_items_cashier_create" ON sale_items;
DROP POLICY IF EXISTS "sale_items_staff_read" ON sale_items;
DROP POLICY IF EXISTS "sale_items_demo_access" ON sale_items;

DROP POLICY IF EXISTS "purchase_orders_admin_manager_manage" ON purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_others_read" ON purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_demo_access" ON purchase_orders;
DROP POLICY IF EXISTS "Allow authenticated users to select purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Allow authenticated users to insert purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Allow authenticated users to update purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Allow authenticated users to delete purchase_orders" ON purchase_orders;

DROP POLICY IF EXISTS "purchase_order_items_admin_manager_manage" ON purchase_order_items;
DROP POLICY IF EXISTS "purchase_order_items_others_read" ON purchase_order_items;
DROP POLICY IF EXISTS "purchase_order_items_demo_access" ON purchase_order_items;
DROP POLICY IF EXISTS "Allow authenticated users to select purchase_order_items" ON purchase_order_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert purchase_order_items" ON purchase_order_items;
DROP POLICY IF EXISTS "Allow authenticated users to update purchase_order_items" ON purchase_order_items;
DROP POLICY IF EXISTS "Allow authenticated users to delete purchase_order_items" ON purchase_order_items;

DROP POLICY IF EXISTS "cashier_sessions_admin_manager_view_all" ON cashier_sessions;
DROP POLICY IF EXISTS "cashier_sessions_cashier_manage_own" ON cashier_sessions;
DROP POLICY IF EXISTS "cashier_sessions_demo_access" ON cashier_sessions;

DROP POLICY IF EXISTS "cashier_transactions_admin_manager_view_all" ON cashier_transactions;
DROP POLICY IF EXISTS "cashier_transactions_cashier_manage_own" ON cashier_transactions;
DROP POLICY IF EXISTS "cashier_transactions_demo_access" ON cashier_transactions;

DROP POLICY IF EXISTS "vouchers_admin_manager_full_access" ON vouchers;
DROP POLICY IF EXISTS "vouchers_cashier_create_read_use" ON vouchers;
DROP POLICY IF EXISTS "vouchers_staff_read" ON vouchers;
DROP POLICY IF EXISTS "vouchers_demo_access" ON vouchers;

DROP POLICY IF EXISTS "voucher_usages_admin_manager_view_all" ON voucher_usages;
DROP POLICY IF EXISTS "voucher_usages_cashier_create_view" ON voucher_usages;
DROP POLICY IF EXISTS "voucher_usages_demo_access" ON voucher_usages;

DROP POLICY IF EXISTS "spare_parts_admin_manager_manage" ON spare_parts;
DROP POLICY IF EXISTS "spare_parts_others_read" ON spare_parts;
DROP POLICY IF EXISTS "spare_parts_demo_access" ON spare_parts;

DROP POLICY IF EXISTS "maintenance_transactions_admin_manager_manage" ON maintenance_transactions;
DROP POLICY IF EXISTS "maintenance_transactions_others_read" ON maintenance_transactions;
DROP POLICY IF EXISTS "maintenance_transactions_demo_access" ON maintenance_transactions;

DROP POLICY IF EXISTS "maintenance_part_usages_admin_manager_manage" ON maintenance_part_usages;
DROP POLICY IF EXISTS "maintenance_part_usages_others_read" ON maintenance_part_usages;
DROP POLICY IF EXISTS "maintenance_part_usages_demo_access" ON maintenance_part_usages;

DROP POLICY IF EXISTS "bookkeeping_entries_admin_manager_manage" ON bookkeeping_entries;
DROP POLICY IF EXISTS "bookkeeping_entries_others_read" ON bookkeeping_entries;
DROP POLICY IF EXISTS "bookkeeping_entries_demo_access" ON bookkeeping_entries;

DROP POLICY IF EXISTS "payments_admin_manager_view_all" ON payments;
DROP POLICY IF EXISTS "payments_cashier_create_view" ON payments;
DROP POLICY IF EXISTS "payments_staff_read" ON payments;
DROP POLICY IF EXISTS "payments_demo_access" ON payments;