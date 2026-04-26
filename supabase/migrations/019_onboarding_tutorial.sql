-- ##################################################################
-- 019: Onboarding & Tutorials Additions
-- Add onboarding flags for organizations and employees
-- ##################################################################

ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS tutorial_completed BOOLEAN DEFAULT false;
