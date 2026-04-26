-- ##################################################################
-- FIX: Repair employees with NULL tenant_id
-- 
-- Employees inserted via the service-role API had their tenant_id
-- overwritten to NULL by the old auto_set_tenant_id trigger.
-- This migration links them back using their profile's tenant_id.
-- ##################################################################

-- Fix employees whose tenant_id is NULL but have a valid profile_id
UPDATE employees e
SET tenant_id = p.tenant_id
FROM profiles p
WHERE e.profile_id = p.id
  AND e.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- Verify the fix
SELECT e.id, e.full_name, e.email, e.tenant_id, e.profile_id, p.tenant_id as profile_tenant
FROM employees e
LEFT JOIN profiles p ON e.profile_id = p.id;
