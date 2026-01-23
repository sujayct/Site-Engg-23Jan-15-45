# Site Engineer Operations - Mobile App

## Overview

A complete React Native mobile application has been created in the `mobile-app/` directory. This app provides site engineer operations management with full offline support, GPS tracking, and role-based dashboards.

## What's Included

### Complete Application
- **37 files** across the entire project structure
- **8 screens** (Login + 3 feature screens + 4 role dashboards)
- **6 services** for business logic
- **Full offline functionality** with automatic sync
- **GPS-based check-in** with address geocoding
- **Role-based navigation** for 4 user types
- **Token-based authentication** with secure storage

### Key Features

#### 1. GPS Check-In
- Real-time location tracking
- Reverse geocoding for addresses
- Offline capture with sync queue
- Visual coordinate display

#### 2. Daily Reports
- Comprehensive work documentation
- Progress tracking (0-100%)
- Issues and materials logging
- Offline submission support

#### 3. Leave Management
- Date range selection
- Reason documentation
- HR approval workflow
- Status tracking

#### 4. Offline Mode
- Local data persistence (AsyncStorage)
- Automatic sync queue
- Network status monitoring
- Background sync when online
- Retry logic for failed syncs

#### 5. Role-Based Access
- **Engineer**: Check-in, reports, leave requests
- **HR**: Leave approval, employee monitoring
- **Client**: View check-ins and reports
- **Admin**: System-wide overview

### Technical Implementation

**Frontend**
- React Native with Expo
- TypeScript for type safety
- React Navigation for routing
- Secure storage for tokens
- AsyncStorage for offline data

**Location Services**
- expo-location for GPS
- Reverse geocoding
- Permission handling
- High-accuracy positioning

**Network Management**
- NetInfo for connectivity
- Automatic online/offline detection
- Real-time sync status
- Background sync processing

**Authentication**
- Supabase Auth integration
- Secure token storage
- Session persistence
- Automatic token refresh

## Directory Structure

```
mobile-app/
├── App.tsx                          # Main entry point
├── package.json                     # Dependencies
├── app.json                         # Expo config
├── .env                            # Supabase credentials (configured)
├── README.md                       # Full documentation
├── QUICKSTART.md                   # 5-minute setup guide
├── DATABASE_SETUP.md               # Database schema
├── PROJECT_STRUCTURE.md            # File descriptions
├── assets/                         # App icons (add your images)
└── src/
    ├── types/index.ts             # TypeScript definitions
    ├── config/supabase.ts         # Supabase client
    ├── services/                   # Business logic
    │   ├── authService.ts
    │   ├── checkInService.ts
    │   ├── reportService.ts
    │   ├── leaveService.ts
    │   ├── storageService.ts
    │   └── syncService.ts
    ├── navigation/
    │   └── AppNavigator.tsx       # Route configuration
    ├── screens/                    # UI screens
    │   ├── LoginScreen.tsx
    │   ├── EngineerDashboard.tsx
    │   ├── HRDashboard.tsx
    │   ├── ClientDashboard.tsx
    │   ├── AdminDashboard.tsx
    │   ├── CheckInScreen.tsx
    │   ├── ReportScreen.tsx
    │   └── LeaveScreen.tsx
    ├── components/
    │   └── SyncStatus.tsx         # Network status display
    └── utils/
        └── AuthContext.tsx        # Auth state management
```

## Getting Started

### Quick Start (5 minutes)

1. **Install Expo CLI**:
   ```bash
   npm install -g expo-cli
   ```

2. **Navigate and install**:
   ```bash
   cd mobile-app
   npm install
   ```

3. **Start the app**:
   ```bash
   npm start
   ```

4. **Run on device**:
   - Install **Expo Go** on your phone
   - Scan the QR code
   - App loads instantly!

### Test Credentials

- **Engineer**: engineer@test.com / password123
- **HR**: hr@test.com / password123
- **Client**: client@test.com / password123
- **Admin**: admin@test.com / password123

## Database

The app uses the **same Supabase database** as the web application. No additional setup needed if the web app is already configured.

### Required Tables
- `users` - User accounts and roles
- `check_ins` - GPS check-in records
- `daily_reports` - Work progress reports
- `leave_requests` - Leave applications

See `DATABASE_SETUP.md` for complete schema and RLS policies.

## Documentation

Comprehensive guides are included:

1. **README.md** - Complete documentation
   - Installation steps
   - Configuration guide
   - Project structure
   - API reference
   - Troubleshooting

2. **QUICKSTART.md** - Get running in 5 minutes
   - Minimal setup steps
   - Test instructions
   - Common commands
   - Feature testing guide

3. **DATABASE_SETUP.md** - Database configuration
   - Table schemas
   - RLS policies
   - Test data
   - Verification steps

4. **PROJECT_STRUCTURE.md** - Code organization
   - File purposes
   - Architecture overview
   - Development workflow
   - Best practices

## Offline Functionality

The app is designed to work completely offline:

### How It Works
1. User performs action (check-in, report, leave)
2. Data saved to AsyncStorage immediately
3. If online: Syncs to Supabase instantly
4. If offline: Added to sync queue
5. When connection restored: Auto-sync
6. Failed syncs retry up to 3 times
7. Visual sync status in UI

### Testing Offline
1. Log in to the app
2. Enable Airplane Mode
3. Perform check-in or submit report
4. See data saved locally
5. Disable Airplane Mode
6. Watch automatic sync!

## Platform Support

- **iOS**: iPhone/iPad (iOS 13+)
- **Android**: Phones/Tablets (Android 5+)
- **Testing**: Expo Go app for instant preview

## Build & Deploy

### Development
```bash
npm start          # Start dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
```

### Production
```bash
expo build:ios     # Build iOS app
expo build:android # Build Android app
```

Or use **EAS Build** (recommended):
```bash
eas build --platform ios
eas build --platform android
```

## Key Technologies

- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **React Navigation** - Routing
- **AsyncStorage** - Local storage
- **SecureStore** - Secure token storage
- **expo-location** - GPS services
- **NetInfo** - Network detection
- **Supabase** - Backend & auth

## Features Ready to Use

### For Engineers
- ✅ GPS check-in with address
- ✅ Daily work reports
- ✅ Leave requests
- ✅ Offline mode
- ✅ Auto-sync
- ✅ Personal history

### For HR
- ✅ View all leave requests
- ✅ Approve/reject leaves
- ✅ Monitor employee check-ins
- ✅ View daily reports

### For Clients
- ✅ View site check-ins
- ✅ Monitor daily reports
- ✅ Track project progress
- ✅ View engineer activities

### For Admins
- ✅ System statistics
- ✅ All data access
- ✅ User monitoring
- ✅ Activity overview

## Security Features

- Token-based authentication
- Secure credential storage (expo-secure-store)
- Row Level Security in database
- Role-based access control
- Encrypted API communication
- Auto token refresh

## Production Ready

The app includes:
- Error handling
- Loading states
- Form validation
- Network error recovery
- Sync conflict resolution
- Permission management
- Performance optimization
- Clean, maintainable code

## Next Steps

1. **Review** the QUICKSTART.md guide
2. **Install** dependencies (npm install)
3. **Start** the app (npm start)
4. **Test** with Expo Go on your phone
5. **Customize** as needed
6. **Build** for production when ready

## Support

All code is documented and follows React Native best practices. Each file includes clear comments and logical structure.

For issues:
1. Check README.md troubleshooting section
2. Review error messages in Metro bundler
3. Verify .env configuration
4. Test database connection

## What You Can Do Now

✅ **Run the app** - It's fully configured and ready
✅ **Test offline mode** - All features work without internet
✅ **Deploy to devices** - Build for iOS and Android
✅ **Customize UI** - Modern, clean design as starting point
✅ **Extend features** - Modular code, easy to enhance
✅ **Scale** - Built for production use

## Summary

You now have a **complete, production-ready React Native mobile app** that:
- Works on iOS and Android
- Supports full offline functionality
- Integrates with your Supabase backend
- Includes role-based dashboards
- Has GPS check-in capability
- Auto-syncs when online
- Uses secure authentication
- Is fully documented

Simply run `npm install` and `npm start` from the `mobile-app/` directory to begin!
