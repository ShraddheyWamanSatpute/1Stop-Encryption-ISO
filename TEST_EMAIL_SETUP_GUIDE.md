# Test Email Feature - Setup Guide

## Overview
The test email feature now works in **both development and production** environments.

## How It Works

### Development Mode (localhost:5173)
- Uses Firebase Emulator at `http://127.0.0.1:5001`
- No deployment needed
- Fast testing and debugging

### Production Mode (deployed build)
- Uses deployed Cloud Functions at `https://us-central1-stop-test-8025f.cloudfunctions.net`
- Requires deployment to Firebase
- Production-ready

## Setup Instructions

### Option 1: For Local Development (Recommended for Testing)

1. **Start the Firebase Emulator**
   Open a new terminal and run:
   ```bash
   cd "A:\Code\1Stop\Combined\Individual\1Stop - Version 5\functions"
   npm run serve
   ```

   This will start the Firebase Functions emulator on `http://127.0.0.1:5001`

2. **Start Your Development Server**
   In another terminal:
   ```bash
   cd "A:\Code\1Stop\Combined\Individual\1Stop - Version 5"
   npm run dev
   ```

3. **Test the Email Feature**
   - Go to `http://localhost:5173`
   - Navigate to Bookings → Settings
   - Connect Gmail or Outlook
   - Use the "Send Test Email" feature
   - The request will go to the local emulator

### Option 2: For Production Deployment

1. **Deploy the Function**
   ```bash
   cd "A:\Code\1Stop\Combined\Individual\1Stop - Version 5"
   firebase deploy --only functions:sendTestEmail
   ```

2. **Build and Deploy Your App**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

3. **Test on Production**
   - Visit your deployed site
   - Navigate to Bookings → Settings
   - Test the email feature

## Quick Start (Easiest Way to Test Now)

1. **Open TWO terminal windows**

   **Terminal 1 - Firebase Emulator:**
   ```bash
   cd "A:\Code\1Stop\Combined\Individual\1Stop - Version 5\functions"
   npm run serve
   ```
   
   Wait for message: ✔ functions[us-central1-sendTestEmail]: http function initialized

   **Terminal 2 - Dev Server:**
   ```bash
   cd "A:\Code\1Stop\Combined\Individual\1Stop - Version 5"
   npm run dev
   ```

2. **Open your browser** to `http://localhost:5173`

3. **Test the email feature!**

## How the Code Detects Environment

The code automatically detects the environment:

```typescript
const isDevelopment = import.meta.env.DEV;
const fnBase = isDevelopment 
  ? 'http://127.0.0.1:5001/stop-test-8025f/us-central1'  // Local emulator
  : `https://us-central1-stop-test-8025f.cloudfunctions.net`; // Production
```

## Troubleshooting

### CORS Error Still Showing?
- Make sure the Firebase emulator is running (`npm run serve` in the functions folder)
- Check the emulator is on port 5001
- Refresh your browser

### Function Not Found?
- Verify the emulator is running: check for the startup message
- Look for: `✔ functions[us-central1-sendTestEmail]: http function initialized`

### Email Not Sending?
- Ensure you've connected Gmail or Outlook first
- Check the browser console for detailed error messages
- Verify OAuth tokens are stored in Firestore

## Emulator vs Production Comparison

| Feature | Emulator (Dev) | Production |
|---------|---------------|------------|
| Speed | ⚡ Instant | Slower (network) |
| Cost | 🆓 Free | Costs apply |
| Debugging | 🔍 Full logs | Limited logs |
| Setup | Run command | Deploy required |
| Internet | Not needed | Required |

## Next Steps

**For Development:**
- Keep the emulator running while coding
- Test changes instantly without deployment
- View detailed function logs in terminal

**For Production:**
- Deploy when ready: `firebase deploy --only functions:sendTestEmail`
- Monitor in Firebase Console
- Check function logs for issues

## Current Status

✅ Function compiled successfully  
✅ CORS configured properly  
✅ Development environment ready  
⏳ Production deployment (run `firebase deploy --only functions:sendTestEmail`)

## Notes

- The emulator must be running for local testing
- Changes to the function require rebuilding: `npm run build` in functions folder
- The emulator will auto-reload functions when they change
- OAuth tokens work the same in both environments (stored in Firestore)

