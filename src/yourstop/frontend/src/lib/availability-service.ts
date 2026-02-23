// Real-time availability service for restaurant bookings
import { RealTimeAvailability, TimeSlot, TableType } from './restaurant-data-types';
import { API_CONFIG, isApiKeyConfigured, getApiKey, rateLimiter } from './api-config';

export interface BookingRequest {
  restaurantId: string;
  date: string;
  time: string;
  partySize: number;
  tableType?: string;
  specialRequests?: string;
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  confirmationCode?: string;
  error?: string;
  estimatedWaitTime?: number;
  alternativeSlots?: TimeSlot[];
}

export interface AvailabilityFilters {
  date: string;
  partySize: number;
  timeRange?: {
    start: string;
    end: string;
  };
  tableTypes?: string[];
  specialRequests?: string[];
}

class AvailabilityService {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  // Cache TTL for different types of data
  private readonly CACHE_TTL = {
    AVAILABILITY: 5 * 60 * 1000, // 5 minutes
    BOOKING: 30 * 1000, // 30 seconds
    RESTAURANT_INFO: 60 * 60 * 1000, // 1 hour
  };

  // Get real-time availability for a restaurant
  async getAvailability(
    restaurantId: string, 
    filters: AvailabilityFilters
  ): Promise<RealTimeAvailability> {
    const cacheKey = `availability_${restaurantId}_${filters.date}_${filters.partySize}`;
    const cached = this.getCachedData(cacheKey, this.CACHE_TTL.AVAILABILITY);
    
    if (cached) {
      return cached;
    }

    try {
      // Check if booking APIs are configured
      const hasBookingApis = isApiKeyConfigured('OPENTABLE_API_KEY') || 
                            isApiKeyConfigured('RESY_API_KEY') || 
                            isApiKeyConfigured('TOAST_API_KEY');

      let availability: RealTimeAvailability;

      if (hasBookingApis) {
        // Try multiple booking APIs in parallel
        const [opentable, resy, toast] = await Promise.allSettled([
          this.fetchOpenTableAvailability(restaurantId, filters),
          this.fetchResyAvailability(restaurantId, filters),
          this.fetchToastAvailability(restaurantId, filters)
        ]);

        // Merge availability data from all sources
        availability = this.mergeAvailabilityData(
          opentable.status === 'fulfilled' ? opentable.value : null,
          resy.status === 'fulfilled' ? resy.value : null,
          toast.status === 'fulfilled' ? toast.value : null,
          restaurantId,
          filters.date
        );
      } else {
        // Use enhanced mock data with realistic availability patterns
        availability = this.generateMockAvailability(restaurantId, filters);
      }

      this.setCachedData(cacheKey, availability, this.CACHE_TTL.AVAILABILITY);
      return availability;
    } catch (error) {
      console.error('Error fetching availability:', error);
      // Fallback to mock data
      const availability = this.generateMockAvailability(restaurantId, filters);
      this.setCachedData(cacheKey, availability, this.CACHE_TTL.AVAILABILITY);
      return availability;
    }
  }

  // Book a table
  async bookTable(request: BookingRequest): Promise<BookingResponse> {
    try {
      // Check if booking APIs are configured
      const hasBookingApis = isApiKeyConfigured('OPENTABLE_API_KEY') || 
                            isApiKeyConfigured('RESY_API_KEY') || 
                            isApiKeyConfigured('TOAST_API_KEY');

      if (hasBookingApis) {
        // Try booking through available APIs
        const [opentable, resy, toast] = await Promise.allSettled([
          this.bookOpenTable(request),
          this.bookResy(request),
          this.bookToast(request)
        ]);

        // Return the first successful booking
        for (const result of [opentable, resy, toast]) {
          if (result.status === 'fulfilled' && result.value.success) {
            return result.value;
          }
        }

        return {
          success: false,
          error: 'All booking systems are currently unavailable'
        };
      } else {
        // Mock booking for development
        return this.mockBooking(request);
      }
    } catch (error) {
      console.error('Error booking table:', error);
      return {
        success: false,
        error: 'Booking failed due to a system error'
      };
    }
  }

  // Cancel a booking
  async cancelBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Implementation would depend on the booking system used
      // For now, return mock success
      return { success: true };
    } catch (error) {
      console.error('Error canceling booking:', error);
      return { success: false, error: 'Failed to cancel booking' };
    }
  }

  // Get booking status
  async getBookingStatus(bookingId: string): Promise<{
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
    details?: any;
  }> {
    try {
      // Implementation would depend on the booking system used
      // For now, return mock status
      return { status: 'confirmed' };
    } catch (error) {
      console.error('Error getting booking status:', error);
      return { status: 'cancelled' };
    }
  }

  // Private methods for API integrations
  private async fetchOpenTableAvailability(
    restaurantId: string, 
    filters: AvailabilityFilters
  ): Promise<RealTimeAvailability | null> {
    if (!isApiKeyConfigured('OPENTABLE_API_KEY')) return null;

    try {
      const apiKey = getApiKey('OPENTABLE_API_KEY');
      const url = `${API_CONFIG.OPENTABLE_BASE_URL}/restaurants/${restaurantId}/availability`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: filters.date,
          party_size: filters.partySize,
          time_range: filters.timeRange
        })
      });

      if (!response.ok) throw new Error('OpenTable API error');

      const data = await response.json();
      return this.transformOpenTableData(data, restaurantId, filters.date);
    } catch (error) {
      console.error('OpenTable availability error:', error);
      return null;
    }
  }

  private async fetchResyAvailability(
    restaurantId: string, 
    filters: AvailabilityFilters
  ): Promise<RealTimeAvailability | null> {
    if (!isApiKeyConfigured('RESY_API_KEY')) return null;

    try {
      const apiKey = getApiKey('RESY_API_KEY');
      const url = `${API_CONFIG.RESY_BASE_URL}/venues/${restaurantId}/availability`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Resy API error');

      const data = await response.json();
      return this.transformResyData(data, restaurantId, filters.date);
    } catch (error) {
      console.error('Resy availability error:', error);
      return null;
    }
  }

  private async fetchToastAvailability(
    restaurantId: string, 
    filters: AvailabilityFilters
  ): Promise<RealTimeAvailability | null> {
    if (!isApiKeyConfigured('TOAST_API_KEY')) return null;

    try {
      const apiKey = getApiKey('TOAST_API_KEY');
      const url = `${API_CONFIG.TOAST_BASE_URL}/restaurants/${restaurantId}/availability`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Toast API error');

      const data = await response.json();
      return this.transformToastData(data, restaurantId, filters.date);
    } catch (error) {
      console.error('Toast availability error:', error);
      return null;
    }
  }

  // Booking methods
  private async bookOpenTable(request: BookingRequest): Promise<BookingResponse> {
    // Implementation for OpenTable booking
    return { success: false, error: 'OpenTable booking not implemented' };
  }

  private async bookResy(request: BookingRequest): Promise<BookingResponse> {
    // Implementation for Resy booking
    return { success: false, error: 'Resy booking not implemented' };
  }

  private async bookToast(request: BookingRequest): Promise<BookingResponse> {
    // Implementation for Toast booking
    return { success: false, error: 'Toast booking not implemented' };
  }

  // Data transformation methods
  private transformOpenTableData(data: any, restaurantId: string, date: string): RealTimeAvailability {
    // Transform OpenTable API response to our format
    return {
      restaurantId,
      date,
      timeSlots: [],
      lastUpdated: new Date().toISOString(),
      source: 'opentable'
    };
  }

  private transformResyData(data: any, restaurantId: string, date: string): RealTimeAvailability {
    // Transform Resy API response to our format
    return {
      restaurantId,
      date,
      timeSlots: [],
      lastUpdated: new Date().toISOString(),
      source: 'resy'
    };
  }

  private transformToastData(data: any, restaurantId: string, date: string): RealTimeAvailability {
    // Transform Toast API response to our format
    return {
      restaurantId,
      date,
      timeSlots: [],
      lastUpdated: new Date().toISOString(),
      source: 'toast'
    };
  }

  // Enhanced mock data generation
  private generateMockAvailability(
    restaurantId: string, 
    filters: AvailabilityFilters
  ): RealTimeAvailability {
    const baseDate = new Date(filters.date);
    const isWeekend = baseDate.getDay() === 0 || baseDate.getDay() === 6;
    const isHoliday = this.isHoliday(filters.date);
    const isPeakTime = this.isPeakTime(filters.date);

    const timeSlots: TimeSlot[] = [];
    const startHour = isWeekend ? 12 : 18;
    const endHour = isWeekend ? 23 : 22;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Calculate availability based on various factors
        const availability = this.calculateAvailability(
          time, 
          isWeekend, 
          isHoliday, 
          isPeakTime, 
          filters.partySize
        );
        
        if (availability.available) {
          timeSlots.push({
            time,
            available: true,
            tableTypes: availability.tableTypes,
            maxPartySize: availability.maxPartySize,
            minPartySize: availability.minPartySize,
            price: availability.price,
            estimatedWaitTime: availability.estimatedWaitTime
          });
        } else {
          timeSlots.push({
            time,
            available: false,
            tableTypes: [],
            maxPartySize: 0,
            minPartySize: 0,
            estimatedWaitTime: availability.estimatedWaitTime
          });
        }
      }
    }

    return {
      restaurantId,
      date: filters.date,
      timeSlots,
      lastUpdated: new Date().toISOString(),
      source: 'manual' as const
    };
  }

  private calculateAvailability(
    time: string, 
    isWeekend: boolean, 
    isHoliday: boolean, 
    isPeakTime: boolean, 
    partySize: number
  ): {
    available: boolean;
    tableTypes: TableType[];
    maxPartySize: number;
    minPartySize: number;
    price: number;
    estimatedWaitTime?: number;
  } {
    const hour = parseInt(time.split(':')[0]);
    const minute = parseInt(time.split(':')[1]);
    const timeValue = hour + minute / 60;

    // Base availability probability
    let availability = 0.7;

    // Adjust for time of day
    if (timeValue >= 19 && timeValue <= 21) {
      availability *= 0.3; // Peak dinner time
    } else if (timeValue >= 12 && timeValue <= 14) {
      availability *= 0.6; // Lunch time
    }

    // Adjust for weekend
    if (isWeekend) {
      availability *= 0.5;
    }

    // Adjust for holidays
    if (isHoliday) {
      availability *= 0.2;
    }

    // Adjust for peak time
    if (isPeakTime) {
      availability *= 0.4;
    }

    // Adjust for party size
    if (partySize > 4) {
      availability *= 0.6;
    }
    if (partySize > 8) {
      availability *= 0.3;
    }

    const isAvailable = Math.random() < availability;

    if (!isAvailable) {
      return {
        available: false,
        tableTypes: [],
        maxPartySize: 0,
        minPartySize: 0,
        price: 0,
        estimatedWaitTime: Math.floor(Math.random() * 60) + 15
      };
    }

    // Generate available table types
    const tableTypes: TableType[] = [];
    const basePrice = 40 + Math.random() * 20;

    if (Math.random() > 0.3) {
      tableTypes.push({
        type: 'standard',
        available: true,
        capacity: 2
      });
    }

    if (Math.random() > 0.5) {
      tableTypes.push({
        type: 'booth',
        available: true,
        capacity: 4
      });
    }

    if (Math.random() > 0.7) {
      tableTypes.push({
        type: 'outdoor',
        available: true,
        capacity: 2
      });
    }

    if (Math.random() > 0.8) {
      tableTypes.push({
        type: 'private',
        available: true,
        capacity: 8
      });
    }

    return {
      available: true,
      tableTypes,
      maxPartySize: Math.max(...tableTypes.map(t => t.capacity)),
      minPartySize: 1,
      price: Math.round(basePrice * 100) / 100,
      estimatedWaitTime: Math.random() > 0.8 ? Math.floor(Math.random() * 15) + 5 : undefined
    };
  }

  private isHoliday(date: string): boolean {
    // Simple holiday check - in production, use a proper holiday library
    const holidays = [
      '2024-12-25', '2024-12-26', '2024-01-01', '2024-04-19', '2024-04-22',
      '2024-05-06', '2024-05-27', '2024-08-26', '2024-12-25', '2024-12-26'
    ];
    return holidays.includes(date);
  }

  private isPeakTime(date: string): boolean {
    // Check if it's a peak time (e.g., Valentine's Day, New Year's Eve)
    const peakDates = ['2024-02-14', '2024-12-31'];
    return peakDates.includes(date);
  }

  private mockBooking(request: BookingRequest): BookingResponse {
    // Generate mock booking response
    const bookingId = `B${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const confirmationCode = Math.random().toString(36).substr(2, 8).toUpperCase();

    return {
      success: true,
      bookingId,
      confirmationCode,
      estimatedWaitTime: Math.floor(Math.random() * 10) + 5
    };
  }

  private mergeAvailabilityData(
    opentable: RealTimeAvailability | null,
    resy: RealTimeAvailability | null,
    toast: RealTimeAvailability | null,
    restaurantId: string,
    date: string
  ): RealTimeAvailability {
    // Merge data from multiple sources, prioritizing real-time data
    const allTimeSlots: TimeSlot[] = [];
    const sources: string[] = [];

    if (opentable) {
      allTimeSlots.push(...opentable.timeSlots);
      sources.push('opentable');
    }
    if (resy) {
      allTimeSlots.push(...resy.timeSlots);
      sources.push('resy');
    }
    if (toast) {
      allTimeSlots.push(...toast.timeSlots);
      sources.push('toast');
    }

    // Deduplicate and merge time slots
    const mergedSlots = this.mergeTimeSlots(allTimeSlots);

    return {
      restaurantId,
      date,
      timeSlots: mergedSlots,
      lastUpdated: new Date().toISOString(),
      source: 'merged' as const
    };
  }

  private mergeTimeSlots(slots: TimeSlot[]): TimeSlot[] {
    const slotMap = new Map<string, TimeSlot>();

    slots.forEach(slot => {
      const existing = slotMap.get(slot.time);
      if (!existing) {
        slotMap.set(slot.time, slot);
      } else {
        // Merge table types and update availability
        const mergedSlot: TimeSlot = {
          ...existing,
          available: existing.available || slot.available,
          tableTypes: [...existing.tableTypes, ...slot.tableTypes],
          maxPartySize: Math.max(existing.maxPartySize, slot.maxPartySize),
          minPartySize: Math.min(existing.minPartySize, slot.minPartySize),
          price: existing.price || slot.price
        };
        slotMap.set(slot.time, mergedSlot);
      }
    });

    return Array.from(slotMap.values()).sort((a, b) => a.time.localeCompare(b.time));
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

export const availabilityService = new AvailabilityService();
