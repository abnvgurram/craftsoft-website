-- ============================================
-- SETTINGS TABLE
-- ============================================
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
        EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND status = 'ACTIVE')
    );

CREATE POLICY "Active admins can insert settings" ON settings
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND status = 'ACTIVE')
    );

CREATE POLICY "Active admins can update settings" ON settings
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND status = 'ACTIVE')
    );

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(setting_key);

-- ============================================
-- DEFAULT SETTINGS (Run once)
-- ============================================
INSERT INTO settings (setting_key, setting_value) VALUES
    ('institute_name', 'Abhi''s Craftsoft'),
    ('address_line_1', ''),
    ('address_line_2', ''),
    ('address_line_3', ''),
    ('address_line_4', ''),
    ('pincode', ''),
    ('state', ''),
    ('country', 'India'),
    ('primary_phone', ''),
    ('secondary_phone', ''),
    ('contact_email', ''),
    ('bank_account_number', ''),
    ('bank_ifsc_code', ''),
    ('bank_branch_name', ''),
    ('upi_id', ''),
    ('inactivity_timeout', '30')
ON CONFLICT (setting_key) DO NOTHING;
