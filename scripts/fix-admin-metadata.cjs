const { createClient } = require('@supabase/supabase-js');

const serviceUrl = 'https://gsrckjdcatezcvpdxzmp.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcmNramRjYXRlemN2cGR4em1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU2NTExNCwiZXhwIjoyMDgyMTQxMTE0fQ.ejOhBl8AEH_-4BLBheMmaXqjNcrcTZouSt1im-K6DT0';
const supabase = createClient(serviceUrl, serviceKey);

async function fixMetadata() {
    const email = 'admin-recovery@company.com';
    console.log(`🔧 Fixing metadata for: ${email}`);

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error(listError);
        return;
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        console.error('❌ User not found');
        return;
    }

    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, role: 'admin' }
    });

    if (error) {
        console.error('❌ Error updating metadata:', error.message);
    } else {
        console.log('✅ Metadata updated successfully for admin.');
    }
}

fixMetadata();
