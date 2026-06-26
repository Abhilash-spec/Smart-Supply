-- ============================================================================
-- SMART SUPPLY ENTERPRISE - DATA WIPE SCRIPT
-- ============================================================================
-- WARNING: This script will truncate ALL tenants, users, organizations,
-- and authentication records. Run this ONLY in a development environment.

-- Truncate auth.users (cascades to identities, sessions, etc.)
TRUNCATE TABLE auth.users CASCADE;

-- Truncate tenants (cascades to public.users, organizations, 
-- warehouses, branches, purchase orders, products, etc.)
TRUNCATE TABLE public.tenants CASCADE;

-- Truncate other tables that might not cascade directly from tenants 
-- (or just to be absolutely thorough)
TRUNCATE TABLE public.login_attempts CASCADE;
TRUNCATE TABLE public.subscriptions CASCADE;

-- Output confirmation
SELECT 'Database successfully wiped using TRUNCATE CASCADE.' as status;
