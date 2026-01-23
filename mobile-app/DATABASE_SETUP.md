# Database Setup Guide

The mobile app uses the same Supabase database as the web application. If you've already set up the web app, the database is ready!

## Database Tables

The following tables are required:

### 1. users
Stores user information and roles.

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  role text not null check (role in ('engineer', 'hr', 'client', 'admin')),
  created_at timestamptz default now()
);

alter table users enable row level security;

create policy "Users can read own data"
  on users for select
  to authenticated
  using (auth.uid() = id);
```

### 2. check_ins
GPS-based check-in records.

```sql
create table check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  user_name text not null,
  latitude numeric not null,
  longitude numeric not null,
  address text,
  timestamp timestamptz not null,
  created_at timestamptz default now()
);

alter table check_ins enable row level security;

create policy "Engineers can insert own check-ins"
  on check_ins for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view check-ins based on role"
  on check_ins for select
  to authenticated
  using (
    auth.uid() = user_id or
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role in ('hr', 'client', 'admin')
    )
  );
```

### 3. daily_reports
Daily work progress reports.

```sql
create table daily_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  user_name text not null,
  date date not null,
  site_location text not null,
  work_description text not null,
  progress integer not null check (progress >= 0 and progress <= 100),
  issues text,
  materials_used text,
  timestamp timestamptz not null,
  created_at timestamptz default now()
);

alter table daily_reports enable row level security;

create policy "Engineers can insert own reports"
  on daily_reports for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view reports based on role"
  on daily_reports for select
  to authenticated
  using (
    auth.uid() = user_id or
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role in ('hr', 'client', 'admin')
    )
  );
```

### 4. leave_requests
Leave application management.

```sql
create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  user_name text not null,
  start_date date not null,
  end_date date not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  timestamp timestamptz not null,
  created_at timestamptz default now()
);

alter table leave_requests enable row level security;

create policy "Engineers can insert own leave requests"
  on leave_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Engineers can view own leave requests"
  on leave_requests for select
  to authenticated
  using (
    auth.uid() = user_id or
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role in ('hr', 'admin')
    )
  );

create policy "HR can update leave status"
  on leave_requests for update
  to authenticated
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role in ('hr', 'admin')
    )
  );
```

## Test Data

Create test users with authentication:

```sql
-- Note: Password hashing should be done through Supabase Auth
-- Use the Supabase dashboard or Auth API to create these users

-- Engineer User
insert into users (id, email, name, role) values
  ('engineer-uuid', 'engineer@test.com', 'John Engineer', 'engineer');

-- HR User
insert into users (id, email, name, role) values
  ('hr-uuid', 'hr@test.com', 'Sarah HR', 'hr');

-- Client User
insert into users (id, email, name, role) values
  ('client-uuid', 'client@test.com', 'Mike Client', 'client');

-- Admin User
insert into users (id, email, name, role) values
  ('admin-uuid', 'admin@test.com', 'Admin User', 'admin');
```

## Creating Users via Supabase Auth

1. Go to Supabase Dashboard
2. Navigate to Authentication → Users
3. Click "Add User"
4. Enter email and password
5. After creation, add user record to `users` table with matching `id`

## Indexes for Performance

Add these indexes for better query performance:

```sql
create index check_ins_user_id_idx on check_ins(user_id);
create index check_ins_timestamp_idx on check_ins(timestamp);
create index daily_reports_user_id_idx on daily_reports(user_id);
create index daily_reports_date_idx on daily_reports(date);
create index leave_requests_user_id_idx on leave_requests(user_id);
create index leave_requests_status_idx on leave_requests(status);
```

## Verification

After setup, verify the tables exist:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Should show:
- check_ins
- daily_reports
- leave_requests
- users

## Connection Test

Test the connection from the mobile app:

1. Start the app
2. Try to login
3. If successful, database is connected!

## Already Set Up?

If you're using the same Supabase project as the web app, the database should already be configured. Just ensure:

1. All tables exist
2. RLS policies are enabled
3. Test users are created
4. Environment variables are correct in `.env`

That's it! Your database is ready for the mobile app.
