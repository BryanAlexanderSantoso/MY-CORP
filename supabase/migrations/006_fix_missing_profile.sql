-- ##################################################################
-- STEP 1: Run this query FIRST to see your user ID
-- Copy the ID from the result below
-- ##################################################################

SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC;


-- ##################################################################
-- STEP 2: After you get the ID from above, run this block.
-- Replace 'PASTE_YOUR_USER_ID_HERE' with the actual UUID from step 1
-- ##################################################################

DO $$
DECLARE
    v_user_id UUID := 'PASTE_YOUR_USER_ID_HERE';  -- ← GANTI INI
    v_org_id  UUID;
BEGIN
    -- Create organization
    INSERT INTO organizations (name, slug, owner_id)
    VALUES ('My Organization', 'my-org-' || substring(v_user_id::text, 1, 8), v_user_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_org_id;

    -- If org already exists, get it
    IF v_org_id IS NULL THEN
        SELECT id INTO v_org_id FROM organizations WHERE owner_id = v_user_id LIMIT 1;
    END IF;

    -- If still no org, raise error
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Could not create or find organization.';
    END IF;

    -- Create or update profile
    INSERT INTO profiles (id, tenant_id, full_name, role)
    VALUES (v_user_id, v_org_id, 'Admin User', 'OWNER')
    ON CONFLICT (id) DO UPDATE
        SET tenant_id = v_org_id, role = 'OWNER';

    RAISE NOTICE 'Success! User %, Org %', v_user_id, v_org_id;
END;
$$;
