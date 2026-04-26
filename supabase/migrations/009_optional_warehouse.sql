-- Make warehouse_id optional in inventory_transactions
ALTER TABLE inventory_transactions
    ALTER COLUMN warehouse_id DROP NOT NULL;
