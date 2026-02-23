// Common type definitions

export interface AllergenInfo {
  contains: string[];
  mayContain: string[];
}

export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface TableType {
  id: string;
  name: string;
  capacity: number;
  price: number;
  available: boolean;
}

export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  error?: string;
  message?: string;
}

export interface UseAdvancedFiltersReturn {
  filters: any;
  setFilters: (filters: any) => void;
  clearFilters: () => void;
  totalCount?: number;
}

export interface UseAdvancedFiltersProps {
  restaurants: any[];
  onFilterChange: (filtered: any[]) => void;
}

export interface TestResult {
  status: 'running' | 'passed' | 'failed' | 'skipped';
  details?: any;
  error?: string;
}

export interface UserCredential {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
  };
  error?: any;
}

export interface MenuItemExtended extends MenuItem {
  ingredients?: string[];
  dietary?: string[];
  contains?: string[];
  mayContain?: string[];
  prepTime?: number;
  availability?: boolean;
  spiceLevel?: number;
  popularity?: number;
}

export interface ReviewData {
  text: string;
  author: string;
  date: string;
  rating: number;
  source: 'google' | 'foursquare' | 'yelp' | 'tripadvisor' | 'opentable';
}

export interface AvailabilityData {
  available: boolean;
  tableTypes: TableType[];
  maxPartySize: number;
  minPartySize: number;
  price: number;
  estimatedWaitTime?: number;
  source: 'google' | 'yelp' | 'manual' | 'opentable' | 'resy' | 'toast' | 'square' | 'merged';
}

export interface MenuData {
  categories: Array<{
    name: string;
    items: MenuItemExtended[];
  }>;
  source: 'manual' | 'toast' | 'square' | 'scraped';
}

// Re-export MenuItem from restaurant types
export type { MenuItem } from './restaurant';
