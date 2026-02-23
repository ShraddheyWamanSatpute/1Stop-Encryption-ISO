# Real-Time Restaurant Data System

This document describes the implementation of a comprehensive real-time restaurant data system for London restaurants, integrating multiple data sources and APIs.

## 🎯 Overview

The system provides real-time restaurant data including:
- **Restaurant basic info** (name, address, phone, cuisine type)
- **Real-time availability** (tables, time slots)
- **Menu items and pricing**
- **Photos and descriptions**
- **Operating hours**
- **Special offers/events**
- **Reviews and ratings**

## 📊 Data Freshness Requirements

| Data Type | Freshness | Update Frequency |
|-----------|-----------|------------------|
| Availability | Real-time (< 5 minutes) | Every 5 minutes |
| Menu/Pricing | Daily updates | Every 24 hours |
| Basic Info | Weekly updates | Every 7 days |
| Photos | As needed | On-demand |
| Reviews | Daily updates | Every 24 hours |

## 🔌 Data Sources

### Primary APIs
- **Google Places API** - Basic restaurant information, reviews, photos
- **Yelp Fusion API** - Reviews, photos, basic info
- **OpenTable API** - Restaurant availability and booking data
- **Resy API** - Restaurant availability and basic info

### Secondary APIs
- **Toast POS** - Menu and availability data
- **Square for Restaurants** - Integrated booking and menu data
- **TripAdvisor Content API** - Reviews and restaurant details
- **Foursquare Places API** - Venue data, photos, tips

## 🏗️ Technical Architecture

### Data Pipeline
```
Data Sources → API Connectors → Data Processing → Storage → API Layer → Frontend
```

### Components
1. **Data Ingestion Layer**
   - API connectors for each data source
   - Rate limiting and authentication
   - Data validation and cleaning

2. **Data Processing & Storage**
   - ETL pipelines for data transformation
   - Caching layer for performance
   - Real-time data streaming

3. **API Layer**
   - Internal APIs for frontend
   - Data formatting and standardization
   - Error handling and fallbacks

## 📁 File Structure

```
frontend/src/
├── lib/
│   ├── restaurant-data-types.ts      # TypeScript interfaces
│   ├── restaurant-data-service.ts    # Main data service
│   └── api-config.ts                 # API configuration
├── hooks/
│   └── use-restaurant-data.tsx       # React hooks
├── components/
│   └── real-time-status.tsx          # Status indicators
└── app/api/restaurants/
    ├── route.ts                      # Main restaurants API
    └── [id]/
        ├── availability/route.ts      # Availability API
        ├── menu/route.ts             # Menu API
        └── reviews/route.ts          # Reviews API
```

## 🚀 Getting Started

### 1. Environment Setup

Create a `.env.local` file with your API keys:

```bash
# Google Places API
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_key_here

# Yelp Fusion API
NEXT_PUBLIC_YELP_API_KEY=your_key_here

# Other APIs...
```

### 2. API Key Configuration

Get API keys from:
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service/get-api-key)
- [Yelp Fusion API](https://www.yelp.com/developers/documentation/v3/authentication)
- [OpenTable API](https://platform.opentable.com/)
- [Resy API](https://resy.com/for-developers/)

### 3. Usage

```typescript
import { useRestaurantData } from '@/hooks/use-restaurant-data';

function RestaurantList() {
  const { 
    restaurants, 
    loading, 
    error, 
    searchRestaurants 
  } = useRestaurantData();

  // Search with filters
  const handleSearch = () => {
    searchRestaurants({
      cuisine: ['Italian', 'French'],
      priceRange: ['££', '£££'],
      rating: 4.0,
      area: ['Covent Garden', 'Soho']
    });
  };

  return (
    <div>
      {loading && <div>Loading restaurants...</div>}
      {error && <div>Error: {error}</div>}
      {restaurants.map(restaurant => (
        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </div>
  );
}
```

## 🔄 Real-Time Features

### Availability Checking
```typescript
import { useRestaurantAvailability } from '@/hooks/use-restaurant-data';

function BookingForm({ restaurantId }) {
  const { availability, fetchAvailability } = useRestaurantAvailability();
  
  useEffect(() => {
    fetchAvailability(restaurantId, '2024-01-20');
  }, [restaurantId]);

  return (
    <div>
      {availability?.timeSlots.map(slot => (
        <TimeSlot key={slot.time} slot={slot} />
      ))}
    </div>
  );
}
```

### Menu Data
```typescript
import { useRestaurantMenu } from '@/hooks/use-restaurant-data';

function MenuDisplay({ restaurantId }) {
  const { menu, loading } = useRestaurantMenu();
  
  useEffect(() => {
    fetchMenu(restaurantId);
  }, [restaurantId]);

  return (
    <div>
      {menu?.categories.map(category => (
        <MenuCategory key={category.id} category={category} />
      ))}
    </div>
  );
}
```

## 📈 Performance Optimization

### Caching Strategy
- **Availability**: 5-minute cache
- **Menu**: 24-hour cache
- **Basic Info**: 7-day cache
- **Photos**: 30-day cache
- **Reviews**: 24-hour cache

### Rate Limiting
- Google Places: 1000 requests/day
- Yelp: 500 requests/day
- OpenTable: 100 requests/hour
- Resy: 100 requests/hour

### Data Quality
- Minimum rating: 3.0
- Minimum review count: 5
- Maximum image age: 365 days
- Maximum menu age: 30 days

## 🔧 Configuration

### API Configuration
```typescript
// lib/api-config.ts
export const API_CONFIG = {
  CACHE_TTL: {
    AVAILABILITY: 5 * 60 * 1000,      // 5 minutes
    MENU: 24 * 60 * 60 * 1000,        // 24 hours
    BASIC_INFO: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  LONDON: {
    LATITUDE: 51.5074,
    LONGITUDE: -0.1278,
    RADIUS: 10000, // 10km
  }
};
```

### Data Freshness Monitoring
```typescript
import { RealTimeStatus } from '@/components/real-time-status';

function DataStatus() {
  return (
    <RealTimeStatus 
      lastUpdated="2024-01-20T10:30:00Z"
      onRefresh={() => refreshData()}
    />
  );
}
```

## 🚨 Error Handling

### Fallback Strategy
1. Primary API fails → Try secondary API
2. All APIs fail → Use cached data
3. No cached data → Show error message

### Error Types
- **Network errors**: Retry with exponential backoff
- **Rate limit errors**: Wait and retry
- **Authentication errors**: Log and skip
- **Data validation errors**: Clean and continue

## 📊 Monitoring

### Data Quality Metrics
- API response times
- Cache hit rates
- Data freshness
- Error rates
- User engagement

### Real-Time Status
- Online/offline status
- Last update time
- Data source reliability
- Refresh capabilities

## 🔮 Future Enhancements

### Planned Features
- **Machine Learning**: Predictive availability
- **Real-time Notifications**: Push updates
- **Advanced Filtering**: AI-powered recommendations
- **Social Integration**: User-generated content
- **Analytics Dashboard**: Business insights

### API Integrations
- **SinglePlatform**: Menu aggregation
- **Locu**: Restaurant data
- **Factual/Safegraph**: Location data
- **Allmenus**: Menu data

## 🛠️ Development

### Testing
```bash
# Run tests
npm test

# Test API endpoints
npm run test:api

# Test data freshness
npm run test:data-freshness
```

### Debugging
```typescript
// Enable debug logging
localStorage.setItem('debug', 'restaurant-data:*');

// Check cache status
console.log(restaurantDataService.getCacheStatus());

// Clear cache
restaurantDataService.clearCache();
```

## 📝 API Documentation

### REST Endpoints

#### GET /api/restaurants
Get restaurants with optional filters.

**Query Parameters:**
- `cuisine`: Comma-separated cuisine types
- `priceRange`: Comma-separated price ranges
- `rating`: Minimum rating (0-5)
- `area`: Comma-separated areas
- `date`: Availability date (YYYY-MM-DD)
- `time`: Availability time (HH:MM)
- `partySize`: Number of guests

**Response:**
```json
{
  "restaurants": [...],
  "total": 150,
  "filters": {...},
  "lastUpdated": "2024-01-20T10:30:00Z"
}
```

#### GET /api/restaurants/[id]/availability
Get real-time availability for a restaurant.

**Query Parameters:**
- `date`: Date (YYYY-MM-DD)

**Response:**
```json
{
  "restaurantId": "123",
  "date": "2024-01-20",
  "timeSlots": [...],
  "lastUpdated": "2024-01-20T10:30:00Z",
  "source": "opentable"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
