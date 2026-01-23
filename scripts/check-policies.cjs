const { createClient } = require('@supabase/supabase-js');

const serviceUrl = 'https://gsrckjdcatezcvpdxzmp.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcmNramRjYXRlemN2cGR4em1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU2NTExNCwiZXhwIjoyMDgyMTQxMTE0fQ.ejOhBl8AEH_-4BLBheMmaXqjNcrcTZouSt1im-K6DT0';
const supabase = createClient(serviceUrl, serviceKey);

async function checkPolicies() {
    console.log('🔍 Checking RLS policies for table "profiles"...');

    const { data, error } = await supabase.rpc('get_policies', { table_name: 'profiles' });

    // If RPC doesn't exist, we can try a raw query via a temporary function or just check if we can read them
    if (error) {
        console.log('Falling back to direct query...');
        const { data: policies, error: queryError } = await supabase
            .from('pg_policies') // This might not be accessible via REST unless exposed
            .select('*')
            .eq('tablename', 'profiles');

        if (queryError) {
            console.error('❌ Could not fetch policies directly:', queryError.message);

            // Try another way: create a small function to list them
            const script = `
                CREATE OR REPLACE FUNCTION get_table_policies(t_name text)
                RETURNS TABLE (policy_name text, row_check text) AS $$
                BEGIN
                    RETURN QUERY SELECT policyname, qual::text FROM pg_policies WHERE tablename = t_name;
                END;
                $$ LANGUAGE plpgsql SECURITY DEFINER;
            `;
            console.log('You might need to run this in SQL Editor to check policies.');
        } else {
            console.table(policies);
        }
    } else {
        console.table(data);
    }
}

async function checkTableInfo() {
    const { data, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    console.log('Table "profiles" accessible:', !error);
    if (error) console.error(error.message);
}

checkTableInfo();
