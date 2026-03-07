/**
 * Stripe Webhook Handler with Signature Verification
 *
 * PCI DSS Req 12, SOC 2 CC9: All incoming webhooks must be verified
 * using the provider's signing secret to prevent spoofed events.
 *
 * IMPORTANT: This route must receive the raw body (not parsed JSON)
 * for Stripe signature verification to work.
 */

import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { createLogger } from '../lib/logger';

const router = Router();
const logger = createLogger();

// Initialize Stripe (only if secret key is available)
const stripeSecretKey = process.env['STRIPE_SECRET_KEY'];
const stripeWebhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })
  : null;

/**
 * POST /api/webhooks/stripe
 *
 * Receives Stripe webhook events with signature verification.
 * The request body must be raw (Buffer) for signature verification.
 */
router.post('/stripe', async (req: Request, res: Response) => {
  if (!stripe) {
    logger.warn('Stripe webhook received but Stripe is not configured');
    return res.status(503).json({ error: 'Payment service not configured' });
  }

  if (!stripeWebhookSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET not configured — rejecting webhook');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    logger.warn('Stripe webhook received without signature header');
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;

  try {
    // Verify the webhook signature using Stripe's library.
    // req.body must be the raw Buffer for this to work.
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      stripeWebhookSecret
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Stripe webhook signature verification failed', { error: message });
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  // Log the verified event (no sensitive card data is included by Stripe)
  logger.info('Stripe webhook received', {
    eventId: event.id,
    type: event.type,
    livemode: event.livemode,
  });

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logger.info('Payment succeeded', {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        });
        break;
      }

      case 'payment_intent.payment_failed': {
        const failedIntent = event.data.object as Stripe.PaymentIntent;
        logger.warn('Payment failed', {
          paymentIntentId: failedIntent.id,
          error: failedIntent.last_payment_error?.message,
        });
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        logger.info('Charge refunded', {
          chargeId: charge.id,
          amountRefunded: charge.amount_refunded,
        });
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        logger.warn('Dispute created', {
          disputeId: dispute.id,
          amount: dispute.amount,
          reason: dispute.reason,
        });
        break;
      }

      default:
        logger.info('Unhandled Stripe event type', { type: event.type });
    }

    // Acknowledge receipt of the event
    return res.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Error processing Stripe webhook event', {
      eventId: event.id,
      type: event.type,
      error: message,
    });
    // Return 200 to prevent Stripe from retrying — log the error for investigation
    return res.json({ received: true, error: 'Processing error logged' });
  }
});

export default router;
