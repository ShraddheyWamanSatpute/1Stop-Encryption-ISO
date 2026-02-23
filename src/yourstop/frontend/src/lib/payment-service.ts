// Payment processing service for restaurant bookings
import { BookingRequest, BookingResponse } from './restaurant-data-types';

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  billingDetails: {
    name: string;
    email: string;
    phone?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
  requiresAction?: boolean;
  clientSecret?: string;
}

class PaymentService {
  private stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  private stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

  // Initialize Stripe (client-side)
  async initializeStripe() {
    if (typeof window === 'undefined') return null;
    
    if (!this.stripePublishableKey) {
      console.warn('Stripe publishable key not configured');
      return null;
    }

    try {
      const { loadStripe } = await import('@stripe/stripe-js');
      return await loadStripe(this.stripePublishableKey);
    } catch (error) {
      console.error('Error loading Stripe:', error);
      return null;
    }
  }

  // Create payment intent for booking
  async createPaymentIntent(bookingRequest: BookingRequest, amount: number): Promise<PaymentIntent> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingRequest,
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'gbp',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Process payment
  async processPayment(paymentIntentId: string, paymentMethodId: string): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process payment');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  // Confirm payment
  async confirmPayment(paymentIntentId: string): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm payment');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error confirming payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment confirmation failed',
      };
    }
  }

  // Cancel payment
  async cancelPayment(paymentIntentId: string): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel payment');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error canceling payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment cancellation failed',
      };
    }
  }

  // Get payment status
  async getPaymentStatus(paymentIntentId: string): Promise<{
    status: string;
    amount: number;
    currency: string;
    created: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/status/${paymentIntentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get payment status');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }

  // Save payment method for future use
  async savePaymentMethod(customerId: string, paymentMethodId: string): Promise<PaymentMethod> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/save-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save payment method');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error saving payment method:', error);
      throw error;
    }
  }

  // Get saved payment methods
  async getSavedPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/methods/${customerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get saved payment methods');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting saved payment methods:', error);
      return [];
    }
  }

  // Calculate booking total
  calculateBookingTotal(bookingRequest: BookingRequest, basePrice: number): number {
    let total = basePrice;
    
    // Add party size multiplier
    if (bookingRequest.partySize > 4) {
      total += (bookingRequest.partySize - 4) * 10; // £10 per additional person
    }
    
    // Add table type premium
    if (bookingRequest.tableType === 'private') {
      total += 50; // £50 premium for private dining
    } else if (bookingRequest.tableType === 'outdoor') {
      total += 20; // £20 premium for outdoor seating
    }
    
    // Add service charge (12.5%)
    total += total * 0.125;
    
    // Add VAT (20%)
    total += total * 0.20;
    
    return Math.round(total * 100) / 100; // Round to 2 decimal places
  }

  // Format currency
  formatCurrency(amount: number, currency: string = 'GBP'): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  // Validate payment method
  validatePaymentMethod(paymentMethod: Partial<PaymentMethod>): boolean {
    if (!paymentMethod.type) return false;
    if (!paymentMethod.billingDetails?.name) return false;
    if (!paymentMethod.billingDetails?.email) return false;
    
    if (paymentMethod.type === 'card' && paymentMethod.card) {
      if (!paymentMethod.card.brand) return false;
      if (!paymentMethod.card.last4) return false;
      if (!paymentMethod.card.expMonth) return false;
      if (!paymentMethod.card.expYear) return false;
    }
    
    return true;
  }
}

export const paymentService = new PaymentService();
