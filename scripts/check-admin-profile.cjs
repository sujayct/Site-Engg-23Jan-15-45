const { createClient } = require('@supabase/supabase-js');

const serviceUrl = 'https://gsrckjdcatezcvpdxzmp.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcmNramRjYXRlemN2cGR4em1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU2NTExNCwiZXhwIjoyMDgyMTQxMTE0fQ.ejOhBl8AEH_-4BLBheMmaXqjNcrcTZouSt1im-K6DT0';
const supabase = createClient(serviceUrl, serviceKey);

async function check() {
    const email = 'admin-recovery@company.com';
    console.log(`🔍 Checking profile for: ${email}`);

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    if (profile) {
        console.log(`✅ Profile found: ID=${profile.id}, role=${profile.role}`);
    } else {
        console.log('❌ Profile NOT FOUND in database!');

        // Let's check if there's ANY admin
        const { data: admins } = await supabase.from('profiles').select('*').eq('role', 'admin');
        console.log(`Found ${admins?.length || 0} other admins.`);
        if (admins) admins.forEach(a => console.log(`- ${a.email}`));
    }
}

check();
