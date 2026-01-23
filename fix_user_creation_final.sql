-- OPTIMIZED RLS FIX FOR PROFILES
-- USES JWT METADATA FOR PERFORMANCE AND RELIABILITY

-- 1. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

-- 2. Policy: Admins (checked via JWT metadata) can do EVERYTHING
-- This is the most reliable way to grant admin access
CREATE POLICY "Admins can manage all profiles" ON profiles
FOR ALL TO authenticated
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' )
WITH CHECK ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- 3. Policy: All authenticated users can view profiles (needed for lists)
CREATE POLICY "View profiles" ON profiles
FOR SELECT TO authenticated
USING ( true );

-- 4. Policy: Users can update their own profile
CREATE POLICY "Update own profile" ON profiles
FOR UPDATE TO authenticated
USING ( id = auth.uid() );

-- 5. Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
