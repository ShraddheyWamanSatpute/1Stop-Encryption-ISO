export interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  cuisine: string[];
  priceRange: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Additional properties
  image?: string;
  isOpen?: boolean;
  reviews?: {
    summary: {
      totalReviews: number;
      averageRating: number;
    };
    recent: Array<{
      author: string;
      rating: number;
      text: string;
      date: string;
    }>;
  };
  capacity?: number;
  phone?: string;
  website?: string;
  features?: string[];
  operatingHours?: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
}

export interface RestaurantData {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  cuisine: string[];
  priceRange: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  phone?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  images?: string[];
  operatingHours?: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  availability?: {
    availableSlots: string[];
    nextAvailable: string;
  };
  reviews?: {
    summary: {
      totalReviews: number;
      averageRating: number;
    };
    recent: Array<{
      author: string;
      rating: number;
      text: string;
      date: string;
    }>;
  };
  menu?: {
    categories: Array<{
      name: string;
      items: MenuItem[];
    }>;
  };
  // Additional properties to match Restaurant interface
  image?: string;
  isOpen?: boolean;
  capacity?: number;
  website?: string;
  features?: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  ingredients?: string[];
  dietary?: string[];
  contains?: string[];
  mayContain?: string[];
  prepTime?: number;
  availability?: boolean;
  spiceLevel?: number;
  popularity?: number;
  // Additional properties for menu browser
  allergens?: {
    contains?: string[];
    mayContain?: string[];
  };
}

export interface FavoriteRestaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  cuisine: string[];
  priceRange: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Additional properties to match RestaurantData
  phone?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  images?: string[];
  operatingHours?: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  availability?: {
    availableSlots: string[];
    nextAvailable: string;
  };
  reviews?: {
    summary: {
      totalReviews: number;
      averageRating: number;
    };
    recent: Array<{
      author: string;
      rating: number;
      text: string;
      date: string;
    }>;
  };
  menu?: {
    categories: Array<{
      name: string;
      items: MenuItem[];
    }>;
  };
  image?: string;
  isOpen?: boolean;
  capacity?: number;
  website?: string;
  features?: string[];
}

export interface RestaurantSearchResult {
  restaurants: RestaurantData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RestaurantFilters {
  query?: string;
  location?: string;
  cuisine?: string[];
  priceRange?: string[];
  rating?: number;
  features?: string[];
  page?: number;
  limit?: number;
}
