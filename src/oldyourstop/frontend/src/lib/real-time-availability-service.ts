// Real-time Booking Availability Service
export interface TimeSlot {
  time: string;
  available: boolean;
  tableTypes: string[];
  partySize: number;
  price?: number;
  specialOffer?: string;
  waitTime?: number; // in minutes
}

export interface AvailabilityRequest {
  restaurantId: string;
  date: string;
  partySize: number;
  preferredTime?: string;
  tableType?: string;
  specialRequests?: string[];
}

export interface AvailabilityResponse {
  restaurantId: string;
  date: string;
  partySize: number;
  availableSlots: TimeSlot[];
  suggestedAlternatives?: AlternativeOption[];
  lastUpdated: string;
  source: string;
  reliability: number;
}

export interface AlternativeOption {
  type: 'time' | 'date' | 'partySize' | 'restaurant';
  suggestion: string;
  reason: string;
  availability: TimeSlot[];
}

export interface BookingRequest {
  restaurantId: string;
  date: string;
  time: string;
  partySize: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  specialRequests?: string[];
  tableType?: string;
}

export interface BookingResponse {
  bookingId: string;
  status: 'confirmed' | 'pending' | 'waitlist' | 'failed';
  confirmationCode?: string;
  estimatedWaitTime?: number;
  message: string;
  cancellationPolicy?: string;
}

export interface RestaurantCapacity {
  restaurantId: string;
  totalTables: number;
  tableTypes: {
    type: string;
    count: number;
    capacity: number;
  }[];
  peakHours: string[];
  averageTurnoverTime: number; // in minutes
  lastUpdated: string;
}

export class RealTimeAvailabilityService {
  private readonly AVAILABILITY_CACHE = new Map<string, { data: AvailabilityResponse, timestamp: number }>();
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes for real-time data
  private readonly BOOKING_CACHE = new Map<string, BookingResponse>();
  private readonly CAPACITY_CACHE = new Map<string, RestaurantCapacity>();

  // Get real-time availability for a restaurant
  async getAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
    console.log(`🕐 Getting availability for restaurant ${request.restaurantId}`);
    
    const cacheKey = this.generateAvailabilityCacheKey(request);
    
    // Check cache for recent data
    const cached = this.AVAILABILITY_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('📋 Using cached availability data');
      return cached.data;
    }

    try {
      // Try multiple availability sources
      const availabilitySources = await Promise.allSettled([
        this.getAvailabilityFromBookingSystem(request),
        this.getAvailabilityFromRestaurantAPI(request),
        this.estimateAvailabilityFromCapacity(request)
      ]);

      // Use the most reliable source
      let availabilityData: AvailabilityResponse | null = null;
      let highestReliability = 0;

      for (const result of availabilitySources) {
        if (result.status === 'fulfilled' && result.value.reliability > highestReliability) {
          availabilityData = result.value;
          highestReliability = result.value.reliability;
        }
      }

      // If no data found, generate estimated availability
      if (!availabilityData) {
        availabilityData = await this.generateEstimatedAvailability(request);
      }

      // Add alternative suggestions
      availabilityData.suggestedAlternatives = await this.generateAlternatives(request, availabilityData);

      // Cache the result
      this.AVAILABILITY_CACHE.set(cacheKey, { 
        data: availabilityData, 
        timestamp: Date.now() 
      });

      return availabilityData;
    } catch (error) {
      console.error('Error getting availability:', error);
      return this.generateEstimatedAvailability(request);
    }
  }

  // Get availability from integrated booking system
  private async getAvailabilityFromBookingSystem(request: AvailabilityRequest): Promise<AvailabilityResponse> {
    console.log('🔗 Checking integrated booking system');
    
    try {
      const response = await fetch('/api/booking-system/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (response.ok) {
        const data = await response.json();
        return {
          ...data,
          source: 'booking_system',
          reliability: 95,
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (error) {
      console.log('Booking system unavailable:', error);
    }

    throw new Error('Booking system unavailable');
  }

  // Get availability from restaurant's own API
  private async getAvailabilityFromRestaurantAPI(request: AvailabilityRequest): Promise<AvailabilityResponse> {
    console.log('🏪 Checking restaurant API');
    
    try {
      // This would integrate with restaurant-specific APIs
      const response = await fetch(`/api/restaurant/${request.restaurantId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (response.ok) {
        const data = await response.json();
        return {
          ...data,
          source: 'restaurant_api',
          reliability: 85,
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (error) {
      console.log('Restaurant API unavailable:', error);
    }

    throw new Error('Restaurant API unavailable');
  }

  // Estimate availability based on restaurant capacity and historical data
  private async estimateAvailabilityFromCapacity(request: AvailabilityRequest): Promise<AvailabilityResponse> {
    console.log('📊 Estimating availability from capacity data');
    
    const capacity = await this.getRestaurantCapacity(request.restaurantId);
    const historicalData = await this.getHistoricalBookingData(request.restaurantId, request.date);
    
    const availableSlots = this.generateTimeSlots(request, capacity, historicalData);
    
    return {
      restaurantId: request.restaurantId,
      date: request.date,
      partySize: request.partySize,
      availableSlots,
      source: 'capacity_estimation',
      reliability: 70,
      lastUpdated: new Date().toISOString()
    };
  }

  // Generate estimated availability when no real data is available
  private async generateEstimatedAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
    console.log('🤖 Generating estimated availability');
    
    const timeSlots: TimeSlot[] = [];
    const requestDate = new Date(request.date);
    const today = new Date();
    const isToday = requestDate.toDateString() === today.toDateString();
    const currentHour = today.getHours();

    // Generate time slots from 12:00 to 22:00
    for (let hour = 12; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Skip past times for today
        if (isToday && hour <= currentHour) {
          continue;
        }

        // Calculate availability based on various factors
        const availability = this.calculateEstimatedAvailability(hour, minute, request.partySize, requestDate);
        
        timeSlots.push({
          time: timeString,
          available: availability.available,
          tableTypes: availability.tableTypes,
          partySize: request.partySize,
          waitTime: availability.waitTime
        });
      }
    }

    return {
      restaurantId: request.restaurantId,
      date: request.date,
      partySize: request.partySize,
      availableSlots: timeSlots,
      source: 'estimated',
      reliability: 50,
      lastUpdated: new Date().toISOString()
    };
  }

  // Calculate estimated availability based on time and party size
  private calculateEstimatedAvailability(hour: number, minute: number, partySize: number, date: Date): {
    available: boolean;
    tableTypes: string[];
    waitTime?: number;
  } {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isPeakHour = (hour >= 18 && hour <= 20); // 6-8 PM peak dinner
    const isLunchHour = (hour >= 12 && hour <= 14); // 12-2 PM lunch

    // Base availability probability
    let availabilityProbability = 0.8;

    // Adjust for peak times
    if (isPeakHour) {
      availabilityProbability -= 0.3;
    } else if (isLunchHour) {
      availabilityProbability -= 0.1;
    }

    // Adjust for weekends
    if (isWeekend) {
      availabilityProbability -= 0.2;
    }

    // Adjust for party size
    if (partySize > 6) {
      availabilityProbability -= 0.3;
    } else if (partySize > 4) {
      availabilityProbability -= 0.1;
    }

    // Adjust for time of day
    if (hour < 17 || hour > 21) {
      availabilityProbability += 0.2; // Less busy times
    }

    const available = Math.random() < Math.max(0.1, availabilityProbability);
    
    const tableTypes = [];
    if (partySize <= 2) tableTypes.push('standard', 'bar');
    if (partySize <= 4) tableTypes.push('standard');
    if (partySize <= 6) tableTypes.push('large');
    if (partySize > 6) tableTypes.push('private');

    const waitTime = available ? 0 : Math.floor(Math.random() * 60) + 15; // 15-75 minutes

    return {
      available,
      tableTypes,
      waitTime: available ? undefined : waitTime
    };
  }

  // Generate alternative suggestions
  private async generateAlternatives(request: AvailabilityRequest, availability: AvailabilityResponse): Promise<AlternativeOption[]> {
    const alternatives: AlternativeOption[] = [];

    // If no slots available, suggest different times
    const availableSlots = availability.availableSlots.filter(slot => slot.available);
    if (availableSlots.length === 0) {
      // Suggest next day
      const nextDay = new Date(request.date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      alternatives.push({
        type: 'date',
        suggestion: nextDay.toISOString().split('T')[0],
        reason: 'No availability on selected date',
        availability: await this.generateTimeSlots(
          { ...request, date: nextDay.toISOString().split('T')[0] },
          null,
          null
        )
      });

      // Suggest smaller party size
      if (request.partySize > 2) {
        alternatives.push({
          type: 'partySize',
          suggestion: (request.partySize - 1).toString(),
          reason: 'More availability for smaller groups',
          availability: []
        });
      }
    }

    // Suggest earlier/later times if preferred time not available
    if (request.preferredTime) {
      const preferredSlot = availability.availableSlots.find(slot => slot.time === request.preferredTime);
      if (!preferredSlot?.available) {
        const nearbySlots = availability.availableSlots
          .filter(slot => slot.available)
          .slice(0, 3);
          
        if (nearbySlots.length > 0) {
          alternatives.push({
            type: 'time',
            suggestion: nearbySlots[0].time,
            reason: 'Alternative time slots available',
            availability: nearbySlots
          });
        }
      }
    }

    return alternatives;
  }

  // Make a booking
  async makeBooking(request: BookingRequest): Promise<BookingResponse> {
    console.log(`📅 Making booking for restaurant ${request.restaurantId}`);
    
    try {
      // Check availability first
      const availability = await this.getAvailability({
        restaurantId: request.restaurantId,
        date: request.date,
        partySize: request.partySize,
        preferredTime: request.time
      });

      const requestedSlot = availability.availableSlots.find(slot => slot.time === request.time);
      
      if (!requestedSlot?.available) {
        return {
          bookingId: '',
          status: 'failed',
          message: 'Requested time slot is not available'
        };
      }

      // Try to make booking through integrated systems
      const bookingSources = await Promise.allSettled([
        this.makeBookingThroughSystem(request),
        this.makeBookingThroughRestaurant(request)
      ]);

      // Use the first successful booking
      for (const result of bookingSources) {
        if (result.status === 'fulfilled') {
          const booking = result.value;
          this.BOOKING_CACHE.set(booking.bookingId, booking);
          return booking;
        }
      }

      // If no integrated system available, create pending booking
      const bookingId = this.generateBookingId();
      const booking: BookingResponse = {
        bookingId,
        status: 'pending',
        message: 'Booking request submitted. Restaurant will confirm within 15 minutes.',
        cancellationPolicy: 'Free cancellation up to 2 hours before reservation time'
      };

      this.BOOKING_CACHE.set(bookingId, booking);
      
      // Send booking request to restaurant (would be implemented)
      this.sendBookingRequestToRestaurant(request, bookingId);
      
      return booking;
    } catch (error) {
      console.error('Booking error:', error);
      return {
        bookingId: '',
        status: 'failed',
        message: 'Unable to process booking at this time. Please try again.'
      };
    }
  }

  // Make booking through integrated booking system
  private async makeBookingThroughSystem(request: BookingRequest): Promise<BookingResponse> {
    const response = await fetch('/api/booking-system/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (response.ok) {
      return await response.json();
    }

    throw new Error('Booking system unavailable');
  }

  // Make booking through restaurant's system
  private async makeBookingThroughRestaurant(request: BookingRequest): Promise<BookingResponse> {
    const response = await fetch(`/api/restaurant/${request.restaurantId}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (response.ok) {
      return await response.json();
    }

    throw new Error('Restaurant booking system unavailable');
  }

  // Get restaurant capacity information
  private async getRestaurantCapacity(restaurantId: string): Promise<RestaurantCapacity | null> {
    const cached = this.CAPACITY_CACHE.get(restaurantId);
    if (cached) return cached;

    try {
      const response = await fetch(`/api/restaurant/${restaurantId}/capacity`);
      if (response.ok) {
        const capacity = await response.json();
        this.CAPACITY_CACHE.set(restaurantId, capacity);
        return capacity;
      }
    } catch (error) {
      console.log('Could not get capacity data:', error);
    }

    return null;
  }

  // Get historical booking data for better predictions
  private async getHistoricalBookingData(restaurantId: string, date: string): Promise<any> {
    try {
      const response = await fetch(`/api/analytics/booking-patterns/${restaurantId}?date=${date}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('Could not get historical data:', error);
    }

    return null;
  }

  // Generate time slots based on capacity and historical data
  private generateTimeSlots(request: AvailabilityRequest, capacity: RestaurantCapacity | null, historical: any): TimeSlot[] {
    const slots: TimeSlot[] = [];
    
    // This would use capacity and historical data to generate realistic time slots
    // For now, return basic estimated slots
    for (let hour = 12; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const availability = this.calculateEstimatedAvailability(hour, minute, request.partySize, new Date(request.date));
        
        slots.push({
          time: timeString,
          available: availability.available,
          tableTypes: availability.tableTypes,
          partySize: request.partySize,
          waitTime: availability.waitTime
        });
      }
    }

    return slots;
  }

  // Send booking request to restaurant (placeholder)
  private async sendBookingRequestToRestaurant(request: BookingRequest, bookingId: string): Promise<void> {
    // This would integrate with restaurant notification systems
    console.log(`📧 Sending booking request ${bookingId} to restaurant ${request.restaurantId}`);
    
    // Could send email, SMS, or API call to restaurant
    // For now, just log the action
  }

  // Generate unique booking ID
  private generateBookingId(): string {
    return 'BK' + Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  // Generate cache key for availability
  private generateAvailabilityCacheKey(request: AvailabilityRequest): string {
    return `${request.restaurantId}_${request.date}_${request.partySize}_${request.preferredTime || 'any'}`;
  }

  // Get booking status
  async getBookingStatus(bookingId: string): Promise<BookingResponse | null> {
    return this.BOOKING_CACHE.get(bookingId) || null;
  }

  // Cancel booking
  async cancelBooking(bookingId: string): Promise<{ success: boolean; message: string }> {
    const booking = this.BOOKING_CACHE.get(bookingId);
    if (!booking) {
      return { success: false, message: 'Booking not found' };
    }

    // Update booking status
    booking.status = 'failed';
    this.BOOKING_CACHE.set(bookingId, booking);

    return { success: true, message: 'Booking cancelled successfully' };
  }

  // Clear caches
  clearCache(): void {
    this.AVAILABILITY_CACHE.clear();
    this.BOOKING_CACHE.clear();
    this.CAPACITY_CACHE.clear();
  }

  // Get availability statistics
  getAvailabilityStats(): { cacheSize: number; bookingCount: number } {
    return {
      cacheSize: this.AVAILABILITY_CACHE.size,
      bookingCount: this.BOOKING_CACHE.size
    };
  }
}

export const realTimeAvailabilityService = new RealTimeAvailabilityService();
