# Test Email Feature - Implementation Complete

## Overview
Added a test email feature to the **Bookings Settings** page that allows users to send test emails using their connected Gmail or Outlook accounts.

## What Was Added

### 1. Backend - Firebase Cloud Function
**File:** `functions/src/sendTestEmail.ts`
- Created a new Cloud Function to handle test email sending
- Supports both Gmail and Outlook providers
- Uses OAuth tokens stored in Firestore
- Sends a professional test email with timestamp and sender information
- Updates the `lastUsed` timestamp when emails are sent

**Features:**
- CORS enabled for frontend calls
- Validates recipient email and provider
- Retrieves OAuth tokens from Firestore based on company/site/subsite context
- Gmail integration using Google Gmail API
- Outlook integration using Microsoft Graph API
- Proper error handling and informative error messages

### 2. Frontend - BookingSettings Component
**File:** `src/frontend/components/bookings/BookingSettings.tsx`

**Added State:**
- `testEmail`: Stores the recipient email address
- `sendingTestEmail`: Loading state for the send operation

**Added Function:**
- `handleSendTestEmail()`: Handles the test email sending process
  - Validates email format
  - Checks if a provider is connected
  - Calls the Cloud Function
  - Shows success/error messages
  - Clears the input on success

**Added UI:**
- Beautiful test email section that appears only when Gmail or Outlook is connected
- Email input field with validation
- "Send Test" button with loading state
- Shows which provider is being used (Gmail or Outlook)
- Supports Enter key to send
- Styled with MUI components matching the app theme

### 3. Exported Function
**File:** `functions/src/index.ts`
- Added export for `sendTestEmail` function

## How It Works

1. **Connect Email Account:**
   - User connects Gmail or Outlook account in Bookings Settings
   - OAuth tokens are stored in Firestore

2. **Test Email Section Appears:**
   - Once an account is connected, the "Send Test Email" section becomes visible

3. **Send Test Email:**
   - User enters any email address
   - Clicks "Send Test" button (or presses Enter)
   - Frontend validates the email
   - Frontend calls the `sendTestEmail` Cloud Function
   - Function retrieves OAuth tokens from Firestore
   - Function sends email using the connected provider
   - User receives success/error message

## Test Email Content
The test email includes:
- Subject: "Test Email from 1Stop System"
- Body with:
  - Greeting
  - Explanation that this is a test
  - Sender email address
  - Timestamp
  - Confirmation message
  - Signature from 1Stop Team

## Usage Instructions

1. Navigate to **Bookings → Settings**
2. Scroll to the "Email Integration" section
3. Click "Connect" on either Gmail or Outlook
4. Complete the OAuth flow
5. Once connected, the "Send Test Email" section appears
6. Enter any email address in the "Recipient Email" field
7. Click "Send Test" button
8. Check the recipient inbox for the test email

## Benefits

- ✅ Verify email configuration is working
- ✅ Test OAuth connection
- ✅ Confirm emails are being sent from the correct account
- ✅ User-friendly interface
- ✅ Real-time feedback with success/error messages
- ✅ No need to create actual bookings to test email functionality

## Technical Details

**Cloud Function URL:**
```
https://us-central1-{projectId}.cloudfunctions.net/sendTestEmail
```

**Request Format:**
```json
{
  "provider": "gmail" | "outlook",
  "recipientEmail": "user@example.com",
  "companyId": "company-id",
  "siteId": "site-id",
  "subsiteId": "subsite-id"
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Test email sent successfully to user@example.com from account@gmail.com"
}
```

## Files Modified/Created

### Created:
- `functions/src/sendTestEmail.ts` - New Cloud Function

### Modified:
- `functions/src/index.ts` - Added export
- `src/frontend/components/bookings/BookingSettings.tsx` - Added UI and handler

## Next Steps

The feature is ready to use! To deploy the Cloud Function:

```bash
cd functions
npm run build
firebase deploy --only functions:sendTestEmail
```

Or deploy all functions:
```bash
firebase deploy --only functions
```

## Notes

- The test email feature only appears when at least one email provider is connected
- The feature automatically uses whichever provider is connected (Gmail takes precedence if both are connected)
- Email validation is performed on the frontend before sending
- All errors are displayed to the user with helpful messages

