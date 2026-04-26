-- ##################################################################
-- 1. CORE & AUTH
-- ##################################################################

-- Organizations Table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Profiles Table (Links Auth users to Organizations/Tenants)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES organizations(id),
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'STAFF', -- OWNER, ADMIN, STAFF
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Helper Function for Tenant Context
CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS UUID AS $$
    SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- RLS Policies for Profiles
CREATE POLICY "Users can view their own profile and colleague's profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (tenant_id = get_current_tenant());

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- RLS Policies for Organizations
CREATE POLICY "Users can view their organization"
    ON organizations FOR SELECT
    TO authenticated
    USING (id = get_current_tenant());

-- ##################################################################
-- 2. INVENTORY ENGINE (Double-Entry)
-- ##################################################################

CREATE TYPE inventory_transaction_type AS ENUM ('PURCHASE', 'SALE', 'ADJUSTMENT', 'TRANSFER', 'RETURN');

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, sku)
);

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- The Ledger (Core of double-entry inventory)
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id),
    product_id UUID NOT NULL REFERENCES products(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    quantity DECIMAL(15,2) NOT NULL, -- Positive for stock IN, Negative for stock OUT
    transaction_type inventory_transaction_type NOT NULL,
    reference_id UUID, -- Links to Sale Item, Purchase Order, etc.
    batch_number TEXT,
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_inv_tenant_product ON inventory_transactions(tenant_id, product_id);
CREATE INDEX idx_inv_warehouse ON inventory_transactions(warehouse_id);

-- Enable RLS for Inventory
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenant isolation for products" ON products FOR ALL TO authenticated USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant isolation for warehouses" ON warehouses FOR ALL TO authenticated USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant isolation for inventory_transactions" ON inventory_transactions FOR ALL TO authenticated USING (tenant_id = get_current_tenant());

-- View for Current Stock
CREATE OR REPLACE VIEW stock_ledger AS
SELECT 
    tenant_id,
    product_id,
    warehouse_id,
    SUM(quantity) as total_stock
FROM inventory_transactions
GROUP BY tenant_id, product_id, warehouse_id;

-- ##################################################################
-- 3. CRM & SALES
-- ##################################################################

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'NEW',
    source TEXT,
    lead_score INTEGER DEFAULT 0,
    assigned_to UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    last_interaction TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for leads" ON leads FOR ALL TO authenticated USING (tenant_id = get_current_tenant());

-- ##################################################################
-- 4. HRM & PAYROLL
-- ##################################################################

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id),
    profile_id UUID UNIQUE REFERENCES profiles(id),
    department TEXT,
    salary_base DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_pph21_status TEXT, -- PTKP status
    bpjs_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
    clock_out TIMESTAMPTZ,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for employees" ON employees FOR ALL TO authenticated USING (tenant_id = get_current_tenant());
CREATE POLICY "Tenant isolation for attendance" ON attendance FOR ALL TO authenticated USING (tenant_id = get_current_tenant());
