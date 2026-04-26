-- Fix profiles that have null tenant_id
-- This links any orphaned profile to the first available organization
UPDATE profiles
SET tenant_id = (
    SELECT o.id FROM organizations o LIMIT 1
)
WHERE tenant_id IS NULL
  AND EXISTS (SELECT 1 FROM organizations);

-- Verify
SELECT id, full_name, email, tenant_id, role FROM profiles;
