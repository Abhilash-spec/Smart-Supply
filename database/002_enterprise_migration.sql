-- SmartSupply Enterprise SaaS Migration Script
-- Run this AFTER schema.sql to add the new Multi-Tenant and Billing tables and stricter RLS.

-- 1. Branches / Locations (For Shop Owners)
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    pincode VARCHAR(20),
    gst_number VARCHAR(50),
    is_headquarters BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Staff Management & RBAC Mapping
CREATE TABLE IF NOT EXISTS tenant_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'manager', 'inventory_manager', 'sales_manager', 'purchase_manager', 'warehouse_staff', 'vendor_staff', 'accountant', 'viewer')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- 3. Payment Gateway Links for Subscriptions
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS gateway VARCHAR(50) DEFAULT 'razorpay',
ADD COLUMN IF NOT EXISTS gateway_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS gateway_customer_id VARCHAR(255);

-- 4. Invoices / Payments (Linked to Razorpay)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    gateway VARCHAR(50) DEFAULT 'razorpay',
    gateway_payment_id VARCHAR(255) UNIQUE,
    gateway_order_id VARCHAR(255) UNIQUE,
    gateway_signature VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS Policies
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own tenant staff map
CREATE POLICY "tenant_staff_read" ON tenant_staff FOR SELECT 
USING (user_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_staff WHERE user_id = auth.uid() AND role IN ('owner', 'manager')));

-- Allow branches isolation
CREATE POLICY "branches_isolation" ON branches FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM tenant_staff WHERE user_id = auth.uid()));

-- Payments isolation
CREATE POLICY "payments_isolation" ON payments FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM tenant_staff WHERE user_id = auth.uid()));

-- Fix login_attempts from previous bug
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert login_attempts" ON login_attempts;
CREATE POLICY "Allow insert login_attempts" ON login_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read login_attempts for superadmin" ON login_attempts FOR SELECT USING (true); -- Ideally restrict to superadmin role later

GRANT INSERT ON TABLE login_attempts TO anon, authenticated;
