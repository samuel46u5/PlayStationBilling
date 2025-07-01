/*
  # Setup Initial Users and Sample Data

  1. New Tables Setup
    - Insert roles with proper permissions
    - Create user profiles for demo accounts
    - Setup equipment types and rate profiles
    - Create sample consoles, products, customers
    - Enable RLS and create policies

  2. Security
    - Enable RLS on users table
    - Add policies for user access control
    - Create helper functions for user management

  3. Sample Data
    - Demo user accounts (admin, manager, cashiers, staff)
    - Gaming equipment and rate profiles
    - Sample products and customers
    - Suppliers and basic inventory
*/

-- First, ensure we have the roles table properly set up
INSERT INTO roles (id, name, description, permissions, is_system) VALUES
  ('admin', 'Administrator', 'Full system access with all permissions', 
   '["users.read", "users.write", "users.delete", "consoles.read", "consoles.write", "consoles.delete", "customers.read", "customers.write", "customers.delete", "products.read", "products.write", "products.delete", "sales.read", "sales.write", "rentals.read", "rentals.write", "vouchers.read", "vouchers.write", "bookkeeping.read", "bookkeeping.write", "maintenance.read", "maintenance.write", "settings.read", "settings.write"]'::jsonb, 
   true),
  ('manager', 'Manager', 'Management level access with most permissions', 
   '["users.read", "users.write", "consoles.read", "consoles.write", "customers.read", "customers.write", "products.read", "products.write", "sales.read", "sales.write", "rentals.read", "rentals.write", "vouchers.read", "vouchers.write", "bookkeeping.read", "bookkeeping.write", "maintenance.read", "maintenance.write"]'::jsonb, 
   true),
  ('cashier', 'Cashier', 'Point of sale and rental operations', 
   '["customers.read", "customers.write", "consoles.read", "products.read", "sales.read", "sales.write", "rentals.read", "rentals.write", "vouchers.read", "vouchers.write"]'::jsonb, 
   true),
  ('staff', 'Staff', 'Basic operational access', 
   '["customers.read", "consoles.read", "products.read", "sales.read", "rentals.read"]'::jsonb, 
   true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  is_system = EXCLUDED.is_system,
  updated_at = now();

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table with proper JSONB handling
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid() 
      AND r.name = 'Administrator'
      AND r.permissions ? 'users.read'
    )
  );

CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid() 
      AND r.name = 'Administrator'
      AND r.permissions ? 'users.write'
    )
  );

CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid() 
      AND r.name = 'Administrator'
      AND r.permissions ? 'users.write'
    )
  );

-- Create a function to handle user creation
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id uuid,
  user_email text,
  user_username text,
  user_full_name text,
  user_role_id text DEFAULT 'staff',
  user_phone text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO users (
    id,
    username,
    full_name,
    email,
    phone,
    role_id,
    status,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    user_username,
    user_full_name,
    user_email,
    user_phone,
    user_role_id,
    'active',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role_id = EXCLUDED.role_id,
    updated_at = now();
END;
$$;

-- Insert demo user profiles (these will be linked to auth.users when those are created)
-- Note: These UUIDs should match the ones created in Supabase Auth
DO $$
DECLARE
  admin_id uuid := '00000000-0000-0000-0000-000000000001';
  manager_id uuid := '00000000-0000-0000-0000-000000000002';
  cashier1_id uuid := '00000000-0000-0000-0000-000000000003';
  cashier2_id uuid := '00000000-0000-0000-0000-000000000004';
  staff_id uuid := '00000000-0000-0000-0000-000000000005';
BEGIN
  -- Insert user profiles
  INSERT INTO users (id, username, full_name, email, phone, role_id, status, created_at, updated_at) VALUES
    (admin_id, 'admin', 'System Administrator', 'admin@example.com', '+1234567890', 'admin', 'active', now(), now()),
    (manager_id, 'manager1', 'Store Manager', 'manager1@example.com', '+1234567891', 'manager', 'active', now(), now()),
    (cashier1_id, 'kasir1', 'Cashier One', 'kasir1@example.com', '+1234567892', 'cashier', 'active', now(), now()),
    (cashier2_id, 'kasir2', 'Cashier Two', 'kasir2@example.com', '+1234567893', 'cashier', 'active', now(), now()),
    (staff_id, 'staff1', 'Staff Member', 'staff1@example.com', '+1234567894', 'staff', 'active', now(), now())
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role_id = EXCLUDED.role_id,
    updated_at = now();
END $$;

-- Create a function to generate voucher codes
CREATE OR REPLACE FUNCTION generate_voucher_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  exists_check boolean;
BEGIN
  LOOP
    -- Generate a random 8-character code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM vouchers WHERE voucher_code = code) INTO exists_check;
    
    -- If code doesn't exist, return it
    IF NOT exists_check THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Create some sample equipment types
INSERT INTO equipment_types (id, name, description, icon, category, is_active) VALUES
  ('ps4', 'PlayStation 4', 'Sony PlayStation 4 gaming console', 'gamepad-2', 'gaming', true),
  ('ps5', 'PlayStation 5', 'Sony PlayStation 5 gaming console', 'gamepad-2', 'gaming', true),
  ('xbox-one', 'Xbox One', 'Microsoft Xbox One gaming console', 'gamepad-2', 'gaming', true),
  ('xbox-series', 'Xbox Series X/S', 'Microsoft Xbox Series X/S gaming console', 'gamepad-2', 'gaming', true),
  ('billiard-8', '8-Ball Pool Table', 'Standard 8-ball pool table', 'circle', 'billiard', true),
  ('billiard-9', '9-Ball Pool Table', 'Professional 9-ball pool table', 'circle', 'billiard', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Create sample rate profiles
INSERT INTO rate_profiles (id, name, description, hourly_rate, daily_rate, weekly_rate, monthly_rate, peak_hour_rate, peak_hour_start, peak_hour_end, weekend_multiplier, applicable_equipment_types, is_active) VALUES
  ('standard-gaming', 'Standard Gaming Rate', 'Standard hourly rates for gaming consoles', 15000, 100000, 600000, 2000000, 20000, '18:00', '22:00', 1.2, ARRAY['ps4', 'ps5', 'xbox-one', 'xbox-series'], true),
  ('premium-gaming', 'Premium Gaming Rate', 'Premium rates for latest generation consoles', 20000, 120000, 700000, 2500000, 25000, '18:00', '22:00', 1.3, ARRAY['ps5', 'xbox-series'], true),
  ('billiard-standard', 'Standard Billiard Rate', 'Standard rates for billiard tables', 25000, 150000, 800000, 3000000, 30000, '19:00', '23:00', 1.1, ARRAY['billiard-8', 'billiard-9'], true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  hourly_rate = EXCLUDED.hourly_rate,
  daily_rate = EXCLUDED.daily_rate,
  weekly_rate = EXCLUDED.weekly_rate,
  monthly_rate = EXCLUDED.monthly_rate,
  peak_hour_rate = EXCLUDED.peak_hour_rate,
  peak_hour_start = EXCLUDED.peak_hour_start,
  peak_hour_end = EXCLUDED.peak_hour_end,
  weekend_multiplier = EXCLUDED.weekend_multiplier,
  applicable_equipment_types = EXCLUDED.applicable_equipment_types,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Create sample consoles
INSERT INTO consoles (id, name, equipment_type_id, rate_profile_id, status, location, serial_number, purchase_date, warranty_expiry, ip_address, relay_command, notes, is_active) VALUES
  ('PS4-001', 'PlayStation 4 #1', 'ps4', 'standard-gaming', 'available', 'Station A1', 'PS4001234567', '2023-01-15', '2025-01-15', '192.168.1.101', 'relay_1_on', 'Main gaming station', true),
  ('PS4-002', 'PlayStation 4 #2', 'ps4', 'standard-gaming', 'available', 'Station A2', 'PS4001234568', '2023-01-15', '2025-01-15', '192.168.1.102', 'relay_2_on', 'Secondary gaming station', true),
  ('PS5-001', 'PlayStation 5 #1', 'ps5', 'premium-gaming', 'available', 'Station B1', 'PS5001234567', '2023-06-01', '2025-06-01', '192.168.1.201', 'relay_3_on', 'Premium gaming station', true),
  ('PS5-002', 'PlayStation 5 #2', 'ps5', 'premium-gaming', 'available', 'Station B2', 'PS5001234568', '2023-06-01', '2025-06-01', '192.168.1.202', 'relay_4_on', 'Premium gaming station', true),
  ('XBOX-001', 'Xbox Series X #1', 'xbox-series', 'premium-gaming', 'available', 'Station C1', 'XBX001234567', '2023-03-10', '2025-03-10', '192.168.1.301', 'relay_5_on', 'Xbox gaming station', true),
  ('POOL-001', 'Pool Table #1', 'billiard-8', 'billiard-standard', 'available', 'Billiard Area 1', 'POOL001', '2022-12-01', '2027-12-01', NULL, NULL, '8-ball pool table', true),
  ('POOL-002', 'Pool Table #2', 'billiard-9', 'billiard-standard', 'available', 'Billiard Area 2', 'POOL002', '2022-12-01', '2027-12-01', NULL, NULL, '9-ball pool table', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  equipment_type_id = EXCLUDED.equipment_type_id,
  rate_profile_id = EXCLUDED.rate_profile_id,
  status = EXCLUDED.status,
  location = EXCLUDED.location,
  serial_number = EXCLUDED.serial_number,
  purchase_date = EXCLUDED.purchase_date,
  warranty_expiry = EXCLUDED.warranty_expiry,
  ip_address = EXCLUDED.ip_address,
  relay_command = EXCLUDED.relay_command,
  notes = EXCLUDED.notes,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Create sample suppliers
INSERT INTO suppliers (id, name, contact_person, phone, email, address, category, is_active) VALUES
  (gen_random_uuid(), 'Coca-Cola Distributor', 'John Smith', '+1234567800', 'john@cocacola-dist.com', '123 Beverage St, City', 'beverage', true),
  (gen_random_uuid(), 'Snack Wholesale', 'Jane Doe', '+1234567801', 'jane@snackwholesale.com', '456 Snack Ave, City', 'snack', true),
  (gen_random_uuid(), 'Food Supplier Co', 'Bob Johnson', '+1234567802', 'bob@foodsupplier.com', '789 Food Blvd, City', 'food', true)
ON CONFLICT DO NOTHING;

-- Create sample products
DO $$
DECLARE
  supplier1_id uuid;
  supplier2_id uuid;
  supplier3_id uuid;
BEGIN
  -- Get supplier IDs
  SELECT id INTO supplier1_id FROM suppliers WHERE name = 'Coca-Cola Distributor' LIMIT 1;
  SELECT id INTO supplier2_id FROM suppliers WHERE name = 'Snack Wholesale' LIMIT 1;
  SELECT id INTO supplier3_id FROM suppliers WHERE name = 'Food Supplier Co' LIMIT 1;

  -- Insert products
  INSERT INTO products (id, name, category, price, cost, stock, min_stock, barcode, description, supplier_id, is_active) VALUES
    (gen_random_uuid(), 'Coca-Cola 330ml', 'beverage', 5000, 3000, 50, 10, '1234567890001', 'Coca-Cola can 330ml', supplier1_id, true),
    (gen_random_uuid(), 'Pepsi 330ml', 'beverage', 5000, 3000, 45, 10, '1234567890002', 'Pepsi can 330ml', supplier1_id, true),
    (gen_random_uuid(), 'Sprite 330ml', 'beverage', 5000, 3000, 40, 10, '1234567890003', 'Sprite can 330ml', supplier1_id, true),
    (gen_random_uuid(), 'Mineral Water 600ml', 'beverage', 3000, 2000, 60, 15, '1234567890004', 'Mineral water bottle 600ml', supplier1_id, true),
    (gen_random_uuid(), 'Potato Chips', 'snack', 8000, 5000, 30, 5, '1234567890005', 'Crispy potato chips', supplier2_id, true),
    (gen_random_uuid(), 'Chocolate Bar', 'snack', 12000, 8000, 25, 5, '1234567890006', 'Milk chocolate bar', supplier2_id, true),
    (gen_random_uuid(), 'Instant Noodles', 'food', 6000, 4000, 35, 10, '1234567890007', 'Instant cup noodles', supplier3_id, true),
    (gen_random_uuid(), 'Sandwich', 'food', 15000, 10000, 10, 3, '1234567890008', 'Fresh sandwich', supplier3_id, true)
  ON CONFLICT DO NOTHING;
END $$;

-- Create sample customers
INSERT INTO customers (id, name, phone, email, address, total_spent, join_date, status, notes) VALUES
  (gen_random_uuid(), 'Ahmad Rizki', '+628123456789', 'ahmad.rizki@email.com', 'Jl. Merdeka No. 123, Jakarta', 150000, '2024-01-15', 'active', 'Regular customer, prefers PS5'),
  (gen_random_uuid(), 'Siti Nurhaliza', '+628234567890', 'siti.nur@email.com', 'Jl. Sudirman No. 456, Jakarta', 89000, '2024-02-20', 'active', 'Likes billiard games'),
  (gen_random_uuid(), 'Budi Santoso', '+628345678901', 'budi.santoso@email.com', 'Jl. Thamrin No. 789, Jakarta', 245000, '2023-12-10', 'active', 'VIP customer, frequent visitor'),
  (gen_random_uuid(), 'Maya Sari', '+628456789012', 'maya.sari@email.com', 'Jl. Gatot Subroto No. 321, Jakarta', 67000, '2024-03-05', 'active', 'Student discount applied'),
  (gen_random_uuid(), 'Andi Wijaya', '+628567890123', 'andi.wijaya@email.com', 'Jl. Kuningan No. 654, Jakarta', 123000, '2024-01-28', 'active', 'Group bookings')
ON CONFLICT DO NOTHING;