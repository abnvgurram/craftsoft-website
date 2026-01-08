-- ================================================================================
-- 02. SERVICES - Specialized Services
-- Description: Manages specialized services offered by the institute.
-- ================================================================================

DROP TABLE IF EXISTS services CASCADE;
CREATE TABLE services (
    id BIGSERIAL PRIMARY KEY,
    service_id TEXT UNIQUE, -- e.g. Serv-001
    service_code TEXT UNIQUE, -- e.g. GD, UXD
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read services" ON services;
CREATE POLICY "Allow public read services" ON services
    FOR SELECT TO anon
    USING (true);

DROP POLICY IF EXISTS "Allow admin all services" ON services;
DROP POLICY IF EXISTS "Active admins can manage services" ON services;
CREATE POLICY "Active admins can manage services" ON services
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND status = 'ACTIVE')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND status = 'ACTIVE')
    );

-- Public read for verification portal

DROP POLICY IF EXISTS "Public can read services" ON services;
CREATE POLICY "Public can read services" ON services
    FOR SELECT TO public
    USING (true);

