/*
  # Complete Database Schema for PlayStation Rental & Cafe POS System

  This migration creates the complete database structure for a PlayStation rental business
  with integrated cafe POS system, including:

  1. User Management & Authentication
  2. Customer Management
  3. Equipment & Console Management
  4. Rate & Pricing Management
  5. Rental & Booking System
  6. POS & Sales System
  7. Inventory & Product Management
  8. Voucher System
  9. Maintenance & Hardware Management
  10. Financial & Reporting System

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Appropriate policies for different user roles
  - Audit trails for sensitive operations

  ## Tables Created
  - User management (roles, permissions, users)
  - Customer management
  - Equipment types and consoles
  - Rate profiles and pricing
  - Rental sessions and bookings
  - Products and sales
  - Vouchers and usage tracking
  - Maintenance and spare parts
  - Financial transactions and reporting
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. USER MANAGEMENT & AUTHENTICATION
-- =============================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role_id TEXT REFERENCES roles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- User sessions tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  login_time TIMESTAMPTZ DEFAULT now(),
  logout_time TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 2. CUSTOMER MANAGEMENT
-- =============================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  total_spent DECIMAL(12,2) DEFAULT 0,
  join_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- 3. EQUIPMENT & CONSOLE MANAGEMENT
-- =============================================

-- Equipment types (PS4, PS5, Billiard, etc.)
CREATE TABLE IF NOT EXISTS equipment_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'gamepad-2',
  category TEXT DEFAULT 'gaming' CHECK (category IN ('gaming', 'billiard', 'other')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rate profiles for pricing
CREATE TABLE IF NOT EXISTS rate_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  hourly_rate DECIMAL(10,2) NOT NULL,
  daily_rate DECIMAL(10,2) NOT NULL,
  weekly_rate DECIMAL(10,2) NOT NULL,
  monthly_rate DECIMAL(10,2),
  peak_hour_rate DECIMAL(10,2),
  peak_hour_start TIME,
  peak_hour_end TIME,
  weekend_multiplier DECIMAL(3,2) DEFAULT 1.0,
  applicable_equipment_types TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Consoles/Equipment instances
CREATE TABLE IF NOT EXISTS consoles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  equipment_type_id TEXT REFERENCES equipment_types(id),
  rate_profile_id TEXT REFERENCES rate_profiles(id),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance')),
  location TEXT,
  serial_number TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  ip_address INET,
  relay_command TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 4. RENTAL & BOOKING SYSTEM
-- =============================================

-- Rental sessions
CREATE TABLE IF NOT EXISTS rental_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  console_id TEXT REFERENCES consoles(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  rate_type TEXT DEFAULT 'hourly' CHECK (rate_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  base_amount DECIMAL(10,2) DEFAULT 0,
  peak_hour_amount DECIMAL(10,2) DEFAULT 0,
  weekend_amount DECIMAL(10,2) DEFAULT 0,
  late_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'overdue')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  applied_rate_profile JSONB,
  -- Voucher integration
  is_voucher_used BOOLEAN DEFAULT false,
  voucher_id UUID,
  voucher_code TEXT,
  voucher_hours_used DECIMAL(4,2),
  voucher_remaining_before DECIMAL(4,2),
  voucher_remaining_after DECIMAL(4,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Scheduled bookings
CREATE TABLE IF NOT EXISTS scheduled_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  console_id TEXT REFERENCES consoles(id),
  booking_date DATE DEFAULT CURRENT_DATE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_hours INTEGER NOT NULL,
  end_time TIME NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  remaining_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no-show', 'in-progress')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit-paid', 'fully-paid')),
  reminder_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- 5. POS & SALES SYSTEM
-- =============================================

-- Product categories and suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  category TEXT DEFAULT 'beverage' CHECK (category IN ('beverage', 'food', 'snack', 'other')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Products for cafe
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'beverage' CHECK (category IN ('snack', 'beverage', 'food', 'other')),
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  barcode TEXT UNIQUE,
  image_url TEXT,
  description TEXT,
  supplier_id UUID REFERENCES suppliers(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Sales transactions
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer')),
  payment_amount DECIMAL(10,2) NOT NULL,
  change_amount DECIMAL(10,2) DEFAULT 0,
  sale_date TIMESTAMPTZ DEFAULT now(),
  cashier_id UUID REFERENCES auth.users(id),
  session_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sale items
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Purchase orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  order_date DATE DEFAULT CURRENT_DATE,
  expected_date DATE,
  received_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'cancelled')),
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  notes TEXT,
  received_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Purchase order items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 6. CASHIER SESSION MANAGEMENT
-- =============================================

-- Cashier sessions for daily operations
CREATE TABLE IF NOT EXISTS cashier_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cashier_id UUID REFERENCES auth.users(id),
  cashier_name TEXT NOT NULL,
  start_time TIMESTAMPTZ DEFAULT now(),
  end_time TIMESTAMPTZ,
  opening_cash DECIMAL(10,2) NOT NULL,
  closing_cash DECIMAL(10,2),
  expected_cash DECIMAL(10,2),
  variance DECIMAL(10,2),
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_cash DECIMAL(10,2) DEFAULT 0,
  total_card DECIMAL(10,2) DEFAULT 0,
  total_transfer DECIMAL(10,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Individual transactions during cashier session
CREATE TABLE IF NOT EXISTS cashier_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES cashier_sessions(id),
  type TEXT NOT NULL CHECK (type IN ('sale', 'rental', 'voucher', 'refund')),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer')),
  reference_id TEXT NOT NULL,
  description TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  cashier_id UUID REFERENCES auth.users(id)
);

-- =============================================
-- 7. VOUCHER SYSTEM
-- =============================================

-- Vouchers with hour-based system
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  total_hours DECIMAL(4,2) NOT NULL,
  remaining_hours DECIMAL(4,2) NOT NULL,
  used_hours DECIMAL(4,2) DEFAULT 0,
  original_price DECIMAL(10,2) NOT NULL,
  voucher_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL,
  validity_days INTEGER NOT NULL,
  created_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used-up')),
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  customer_phone TEXT,
  sold_date DATE,
  sold_by UUID REFERENCES auth.users(id),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Voucher usage tracking
CREATE TABLE IF NOT EXISTS voucher_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id UUID REFERENCES vouchers(id),
  voucher_code TEXT NOT NULL,
  rental_session_id UUID REFERENCES rental_sessions(id),
  hours_used DECIMAL(4,2) NOT NULL,
  usage_date DATE DEFAULT CURRENT_DATE,
  remaining_hours_after DECIMAL(4,2) NOT NULL,
  used_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 8. MAINTENANCE & HARDWARE MANAGEMENT
-- =============================================

-- Spare parts inventory
CREATE TABLE IF NOT EXISTS spare_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  part_number TEXT,
  category TEXT DEFAULT 'other' CHECK (category IN ('controller', 'cable', 'power', 'cooling', 'storage', 'display', 'audio', 'other')),
  compatible_consoles TEXT[] DEFAULT '{}',
  description TEXT,
  specifications TEXT,
  brand TEXT,
  model TEXT,
  condition TEXT DEFAULT 'new' CHECK (condition IN ('new', 'used', 'refurbished')),
  price DECIMAL(10,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  location TEXT,
  supplier TEXT,
  purchase_link TEXT,
  alternative_links TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  installation_notes TEXT,
  warranty_period INTEGER,
  last_used DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Maintenance transactions
CREATE TABLE IF NOT EXISTS maintenance_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_number TEXT UNIQUE NOT NULL,
  console_id TEXT REFERENCES consoles(id),
  console_name TEXT NOT NULL,
  console_model TEXT NOT NULL,
  console_serial_number TEXT,
  service_date DATE DEFAULT CURRENT_DATE,
  completed_date DATE,
  technician_id UUID REFERENCES auth.users(id),
  technician_name TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  service_status TEXT DEFAULT 'scheduled' CHECK (service_status IN ('scheduled', 'in-progress', 'completed', 'cancelled', 'on-hold')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  labor_cost DECIMAL(10,2) DEFAULT 0,
  additional_service_fees DECIMAL(10,2) DEFAULT 0,
  total_parts_cost DECIMAL(10,2) DEFAULT 0,
  total_repair_cost DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'warranty', 'insurance')),
  warranty_type TEXT CHECK (warranty_type IN ('manufacturer', 'service', 'extended')),
  warranty_expiry DATE,
  service_notes TEXT,
  before_photos TEXT[] DEFAULT '{}',
  after_photos TEXT[] DEFAULT '{}',
  test_results TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Parts used in maintenance
CREATE TABLE IF NOT EXISTS maintenance_part_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maintenance_id UUID REFERENCES maintenance_transactions(id) ON DELETE CASCADE,
  spare_part_id UUID REFERENCES spare_parts(id),
  spare_part_name TEXT NOT NULL,
  part_number TEXT,
  category TEXT NOT NULL,
  old_part_condition TEXT,
  old_part_serial_number TEXT,
  old_part_notes TEXT,
  new_part_serial_number TEXT,
  new_part_condition TEXT DEFAULT 'new' CHECK (new_part_condition IN ('new', 'used', 'refurbished')),
  quantity_used INTEGER NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  installation_notes TEXT,
  installation_time INTEGER,
  part_warranty_period INTEGER,
  part_warranty_expiry DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 9. FINANCIAL & REPORTING
-- =============================================

-- Bookkeeping entries
CREATE TABLE IF NOT EXISTS bookkeeping_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_date DATE DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL CHECK (category IN ('rental', 'cafe', 'inventory', 'operational', 'voucher', 'maintenance', 'other')),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Payment records
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  amount DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT now(),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer')),
  reference_id TEXT NOT NULL,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('rental', 'sale', 'booking', 'voucher')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE consoles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashier_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashier_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_part_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookkeeping_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- User management indexes
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- Equipment indexes
CREATE INDEX IF NOT EXISTS idx_consoles_equipment_type ON consoles(equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_consoles_rate_profile ON consoles(rate_profile_id);
CREATE INDEX IF NOT EXISTS idx_consoles_status ON consoles(status);

-- Rental indexes
CREATE INDEX IF NOT EXISTS idx_rental_sessions_customer ON rental_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_rental_sessions_console ON rental_sessions(console_id);
CREATE INDEX IF NOT EXISTS idx_rental_sessions_status ON rental_sessions(status);
CREATE INDEX IF NOT EXISTS idx_rental_sessions_start_time ON rental_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_bookings_date ON scheduled_bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_bookings_console ON scheduled_bookings(console_id);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_session ON sales(session_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);

-- Cashier session indexes
CREATE INDEX IF NOT EXISTS idx_cashier_sessions_cashier ON cashier_sessions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_cashier_sessions_date ON cashier_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_cashier_transactions_session ON cashier_transactions(session_id);

-- Voucher indexes
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(voucher_code);
CREATE INDEX IF NOT EXISTS idx_vouchers_customer ON vouchers(customer_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
CREATE INDEX IF NOT EXISTS idx_voucher_usages_voucher ON voucher_usages(voucher_id);

-- Maintenance indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_console ON maintenance_transactions(console_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_technician ON maintenance_transactions(technician_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance_transactions(service_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_parts_maintenance ON maintenance_part_usages(maintenance_id);

-- Financial indexes
CREATE INDEX IF NOT EXISTS idx_bookkeeping_date ON bookkeeping_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_bookkeeping_type ON bookkeeping_entries(type);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);

-- =============================================
-- CREATE FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_types_updated_at BEFORE UPDATE ON equipment_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rate_profiles_updated_at BEFORE UPDATE ON rate_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consoles_updated_at BEFORE UPDATE ON consoles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rental_sessions_updated_at BEFORE UPDATE ON rental_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_bookings_updated_at BEFORE UPDATE ON scheduled_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cashier_sessions_updated_at BEFORE UPDATE ON cashier_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON vouchers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spare_parts_updated_at BEFORE UPDATE ON spare_parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_transactions_updated_at BEFORE UPDATE ON maintenance_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate voucher codes
CREATE OR REPLACE FUNCTION generate_voucher_code()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    new_code TEXT;
BEGIN
    -- Get the next number in sequence
    SELECT COALESCE(MAX(CAST(SUBSTRING(voucher_code FROM 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM vouchers
    WHERE voucher_code ~ '^VCH[0-9]+$';
    
    -- Format as VCH001, VCH002, etc.
    new_code := 'VCH' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to generate maintenance transaction numbers
CREATE OR REPLACE FUNCTION generate_maintenance_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    new_number TEXT;
    current_year TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Get the next number for current year
    SELECT COALESCE(MAX(CAST(SPLIT_PART(transaction_number, '-', 3) AS INTEGER)), 0) + 1
    INTO next_number
    FROM maintenance_transactions
    WHERE transaction_number LIKE 'MNT-' || current_year || '-%';
    
    -- Format as MNT-2024-001, MNT-2024-002, etc.
    new_number := 'MNT-' || current_year || '-' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate PO numbers
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    new_number TEXT;
    current_year TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Get the next number for current year
    SELECT COALESCE(MAX(CAST(SPLIT_PART(po_number, '-', 3) AS INTEGER)), 0) + 1
    INTO next_number
    FROM purchase_orders
    WHERE po_number LIKE 'PO-' || current_year || '-%';
    
    -- Format as PO-2024-001, PO-2024-002, etc.
    new_number := 'PO-' || current_year || '-' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;