# 🚀 API Setup Guide - BookMyTable

## Quick Start - Enable Real APIs

### Step 1: Create Environment File
```bash
# Navigate to frontend directory
cd frontend

# Create .env.local file
touch .env.local
```

### Step 2: Add Your API Keys
Copy the template from `env-template.txt` and add your actual API keys:

```env
# Google Places API - For restaurant locations and basic info
GOOGLE_PLACES_API_KEY=AIzaSyBvOkBw9cFzK8jH9iL2mN3oP4qR5sT6uV7w

# Yelp API - For restaurant reviews and ratings  
YELP_API_KEY=your_yelp_api_key_here

# OpenTable API - For restaurant availability and bookings
OPENTABLE_API_KEY=your_opentable_api_key_here

# Resy API - For restaurant reservations
RESY_API_KEY=your_resy_api_key_here

# Toast POS API - For menu data and pricing
TOAST_API_KEY=your_toast_api_key_here

# Square API - For restaurant POS integration
SQUARE_API_KEY=your_square_api_key_here

# TripAdvisor API - For reviews and ratings
TRIPADVISOR_API_KEY=your_tripadvisor_api_key_here

# Foursquare API - For location data and check-ins
FOURSQUARE_API_KEY=your_foursquare_api_key_here
```

### Step 3: Test Integration
1. Visit: `http://localhost:9002/api-test/`
2. Click "Test Integration" button
3. Verify all APIs are working

## 🔑 How to Get API Keys

### 1. Google Places API
- **Cost**: $0.005 per request (first $200 free monthly)
- **Setup**: 
  1. Go to [Google Cloud Console](https://console.cloud.google.com/)
  2. Create/select project
  3. Enable Places API
  4. Create credentials (API Key)
  5. Restrict key to your domain

### 2. Yelp API
- **Cost**: Free (with rate limits)
- **Setup**:
  1. Go to [Yelp Developers](https://www.yelp.com/developers)
  2. Create account
  3. Create new app
  4. Get API key

### 3. OpenTable API
- **Cost**: Contact for pricing
- **Setup**:
  1. Apply at [OpenTable Platform](https://platform.opentable.com/)
  2. Complete partner application
  3. Get API access

### 4. Resy API
- **Cost**: Contact for pricing
- **Setup**:
  1. Contact [Resy](https://resy.com/about/contact)
  2. Request API access
  3. Complete integration process

### 5. Toast POS API
- **Cost**: Partner program
- **Setup**:
  1. Contact [Toast Partners](https://pos.toasttab.com/partners)
  2. Join partner program
  3. Get API access

### 6. Square API
- **Cost**: Free for basic usage
- **Setup**:
  1. Go to [Square Developer](https://developer.squareup.com/)
  2. Create account
  3. Create application
  4. Get API keys

### 7. TripAdvisor API
- **Cost**: Contact for pricing
- **Setup**:
  1. Apply at [TripAdvisor Developer](https://developer-tripadvisor.com/)
  2. Complete application
  3. Get API access

### 8. Foursquare API
- **Cost**: Free tier available
- **Setup**:
  1. Go to [Foursquare Developer](https://developer.foursquare.com/)
  2. Create account
  3. Create project
  4. Get API key

## 🧪 Testing Your Setup

### Current Status Check
Visit `http://localhost:9002/api-test/` to see:
- ✅ **8 Total APIs** - All integrated
- ❌ **0 Configured** - No API keys yet
- ❌ **0 Working** - Using mock data
- ❌ **0 Errors** - System working with fallback

### After Adding API Keys
You should see:
- ✅ **8 Total APIs** - All integrated
- ✅ **X Configured** - Number of keys added
- ✅ **X Working** - Number of APIs responding
- ❌ **0 Errors** - All APIs working

## 🔄 Data Flow

### With Mock Data (Current)
```
User Request → Mock Data Service → UI Display
```

### With Real APIs (After Setup)
```
User Request → API Service → External APIs → Data Processing → UI Display
```

## 🚨 Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Check key is correctly copied
   - Verify API is enabled in provider console
   - Check rate limits

2. **Still Seeing Mock Data**
   - Restart development server: `npm run dev`
   - Check `.env.local` file exists
   - Verify API key format

3. **Rate Limit Exceeded**
   - Check API usage in provider console
   - Implement caching (already built-in)
   - Consider upgrading API plan

### Debug Steps
1. Check API testing panel: `/api-test/`
2. Check browser console for errors
3. Check server logs in terminal
4. Verify `.env.local` file format

## 📊 Expected Results

### Before API Keys
- All data comes from mock sources
- "No API keys configured, using mock data" in logs
- API testing panel shows 0 configured APIs

### After API Keys
- Real restaurant data from London
- Live availability and pricing
- Actual reviews and ratings
- Real-time menu updates

## 🎯 Next Steps

1. **Start with Google Places** - Easiest to get, provides basic restaurant data
2. **Add Yelp** - For reviews and ratings
3. **Integrate OpenTable/Resy** - For real booking availability
4. **Add POS APIs** - For live menu data
5. **Complete with review APIs** - For comprehensive reviews

## 💡 Pro Tips

- Start with free APIs (Google Places, Yelp, Square)
- Test one API at a time
- Use the API testing panel to monitor status
- Keep mock data as fallback for missing APIs
- Monitor API usage and costs
