const { createClient } = require('@supabase/supabase-js');

const serviceUrl = 'https://gsrckjdcatezcvpdxzmp.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcmNramRjYXRlemN2cGR4em1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU2NTExNCwiZXhwIjoyMDgyMTQxMTE0fQ.ejOhBl8AEH_-4BLBheMmaXqjNcrcTZouSt1im-K6DT0';
const supabase = createClient(serviceUrl, serviceKey);

const TARGET_EMAIL = 'sujay.palande@cybaemtech.com';

async function diagnose() {
    console.log(`🔍 Diagnosing user: ${TARGET_EMAIL}`);

    // 1. Check Auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('❌ Error listing users:', authError.message);
        return;
    }

    const authUser = users.find(u => u.email === TARGET_EMAIL);
    if (authUser) {
        console.log(`✅ User found in Auth: ID=${authUser.id}`);
    } else {
        console.log('❌ User NOT found in Auth.');
    }

    // 2. Check Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', TARGET_EMAIL)
        .maybeSingle();

    if (profileError) {
        console.error('❌ Error checking profile:', profileError.message);
    } else if (profile) {
        console.log(`✅ User found in Profiles: ID=${profile.id}`);
    } else {
        console.log('❌ User NOT found in Profiles.');
    }

    if (authUser && !profile) {
        console.log('\n⚠️  CONFIRMED: Ghost user detected (exists in Auth but missing in Profiles).');
        console.log('Action needed: Delete from Auth or manually sync Profile.');
    } else if (!authUser && profile) {
        console.log('\n⚠️  ORPHANED PROFILE: Exists in Profiles but missing in Auth.');
        console.log('Action needed: Cleanup orphaned profile.');
    } else if (authUser && profile) {
        console.log('\n✅ User is synced correctly.');
        if (authUser.id !== profile.id) {
            console.log('❌ CRITICAL: ID mismatch!');
        }
    } else {
        console.log('\n✅ User does not exist anywhere.');
    }
}

diagnose();
