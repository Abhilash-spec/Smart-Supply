-- 2. POS Orders Table
CREATE TABLE IF NOT EXISTS pos_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id), -- Nullable, for walk-in anonymous customers
    receipt_number VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'cancelled')),
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'store_credit')),
    cashier_id UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for pos_orders
ALTER TABLE pos_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant's pos_orders" ON pos_orders;
CREATE POLICY "Users can view their tenant's pos_orders"
    ON pos_orders FOR SELECT
    USING (tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert their tenant's pos_orders" ON pos_orders;
CREATE POLICY "Users can insert their tenant's pos_orders"
    ON pos_orders FOR INSERT
    WITH CHECK (tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update their tenant's pos_orders" ON pos_orders;
CREATE POLICY "Users can update their tenant's pos_orders"
    ON pos_orders FOR UPDATE
    USING (tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));


-- 3. POS Order Items Table
CREATE TABLE IF NOT EXISTS pos_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pos_order_id UUID NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_price DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for pos_order_items
ALTER TABLE pos_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant's pos_order_items" ON pos_order_items;
CREATE POLICY "Users can view their tenant's pos_order_items"
    ON pos_order_items FOR SELECT
    USING (pos_order_id IN (
        SELECT id FROM pos_orders WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ));

DROP POLICY IF EXISTS "Users can insert their tenant's pos_order_items" ON pos_order_items;
CREATE POLICY "Users can insert their tenant's pos_order_items"
    ON pos_order_items FOR INSERT
    WITH CHECK (pos_order_id IN (
        SELECT id FROM pos_orders WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ));
