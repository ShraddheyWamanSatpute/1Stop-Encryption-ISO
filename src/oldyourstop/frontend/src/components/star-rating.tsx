import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  totalStars?: number;
  size?: number;
  className?: string;
  showText?: boolean;
  reviewsCount?: number;
}

export function StarRating({
  rating,
  totalStars = 5,
  size = 20,
  className,
  showText = true,
  reviewsCount,
}: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const partialStar = Math.round((rating % 1) * 100) / 100; // Round to 2 decimal places for consistency
  const emptyStars = totalStars - fullStars - (partialStar > 0 ? 1 : 0);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            fill="currentColor"
            className="text-primary"
            style={{ width: size, height: size }}
          />
        ))}
        {partialStar > 0.1 && (
          <div style={{ position: 'relative', width: size, height: size }}>
            <Star
              style={{ width: size, height: size }}
              className="text-muted-foreground/30"
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${partialStar * 100}%`,
                overflow: 'hidden',
              }}
            >
              <Star
                fill="currentColor"
                className="text-primary"
                style={{ width: size, height: size }}
              />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star
            key={`empty-${i}`}
            className="text-muted-foreground/30"
            style={{ width: size, height: size }}
          />
        ))}
      </div>
      {showText && (
        <span className="text-sm text-muted-foreground">
          {Math.round(rating * 10) / 10}
          {reviewsCount != null && ` (${reviewsCount})`}
        </span>
      )}
    </div>
  );
}
