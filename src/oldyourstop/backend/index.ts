import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createLogger } from './lib/logger';

// Import route modules
import restaurantsRouter from './routes/restaurants';
import bookingsRouter from './routes/bookings';
import paymentsRouter from './routes/payments';
import aiRouter from './routes/ai';

// Load environment variables
dotenv.config();

const app = express();
const logger = createLogger();
const PORT = process.env['PORT'] || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env['FRONTEND_URL'] || 'http://localhost:9002',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env['npm_package_version'] || '1.0.0'
  });
});

// Register API routes
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/ai', aiRouter);

// Mock restaurant data
const mockRestaurants = [
  {
    id: '1',
    name: 'The Golden Spoon',
    description: 'Fine dining with a modern twist',
    address: '123 Main Street',
    city: 'London',
    country: 'UK',
    cuisine: ['Italian', 'Mediterranean'],
    priceRange: '$$$',
    rating: 4.5,
    reviewCount: 150,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Sakura Sushi',
    description: 'Authentic Japanese cuisine',
    address: '456 Oak Avenue',
    city: 'London',
    country: 'UK',
    cuisine: ['Japanese', 'Sushi'],
    priceRange: '$$',
    rating: 4.3,
    reviewCount: 89,
    imageUrl: 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=500',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// API routes
app.get('/api/restaurants', (req, res) => {
  try {
    const { query, location, cuisine, priceRange, rating } = req.query;
    
    let filteredRestaurants = [...mockRestaurants];

    // Apply filters
    if (query) {
      const searchQuery = (query as string).toLowerCase();
      filteredRestaurants = filteredRestaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchQuery) ||
        restaurant.description.toLowerCase().includes(searchQuery) ||
        restaurant.cuisine.some(c => c.toLowerCase().includes(searchQuery))
      );
    }

    if (location) {
      const locationQuery = (location as string).toLowerCase();
      filteredRestaurants = filteredRestaurants.filter(restaurant =>
        restaurant.city.toLowerCase().includes(locationQuery) ||
        restaurant.address.toLowerCase().includes(locationQuery)
      );
    }

    if (cuisine) {
      const cuisineFilters = (cuisine as string).split(',');
      filteredRestaurants = filteredRestaurants.filter(restaurant =>
        cuisineFilters.some(filter => 
          restaurant.cuisine.some(c => c.toLowerCase().includes(filter.toLowerCase()))
        )
      );
    }

    if (priceRange) {
      const priceFilters = (priceRange as string).split(',');
      filteredRestaurants = filteredRestaurants.filter(restaurant =>
        priceFilters.includes(restaurant.priceRange)
      );
    }

    if (rating) {
      const minRating = parseFloat(rating as string);
      filteredRestaurants = filteredRestaurants.filter(restaurant =>
        restaurant.rating >= minRating
      );
    }

    return res.json({
      restaurants: filteredRestaurants,
      total: filteredRestaurants.length,
      page: 1,
      limit: 20,
      totalPages: 1
    });
  } catch (error) {
    logger.error('Error fetching restaurants:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/restaurants/:id', (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = mockRestaurants.find(r => r.id === id);

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    return res.json(restaurant);
  } catch (error) {
    logger.error('Error fetching restaurant:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock booking endpoints
app.post('/api/bookings', (req, res) => {
  try {
    const { restaurantId, date, time, partySize, specialRequests } = req.body;

    if (!restaurantId || !date || !time || !partySize) {
      return res.status(400).json({ 
        error: 'Missing required fields: restaurantId, date, time, partySize' 
      });
    }

    const booking = {
      id: `booking_${Date.now()}`,
      restaurantId,
      date,
      time,
      partySize,
      specialRequests,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    logger.info('Booking created', { bookingId: booking.id, restaurantId });
    return res.status(201).json({ booking });
  } catch (error) {
    logger.error('Error creating booking:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock payment endpoints
app.post('/api/payments/create-intent', (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const paymentIntent = {
      id: `pi_${Date.now()}`,
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      status: 'requires_payment_method',
      client_secret: `mock_secret_${Date.now()}`,
      metadata: {}
    };

    logger.info('Payment intent created', { paymentIntentId: paymentIntent.id, amount });
    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/payments/confirm', (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;

    if (!paymentIntentId || !paymentMethodId) {
      return res.status(400).json({ 
        error: 'Payment Intent ID and Payment Method ID are required' 
      });
    }

    // Mock successful payment
    const result = {
      success: true,
      transactionId: paymentIntentId,
      amount: 5000,
      currency: 'usd',
      status: 'succeeded'
    };

    logger.info('Payment confirmed', { paymentIntentId, status: result.status });
    return res.json(result);
  } catch (error) {
    logger.error('Error confirming payment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Backend server running on port ${PORT}`);
  logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
  logger.info(`🔗 API base URL: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;