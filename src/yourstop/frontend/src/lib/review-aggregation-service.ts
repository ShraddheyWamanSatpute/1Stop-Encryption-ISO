// Review Aggregation Service - Collect and analyze reviews from multiple sources
export interface Review {
  id: string;
  restaurantId: string;
  source: 'google' | 'tripadvisor' | 'yelp' | 'opentable' | 'internal' | 'facebook';
  rating: number;
  title?: string;
  comment: string;
  author: {
    name: string;
    avatar?: string;
    reviewCount?: number;
    isVerified?: boolean;
  };
  date: string;
  helpful: number;
  photos?: string[];
  response?: {
    text: string;
    date: string;
    author: string;
  };
  verified: boolean;
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  language: string;
}

export interface ReviewSummary {
  restaurantId: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  sentimentAnalysis: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topTopics: {
    topic: string;
    mentions: number;
    sentiment: number;
  }[];
  recentTrend: 'improving' | 'declining' | 'stable';
  lastUpdated: string;
  sources: {
    source: string;
    count: number;
    averageRating: number;
  }[];
}

export interface ReviewAnalytics {
  restaurantId: string;
  monthlyTrends: {
    month: string;
    reviewCount: number;
    averageRating: number;
  }[];
  competitorComparison?: {
    restaurantName: string;
    averageRating: number;
    reviewCount: number;
  }[];
  keywordAnalysis: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  responseRate: number;
  averageResponseTime: number; // in hours
}

export class ReviewAggregationService {
  private readonly REVIEW_CACHE = new Map<string, { reviews: Review[], timestamp: number }>();
  private readonly SUMMARY_CACHE = new Map<string, { summary: ReviewSummary, timestamp: number }>();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour
  private readonly SENTIMENT_API = '/api/analyze-sentiment';

  // Get all reviews for a restaurant from multiple sources
  async getRestaurantReviews(restaurantId: string, limit: number = 50): Promise<Review[]> {
    console.log(`📝 Getting reviews for restaurant ${restaurantId}`);
    
    const cacheKey = `${restaurantId}_${limit}`;
    const cached = this.REVIEW_CACHE.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('📋 Using cached review data');
      return cached.reviews;
    }

    try {
      // Collect reviews from multiple sources in parallel
      const reviewSources = await Promise.allSettled([
        this.getGoogleReviews(restaurantId),
        this.getTripAdvisorReviews(restaurantId),
        this.getInternalReviews(restaurantId),
        this.getFacebookReviews(restaurantId)
      ]);

      // Combine all reviews
      let allReviews: Review[] = [];
      
      reviewSources.forEach(result => {
        if (result.status === 'fulfilled') {
          allReviews = allReviews.concat(result.value);
        }
      });

      // Remove duplicates and sort by date
      allReviews = this.deduplicateReviews(allReviews);
      allReviews = allReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Enhance reviews with sentiment analysis
      allReviews = await this.enhanceReviewsWithSentiment(allReviews);

      // Limit results
      const limitedReviews = allReviews.slice(0, limit);

      // Cache the results
      this.REVIEW_CACHE.set(cacheKey, { 
        reviews: limitedReviews, 
        timestamp: Date.now() 
      });

      return limitedReviews;
    } catch (error) {
      console.error('Error getting reviews:', error);
      return [];
    }
  }

  // Get comprehensive review summary
  async getReviewSummary(restaurantId: string): Promise<ReviewSummary> {
    console.log(`📊 Getting review summary for restaurant ${restaurantId}`);
    
    const cached = this.SUMMARY_CACHE.get(restaurantId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('📋 Using cached summary data');
      return cached.summary;
    }

    try {
      const reviews = await this.getRestaurantReviews(restaurantId, 1000); // Get more for analysis
      const summary = this.generateReviewSummary(restaurantId, reviews);
      
      // Cache the summary
      this.SUMMARY_CACHE.set(restaurantId, { 
        summary, 
        timestamp: Date.now() 
      });

      return summary;
    } catch (error) {
      console.error('Error generating review summary:', error);
      return this.getEmptyReviewSummary(restaurantId);
    }
  }

  // Get Google Reviews
  private async getGoogleReviews(restaurantId: string): Promise<Review[]> {
    console.log('🔍 Fetching Google reviews');
    
    try {
      const response = await fetch(`/api/google-reviews/${restaurantId}`);
      if (response.ok) {
        const data = await response.json();
        return data.reviews.map((review: any) => this.normalizeGoogleReview(review, restaurantId));
      }
    } catch (error) {
      console.log('Google reviews unavailable:', error);
    }

    return [];
  }

  // Get TripAdvisor Reviews
  private async getTripAdvisorReviews(restaurantId: string): Promise<Review[]> {
    console.log('🧳 Fetching TripAdvisor reviews');
    
    try {
      const response = await fetch(`/api/tripadvisor-reviews/${restaurantId}`);
      if (response.ok) {
        const data = await response.json();
        return data.reviews.map((review: any) => this.normalizeTripAdvisorReview(review, restaurantId));
      }
    } catch (error) {
      console.log('TripAdvisor reviews unavailable:', error);
    }

    return [];
  }

  // Get Internal Reviews (from your platform)
  private async getInternalReviews(restaurantId: string): Promise<Review[]> {
    console.log('🏠 Fetching internal reviews');
    
    try {
      const response = await fetch(`/api/reviews/${restaurantId}`);
      if (response.ok) {
        const data = await response.json();
        return data.reviews.map((review: any) => this.normalizeInternalReview(review, restaurantId));
      }
    } catch (error) {
      console.log('Internal reviews unavailable:', error);
    }

    return [];
  }

  // Get Facebook Reviews
  private async getFacebookReviews(restaurantId: string): Promise<Review[]> {
    console.log('📘 Fetching Facebook reviews');
    
    try {
      const response = await fetch(`/api/facebook-reviews/${restaurantId}`);
      if (response.ok) {
        const data = await response.json();
        return data.reviews.map((review: any) => this.normalizeFacebookReview(review, restaurantId));
      }
    } catch (error) {
      console.log('Facebook reviews unavailable:', error);
    }

    return [];
  }

  // Normalize Google review format
  private normalizeGoogleReview(review: any, restaurantId: string): Review {
    return {
      id: `google_${review.id || Date.now()}`,
      restaurantId,
      source: 'google',
      rating: review.rating || 0,
      comment: review.text || '',
      author: {
        name: review.author_name || 'Anonymous',
        avatar: review.profile_photo_url,
        reviewCount: review.author_review_count,
        isVerified: true
      },
      date: review.time ? new Date(review.time * 1000).toISOString() : new Date().toISOString(),
      helpful: 0,
      verified: true,
      sentiment: 'neutral',
      topics: [],
      language: review.language || 'en'
    };
  }

  // Normalize TripAdvisor review format
  private normalizeTripAdvisorReview(review: any, restaurantId: string): Review {
    return {
      id: `tripadvisor_${review.id || Date.now()}`,
      restaurantId,
      source: 'tripadvisor',
      rating: review.rating || 0,
      title: review.title,
      comment: review.text || '',
      author: {
        name: review.user?.username || 'Anonymous',
        avatar: review.user?.avatar,
        reviewCount: review.user?.review_count,
        isVerified: review.user?.is_verified || false
      },
      date: review.published_date || new Date().toISOString(),
      helpful: review.helpful_votes || 0,
      photos: review.photos || [],
      verified: review.is_verified || false,
      sentiment: 'neutral',
      topics: [],
      language: review.language || 'en'
    };
  }

  // Normalize internal review format
  private normalizeInternalReview(review: any, restaurantId: string): Review {
    return {
      id: `internal_${review.id}`,
      restaurantId,
      source: 'internal',
      rating: review.rating,
      comment: review.comment || '',
      author: {
        name: review.userName || 'Anonymous',
        isVerified: review.verified || false
      },
      date: review.date,
      helpful: review.helpful || 0,
      verified: review.verified || false,
      sentiment: 'neutral',
      topics: [],
      language: 'en'
    };
  }

  // Normalize Facebook review format
  private normalizeFacebookReview(review: any, restaurantId: string): Review {
    return {
      id: `facebook_${review.id || Date.now()}`,
      restaurantId,
      source: 'facebook',
      rating: review.rating || 0,
      comment: review.review_text || '',
      author: {
        name: review.reviewer?.name || 'Anonymous',
        isVerified: false
      },
      date: review.created_time || new Date().toISOString(),
      helpful: 0,
      verified: false,
      sentiment: 'neutral',
      topics: [],
      language: 'en'
    };
  }

  // Remove duplicate reviews based on content similarity
  private deduplicateReviews(reviews: Review[]): Review[] {
    const uniqueReviews: Review[] = [];
    const seenContent = new Set<string>();

    for (const review of reviews) {
      const contentHash = this.generateContentHash(review);
      if (!seenContent.has(contentHash)) {
        seenContent.add(contentHash);
        uniqueReviews.push(review);
      }
    }

    return uniqueReviews;
  }

  // Generate content hash for duplicate detection
  private generateContentHash(review: Review): string {
    const content = `${review.author.name}_${review.comment.slice(0, 50)}_${review.rating}`;
    return btoa(content).slice(0, 20);
  }

  // Enhance reviews with sentiment analysis and topic extraction
  private async enhanceReviewsWithSentiment(reviews: Review[]): Promise<Review[]> {
    console.log('🧠 Enhancing reviews with sentiment analysis');
    
    const enhancedReviews = await Promise.all(
      reviews.map(async (review) => {
        try {
          const analysis = await this.analyzeSentiment(review.comment);
          return {
            ...review,
            sentiment: analysis.sentiment,
            topics: analysis.topics
          };
        } catch (error) {
          // Fallback to basic sentiment analysis
          return {
            ...review,
            sentiment: this.basicSentimentAnalysis(review.comment, review.rating),
            topics: this.extractBasicTopics(review.comment)
          };
        }
      })
    );

    return enhancedReviews;
  }

  // Analyze sentiment using AI service
  private async analyzeSentiment(text: string): Promise<{ sentiment: 'positive' | 'negative' | 'neutral'; topics: string[] }> {
    try {
      const response = await fetch(this.SENTIMENT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('Sentiment analysis API unavailable:', error);
    }

    throw new Error('Sentiment analysis failed');
  }

  // Basic sentiment analysis fallback
  private basicSentimentAnalysis(text: string, rating: number): 'positive' | 'negative' | 'neutral' {
    if (rating >= 4) return 'positive';
    if (rating <= 2) return 'negative';
    
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'disgusting', 'poor'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Extract basic topics from review text
  private extractBasicTopics(text: string): string[] {
    const topics: string[] = [];
    const lowerText = text.toLowerCase();
    
    const topicKeywords = {
      'food': ['food', 'dish', 'meal', 'taste', 'flavor', 'delicious', 'cuisine'],
      'service': ['service', 'staff', 'waiter', 'waitress', 'server', 'friendly', 'rude'],
      'atmosphere': ['atmosphere', 'ambiance', 'decor', 'music', 'noise', 'cozy', 'romantic'],
      'value': ['price', 'expensive', 'cheap', 'value', 'worth', 'cost', 'money'],
      'location': ['location', 'parking', 'access', 'area', 'neighborhood'],
      'cleanliness': ['clean', 'dirty', 'hygiene', 'sanitary', 'tidy']
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        topics.push(topic);
      }
    }

    return topics;
  }

  // Generate comprehensive review summary
  private generateReviewSummary(restaurantId: string, reviews: Review[]): ReviewSummary {
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      const rating = Math.round(review.rating) as keyof typeof ratingDistribution;
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
      }
    });

    // Sentiment analysis
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    reviews.forEach(review => {
      sentimentCounts[review.sentiment]++;
    });

    const sentimentAnalysis = {
      positive: totalReviews > 0 ? (sentimentCounts.positive / totalReviews) * 100 : 0,
      negative: totalReviews > 0 ? (sentimentCounts.negative / totalReviews) * 100 : 0,
      neutral: totalReviews > 0 ? (sentimentCounts.neutral / totalReviews) * 100 : 0
    };

    // Topic analysis
    const topicCounts = new Map<string, { mentions: number; totalSentiment: number }>();
    reviews.forEach(review => {
      review.topics.forEach(topic => {
        const current = topicCounts.get(topic) || { mentions: 0, totalSentiment: 0 };
        const sentimentScore = review.sentiment === 'positive' ? 1 : review.sentiment === 'negative' ? -1 : 0;
        topicCounts.set(topic, {
          mentions: current.mentions + 1,
          totalSentiment: current.totalSentiment + sentimentScore
        });
      });
    });

    const topTopics = Array.from(topicCounts.entries())
      .map(([topic, data]) => ({
        topic,
        mentions: data.mentions,
        sentiment: data.mentions > 0 ? data.totalSentiment / data.mentions : 0
      }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 10);

    // Recent trend analysis
    const recentReviews = reviews.slice(0, 20);
    const olderReviews = reviews.slice(20, 40);
    const recentAverage = recentReviews.length > 0 
      ? recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length 
      : 0;
    const olderAverage = olderReviews.length > 0 
      ? olderReviews.reduce((sum, r) => sum + r.rating, 0) / olderReviews.length 
      : 0;

    let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentAverage > olderAverage + 0.2) recentTrend = 'improving';
    else if (recentAverage < olderAverage - 0.2) recentTrend = 'declining';

    // Source breakdown
    const sourceCounts = new Map<string, { count: number; totalRating: number }>();
    reviews.forEach(review => {
      const current = sourceCounts.get(review.source) || { count: 0, totalRating: 0 };
      sourceCounts.set(review.source, {
        count: current.count + 1,
        totalRating: current.totalRating + review.rating
      });
    });

    const sources = Array.from(sourceCounts.entries()).map(([source, data]) => ({
      source,
      count: data.count,
      averageRating: data.count > 0 ? data.totalRating / data.count : 0
    }));

    return {
      restaurantId,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      sentimentAnalysis,
      topTopics,
      recentTrend,
      lastUpdated: new Date().toISOString(),
      sources
    };
  }

  // Get empty review summary for fallback
  private getEmptyReviewSummary(restaurantId: string): ReviewSummary {
    return {
      restaurantId,
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      sentimentAnalysis: { positive: 0, negative: 0, neutral: 0 },
      topTopics: [],
      recentTrend: 'stable',
      lastUpdated: new Date().toISOString(),
      sources: []
    };
  }

  // Get review analytics for restaurant owners
  async getReviewAnalytics(restaurantId: string): Promise<ReviewAnalytics> {
    const reviews = await this.getRestaurantReviews(restaurantId, 500);
    
    // Monthly trends (last 12 months)
    const monthlyTrends = this.calculateMonthlyTrends(reviews);
    
    // Keyword analysis
    const keywordAnalysis = this.analyzeKeywords(reviews);
    
    // Response rate calculation
    const reviewsWithResponses = reviews.filter(r => r.response);
    const responseRate = reviews.length > 0 ? (reviewsWithResponses.length / reviews.length) * 100 : 0;
    
    // Average response time (placeholder - would need actual response timestamps)
    const averageResponseTime = 24; // hours

    return {
      restaurantId,
      monthlyTrends,
      keywordAnalysis,
      responseRate,
      averageResponseTime
    };
  }

  // Calculate monthly review trends
  private calculateMonthlyTrends(reviews: Review[]): { month: string; reviewCount: number; averageRating: number }[] {
    const monthlyData = new Map<string, { count: number; totalRating: number }>();
    
    reviews.forEach(review => {
      const month = new Date(review.date).toISOString().slice(0, 7); // YYYY-MM
      const current = monthlyData.get(month) || { count: 0, totalRating: 0 };
      monthlyData.set(month, {
        count: current.count + 1,
        totalRating: current.totalRating + review.rating
      });
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        reviewCount: data.count,
        averageRating: data.count > 0 ? data.totalRating / data.count : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }

  // Analyze keywords in reviews
  private analyzeKeywords(reviews: Review[]): { positive: string[]; negative: string[]; neutral: string[] } {
    const keywords = { positive: [] as string[], negative: [] as string[], neutral: [] as string[] };
    
    reviews.forEach(review => {
      const words = review.comment.toLowerCase().split(/\s+/);
      const sentiment = review.sentiment;
      
      words.forEach(word => {
        if (word.length > 3 && !this.isStopWord(word)) {
          if (keywords[sentiment].length < 20 && !keywords[sentiment].includes(word)) {
            keywords[sentiment].push(word);
          }
        }
      });
    });

    return keywords;
  }

  // Check if word is a stop word
  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should'];
    return stopWords.includes(word);
  }

  // Clear all caches
  clearCache(): void {
    this.REVIEW_CACHE.clear();
    this.SUMMARY_CACHE.clear();
  }

  // Get cache statistics
  getCacheStats(): { reviewCacheSize: number; summaryCacheSize: number } {
    return {
      reviewCacheSize: this.REVIEW_CACHE.size,
      summaryCacheSize: this.SUMMARY_CACHE.size
    };
  }
}

export const reviewAggregationService = new ReviewAggregationService();
