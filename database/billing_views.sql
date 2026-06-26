-- Billing Views and Helper Functions for Super Admin

-- View to easily join tenants with their active subscription details
CREATE OR REPLACE VIEW vw_tenant_subscriptions AS
SELECT 
    t.id AS tenant_id,
    t.name AS tenant_name,
    t.slug AS tenant_slug,
    t.type AS tenant_type,
    t.status AS tenant_status,
    t.tier AS tenant_tier,
    t.created_at AS tenant_created_at,
    s.id AS subscription_id,
    s.status AS subscription_status,
    s.current_period_end,
    sp.id AS plan_id,
    sp.name AS plan_name,
    sp.price_monthly
FROM 
    tenants t
LEFT JOIN 
    subscriptions s ON t.id = s.tenant_id AND s.status = 'active'
LEFT JOIN 
    subscription_plans sp ON s.plan_id = sp.id;

-- View to calculate platform MRR (Monthly Recurring Revenue)
CREATE OR REPLACE VIEW vw_platform_mrr AS
SELECT 
    COALESCE(SUM(sp.price_monthly), 0) AS current_mrr,
    COUNT(s.id) AS active_paid_subscriptions
FROM 
    subscriptions s
JOIN 
    subscription_plans sp ON s.plan_id = sp.id
WHERE 
    s.status = 'active' AND sp.price_monthly > 0;

-- Optional function to get platform stats quickly
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    mrr numeric;
    tenant_count int;
    supplier_count int;
    user_count int;
BEGIN
    SELECT current_mrr INTO mrr FROM vw_platform_mrr;
    SELECT COUNT(*) INTO tenant_count FROM tenants;
    SELECT COUNT(*) INTO supplier_count FROM organizations WHERE type = 'supplier';
    SELECT COUNT(*) INTO user_count FROM users;
    
    result := json_build_object(
        'mrr', COALESCE(mrr, 0),
        'total_tenants', tenant_count,
        'total_suppliers', supplier_count,
        'total_users', user_count
    );
    
    RETURN result;
END;
$$;
