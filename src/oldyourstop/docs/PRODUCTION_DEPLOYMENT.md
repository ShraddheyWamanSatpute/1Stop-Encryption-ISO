# Production Deployment Guide

## 🚀 Deploying BookMyTable to Production

This guide covers deploying your real-time restaurant booking system to production with proper monitoring and security.

### 1. Pre-Deployment Checklist

#### Environment Setup
- [ ] Configure all API keys in production environment
- [ ] Set up production database (if using external DB)
- [ ] Configure Firebase for production
- [ ] Set up Stripe for production payments
- [ ] Configure domain and SSL certificates
- [ ] Set up monitoring and logging

#### Security Checklist
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable API key rotation
- [ ] Configure secure headers
- [ ] Set up backup strategies

### 2. Environment Variables

Create a production `.env.local` file with:

```bash
# Production API Keys
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=prod_google_key
NEXT_PUBLIC_YELP_API_KEY=prod_yelp_key
NEXT_PUBLIC_OPENTABLE_API_KEY=prod_opentable_key
NEXT_PUBLIC_RESY_API_KEY=prod_resy_key
NEXT_PUBLIC_TOAST_API_KEY=prod_toast_key
NEXT_PUBLIC_SQUARE_API_KEY=prod_square_key
NEXT_PUBLIC_TRIPADVISOR_API_KEY=prod_tripadvisor_key
NEXT_PUBLIC_FOURSQUARE_API_KEY=prod_foursquare_key

# Payment Processing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Firebase Production
NEXT_PUBLIC_FIREBASE_API_KEY=prod_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MESSAGING_VAPID_KEY=prod_vapid_key

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://your-domain.com/api

# Security
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
```

### 3. Deployment Options

#### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard
   - Navigate to Project Settings
   - Add all environment variables
   - Redeploy

3. **Configure Domain**
   - Add custom domain in Vercel
   - Configure DNS records
   - Enable SSL

#### Option 2: AWS Amplify

1. **Connect Repository**
   - Connect GitHub repository
   - Configure build settings
   - Set environment variables

2. **Configure Build**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
         - .next/cache/**/*
   ```

#### Option 3: Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS deps
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production

   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY . .
   COPY --from=deps /app/node_modules ./node_modules
   RUN npm run build

   FROM node:18-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV production
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

2. **Deploy with Docker**
   ```bash
   # Build image
   docker build -t bookmytable .
   
   # Run container
   docker run -p 3000:3000 --env-file .env.local bookmytable
   ```

### 4. Database Setup

#### Option 1: Supabase (Recommended)
1. Create Supabase project
2. Configure database schema
3. Set up Row Level Security (RLS)
4. Configure connection string

#### Option 2: PostgreSQL
1. Set up PostgreSQL instance
2. Create database and user
3. Run migrations
4. Configure connection

#### Option 3: Firebase Firestore
1. Enable Firestore
2. Configure security rules
3. Set up indexes
4. Configure connection

### 5. Monitoring and Logging

#### Set up Monitoring
```bash
# Install monitoring tools
npm install @sentry/nextjs @vercel/analytics

# Configure Sentry
# Create sentry.client.config.ts
```

#### Configure Logging
```typescript
// lib/logger.ts
import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.simple()
  }));
}
```

### 6. Performance Optimization

#### Enable Caching
```typescript
// next.config.ts
const nextConfig = {
  // ... existing config
  experimental: {
    serverComponentsExternalPackages: ['@stripe/stripe-js'],
  },
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=300' },
      ],
    },
  ],
};
```

#### Configure CDN
- Set up CloudFlare or AWS CloudFront
- Configure caching rules
- Enable compression
- Set up edge locations

### 7. Security Configuration

#### Enable Security Headers
```typescript
// next.config.ts
const nextConfig = {
  // ... existing config
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

#### Configure Rate Limiting
```typescript
// lib/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});
```

### 8. Testing in Production

#### Health Check Endpoint
```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  });
}
```

#### Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

### 9. Backup and Recovery

#### Database Backups
- Set up automated daily backups
- Test restore procedures
- Store backups in multiple locations
- Monitor backup success

#### Code Backups
- Use Git for version control
- Tag production releases
- Maintain rollback procedures
- Document deployment process

### 10. Post-Deployment

#### Monitor Performance
- Set up alerts for errors
- Monitor API response times
- Track user engagement
- Monitor payment success rates

#### Regular Maintenance
- Update dependencies monthly
- Rotate API keys quarterly
- Review security logs weekly
- Test disaster recovery annually

### 11. Troubleshooting

#### Common Issues
1. **API Rate Limits**: Implement exponential backoff
2. **Payment Failures**: Check Stripe logs
3. **Notification Issues**: Verify Firebase configuration
4. **Performance Issues**: Check caching and CDN

#### Debug Commands
```bash
# Check logs
vercel logs

# Check database
psql $DATABASE_URL

# Check Redis
redis-cli -u $REDIS_URL

# Check Stripe
stripe logs tail
```

### 12. Scaling Considerations

#### Horizontal Scaling
- Use load balancers
- Implement database sharding
- Use CDN for static assets
- Implement caching layers

#### Vertical Scaling
- Monitor resource usage
- Upgrade server instances
- Optimize database queries
- Implement connection pooling

## 🎉 Success!

Your BookMyTable application is now ready for production with:
- ✅ Real-time data integration
- ✅ Payment processing
- ✅ Push notifications
- ✅ Monitoring and logging
- ✅ Security best practices
- ✅ Performance optimization

Monitor your application closely in the first few weeks and be ready to scale based on user demand!
