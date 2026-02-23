# API Keys Configuration Guide

## 🔑 Setting Up Real API Keys

To enable real-time data from external APIs, you need to configure the following API keys in your `.env.local` file:

### 1. Create .env.local File

Create a `.env.local` file in the `frontend` directory with the following structure:

```bash
# Real-time Restaurant Data API Keys

# Google Places API (for restaurant info and reviews)
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# Yelp Fusion API (for restaurant info and reviews)
NEXT_PUBLIC_YELP_API_KEY=your_yelp_api_key_here

# OpenTable API (for booking availability)
NEXT_PUBLIC_OPENTABLE_API_KEY=your_opentable_api_key_here

# Resy API (for booking availability)
NEXT_PUBLIC_RESY_API_KEY=your_resy_api_key_here

# Toast POS API (for menu and availability data)
NEXT_PUBLIC_TOAST_API_KEY=your_toast_api_key_here

# Square for Restaurants API (for menu and booking data)
NEXT_PUBLIC_SQUARE_API_KEY=your_square_api_key_here

# TripAdvisor Content API (for reviews)
NEXT_PUBLIC_TRIPADVISOR_API_KEY=your_tripadvisor_api_key_here

# Foursquare Places API (for venue data and reviews)
NEXT_PUBLIC_FOURSQUARE_API_KEY=your_foursquare_api_key_here

# Payment Processing (Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here

# Notification Service (Firebase Cloud Messaging)
NEXT_PUBLIC_FIREBASE_MESSAGING_VAPID_KEY=your_firebase_vapid_key_here

# Database (if using external database)
DATABASE_URL=your_database_url_here

# API Base URL (for production)
NEXT_PUBLIC_API_BASE_URL=https://your-domain.com/api
```

### 2. API Key Sources

#### Google Places API
- **Website**: https://developers.google.com/maps/documentation/places/web-service/overview
- **Cost**: Pay-per-use with free tier
- **Setup**: Enable Places API in Google Cloud Console
- **Usage**: Restaurant info, photos, reviews

#### Yelp Fusion API
- **Website**: https://docs.developer.yelp.com/docs/fusion-intro
- **Cost**: Free tier available
- **Setup**: Create Yelp Developer account
- **Usage**: Restaurant info, reviews, photos

#### OpenTable API
- **Website**: https://developer.opentable.com/
- **Cost**: Partner program required
- **Setup**: Apply for partner access
- **Usage**: Real-time availability, booking

#### Resy API
- **Website**: https://resy.com/api-docs
- **Cost**: Partner program required
- **Setup**: Contact Resy for API access
- **Usage**: Real-time availability, booking

#### Toast POS API
- **Website**: https://doc.toasttab.com/doc/index.html
- **Cost**: Partner program required
- **Setup**: Contact Toast for API access
- **Usage**: Menu data, availability

#### Square for Restaurants API
- **Website**: https://developer.squareup.com/docs/restaurant-api/overview
- **Cost**: Pay-per-use
- **Setup**: Square Developer account
- **Usage**: Menu data, booking, payments

#### TripAdvisor Content API
- **Website**: https://developer-tripadvisor.com/content-api/
- **Cost**: Pay-per-use
- **Setup**: TripAdvisor Developer account
- **Usage**: Reviews, ratings

#### Foursquare Places API
- **Website**: https://developer.foursquare.com/docs/places-api
- **Cost**: Free tier available
- **Setup**: Foursquare Developer account
- **Usage**: Venue data, tips, photos

### 3. Testing Your API Keys

1. **Visit the API Test Panel**: `http://localhost:9002/api-test`
2. **Check API Key Status**: The panel will show which keys are configured
3. **Test API Endpoints**: Run tests to verify data fetching
4. **Monitor Performance**: Check response times and data quality

### 4. Security Best Practices

- **Never commit .env.local**: Add to .gitignore
- **Use environment variables**: Don't hardcode keys
- **Rotate keys regularly**: Update keys periodically
- **Monitor usage**: Track API usage and costs
- **Use different keys**: Separate keys for dev/staging/production

### 5. Fallback Strategy

The system is designed to work with mock data when API keys are not configured:
- **Development**: Use mock data for testing
- **Staging**: Mix of real and mock data
- **Production**: Full real-time data integration

### 6. Cost Management

- **Start with free tiers**: Use free APIs initially
- **Monitor usage**: Track API calls and costs
- **Implement caching**: Reduce API calls with smart caching
- **Rate limiting**: Prevent excessive API usage
- **Fallback to mock**: Use mock data when APIs are unavailable

## 🚀 Next Steps

1. **Configure API Keys**: Add your keys to .env.local
2. **Test Integration**: Use the API testing panel
3. **Monitor Performance**: Check response times and data quality
4. **Scale Gradually**: Start with essential APIs, add more over time
5. **Production Deployment**: Deploy with proper monitoring
