# 🚀 QUICK FIX - Login Issue

## What You Need to Do (3 Simple Steps)

### Step 1: Get Your Service Role Key
1. Open https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Find and copy the **`service_role`** key (the long secret key)

### Step 2: Add It to .env.local
Open your `.env.local` file and add this line at the bottom:
```
SUPABASE_SERVICE_ROLE_KEY=paste_your_service_role_key_here
```

Your `.env.local` should now have 3 lines total.

### Step 3: Run This Command
```bash
npm run setup:users
```

That's it! After the script runs successfully, you can login with:
- **admin@company.com** / **admin123**

---

## What This Does
The script automatically creates all 11 test users in your Supabase Auth system.

## Need Help?
See SETUP_GUIDE.md for detailed troubleshooting.
