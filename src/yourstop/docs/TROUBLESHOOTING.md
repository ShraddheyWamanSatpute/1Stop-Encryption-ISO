# 🔧 Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. "Failed to fetch" Console Error

**Issue**: Next.js Hot Module Replacement (HMR) error
```
Error: Failed to fetch
Call Stack: createFetch, fetchServerResponse, hmrRefreshReducerImpl...
```

**Solution**: This is a common development error and doesn't affect functionality.

#### Quick Fixes:
1. **Refresh the browser** - Usually resolves the issue
2. **Restart the dev server**:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```
3. **Clear browser cache** and reload
4. **Check network connection**

#### Prevention:
- Avoid making rapid changes to files
- Wait for compilation to complete before making new changes
- Use `npm run dev` instead of other start commands

### 2. Firebase Authentication Errors

#### "auth/configuration-not-found"
**Cause**: Authentication providers not enabled in Firebase Console

**Solution**:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `studio-3045449262-19c49`
3. Go to Authentication → Sign-in method
4. Enable Google, Apple, Facebook providers
5. Add required OAuth credentials

#### "auth/operation-not-allowed"
**Cause**: Sign-in method not enabled

**Solution**: Enable the specific sign-in method in Firebase Console

#### "auth/popup-closed-by-user"
**Cause**: User closed the popup window

**Solution**: Try again, ensure popups are allowed

### 3. Development Server Issues

#### Server Won't Start
```bash
# Check if port is in use
lsof -i :9002

# Kill process using port
kill -9 $(lsof -t -i:9002)

# Restart server
npm run dev
```

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart server
npm run dev
```

### 4. Firebase Connection Issues

#### Test Firebase Connection
1. Go to `http://localhost:9002/auth`
2. Scroll down to "Debug Tools" section
3. Click "Run Firebase Tests"
4. Check browser console for results

#### Manual Testing in Browser Console
```javascript
// Open browser console (F12) and run:
runFirebaseTests()

// Or test specific functions:
testFirebaseConnection()
testEmailPasswordAuth('test@example.com', 'password123')
```

### 5. Authentication Not Working

#### Check Firebase Console
1. Verify project is active
2. Check authentication is enabled
3. Verify authorized domains include `localhost`
4. Check if email/password is enabled

#### Test with Email/Password
1. Go to `http://localhost:9002/auth`
2. Use email/password form
3. Create account or sign in
4. Check if redirect to homepage works

#### Debug Steps
1. Open browser console (F12)
2. Look for error messages
3. Check Network tab for failed requests
4. Verify Firebase configuration

### 6. File Upload Issues

#### Age Verification Upload
- Check if Firebase Storage is enabled
- Verify storage rules are correct
- Ensure file size is under limits
- Check file type is supported

#### Profile Picture Upload
- Same as above
- Check if user is authenticated
- Verify storage permissions

### 7. Real-time Data Issues

#### Firestore Not Updating
- Check if Firestore is enabled
- Verify security rules
- Check if user is authenticated
- Look for console errors

#### Favorites Not Saving
- Check browser localStorage
- Verify user authentication
- Check Firestore connection

### 8. Performance Issues

#### Slow Loading
- Check network connection
- Clear browser cache
- Restart development server
- Check for console errors

#### High Memory Usage
- Close unused browser tabs
- Restart browser
- Check for memory leaks in console

## 🛠️ Debug Tools

### Browser Console Commands
```javascript
// Test Firebase connection
runFirebaseTests()

// Check current user
console.log(auth.currentUser)

// Test authentication
testEmailPasswordAuth('email@example.com', 'password')

// Check Firebase config
console.log(firebaseConfig)
```

### Network Tab Debugging
1. Open Developer Tools (F12)
2. Go to Network tab
3. Look for failed requests (red)
4. Check request/response details
5. Look for CORS errors

### Console Error Analysis
1. Look for error messages in red
2. Check error codes and descriptions
3. Look for stack traces
4. Check if errors are related to Firebase

## 📞 Getting Help

### Before Asking for Help
1. **Check this troubleshooting guide**
2. **Try the suggested solutions**
3. **Check browser console for errors**
4. **Test with email/password authentication**
5. **Restart the development server**

### Information to Provide
1. **Error messages** from console
2. **Steps to reproduce** the issue
3. **Browser and version** you're using
4. **Operating system**
5. **Screenshots** if helpful

### Quick Health Check
1. ✅ Server running on `http://localhost:9002`
2. ✅ No console errors (except HMR warnings)
3. ✅ Email/password authentication works
4. ✅ Can create account and sign in
5. ✅ Redirects to homepage after login

## 🎯 Success Indicators

### Authentication Working
- Can create new account with email/password
- Can sign in with existing account
- Redirects to homepage after login
- User appears in header dropdown
- Can access profile page

### App Functionality
- Homepage loads with restaurants
- Search page works with filters
- Restaurant details page loads
- Booking form appears
- Profile page accessible

### Firebase Integration
- No authentication errors in console
- Real-time data updates work
- File uploads work (if tested)
- Favorites save and load
- Notifications work (if configured)

Your DineEase app should be working perfectly after following these troubleshooting steps! 🎉