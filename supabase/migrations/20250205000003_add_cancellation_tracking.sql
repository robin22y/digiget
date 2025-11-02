-- Add cancellation tracking fields to shops table
ALTER TABLE shops ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired'));
ALTER TABLE shops ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(100);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS cancellation_feedback TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;

-- Add comments
COMMENT ON COLUMN shops.subscription_status IS 'Current subscription status: active, cancelled, or expired';
COMMENT ON COLUMN shops.subscription_end_date IS 'Date when subscription access ends (for cancelled subscriptions, 30 days from cancellation)';
COMMENT ON COLUMN shops.cancellation_reason IS 'Reason selected by owner when cancelling (too_expensive, not_using, etc.)';
COMMENT ON COLUMN shops.cancellation_feedback IS 'Optional free-text feedback provided by owner when cancelling';
COMMENT ON COLUMN shops.cancelled_at IS 'Timestamp when subscription was cancelled';

