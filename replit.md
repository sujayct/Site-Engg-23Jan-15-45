# Site Engineer Check-In & Daily Reporting System

## Overview

A full-stack web and mobile application for managing site engineer field operations. The system provides GPS-based check-in tracking, daily work report submission, leave management, and role-based dashboards for Engineers, HR, Clients, and Admins. It supports offline-first mobile functionality with automatic sync and includes white-label company branding capabilities.

## Recent Changes (January 2026)

- **Backend Migration**: Migrated from Supabase to local PostgreSQL + Express.js server
- **ORM**: Using Drizzle ORM for type-safe database operations
- **Authentication**: Session-based auth with bcrypt password hashing (replaced Supabase Auth)
- **API**: All endpoints served from Express.js on port 3001, proxied through Vite
- **HR Dashboard Enhancements**: Added Overview tab with quick reports, downloadable CSV exports, and email functionality
- **Email Integration**: Replit Mail service for sending reports directly to clients
- **UI Enhancements (All Dashboards)**: Modern gradient headers, rounded cards with shadows, color-coded themes:
  - Admin Dashboard: Red gradient theme with quick action cards
  - HR Dashboard: Blue/Indigo gradient with tab navigation
  - Engineer Dashboard: Blue/Indigo gradient with stats cards and tabbed interface
  - Client Dashboard: Orange gradient with date filtering and data export
- **Profile Storage**: User profile changes now saved locally in JSON format (localStorage) instead of database
- **Client Dashboard Fix**: Resolved data sync issues by properly using async StorageService methods

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Web App**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS for responsive design
- **Icons**: Lucide React icon library
- **State Management**: React Context API for auth and branding
- **Mobile-Responsive**: Dedicated mobile components in `src/components/mobile/`

### Mobile App Architecture
- **Framework**: React Native with Expo
- **Navigation**: React Navigation (native-stack)
- **Offline Support**: AsyncStorage for local persistence with sync queue
- **Location Services**: expo-location for GPS check-ins

### Backend Architecture
- **Database**: PostgreSQL (Replit managed)
- **ORM**: Drizzle ORM with type-safe queries
- **API Server**: Express.js on port 3001
- **Authentication**: Session-based with express-session and connect-pg-simple
- **Password Hashing**: bcryptjs

### Role-Based Access Control
Four user roles with distinct permissions and dashboards:
1. **Admin**: Full system access, user management, company branding
2. **HR**: Attendance monitoring, leave approval, backup engineer assignment
3. **Engineer**: GPS check-in, daily reports, leave requests
4. **Client**: View assigned engineers, monitor reports and attendance

### Key Design Patterns
- **Service Layer Pattern**: All data operations abstracted through services in `src/services/`
- **Context Providers**: AuthContext and CompanyBrandingContext wrap the application
- **Offline-First Mobile**: Sync queue with automatic retry when online
- **Role Normalization**: Roles normalized to lowercase on login and retrieval

### Database Schema (Drizzle ORM)
Core tables defined in `shared/schema.ts`:
- `profiles` - User information with password hashes
- `check_ins` - GPS-based attendance records
- `daily_reports` - Work reports submitted by engineers
- `leave_requests` - Leave management with approval workflow
- `clients` - Client company information
- `sites` - Client site locations
- `engineer_assignments` - Engineer-to-client-site mappings
- `company_profiles` - White-label branding configuration
- `notifications` - System notifications

## Development Setup

### Running the Application
```bash
npm run dev          # Run both frontend and backend
npm run dev:client   # Frontend only (port 5000)
npm run dev:server   # Backend only (port 3001)
```

### Database Commands
```bash
npm run db:push      # Push schema changes to database
npm run db:seed      # Seed database with test users
npm run db:studio    # Open Drizzle Studio
```

### Test Credentials
All test users use password: `password123`
- Admin: admin@company.com
- HR: hr@company.com
- Engineer: engineer@company.com
- Client: client@company.com

## Key Files

- `server/index.ts` - Express server entry point
- `server/routes.ts` - All API route definitions
- `server/db.ts` - Database connection
- `shared/schema.ts` - Drizzle ORM schema definitions
- `src/services/authService.ts` - Frontend auth API calls
- `src/lib/storage.ts` - Frontend data storage service
- `scripts/seed.ts` - Database seeding script
- `drizzle.config.ts` - Drizzle ORM configuration

## External Dependencies

### Email Notifications (Implemented)
- Replit Mail integration for sending reports via email
- HR can send attendance, leave, and daily work reports to clients
- Email includes HTML formatted report and CSV attachment
- API endpoint: `/api/send-report-email`

### File Storage (To be implemented)
- Local file storage or cloud storage integration needed

### Mobile-Specific Dependencies
- `expo-location` - GPS tracking with address geocoding
- `@react-native-async-storage/async-storage` - Offline data persistence
- `@react-native-community/netinfo` - Network status monitoring
- `expo-secure-store` - Secure token storage

### Development Tools
- TypeScript for type safety across web and mobile
- ESLint for code quality
- Vite for fast development builds
- tsx for running TypeScript scripts
- concurrently for running multiple dev servers
