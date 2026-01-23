# Application Architecture

## Overview

The application uses a unified API layer built with Supabase Edge Functions, providing a consistent interface for both web and mobile apps.

## Architecture Diagram

```
┌─────────────┐
│  Mobile App │
└──────┬──────┘
       │
       │  HTTP Requests
       │  (JSON)
       ▼
┌──────────────────────┐
│   API Layer          │
│  (Edge Functions)    │
│                      │
│  • /auth-login       │
│  • /checkin          │
│  • /report           │
│  • /leave            │
│  • /dashboard        │
│  • /reports          │
└──────┬───────────────┘
       │
       │  Database Queries
       │  (SQL)
       ▼
┌──────────────────────┐
│   Supabase           │
│   Database           │
│                      │
│  • profiles          │
│  • check_ins         │
│  • daily_reports     │
│  • leave_requests    │
│  • clients           │
│  • sites             │
│  • assignments       │
└──────────────────────┘
       ▲
       │
       │  HTTP Requests
       │  (JSON)
       │
┌──────┴──────┐
│  Web App    │
└─────────────┘
```

## Components

### 1. Edge Functions (API Layer)

**Location**: Deployed to Supabase

**Purpose**:
- Provide REST API endpoints
- Validate requests
- Enforce authentication
- Abstract database operations
- Apply business logic

**Functions**:
- `auth-login`: Handle user authentication
- `checkin`: Manage engineer check-ins
- `report`: Handle daily reports
- `leave`: Manage leave requests
- `dashboard`: Provide statistics
- `reports`: Fetch daily reports with filters

**Benefits**:
- Consistent API for web and mobile
- Centralized business logic
- Easy to version and maintain
- Better security (credentials stay on server)
- Can add rate limiting, validation, etc.

### 2. Web Application

**Location**: `/src`

**Stack**:
- React + TypeScript
- Vite
- Tailwind CSS
- Supabase Client (for auth state only)

**Key Files**:
- `src/lib/apiClient.ts`: HTTP client for API calls
- `src/services/*.ts`: Service layer calling Edge Functions
- `src/components/`: UI components
- `src/contexts/AuthContext.tsx`: Authentication state

**Data Flow**:
```
Component → Service → API Client → Edge Function → Database
```

### 3. Mobile Application

**Location**: `/mobile-app`

**Stack**:
- React Native
- TypeScript
- Expo
- Async Storage (offline)

**Key Files**:
- `mobile-app/src/services/*.ts`: Service layer
- `mobile-app/src/screens/`: Screen components
- `mobile-app/src/utils/AuthContext.tsx`: Authentication

**Data Flow**:
```
Screen → Service → Fetch API → Edge Function → Database
```

**Offline Support**:
- Data stored in AsyncStorage
- Syncs when online
- Queue for pending operations

## API Client Implementation

### Web App (src/lib/apiClient.ts)

```typescript
const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

export const apiClient = {
  async post(endpoint, data, requiresAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
      ...(requiresAuth && {
        'Authorization': `Bearer ${await getAuthToken()}`
      }),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    return response.json();
  },
  // ... get, put methods
};
```

### Mobile App (Similar Pattern)

```typescript
const API_BASE_URL = `${SUPABASE_URL}/functions/v1`;

export async function apiRequest(endpoint, options) {
  const token = await getStoredToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  return response.json();
}
```

## Service Layer Examples

### Check-in Service

**Before (Direct Database)**:
```typescript
export const checkInService = {
  async createCheckIn(data) {
    return await supabase
      .from('check_ins')
      .insert(data)
      .select()
      .single();
  }
};
```

**After (API Layer)**:
```typescript
export const checkInService = {
  async createCheckIn(data) {
    return await apiClient.post('/checkin', data);
  }
};
```

## Authentication Flow

1. User enters credentials
2. App calls `/auth-login` Edge Function
3. Edge Function validates with Supabase Auth
4. Returns user profile + session token
5. App stores token for subsequent requests
6. All other API calls include token in Authorization header

## Security

### Edge Functions
- JWT verification enabled (except login)
- Token validation on every request
- User context from token
- RLS policies on database

### Database
- Row Level Security enabled on all tables
- Policies check `auth.uid()`
- Restricts data access by role

## Deployment

### Edge Functions
Already deployed:
- auth-login
- checkin
- report
- leave
- dashboard
- reports

### Web App
Deploy to any static host (Vercel, Netlify, etc.)

### Mobile App
Build with Expo and deploy to app stores

## Benefits of This Architecture

1. **Single Source of Truth**: Business logic in one place
2. **Consistency**: Same API for all clients
3. **Security**: Credentials and validation on server
4. **Flexibility**: Can add web/mobile/desktop apps easily
5. **Scalability**: Edge functions auto-scale
6. **Maintainability**: Change API without touching clients
7. **Type Safety**: Shared TypeScript types

## Future Enhancements

- API versioning (/v2/checkin)
- Rate limiting per user
- Caching layer
- WebSocket for real-time updates
- API documentation (Swagger/OpenAPI)
- Request/response logging
- Analytics and monitoring
