-- FIX MISSING POLICIES (Profiles & Engineers)
-- Run this in Supabase SQL Editor

-- 1. Restore Basic Profile Access (Required for Login)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated 
USING ( id = auth.uid() );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated 
USING ( id = auth.uid() );

-- 2. Fix Engineers Table RLS (If table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'engineers') THEN
        -- Enable RLS
        ALTER TABLE engineers ENABLE ROW LEVEL SECURITY;
        
        -- Admin/HR Full Access
        DROP POLICY IF EXISTS "Admin/HR manage engineers" ON engineers;
        EXECUTE 'CREATE POLICY "Admin/HR manage engineers" ON engineers FOR ALL TO authenticated USING ( get_current_user_role() IN (''admin'', ''hr'') )';
        
        -- Engineers View Self
        DROP POLICY IF EXISTS "Engineers view self" ON engineers;
        EXECUTE 'CREATE POLICY "Engineers view self" ON engineers FOR SELECT TO authenticated USING ( id = auth.uid() )'; -- Assuming id matches auth.uid
        
        -- Clients View Assigned
        DROP POLICY IF EXISTS "Clients view assigned engineers" ON engineers;
         -- (Complex join omitted for safety, usually clients just view assignments which link to profiles/engineers)
         -- But we grant SELECT to authenticated for now so lists work, or restrict?
         -- Let's stick to safe defaults.
    END IF;
END $$;
