# OAuth Deployment Guide

## Step 1: Set Up OAuth Applications

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"
5. Set Application type to "Web application"
6. Add Authorized redirect URIs:
   - `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/oauthCallbackGmail`
7. Copy the Client ID and Client Secret

### Microsoft OAuth Setup
1. Go to [Azure Portal](https://portal.azure.com/)
2. Go to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Set Name: "Your App Name"
5. Set Redirect URI: `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/oauthCallbackOutlook`
6. Go to "Certificates & secrets" > "New client secret"
7. Copy the Client ID and Client Secret

## Step 2: Configure Environment Variables

### Option A: Firebase Config (Recommended)
```bash
firebase functions:config:set oauth.google.client_id="YOUR_GOOGLE_CLIENT_ID"
firebase functions:config:set oauth.google.client_secret="YOUR_GOOGLE_CLIENT_SECRET"
firebase functions:config:set oauth.microsoft.client_id="YOUR_MICROSOFT_CLIENT_ID"
firebase functions:config:set oauth.microsoft.client_secret="YOUR_MICROSOFT_CLIENT_SECRET"
```

### Option B: Environment Variables
Create a `.env` file in the functions directory:
```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

## Step 3: Deploy the Functions

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Build the functions
npm run build

# Deploy to Firebase
firebase deploy --only functions
```

## Step 4: Company Context Integration ✅

The `BookingSettings.tsx` file now automatically uses the company/site/subsite context from the `BookingsContext`:

```typescript
// Company/site/subsite context is automatically retrieved from BookingsContext
const companyId = companyID || 'unknown-company';
const siteId = siteID || 'default';
const subsiteId = subsiteID || 'default';
const userId = 'current-user'; // You might want to get this from auth context
```

**Note:** The `userId` is still a placeholder. If you have an auth context, you can replace it with the actual user ID.

## Step 5: Test the OAuth Flow

1. Go to your settings page
2. Click "Connect" for Gmail or Outlook
3. You should be redirected to the provider's sign-in page
4. After signing in, you should be redirected back to your settings page
5. The account should show as "Connected"
6. The OAuth tokens will be stored with proper company/site association

## Step 6: Verify Deployment

Check that these URLs are accessible:
- `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/oauthGoogle`
- `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/oauthOutlook`
- `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/checkOAuthStatus`
- `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/disconnectOAuth`

## Troubleshooting

### Common Issues:
1. **404 Error**: Make sure functions are deployed and URLs are correct
2. **OAuth Error**: Check that redirect URIs match exactly in OAuth app settings
3. **Permission Denied**: Ensure your Firebase project has the necessary APIs enabled

### Check Logs:
```bash
firebase functions:log
```

### Test Locally:
```bash
cd functions
npm run serve
```

## Security Notes

- Never commit OAuth secrets to version control
- Use Firebase Config or environment variables for secrets
- Consider encrypting stored tokens in Firestore
- Implement proper user authentication before storing tokens
- OAuth tokens are now properly scoped to company/site combinations
- Each company/site has separate OAuth token storage

## Data Structure

OAuth tokens are stored in Firestore with the following structure:

```javascript
// Document ID: {companyId}_{siteId}_{subsiteId}_{provider}
// Example: "company123_site456_subsite789_gmail"

{
  provider: "gmail" | "outlook",
  email: "user@example.com",
  tokens: {
    access_token: "...",
    refresh_token: "...",
    // ... other OAuth tokens
  },
  companyId: "company123",
  siteId: "site456",
  subsiteId: "subsite789",
  userId: "user456",
  connectedAt: "2024-01-01T00:00:00Z",
  lastUsed: "2024-01-01T00:00:00Z"
}
```
