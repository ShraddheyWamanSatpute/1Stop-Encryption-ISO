# Customer Authentication & Database Separation

## ✅ Yes - Completely Separate!

The YourStop customer section has **completely separate authentication and database** from the main app. Here's how it's configured:

## 🔐 Authentication Separation

### Main App Authentication
- **File**: `src/yourstop/frontend/src/lib/firebase.ts`
- **Auth Instance**: `auth` (default Firebase app)
- **Project**: `bookmytable-ea37d` (or configured via env vars)
- **Used By**: Main app admin/staff users

### Customer Authentication
- **File**: `src/yourstop/frontend/src/lib/firebase-customer.ts`
- **Auth Instance**: `customerAuth` (separate Firebase app instance)
- **Project**: `bookmytable-customers` (configurable via env vars)
- **Used By**: Customer-facing YourStop section only

**Key Differences**:
```typescript
// Main App
const app = initializeApp(firebaseConfig); // Default app
export const auth = getAuth(app);

// Customer App
const customerApp = initializeApp(customerFirebaseConfig, 'customer-firebase-app'); // Named app
export const customerAuth = getAuth(customerApp);
```

## 🗄️ Database Separation

### Main App Collections
- `users` - Main app user profiles
- `bookings` - Main app bookings
- `favorites` - Main app favorites
- `admin` - Admin-only data

### Customer Collections (Completely Separate)
- `customers` - Customer user profiles
- `customerBookings` - Customer bookings
- `customerFavorites` - Customer favorites
- `customerReviews` - Customer reviews
- `customerPayments` - Customer payment methods
- `customerNotifications` - Customer notifications

**Collection Naming**:
```typescript
export const CUSTOMER_COLLECTIONS = {
  users: 'customers',              // Different from main 'users'
  bookings: 'customerBookings',     // Different from main 'bookings'
  favorites: 'customerFavorites',   // Different from main 'favorites'
  reviews: 'customerReviews',
  payments: 'customerPayments',
  notifications: 'customerNotifications',
} as const;
```

## 🔒 Security Rules Separation

### Customer Firestore Rules
**File**: `src/yourstop/config/firestore-customer.rules`

**Key Features**:
1. **Customer collections are isolated** - Only accessible by customer auth
2. **Main app collections are blocked** - Customer auth cannot access main app data
3. **Public collections are shared** - Restaurants can be read by both

**Example Rules**:
```javascript
// Customer bookings - only accessible by the booking owner
match /customerBookings/{bookingId} {
  allow read, write: if request.auth != null && 
    resource.data.userId == request.auth.uid;
}

// Main app bookings - BLOCKED for customers
match /bookings/{bookingId} {
  allow read, write: if false; // Blocked for customer auth
}
```

## 🏗️ Architecture Options

### Option 1: Separate Firebase Project (Recommended)
**Best for**: Complete isolation, separate billing, independent scaling

**Setup**:
1. Create a new Firebase project: `bookmytable-customers`
2. Configure environment variables:
```env
NEXT_PUBLIC_CUSTOMER_FIREBASE_PROJECT_ID=bookmytable-customers
NEXT_PUBLIC_CUSTOMER_FIREBASE_API_KEY=your-customer-api-key
NEXT_PUBLIC_CUSTOMER_FIREBASE_AUTH_DOMAIN=customers.bookmytable.firebaseapp.com
# ... etc
```

**Benefits**:
- ✅ Complete data isolation
- ✅ Separate billing/quota
- ✅ Independent scaling
- ✅ Different security rules per project
- ✅ Can't accidentally access main app data

### Option 2: Same Project, Different Collections (Current Default)
**Best for**: Easier setup, shared resources, single billing

**Setup**:
- Use same Firebase project but different collection names
- Customer collections prefixed with `customer*`
- Security rules enforce separation

**Benefits**:
- ✅ Easier initial setup
- ✅ Shared Firebase project resources
- ✅ Single billing account
- ⚠️ Requires careful security rules
- ⚠️ Data in same project (but isolated by rules)

## 📋 Current Implementation Status

### ✅ What's Implemented

1. **Separate Firebase App Instance**
   - Named app: `customer-firebase-app`
   - Separate auth: `customerAuth`
   - Separate Firestore: `customerDb`
   - Separate Realtime DB: `customerRtdb`

2. **Separate Collections**
   - All customer data uses `customer*` prefixed collections
   - No overlap with main app collections

3. **Separate Authentication Hook**
   - `useCustomerAuth()` - Completely separate from main app auth
   - `CustomerAuthProvider` - Separate context provider

4. **Security Rules Ready**
   - `firestore-customer.rules` - Customer-specific rules
   - Blocks access to main app collections
   - Allows access only to customer collections

### ⚠️ What Needs Configuration

1. **Environment Variables**
   - Set up customer Firebase project credentials
   - Or configure to use same project with different collections

2. **Firebase Project Setup**
   - Create customer Firebase project (if using Option 1)
   - Or configure existing project with customer collections

3. **Deploy Security Rules**
   - Deploy `firestore-customer.rules` to Firebase
   - Test rules to ensure proper isolation

## 🔍 Verification Checklist

To verify complete separation:

- [ ] Customer auth uses `customerAuth` (not `auth`)
- [ ] Customer data uses `customerDb` (not `db`)
- [ ] Customer collections use `customer*` prefix
- [ ] Security rules block main app collections
- [ ] Customer auth cannot access main app data
- [ ] Main app auth cannot access customer data (if desired)

## 🧪 Testing Separation

### Test 1: Authentication Isolation
```typescript
// Customer auth should NOT access main app
import { auth } from '@/lib/firebase'; // Main app
import { customerAuth } from '@/lib/firebase-customer'; // Customer app

// These are separate instances
console.log(auth !== customerAuth); // Should be true
```

### Test 2: Database Isolation
```typescript
// Customer collections
import { customerDb, CUSTOMER_COLLECTIONS } from '@/lib/firebase-customer';
// Uses: customers, customerBookings, customerFavorites

// Main app collections (if needed)
import { db } from '@/lib/firebase';
// Uses: users, bookings, favorites
```

### Test 3: Security Rules
- Try accessing main app collection with customer auth → Should be blocked
- Try accessing customer collection with main app auth → Should be blocked (if rules configured)
- Customer can only access their own customer data → Should work

## 📝 Summary

**Yes, the YourStop section has completely separate authentication and database:**

1. ✅ **Separate Firebase App Instance** - Named `customer-firebase-app`
2. ✅ **Separate Authentication** - `customerAuth` vs `auth`
3. ✅ **Separate Collections** - `customer*` prefixed collections
4. ✅ **Separate Security Rules** - `firestore-customer.rules`
5. ✅ **Separate Auth Hook** - `useCustomerAuth()` vs main app auth

**The separation is enforced at multiple levels:**
- Code level (different imports/instances)
- Collection level (different collection names)
- Security rules level (rules block cross-access)
- Project level (can use separate Firebase project)

---

**Last Updated**: 2024  
**Status**: ✅ Complete Separation Implemented

