# Site Engineer Operations - Mobile App

A React Native mobile application for site engineer operations management with offline support, GPS check-in, daily reports, and leave management.

## Features

### Core Functionality
- **GPS Check-In**: Location-based attendance tracking with address geocoding
- **Daily Reports**: Submit work progress reports with site details
- **Leave Management**: Request and manage leave applications
- **Offline Mode**: Full offline functionality with automatic sync when online
- **Role-Based Access**: Separate dashboards for Engineer, HR, Client, and Admin

### Technical Features
- Token-based authentication with secure storage
- Automatic background sync queue
- Network status monitoring
- Local data persistence with AsyncStorage
- GPS location services
- Cross-platform (iOS & Android)

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac only) or Android Studio for emulators

### Setup Steps

1. **Navigate to the mobile app directory**:
   ```bash
   cd mobile-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Copy `.env.example` to `.env`
   - Update with your Supabase credentials:
     ```
     EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Add app icons** (optional):
   - Add `icon.png` (1024x1024) to `/assets`
   - Add `splash.png` (1284x2778) to `/assets`
   - Add `adaptive-icon.png` (1024x1024) to `/assets`
   - Add `favicon.png` (48x48) to `/assets`

5. **Start the development server**:
   ```bash
   npm start
   ```

6. **Run on device/simulator**:
   - **iOS**: Press `i` or run `npm run ios`
   - **Android**: Press `a` or run `npm run android`
   - **Web**: Press `w` or run `npm run web`
   - **Scan QR**: Use Expo Go app on your phone

## Project Structure

```
mobile-app/
├── App.tsx                    # Main app entry point
├── app.json                   # Expo configuration
├── package.json               # Dependencies
├── tsconfig.json             # TypeScript config
├── babel.config.js           # Babel configuration
├── assets/                   # App icons and images
└── src/
    ├── types/                # TypeScript type definitions
    │   └── index.ts
    ├── config/               # Configuration files
    │   └── supabase.ts      # Supabase client setup
    ├── services/             # Business logic services
    │   ├── authService.ts   # Authentication
    │   ├── checkInService.ts # GPS check-in
    │   ├── reportService.ts  # Daily reports
    │   ├── leaveService.ts   # Leave management
    │   ├── storageService.ts # Local storage
    │   └── syncService.ts    # Offline sync
    ├── navigation/           # Navigation setup
    │   └── AppNavigator.tsx
    ├── screens/              # Screen components
    │   ├── LoginScreen.tsx
    │   ├── EngineerDashboard.tsx
    │   ├── HRDashboard.tsx
    │   ├── ClientDashboard.tsx
    │   ├── AdminDashboard.tsx
    │   ├── CheckInScreen.tsx
    │   ├── ReportScreen.tsx
    │   └── LeaveScreen.tsx
    ├── components/           # Reusable components
    │   └── SyncStatus.tsx
    └── utils/                # Utility functions
        └── AuthContext.tsx   # Auth context provider
```

## User Roles

### Engineer
- GPS-based check-in
- Submit daily work reports
- Request leave
- View personal history
- Works offline with auto-sync

### HR
- View and manage all leave requests
- Approve/reject leave applications
- View employee check-ins
- Monitor daily reports

### Client
- View site check-ins
- Monitor daily reports
- Track project progress
- View engineer activities

### Admin
- System-wide overview
- Access to all data
- View statistics and analytics

## Database Schema

The app requires the following Supabase tables:

### users
```sql
- id (uuid, primary key)
- email (text, unique)
- name (text)
- role (text) -- 'engineer' | 'hr' | 'client' | 'admin'
- created_at (timestamp)
```

### check_ins
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- user_name (text)
- latitude (numeric)
- longitude (numeric)
- address (text, nullable)
- timestamp (timestamp)
- created_at (timestamp)
```

### daily_reports
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- user_name (text)
- date (date)
- site_location (text)
- work_description (text)
- progress (integer) -- 0-100
- issues (text, nullable)
- materials_used (text, nullable)
- timestamp (timestamp)
- created_at (timestamp)
```

### leave_requests
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- user_name (text)
- start_date (date)
- end_date (date)
- reason (text)
- status (text) -- 'pending' | 'approved' | 'rejected'
- timestamp (timestamp)
- created_at (timestamp)
```

## Offline Mode

The app supports full offline functionality:

1. **Local Storage**: All data is stored locally using AsyncStorage
2. **Sync Queue**: Actions performed offline are queued for sync
3. **Auto Sync**: When connection is restored, data syncs automatically
4. **Network Detection**: Real-time network status monitoring
5. **Conflict Resolution**: Latest data takes precedence

### How Offline Sync Works

1. User performs action (check-in, report, leave request)
2. Data is saved to local storage immediately
3. If online: Data syncs to Supabase instantly
4. If offline: Action is added to sync queue
5. When online: Queue processes automatically
6. Failed syncs retry up to 3 times
7. Sync status visible in UI

## Permissions

### iOS
- Location: "Allow Site Engineer to access your location for check-ins."
- Background Location: Optional for background check-ins

### Android
- ACCESS_FINE_LOCATION: Required for GPS check-in
- ACCESS_COARSE_LOCATION: Required for GPS check-in
- INTERNET: Required for API calls

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

### EAS Build (Recommended)
```bash
eas build --platform ios
eas build --platform android
```

## Development

### Running Tests
```bash
npm test
```

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

## Troubleshooting

### Location Not Working
- Ensure location permissions are granted
- Check that location services are enabled on device
- For iOS simulator, use Debug → Location → Custom Location

### Sync Issues
- Check network connectivity
- Verify Supabase credentials in .env
- Check browser console for API errors
- Clear app data: Settings → Apps → Site Engineer → Clear Data

### Build Errors
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Update Expo: `npm install expo@latest`

## License

Proprietary - All Rights Reserved

## Support

For issues or questions, contact your system administrator.
