-- Add direct name fields to employees so we can add employees without auth accounts
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS full_name TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS designation TEXT,
    ADD COLUMN IF NOT EXISTS joined_at DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS base_salary DECIMAL(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';

-- Make profile_id optional (an employee doesn't need a system account)
ALTER TABLE employees ALTER COLUMN profile_id DROP NOT NULL;
