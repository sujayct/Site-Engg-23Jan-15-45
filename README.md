# Site Engineer Check-In & Daily Reporting System

A full-stack web application for managing site engineer operations with GPS check-in, daily work reports, leave management, and role-based dashboards.

## Features

### Engineer Role
- GPS-based check-in (one per day)
- Daily work report submission
- Leave request submission
- View backup engineer assignments
- View assigned sites and clients

### HR Role
- Attendance dashboard
- Leave approval/rejection workflow
- Backup engineer assignment
- Daily report monitoring
- Attendance metrics

### Client Role
- View assigned engineers
- Monitor daily reports from field
- Track attendance
- View backup engineer information

### Admin Role
- System overview and metrics
- User management view
- Client and site overview
- System-wide analytics
- Attendance rates

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth with JWT tokens
- **Password Security**: Bcrypt hashing
- **ORM**: Supabase Client

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@company.com | Admin@123 |
| HR | hr@company.com | Hr@123 |
| Engineer | engineer@company.com | Eng@123 |
| Client | client@company.com | Client@123 |

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Storage Architecture

All data is stored in a **PostgreSQL database** hosted on Supabase. The application uses a service layer abstraction that maintains a clean separation between UI and data access:

```
UI Components
    ↓
Service Layer (abstraction)
    ↓
StorageService (Supabase Client)
    ↓
PostgreSQL Database
```

### Database Schema

Tables:
- **profiles** - User profiles linked to Supabase Auth
- **clients** - Client company information
- **sites** - Construction site locations
- **engineer_assignments** - Engineer-to-site assignments
- **check_ins** - GPS-based daily attendance records
- **daily_reports** - Work completion reports
- **leave_requests** - Leave applications with approvals

### Security Features

- **Row Level Security (RLS)**: Enabled on all tables
- **Role-Based Access**: Admin, HR, Engineer, Client roles
- **JWT Tokens**: Automatic token refresh and session management
- **Password Hashing**: Bcrypt for secure password storage
- **Forgot Password**: Email-based password reset flow

### Authentication Features

- **JWT Access Tokens**: Secure, stateless authentication
- **Refresh Tokens**: Automatic session renewal
- **Password Reset**: Email-based recovery
- **Session Management**: Automatic logout on password change
- **Auth State Persistence**: Sessions survive page refreshes

### Services
- `authService` - Authentication and password management
- `checkInService` - Attendance operations
- `reportService` - Daily reports
- `leaveService` - Leave management
- `assignmentService` - Engineer-client mapping

## Data Models

- **Users**: Admin, HR, Engineer, Client roles
- **Engineers**: Engineer profiles and status
- **Clients**: Client company information
- **Sites**: Work site locations
- **Assignments**: Engineer-to-client mappings
- **CheckIns**: Daily GPS-based attendance
- **DailyReports**: Work completion reports
- **LeaveRequests**: Leave applications with backup assignments

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Notes

- All data is stored in PostgreSQL database via Supabase
- Data persists across all devices and sessions
- GPS location is captured during check-in (requires browser permission)
- One check-in allowed per day per engineer
- Leave requests require HR approval
- Backup engineers can be assigned to cover leave periods
- Password reset emails are sent via Supabase Auth
- Sessions automatically refresh with JWT tokens
- All passwords are securely hashed with bcrypt

## Password Management

### Forgot Password Flow
1. Click "Forgot Password?" on login screen
2. Enter your email address
3. Check your email for reset link
4. Click the link to set a new password
5. All other sessions are automatically logged out

### Security Notes
- Passwords are never stored in plain text
- JWT tokens auto-refresh to maintain sessions
- Row-level security ensures data isolation
- All database queries enforce role-based permissions
