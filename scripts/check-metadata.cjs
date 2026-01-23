const { createClient } = require('@supabase/supabase-js');

const serviceUrl = 'https://gsrckjdcatezcvpdxzmp.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcmNramRjYXRlemN2cGR4em1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU2NTExNCwiZXhwIjoyMDgyMTQxMTE0fQ.ejOhBl8AEH_-4BLBheMmaXqjNcrcTZouSt1im-K6DT0';
const supabase = createClient(serviceUrl, serviceKey);

async function check() {
    console.log('🔍 Checking user roles and metadata...');

    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error('❌ Error fetching users:', error.message);
        return;
    }

    console.table(users.map(u => ({
        id: u.id,
        email: u.email,
        role_in_metadata: u.user_metadata?.role,
        full_name: u.user_metadata?.full_name
    })));
}

check();
