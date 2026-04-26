-- Add missing UPDATE policies that were skipped in migration 004
-- These are needed for edit functionality to work

-- inventory_transactions (was missing UPDATE)
DROP POLICY IF EXISTS "Tenant UPDATE transactions" ON inventory_transactions;
CREATE POLICY "Tenant UPDATE transactions"
    ON inventory_transactions FOR UPDATE TO authenticated
    USING (tenant_id = get_current_tenant());

-- products (verify UPDATE exists)
DROP POLICY IF EXISTS "Tenant UPDATE products" ON products;
CREATE POLICY "Tenant UPDATE products"
    ON products FOR UPDATE TO authenticated
    USING (tenant_id = get_current_tenant());

-- leads (verify UPDATE exists)
DROP POLICY IF EXISTS "Tenant UPDATE leads" ON leads;
CREATE POLICY "Tenant UPDATE leads"
    ON leads FOR UPDATE TO authenticated
    USING (tenant_id = get_current_tenant());

-- warehouses (verify UPDATE exists)
DROP POLICY IF EXISTS "Tenant UPDATE warehouses" ON warehouses;
CREATE POLICY "Tenant UPDATE warehouses"
    ON warehouses FOR UPDATE TO authenticated
    USING (tenant_id = get_current_tenant());

-- employees (verify UPDATE exists)
DROP POLICY IF EXISTS "Tenant UPDATE employees" ON employees;
CREATE POLICY "Tenant UPDATE employees"
    ON employees FOR UPDATE TO authenticated
    USING (tenant_id = get_current_tenant());
