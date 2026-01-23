# Project Structure

Complete overview of the React Native mobile app structure.

## Root Files

```
mobile-app/
├── App.tsx                      # Main app entry point with auth provider
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── app.json                    # Expo app configuration
├── babel.config.js             # Babel transpiler config
├── .env                        # Environment variables (Supabase)
├── .env.example                # Template for environment variables
├── .gitignore                  # Git ignore rules
├── README.md                   # Full documentation
├── QUICKSTART.md               # Quick start guide
├── DATABASE_SETUP.md           # Database setup instructions
└── PROJECT_STRUCTURE.md        # This file
```

## Source Code Structure

```
src/
├── types/
│   └── index.ts                # TypeScript type definitions
│
├── config/
│   └── supabase.ts            # Supabase client configuration
│
├── services/
│   ├── authService.ts         # Authentication logic
│   ├── checkInService.ts      # GPS check-in functionality
│   ├── reportService.ts       # Daily report submission
│   ├── leaveService.ts        # Leave request management
│   ├── storageService.ts      # Local AsyncStorage operations
│   └── syncService.ts         # Offline sync queue management
│
├── navigation/
│   └── AppNavigator.tsx       # React Navigation setup
│
├── screens/
│   ├── LoginScreen.tsx        # Login authentication screen
│   ├── EngineerDashboard.tsx  # Engineer role dashboard
│   ├── HRDashboard.tsx        # HR role dashboard
│   ├── ClientDashboard.tsx    # Client role dashboard
│   ├── AdminDashboard.tsx     # Admin role dashboard
│   ├── CheckInScreen.tsx      # GPS check-in interface
│   ├── ReportScreen.tsx       # Daily report form
│   └── LeaveScreen.tsx        # Leave request form
│
├── components/
│   └── SyncStatus.tsx         # Network/sync status banner
│
└── utils/
    └── AuthContext.tsx        # Authentication context provider
```

## Assets

```
assets/
├── icon.png                    # App icon (1024x1024)
├── splash.png                  # Splash screen (1284x2778)
├── adaptive-icon.png           # Android adaptive icon
├── favicon.png                 # Web favicon
└── README.md                   # Asset requirements guide
```

## File Descriptions

### Configuration Files

**App.tsx**
- Root component
- Initializes sync service
- Wraps app with AuthProvider

**package.json**
- Dependencies list
- Start scripts
- Project metadata

**app.json**
- Expo configuration
- App name and icons
- Permissions setup
- Platform-specific settings

**tsconfig.json**
- TypeScript compiler options
- Module resolution
- Type checking settings

**babel.config.js**
- JavaScript transpilation
- Expo preset configuration

**.env**
- Supabase URL
- Supabase anonymous key
- Environment-specific variables

### Type Definitions

**types/index.ts**
- User, CheckIn, DailyReport types
- LeaveRequest, Assignment types
- SyncQueueItem, AuthState types

### Configuration

**config/supabase.ts**
- Supabase client initialization
- API endpoint configuration

### Services

**authService.ts**
- Login/logout functionality
- Token management with SecureStore
- Session persistence
- Token refresh

**checkInService.ts**
- GPS location requests
- Reverse geocoding for addresses
- Check-in creation
- Online/offline handling

**reportService.ts**
- Daily report submission
- Report retrieval
- Online/offline sync
- Local storage integration

**leaveService.ts**
- Leave request creation
- Leave status updates
- Request retrieval
- HR approval workflow

**storageService.ts**
- AsyncStorage wrapper
- CRUD operations for all data types
- Sync queue management
- Local data persistence

**syncService.ts**
- Network status monitoring
- Automatic sync when online
- Retry logic for failed syncs
- Background sync processing

### Navigation

**AppNavigator.tsx**
- Stack navigator setup
- Role-based routing
- Authentication flow
- Screen configurations

### Screens

**LoginScreen.tsx**
- Email/password form
- Authentication handling
- Error display
- Loading states

**EngineerDashboard.tsx**
- Quick action buttons
- Statistics display
- Offline indicator
- Sync status
- Navigation to features

**HRDashboard.tsx**
- Leave request list
- Approve/reject actions
- Statistics overview
- Employee monitoring

**ClientDashboard.tsx**
- Recent check-ins view
- Daily reports display
- Progress tracking
- Site monitoring

**AdminDashboard.tsx**
- System statistics
- All data overview
- System monitoring

**CheckInScreen.tsx**
- GPS location retrieval
- Address display
- Coordinate display
- Check-in confirmation

**ReportScreen.tsx**
- Site location input
- Work description
- Progress percentage
- Issues and materials
- Form validation

**LeaveScreen.tsx**
- Date range selection
- Reason input
- Submission handling
- Validation

### Components

**SyncStatus.tsx**
- Network status banner
- Pending sync count
- Visual indicators
- Auto-updating display

### Utils

**AuthContext.tsx**
- Authentication state management
- User context provider
- Login/logout handlers
- Token storage

## Key Features by File

### Offline Support
- `storageService.ts` - Local data storage
- `syncService.ts` - Queue and sync logic
- `checkInService.ts` - Offline check-in
- `reportService.ts` - Offline reports
- `leaveService.ts` - Offline leave requests

### Security
- `authService.ts` - Secure token storage
- `config/supabase.ts` - API security
- Row Level Security in database

### Location Services
- `checkInService.ts` - GPS functionality
- Permissions in `app.json`

### Role-Based Access
- `AppNavigator.tsx` - Role routing
- `AuthContext.tsx` - User role management
- All dashboard screens - Role-specific UI

## Development Workflow

1. **Start**: Run `npm start` from root
2. **Edit**: Modify files in `src/`
3. **Test**: Use Expo Go or simulator
4. **Build**: Use `expo build` or EAS

## Adding New Features

1. **New Screen**: Add to `src/screens/`
2. **New Service**: Add to `src/services/`
3. **New Route**: Update `AppNavigator.tsx`
4. **New Type**: Update `types/index.ts`

## Best Practices

- Keep services focused and single-purpose
- Use TypeScript for type safety
- Handle offline scenarios in all services
- Update sync queue for write operations
- Test on both iOS and Android
- Follow existing naming conventions
- Document complex logic

## Tech Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: React Navigation
- **Storage**: AsyncStorage
- **Secure Storage**: expo-secure-store
- **Location**: expo-location
- **Network**: @react-native-community/netinfo
- **Backend**: Supabase
- **Authentication**: Supabase Auth

## Next Steps

1. Review README.md for setup
2. Follow QUICKSTART.md to run
3. Check DATABASE_SETUP.md for data
4. Start developing!
