/**
 * Payment processing service with real Stripe integration
 */

import Stripe from 'stripe';
import { createLogger } from './logger';

const logger = createLogger();

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  client_secret: string;
  metadata?: Record<string, string>;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  } | undefined;
  is_default: boolean;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  error?: string | undefined;
}

export interface CreatePaymentIntentData {
  amount: number;
  currency: string;
  metadata?: Record<string, string> | undefined;
}

export interface RefundData {
  paymentIntentId: string;
  amount?: number | undefined;
  reason?: string | undefined;
}

class PaymentService {
  private stripe: Stripe | null = null;

  constructor() {
    if (process.env['STRIPE_SECRET_KEY']) {
      this.stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
        apiVersion: '2023-10-16',
      });
      logger.info('Stripe payment service initialized');
    } else {
      logger.warn('Stripe secret key not found, payment service will use mock mode');
    }
  }

  async createPaymentIntent(data: CreatePaymentIntentData): Promise<PaymentIntent> {
    if (!this.stripe) {
      return this.createMockPaymentIntent(data);
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency,
        metadata: data.metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info('Payment intent created', { 
        paymentIntentId: paymentIntent.id, 
        amount: data.amount 
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status as any,
        client_secret: paymentIntent.client_secret!,
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentResult> {
    if (!this.stripe) {
      return this.simulatePaymentConfirmation(paymentIntentId);
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          transactionId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
        };
      }

      if (paymentIntent.status === 'requires_confirmation' && paymentMethodId) {
        const confirmedIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
          payment_method: paymentMethodId,
        });

        return {
          success: confirmedIntent.status === 'succeeded',
          transactionId: confirmedIntent.id,
          amount: confirmedIntent.amount,
          currency: confirmedIntent.currency,
          status: confirmedIntent.status,
          error: confirmedIntent.status !== 'succeeded' ? 'Payment confirmation failed' : undefined,
        };
      }

      return {
        success: false,
        error: `Payment requires ${paymentIntent.status}`,
      };
    } catch (error) {
      logger.error('Error confirming payment:', error);
      return {
        success: false,
        error: 'Payment confirmation failed',
      };
    }
  }

  async processRefund(data: RefundData): Promise<PaymentResult> {
    if (!this.stripe) {
      return this.simulateRefund(data.paymentIntentId, data.amount);
    }

    try {
      const refundParams: any = {
        payment_intent: data.paymentIntentId,
      };
      
      if (data.amount) {
        refundParams.amount = data.amount;
      }
      
      if (data.reason) {
        refundParams.reason = data.reason;
      }

      const refund = await this.stripe.refunds.create(refundParams);

      logger.info('Refund processed', { 
        refundId: refund.id, 
        amount: refund.amount 
      });

      return {
        success: true,
        transactionId: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status || 'succeeded',
      };
    } catch (error) {
      logger.error('Error processing refund:', error);
      return {
        success: false,
        error: 'Refund failed',
      };
    }
  }

  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    if (!this.stripe) {
      return this.getMockPaymentMethods();
    }

    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type as any,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year,
        } : undefined,
        is_default: false, // This would need to be tracked separately
      }));
    } catch (error) {
      logger.error('Error fetching payment methods:', error);
      return [];
    }
  }

  async addPaymentMethod(customerId: string, paymentMethodId: string, setAsDefault: boolean = false): Promise<PaymentMethod> {
    if (!this.stripe) {
      return this.createMockPaymentMethod();
    }

    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      if (setAsDefault) {
        await this.stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      logger.info('Payment method added', { 
        paymentMethodId, 
        customerId, 
        setAsDefault 
      });

      return {
        id: paymentMethod.id,
        type: paymentMethod.type as any,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
        } : undefined,
        is_default: setAsDefault,
      };
    } catch (error) {
      logger.error('Error adding payment method:', error);
      throw new Error('Failed to add payment method');
    }
  }

  async removePaymentMethod(customerId: string, paymentMethodId: string): Promise<boolean> {
    if (!this.stripe) {
      return true; // Mock success
    }

    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
      
      logger.info('Payment method removed', { 
        paymentMethodId, 
        customerId 
      });

      return true;
    } catch (error) {
      logger.error('Error removing payment method:', error);
      return false;
    }
  }

  // Mock implementations for development/testing
  private createMockPaymentIntent(data: CreatePaymentIntentData): PaymentIntent {
    const id = `mock_pi_${Date.now()}`;
    return {
      id,
      amount: data.amount,
      currency: data.currency,
      status: 'requires_payment_method',
      client_secret: `mock_secret_${id}`,
      metadata: data.metadata || {},
    };
  }

  private simulatePaymentConfirmation(paymentIntentId: string): PaymentResult {
    const isSuccess = Math.random() > 0.05; // 95% success rate for mock
    
    if (isSuccess) {
      return {
        success: true,
        transactionId: paymentIntentId,
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
      };
    } else {
      return {
        success: false,
        error: 'Mock payment failed',
      };
    }
  }

  private simulateRefund(paymentIntentId: string, amount?: number): PaymentResult {
    return {
      success: true,
      transactionId: `mock_refund_${Date.now()}`,
      amount: amount || 5000,
      currency: 'usd',
      status: 'succeeded',
    };
  }

  private getMockPaymentMethods(): PaymentMethod[] {
    return [
      {
        id: 'mock_card_1',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
        },
        is_default: true,
      },
      {
        id: 'mock_card_2',
        type: 'card',
        card: {
          brand: 'mastercard',
          last4: '5555',
          exp_month: 6,
          exp_year: 2026,
        },
        is_default: false,
      },
    ];
  }

  private createMockPaymentMethod(): PaymentMethod {
    return {
      id: `mock_card_${Date.now()}`,
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2025,
      },
      is_default: false,
    };
  }
}

export const paymentService = new PaymentService();