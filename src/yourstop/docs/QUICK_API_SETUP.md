# 🚀 Quick API Setup - Get Started in 15 Minutes

## Step 1: Google Places API (5 minutes) - MOST IMPORTANT

### Why Start Here:
- Provides real restaurant data (names, locations, ratings, photos)
- Most comprehensive data source
- Easy to set up
- $200 free monthly credit

### Setup Steps:
1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**:
   - Click "Select a project" → "New Project"
   - Name: "BookMyTable" → Create
3. **Enable Places API**:
   - Go to "APIs & Services" → "Library"
   - Search "Places API" → Enable
4. **Create API Key**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the key (starts with "AIza...")
5. **Add to .env.local**:
   ```bash
   GOOGLE_PLACES_API_KEY=AIzaSyBvOkBw9cFzK8jH9iL2mN3oP4qR5sT6uV7w
   ```

## Step 2: Yelp API (3 minutes) - FREE

### Why Add This:
- Real reviews and ratings
- Completely free
- High-quality data

### Setup Steps:
1. **Go to Yelp Developers**: https://www.yelp.com/developers
2. **Create Account**: Sign up with email
3. **Create App**:
   - Click "Create New App"
   - App Name: "BookMyTable"
   - Description: "Restaurant booking platform"
4. **Get API Key**: Copy the key from your app
5. **Add to .env.local**:
   ```bash
   YELP_API_KEY=your_yelp_key_here
   ```

## Step 3: Square API (5 minutes) - FREE TIER

### Why Add This:
- Menu data and pricing
- Free tier available
- POS integration

### Setup Steps:
1. **Go to Square Developer**: https://developer.squareup.com/
2. **Create Account**: Sign up
3. **Create Application**:
   - Click "Create Application"
   - Name: "BookMyTable"
   - Description: "Restaurant booking platform"
4. **Get API Keys**:
   - Go to "API Keys" tab
   - Copy "Sandbox Access Token" (for testing)
5. **Add to .env.local**:
   ```bash
   SQUARE_API_KEY=your_square_key_here
   ```

## Step 4: Test Your Setup

### Quick Test:
1. **Restart Server**:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Check API Status**:
   - Visit: http://localhost:9002/api-test/
   - Should show: "3 Configured, 3 Working"

3. **Test Real Data**:
   - Visit: http://localhost:9002/
   - Search for restaurants
   - Should see real London restaurants instead of mock data

## Expected Results After Setup:

### Before (Mock Data):
- Generic restaurant names
- Fake locations
- Mock reviews
- Static pricing

### After (Real APIs):
- Real London restaurants
- Actual addresses and coordinates
- Genuine reviews and ratings
- Live menu data and pricing

## Troubleshooting:

### If APIs Still Show "0 Configured":
1. **Check .env.local file exists**:
   ```bash
   ls -la frontend/.env.local
   ```

2. **Verify file format**:
   ```bash
   cat frontend/.env.local
   ```

3. **Restart server**:
   ```bash
   npm run dev
   ```

### If APIs Show "Configured" but "0 Working":
1. **Check API key format** (no spaces, quotes, or extra characters)
2. **Verify API is enabled** in provider console
3. **Check rate limits** in provider dashboard

## Next Steps (Optional):

### Add More APIs Later:
- **OpenTable**: For real booking availability
- **Resy**: For restaurant reservations
- **Toast POS**: For advanced menu data
- **TripAdvisor**: For comprehensive reviews
- **Foursquare**: For location data

### Cost Management:
- **Google Places**: $200 free monthly
- **Yelp**: Free with limits
- **Square**: Free tier
- **Others**: Contact for pricing

## Pro Tips:

1. **Start Small**: Get 2-3 APIs working first
2. **Test Frequently**: Use the API testing panel
3. **Monitor Usage**: Check API dashboards for usage
4. **Keep Mock Data**: System falls back gracefully
5. **Document Keys**: Keep track of which APIs you've set up

## Success Indicators:

✅ **API Testing Panel Shows**:
- "3 Configured" (or however many you set up)
- "3 Working" (APIs responding)
- "0 Errors" (all working correctly)

✅ **Website Shows**:
- Real London restaurant names
- Actual addresses
- Genuine reviews and ratings
- Live menu data

✅ **Server Logs Show**:
- "API keys configured, using live data"
- No "using mock data" messages
