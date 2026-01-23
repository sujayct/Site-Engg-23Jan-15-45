const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const serviceUrl = 'https://gsrckjdcatezcvpdxzmp.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcmNramRjYXRlemN2cGR4em1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU2NTExNCwiZXhwIjoyMDgyMTQxMTE0fQ.ejOhBl8AEH_-4BLBheMmaXqjNcrcTZouSt1im-K6DT0';
const adminClient = createClient(serviceUrl, serviceKey);

const newUsers = [
    { email: 'hr-new@company.com', pass: 'hr123', role: 'hr', name: 'HR Manager' },
    { email: 'engineer-new@company.com', pass: 'engineer123', role: 'engineer', name: 'Site Engineer' },
    { email: 'client-new@company.com', pass: 'client123', role: 'client', name: 'Client User' }
];

async function createNew() {
    console.log('✨ Creating Fresh Recovery Users...');

    for (const u of newUsers) {
        console.log(`\nProcessing ${u.email}...`);

        // 1. Delete if exists (Cleanup for re-run)
        const { data: list } = await adminClient.auth.admin.listUsers();
        let existing = list.users.find(x => x.email === u.email);
        if (existing) await adminClient.auth.admin.deleteUser(existing.id);

        // 2. Create
        const { data, error } = await adminClient.auth.admin.createUser({
            email: u.email,
            password: u.pass,
            email_confirm: true,
            user_metadata: { full_name: u.name }
        });

        if (error) {
            console.error(`   ❌ Create Error: ${error.message}`);
        } else {
            console.log(`   ✅ Created: ${data.user.id}`);

            // 3. Upsert Profile
            await adminClient.from('profiles').upsert({
                id: data.user.id, // Primary Key
                email: u.email,   // Unique
                full_name: u.name,
                role: u.role
            });
            console.log('   ✅ Profile Synced');
        }
    }
}

createNew();
