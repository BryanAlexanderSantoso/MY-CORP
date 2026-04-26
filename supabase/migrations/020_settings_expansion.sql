-- ##################################################################
-- 020: Settings Expansion Additions
-- Add fields for security, webhooks, and branding
-- ##################################################################

ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS require_2fa BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS password_policy VARCHAR(50) DEFAULT 'standard',
    ADD COLUMN IF NOT EXISTS webhook_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS webhook_secret TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS theme_color VARCHAR(50) DEFAULT 'slate';
