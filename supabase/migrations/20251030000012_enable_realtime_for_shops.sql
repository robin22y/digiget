-- Enable Supabase Realtime for shops table
-- This allows real-time synchronization across all devices when settings are changed

-- Note: The shops table is already part of the supabase_realtime publication
-- This migration is a no-op placeholder for documentation purposes

-- Real-time features are enabled by default in Supabase
-- The SettingsPage.tsx component subscribes to postgres_changes events
-- Changes made on one device will automatically appear on all other devices
