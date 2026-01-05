-- ================================================================================
-- 06. INQUIRIES - Leads & Inquiries
-- Description: Leads and inquiries from website and walk-ins.
-- ================================================================================

CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    courses TEXT[],
    source TEXT DEFAULT 'Walk-in' CHECK (source IN ('Walk-in', 'Website', 'Call', 'WhatsApp', 'Instagram')),
    demo_required BOOLEAN DEFAULT false,
    demo_date DATE,
    demo_time TEXT,
    status TEXT DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Demo Scheduled', 'Converted', 'Closed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active admins can read inquiries" ON inquiries;
DROP POLICY IF EXISTS "Active admins can insert inquiries" ON inquiries;
DROP POLICY IF EXISTS "Active admins can update inquiries" ON inquiries;
DROP POLICY IF EXISTS "Active admins can delete inquiries" ON inquiries;

CREATE POLICY "Active admins can read inquiries" ON inquiries
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admins WHERE id = (select auth.uid()) AND status = 'ACTIVE')
    );

CREATE POLICY "Active admins can insert inquiries" ON inquiries
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM admins WHERE id = (select auth.uid()) AND status = 'ACTIVE')
    );

CREATE POLICY "Active admins can update inquiries" ON inquiries
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM admins WHERE id = (select auth.uid()) AND status = 'ACTIVE')
    );

CREATE POLICY "Active admins can delete inquiries" ON inquiries
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM admins WHERE id = (select auth.uid()) AND status = 'ACTIVE')
    );

-- Website Submission Policy (allows public form submissions)
DROP POLICY IF EXISTS "Allow public inquiry submission" ON inquiries;
CREATE POLICY "Allow public inquiry submission" ON inquiries
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);

-- Trigger: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inquiries_updated_at ON inquiries;
CREATE TRIGGER inquiries_updated_at
    BEFORE UPDATE ON inquiries
    FOR EACH ROW EXECUTE FUNCTION update_inquiries_updated_at();
