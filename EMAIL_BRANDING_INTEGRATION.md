# Email Branding Integration Guide

This guide explains how company branding is integrated into email reports.

## Overview

All email reports now include company branding (logo, colors, contact info) automatically pulled from the `company_profiles` table.

## Email Template Service

The `emailTemplateService` provides branded email templates for:
- Daily Reports
- Weekly Reports
- Monthly Reports

### Features

- Company logo in email header
- Primary/secondary color scheme
- Company contact information in footer
- Professional HTML table styling
- Responsive design

## Usage Example

```typescript
import { supabase } from '../lib/supabase';
import { companyProfileService } from '../services/companyProfileService';
import { emailTemplateService } from '../services/emailTemplateService';

// Fetch company branding
const branding = await companyProfileService.getCompanyProfile();

// Prepare report data
const reportData = {
  companyProfile: branding,
  subject: 'Daily Attendance & Work Report – ABC Company – Jan 15, 2025',
  reportPeriod: 'January 15, 2025',
  clientName: 'ABC Infrastructure Pvt Ltd',
  data: [
    {
      engineerName: 'John Doe',
      designation: 'Site Engineer',
      status: 'Present',
      checkInTime: '09:15 AM',
      location: 'Mumbai Site A',
      workSummary: 'Foundation inspection completed',
      backupEngineer: '-'
    }
  ]
};

// Generate HTML email
const htmlEmail = emailTemplateService.generateDailyReportEmail(reportData);

// Send email (using your email service)
await sendEmail({
  to: 'client@example.com',
  subject: reportData.subject,
  html: htmlEmail
});
```

## Email Functions

### Integration Steps

When creating Supabase Edge Functions for email reports:

1. Import the services:
```typescript
import { createClient } from 'npm:@supabase/supabase-js@2';
```

2. Fetch company profile at the start of the function:
```typescript
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const { data: branding } = await supabase
  .from('company_profiles')
  .select('*')
  .limit(1)
  .maybeSingle();
```

3. Use the template service (you'll need to port it to the edge function):
```typescript
// Generate email HTML
const emailHtml = generateEmailTemplate(branding, reportData);
```

## Customization

Admins can customize branding via:
- Admin Dashboard → Company Profile tab

Changes automatically apply to all future emails.

## Email Types

### 1. Daily Client-Wise Email (11:59 PM)
- Sent to: Client (their engineers), HR, Admin, Individual engineers
- Subject: `Daily Attendance & Work Report – {{Client Name}} – {{Date}}`

### 2. Weekly Summary Email (Sunday 11:59 PM)
- Sent to: Client, HR, Admin, Individual engineers
- Subject: `Weekly Attendance & Work Summary – {{Client Name}} ({{From Date}} – {{To Date}})`

### 3. Monthly Summary Email (Last day of month 11:59 PM)
- Sent to: Client, HR, Admin, Individual engineers
- Subject: `Monthly Attendance & Work Report – {{Client Name}} – {{Month Year}}`

## Template Components

### Header
- Company logo (if uploaded) or branded icon
- Company name with gradient background
- Primary/secondary color scheme

### Body
- Report title with primary color
- Client name and date range
- Professional table with alternating rows
- Color-coded attendance status badges

### Footer
- Company address
- Support email and phone
- Professional disclaimer text
- Border styled with primary color

## Default Values

If no company profile exists:
- Brand Name: "Site Engineer"
- Primary Color: #2563eb (blue)
- Secondary Color: #1e40af (darker blue)
- Default placeholder contact info

## Security

- Only authenticated users can access company profiles
- HR has read-only access
- Only Admin can modify branding

## Related Files

- `/src/services/companyProfileService.ts` - Company profile CRUD
- `/src/services/emailTemplateService.ts` - Email template generation
- `/src/components/CompanyProfile.tsx` - Admin UI for branding management
