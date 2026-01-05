-- ================================================================================
-- 10. SETTINGS - Global Institute Settings
-- Description: Global institute settings and configuration.
-- ================================================================================

CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active admins can read settings" ON settings;
DROP POLICY IF EXISTS "Active admins can insert settings" ON settings;
DROP POLICY IF EXISTS "Active admins can update settings" ON settings;

CREATE POLICY "Active admins can read settings" ON settings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admins WHERE id = (select auth.uid()) AND status = 'ACTIVE')
    );

CREATE POLICY "Active admins can insert settings" ON settings
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM admins WHERE id = (select auth.uid()) AND status = 'ACTIVE')
    );

CREATE POLICY "Active admins can update settings" ON settings
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM admins WHERE id = (select auth.uid()) AND status = 'ACTIVE')
    );

-- Default Settings (Insert if not exists)
INSERT INTO settings (setting_key, setting_value) VALUES
    ('institute_name', 'Abhi''s Craftsoft'),
    ('country', 'India'),
    ('inactivity_timeout', '30')
ON CONFLICT (setting_key) DO NOTHING;
