/**
 * Backend services for frontend API routes
 * This file contains the backend services needed for the API routes
 */

// Re-export types from the existing types
export type { RestaurantData } from './restaurant-data-types';

// Booking types
export interface Booking {
  bookingId: string;
  restaurantId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  partySize: number;
  dateTime: string;
  specialRequests?: string;
  confirmedAt: string;
  depositPaid?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface GuestInfo {
  name: string;
  email: string;
  phone?: string;
  specialRequests?: string;
}

// Error handling
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ErrorHandler {
  static createValidationError(message: string): AppError {
    return new AppError(message, ErrorCode.VALIDATION_ERROR, 400);
  }

  static createAuthenticationError(message: string = 'Authentication required'): AppError {
    return new AppError(message, ErrorCode.AUTHENTICATION_ERROR, 401);
  }

  static createAuthorizationError(message: string = 'Insufficient permissions'): AppError {
    return new AppError(message, ErrorCode.AUTHORIZATION_ERROR, 403);
  }

  static createNotFoundError(message: string = 'Resource not found'): AppError {
    return new AppError(message, ErrorCode.NOT_FOUND, 404);
  }

  static createConflictError(message: string = 'Resource conflict'): AppError {
    return new AppError(message, ErrorCode.CONFLICT, 409);
  }

  static createExternalServiceError(message: string = 'External service error'): AppError {
    return new AppError(message, ErrorCode.EXTERNAL_SERVICE_ERROR, 502);
  }

  static createRateLimitError(message: string = 'Rate limit exceeded'): AppError {
    return new AppError(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429);
  }
}

export class Logger {
  static info(message: string, data?: any): void {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  static warn(message: string, data?: any): void {
    console.warn(`[WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  static error(message: string, error?: Error, data?: any): void {
    console.error(`[ERROR] ${message}`, {
      error: error?.message,
      stack: error?.stack,
      data: data ? JSON.stringify(data, null, 2) : undefined,
    });
  }

  static debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
}

// Mock data service for development
export class MockDataService {
  private static bookings: Booking[] = [];
  private static restaurants = [
    {
      id: 'rest_1',
      name: 'The London Grill',
      cuisine: 'Modern British',
      address: '123 High Street, London SW1A 1AA',
      phone: '+44 20 7123 4567',
      rating: 4.5,
      reviewCount: 245,
      priceRange: '£££' as const,
      description: 'A contemporary British restaurant serving seasonal dishes with a modern twist.',
    }
  ];

  static async createBooking(booking: Omit<Booking, 'bookingId' | 'confirmedAt' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
    const newBooking: Booking = {
      ...booking,
      bookingId: `BK-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.bookings.push(newBooking);
    return newBooking;
  }

  static async getBooking(bookingId: string): Promise<Booking | null> {
    return this.bookings.find(booking => booking.bookingId === bookingId) || null;
  }

  static async getBookingsByRestaurant(restaurantId: string): Promise<Booking[]> {
    return this.bookings.filter(booking => booking.restaurantId === restaurantId);
  }

  static async getBookingsByDate(date: string): Promise<Booking[]> {
    return this.bookings.filter(booking => booking.dateTime.startsWith(date));
  }

  static async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<Booking | null> {
    const index = this.bookings.findIndex(booking => booking.bookingId === bookingId);
    if (index === -1) return null;

    this.bookings[index] = {
      ...this.bookings[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return this.bookings[index];
  }

  static async deleteBooking(bookingId: string): Promise<boolean> {
    const index = this.bookings.findIndex(booking => booking.bookingId === bookingId);
    if (index === -1) return false;

    this.bookings.splice(index, 1);
    return true;
  }

  static async getRestaurant(restaurantId: string): Promise<any | null> {
    return this.restaurants.find(restaurant => restaurant.id === restaurantId) || null;
  }
}

// Validation service
export class ValidationService {
  static validateBookingRequest(data: unknown) {
    if (!data || typeof data !== 'object') {
      throw ErrorHandler.createValidationError('Invalid request data');
    }

    const bookingData = data as any;
    
    if (!bookingData.restaurantId) {
      throw ErrorHandler.createValidationError('Restaurant ID is required');
    }
    
    if (!bookingData.dateTime) {
      throw ErrorHandler.createValidationError('Date and time are required');
    }
    
    if (!bookingData.partySize || bookingData.partySize < 1) {
      throw ErrorHandler.createValidationError('Party size must be at least 1');
    }
    
    if (!bookingData.guestInfo || !bookingData.guestInfo.name || !bookingData.guestInfo.email) {
      throw ErrorHandler.createValidationError('Guest information is required');
    }

    return bookingData;
  }

  static validateBookingUpdate(data: unknown) {
    if (!data || typeof data !== 'object') {
      throw ErrorHandler.createValidationError('Invalid update data');
    }

    const updateData = data as any;
    
    if (updateData.partySize && updateData.partySize < 1) {
      throw ErrorHandler.createValidationError('Party size must be at least 1');
    }

    return updateData;
  }
}
