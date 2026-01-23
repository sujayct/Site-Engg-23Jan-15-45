-- Fix for "Infinite recursion detected" (Updated for compatibility)
-- Run this in the Supabase Dashboard SQL Editor

-- 1. Create a secure function to check user role (Returns TEXT to avoid type errors)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid();
$$;

-- 2. Initial cleanup of potentially conflicting policies
DROP POLICY IF EXISTS "Admin and HR can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin and HR can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON profiles;

-- 3. Recreate policies using the secure function (No recursion)

CREATE POLICY "Admin and HR can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'hr')
  );

CREATE POLICY "Admin and HR can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'hr')
  );

CREATE POLICY "Admin can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() = 'admin'
  );

-- 4. Safe update for other tables (only if they exist)
DO $$
BEGIN
    -- Clients
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
        DROP POLICY IF EXISTS "Admin and HR can view all clients" ON clients;
        DROP POLICY IF EXISTS "Admin and HR can manage clients" ON clients;
        
        EXECUTE 'CREATE POLICY "Admin and HR can view all clients" ON clients FOR SELECT TO authenticated USING ( get_current_user_role() IN (''admin'', ''hr'') )';
        EXECUTE 'CREATE POLICY "Admin and HR can manage clients" ON clients FOR ALL TO authenticated USING ( get_current_user_role() IN (''admin'', ''hr'') )';
    END IF;

    -- Sites
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sites') THEN
        DROP POLICY IF EXISTS "Admin and HR can view all sites" ON sites;
        DROP POLICY IF EXISTS "Admin and HR can manage sites" ON sites;

        EXECUTE 'CREATE POLICY "Admin and HR can view all sites" ON sites FOR SELECT TO authenticated USING ( get_current_user_role() IN (''admin'', ''hr'') )';
        EXECUTE 'CREATE POLICY "Admin and HR can manage sites" ON sites FOR ALL TO authenticated USING ( get_current_user_role() IN (''admin'', ''hr'') )';
    END IF;

    -- Daily Reports
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_reports') THEN
        DROP POLICY IF EXISTS "Admin and HR can view all reports" ON daily_reports;
        
        EXECUTE 'CREATE POLICY "Admin and HR can view all reports" ON daily_reports FOR SELECT TO authenticated USING ( get_current_user_role() IN (''admin'', ''hr'') )';
    END IF;
END $$;
