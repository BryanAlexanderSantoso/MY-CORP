-- Fix attendance RLS policies (ensure all CRUD operations work)
DROP POLICY IF EXISTS "Tenant SELECT attendance" ON attendance;
DROP POLICY IF EXISTS "Tenant INSERT attendance" ON attendance;
DROP POLICY IF EXISTS "Tenant UPDATE attendance" ON attendance;
DROP POLICY IF EXISTS "Tenant DELETE attendance" ON attendance;

CREATE POLICY "Tenant SELECT attendance" ON attendance FOR SELECT TO authenticated USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant INSERT attendance" ON attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Tenant UPDATE attendance" ON attendance FOR UPDATE TO authenticated USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant DELETE attendance" ON attendance FOR DELETE TO authenticated USING (tenant_id = get_current_tenant());
