-- ============================================
-- USER SESSIONS TABLE (Multi-Tab Support)
-- Tracks all active admin sessions per tab
-- Each tab has a unique session_token (TAB_ID)
-- ============================================

-- Drop existing table and recreate fresh
DROP TABLE IF EXISTS user_sessions CASCADE;

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL,  -- This is the TAB_ID (unique per browser tab)
    device_info TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW(),

    -- CRITICAL: Unique constraint on (admin_id, session_token)
    -- This ensures one row per tab per admin
    -- Prevents duplicate sessions and enables proper multi-tab management
    CONSTRAINT unique_admin_tab UNIQUE (admin_id, session_token)
);

-- Enable Row Level Security
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- Admins can only see/manage their own sessions
-- ============================================
DROP POLICY IF EXISTS "Admins can read own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Admins can insert own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Admins can update own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Admins can delete own sessions" ON user_sessions;

CREATE POLICY "Admins can read own sessions" ON user_sessions
    FOR SELECT USING (admin_id = auth.uid());

CREATE POLICY "Admins can insert own sessions" ON user_sessions
    FOR INSERT WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Admins can update own sessions" ON user_sessions
    FOR UPDATE USING (admin_id = auth.uid());

CREATE POLICY "Admins can delete own sessions" ON user_sessions
    FOR DELETE USING (admin_id = auth.uid());

-- ============================================
-- INDEXES
-- Optimized for multi-tab session lookups
-- ============================================

-- Primary lookup index: (admin_id + session_token)
-- Used by: deleteCurrentSession, isCurrentSessionValid, createSession
CREATE INDEX idx_sessions_admin_tab ON user_sessions(admin_id, session_token);

-- Secondary index for admin-only queries
-- Used by: deleteAllSessions, loadSessions
CREATE INDEX idx_sessions_admin_id ON user_sessions(admin_id);

-- ============================================
-- ENABLE REALTIME
-- Required for instant logout detection
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE user_sessions;

-- ============================================
-- CLEANUP FUNCTION
-- Removes sessions older than 30 days
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE last_active < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USAGE NOTES
-- ============================================
-- 
-- Normal Logout (single tab):
--   DELETE FROM user_sessions 
--   WHERE admin_id = ? AND session_token = ?
--   (Deletes only THIS tab's session)
--
-- Hard Logout (all sessions):
--   DELETE FROM user_sessions WHERE admin_id = ?
--   (Deletes ALL sessions for this admin)
--
-- Session Check:
--   SELECT id FROM user_sessions 
--   WHERE admin_id = ? AND session_token = ?
--   (Validates this specific tab's session exists)
--
