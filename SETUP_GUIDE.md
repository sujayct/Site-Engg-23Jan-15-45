# Quick Setup Guide - Fix Login Issue

## Problem
Login fails because Supabase Auth users don't exist yet. The database schema exists, but actual user accounts need to be created.

## Solution
Run the automated setup script to create all test users.

---

## Step 1: Get Your Supabase Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **service_role** key (⚠️ Keep this secret!)

---

## Step 2: Add Service Role Key to .env.local

Open your `.env.local` file and add the service role key:

```env
VITE_SUPABASE_URL=your_existing_url
VITE_SUPABASE_ANON_KEY=your_existing_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**⚠️ IMPORTANT:** The service role key is only needed for this one-time setup. Never commit it to git!

---

## Step 3: Install Dependencies

```bash
npm install tsx dotenv --save-dev
```

---

## Step 4: Run the Setup Script

```bash
npm run setup:users
```

You should see output like:
```
🚀 Starting test user creation...

Creating user: admin@company.com...
✅ Auth user created: abc-123-def
✅ Profile created for admin@company.com

Creating user: hr@company.com...
✅ Auth user created: xyz-456-ghi
✅ Profile created for hr@company.com

...

📊 Summary:
✅ Successfully created: 11
⚠️  Already existed: 0
❌ Errors: 0

✨ Test users are ready!
```

---

## Step 5: Test Login

1. Go to http://localhost:5173
2. Login with any of these credentials:
   - **Admin:** `admin@company.com` / `admin123`
   - **HR:** `hr@company.com` / `hr123`
   - **Engineer:** `engineer@company.com` / `engineer123`
   - **Client:** `client@company.com` / `client123`

---

## All Test Users Created

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@company.com | admin123 |
| HR | hr@company.com | hr123 |
| Engineer | engineer@company.com | engineer123 |
| Engineer | david.m@company.com | david123 |
| Engineer | emma.w@company.com | emma123 |
| Engineer | robert.t@company.com | robert123 |
| Engineer | sarah.j@company.com | sarah123 |
| Engineer | michael.b@company.com | michael123 |
| Engineer | priya.s@company.com | priya123 |
| Engineer | alex.k@company.com | alex123 |
| Client | client@company.com | client123 |

---

## Troubleshooting

### Error: "Missing environment variables"
- Make sure you added `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
- Restart your terminal after editing `.env.local`

### Error: "User already exists"
- This is normal if you've run the script before
- The script will skip existing users

### Login still fails after setup
- Check browser console for errors
- Verify users were created in Supabase Dashboard → Authentication → Users
- Clear browser cache and try again

---

## Security Note

After running the setup script, you can optionally remove the `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` for security. It's only needed for this one-time setup.
