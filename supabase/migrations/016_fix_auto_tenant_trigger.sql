-- ##################################################################
-- FIX: auto_set_tenant_id trigger overwrites explicit tenant_id
-- 
-- Problem: When the employee-register API inserts into 'employees'
-- using the service-role client (adminClient), the trigger fires and
-- calls get_current_tenant(). But auth.uid() is NULL for service-role,
-- so get_current_tenant() returns NULL, overwriting the explicit
-- tenant_id that was passed in the INSERT statement.
--
-- Solution: Only set tenant_id when NEW.tenant_id IS NULL.
-- This preserves explicitly provided values (e.g., from API routes).
-- ##################################################################

CREATE OR REPLACE FUNCTION auto_set_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only auto-set if tenant_id was not explicitly provided
    IF NEW.tenant_id IS NULL THEN
        NEW.tenant_id := get_current_tenant();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also add an RLS policy so employees can SELECT their own record
-- even before get_current_tenant fully resolves (belt-and-suspenders)
-- This ensures .eq('profile_id', user.id) always works for own record.
DROP POLICY IF EXISTS "Employees can view own record" ON employees;
CREATE POLICY "Employees can view own record"
    ON employees FOR SELECT TO authenticated
    USING (profile_id = auth.uid());
