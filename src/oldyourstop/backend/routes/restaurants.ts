import { Router } from 'express';
import { restaurantDataService } from '../lib/restaurant-data-service';
import { createLogger } from '../lib/logger';

const router = Router();
const logger = createLogger();

// GET /api/restaurants - Get all restaurants with optional filtering
router.get('/', async (req, res, next) => {
  try {
    const {
      query,
      location,
      cuisine,
      priceRange,
      rating,
      features,
      page = '1',
      limit = '20'
    } = req.query;

    const filters = {
      query: query as string || '',
      location: location as string || '',
      cuisine: cuisine ? (cuisine as string).split(',') : [],
      priceRange: priceRange ? (priceRange as string).split(',') : [],
      rating: rating ? parseFloat(rating as string) : undefined,
      features: features ? (features as string).split(',') : [],
    };

    const restaurantFilters = {
      query: filters.query,
      location: filters.location,
      cuisine: filters.cuisine,
      priceRange: filters.priceRange,
      features: filters.features,
      ...(filters.rating !== undefined && { rating: filters.rating })
    };
    
    const result = await restaurantDataService.getRestaurants(restaurantFilters);
    
    logger.info('Restaurants fetched successfully', {
      count: result.restaurants.length,
      filters
    });

    return res.json(result);
  } catch (error) {
    logger.error('Error fetching restaurants:', error);
    return next(error);
  }
});

// GET /api/restaurants/:id - Get specific restaurant
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    const result = await restaurantDataService.getRestaurants();
    const restaurant = result.restaurants.find(r => r.id === id);

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    logger.info('Restaurant fetched successfully', { id });
    return res.json(restaurant);
  } catch (error) {
    logger.error('Error fetching restaurant:', error);
    return next(error);
  }
});

// GET /api/restaurants/:id/availability - Get restaurant availability
router.get('/:id/availability', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, partySize } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    // Mock availability data - replace with real implementation
    const availability = {
      restaurantId: id,
      date: date || new Date().toISOString().split('T')[0],
      partySize: partySize ? parseInt(partySize as string) : 2,
      slots: [
        { time: '18:00', available: true, price: 0 },
        { time: '18:30', available: true, price: 0 },
        { time: '19:00', available: false, price: 0 },
        { time: '19:30', available: true, price: 0 },
        { time: '20:00', available: true, price: 0 },
        { time: '20:30', available: false, price: 0 },
        { time: '21:00', available: true, price: 0 },
        { time: '21:30', available: true, price: 0 }
      ]
    };

    logger.info('Restaurant availability fetched', { id, date, partySize });
    return res.json(availability);
  } catch (error) {
    logger.error('Error fetching restaurant availability:', error);
    return next(error);
  }
});

// GET /api/restaurants/:id/menu - Get restaurant menu
router.get('/:id/menu', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    // Mock menu data - replace with real implementation
    const menu = {
      restaurantId: id,
      categories: [
        {
          name: 'Appetizers',
          items: [
            { id: '1', name: 'Caesar Salad', price: 12.99, description: 'Fresh romaine lettuce with caesar dressing' },
            { id: '2', name: 'Bruschetta', price: 9.99, description: 'Toasted bread with tomatoes and basil' }
          ]
        },
        {
          name: 'Main Courses',
          items: [
            { id: '3', name: 'Grilled Salmon', price: 24.99, description: 'Fresh Atlantic salmon with herbs' },
            { id: '4', name: 'Beef Tenderloin', price: 32.99, description: 'Premium cut with red wine reduction' }
          ]
        }
      ]
    };

    logger.info('Restaurant menu fetched', { id });
    return res.json(menu);
  } catch (error) {
    logger.error('Error fetching restaurant menu:', error);
    return next(error);
  }
});

// GET /api/restaurants/:id/reviews - Get restaurant reviews
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '10' } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    // Mock reviews data - replace with real implementation
    const reviews = {
      restaurantId: id,
      reviews: [
        {
          id: '1',
          author: 'John Doe',
          rating: 5,
          comment: 'Excellent food and service!',
          date: '2024-01-15'
        },
        {
          id: '2',
          author: 'Jane Smith',
          rating: 4,
          comment: 'Great atmosphere, food was good.',
          date: '2024-01-10'
        }
      ],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: 2
      }
    };

    logger.info('Restaurant reviews fetched', { id, page, limit });
    return res.json(reviews);
  } catch (error) {
    logger.error('Error fetching restaurant reviews:', error);
    return next(error);
  }
});

export default router;
