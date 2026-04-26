-- ##################################################################
-- FIX: Recursive RLS Stack Depth Issue
-- Run this in Supabase SQL Editor
-- We use CREATE OR REPLACE (no DROP needed) to fix SECURITY DEFINER
-- ##################################################################

-- Step 1: Replace the function IN PLACE with SECURITY DEFINER
-- This is the root fix. No DROP needed, all dependent policies stay intact.
CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS UUID AS $$
    SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Step 2: Fix INSERT policies — FOR ALL doesn't enforce WITH CHECK on insert
-- We drop individual old policies and recreate them explicitly.

-- Products
DROP POLICY IF EXISTS "Tenant isolation for products" ON products;
CREATE POLICY "Tenant SELECT products" ON products FOR SELECT TO authenticated USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant INSERT products" ON products FOR INSERT TO authenticated WITH CHECK (tenant_id = get_current_tenant());
CREATE POLICY "Tenant UPDATE products" ON products FOR UPDATE TO authenticated USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant DELETE products" ON products FOR DELETE TO authenticated USING (tenant_id = get_current_tenant());

-- Warehouses
DROP POLICY IF EXISTS "Tenant isolation for warehouses" ON warehouses;
CREATE POLICY "Tenant SELECT warehouses" ON warehouses FOR SELECT TO authenticated USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant INSERT warehouses" ON warehouses FOR INSERT TO authenticated WITH CHECK (tenant_id = get_current_tenant());
CREATE POLICY "Tenant UPDATE warehouses" ON warehouses FOR UPDATE TO authenticated USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant DELETE warehouses" ON warehouses FOR DELETE TO authenticated USING (tenant_id = get_current_tenant());

-- Inventory Transactions
DROP POLICY IF EXISTS "Tenant isolation for inventory_transactions" ON inventory_transactions;
CREATE POLICY "Tenant SELECT transactions" ON inventory_transactions FOR SELECT TO authenticated USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant INSERT transactions" ON inventory_transactions FOR INSERT TO authenticated WITH CHECK (tenant_id = get_current_tenant());
CREATE POLICY "Tenant DELETE transactions" ON inventory_transactions FOR DELETE TO authenticated USING (tenant_id = get_current_tenant());

-- Leads
DROP POLICY IF EXISTS "Tenant isolation for leads" ON leads;
CREATE POLICY "Tenant SELECT leads" ON leads FOR SELECT TO authenticated USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant INSERT leads" ON leads FOR INSERT TO authenticated WITH CHECK (tenant_id = get_current_tenant());
CREATE POLICY "Tenant UPDATE leads" ON leads FOR UPDATE TO authenticated USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant DELETE leads" ON leads FOR DELETE TO authenticated USING (tenant_id = get_current_tenant());

-- Employees
DROP POLICY IF EXISTS "Tenant isolation for employees" ON employees;
CREATE POLICY "Tenant SELECT employees" ON employees FOR SELECT TO authenticated USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant INSERT employees" ON employees FOR INSERT TO authenticated WITH CHECK (tenant_id = get_current_tenant());
CREATE POLICY "Tenant UPDATE employees" ON employees FOR UPDATE TO authenticated USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant DELETE employees" ON employees FOR DELETE TO authenticated USING (tenant_id = get_current_tenant());

-- Attendance
DROP POLICY IF EXISTS "Tenant isolation for attendance" ON attendance;
CREATE POLICY "Tenant SELECT attendance" ON attendance FOR SELECT TO authenticated USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant INSERT attendance" ON attendance FOR INSERT TO authenticated WITH CHECK (tenant_id = get_current_tenant());
CREATE POLICY "Tenant UPDATE attendance" ON attendance FOR UPDATE TO authenticated USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant DELETE attendance" ON attendance FOR DELETE TO authenticated USING (tenant_id = get_current_tenant());

-- Also add INSERT policies for profiles and organizations
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
CREATE POLICY "Users can create their own profile"
    ON profiles FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert organization" ON organizations;
CREATE POLICY "Users can insert organization"
    ON organizations FOR INSERT TO authenticated
    WITH CHECK (owner_id = auth.uid());


-- Step 2: Recreate with SECURITY DEFINER (bypasses RLS when reading profiles)
-- This prevents the infinite recursion loop.
CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS UUID AS $$
    SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Step 3: Also fix INSERT policies — the FOR ALL policy doesn't cover INSERT WITH CHECK
-- We need explicit INSERT policies with WITH CHECK for all tables.

-- Products
DROP POLICY IF EXISTS "Tenant isolation for products" ON products;
CREATE POLICY "Tenant can SELECT/UPDATE/DELETE products"
    ON products FOR SELECT TO authenticated
    USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant can INSERT products"
    ON products FOR INSERT TO authenticated
    WITH CHECK (tenant_id = get_current_tenant());
CREATE POLICY "Tenant can UPDATE products"
    ON products FOR UPDATE TO authenticated
    USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant can DELETE products"
    ON products FOR DELETE TO authenticated
    USING (tenant_id = get_current_tenant());

-- Warehouses
DROP POLICY IF EXISTS "Tenant isolation for warehouses" ON warehouses;
CREATE POLICY "Tenant can SELECT warehouses"
    ON warehouses FOR SELECT TO authenticated
    USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant can INSERT warehouses"
    ON warehouses FOR INSERT TO authenticated
    WITH CHECK (tenant_id = get_current_tenant());
CREATE POLICY "Tenant can UPDATE warehouses"
    ON warehouses FOR UPDATE TO authenticated
    USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant can DELETE warehouses"
    ON warehouses FOR DELETE TO authenticated
    USING (tenant_id = get_current_tenant());

-- Inventory Transactions
DROP POLICY IF EXISTS "Tenant isolation for inventory_transactions" ON inventory_transactions;
CREATE POLICY "Tenant can SELECT transactions"
    ON inventory_transactions FOR SELECT TO authenticated
    USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant can INSERT transactions"
    ON inventory_transactions FOR INSERT TO authenticated
    WITH CHECK (tenant_id = get_current_tenant());
CREATE POLICY "Tenant can DELETE transactions"
    ON inventory_transactions FOR DELETE TO authenticated
    USING (tenant_id = get_current_tenant());

-- Leads
DROP POLICY IF EXISTS "Tenant isolation for leads" ON leads;
CREATE POLICY "Tenant can SELECT leads"
    ON leads FOR SELECT TO authenticated
    USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant can INSERT leads"
    ON leads FOR INSERT TO authenticated
    WITH CHECK (tenant_id = get_current_tenant());
CREATE POLICY "Tenant can UPDATE leads"
    ON leads FOR UPDATE TO authenticated
    USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant can DELETE leads"
    ON leads FOR DELETE TO authenticated
    USING (tenant_id = get_current_tenant());

-- Employees
DROP POLICY IF EXISTS "Tenant isolation for employees" ON employees;
CREATE POLICY "Tenant can SELECT employees"
    ON employees FOR SELECT TO authenticated
    USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant can INSERT employees"
    ON employees FOR INSERT TO authenticated
    WITH CHECK (tenant_id = get_current_tenant());
CREATE POLICY "Tenant can UPDATE employees"
    ON employees FOR UPDATE TO authenticated
    USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant can DELETE employees"
    ON employees FOR DELETE TO authenticated
    USING (tenant_id = get_current_tenant());

-- Attendance
DROP POLICY IF EXISTS "Tenant isolation for attendance" ON attendance;
CREATE POLICY "Tenant can SELECT attendance"
    ON attendance FOR SELECT TO authenticated
    USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant can INSERT attendance"
    ON attendance FOR INSERT TO authenticated
    WITH CHECK (tenant_id = get_current_tenant());
CREATE POLICY "Tenant can UPDATE attendance"
    ON attendance FOR UPDATE TO authenticated
    USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant can DELETE attendance"
    ON attendance FOR DELETE TO authenticated
    USING (tenant_id = get_current_tenant());
