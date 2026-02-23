/**
 * Backend booking type definitions
 */

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

export interface BookingConfirmation {
  bookingId: string;
  confirmationMessage: string;
  depositRequired: boolean;
  depositAmount?: number;
  bookingDetails?: any;
}

export interface PaymentDetails {
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
}

export interface BookingSlot {
  dateTime: string;
  availableTables: number;
  isAvailable: boolean;
}

export interface BookingRequest {
  restaurantId: string;
  dateTime: string;
  partySize: number;
  guestInfo: GuestInfo;
}

export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  message: string;
  error?: string;
}
