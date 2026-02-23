import { Router, Request, Response, NextFunction } from 'express';
import { createLogger } from '../lib/logger';
import { bookingService } from '../lib/booking-service';

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

// GET /api/bookings - Get user's bookings
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id; // Assuming auth middleware sets req.user
    const { page = '1', limit = '10', status } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const bookings = await bookingService.getUserBookings(userId, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as string
    });

    logger.info('User bookings fetched', { userId, count: bookings.length });
    return res.json({ bookings });
  } catch (error) {
    logger.error('Error fetching user bookings:', error);
    return next(error);
  }
});

// GET /api/bookings/:id - Get specific booking
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const booking = await bookingService.getBookingById(id!, userId);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    logger.info('Booking fetched', { id, userId });
    return res.json({ booking });
  } catch (error) {
    logger.error('Error fetching booking:', error);
    return next(error);
  }
});

// POST /api/bookings - Create new booking
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const {
      restaurantId,
      date,
      time,
      partySize,
      specialRequests,
      contactInfo
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!restaurantId || !date || !time || !partySize) {
      return res.status(400).json({ 
        error: 'Missing required fields: restaurantId, date, time, partySize' 
      });
    }

    const booking = await bookingService.createBooking({
      userId,
      restaurantId,
      date,
      time,
      partySize,
      specialRequests,
      contactInfo
    });

    logger.info('Booking created successfully', { 
      bookingId: booking.id, 
      userId, 
      restaurantId 
    });

    return res.status(201).json({ booking });
  } catch (error) {
    logger.error('Error creating booking:', error);
    return next(error);
  }
});

// PUT /api/bookings/:id - Update booking
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const booking = await bookingService.updateBooking(id!, userId, updateData);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    logger.info('Booking updated', { id, userId });
    return res.json({ booking });
  } catch (error) {
    logger.error('Error updating booking:', error);
    return next(error);
  }
});

// DELETE /api/bookings/:id - Cancel booking
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const success = await bookingService.cancelBooking(id!, userId);

    if (!success) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    logger.info('Booking cancelled', { id, userId });
    return res.json({ success: true });
  } catch (error) {
    logger.error('Error cancelling booking:', error);
    return next(error);
  }
});

export default router;
