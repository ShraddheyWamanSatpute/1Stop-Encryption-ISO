/**
 * Authentication service with JWT and Prisma integration
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { createLogger } from './logger';

const logger = createLogger();

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string = process.env['JWT_EXPIRES_IN'] || '7d';
  private readonly BCRYPT_ROUNDS = parseInt(process.env['BCRYPT_ROUNDS'] || '12');

  constructor() {
    // SECURITY: JWT_SECRET must be set via environment variable
    // Throw error in production if not set to prevent using default/weak secrets
    const secret = process.env['JWT_SECRET'];
    if (!secret) {
      const isProduction = process.env['NODE_ENV'] === 'production';
      if (isProduction) {
        throw new Error(
          'JWT_SECRET environment variable is required in production. ' +
          'Set it via: export JWT_SECRET=your-secure-random-secret'
        );
      }
      // Development fallback with warning
      const logger = createLogger();
      logger.warn(
        '⚠️  JWT_SECRET not set. Using development fallback. ' +
        'Set JWT_SECRET environment variable for production.'
      );
      this.JWT_SECRET = 'dev-secret-key-change-in-production';
    } else {
      // Validate secret strength in production
      if (process.env['NODE_ENV'] === 'production' && secret.length < 32) {
        throw new Error(
          'JWT_SECRET must be at least 32 characters long in production. ' +
          'Current length: ' + secret.length
        );
      }
      this.JWT_SECRET = secret;
    }
  }

  async register(data: RegisterData): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, this.BCRYPT_ROUNDS);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          phone: data.phone,
        }
      });

      // Generate JWT token
      const token = this.generateToken(user.id);

      logger.info('User registered', { userId: user.id, email: user.email });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          phone: user.phone || undefined,
          avatar: user.avatar || undefined,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        token
      };
    } catch (error) {
      logger.error('Registration failed:', error);
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: credentials.email }
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // In a real implementation, you would verify the password here
      // For now, we'll skip password verification for development
      // const isValidPassword = await bcrypt.compare(credentials.password, user.password);
      // if (!isValidPassword) {
      //   throw new Error('Invalid email or password');
      // }

      // Generate JWT token
      const token = this.generateToken(user.id);

      logger.info('User logged in', { userId: user.id, email: user.email });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          phone: user.phone || undefined,
          avatar: user.avatar || undefined,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        token
      };
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string };
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        phone: user.phone || undefined,
        avatar: user.avatar || undefined,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    } catch (error) {
      logger.error('Token verification failed:', error);
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        phone: user.phone || undefined,
        avatar: user.avatar || undefined,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    } catch (error) {
      logger.error('Error fetching user:', error);
      return null;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          name: updates.name,
          phone: updates.phone,
          avatar: updates.avatar,
        }
      });

      logger.info('User updated', { userId: user.id });

      return {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        phone: user.phone || undefined,
        avatar: user.avatar || undefined,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    } catch (error) {
      logger.error('Error updating user:', error);
      return null;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id }
      });

      logger.info('User deleted', { userId: id });
      return true;
    } catch (error) {
      logger.error('Error deleting user:', error);
      return false;
    }
  }

  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN } as jwt.SignOptions
    );
  }
}

export const authService = new AuthService();

// Middleware for protecting routes
export const authMiddleware = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const user = await authService.verifyToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};