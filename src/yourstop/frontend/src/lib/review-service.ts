// Real-time review service for restaurant data
import { ReviewData, ReviewFilters, ReviewSummary } from './restaurant-data-types';
import { API_CONFIG, isApiKeyConfigured, getApiKey, rateLimiter } from './api-config';

export interface ReviewResponse {
  reviews: ReviewData[];
  summary: ReviewSummary;
  total: number;
  lastUpdated: string;
  source: string;
}

export interface ReviewAnalytics {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  recentTrend: 'up' | 'down' | 'stable';
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topKeywords: { word: string; count: number }[];
}

class ReviewService {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  // Cache TTL for different types of data
  private readonly CACHE_TTL = {
    REVIEWS: 24 * 60 * 60 * 1000, // 24 hours
    SUMMARY: 60 * 60 * 1000, // 1 hour
    ANALYTICS: 4 * 60 * 60 * 1000, // 4 hours
  };

  // Get reviews for a restaurant
  async getReviews(restaurantId: string, filters?: ReviewFilters): Promise<ReviewResponse> {
    const cacheKey = `reviews_${restaurantId}_${JSON.stringify(filters)}`;
    const cached = this.getCachedData(cacheKey, this.CACHE_TTL.REVIEWS);
    
    if (cached) {
      return cached;
    }

    try {
      // Check if review APIs are configured
      const hasReviewApis = isApiKeyConfigured('GOOGLE_PLACES_API_KEY') || 
                           isApiKeyConfigured('YELP_API_KEY') || 
                           isApiKeyConfigured('TRIPADVISOR_API_KEY') ||
                           isApiKeyConfigured('FOURSQUARE_API_KEY');

      let reviews: ReviewData[] = [];
      let sources: string[] = [];

      if (hasReviewApis) {
        // Try multiple review APIs in parallel
        const [google, yelp, tripadvisor, foursquare] = await Promise.allSettled([
          this.fetchGoogleReviews(restaurantId, filters),
          this.fetchYelpReviews(restaurantId, filters),
          this.fetchTripAdvisorReviews(restaurantId, filters),
          this.fetchFoursquareReviews(restaurantId, filters)
        ]);

        // Collect reviews from all sources
        if (google.status === 'fulfilled' && google.value) {
          reviews = reviews.concat(google.value);
          sources.push('google');
        }
        if (yelp.status === 'fulfilled' && yelp.value) {
          reviews = reviews.concat(yelp.value);
          sources.push('yelp');
        }
        if (tripadvisor.status === 'fulfilled' && tripadvisor.value) {
          reviews = reviews.concat(tripadvisor.value);
          sources.push('tripadvisor');
        }
        if (foursquare.status === 'fulfilled' && foursquare.value) {
          reviews = reviews.concat(foursquare.value);
          sources.push('foursquare');
        }
      } else {
        // Use enhanced mock data
        reviews = this.generateMockReviews(restaurantId, filters);
        sources = ['mock'];
      }

      // Sort reviews by date (newest first)
      reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Apply filters
      if (filters) {
        reviews = this.filterReviews(reviews, filters);
      }

      // Generate summary
      const summary = this.generateReviewSummary(reviews);

      const response: ReviewResponse = {
        reviews: reviews.slice(0, 50), // Limit to 50 reviews
        summary,
        total: reviews.length,
        lastUpdated: new Date().toISOString(),
        source: sources.join(', ')
      };

      this.setCachedData(cacheKey, response, this.CACHE_TTL.REVIEWS);
      return response;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Fallback to mock data
      const reviews = this.generateMockReviews(restaurantId, filters);
      const summary = this.generateReviewSummary(reviews);
      
      const response: ReviewResponse = {
        reviews: reviews.slice(0, 50),
        summary,
        total: reviews.length,
        lastUpdated: new Date().toISOString(),
        source: 'mock'
      };
      
      this.setCachedData(cacheKey, response, this.CACHE_TTL.REVIEWS);
      return response;
    }
  }

  // Get review analytics
  async getReviewAnalytics(restaurantId: string): Promise<ReviewAnalytics> {
    const cacheKey = `analytics_${restaurantId}`;
    const cached = this.getCachedData(cacheKey, this.CACHE_TTL.ANALYTICS);
    
    if (cached) {
      return cached;
    }

    try {
      const { reviews } = await this.getReviews(restaurantId);
      const analytics = this.calculateReviewAnalytics(reviews);
      
      this.setCachedData(cacheKey, analytics, this.CACHE_TTL.ANALYTICS);
      return analytics;
    } catch (error) {
      console.error('Error calculating review analytics:', error);
      return this.generateMockAnalytics();
    }
  }

  // Get review summary
  async getReviewSummary(restaurantId: string): Promise<ReviewSummary> {
    const cacheKey = `summary_${restaurantId}`;
    const cached = this.getCachedData(cacheKey, this.CACHE_TTL.SUMMARY);
    
    if (cached) {
      return cached;
    }

    try {
      const { reviews } = await this.getReviews(restaurantId);
      const summary = this.generateReviewSummary(reviews);
      
      this.setCachedData(cacheKey, summary, this.CACHE_TTL.SUMMARY);
      return summary;
    } catch (error) {
      console.error('Error generating review summary:', error);
      return this.generateMockSummary();
    }
  }

  // Private methods for API integrations
  private async fetchGoogleReviews(restaurantId: string, filters?: ReviewFilters): Promise<ReviewData[] | null> {
    if (!isApiKeyConfigured('GOOGLE_PLACES_API_KEY')) return null;

    try {
      const apiKey = getApiKey('GOOGLE_PLACES_API_KEY');
      const url = `${API_CONFIG.GOOGLE_PLACES_BASE_URL}/details/json`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Google Places API error');

      const data = await response.json();
      return this.transformGoogleReviews(data, restaurantId);
    } catch (error) {
      console.error('Google reviews error:', error);
      return null;
    }
  }

  private async fetchYelpReviews(restaurantId: string, filters?: ReviewFilters): Promise<ReviewData[] | null> {
    if (!isApiKeyConfigured('YELP_API_KEY')) return null;

    try {
      const apiKey = getApiKey('YELP_API_KEY');
      const url = `${API_CONFIG.YELP_BASE_URL}/${restaurantId}/reviews`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Yelp API error');

      const data = await response.json();
      return this.transformYelpReviews(data, restaurantId);
    } catch (error) {
      console.error('Yelp reviews error:', error);
      return null;
    }
  }

  private async fetchTripAdvisorReviews(restaurantId: string, filters?: ReviewFilters): Promise<ReviewData[] | null> {
    if (!isApiKeyConfigured('TRIPADVISOR_API_KEY')) return null;

    try {
      const apiKey = getApiKey('TRIPADVISOR_API_KEY');
      const url = `${API_CONFIG.TRIPADVISOR_BASE_URL}/reviews/${restaurantId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('TripAdvisor API error');

      const data = await response.json();
      return this.transformTripAdvisorReviews(data, restaurantId);
    } catch (error) {
      console.error('TripAdvisor reviews error:', error);
      return null;
    }
  }

  private async fetchFoursquareReviews(restaurantId: string, filters?: ReviewFilters): Promise<ReviewData[] | null> {
    if (!isApiKeyConfigured('FOURSQUARE_API_KEY')) return null;

    try {
      const apiKey = getApiKey('FOURSQUARE_API_KEY');
      const url = `${API_CONFIG.FOURSQUARE_BASE_URL}/venues/${restaurantId}/tips`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Foursquare API error');

      const data = await response.json();
      return this.transformFoursquareReviews(data, restaurantId);
    } catch (error) {
      console.error('Foursquare reviews error:', error);
      return null;
    }
  }

  // Data transformation methods
  private transformGoogleReviews(data: any, restaurantId: string): ReviewData[] {
    // Transform Google Places API response to our format
    return [];
  }

  private transformYelpReviews(data: any, restaurantId: string): ReviewData[] {
    // Transform Yelp API response to our format
    return [];
  }

  private transformTripAdvisorReviews(data: any, restaurantId: string): ReviewData[] {
    // Transform TripAdvisor API response to our format
    return [];
  }

  private transformFoursquareReviews(data: any, restaurantId: string): ReviewData[] {
    // Transform Foursquare API response to our format
    return [];
  }

  // Enhanced mock data generation
  private generateMockReviews(restaurantId: string, filters?: ReviewFilters): ReviewData[] {
    const reviews: ReviewData[] = [];
    const sources = ['Google', 'Yelp', 'TripAdvisor', 'Foursquare'];
    const names = [
      'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Eve Wilson',
      'Frank Miller', 'Grace Lee', 'Henry Davis', 'Ivy Chen', 'Jack Wilson',
      'Kate Anderson', 'Liam O\'Connor', 'Maya Patel', 'Noah Kim', 'Olivia Taylor',
      'Paul Rodriguez', 'Quinn Murphy', 'Rachel Green', 'Sam Wilson', 'Tina Turner'
    ];
    
    const positiveComments = [
      'Absolutely fantastic food and service! Highly recommend.',
      'The best restaurant in London. Amazing atmosphere and delicious food.',
      'Perfect for a special occasion. The staff was incredibly attentive.',
      'Outstanding quality and presentation. Will definitely be back!',
      'Exceptional dining experience. Every dish was perfectly prepared.',
      'Great ambiance and wonderful service. The food exceeded expectations.',
      'One of the best meals I\'ve had in London. Highly recommended!',
      'Excellent food, great atmosphere, and friendly staff.',
      'Amazing experience from start to finish. Can\'t wait to return!',
      'Outstanding restaurant with incredible attention to detail.'
    ];

    const neutralComments = [
      'Good food and decent service. Nothing extraordinary but solid.',
      'Nice atmosphere and okay food. A bit pricey for what you get.',
      'Decent restaurant with standard service. Food was good but not amazing.',
      'Average experience. Food was fine but nothing to write home about.',
      'Okay place with reasonable prices. Service was adequate.',
      'Good location and decent food. Staff was friendly enough.',
      'Standard restaurant experience. Food was good, service was okay.',
      'Decent meal but nothing special. Would consider returning.',
      'Fair food and service. Nothing particularly memorable.',
      'Average restaurant with typical London prices.'
    ];

    const negativeComments = [
      'Disappointing experience. Food was cold and service was slow.',
      'Overpriced for the quality. Would not recommend.',
      'Poor service and mediocre food. Not worth the money.',
      'Terrible experience. Rude staff and subpar food.',
      'Very disappointing. Food was bland and service was awful.',
      'Waste of money. Food was terrible and staff was unprofessional.',
      'Horrible experience. Would never return or recommend.',
      'Poor quality food and terrible service. Avoid this place.',
      'Disappointing meal. Food was cold and tasteless.',
      'Worst restaurant experience in London. Terrible all around.'
    ];

    const allComments = [...positiveComments, ...neutralComments, ...negativeComments];

    // Generate 50-100 reviews
    const reviewCount = Math.floor(Math.random() * 50) + 50;
    
    for (let i = 0; i < reviewCount; i++) {
      const isPositive = Math.random() > 0.3; // 70% positive
      const isNeutral = !isPositive && Math.random() > 0.5; // 15% neutral, 15% negative
      
      let rating: number;
      let comment: string;
      
      if (isPositive) {
        rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
        comment = positiveComments[Math.floor(Math.random() * positiveComments.length)];
      } else if (isNeutral) {
        rating = 3; // 3 stars
        comment = neutralComments[Math.floor(Math.random() * neutralComments.length)];
      } else {
        rating = Math.floor(Math.random() * 2) + 1; // 1-2 stars
        comment = negativeComments[Math.floor(Math.random() * negativeComments.length)];
      }

      // Generate random date within last 2 years
      const now = new Date();
      const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
      const randomDate = new Date(twoYearsAgo.getTime() + Math.random() * (now.getTime() - twoYearsAgo.getTime()));

      reviews.push({
        id: `review-${restaurantId}-${i + 1}`,
        author: names[Math.floor(Math.random() * names.length)],
        rating,
        comment,
        date: randomDate.toISOString(),
        source: sources[Math.floor(Math.random() * sources.length)] as 'google' | 'foursquare' | 'yelp' | 'tripadvisor' | 'opentable',
        helpful: Math.floor(Math.random() * 20),
        verified: Math.random() > 0.3, // 70% verified
        response: Math.random() > 0.7 ? {
          text: 'Thank you for your feedback! We\'re glad you enjoyed your experience.',
          author: 'Restaurant Manager',
          date: new Date(randomDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        } : undefined
      });
    }

    return reviews;
  }

  private generateReviewSummary(reviews: ReviewData[]): ReviewSummary {
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentTrend: 'stable'
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    // Calculate recent trend (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentReviews = reviews.filter(r => new Date(r.date) >= thirtyDaysAgo);
    const previousReviews = reviews.filter(r => {
      const date = new Date(r.date);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });

    let recentTrend: 'up' | 'down' | 'stable' = 'stable';
    if (recentReviews.length > 0 && previousReviews.length > 0) {
      const recentAvg = recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length;
      const previousAvg = previousReviews.reduce((sum, r) => sum + r.rating, 0) / previousReviews.length;
      
      if (recentAvg > previousAvg + 0.2) recentTrend = 'up';
      else if (recentAvg < previousAvg - 0.2) recentTrend = 'down';
    }

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution,
      recentTrend
    };
  }

  private calculateReviewAnalytics(reviews: ReviewData[]): ReviewAnalytics {
    if (reviews.length === 0) {
      return this.generateMockAnalytics();
    }

    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    // Calculate sentiment analysis
    const positiveKeywords = ['amazing', 'excellent', 'fantastic', 'outstanding', 'perfect', 'wonderful', 'great', 'best', 'love', 'delicious'];
    const negativeKeywords = ['terrible', 'awful', 'disappointing', 'bad', 'horrible', 'worst', 'poor', 'bland', 'cold', 'rude'];

    let positive = 0, neutral = 0, negative = 0;

    reviews.forEach(review => {
      const comment = review.comment.toLowerCase();
      const positiveCount = positiveKeywords.filter(keyword => comment.includes(keyword)).length;
      const negativeCount = negativeKeywords.filter(keyword => comment.includes(keyword)).length;
      
      if (positiveCount > negativeCount) positive++;
      else if (negativeCount > positiveCount) negative++;
      else neutral++;
    });

    // Extract top keywords
    const wordCount: { [key: string]: number } = {};
    reviews.forEach(review => {
      const words = review.comment.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3);
      
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
    });

    const topKeywords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    // Calculate recent trend
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentReviews = reviews.filter(r => new Date(r.date) >= thirtyDaysAgo);
    const previousReviews = reviews.filter(r => {
      const date = new Date(r.date);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });

    let recentTrend: 'up' | 'down' | 'stable' = 'stable';
    if (recentReviews.length > 0 && previousReviews.length > 0) {
      const recentAvg = recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length;
      const previousAvg = previousReviews.reduce((sum, r) => sum + r.rating, 0) / previousReviews.length;
      
      if (recentAvg > previousAvg + 0.2) recentTrend = 'up';
      else if (recentAvg < previousAvg - 0.2) recentTrend = 'down';
    }

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution,
      recentTrend,
      sentimentAnalysis: {
        positive: Math.round((positive / reviews.length) * 100),
        neutral: Math.round((neutral / reviews.length) * 100),
        negative: Math.round((negative / reviews.length) * 100)
      },
      topKeywords
    };
  }

  private generateMockAnalytics(): ReviewAnalytics {
    return {
      averageRating: 4.2,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      recentTrend: 'stable',
      sentimentAnalysis: { positive: 0, neutral: 0, negative: 0 },
      topKeywords: []
    };
  }

  private generateMockSummary(): ReviewSummary {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      recentTrend: 'stable'
    };
  }

  private filterReviews(reviews: ReviewData[], filters: ReviewFilters): ReviewData[] {
    return reviews.filter(review => {
      // Rating filter
      if (filters.minRating && review.rating < filters.minRating) {
        return false;
      }

      // Source filter
      if (filters.sources && filters.sources.length > 0) {
        if (!filters.sources.includes(review.source)) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange) {
        const reviewDate = new Date(review.date);
        if (filters.dateRange.start && reviewDate < new Date(filters.dateRange.start)) {
          return false;
        }
        if (filters.dateRange.end && reviewDate > new Date(filters.dateRange.end)) {
          return false;
        }
      }

      // Verified filter
      if (filters.verified !== undefined && review.verified !== filters.verified) {
        return false;
      }

      // Keyword filter
      if (filters.keywords && filters.keywords.length > 0) {
        const comment = review.comment.toLowerCase();
        const hasKeyword = filters.keywords.some(keyword => 
          comment.includes(keyword.toLowerCase())
        );
        if (!hasKeyword) return false;
      }

      return true;
    });
  }

  // Cache management
  private getCachedData(key: string, ttl: number): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

export const reviewService = new ReviewService();
