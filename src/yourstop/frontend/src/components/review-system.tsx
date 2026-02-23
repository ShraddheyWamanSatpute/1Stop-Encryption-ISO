import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth';
import { Star, ThumbsUp, ThumbsDown, Flag, MoreHorizontal, Edit, Trash2, Reply, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Review {
  id: string;
  restaurantId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  date: string;
  source: string;
  helpful: number;
  verified: boolean;
  response?: {
    text: string;
    author: string;
    date: string;
  };
  images?: string[];
  tags?: string[];
}

interface ReviewFilters {
  minRating?: number;
  sources?: string[];
  verified?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

interface ReviewSystemProps {
  restaurantId: string;
  restaurantName: string;
}

export function ReviewSystem({ restaurantId, restaurantName }: ReviewSystemProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReviewFilters>({});
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: '',
    tags: [] as string[]
  });
  const [helpfulVotes, setHelpfulVotes] = useState<Set<string>>(new Set());

  // Mock reviews data - in production, this would come from an API
  useEffect(() => {
    const mockReviews: Review[] = [
      {
        id: 'review-1',
        restaurantId,
        reviewerName: 'Alice Johnson',
        rating: 5,
        comment: 'Absolutely fantastic food and service! The atmosphere was perfect for our anniversary dinner. The staff was incredibly attentive and the wine selection was excellent.',
        date: '2024-09-20T19:30:00Z',
        source: 'Google',
        helpful: 12,
        verified: true,
        tags: ['great food', 'romantic', 'excellent service'],
        images: ['https://source.unsplash.com/random/400x300?restaurant&sig=1']
      },
      {
        id: 'review-2',
        restaurantId,
        reviewerName: 'Bob Smith',
        rating: 4,
        comment: 'Great food and good service. The pasta was delicious and the portion sizes were generous. Only minor issue was the wait time for our table.',
        date: '2024-09-18T20:15:00Z',
        source: 'Yelp',
        helpful: 8,
        verified: true,
        tags: ['good food', 'generous portions'],
        response: {
          text: 'Thank you for your feedback! We\'re glad you enjoyed the food and we\'re working on improving our wait times.',
          author: 'Restaurant Manager',
          date: '2024-09-19T10:30:00Z'
        }
      },
      {
        id: 'review-3',
        restaurantId,
        reviewerName: 'Charlie Brown',
        rating: 3,
        comment: 'Decent food but nothing special. The service was okay but could have been more attentive. The prices are a bit high for what you get.',
        date: '2024-09-15T18:45:00Z',
        source: 'TripAdvisor',
        helpful: 3,
        verified: false,
        tags: ['overpriced', 'average service']
      },
      {
        id: 'review-4',
        restaurantId,
        reviewerName: 'Diana Prince',
        rating: 5,
        comment: 'Outstanding experience! Every dish was perfectly prepared and the presentation was beautiful. The staff went above and beyond to make our evening special.',
        date: '2024-09-12T21:00:00Z',
        source: 'Google',
        helpful: 15,
        verified: true,
        tags: ['outstanding', 'beautiful presentation', 'excellent staff']
      },
      {
        id: 'review-5',
        restaurantId,
        reviewerName: 'Eve Wilson',
        rating: 2,
        comment: 'Disappointing experience. The food was cold when it arrived and the service was slow. Not worth the money we paid.',
        date: '2024-09-10T19:30:00Z',
        source: 'Yelp',
        helpful: 5,
        verified: true,
        tags: ['cold food', 'slow service', 'overpriced']
      }
    ];

    setReviews(mockReviews);
    setLoading(false);
  }, [restaurantId]);

  const filteredReviews = reviews.filter(review => {
    if (filters.minRating && review.rating < filters.minRating) return false;
    if (filters.sources && filters.sources.length > 0 && !filters.sources.includes(review.source)) return false;
    if (filters.verified !== undefined && review.verified !== filters.verified) return false;
    if (filters.dateRange) {
      const reviewDate = new Date(review.date);
      if (filters.dateRange.start && reviewDate < new Date(filters.dateRange.start)) return false;
      if (filters.dateRange.end && reviewDate > new Date(filters.dateRange.end)) return false;
    }
    return true;
  });

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  const handleHelpfulVote = (reviewId: string) => {
    setHelpfulVotes(prev => {
      const newVotes = new Set(prev);
      if (newVotes.has(reviewId)) {
        newVotes.delete(reviewId);
      } else {
        newVotes.add(reviewId);
      }
      return newVotes;
    });
  };

  const handleSubmitReview = async () => {
    if (!user || newReview.rating === 0 || !newReview.comment.trim()) return;

    const review: Review = {
      id: `review-${Date.now()}`,
      restaurantId,
      reviewerName: user.displayName || 'Anonymous',
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toISOString(),
      source: 'BookMyTable',
      helpful: 0,
      verified: true,
      tags: newReview.tags
    };

    setReviews(prev => [review, ...prev]);
    setNewReview({ rating: 0, comment: '', tags: [] });
    setShowWriteReview(false);
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-300' : ''}`}
            onClick={interactive ? () => setNewReview(prev => ({ ...prev, rating: star })) : undefined}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Reviews & Ratings</h2>
          <p className="text-gray-600">{restaurantName}</p>
        </div>
        <Button onClick={() => setShowWriteReview(true)}>
          Write a Review
        </Button>
      </div>

      {/* Rating Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                {renderStars(Math.round(averageRating))}
              </div>
              <p className="text-gray-600">
                Based on {reviews.length} reviews
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm font-medium w-8">{rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <Select
              value={filters.minRating?.toString() || 'all'}
              onValueChange={(value) => setFilters(prev => ({
                ...prev,
                minRating: value === 'all' ? undefined : parseInt(value)
              }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="2">2+ Stars</SelectItem>
                <SelectItem value="1">1+ Stars</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.verified?.toString() || 'all'}
              onValueChange={(value) => setFilters(prev => ({
                ...prev,
                verified: value === 'all' ? undefined : value === 'true'
              }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Reviews" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="true">Verified Only</SelectItem>
                <SelectItem value="false">Unverified Only</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sources?.join(',') || 'all'}
              onValueChange={(value) => setFilters(prev => ({
                ...prev,
                sources: value === 'all' ? undefined : value.split(',')
              }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="Google">Google</SelectItem>
                <SelectItem value="Yelp">Yelp</SelectItem>
                <SelectItem value="TripAdvisor">TripAdvisor</SelectItem>
                <SelectItem value="BookMyTable">BookMyTable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Review Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {review.reviewerName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{review.reviewerName}</span>
                        {review.verified && (
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {renderStars(review.rating)}
                        <span>•</span>
                        <span>{format(new Date(review.date), 'MMM do, yyyy')}</span>
                        <span>•</span>
                        <span>{review.source}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>

                {/* Review Content */}
                <div className="space-y-3">
                  <p className="text-gray-700">{review.comment}</p>
                  
                  {/* Tags */}
                  {review.tags && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {review.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2">
                      {review.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Review image ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Review Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHelpfulVote(review.id)}
                    >
                      <ThumbsUp className={`w-4 h-4 mr-1 ${
                        helpfulVotes.has(review.id) ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                      Helpful ({review.helpful + (helpfulVotes.has(review.id) ? 1 : 0)})
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Reply className="w-4 h-4 mr-1" />
                      Reply
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Flag className="w-4 h-4 mr-1" />
                      Report
                    </Button>
                  </div>
                </div>

                {/* Restaurant Response */}
                {review.response && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">{review.response.author}</span>
                      <span className="text-sm text-gray-600">
                        {format(new Date(review.response.date), 'MMM do, yyyy')}
                      </span>
                    </div>
                    <p className="text-gray-700">{review.response.text}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Write Review Modal */}
      {showWriteReview && (
        <Card className="fixed inset-0 z-50 m-4 max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Write a Review
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWriteReview(false)}
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Rating</label>
              <div className="flex gap-1">
                {renderStars(newReview.rating, true)}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Your Review</label>
              <Textarea
                placeholder="Share your experience..."
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Tags (optional)</label>
              <div className="flex flex-wrap gap-2">
                {['great food', 'excellent service', 'romantic', 'family-friendly', 'good value', 'atmospheric'].map(tag => (
                  <Button
                    key={tag}
                    variant={newReview.tags.includes(tag) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const newTags = newReview.tags.includes(tag)
                        ? newReview.tags.filter(t => t !== tag)
                        : [...newReview.tags, tag];
                      setNewReview(prev => ({ ...prev, tags: newTags }));
                    }}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowWriteReview(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={newReview.rating === 0 || !newReview.comment.trim()}
              >
                Submit Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Reviews */}
      {filteredReviews.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or be the first to write a review.
            </p>
            <Button onClick={() => setShowWriteReview(true)}>
              Write First Review
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
