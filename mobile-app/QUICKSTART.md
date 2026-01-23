# Quick Start Guide

Get the mobile app running in 5 minutes!

## Step 1: Install Expo CLI

```bash
npm install -g expo-cli
```

## Step 2: Install Dependencies

```bash
cd mobile-app
npm install
```

## Step 3: Start the App

```bash
npm start
```

This will:
- Start the Expo development server
- Open Metro bundler in your browser
- Show a QR code

## Step 4: Run on Your Device

### Option A: Use Your Phone (Easiest)

1. Install **Expo Go** app from:
   - iOS: App Store
   - Android: Google Play Store

2. Scan the QR code shown in your terminal/browser

3. The app will load on your phone!

### Option B: Use Simulator/Emulator

**iOS (Mac only)**:
```bash
# Press 'i' in the terminal
# OR
npm run ios
```

**Android**:
```bash
# Press 'a' in the terminal
# OR
npm run android
```

## Test Credentials

Use these credentials to log in:

**Engineer Account**:
- Email: `engineer@test.com`
- Password: `password123`

**HR Account**:
- Email: `hr@test.com`
- Password: `password123`

**Client Account**:
- Email: `client@test.com`
- Password: `password123`

**Admin Account**:
- Email: `admin@test.com`
- Password: `password123`

## Testing Offline Mode

1. Log in to the app
2. Turn on Airplane Mode on your device
3. Try checking in, submitting reports, or requesting leave
4. Data is saved locally
5. Turn off Airplane Mode
6. Data syncs automatically!

## Project Already Configured

The following are already set up:
- Supabase connection
- Database schema
- Environment variables
- Authentication

## Common Commands

```bash
# Start development server
npm start

# Start with cache cleared
npm start -- --clear

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web browser
npm run web
```

## Need Help?

1. Make sure you're in the `mobile-app` directory
2. Clear cache: `npm start -- --clear`
3. Reinstall: `rm -rf node_modules && npm install`
4. Check that Expo Go is updated to the latest version

## Features to Test

### As Engineer:
1. GPS Check-In
   - Grant location permission
   - See your coordinates and address
   - Confirm check-in

2. Daily Report
   - Enter site location
   - Describe work done
   - Set progress percentage
   - Add issues and materials

3. Leave Request
   - Enter start/end dates
   - Provide reason
   - Submit for approval

4. Offline Mode
   - Disable network
   - Perform actions
   - Enable network
   - Watch auto-sync

### As HR:
1. View leave requests
2. Approve/reject leaves
3. Monitor employee activity

### As Client:
1. View check-ins
2. Monitor daily reports
3. Track progress

### As Admin:
1. View system statistics
2. Monitor all activities

## That's It!

You're ready to use the Site Engineer Operations mobile app. Enjoy!
