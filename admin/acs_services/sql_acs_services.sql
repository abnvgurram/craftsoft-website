-- Create Service Management Table
-- Prefix: Sr-ACS-XXX
CREATE TABLE IF NOT EXISTS services (
    id BIGSERIAL PRIMARY KEY,
    service_id TEXT UNIQUE, -- e.g. Sr-ACS-001
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read services" ON services;
CREATE POLICY "Allow public read services" ON services
    FOR SELECT
    TO anon
    USING (true);

DROP POLICY IF EXISTS "Allow admin all services" ON services;
CREATE POLICY "Allow admin all services" ON services
    FOR ALL
    TO authenticated
    USING (true);
