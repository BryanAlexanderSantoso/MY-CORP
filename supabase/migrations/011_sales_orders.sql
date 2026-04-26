-- Create dedicated sales_orders table
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id),
    order_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes TEXT,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Generate order number auto trigger
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'SO-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999 + 1)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_number ON sales_orders;
CREATE TRIGGER set_order_number
    BEFORE INSERT ON sales_orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
    EXECUTE FUNCTION generate_order_number();

-- Auto set tenant_id trigger
DROP TRIGGER IF EXISTS set_tenant_id_on_sales_orders ON sales_orders;
CREATE TRIGGER set_tenant_id_on_sales_orders
    BEFORE INSERT ON sales_orders
    FOR EACH ROW EXECUTE FUNCTION auto_set_tenant_id();

-- Enable RLS
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant SELECT sales_orders" ON sales_orders FOR SELECT TO authenticated USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant INSERT sales_orders" ON sales_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Tenant UPDATE sales_orders" ON sales_orders FOR UPDATE TO authenticated USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant DELETE sales_orders" ON sales_orders FOR DELETE TO authenticated USING (tenant_id = get_current_tenant());
