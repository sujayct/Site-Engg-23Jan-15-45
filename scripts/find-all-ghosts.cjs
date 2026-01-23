const { createClient } = require('@supabase/supabase-js');

const serviceUrl = 'https://gsrckjdcatezcvpdxzmp.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcmNramRjYXRlemN2cGR4em1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU2NTExNCwiZXhwIjoyMDgyMTQxMTE0fQ.ejOhBl8AEH_-4BLBheMmaXqjNcrcTZouSt1im-K6DT0';
const supabase = createClient(serviceUrl, serviceKey);

async function scan() {
    console.log('🔍 Scanning for ghost users (In Auth but missing Profile)...');

    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('❌ Error listing users:', authError.message);
        return;
    }

    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email');

    if (profileError) {
        console.error('❌ Error fetching profiles:', profileError.message);
        return;
    }

    const profileIds = new Set(profiles.map(p => p.id));
    const ghostUsers = users.filter(u => !profileIds.has(u.id));

    if (ghostUsers.length > 0) {
        console.log(`⚠️  Detected ${ghostUsers.length} ghost users:`);
        ghostUsers.forEach(u => {
            console.log(`- ${u.email} (ID: ${u.id})`);
        });
        console.log('\nUse a cleanup script to remove these if you want to re-register them.');
    } else {
        console.log('✅ No ghost users detected. All users are correctly synced.');
    }
}

scan();
