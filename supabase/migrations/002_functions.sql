-- ##################################################################
-- FUNCTIONS & PROCEDURES (PL/pgSQL)
-- ##################################################################

-- 1. Create Sale and Update Inventory atomically
CREATE OR REPLACE FUNCTION record_sale_transaction(
    p_product_id UUID,
    p_warehouse_id UUID,
    p_quantity DECIMAL,
    p_price DECIMAL,
    p_reference_id UUID,
    p_notes TEXT DEFAULT NULL
) 
RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_tenant_id UUID;
    v_current_stock DECIMAL;
BEGIN
    -- Get current user's tenant
    SELECT tenant_id INTO v_tenant_id FROM profiles WHERE id = auth.uid();

    -- Check if enough stock exists (Simple check)
    SELECT SUM(quantity) INTO v_current_stock 
    FROM inventory_transactions 
    WHERE product_id = p_product_id AND warehouse_id = p_warehouse_id AND tenant_id = v_tenant_id;

    IF v_current_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock: needed %, available %', p_quantity, v_current_stock;
    END IF;

    -- Record outgoing inventory (Negative quantity)
    INSERT INTO inventory_transactions (
        tenant_id, product_id, warehouse_id, quantity, transaction_type, reference_id, notes, created_by
    ) VALUES (
        v_tenant_id, p_product_id, p_warehouse_id, -p_quantity, 'SALE', p_reference_id, p_notes, auth.uid()
    ) RETURNING id INTO v_transaction_id;

    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bulk Payroll Calculation (PPH21 & BPJS)
-- Calculation: 
-- Net = Base - (Base * 0.05 Tax approximate) - (Base * 0.04 BPJS approximate)
CREATE OR REPLACE FUNCTION calculate_monthly_payroll(
    p_month INTEGER,
    p_year INTEGER
)
RETURNS TABLE (
    employee_id UUID,
    full_name TEXT,
    base DECIMAL,
    tax_pph21 DECIMAL,
    bpjs_amount DECIMAL,
    net_salary DECIMAL
) AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    SELECT tenant_id INTO v_tenant_id FROM profiles WHERE id = auth.uid();

    RETURN QUERY
    SELECT 
        e.id,
        p.full_name,
        e.salary_base,
        (e.salary_base * 0.05) as tax, -- Placeholder Logic
        (e.salary_base * 0.04) as bpjs, -- Placeholder Logic
        (e.salary_base - (e.salary_base * 0.05) - (e.salary_base * 0.04)) as net
    FROM employees e
    JOIN profiles p ON e.profile_id = p.id
    WHERE e.tenant_id = v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
