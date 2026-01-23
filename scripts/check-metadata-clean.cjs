const { createClient } = require('@supabase/supabase-js');

const serviceUrl = 'https://gsrckjdcatezcvpdxzmp.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcmNramRjYXRlemN2cGR4em1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU2NTExNCwiZXhwIjoyMDgyMTQxMTE0fQ.ejOhBl8AEH_-4BLBheMmaXqjNcrcTZouSt1im-K6DT0';
const supabase = createClient(serviceUrl, serviceKey);

async function check() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error(error);
        return;
    }

    users.forEach(u => {
        console.log(`${u.email} | ID: ${u.id} | Metadata Role: ${u.user_metadata?.role}`);
    });
}

check();
