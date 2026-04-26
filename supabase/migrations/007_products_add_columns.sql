-- Add missing columns to products table
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS min_stock INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN IF NOT EXISTS current_stock INTEGER NOT NULL DEFAULT 0;
