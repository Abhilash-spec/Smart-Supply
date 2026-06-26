-- ============================================================================
-- SmartSupply AI — RLS Policies for Development
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This grants full CRUD access to the anon role on core tables
-- ============================================================================

-- ====================
-- TENANTS
-- ====================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to tenants" ON tenants
  FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- ORGANIZATIONS
-- ====================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to organizations" ON organizations
  FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- PRODUCTS
-- ====================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to products" ON products
  FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- PURCHASE ORDERS
-- ====================
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to purchase_orders" ON purchase_orders
  FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- PURCHASE ORDER ITEMS
-- ====================
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to purchase_order_items" ON purchase_order_items
  FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- CATEGORIES
-- ====================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to categories" ON categories
  FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- BRANDS
-- ====================
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to brands" ON brands
  FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- USERS
-- ====================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- ROLES
-- ====================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to roles" ON roles
  FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- SUPPLIER PROFILES
-- ====================
ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to supplier_profiles" ON supplier_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- INVENTORY ITEMS
-- ====================
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to inventory_items" ON inventory_items
  FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- WAREHOUSES
-- ====================
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to warehouses" ON warehouses
  FOR ALL USING (true) WITH CHECK (true);
