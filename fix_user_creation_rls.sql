-- FINAL RLS FIX FOR PROFILES TABLE
-- Run this in Supabase SQL Editor to allow Admins to manage all users

-- 1. Ensure get_current_user_role() exists and is robust
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT role FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$;

-- 2. Drop existing restrictive policies on profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON profiles;

-- 3. Policy: Admins can do EVERYTHING
CREATE POLICY "Admins can manage all profiles" ON profiles
FOR ALL TO authenticated
USING ( get_current_user_role() = 'admin' )
WITH CHECK ( get_current_user_role() = 'admin' );

-- 4. Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT TO authenticated
USING ( id = auth.uid() );

-- 5. Policy: Users can update their own profile (basic fields)
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE TO authenticated
USING ( id = auth.uid() );

-- 6. Policy: Authenticated users can view basic info of others (needed for lists/assignments)
CREATE POLICY "Authenticated users can view profiles" ON profiles
FOR SELECT TO authenticated
USING ( true );

-- 7. Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
