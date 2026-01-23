const { createClient } = require('@supabase/supabase-js');

const serviceUrl = 'https://gsrckjdcatezcvpdxzmp.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcmNramRjYXRlemN2cGR4em1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU2NTExNCwiZXhwIjoyMDgyMTQxMTE0fQ.ejOhBl8AEH_-4BLBheMmaXqjNcrcTZouSt1im-K6DT0';
const supabase = createClient(serviceUrl, serviceKey);

const TARGET_EMAIL = 'sujay.palande@cybaemtech.com';

async function cleanup() {
    console.log(`🧹 Cleaning up ghost user: ${TARGET_EMAIL}`);

    // 1. Find the user ID in Auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('❌ Error listing users:', authError.message);
        return;
    }

    const authUser = users.find(u => u.email === TARGET_EMAIL);
    if (!authUser) {
        console.log('✅ User not found in Auth. Nothing to clean.');
        return;
    }

    // 2. Delete from Auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id);
    if (deleteError) {
        console.error('❌ Error deleting user from Auth:', deleteError.message);
    } else {
        console.log('✅ User successfully deleted from Supabase Auth.');
        console.log('You can now add this user again from the application UI.');
    }
}

cleanup();
