# ⚡ QUICK START - Test Email Feature

## The Emulator is Now Running! 🎉

I've started the Firebase Functions emulator for you in the background.

## What to Do Now:

### ✅ The emulator is starting...

Wait about 10-15 seconds, then you should see a message in your terminal like:
```
✔  functions[us-central1-sendTestEmail]: http function initialized
```

### 🧪 Test the Email Feature:

1. **Go to your browser** at `http://localhost:5173`
2. **Navigate to**: Bookings → Settings
3. **Connect an email account**: Click "Connect" on Gmail or Outlook
4. **Scroll down** to see "Send Test Email" section
5. **Enter an email address** and click "Send Test"
6. **Check your inbox!** ✉️

## ⚠️ If You Still Get Connection Refused:

The emulator might take a moment to start. Wait 15-20 seconds and try again.

Or manually restart it:

```bash
# Stop any running emulators
firebase emulators:stop

# Start fresh
firebase emulators:start --only functions
```

## 🔍 Check if Emulator is Running:

Look for this in your terminal:
```
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! It is now safe to connect your app. │
│ i  View Emulator UI at http://127.0.0.1:4000                 │
└─────────────────────────────────────────────────────────────┘

┌───────────┬────────────────┬─────────────────────────────────┐
│ Emulator  │ Host:Port      │ View in Emulator UI             │
├───────────┼────────────────┼─────────────────────────────────┤
│ Functions │ 127.0.0.1:5001 │ http://127.0.0.1:4000/functions │
└───────────┴────────────────┴─────────────────────────────────┘
```

## 🎯 Current Status:

✅ Firebase emulator starting in background  
✅ Your dev server should already be running  
⏳ Wait 10-15 seconds for emulator to initialize  
⏳ Then test the email feature!

## 💡 Pro Tip:

Keep the emulator running in the background while you develop. You only need to start it once!

