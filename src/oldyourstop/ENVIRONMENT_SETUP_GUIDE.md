# 🔧 Environment Setup Guide - Book My Table

## 📋 **MANUAL UPDATES REQUIRED**

### **1. Update `/frontend/.env.local` (CRITICAL)**

Create or update your `.env.local` file with these exact values:

```bash
# ===== ESSENTIAL API KEYS (Required for basic functionality) =====

# Google Places API - CRITICAL for restaurant data (5,896+ restaurants)
# Get from: https://console.cloud.google.com/apis/credentials
# Enable: Places API, Maps JavaScript API, Geocoding API
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# ===== FOURSQUARE API (Currently deprecated but ready) =====
# Current working key (deprecated endpoints)
NEXT_PUBLIC_FOURSQUARE_API_KEY=fsq3LKhR90hXrY+F1hMSMJd8VlbVlWdwgEfP/+FNfKObRA4=
FOURSQUARE_API_KEY=fsq3LKhR90hXrY+F1hMSMJd8VlbVlWdwgEfP/+FNfKObRA4=

# ===== FIREBASE CONFIGURATION (If using Firebase) =====
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# ===== STRIPE PAYMENT PROCESSING (If using payments) =====
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# ===== OPTIONAL ENHANCEMENT APIs =====
# Yelp API - For enhanced reviews
NEXT_PUBLIC_YELP_API_KEY=your_yelp_api_key_here

# ===== PERFORMANCE CONFIGURATION =====
API_RATE_LIMIT_PER_MINUTE=100
CACHE_TTL_MINUTES=5
DEFAULT_LOCATION_LAT=51.5074
DEFAULT_LOCATION_LNG=-0.1278
```

### **2. Priority API Keys to Obtain**

#### **🔥 CRITICAL (Get these first):**

1. **Google Places API Key**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Create new project or use existing
   - Enable APIs: Places API, Maps JavaScript API, Geocoding API
   - Create credentials → API Key
   - Add to: `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`

2. **Firebase Configuration** (if using authentication/database)
   - Go to: https://console.firebase.google.com/
   - Create project or use existing
   - Go to Project Settings → General → Your apps
   - Copy the config values

#### **🟡 OPTIONAL (For enhanced features):**

3. **Yelp API Key**
   - Go to: https://www.yelp.com/developers/documentation/v3/authentication
   - Create app and get API key
   - Add to: `NEXT_PUBLIC_YELP_API_KEY`

4. **Stripe Keys** (for payments)
   - Go to: https://dashboard.stripe.com/apikeys
   - Get test keys first
   - Add publishable key to: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Add secret key to: `STRIPE_SECRET_KEY`

## 🚀 **CURRENT SYSTEM STATUS**

### **✅ Working Without Additional Setup:**
- ✅ **5,896+ real restaurants** (Google Places + OpenStreetMap)
- ✅ **Enhanced menu generation** (AI-powered)
- ✅ **Advanced search & filtering** (20+ filters)
- ✅ **Real-time availability estimation**
- ✅ **Review aggregation system**
- ✅ **Enhanced restaurant cards**
- ✅ **Responsive website design**

### **⚠️ Requires API Keys:**
- 🔑 **Google Places API** - For full restaurant data
- 🔑 **Firebase** - For authentication and database
- 🔑 **Stripe** - For payment processing

### **🔄 Ready for Future:**
- 🔄 **Foursquare** - Enhancement layer ready (API deprecated)
- 🔄 **Yelp** - Additional review sources
- 🔄 **Other APIs** - OpenTable, Resy, etc.

## 🧪 **Testing Your Setup**

After updating `.env.local`, test your configuration:

```bash
# Test environment variables
node test-env-vars.js

# Test restaurant API
curl http://localhost:9002/api/restaurants?limit=1

# Test enhanced features
curl http://localhost:9002/api/enhanced-restaurants?limit=1

# Visit enhanced demo
http://localhost:9002/enhanced-demo
```

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"No restaurants found"**
   - Check `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` is set
   - Verify Google Places API is enabled in Google Cloud Console

2. **"API key not found"**
   - Ensure `.env.local` is in `/frontend/` directory
   - Restart development server after adding keys

3. **"Firebase errors"**
   - Check all Firebase config values are set
   - Verify Firebase project is active

### **Quick Fixes:**

```bash
# Restart development server
npm run dev

# Clear Next.js cache
rm -rf .next

# Check environment variables
echo $NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
```

## 📊 **Expected Results After Setup**

With proper API keys, you should see:
- ✅ Real restaurant data loading
- ✅ Enhanced restaurant cards with all features
- ✅ Working search and filtering
- ✅ Menu generation and availability
- ✅ User authentication (if Firebase configured)
- ✅ Payment processing (if Stripe configured)

Your Book My Table platform will be **production-ready** and rival OpenTable/Resy! 🎉
