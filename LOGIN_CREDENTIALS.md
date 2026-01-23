# Login Credentials

The application uses Supabase authentication with PostgreSQL database.

## Available Test Accounts

### Admin Account
- **Email:** admin@company.com
- **Password:** admin123

### HR Account
- **Email:** hr@company.com
- **Password:** hr123

### Engineer Accounts
- **Email:** engineer@company.com | **Password:** engineer123
- **Email:** david.m@company.com | **Password:** david123
- **Email:** emma.w@company.com | **Password:** emma123
- **Email:** robert.t@company.com | **Password:** robert123
- **Email:** sarah.j@company.com | **Password:** sarah123
- **Email:** michael.b@company.com | **Password:** michael123
- **Email:** priya.s@company.com | **Password:** priya123
- **Email:** alex.k@company.com | **Password:** alex123

### Client Account
- **Email:** client@company.com
- **Password:** client123

## Database Information

The system includes:
- 11 users (1 admin, 1 HR, 8 engineers, 1 client)
- 9 clients with 15 sites
- 8 active engineer assignments
- 15 check-in records
- 11 daily work reports
- 11 leave requests (approved, pending, and rejected)

## How It Works

- Authentication via Supabase Auth
- User profiles stored in PostgreSQL database
- Row Level Security (RLS) policies enforce access control
- Role-based routing automatically redirects users to their respective dashboards after login
