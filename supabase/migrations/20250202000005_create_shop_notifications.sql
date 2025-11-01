-- Create shop_notifications table for security and access notifications
CREATE TABLE IF NOT EXISTS shop_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification details
  notification_type TEXT NOT NULL CHECK (notification_type IN ('login_attempt', 'clock_in_attempt', 'remote_access')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Employee info (if applicable)
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  employee_name TEXT,
  
  -- Location info
  attempt_latitude DECIMAL(10, 8),
  attempt_longitude DECIMAL(11, 8),
  distance_from_shop DECIMAL(10, 2), -- in meters
  location_name TEXT,
  
  -- Device and network info
  device_info JSONB, -- {userAgent, platform, vendor, language, screenResolution}
  ip_address TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE shop_notifications ENABLE ROW LEVEL SECURITY;

-- Shop owners can view their shop's notifications
CREATE POLICY "Shop owners can view their notifications"
  ON shop_notifications
  FOR SELECT
  TO authenticated
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- Anyone can create notifications (for staff portal access tracking)
CREATE POLICY "Anyone can create notifications"
  ON shop_notifications
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can create notifications"
  ON shop_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Shop owners can mark notifications as read
CREATE POLICY "Shop owners can update their notifications"
  ON shop_notifications
  FOR UPDATE
  TO authenticated
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shop_notifications_shop_id ON shop_notifications(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_notifications_employee_id ON shop_notifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_shop_notifications_type ON shop_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_shop_notifications_created_at ON shop_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_notifications_is_read ON shop_notifications(is_read);

COMMENT ON TABLE shop_notifications IS 'Stores security notifications for shop owners about login attempts, clock-in attempts, and remote access from distant locations';
COMMENT ON COLUMN shop_notifications.distance_from_shop IS 'Distance in meters from shop location. NULL if location unavailable.';
COMMENT ON COLUMN shop_notifications.device_info IS 'JSON object containing device information like user agent, platform, etc.';

