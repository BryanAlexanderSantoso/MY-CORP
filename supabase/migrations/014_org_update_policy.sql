-- Add UPDATE policy for organizations (owner can update their own org)
DROP POLICY IF EXISTS "Owner can update their organization" ON organizations;
CREATE POLICY "Owner can update their organization"
    ON organizations FOR UPDATE TO authenticated
    USING (id = get_current_tenant());
