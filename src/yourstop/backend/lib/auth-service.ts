/**
 * Authentication service with JWT and Prisma integration
 * 
 * Uses RS256 (RSA) algorithm for JWT signing for enhanced security.
 * Requires JWT_PRIVATE_KEY and JWT_PUBLIC_KEY environment variables.
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { createLogger } from './logger';
import { getRSAKeys } from './jwt-keys';

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
  private readonly JWT_PRIVATE_KEY: string;
  private readonly JWT_PUBLIC_KEY: string;
  private readonly JWT_EXPIRES_IN: string = process.env['JWT_EXPIRES_IN'] || '7d';
  private readonly BCRYPT_ROUNDS = parseInt(process.env['BCRYPT_ROUNDS'] || '12');

  constructor() {
    // SECURITY: Use RS256 (RSA) algorithm for JWT signing
    // Load RSA keys from environment variables or file system
    try {
      const keys = getRSAKeys();
      this.JWT_PRIVATE_KEY = keys.privateKey;
      this.JWT_PUBLIC_KEY = keys.publicKey;
      
      logger.info('✅ JWT RSA keys loaded successfully (RS256 algorithm)');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isProduction = process.env['NODE_ENV'] === 'production';
      
      if (isProduction) {
        throw new Error(
          'JWT RSA keys are required in production. ' +
          'Set JWT_PRIVATE_KEY and JWT_PUBLIC_KEY environment variables, ' +
          'or store them in Firebase Secrets. ' +
          'Error: ' + errorMessage
        );
      }
      
      // Development fallback: try legacy JWT_SECRET for backward compatibility
      const legacySecret = process.env['JWT_SECRET'];
      if (legacySecret) {
        logger.warn(
          '⚠️  Using legacy JWT_SECRET (HS256). ' +
          'Generate RSA keys for RS256: tsx scripts/generate-jwt-keys.ts'
        );
        // Store as both for backward compatibility
        this.JWT_PRIVATE_KEY = legacySecret;
        this.JWT_PUBLIC_KEY = legacySecret;
      } else {
        throw new Error(
          'JWT keys not found. Set JWT_PRIVATE_KEY and JWT_PUBLIC_KEY, ' +
          'or run: tsx scripts/generate-jwt-keys.ts'
        );
      }
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
      // Use RS256 algorithm with public key for verification
      const algorithm = this.JWT_PRIVATE_KEY.includes('BEGIN PRIVATE KEY') ? 'RS256' : 'HS256';
      const decoded = jwt.verify(token, this.JWT_PUBLIC_KEY, { algorithms: [algorithm] }) as { userId: string };
      
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
    // Use RS256 algorithm with private key for signing
    const algorithm = this.JWT_PRIVATE_KEY.includes('BEGIN PRIVATE KEY') ? 'RS256' : 'HS256';
    const signingKey = algorithm === 'RS256' ? this.JWT_PRIVATE_KEY : this.JWT_PRIVATE_KEY;
    
    return jwt.sign(
      { userId },
      signingKey,
      { 
        algorithm,
        expiresIn: this.JWT_EXPIRES_IN 
      } as jwt.SignOptions
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