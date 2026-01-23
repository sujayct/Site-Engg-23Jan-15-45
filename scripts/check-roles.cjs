const { createClient } = require('@supabase/supabase-js');

const serviceUrl = 'https://gsrckjdcatezcvpdxzmp.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcmNramRjYXRlemN2cGR4em1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU2NTExNCwiZXhwIjoyMDgyMTQxMTE0fQ.ejOhBl8AEH_-4BLBheMmaXqjNcrcTZouSt1im-K6DT0';
const supabase = createClient(serviceUrl, serviceKey);

async function check() {
    console.log('🔍 Checking users and their roles...');

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

    if (error) {
        console.error('❌ Error fetching profiles:', error.message);
        return;
    }

    console.table(profiles.map(p => ({
        id: p.id,
        email: p.email,
        role: p.role,
        name: p.full_name
    })));

    // Check specifically for an admin user
    const admin = profiles.find(p => p.role === 'admin' || p.email?.includes('admin'));
    if (admin) {
        console.log(`\n✅ Admin found: ${admin.email} (Role: ${admin.role})`);
    } else {
        console.log('\n❌ NO ADMIN USER FOUND in profiles table!');
    }
}

check();
