/*
  # Insert Initial Data for PlayStation Rental & Cafe POS System

  This migration inserts essential initial data including:
  1. Default roles and permissions
  2. Equipment types
  3. Rate profiles
  4. Sample consoles
  5. Sample products
  6. Sample customers
  7. Default system settings
*/

-- =============================================
-- 1. INSERT DEFAULT ROLES
-- =============================================

INSERT INTO roles (id, name, description, permissions, is_system) VALUES
('admin', 'Administrator', 'Full system access with all permissions', 
 '[
   {"id": "users.create", "module": "users", "action": "create", "resource": "*", "description": "Create users"},
   {"id": "users.read", "module": "users", "action": "read", "resource": "*", "description": "View users"},
   {"id": "users.update", "module": "users", "action": "update", "resource": "*", "description": "Update users"},
   {"id": "users.delete", "module": "users", "action": "delete", "resource": "*", "description": "Delete users"},
   {"id": "customers.manage", "module": "customers", "action": "*", "resource": "*", "description": "Manage customers"},
   {"id": "consoles.manage", "module": "consoles", "action": "*", "resource": "*", "description": "Manage consoles"},
   {"id": "rentals.manage", "module": "rentals", "action": "*", "resource": "*", "description": "Manage rentals"},
   {"id": "sales.manage", "module": "sales", "action": "*", "resource": "*", "description": "Manage sales"},
   {"id": "products.manage", "module": "products", "action": "*", "resource": "*", "description": "Manage products"},
   {"id": "vouchers.manage", "module": "vouchers", "action": "*", "resource": "*", "description": "Manage vouchers"},
   {"id": "maintenance.manage", "module": "maintenance", "action": "*", "resource": "*", "description": "Manage maintenance"},
   {"id": "reports.view", "module": "reports", "action": "read", "resource": "*", "description": "View all reports"},
   {"id": "settings.manage", "module": "settings", "action": "*", "resource": "*", "description": "Manage settings"}
 ]'::jsonb, true),

('manager', 'Manager', 'Management level access with reporting capabilities',
 '[
   {"id": "customers.manage", "module": "customers", "action": "*", "resource": "*", "description": "Manage customers"},
   {"id": "consoles.manage", "module": "consoles", "action": "*", "resource": "*", "description": "Manage consoles"},
   {"id": "rentals.manage", "module": "rentals", "action": "*", "resource": "*", "description": "Manage rentals"},
   {"id": "sales.manage", "module": "sales", "action": "*", "resource": "*", "description": "Manage sales"},
   {"id": "products.manage", "module": "products", "action": "*", "resource": "*", "description": "Manage products"},
   {"id": "vouchers.manage", "module": "vouchers", "action": "*", "resource": "*", "description": "Manage vouchers"},
   {"id": "maintenance.view", "module": "maintenance", "action": "read", "resource": "*", "description": "View maintenance"},
   {"id": "reports.view", "module": "reports", "action": "read", "resource": "*", "description": "View reports"},
   {"id": "users.view", "module": "users", "action": "read", "resource": "own_role", "description": "View users in same role"}
 ]'::jsonb, true),

('cashier', 'Cashier', 'Point of sale and basic rental operations',
 '[
   {"id": "customers.create", "module": "customers", "action": "create", "resource": "*", "description": "Create customers"},
   {"id": "customers.read", "module": "customers", "action": "read", "resource": "*", "description": "View customers"},
   {"id": "customers.update", "module": "customers", "action": "update", "resource": "*", "description": "Update customers"},
   {"id": "rentals.create", "module": "rentals", "action": "create", "resource": "*", "description": "Create rentals"},
   {"id": "rentals.read", "module": "rentals", "action": "read", "resource": "*", "description": "View rentals"},
   {"id": "rentals.update", "module": "rentals", "action": "update", "resource": "*", "description": "Update rentals"},
   {"id": "sales.create", "module": "sales", "action": "create", "resource": "*", "description": "Create sales"},
   {"id": "sales.read", "module": "sales", "action": "read", "resource": "own", "description": "View own sales"},
   {"id": "products.read", "module": "products", "action": "read", "resource": "*", "description": "View products"},
   {"id": "vouchers.create", "module": "vouchers", "action": "create", "resource": "*", "description": "Create vouchers"},
   {"id": "vouchers.read", "module": "vouchers", "action": "read", "resource": "*", "description": "View vouchers"},
   {"id": "vouchers.use", "module": "vouchers", "action": "use", "resource": "*", "description": "Use vouchers"}
 ]'::jsonb, true),

('staff', 'Staff', 'Basic operational access',
 '[
   {"id": "customers.read", "module": "customers", "action": "read", "resource": "*", "description": "View customers"},
   {"id": "rentals.read", "module": "rentals", "action": "read", "resource": "*", "description": "View rentals"},
   {"id": "products.read", "module": "products", "action": "read", "resource": "*", "description": "View products"},
   {"id": "consoles.read", "module": "consoles", "action": "read", "resource": "*", "description": "View consoles"}
 ]'::jsonb, true);

-- =============================================
-- 2. INSERT EQUIPMENT TYPES
-- =============================================

INSERT INTO equipment_types (id, name, description, icon, category) VALUES
('ET001', 'PlayStation 4', 'Sony PlayStation 4 gaming console', 'gamepad-2', 'gaming'),
('ET002', 'PlayStation 5', 'Sony PlayStation 5 gaming console', 'gamepad-2', 'gaming'),
('ET003', 'Billiard Table', 'Professional billiard/pool table', 'circle', 'billiard'),
('ET004', 'Nintendo Switch', 'Nintendo Switch gaming console', 'gamepad-2', 'gaming'),
('ET005', 'Xbox Series X', 'Microsoft Xbox Series X gaming console', 'gamepad-2', 'gaming');

-- =============================================
-- 3. INSERT RATE PROFILES
-- =============================================

INSERT INTO rate_profiles (id, name, description, hourly_rate, daily_rate, weekly_rate, monthly_rate, peak_hour_rate, peak_hour_start, peak_hour_end, weekend_multiplier, applicable_equipment_types) VALUES
('RP001', 'PlayStation Standard', 'Standard rate for PlayStation consoles', 15000, 120000, 700000, 2500000, 18000, '18:00', '22:00', 1.2, ARRAY['ET001', 'ET002']),
('RP002', 'PlayStation Premium', 'Premium rate for latest PlayStation consoles', 20000, 150000, 900000, 3200000, 25000, '18:00', '22:00', 1.3, ARRAY['ET002']),
('RP003', 'Billiard Standard', 'Standard rate for billiard tables', 25000, 180000, 1000000, 3500000, 30000, '19:00', '23:00', 1.1, ARRAY['ET003']),
('RP004', 'Nintendo Rate', 'Rate for Nintendo Switch', 12000, 90000, 550000, 2000000, 15000, '18:00', '22:00', 1.2, ARRAY['ET004']),
('RP005', 'Xbox Rate', 'Rate for Xbox consoles', 18000, 130000, 750000, 2700000, 22000, '18:00', '22:00', 1.2, ARRAY['ET005']);

-- =============================================
-- 4. INSERT SAMPLE CONSOLES
-- =============================================

INSERT INTO consoles (id, name, equipment_type_id, rate_profile_id, status, location, serial_number, purchase_date, warranty_expiry, ip_address) VALUES
('PS5-001', 'PlayStation 5 - Station 1', 'ET002', 'RP002', 'available', 'Lantai 1 - Area A', 'CFI-1015A01-001', '2024-01-15', '2026-01-15', '192.168.1.101'),
('PS5-002', 'PlayStation 5 - Station 2', 'ET002', 'RP002', 'available', 'Lantai 1 - Area A', 'CFI-1015A01-002', '2024-01-15', '2026-01-15', '192.168.1.102'),
('PS5-003', 'PlayStation 5 - Station 3', 'ET002', 'RP002', 'rented', 'Lantai 1 - Area B', 'CFI-1015A01-003', '2024-01-20', '2026-01-20', '192.168.1.103'),
('PS4-001', 'PlayStation 4 - Station 4', 'ET001', 'RP001', 'available', 'Lantai 1 - Area B', 'CUH-2216A-001', '2023-06-10', '2025-06-10', '192.168.1.104'),
('PS4-002', 'PlayStation 4 - Station 5', 'ET001', 'RP001', 'available', 'Lantai 1 - Area C', 'CUH-2216A-002', '2023-06-10', '2025-06-10', '192.168.1.105'),
('BIL-001', 'Billiard Table 1', 'ET003', 'RP003', 'available', 'Lantai 2 - Area A', 'BT-2024-001', '2024-02-01', '2027-02-01', NULL),
('BIL-002', 'Billiard Table 2', 'ET003', 'RP003', 'maintenance', 'Lantai 2 - Area B', 'BT-2024-002', '2024-02-01', '2027-02-01', NULL);

-- =============================================
-- 5. INSERT SAMPLE SUPPLIERS
-- =============================================

INSERT INTO suppliers (name, contact_person, phone, email, address, category) VALUES
('PT Minuman Segar', 'Budi Santoso', '+62812345678', 'budi@minumansegar.com', 'Jl. Industri No. 123, Jakarta', 'beverage'),
('CV Snack Enak', 'Siti Rahayu', '+62823456789', 'siti@snackenak.com', 'Jl. Perdagangan No. 456, Bandung', 'snack'),
('Toko Makanan Berkah', 'Ahmad Wijaya', '+62834567890', 'ahmad@berkah.com', 'Jl. Pasar No. 789, Surabaya', 'food'),
('Distributor Kopi Nusantara', 'Dewi Lestari', '+62845678901', 'dewi@kopinusantara.com', 'Jl. Kopi No. 321, Medan', 'beverage');

-- =============================================
-- 6. INSERT SAMPLE PRODUCTS
-- =============================================

INSERT INTO products (name, category, price, cost, stock, min_stock, barcode, description, supplier_id) VALUES
-- Beverages
('Coca Cola 330ml', 'beverage', 8000, 5500, 50, 10, '8999999001', 'Coca Cola kaleng 330ml', (SELECT id FROM suppliers WHERE name = 'PT Minuman Segar' LIMIT 1)),
('Pepsi 330ml', 'beverage', 8000, 5500, 45, 10, '8999999002', 'Pepsi kaleng 330ml', (SELECT id FROM suppliers WHERE name = 'PT Minuman Segar' LIMIT 1)),
('Sprite 330ml', 'beverage', 8000, 5500, 40, 10, '8999999003', 'Sprite kaleng 330ml', (SELECT id FROM suppliers WHERE name = 'PT Minuman Segar' LIMIT 1)),
('Air Mineral 600ml', 'beverage', 5000, 3000, 100, 20, '8999999004', 'Air mineral botol 600ml', (SELECT id FROM suppliers WHERE name = 'PT Minuman Segar' LIMIT 1)),
('Kopi Hitam', 'beverage', 12000, 7000, 30, 5, '8999999005', 'Kopi hitam panas', (SELECT id FROM suppliers WHERE name = 'Distributor Kopi Nusantara' LIMIT 1)),
('Kopi Susu', 'beverage', 15000, 9000, 25, 5, '8999999006', 'Kopi susu panas/dingin', (SELECT id FROM suppliers WHERE name = 'Distributor Kopi Nusantara' LIMIT 1)),
('Teh Manis', 'beverage', 8000, 4000, 35, 5, '8999999007', 'Teh manis panas/dingin', (SELECT id FROM suppliers WHERE name = 'Distributor Kopi Nusantara' LIMIT 1)),

-- Snacks
('Chitato 68g', 'snack', 12000, 8500, 30, 5, '8999999101', 'Chitato rasa original 68g', (SELECT id FROM suppliers WHERE name = 'CV Snack Enak' LIMIT 1)),
('Doritos 160g', 'snack', 18000, 13000, 25, 5, '8999999102', 'Doritos Nacho Cheese 160g', (SELECT id FROM suppliers WHERE name = 'CV Snack Enak' LIMIT 1)),
('Pringles 107g', 'snack', 25000, 18000, 20, 3, '8999999103', 'Pringles Original 107g', (SELECT id FROM suppliers WHERE name = 'CV Snack Enak' LIMIT 1)),
('Oreo 137g', 'snack', 15000, 11000, 35, 5, '8999999104', 'Oreo Original 137g', (SELECT id FROM suppliers WHERE name = 'CV Snack Enak' LIMIT 1)),
('Biskuit Marie', 'snack', 8000, 5500, 40, 8, '8999999105', 'Biskuit Marie 120g', (SELECT id FROM suppliers WHERE name = 'CV Snack Enak' LIMIT 1)),

-- Food
('Mie Instan Goreng', 'food', 15000, 8000, 50, 10, '8999999201', 'Mie instan goreng siap saji', (SELECT id FROM suppliers WHERE name = 'Toko Makanan Berkah' LIMIT 1)),
('Mie Instan Kuah', 'food', 15000, 8000, 45, 10, '8999999202', 'Mie instan kuah siap saji', (SELECT id FROM suppliers WHERE name = 'Toko Makanan Berkah' LIMIT 1)),
('Nasi Goreng', 'food', 25000, 15000, 20, 3, '8999999203', 'Nasi goreng spesial', (SELECT id FROM suppliers WHERE name = 'Toko Makanan Berkah' LIMIT 1)),
('Ayam Geprek', 'food', 30000, 18000, 15, 3, '8999999204', 'Ayam geprek dengan nasi', (SELECT id FROM suppliers WHERE name = 'Toko Makanan Berkah' LIMIT 1)),
('Sandwich', 'food', 20000, 12000, 25, 5, '8999999205', 'Sandwich isi ayam/tuna', (SELECT id FROM suppliers WHERE name = 'Toko Makanan Berkah' LIMIT 1));

-- =============================================
-- 7. INSERT SAMPLE CUSTOMERS
-- =============================================

INSERT INTO customers (name, phone, email, address, total_spent, join_date, status) VALUES
('Ahmad Pratama', '+6281234567890', 'ahmad.pratama@email.com', 'Jl. Merdeka No. 123, Jakarta', 450000, '2024-01-15', 'active'),
('Siti Nurhaliza', '+6282345678901', 'siti.nurhaliza@email.com', 'Jl. Sudirman No. 456, Bandung', 320000, '2024-02-20', 'active'),
('Budi Setiawan', '+6283456789012', 'budi.setiawan@email.com', 'Jl. Thamrin No. 789, Surabaya', 180000, '2024-03-10', 'active'),
('Dewi Sartika', '+6284567890123', 'dewi.sartika@email.com', 'Jl. Diponegoro No. 321, Medan', 275000, '2024-01-25', 'active'),
('Rizki Ramadhan', '+6285678901234', 'rizki.ramadhan@email.com', 'Jl. Gatot Subroto No. 654, Makassar', 520000, '2024-02-05', 'active'),
('Maya Sari', '+6286789012345', 'maya.sari@email.com', 'Jl. Ahmad Yani No. 987, Yogyakarta', 95000, '2024-03-15', 'active'),
('Andi Wijaya', '+6287890123456', 'andi.wijaya@email.com', 'Jl. Veteran No. 147, Semarang', 380000, '2024-01-30', 'active'),
('Rina Kusuma', '+6288901234567', 'rina.kusuma@email.com', 'Jl. Pahlawan No. 258, Palembang', 210000, '2024-02-12', 'active');

-- =============================================
-- 8. INSERT SAMPLE SPARE PARTS
-- =============================================

INSERT INTO spare_parts (name, part_number, category, compatible_consoles, description, brand, condition, price, stock, min_stock, location) VALUES
('DualSense Controller', 'CFI-ZCT1W', 'controller', ARRAY['ET002'], 'PlayStation 5 DualSense Wireless Controller - White', 'Sony', 'new', 850000, 5, 2, 'Storage Room A'),
('DualShock 4 Controller', 'CUH-ZCT2U', 'controller', ARRAY['ET001'], 'PlayStation 4 DualShock 4 Wireless Controller', 'Sony', 'new', 650000, 8, 3, 'Storage Room A'),
('HDMI Cable 2.1', 'HDMI-2.1-3M', 'cable', ARRAY['ET002'], 'High Speed HDMI Cable 2.1 - 3 meter', 'Generic', 'new', 150000, 10, 3, 'Storage Room B'),
('HDMI Cable 2.0', 'HDMI-2.0-3M', 'cable', ARRAY['ET001'], 'High Speed HDMI Cable 2.0 - 3 meter', 'Generic', 'new', 100000, 12, 4, 'Storage Room B'),
('Power Cable PS5', 'PS5-PWR-CABLE', 'power', ARRAY['ET002'], 'PlayStation 5 Power Cable', 'Sony', 'new', 200000, 6, 2, 'Storage Room B'),
('Power Cable PS4', 'PS4-PWR-CABLE', 'power', ARRAY['ET001'], 'PlayStation 4 Power Cable', 'Sony', 'new', 150000, 8, 3, 'Storage Room B'),
('Cooling Fan PS5', 'PS5-COOLING-FAN', 'cooling', ARRAY['ET002'], 'PlayStation 5 Internal Cooling Fan', 'Sony', 'new', 450000, 3, 1, 'Storage Room C'),
('SSD 1TB NVMe', 'SSD-1TB-NVME', 'storage', ARRAY['ET002'], '1TB NVMe SSD for PlayStation 5 expansion', 'Samsung', 'new', 2500000, 2, 1, 'Storage Room C'),
('Thermal Paste', 'THERMAL-PASTE-5G', 'cooling', ARRAY['ET001', 'ET002'], 'High performance thermal paste 5g', 'Arctic', 'new', 75000, 15, 5, 'Storage Room C');

-- =============================================
-- 9. INSERT SAMPLE BOOKKEEPING ENTRIES
-- =============================================

INSERT INTO bookkeeping_entries (entry_date, type, category, description, amount, reference) VALUES
(CURRENT_DATE, 'income', 'rental', 'PlayStation rental revenue', 850000, 'RENTAL-DAILY'),
(CURRENT_DATE, 'income', 'cafe', 'Cafe sales revenue', 320000, 'CAFE-DAILY'),
(CURRENT_DATE, 'income', 'voucher', 'Voucher sales', 150000, 'VOUCHER-DAILY'),
(CURRENT_DATE - INTERVAL '1 day', 'expense', 'inventory', 'Product restocking', 500000, 'PO-2024-001'),
(CURRENT_DATE - INTERVAL '1 day', 'expense', 'operational', 'Electricity bill', 750000, 'BILL-ELECTRIC'),
(CURRENT_DATE - INTERVAL '2 days', 'expense', 'maintenance', 'Console repair parts', 450000, 'MNT-2024-001'),
(CURRENT_DATE - INTERVAL '3 days', 'income', 'rental', 'PlayStation rental revenue', 920000, 'RENTAL-DAILY'),
(CURRENT_DATE - INTERVAL '3 days', 'income', 'cafe', 'Cafe sales revenue', 280000, 'CAFE-DAILY');