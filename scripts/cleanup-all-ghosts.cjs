const { createClient } = require('@supabase/supabase-js');

const serviceUrl = 'https://gsrckjdcatezcvpdxzmp.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcmNramRjYXRlemN2cGR4em1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU2NTExNCwiZXhwIjoyMDgyMTQxMTE0fQ.ejOhBl8AEH_-4BLBheMmaXqjNcrcTZouSt1im-K6DT0';
const supabase = createClient(serviceUrl, serviceKey);

const GHOSTS = ['sujay.palande@cybaemtech.com', 'cvgbhjk@cybaemtech.com'];

async function cleanup() {
    console.log(`🧹 Cleaning up ghost users: ${GHOSTS.join(', ')}`);

    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('❌ Error listing users:', authError.message);
        return;
    }

    for (const email of GHOSTS) {
        const authUser = users.find(u => u.email === email);
        if (authUser) {
            const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id);
            if (deleteError) {
                console.error(`❌ Error deleting ${email}:`, deleteError.message);
            } else {
                console.log(`✅ ${email} successfully deleted from Supabase Auth.`);
            }
        }
    }
}

cleanup();
