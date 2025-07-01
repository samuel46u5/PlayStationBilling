/*
  # Add RLS Policies for Suppliers Table

  1. Security Policies
    - Allow authenticated users to SELECT suppliers
    - Allow authenticated users to INSERT suppliers  
    - Allow authenticated users to UPDATE suppliers
    - Allow authenticated users to DELETE suppliers

  2. Changes
    - Add comprehensive CRUD policies for suppliers table
    - Enable proper access control for authenticated users
*/

-- Re-enable RLS for suppliers table
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Drop existing demo policy if it exists
DROP POLICY IF EXISTS "suppliers_demo_access" ON suppliers;

-- Kebijakan untuk SELECT
CREATE POLICY "Allow authenticated users to select suppliers" 
ON suppliers 
FOR SELECT 
TO authenticated 
USING (true);

-- Kebijakan untuk INSERT
CREATE POLICY "Allow authenticated users to insert suppliers" 
ON suppliers 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Kebijakan untuk UPDATE
CREATE POLICY "Allow authenticated users to update suppliers" 
ON suppliers 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Kebijakan untuk DELETE
CREATE POLICY "Allow authenticated users to delete suppliers" 
ON suppliers 
FOR DELETE 
TO authenticated 
USING (true);

-- Also add similar policies for products table to ensure consistency
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing demo policy if it exists
DROP POLICY IF EXISTS "products_demo_access" ON products;

-- Products policies
CREATE POLICY "Allow authenticated users to select products" 
ON products 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert products" 
ON products 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update products" 
ON products 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete products" 
ON products 
FOR DELETE 
TO authenticated 
USING (true);

-- Purchase orders policies
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "purchase_orders_demo_access" ON purchase_orders;

CREATE POLICY "Allow authenticated users to select purchase_orders" 
ON purchase_orders 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert purchase_orders" 
ON purchase_orders 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update purchase_orders" 
ON purchase_orders 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete purchase_orders" 
ON purchase_orders 
FOR DELETE 
TO authenticated 
USING (true);

-- Purchase order items policies
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "purchase_order_items_demo_access" ON purchase_order_items;

CREATE POLICY "Allow authenticated users to select purchase_order_items" 
ON purchase_order_items 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert purchase_order_items" 
ON purchase_order_items 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update purchase_order_items" 
ON purchase_order_items 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete purchase_order_items" 
ON purchase_order_items 
FOR DELETE 
TO authenticated 
USING (true);

-- Customers policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_demo_access" ON customers;

CREATE POLICY "Allow authenticated users to select customers" 
ON customers 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert customers" 
ON customers 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update customers" 
ON customers 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete customers" 
ON customers 
FOR DELETE 
TO authenticated 
USING (true);