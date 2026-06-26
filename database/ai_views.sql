-- Create a view to calculate 30-day sales velocity for forecasting

CREATE OR REPLACE VIEW vw_inventory_velocity AS
SELECT 
    p.tenant_id,
    p.id as product_id,
    p.name as product_name,
    p.sku,
    p.stock_quantity as current_stock,
    p.min_stock_level,
    COALESCE(SUM(poi.quantity), 0) as units_sold_30d,
    COALESCE(SUM(poi.quantity) / 30.0, 0) as daily_velocity
FROM products p
LEFT JOIN pos_order_items poi ON p.id = poi.product_id
LEFT JOIN pos_orders po ON poi.order_id = po.id 
    AND po.created_at >= NOW() - INTERVAL '30 days'
    AND po.status = 'completed'
GROUP BY 
    p.tenant_id,
    p.id,
    p.name,
    p.sku,
    p.stock_quantity,
    p.min_stock_level;

-- Ensure proper permissions
GRANT SELECT ON vw_inventory_velocity TO authenticated;
GRANT SELECT ON vw_inventory_velocity TO service_role;
