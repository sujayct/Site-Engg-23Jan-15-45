import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manually load environment variables from .env.local
function loadEnvFile() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length > 0) {
                    process.env[key.trim()] = valueParts.join('=').trim();
                }
            }
        });
    }
}

loadEnvFile();

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!');
    console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.error('\nCurrent values:');
    console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓ Set' : '✗ Missing');
    process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Test users to create
const testUsers = [
    { email: 'admin@company.com', password: 'admin123', full_name: 'Admin User', role: 'admin', phone: '+1-555-0001' },
    { email: 'hr@company.com', password: 'hr123', full_name: 'HR Manager', role: 'hr', phone: '+1-555-0002' },
    { email: 'engineer@company.com', password: 'engineer123', full_name: 'John Anderson', role: 'engineer', phone: '+1-555-0101' },
    { email: 'david.m@company.com', password: 'david123', full_name: 'David Martinez', role: 'engineer', phone: '+1-555-0102' },
    { email: 'emma.w@company.com', password: 'emma123', full_name: 'Emma Wilson', role: 'engineer', phone: '+1-555-0103' },
    { email: 'robert.t@company.com', password: 'robert123', full_name: 'Robert Thompson', role: 'engineer', phone: '+1-555-0104' },
    { email: 'sarah.j@company.com', password: 'sarah123', full_name: 'Sarah Johnson', role: 'engineer', phone: '+1-555-0105' },
    { email: 'michael.b@company.com', password: 'michael123', full_name: 'Michael Brown', role: 'engineer', phone: '+1-555-0106' },
    { email: 'priya.s@company.com', password: 'priya123', full_name: 'Priya Sharma', role: 'engineer', phone: '+1-555-0107' },
    { email: 'alex.k@company.com', password: 'alex123', full_name: 'Alex Kumar', role: 'engineer', phone: '+1-555-0108' },
    { email: 'client@company.com', password: 'client123', full_name: 'Client User', role: 'client', phone: '+1-555-0201' }
];

async function createTestUsers() {
    console.log('🚀 Starting test user creation...\n');

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const user of testUsers) {
        try {
            console.log(`Creating user: ${user.email}...`);

            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true, // Auto-confirm email
                user_metadata: {
                    full_name: user.full_name
                }
            });

            if (authError) {
                if (authError.message.includes('already registered')) {
                    console.log(`⚠️  User ${user.email} already exists, skipping...`);
                    skipCount++;
                    continue;
                }
                throw authError;
            }

            if (!authData.user) {
                throw new Error('No user data returned');
            }

            console.log(`✅ Auth user created: ${authData.user.id}`);

            // Create profile
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: authData.user.id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    phone: user.phone
                }, {
                    onConflict: 'id'
                });

            if (profileError) {
                console.error(`⚠️  Profile creation failed for ${user.email}:`, profileError.message);
                // Continue anyway, auth user was created
            } else {
                console.log(`✅ Profile created for ${user.email}`);
            }

            successCount++;
            console.log('');

        } catch (error: any) {
            console.error(`❌ Error creating ${user.email}:`, error.message);
            errorCount++;
            console.log('');
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`✅ Successfully created: ${successCount}`);
    console.log(`⚠️  Already existed: ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(50));

    if (successCount > 0 || skipCount > 0) {
        console.log('\n✨ Test users are ready!');
        console.log('\n📝 You can now login with:');
        console.log('   Admin:    admin@company.com / admin123');
        console.log('   HR:       hr@company.com / hr123');
        console.log('   Engineer: engineer@company.com / engineer123');
        console.log('   Client:   client@company.com / client123');
    }
}

// Run the script
createTestUsers()
    .then(() => {
        console.log('\n✅ Script completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
