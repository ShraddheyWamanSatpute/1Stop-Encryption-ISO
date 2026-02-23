# YourStop Next.js to Vite Conversion Guide

## Overview
This guide documents the conversion of the YourStop section from Next.js to Vite/React Router.

## Status

### ✅ Completed
1. Updated header and footer components to use React Router (`react-router-dom` instead of `next/link` and `next/navigation`)
2. Created YourStop layout component
3. Created YourStop index page (redirects to explore)
4. Converted Explore page to use React Router
5. Updated App.tsx routing
6. Removed YourStop proxy from vite.config.ts

### 🔄 In Progress
- Converting remaining pages
- Updating all component imports
- Converting API routes

### 📋 Remaining Tasks

#### 1. Convert Remaining Pages
The following pages need to be converted from Next.js to React Router:

**Location**: `src/yourstop/frontend/src/app/` → `src/frontend/pages/yourstop/`

- [ ] `restaurants/page.tsx` → `RestaurantsPage.tsx`
- [ ] `restaurants/[id]/page.tsx` → `RestaurantDetailPage.tsx`
- [ ] `booking/page.tsx` → `BookingPage.tsx`
- [ ] `auth/page.tsx` → `AuthPage.tsx`
- [ ] `profile/page.tsx` → `ProfilePage.tsx`
- [ ] `my-bookings/page.tsx` → `MyBookingsPage.tsx`
- [ ] `favorites/page.tsx` → `FavoritesPage.tsx`
- [ ] `contact/page.tsx` → `ContactPage.tsx`
- [ ] `about/page.tsx` → `AboutPage.tsx`
- [ ] `search/page.tsx` → `SearchPage.tsx`
- [ ] `profile-management/page.tsx` → `ProfileManagementPage.tsx`

#### 2. Update All Component Imports

**Replace Next.js imports with React Router:**
```typescript
// OLD (Next.js)
import Link from 'next/link';
import { useRouter, useSearchParams, useParams } from 'next/navigation';

// NEW (React Router)
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
```

**Update navigation calls:**
```typescript
// OLD
router.push('/path');
router.replace('/path');

// NEW
navigate('/YourStop/path');
navigate('/YourStop/path', { replace: true });
```

**Update Link components:**
```typescript
// OLD
<Link href="/path">Link</Link>

// NEW
<Link to="/YourStop/path">Link</Link>
```

#### 3. Convert API Routes

**Location**: `src/yourstop/frontend/src/app/api/` → Convert to client-side API calls or Firebase Functions

All Next.js API routes need to be converted. Options:

**Option A: Client-side API calls**
- Create API service files in `src/yourstop/frontend/src/lib/api/`
- Replace `fetch('/api/...')` with calls to Firebase Functions or external APIs

**Option B: Firebase Functions**
- Move API route logic to Firebase Functions
- Update client code to call Firebase Functions

**Files to convert:**
- [ ] `api/restaurants/route.ts`
- [ ] `api/restaurants/[id]/route.ts`
- [ ] `api/bookings/route.ts`
- [ ] `api/bookings/[id]/route.ts`
- [ ] `api/payments/create-intent/route.ts`
- [ ] `api/payments/confirm/route.ts`
- [ ] `api/process-payment/route.ts`
- [ ] `api/suggest-booking-slots/route.ts`
- [ ] `api/confirm-booking/route.ts`
- [ ] `api/search/suggestions/route.ts`
- [ ] `api/places/search/route.ts`
- [ ] `api/yelp/search/route.ts`
- [ ] `api/summarize-reviews/route.ts`
- [ ] `api/image-proxy/route.ts`
- [ ] `api/batch/route.ts`
- [ ] `api/test-restaurants/route.ts`

#### 4. Update All Component Imports

**Components using Next.js features:**
- [ ] Update all components in `src/yourstop/frontend/src/components/` that use `next/link` or `next/navigation`
- [ ] Remove `'use client'` directives (not needed in Vite)
- [ ] Update all `@/` path aliases to relative paths or configure Vite aliases

#### 5. Update Hooks

**Hooks using Next.js:**
- [ ] `use-auth.tsx` - Update to use React Router
- [ ] `use-customer-auth.tsx` - Already uses React Router (check)
- [ ] `use-advanced-filters.tsx` - Update if using Next.js features
- [ ] All other hooks in `src/yourstop/frontend/src/hooks/`

#### 6. Update Lib Files

**Lib files that may need updates:**
- [ ] Check all files in `src/yourstop/frontend/src/lib/` for Next.js dependencies
- [ ] Update API calls to use client-side fetch or Firebase Functions

#### 7. Remove Next.js Dependencies

**From `package.json`:**
- [ ] Remove `next` package
- [ ] Remove `@genkit-ai/next` if not needed
- [ ] Remove Next.js specific scripts
- [ ] Keep React Router dependencies (already in main package.json)

#### 8. Update Vite Configuration

**Add path aliases to `vite.config.ts`:**
```typescript
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src/yourstop/frontend/src'),
      '@/components': resolve(__dirname, './src/yourstop/frontend/src/components'),
      '@/lib': resolve(__dirname, './src/yourstop/frontend/src/lib'),
      '@/hooks': resolve(__dirname, './src/yourstop/frontend/src/hooks'),
    },
  },
});
```

#### 9. Update Routing in App.tsx

Add routes for all converted pages:
```typescript
<Route path="YourStop" element={<YourStopLayout><YourStopIndex /></YourStopLayout>} />
<Route path="YourStop/explore" element={<YourStopLayout><ExplorePage /></YourStopLayout>} />
<Route path="YourStop/restaurants" element={<YourStopLayout><RestaurantsPage /></YourStopLayout>} />
<Route path="YourStop/restaurants/:id" element={<YourStopLayout><RestaurantDetailPage /></YourStopLayout>} />
// ... etc
```

#### 10. Add Missing Dependencies

**Check and add to main `package.json`:**
- [ ] `sonner` - for toast notifications
- [ ] Any other YourStop-specific dependencies

## Conversion Pattern

### Page Conversion Template

```typescript
// OLD (Next.js)
'use client';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';

export default function MyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  
  const handleClick = () => {
    router.push('/path');
  };
  
  return (
    <div>
      <Link href="/path">Link</Link>
    </div>
  );
}

// NEW (React Router)
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';

export default function MyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();
  
  const handleClick = () => {
    navigate('/YourStop/path');
  };
  
  return (
    <div>
      <Link to="/YourStop/path">Link</Link>
    </div>
  );
}
```

## Testing Checklist

- [ ] All pages load without errors
- [ ] Navigation works correctly
- [ ] API calls work (converted to client-side or Firebase Functions)
- [ ] Authentication flows work
- [ ] No Next.js errors in console
- [ ] All routes accessible
- [ ] Mobile navigation works
- [ ] Search functionality works
- [ ] Booking functionality works

## Notes

- The YourStop components, hooks, and lib files are kept in `src/yourstop/frontend/src/` for now
- All pages are moved to `src/frontend/pages/yourstop/`
- API routes need to be converted to either client-side calls or Firebase Functions
- The `@/` path alias can be configured in Vite or use relative paths

## Next Steps

1. Continue converting pages one by one
2. Update all component imports
3. Convert API routes
4. Test thoroughly
5. Remove Next.js dependencies
6. Clean up unused files


