const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const serviceUrl = 'https://gsrckjdcatezcvpdxzmp.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcmNramRjYXRlemN2cGR4em1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU2NTExNCwiZXhwIjoyMDgyMTQxMTE0fQ.ejOhBl8AEH_-4BLBheMmaXqjNcrcTZouSt1im-K6DT0';
const adminClient = createClient(serviceUrl, serviceKey);

async function cleanShivam() {
    console.log('🧹 Cleaning up stuck user...');

    // 1. Delete by Email
    const email = 'shivam.jagtap@cybaemtech.com';

    // Auth User
    const { data: list } = await adminClient.auth.admin.listUsers();
    const existing = list.users.find(u => u.email === email);

    if (existing) {
        const { error } = await adminClient.auth.admin.deleteUser(existing.id);
        if (error) console.error('❌ Auth Delete Error:', error.message);
        else console.log('✅ Deleted Auth User:', email);
    } else {
        console.log('ℹ️ Auth User not found (might assume clean).');
    }

    // Profile (Just in case orphaned)
    const { error: pErr } = await adminClient.from('profiles').delete().eq('email', email);
    if (pErr) console.error('❌ Profile Delete Error:', pErr.message);
    else console.log('✅ Profile Check/Cleaned');
}

cleanShivam();
