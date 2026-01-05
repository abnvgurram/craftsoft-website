-- ================================================================================
-- 01. ADMINS - Admin Users & Authentication
-- Description: Admin user management and RLS policies for authentication
-- ================================================================================

-- Fix: Consolidate policies on 'admins' table
-- Restores admin lookup and profile management functionality.
DROP POLICY IF EXISTS "Allow lookup by admin_id" ON admins;
DROP POLICY IF EXISTS "Allow read own record" ON admins;
DROP POLICY IF EXISTS "admins_select" ON admins;
DROP POLICY IF EXISTS "Admins can read own record" ON admins;
DROP POLICY IF EXISTS "Allow public lookup" ON admins;
DROP POLICY IF EXISTS "Enable public lookup by admin_id" ON admins;

-- Policy for login lookup (allows anon to resolve admin_id -> email)
CREATE POLICY "Allow login lookup" ON admins
    FOR SELECT TO anon
    USING (true);

-- Policy for logged-in admins (allows reading own full record)
CREATE POLICY "Admins can read own record" ON admins
    FOR SELECT TO authenticated
    USING (id = (select auth.uid()));

-- Consolidate UPDATE policies
DROP POLICY IF EXISTS "Allow update own record" ON admins;
DROP POLICY IF EXISTS "admins_update" ON admins;
DROP POLICY IF EXISTS "Admins can update own record" ON admins;

CREATE POLICY "Admins can update own record" ON admins
    FOR UPDATE TO authenticated
    USING (id = (select auth.uid()))
    WITH CHECK (id = (select auth.uid()));
