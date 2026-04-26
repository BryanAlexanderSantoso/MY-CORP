-- ##################################################################
-- Add work schedule settings to organizations table
-- Admin can configure clock-in and clock-out times
-- ##################################################################

ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS work_start_time TIME DEFAULT '09:00',
    ADD COLUMN IF NOT EXISTS work_end_time TIME DEFAULT '17:00';

-- Allow admin to update organization work schedule
-- (policy already exists for SELECT, need UPDATE)
