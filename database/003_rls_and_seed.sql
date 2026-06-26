-- ============================================================================
-- SmartSupply Enterprise SaaS — Full RLS Policies (Dev + Production)
-- Run this AFTER schema.sql AND 002_enterprise_migration.sql
-- ============================================================================

-- Grant usage to authenticated and anon roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ====================
-- TENANTS — Any authenticated user can read; inserts allowed for new registration
-- ====================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to tenants" ON tenants;
CREATE POLICY "tenants_select" ON tenants FOR SELECT USING (true);
CREATE POLICY "tenants_insert" ON tenants FOR INSERT WITH CHECK (true);
CREATE POLICY "tenants_update" ON tenants FOR UPDATE USING (true);

-- ====================
-- ORGANIZATIONS
-- ====================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to organizations" ON organizations;
CREATE POLICY "organizations_all" ON organizations FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- USERS
-- ====================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to users" ON users;
CREATE POLICY "users_all" ON users FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- PRODUCTS
-- ====================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to products" ON products;
CREATE POLICY "products_all" ON products FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- PURCHASE ORDERS
-- ====================
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to purchase_orders" ON purchase_orders;
CREATE POLICY "purchase_orders_all" ON purchase_orders FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- PURCHASE ORDER ITEMS
-- ====================
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to purchase_order_items" ON purchase_order_items;
CREATE POLICY "po_items_all" ON purchase_order_items FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- CATEGORIES
-- ====================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to categories" ON categories;
CREATE POLICY "categories_all" ON categories FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- BRANDS
-- ====================
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to brands" ON brands;
CREATE POLICY "brands_all" ON brands FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- ROLES
-- ====================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to roles" ON roles;
CREATE POLICY "roles_all" ON roles FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- SUPPLIER PROFILES
-- ====================
ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to supplier_profiles" ON supplier_profiles;
CREATE POLICY "supplier_profiles_all" ON supplier_profiles FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- INVENTORY ITEMS
-- ====================
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to inventory_items" ON inventory_items;
CREATE POLICY "inventory_items_all" ON inventory_items FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- WAREHOUSES
-- ====================
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to warehouses" ON warehouses;
CREATE POLICY "warehouses_all" ON warehouses FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- SUBSCRIPTION PLANS
-- ====================
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscription_plans_all" ON subscription_plans FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- SUBSCRIPTIONS
-- ====================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_all" ON subscriptions FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- LOGIN ATTEMPTS
-- ====================
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert login_attempts" ON login_attempts;
DROP POLICY IF EXISTS "Allow read login_attempts for superadmin" ON login_attempts;
CREATE POLICY "login_attempts_insert" ON login_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "login_attempts_select" ON login_attempts FOR SELECT USING (true);
GRANT INSERT ON TABLE login_attempts TO anon, authenticated;

-- ====================
-- BRANCHES (Enterprise Migration)
-- ====================
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "branches_isolation" ON branches;
CREATE POLICY "branches_all" ON branches FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- TENANT STAFF (Enterprise Migration)
-- ====================
ALTER TABLE tenant_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_staff_read" ON tenant_staff;
CREATE POLICY "tenant_staff_all" ON tenant_staff FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- PAYMENTS (Enterprise Migration)
-- ====================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_isolation" ON payments;
CREATE POLICY "payments_all" ON payments FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- BILLING INVOICES
-- ====================
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "billing_invoices_all" ON billing_invoices FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- BILLING PAYMENTS
-- ====================
ALTER TABLE billing_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "billing_payments_all" ON billing_payments FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- NOTIFICATIONS
-- ====================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_notifications" ON notifications;
CREATE POLICY "notifications_all" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- ORDERS
-- ====================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_orders" ON orders;
CREATE POLICY "orders_all" ON orders FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- AUDIT LOGS
-- ====================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_all" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ====================
-- SEED: Subscription Plans
-- ====================
INSERT INTO subscription_plans (name, slug, tier, price_monthly, price_yearly, features, limits, sort_order) VALUES
('Basic', 'basic', 'starter', 999, 9990, 
  '{"support": "standard", "ai": false, "tally_integration": false}'::jsonb,
  '{"branches": 1, "warehouses": 1, "staff": 3, "skus": 5000, "orders_per_month": 1000}'::jsonb,
  1),
('Pro', 'pro', 'growth', 2999, 29990, 
  '{"support": "priority", "ai": true, "tally_integration": true}'::jsonb,
  '{"branches": 5, "warehouses": 3, "staff": 15, "skus": 50000, "orders_per_month": 10000}'::jsonb,
  2),
('Max', 'max', 'enterprise', 9999, 99990, 
  '{"support": "dedicated", "ai": true, "tally_integration": true, "custom_domain": true}'::jsonb,
  '{"branches": -1, "warehouses": -1, "staff": -1, "skus": -1, "orders_per_month": -1}'::jsonb,
  3)
ON CONFLICT (slug) DO NOTHING;
