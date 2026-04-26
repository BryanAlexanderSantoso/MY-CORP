-- ##################################################################
-- DASHBOARD & ANALYTICS FUNCTIONS
-- ##################################################################

-- 1. Get Summary Stats for Dashboard
CREATE OR REPLACE FUNCTION get_dashboard_summary()
RETURNS JSON AS $$
DECLARE
    v_tenant_id UUID;
    v_total_revenue DECIMAL;
    v_active_leads BIGINT;
    v_total_inventory BIGINT;
    v_pending_orders BIGINT;
    v_result JSON;
BEGIN
    SELECT tenant_id INTO v_tenant_id FROM profiles WHERE id = auth.uid();

    -- Revenue from all SALE transactions
    SELECT COALESCE(ABS(SUM(t.quantity * p.price)), 0) INTO v_total_revenue
    FROM inventory_transactions t
    JOIN products p ON t.product_id = p.id
    WHERE t.tenant_id = v_tenant_id AND t.transaction_type = 'SALE';

    -- Active Leads
    SELECT COUNT(*) INTO v_active_leads FROM leads WHERE tenant_id = v_tenant_id AND status != 'CLOSED';

    -- Total Stock Items (Sum of all positive/negative ledger entries)
    SELECT COALESCE(SUM(quantity), 0) INTO v_total_inventory FROM inventory_transactions WHERE tenant_id = v_tenant_id;

    -- Pending Tasks/Orders (Placeholder logic)
    SELECT COUNT(*) INTO v_pending_orders FROM leads WHERE tenant_id = v_tenant_id AND status = 'QUALIFIED';

    v_result := json_build_object(
        'revenue', v_total_revenue,
        'leads', v_active_leads,
        'inventory', v_total_inventory,
        'pending_orders', v_pending_orders
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get Sales Chart Data (Grouped by Day)
CREATE OR REPLACE FUNCTION get_sales_chart_data(p_days INTEGER DEFAULT 7)
RETURNS TABLE (date DATE, amount DECIMAL) AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    SELECT tenant_id INTO v_tenant_id FROM profiles WHERE id = auth.uid();

    RETURN QUERY
    SELECT 
        date_trunc('day', t.created_at)::DATE as sales_date,
        COALESCE(ABS(SUM(t.quantity * p.price)), 0) as total_amount
    FROM inventory_transactions t
    JOIN products p ON t.product_id = p.id
    WHERE t.tenant_id = v_tenant_id 
      AND t.transaction_type = 'SALE'
      AND t.created_at >= (now() - (p_days || ' days')::INTERVAL)
    GROUP BY sales_date
    ORDER BY sales_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
