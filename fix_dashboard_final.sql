-- FINAL FIX for all "Infinite Recursion" policies
-- This script completely replaces the RLS logic to use safe, non-recursive functions.

-- 1. Create Helper Functions (Security Definer = Bypasses RLS)
-- These break the recursion by allowing safe lookups.

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_auth_client_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM clients WHERE user_id = auth.uid();
$$;

-- 2. CREATE STORAGE BUCKETS (If missing)
INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('user-assets', 'user-assets', true) ON CONFLICT (id) DO NOTHING;

-- Policy for Storage
DO $$ BEGIN
    DROP POLICY IF EXISTS "Authenticated can upload assets" ON storage.objects;
    CREATE POLICY "Authenticated can upload assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id IN ('company-assets', 'user-assets') );
    
    DROP POLICY IF EXISTS "Public can view assets" ON storage.objects;
    CREATE POLICY "Public can view assets" ON storage.objects FOR SELECT TO public USING ( bucket_id IN ('company-assets', 'user-assets') );
    
    DROP POLICY IF EXISTS "Authenticated can update assets" ON storage.objects;
    CREATE POLICY "Authenticated can update assets" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id IN ('company-assets', 'user-assets') );
END $$;


-- 3. RESET ALL POLICIES FOR KEY TABLES
-- We drop ALL existing policies to ensure no bad ones remain.

-- === CLIENTS ===
DROP POLICY IF EXISTS "Admin and HR can view all clients" ON clients;
DROP POLICY IF EXISTS "Admin and HR can manage clients" ON clients;
DROP POLICY IF EXISTS "Engineers can view their assigned clients" ON clients;
DROP POLICY IF EXISTS "Clients can view own client record" ON clients;

CREATE POLICY "Admin/HR view clients" ON clients FOR SELECT TO authenticated 
USING ( get_current_user_role() IN ('admin', 'hr') );

CREATE POLICY "Admin/HR manage clients" ON clients FOR ALL TO authenticated 
USING ( get_current_user_role() IN ('admin', 'hr') );

CREATE POLICY "Engineers view assigned clients" ON clients FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM engineer_assignments 
    WHERE engineer_id = auth.uid() 
    AND client_id = clients.id 
    AND is_active = true
  )
);

CREATE POLICY "Clients view own record" ON clients FOR SELECT TO authenticated 
USING ( user_id = auth.uid() );


-- === ENGINEER ASSIGNMENTS ===
DROP POLICY IF EXISTS "Admin and HR can view all assignments" ON engineer_assignments;
DROP POLICY IF EXISTS "Admin and HR can manage assignments" ON engineer_assignments;
DROP POLICY IF EXISTS "Engineers can view own assignments" ON engineer_assignments;
DROP POLICY IF EXISTS "Clients can view their assignments" ON engineer_assignments;

CREATE POLICY "Admin/HR view assignments" ON engineer_assignments FOR SELECT TO authenticated 
USING ( get_current_user_role() IN ('admin', 'hr') );

CREATE POLICY "Admin/HR manage assignments" ON engineer_assignments FOR ALL TO authenticated 
USING ( get_current_user_role() IN ('admin', 'hr') );

CREATE POLICY "Engineers view own assignments" ON engineer_assignments FOR SELECT TO authenticated 
USING ( engineer_id = auth.uid() );

CREATE POLICY "Clients view own assignments" ON engineer_assignments FOR SELECT TO authenticated 
USING ( client_id = get_auth_client_id() ); -- Uses Helper!


-- === CHECK INS ===
DROP POLICY IF EXISTS "Admin and HR can view all check-ins" ON check_ins;
DROP POLICY IF EXISTS "Engineers can view own check-ins" ON check_ins;
DROP POLICY IF EXISTS "Clients can view their engineers' check-ins" ON check_ins;
DROP POLICY IF EXISTS "Engineers can insert own check-ins" ON check_ins;
DROP POLICY IF EXISTS "Engineers can update own check-ins" ON check_ins;

CREATE POLICY "Admin/HR view check-ins" ON check_ins FOR SELECT TO authenticated 
USING ( get_current_user_role() IN ('admin', 'hr') );

CREATE POLICY "Engineers view own check-ins" ON check_ins FOR SELECT TO authenticated 
USING ( engineer_id = auth.uid() );

CREATE POLICY "Engineers insert own check-ins" ON check_ins FOR INSERT TO authenticated 
WITH CHECK ( engineer_id = auth.uid() );

CREATE POLICY "Engineers update own check-ins" ON check_ins FOR UPDATE TO authenticated 
USING ( engineer_id = auth.uid() );

CREATE POLICY "Clients view related check-ins" ON check_ins FOR SELECT TO authenticated 
USING (
    engineer_id IN (
        SELECT engineer_id FROM engineer_assignments
        WHERE client_id = get_auth_client_id() -- Uses Helper!
        AND is_active = true
    )
);


-- === DAILY REPORTS (Just in case) ===
DROP POLICY IF EXISTS "Admin and HR can view all reports" ON daily_reports;
DROP POLICY IF EXISTS "Admin and HR can update all reports" ON daily_reports;

CREATE POLICY "Admin/HR view reports" ON daily_reports FOR SELECT TO authenticated 
USING ( get_current_user_role() IN ('admin', 'hr') );

CREATE POLICY "Admin/HR update reports" ON daily_reports FOR UPDATE TO authenticated 
USING ( get_current_user_role() IN ('admin', 'hr') );

-- === LEAVE REQUESTS ===
DROP POLICY IF EXISTS "Admin and HR can view all leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Admin and HR can update leave requests" ON leave_requests;

CREATE POLICY "Admin/HR view leave" ON leave_requests FOR SELECT TO authenticated 
USING ( get_current_user_role() IN ('admin', 'hr') );

CREATE POLICY "Admin/HR update leave" ON leave_requests FOR UPDATE TO authenticated 
USING ( get_current_user_role() IN ('admin', 'hr') );
