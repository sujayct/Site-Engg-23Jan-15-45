const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const serviceUrl = 'https://gsrckjdcatezcvpdxzmp.supabase.co';

// Helper to get Anon Key
function getAnonKey() {
    try {
        const c = fs.readFileSync('.env.local', 'utf-8');
        return c.split('\n').find(l => l.startsWith('VITE_SUPABASE_ANON_KEY')).split('=')[1].trim();
    } catch (e) { return null; }
}

async function debugHR() {
    console.log('🕵️ Debugging HR Login...');
    const key = getAnonKey();
    if (!key) return console.error('❌ Could not read Anon Key');

    // Client simulating Frontend
    const supabase = createClient(serviceUrl, key);

    const email = 'hr@company.com';
    const pass = 'hr123';

    // 1. Authenticate
    console.log(`1. Signing in as ${email}...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email, password: pass
    });

    if (authError) {
        console.error('❌ Auth Failed:', authError.message);
        return;
    }
    console.log('✅ Auth Success. User ID:', authData.user.id);

    // 2. Fetch Profile (This is what the App does next)
    console.log('2. Fetching Profile...');
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle(); // or .single()

    if (profileError) {
        console.error('❌ Profile Fetch Error:', profileError.message);
        console.error('   Details:', profileError);
    } else if (!profile) {
        console.error('❌ Profile is NULL (RLS Policy blocking read?)');
    } else {
        console.log('✅ Profile Found:', profile.role);
    }
}

debugHR();
