# BookMyTable Backend

A comprehensive backend system for restaurant booking and management, built with Next.js API routes, Firebase, and modern TypeScript.

## 🏗️ Architecture

```
backend/
├── ai/                          # AI/ML flows using Genkit
│   ├── flows/                   # Business logic flows
│   │   ├── confirm-booking.ts   # Booking confirmation flow
│   │   ├── process-payment.ts   # Payment processing flow
│   │   ├── suggest-booking-slots.ts # Slot suggestion flow
│   │   └── summarize-reviews.ts # Review summarization flow
│   └── genkit.ts               # Genkit configuration
├── lib/                        # Core services and utilities
│   ├── auth-service.ts         # Authentication service
│   ├── data.ts                 # Data access layer
│   ├── email-service.ts        # Email notification service
│   ├── error-handler.ts        # Error handling and logging
│   ├── firebase-service.ts     # Firebase integration
│   ├── payment-service.ts      # Payment processing
│   └── validation.ts           # Data validation schemas
├── types/                      # TypeScript type definitions
│   ├── booking.ts              # Booking-related types
│   └── restaurant.ts           # Restaurant-related types
├── data/                       # Static data files
│   ├── bookings.json           # Booking data
│   └── restaurants.json        # Restaurant data
└── setup-env.js               # Environment setup script
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project
- (Optional) SendGrid account for emails
- (Optional) Stripe account for payments

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BookMyTable-main/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   node setup-env.js
   ```
   Or manually copy `env.example` to `.env` and fill in your values.

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔧 Environment Configuration

### Required Variables

```bash
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
```

### Optional Variables

```bash
# Email Service (SendGrid or Resend)
SENDGRID_API_KEY=your_sendgrid_api_key
RESEND_API_KEY=your_resend_api_key

# Payment Processing
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# External APIs
GOOGLE_PLACES_API_KEY=your_google_places_api_key
YELP_API_KEY=your_yelp_api_key
FOURSQUARE_API_KEY=your_foursquare_api_key
```

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "uid": "user_id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "user"
  }
}
```

#### POST /api/auth/login
Authenticate a user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Booking Endpoints

#### GET /api/bookings
Get bookings with optional filters.

**Query Parameters:**
- `restaurantId` - Filter by restaurant
- `userId` - Filter by user
- `date` - Filter by date (YYYY-MM-DD)
- `status` - Filter by status
- `limit` - Number of results (default: all)
- `offset` - Pagination offset

#### POST /api/bookings
Create a new booking.

**Request Body:**
```json
{
  "restaurantId": "rest_1",
  "dateTime": "2024-01-20T19:00:00Z",
  "partySize": 4,
  "guestInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+44 7123 456789",
    "specialRequests": "Window table please"
  }
}
```

#### GET /api/bookings/[id]
Get a specific booking by ID.

#### PUT /api/bookings/[id]
Update a booking.

#### DELETE /api/bookings/[id]
Cancel a booking.

### Payment Endpoints

#### POST /api/payments/create-intent
Create a payment intent for a booking.

**Request Body:**
```json
{
  "bookingId": "BK_123456",
  "amount": 50.00,
  "currency": "gbp"
}
```

#### POST /api/payments/confirm
Confirm a payment.

**Request Body:**
```json
{
  "paymentIntentId": "pi_123456",
  "paymentMethodId": "pm_123456"
}
```

### AI/ML Endpoints

#### POST /api/confirm-booking
Confirm a booking using AI flow.

#### POST /api/process-payment
Process payment using AI flow.

#### POST /api/suggest-booking-slots
Get AI-suggested booking slots.

#### POST /api/summarize-reviews
Summarize restaurant reviews using AI.

## 🏗️ Core Services

### FirebaseService
Handles all database operations with Firebase Firestore.

```typescript
import { FirebaseService } from './lib/firebase-service';

// Create a booking
const booking = await FirebaseService.createBooking(bookingData);

// Get bookings by restaurant
const bookings = await FirebaseService.getBookingsByRestaurant('rest_1');

// Update a booking
const updated = await FirebaseService.updateBooking('booking_id', updates);
```

### AuthService
Manages user authentication and authorization.

```typescript
import { AuthService } from './lib/auth-service';

// Register a user
const user = await AuthService.signUp(email, password, displayName);

// Sign in a user
const user = await AuthService.signIn(email, password);

// Get user profile
const profile = await AuthService.getUserProfile(userId);
```

### PaymentService
Handles payment processing with Stripe and PayPal.

```typescript
import { PaymentService } from './lib/payment-service';

// Create payment intent
const intent = await PaymentService.createPaymentIntent(booking, amount);

// Confirm payment
const result = await PaymentService.confirmPayment(intentId);

// Process refund
const refund = await PaymentService.refundPayment(transactionId);
```

### EmailService
Sends transactional emails for bookings.

```typescript
import { EmailService } from './lib/email-service';

// Send booking confirmation
await EmailService.sendBookingConfirmation(booking, restaurant);

// Send booking cancellation
await EmailService.sendBookingCancellation(booking, restaurant);

// Send booking reminder
await EmailService.sendBookingReminder(booking, restaurant);
```

## 🔒 Security Features

- **Input Validation**: All inputs validated using Zod schemas
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Logging**: Structured logging for debugging and monitoring
- **Authentication**: JWT-based authentication with role-based access control
- **Rate Limiting**: Built-in rate limiting support
- **Data Sanitization**: Input sanitization to prevent XSS attacks

## 🧪 Testing

### Running Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

## 📊 Monitoring & Logging

The backend includes comprehensive logging and monitoring:

- **Structured Logging**: JSON-formatted logs with different levels
- **Error Tracking**: Detailed error logging with stack traces
- **Performance Monitoring**: Request timing and performance metrics
- **Audit Trail**: User actions and system events logging

## 🚀 Deployment

### Environment Setup
1. Set up production environment variables
2. Configure Firebase production project
3. Set up payment provider accounts
4. Configure email service

### Deployment Steps
1. Build the application: `npm run build`
2. Deploy to your hosting platform
3. Configure environment variables
4. Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

## 🔄 Changelog

### v1.0.0
- Initial release
- Core booking functionality
- Payment processing
- Email notifications
- AI/ML integration
- Comprehensive error handling
- Security features
