-- ##################################################################
-- FIX: Auto-set tenant_id via trigger + simplify INSERT policies
-- Run this in Supabase SQL Editor
-- ##################################################################

-- Step 1: Create a trigger function that auto-sets tenant_id before INSERT
CREATE OR REPLACE FUNCTION auto_set_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.tenant_id := get_current_tenant();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Attach trigger to all tenant-scoped tables

DROP TRIGGER IF EXISTS set_tenant_id_on_leads ON leads;
CREATE TRIGGER set_tenant_id_on_leads
    BEFORE INSERT ON leads
    FOR EACH ROW EXECUTE FUNCTION auto_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_on_products ON products;
CREATE TRIGGER set_tenant_id_on_products
    BEFORE INSERT ON products
    FOR EACH ROW EXECUTE FUNCTION auto_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_on_warehouses ON warehouses;
CREATE TRIGGER set_tenant_id_on_warehouses
    BEFORE INSERT ON warehouses
    FOR EACH ROW EXECUTE FUNCTION auto_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_on_inventory_transactions ON inventory_transactions;
CREATE TRIGGER set_tenant_id_on_inventory_transactions
    BEFORE INSERT ON inventory_transactions
    FOR EACH ROW EXECUTE FUNCTION auto_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_on_employees ON employees;
CREATE TRIGGER set_tenant_id_on_employees
    BEFORE INSERT ON employees
    FOR EACH ROW EXECUTE FUNCTION auto_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_on_attendance ON attendance;
CREATE TRIGGER set_tenant_id_on_attendance
    BEFORE INSERT ON attendance
    FOR EACH ROW EXECUTE FUNCTION auto_set_tenant_id();

-- Step 3: Simplify INSERT policies — since trigger sets tenant_id,
-- we just need to ensure user is authenticated.

DROP POLICY IF EXISTS "Tenant INSERT products" ON products;
CREATE POLICY "Tenant INSERT products"
    ON products FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Tenant INSERT warehouses" ON warehouses;
CREATE POLICY "Tenant INSERT warehouses"
    ON warehouses FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Tenant INSERT transactions" ON inventory_transactions;
CREATE POLICY "Tenant INSERT transactions"
    ON inventory_transactions FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Tenant INSERT leads" ON leads;
CREATE POLICY "Tenant INSERT leads"
    ON leads FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Tenant INSERT employees" ON employees;
CREATE POLICY "Tenant INSERT employees"
    ON employees FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Tenant INSERT attendance" ON attendance;
CREATE POLICY "Tenant INSERT attendance"
    ON attendance FOR INSERT TO authenticated
    WITH CHECK (true);
