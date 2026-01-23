-- COMPREHENSIVE FIX for Dashboard Errors and Storage
-- Run this in Supabase Dashboard SQL Editor

-- 1. Create Data Buckets (Fixes "Bucket not found" errors)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-assets', 'company-assets', true) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-assets', 'user-assets', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. Add Storage Policies (if missing)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated can upload assets') THEN
        CREATE POLICY "Authenticated can upload assets" ON storage.objects FOR INSERT TO authenticated 
        WITH CHECK ( bucket_id IN ('company-assets', 'user-assets') );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public can view assets') THEN
        CREATE POLICY "Public can view assets" ON storage.objects FOR SELECT TO public 
        USING ( bucket_id IN ('company-assets', 'user-assets') );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated can update assets') THEN
        CREATE POLICY "Authenticated can update assets" ON storage.objects FOR UPDATE TO authenticated 
        USING ( bucket_id IN ('company-assets', 'user-assets') );
    END IF;
END $$;


-- 3. Update RLS Policies for Remaining Tables (Fixes 500 Errors)
-- Uses the secure function get_current_user_role() created previously

DO $$
BEGIN
    -- Fix Engineer Assignments
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'engineer_assignments') THEN
        DROP POLICY IF EXISTS "Admin and HR can view all assignments" ON engineer_assignments;
        DROP POLICY IF EXISTS "Admin and HR can manage assignments" ON engineer_assignments;
        
        EXECUTE 'CREATE POLICY "Admin and HR can view all assignments" ON engineer_assignments FOR SELECT TO authenticated USING ( get_current_user_role() IN (''admin'', ''hr'') )';
        EXECUTE 'CREATE POLICY "Admin and HR can manage assignments" ON engineer_assignments FOR ALL TO authenticated USING ( get_current_user_role() IN (''admin'', ''hr'') )';
    END IF;

    -- Fix Check-ins
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'check_ins') THEN
        DROP POLICY IF EXISTS "Admin and HR can view all check-ins" ON check_ins;
        
        EXECUTE 'CREATE POLICY "Admin and HR can view all check-ins" ON check_ins FOR SELECT TO authenticated USING ( get_current_user_role() IN (''admin'', ''hr'') )';
    END IF;

    -- Fix Leave Requests
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leave_requests') THEN
        DROP POLICY IF EXISTS "Admin and HR can view all leave requests" ON leave_requests;
        DROP POLICY IF EXISTS "Admin and HR can update leave requests" ON leave_requests;
        
        EXECUTE 'CREATE POLICY "Admin and HR can view all leave requests" ON leave_requests FOR SELECT TO authenticated USING ( get_current_user_role() IN (''admin'', ''hr'') )';
        EXECUTE 'CREATE POLICY "Admin and HR can update leave requests" ON leave_requests FOR UPDATE TO authenticated USING ( get_current_user_role() IN (''admin'', ''hr'') )';
    END IF;

    -- Fix Company Profiles
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'company_profiles') THEN
        DROP POLICY IF EXISTS "Admin can manage company profiles" ON company_profiles;
        
        EXECUTE 'CREATE POLICY "Admin can manage company profiles" ON company_profiles FOR ALL TO authenticated USING ( get_current_user_role() = ''admin'' )';
    END IF;

    -- Fix Email Logs
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_logs') THEN
        DROP POLICY IF EXISTS "Admin and HR can view email logs" ON email_logs;
        
        EXECUTE 'CREATE POLICY "Admin and HR can view email logs" ON email_logs FOR SELECT TO authenticated USING ( get_current_user_role() IN (''admin'', ''hr'') )';
    END IF;
    
    -- Ensure Clients/Sites/Reports are definitely updated just in case
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
         DROP POLICY IF EXISTS "Admin and HR can view all clients" ON clients;
         EXECUTE 'CREATE POLICY "Admin and HR can view all clients" ON clients FOR SELECT TO authenticated USING ( get_current_user_role() IN (''admin'', ''hr'') )';
    END IF;
END $$;
