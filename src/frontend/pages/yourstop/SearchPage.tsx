import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { restaurants } from '../../../yourstop/frontend/src/lib/data';
import { EnhancedRestaurantCard as RestaurantCard } from '../../../yourstop/frontend/src/components/enhanced-restaurant-card';
import { Input } from '../../../yourstop/frontend/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../yourstop/frontend/src/components/ui/select';
import { Checkbox } from '../../../yourstop/frontend/src/components/ui/checkbox';
import { Label } from '../../../yourstop/frontend/src/components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../../yourstop/frontend/src/components/ui/radio-group';
import type { Restaurant } from '../../../yourstop/frontend/src/lib/types';
import { Separator } from '../../../yourstop/frontend/src/components/ui/separator';
import { ErrorBoundary } from '../../../yourstop/frontend/src/components/error-boundary';

const allCuisines = [...new Set(restaurants.map((r: Restaurant) => r.cuisine))];
const allPricings = ['$', '$$', '$$$', '$$$$'].filter((p) =>
  restaurants.some((r: Restaurant) => r.pricing === p)
);

type SortOption = 'rating' | 'reviews' | 'price-asc' | 'price-desc';

function SearchPageContent() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams?.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedPricing, setSelectedPricing] = useState<string>('all');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('rating');

  const filteredAndSortedRestaurants = useMemo(() => {
    const filtered = restaurants.filter((restaurant: Restaurant) => {
      // Search query filter
      const matchesQuery =
        restaurant.name.toLowerCase().includes(query.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(query.toLowerCase()) ||
        (restaurant.description && restaurant.description.toLowerCase().includes(query.toLowerCase()));

      // Cuisine filter
      const matchesCuisine =
        selectedCuisines.length === 0 ||
        selectedCuisines.includes(restaurant.cuisine);

      // Pricing filter
      const matchesPricing =
        selectedPricing === 'all' || restaurant.pricing === selectedPricing;

      // Rating filter
      const matchesRating = restaurant.rating >= minRating;

      return matchesQuery && matchesCuisine && matchesPricing && matchesRating;
    });

    // Sorting logic
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'reviews':
          return b.reviewsCount - a.reviewsCount;
        case 'price-asc':
          return a.pricing.length - b.pricing.length;
        case 'price-desc':
          return b.pricing.length - a.pricing.length;
        default:
          return 0;
      }
    });
  }, [query, selectedCuisines, selectedPricing, minRating, sortBy]);

  const handleCuisineChange = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  return (
    <div className="container mx-auto max-w-screen-xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        <aside className="md:col-span-1">
          <div className="sticky top-24 space-y-6">
            <h2 className="font-headline text-2xl font-bold">Filters</h2>
            
            <div>
              <Label className="text-lg font-semibold">Search</Label>
              <Input
                type="text"
                placeholder="Search by name or cuisine..."
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                className="mt-2"
              />
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold">Cuisine</h3>
              <div className="mt-2 space-y-2">
                {allCuisines.map((cuisine) => (
                  <div key={cuisine} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cuisine-${cuisine}`}
                      checked={selectedCuisines.includes(cuisine)}
                      onCheckedChange={() => handleCuisineChange(cuisine)}
                    />
                    <Label htmlFor={`cuisine-${cuisine}`} className="font-normal">
                      {cuisine}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />
            
            <div>
              <h3 className="font-semibold">Price Range</h3>
              <RadioGroup
                value={selectedPricing}
                onValueChange={setSelectedPricing}
                className="mt-2 space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="price-all" />
                  <Label htmlFor="price-all" className="font-normal">All</Label>
                </div>
                {allPricings.map((price) => (
                  <div key={price} className="flex items-center space-x-2">
                    <RadioGroupItem value={price} id={`price-${price}`} />
                    <Label htmlFor={`price-${price}`} className="font-normal">{price}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold">Rating</h3>
              <RadioGroup
                value={String(minRating)}
                onValueChange={(value: string) => setMinRating(Number(value))}
                className="mt-2 space-y-2"
              >
                {[4, 3, 2, 1, 0].map((rating) => (
                   <div key={rating} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(rating)} id={`rating-${rating}`} />
                    <Label htmlFor={`rating-${rating}`} className="font-normal">
                      {rating > 0 ? `${rating} ★ & up` : 'Any'}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </aside>

        <main className="md:col-span-3">
          <header className="flex flex-col items-baseline justify-between gap-4 border-b pb-4 md:flex-row">
            <h1 className="font-headline text-3xl font-bold">
              {filteredAndSortedRestaurants.length} Restaurants Found
            </h1>
            <div className="flex items-center gap-2">
              <Label htmlFor="sort-by">Sort by:</Label>
              <Select
                value={sortBy}
                onValueChange={(value: string) => setSortBy(value as SortOption)}
              >
                <SelectTrigger id="sort-by" className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="reviews">Most Reviewed</SelectItem>
                  <SelectItem value="price-asc">Price (Low-High)</SelectItem>
                  <SelectItem value="price-desc">Price (High-Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </header>
          {filteredAndSortedRestaurants.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {filteredAndSortedRestaurants.map((restaurant: Restaurant) => (
                <RestaurantCard 
                  key={restaurant.id} 
                  restaurant={{
                    id: restaurant.id,
                    name: restaurant.name,
                    address: restaurant.address,
                    cuisine: restaurant.cuisine,
                    rating: restaurant.rating,
                    reviewCount: restaurant.reviewsCount,
                    priceRange: restaurant.pricing,
                    menu: restaurant.menu && restaurant.menu.length > 0 ? {
                      categories: restaurant.menu,
                      analytics: {
                        dataSource: 'manual',
                        reliability: 0.8,
                        totalItems: restaurant.menu.reduce((acc, cat) => acc + cat.items.length, 0),
                        averagePrice: 0
                      }
                    } : undefined,
                    reviews: restaurant.reviews && restaurant.reviews.length > 0 ? {
                      summary: {
                        totalReviews: restaurant.reviews.length,
                        averageRating: restaurant.rating,
                        sentiment: {
                          positive: restaurant.reviews.filter(r => r.rating >= 4).length,
                          negative: restaurant.reviews.filter(r => r.rating < 3).length
                        },
                        topTopics: [],
                        recentTrend: 'stable' as const
                      },
                      sources: []
                    } : undefined
                  }} 
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 text-center text-muted-foreground">
              <p>No restaurants match your criteria.</p>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <ErrorBoundary>
      <SearchPageContent />
    </ErrorBoundary>
  );
}

