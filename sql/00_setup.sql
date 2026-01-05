-- ================================================================================
-- 00. DATABASE SETUP & REALTIME CONFIGURATION
-- Description: Enable Supabase Realtime for core tables
-- ================================================================================

-- Enable Supabase Realtime for core tables
-- This allows the admin dashboard to update instantly when data changes.
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE user_sessions;
