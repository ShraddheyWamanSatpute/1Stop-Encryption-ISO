import { Router, Request, Response, NextFunction } from 'express';
import { createLogger } from '../lib/logger';
import { paymentService } from '../lib/payment-service';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

const router = Router();
const logger = createLogger();

// POST /api/payments/create-intent - Create payment intent
router.post('/create-intent', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { amount, currency = 'usd', metadata } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const paymentIntent = await paymentService.createPaymentIntent({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        userId,
        ...metadata
      }
    });

    logger.info('Payment intent created', { 
      paymentIntentId: paymentIntent.id, 
      userId, 
      amount 
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    return next(error);
  }
});

// POST /api/payments/confirm - Confirm payment
router.post('/confirm', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { paymentIntentId, paymentMethodId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!paymentIntentId || !paymentMethodId) {
      return res.status(400).json({ 
        error: 'Payment Intent ID and Payment Method ID are required' 
      });
    }

    const result = await paymentService.confirmPayment(paymentIntentId, paymentMethodId);

    logger.info('Payment confirmed', { 
      paymentIntentId, 
      userId, 
      status: result.status 
    });

    return res.json(result);
  } catch (error) {
    logger.error('Error confirming payment:', error);
    return next(error);
  }
});

// POST /api/payments/refund - Process refund
router.post('/refund', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { paymentIntentId, amount, reason } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment Intent ID is required' });
    }

    const refund = await paymentService.processRefund({
      paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents
      reason
    });

    logger.info('Refund processed', { 
      refundId: refund.transactionId, 
      userId, 
      amount: refund.amount 
    });

    return res.json({ refund });
  } catch (error) {
    logger.error('Error processing refund:', error);
    return next(error);
  }
});

// GET /api/payments/methods - Get user's payment methods
router.get('/methods', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const paymentMethods = await paymentService.getPaymentMethods(userId);

    logger.info('Payment methods fetched', { userId, count: paymentMethods.length });
    return res.json({ paymentMethods });
  } catch (error) {
    logger.error('Error fetching payment methods:', error);
    return next(error);
  }
});

// POST /api/payments/methods - Add payment method
router.post('/methods', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { paymentMethodId, setAsDefault = false } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment Method ID is required' });
    }

    const paymentMethod = await paymentService.addPaymentMethod(userId, paymentMethodId, setAsDefault);

    logger.info('Payment method added', { 
      paymentMethodId, 
      userId, 
      setAsDefault 
    });

    return res.json({ paymentMethod });
  } catch (error) {
    logger.error('Error adding payment method:', error);
    return next(error);
  }
});

// DELETE /api/payments/methods/:id - Remove payment method
router.delete('/methods/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Payment method ID is required' });
    }

    const success = await paymentService.removePaymentMethod(userId, id);

    if (!success) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    logger.info('Payment method removed', { paymentMethodId: id, userId });
    return res.json({ success: true });
  } catch (error) {
    logger.error('Error removing payment method:', error);
    return next(error);
  }
});

export default router;
