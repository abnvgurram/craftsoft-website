-- ================================================================================
-- 09. ACTIVITIES - Audit Log
-- Description: Audit log for admin actions.
-- ================================================================================

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type TEXT NOT NULL,
    activity_name TEXT NOT NULL,
    activity_link TEXT,
    admin_id UUID REFERENCES admins(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active admins can read activities" ON activities;
DROP POLICY IF EXISTS "Active admins can insert activities" ON activities;
DROP POLICY IF EXISTS "Active admins can delete activities" ON activities;

CREATE POLICY "Active admins can read activities" ON activities
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admins WHERE id = (select auth.uid()) AND status = 'ACTIVE')
    );

CREATE POLICY "Active admins can insert activities" ON activities
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM admins WHERE id = (select auth.uid()) AND status = 'ACTIVE')
    );

CREATE POLICY "Active admins can delete activities" ON activities
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM admins WHERE id = (select auth.uid()) AND status = 'ACTIVE')
    );

CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);
