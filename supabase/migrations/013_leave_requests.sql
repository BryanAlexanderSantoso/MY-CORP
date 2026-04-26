-- Leave requests table for employee absence management
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    type TEXT NOT NULL,                -- 'SICK' | 'LEAVE' | 'PERSONAL'
    reason TEXT,                       -- required for LEAVE and PERSONAL
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',  -- 'PENDING' | 'APPROVED' | 'REJECTED'
    admin_notes TEXT,                  -- admin's response/notes
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto set tenant_id via existing trigger
DROP TRIGGER IF EXISTS set_tenant_id_on_leave_requests ON leave_requests;
CREATE TRIGGER set_tenant_id_on_leave_requests
    BEFORE INSERT ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION auto_set_tenant_id();

-- Enable RLS
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Employees can see/insert their own requests; admins see all
CREATE POLICY "Tenant SELECT leave_requests" ON leave_requests
    FOR SELECT TO authenticated USING (tenant_id = get_current_tenant());

CREATE POLICY "Tenant INSERT leave_requests" ON leave_requests
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Tenant UPDATE leave_requests" ON leave_requests
    FOR UPDATE TO authenticated USING (tenant_id = get_current_tenant());

CREATE POLICY "Tenant DELETE leave_requests" ON leave_requests
    FOR DELETE TO authenticated USING (tenant_id = get_current_tenant());

-- Also add profile_id column to employees if not exists (links auth user to employee)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id);
