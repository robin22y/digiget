-- ================================================
-- Fix orphaned customer_id in loyalty_transactions,
-- then add FK to customers(id)
-- ================================================

-- 1. Set orphaned customer_id values to NULL
UPDATE loyalty_transactions
SET customer_id = NULL
WHERE customer_id IS NOT NULL
  AND customer_id NOT IN (SELECT id FROM customers);

-- 2. Create the FK constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'loyalty_transactions'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'loyalty_transactions_customer_id_fkey'
  ) THEN
    ALTER TABLE loyalty_transactions
      ADD CONSTRAINT loyalty_transactions_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Done!
