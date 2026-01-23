# API Layer Documentation

## Architecture

The application uses a unified API layer built with Supabase Edge Functions. Both web and mobile apps communicate through these REST endpoints.

```
Mobile App  →  API Layer (Edge Functions)  →  Supabase Database
Web App     →
```

## Base URL

```
https://[YOUR_PROJECT_URL].supabase.co/functions/v1
```

## Authentication

All endpoints (except login) require authentication using Bearer tokens:

```
Authorization: Bearer [ACCESS_TOKEN]
```

## Endpoints

### POST /auth-login

**Description**: Authenticate user and get session token

**Auth Required**: No

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response** (200):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "engineer",
    "phone": "+1234567890",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1234567890
  }
}
```

**Error Response** (401):
```json
{
  "error": "Invalid credentials"
}
```

---

### POST /checkin

**Description**: Create a new check-in for today

**Auth Required**: Yes

**Request Body**:
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "locationName": "Client Office",
  "siteId": "uuid-optional"
}
```

**Success Response** (201):
```json
{
  "id": "uuid",
  "engineerId": "uuid",
  "checkInTime": "2024-01-01T08:00:00Z",
  "checkOutTime": null,
  "latitude": 40.7128,
  "longitude": -74.0060,
  "locationName": "Client Office",
  "date": "2024-01-01",
  "createdAt": "2024-01-01T08:00:00Z"
}
```

**Error Response** (400):
```json
{
  "error": "Already checked in today"
}
```

---

### GET /checkin

**Description**: Get check-in history

**Auth Required**: Yes

**Query Parameters**:
- `engineerId` (optional): Filter by specific engineer

**Success Response** (200):
```json
[
  {
    "id": "uuid",
    "engineerId": "uuid",
    "checkInTime": "2024-01-01T08:00:00Z",
    "checkOutTime": "2024-01-01T17:00:00Z",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "locationName": "Client Office",
    "date": "2024-01-01",
    "createdAt": "2024-01-01T08:00:00Z"
  }
]
```

---

### POST /report

**Description**: Submit a daily work report

**Auth Required**: Yes

**Request Body**:
```json
{
  "clientId": "uuid",
  "workDone": "Completed server maintenance",
  "issues": "No issues",
  "siteId": "uuid-optional",
  "hoursWorked": 8
}
```

**Success Response** (201):
```json
{
  "id": "uuid",
  "engineerId": "uuid",
  "clientId": "uuid",
  "siteId": "uuid",
  "date": "2024-01-01",
  "workDone": "Completed server maintenance",
  "issues": "No issues",
  "hoursWorked": 8,
  "createdAt": "2024-01-01T17:00:00Z"
}
```

**Error Response** (400):
```json
{
  "error": "clientId and workDone are required"
}
```

---

### GET /reports

**Description**: Get daily reports

**Auth Required**: Yes

**Query Parameters**:
- `engineerId` (optional): Filter by engineer
- `clientId` (optional): Filter by client

**Success Response** (200):
```json
[
  {
    "id": "uuid",
    "engineerId": "uuid",
    "clientId": "uuid",
    "siteId": "uuid",
    "date": "2024-01-01",
    "workDone": "Completed server maintenance",
    "issues": "No issues",
    "createdAt": "2024-01-01T17:00:00Z"
  }
]
```

---

### POST /leave

**Description**: Submit a leave request

**Auth Required**: Yes

**Request Body**:
```json
{
  "startDate": "2024-01-15",
  "endDate": "2024-01-20",
  "reason": "Family vacation"
}
```

**Success Response** (201):
```json
{
  "id": "uuid",
  "engineerId": "uuid",
  "startDate": "2024-01-15",
  "endDate": "2024-01-20",
  "reason": "Family vacation",
  "status": "pending",
  "backupEngineerId": null,
  "approvedBy": null,
  "approvedAt": null,
  "createdAt": "2024-01-01T10:00:00Z"
}
```

---

### GET /leave

**Description**: Get leave requests

**Auth Required**: Yes

**Query Parameters**:
- `engineerId` (optional): Filter by engineer
- `all` (optional): Set to "true" to get all leave requests

**Success Response** (200):
```json
[
  {
    "id": "uuid",
    "engineerId": "uuid",
    "startDate": "2024-01-15",
    "endDate": "2024-01-20",
    "reason": "Family vacation",
    "status": "pending",
    "backupEngineerId": null,
    "approvedBy": null,
    "approvedAt": null,
    "createdAt": "2024-01-01T10:00:00Z"
  }
]
```

---

### PUT /leave

**Description**: Update leave request status (approve/reject)

**Auth Required**: Yes

**Query Parameters**:
- `id` (required): Leave request ID

**Request Body**:
```json
{
  "status": "approved",
  "backupEngineerId": "uuid-optional"
}
```

**Success Response** (200):
```json
{
  "id": "uuid",
  "engineerId": "uuid",
  "startDate": "2024-01-15",
  "endDate": "2024-01-20",
  "reason": "Family vacation",
  "status": "approved",
  "backupEngineerId": "uuid",
  "approvedBy": "uuid",
  "approvedAt": "2024-01-01T12:00:00Z",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

---

### GET /dashboard

**Description**: Get dashboard statistics

**Auth Required**: Yes

**Success Response** (200):
```json
{
  "totalEngineers": 10,
  "totalClients": 5,
  "totalSites": 8,
  "activeAssignments": 7,
  "todayCheckIns": 9,
  "todayReports": 6,
  "pendingLeaves": 2
}
```

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `405`: Method Not Allowed
- `500`: Internal Server Error

## CORS

All endpoints support CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-Client-Info, Apikey`

## Usage Example (JavaScript)

```javascript
const API_BASE_URL = 'https://[YOUR_PROJECT_URL].supabase.co/functions/v1';

async function checkIn(token, data) {
  const response = await fetch(`${API_BASE_URL}/checkin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}
```

## Mobile App Integration

For React Native, use the same approach with fetch API:

```javascript
import { SUPABASE_URL } from './config/supabase';

const API_BASE_URL = `${SUPABASE_URL}/functions/v1`;

export async function createCheckIn(token, location) {
  const response = await fetch(`${API_BASE_URL}/checkin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(location),
  });

  return response.json();
}
```
