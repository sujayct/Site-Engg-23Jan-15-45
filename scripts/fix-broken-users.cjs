const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const serviceUrl = 'https://gsrckjdcatezcvpdxzmp.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcmNramRjYXRlemN2cGR4em1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU2NTExNCwiZXhwIjoyMDgyMTQxMTE0fQ.ejOhBl8AEH_-4BLBheMmaXqjNcrcTZouSt1im-K6DT0';
const adminClient = createClient(serviceUrl, serviceKey);

const usersToFix = [
    { email: 'hr@company.com', pass: 'hr123', role: 'hr', name: 'HR Manager' },
    { email: 'engineer@company.com', pass: 'engineer123', role: 'engineer', name: 'Site Engineer' },
    { email: 'client@company.com', pass: 'client123', role: 'client', name: 'Client User' }
];

async function fixUsers() {
    console.log('🔧 Fixing Roles: HR, Engineer, Client...');

    for (const u of usersToFix) {
        console.log(`\nProcessing ${u.email}...`);

        // 1. Find User to get ID (if exists)
        const { data: list } = await adminClient.auth.admin.listUsers();
        let existingUser = list.users.find(x => x.email === u.email);

        // 2. Find Profile ID (if exists - might be different if orphaned)
        const { data: profiles } = await adminClient.from('profiles').select('id').eq('email', u.email);
        const profileIds = profiles ? profiles.map(p => p.id) : [];
        if (existingUser && !profileIds.includes(existingUser.id)) profileIds.push(existingUser.id);

        // 3. Clear Dependencies (Nuclear style for these IDs)
        if (profileIds.length > 0) {
            console.log(`   Cleaning dependencies for ${profileIds.length} IDs...`);
            await adminClient.from('engineer_assignments').delete().in('engineer_id', profileIds);
            await adminClient.from('engineer_assignments').delete().in('client_id', profileIds);
            await adminClient.from('daily_reports').delete().in('engineer_id', profileIds);
            await adminClient.from('check_ins').delete().in('engineer_id', profileIds);
            await adminClient.from('leave_requests').delete().in('engineer_id', profileIds);

            // Delete Profiles
            const { error: pErr } = await adminClient.from('profiles').delete().in('id', profileIds);
            if (pErr) console.error('   ❌ Profile Delete Error:', pErr.message);
            else console.log('   ✅ Profiles Cleaned');
        }

        // 4. Delete Auth User
        if (existingUser) {
            const { error } = await adminClient.auth.admin.deleteUser(existingUser.id);
            if (!error) console.log('   ✅ Auth User Deleted');
        }

        // 5. Create Fresh
        const { data, error } = await adminClient.auth.admin.createUser({
            email: u.email,
            password: u.pass,
            email_confirm: true,
            user_metadata: { full_name: u.name }
        });

        if (error) {
            console.error(`   ❌ Create Error: ${error.message}`);
        } else {
            console.log(`   ✅ Created New Auth User: ${data.user.id}`);

            // 6. Upsert Profile
            const { error: upErr } = await adminClient.from('profiles').upsert({
                id: data.user.id,
                email: u.email,
                full_name: u.name,
                role: u.role
            });

            if (upErr) console.error(`   ❌ Profile Upsert Error: ${upErr.message}`);
            else console.log('   ✅ Profile Synced');
        }
    }
    console.log('\n✨ All Done.');
}

fixUsers();
