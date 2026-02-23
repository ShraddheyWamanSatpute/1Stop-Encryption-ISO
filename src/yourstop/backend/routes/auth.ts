/**
 * Authentication Routes
 * Handles user registration, login, and token verification
 */

import express, { Request, Response } from 'express';
import { authService } from '../lib/auth-service';
import { createLogger } from '../lib/logger';
import { authMiddleware } from '../lib/auth-service';

const router = express.Router();
const logger = createLogger();

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    const result = await authService.register({
      email,
      password,
      name,
      phone
    });

    logger.info('User registered successfully', { email, userId: result.user.id });

    return res.status(201).json({
      success: true,
      user: result.user,
      token: result.token
    });
  } catch (error) {
    logger.error('Registration error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    const statusCode = errorMessage.includes('already exists') ? 409 : 500;

    return res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate a user and return JWT token
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await authService.login({ email, password });

    logger.info('User logged in successfully', { email, userId: result.user.id });

    return res.json({
      success: true,
      user: result.user,
      token: result.token
    });
  } catch (error) {
    logger.error('Login error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    const statusCode = errorMessage.includes('Invalid') ? 401 : 500;

    return res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify a JWT token and return user information
 */
router.get('/verify', authMiddleware, async (req: any, res: Response) => {
  try {
    // User is already verified by authMiddleware and attached to req.user
    return res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    logger.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user information (alias for verify)
 */
router.get('/me', authMiddleware, async (req: any, res: Response) => {
  try {
    return res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    logger.error('Get user error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
});

export default router;
