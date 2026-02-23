import prisma from './prisma';
import { createLogger } from './logger';

const logger = createLogger();

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

export interface RestaurantData {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  cuisine: string[];
  priceRange?: string;
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantSearchResult {
  restaurants: RestaurantData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class RestaurantDataService {
  async getRestaurants(filters: RestaurantFilters = {}): Promise<RestaurantSearchResult> {
    try {
      const {
        query,
        location,
        cuisine = [],
        priceRange = [],
        rating,
        features = [],
        page = 1,
        limit = 20
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        isActive: true,
      };

      // Text search
      if (query) {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { cuisine: { hasSome: [query] } },
        ];
      }

      // Location search
      if (location) {
        where.OR = [
          ...(where.OR || []),
          { city: { contains: location, mode: 'insensitive' } },
          { state: { contains: location, mode: 'insensitive' } },
          { country: { contains: location, mode: 'insensitive' } },
          { address: { contains: location, mode: 'insensitive' } },
        ];
      }

      // Cuisine filter
      if (cuisine.length > 0) {
        where.cuisine = { hasSome: cuisine };
      }

      // Price range filter
      if (priceRange.length > 0) {
        where.priceRange = { in: priceRange };
      }

      // Rating filter
      if (rating) {
        where.rating = { gte: rating };
      }

      // Get total count
      const total = await prisma.restaurant.count({ where });

      // Get restaurants with pagination
      const restaurants = await prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { rating: 'desc' },
          { reviewCount: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          _count: {
            select: {
              reviews: true,
              bookings: true
            }
          }
        }
      });

      // Transform data
      const restaurantData: RestaurantData[] = restaurants.map((restaurant: any) => ({
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description || undefined,
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state || undefined,
        country: restaurant.country,
        postalCode: restaurant.postalCode || undefined,
        latitude: restaurant.latitude || undefined,
        longitude: restaurant.longitude || undefined,
        phone: restaurant.phone || undefined,
        email: restaurant.email || undefined,
        website: restaurant.website || undefined,
        cuisine: restaurant.cuisine,
        priceRange: restaurant.priceRange || undefined,
        rating: restaurant.rating,
        reviewCount: restaurant._count.reviews,
        imageUrl: restaurant.imageUrl || undefined,
        isActive: restaurant.isActive,
        createdAt: restaurant.createdAt.toISOString(),
        updatedAt: restaurant.updatedAt.toISOString(),
      }));

      const totalPages = Math.ceil(total / limit);

      logger.info('Restaurants fetched', {
        count: restaurantData.length,
        total,
        page,
        limit,
        filters
      });

      return {
        restaurants: restaurantData,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      logger.error('Error fetching restaurants:', error);
      throw new Error('Failed to fetch restaurants');
    }
  }

  async getRestaurantById(id: string): Promise<RestaurantData | null> {
    try {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              reviews: true,
              bookings: true
            }
          }
        }
      });

      if (!restaurant) {
        return null;
      }

      return {
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description || undefined,
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state || undefined,
        country: restaurant.country,
        postalCode: restaurant.postalCode || undefined,
        latitude: restaurant.latitude || undefined,
        longitude: restaurant.longitude || undefined,
        phone: restaurant.phone || undefined,
        email: restaurant.email || undefined,
        website: restaurant.website || undefined,
        cuisine: restaurant.cuisine,
        priceRange: restaurant.priceRange || undefined,
        rating: restaurant.rating,
        reviewCount: restaurant._count.reviews,
        imageUrl: restaurant.imageUrl || undefined,
        isActive: restaurant.isActive,
        createdAt: restaurant.createdAt.toISOString(),
        updatedAt: restaurant.updatedAt.toISOString(),
      };
    } catch (error) {
      logger.error('Error fetching restaurant by ID:', error);
      throw new Error('Failed to fetch restaurant');
    }
  }

  async createRestaurant(data: Omit<RestaurantData, 'id' | 'createdAt' | 'updatedAt'>): Promise<RestaurantData> {
    try {
      const restaurant = await prisma.restaurant.create({
        data: {
          name: data.name,
          description: data.description,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          postalCode: data.postalCode,
          latitude: data.latitude,
          longitude: data.longitude,
          phone: data.phone,
          email: data.email,
          website: data.website,
          cuisine: data.cuisine,
          priceRange: data.priceRange,
          rating: data.rating,
          reviewCount: data.reviewCount,
          imageUrl: data.imageUrl,
          isActive: data.isActive,
        },
        include: {
          _count: {
            select: {
              reviews: true,
              bookings: true
            }
          }
        }
      });

      logger.info('Restaurant created', { id: restaurant.id, name: restaurant.name });

      return {
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description || undefined,
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state || undefined,
        country: restaurant.country,
        postalCode: restaurant.postalCode || undefined,
        latitude: restaurant.latitude || undefined,
        longitude: restaurant.longitude || undefined,
        phone: restaurant.phone || undefined,
        email: restaurant.email || undefined,
        website: restaurant.website || undefined,
        cuisine: restaurant.cuisine,
        priceRange: restaurant.priceRange || undefined,
        rating: restaurant.rating,
        reviewCount: restaurant._count.reviews,
        imageUrl: restaurant.imageUrl || undefined,
        isActive: restaurant.isActive,
        createdAt: restaurant.createdAt.toISOString(),
        updatedAt: restaurant.updatedAt.toISOString(),
      };
    } catch (error) {
      logger.error('Error creating restaurant:', error);
      throw new Error('Failed to create restaurant');
    }
  }

  async updateRestaurant(id: string, data: Partial<RestaurantData>): Promise<RestaurantData | null> {
    try {
      const restaurant = await prisma.restaurant.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          postalCode: data.postalCode,
          latitude: data.latitude,
          longitude: data.longitude,
          phone: data.phone,
          email: data.email,
          website: data.website,
          cuisine: data.cuisine,
          priceRange: data.priceRange,
          rating: data.rating,
          reviewCount: data.reviewCount,
          imageUrl: data.imageUrl,
          isActive: data.isActive,
        },
        include: {
          _count: {
            select: {
              reviews: true,
              bookings: true
            }
          }
        }
      });

      logger.info('Restaurant updated', { id: restaurant.id, name: restaurant.name });

      return {
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description || undefined,
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state || undefined,
        country: restaurant.country,
        postalCode: restaurant.postalCode || undefined,
        latitude: restaurant.latitude || undefined,
        longitude: restaurant.longitude || undefined,
        phone: restaurant.phone || undefined,
        email: restaurant.email || undefined,
        website: restaurant.website || undefined,
        cuisine: restaurant.cuisine,
        priceRange: restaurant.priceRange || undefined,
        rating: restaurant.rating,
        reviewCount: restaurant._count.reviews,
        imageUrl: restaurant.imageUrl || undefined,
        isActive: restaurant.isActive,
        createdAt: restaurant.createdAt.toISOString(),
        updatedAt: restaurant.updatedAt.toISOString(),
      };
    } catch (error) {
      logger.error('Error updating restaurant:', error);
      throw new Error('Failed to update restaurant');
    }
  }

  async deleteRestaurant(id: string): Promise<boolean> {
    try {
      await prisma.restaurant.delete({
        where: { id }
      });

      logger.info('Restaurant deleted', { id });
      return true;
    } catch (error) {
      logger.error('Error deleting restaurant:', error);
      return false;
    }
  }
}

export const restaurantDataService = new RestaurantDataService();
