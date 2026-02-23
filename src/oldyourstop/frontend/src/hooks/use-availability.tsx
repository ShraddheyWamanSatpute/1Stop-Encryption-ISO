'use client';

import { useState, useEffect, useCallback } from 'react';
import { RealTimeAvailability, BookingRequest, BookingResponse, AvailabilityFilters } from '@/lib/restaurant-data-types';
import { availabilityService } from '@/lib/availability-service';

export function useAvailability(restaurantId: string, initialFilters?: AvailabilityFilters) {
  const [availability, setAvailability] = useState<RealTimeAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AvailabilityFilters>(
    initialFilters || {
      date: new Date().toISOString().split('T')[0],
      partySize: 2
    }
  );

  const fetchAvailability = useCallback(async (currentFilters: AvailabilityFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await availabilityService.getAvailability(restaurantId, currentFilters);
      setAvailability(data);
    } catch (err: any) {
      setError(err.message);
      setAvailability(null);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId) {
      fetchAvailability(filters);
    }
  }, [restaurantId, filters, fetchAvailability]);

  const updateFilters = useCallback((newFilters: Partial<AvailabilityFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const refreshAvailability = useCallback(() => {
    fetchAvailability(filters);
  }, [filters, fetchAvailability]);

  return {
    availability,
    loading,
    error,
    filters,
    updateFilters,
    refreshAvailability
  };
}

export function useBooking() {
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookTable = useCallback(async (request: BookingRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await availabilityService.bookTable(request);
      setBooking(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Booking failed';
      setError(errorMessage);
      setBooking({ success: false, error: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelBooking = useCallback(async (bookingId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await availabilityService.cancelBooking(bookingId);
      if (result.success) {
        setBooking(null);
      }
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Cancellation failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getBookingStatus = useCallback(async (bookingId: string) => {
    try {
      return await availabilityService.getBookingStatus(bookingId);
    } catch (err: any) {
      console.error('Error getting booking status:', err);
      return { status: 'cancelled' as const };
    }
  }, []);

  return {
    booking,
    loading,
    error,
    bookTable,
    cancelBooking,
    getBookingStatus
  };
}

export function useRealTimeAvailability(restaurantId: string, refreshInterval: number = 30000) {
  const [availability, setAvailability] = useState<RealTimeAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await availabilityService.getAvailability(restaurantId, {
        date: new Date().toISOString().split('T')[0],
        partySize: 2
      });
      setAvailability(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId) {
      fetchAvailability();
      
      // Set up auto-refresh
      const interval = setInterval(fetchAvailability, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [restaurantId, fetchAvailability, refreshInterval]);

  return {
    availability,
    loading,
    error,
    lastUpdated,
    refresh: fetchAvailability
  };
}
