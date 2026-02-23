# YourStop Next.js to Vite Conversion - Progress Report

## ✅ Completed

### 1. Core Infrastructure
- ✅ Created API client (`api-client.ts`) to replace Next.js API routes
- ✅ Updated header and footer to use React Router
- ✅ Created YourStop layout component
- ✅ Created YourStop index page

### 2. Pages Converted
- ✅ ExplorePage - Converted to React Router
- ✅ RestaurantsPage - Converted to React Router  
- ✅ RestaurantDetailPage - Converted to React Router (uses apiFetch)

### 3. API Routes Conversion
- ✅ Created `api-client.ts` with `apiFetch()` function
- ✅ Updated `use-advanced-filters.tsx` to use apiFetch
- ✅ Updated `use-restaurant-data.tsx` to use apiFetch
- ✅ Updated `home-page-client.tsx` to use apiFetch

### 4. Routing
- ✅ Updated App.tsx with new routes for restaurants and explore
- ✅ Removed YourStop proxy from vite.config.ts

## 🔄 In Progress

### Pages Remaining
- [ ] BookingPage
- [ ] AuthPage
- [ ] ProfilePage
- [ ] MyBookingsPage
- [ ] FavoritesPage
- [ ] ContactPage
- [ ] AboutPage
- [ ] SearchPage
- [ ] ProfileManagementPage

### Components to Update
- [ ] All components using `next/link` → `react-router-dom` Link
- [ ] All components using `next/navigation` → `react-router-dom` hooks
- [ ] Remove `'use client'` directives

### Hooks to Update
- [ ] Check all hooks for Next.js dependencies
- [ ] Update any remaining fetch('/api/...') calls

## 📋 Next Steps

1. **Convert Remaining Pages** - Follow the same pattern:
   - Replace `useRouter`, `useSearchParams`, `useParams` from `next/navigation` with React Router equivalents
   - Replace `Link` from `next/link` with React Router `Link`
   - Update navigation calls (`router.push` → `navigate`)
   - Update API calls to use `apiFetch` instead of `fetch('/api/...')`

2. **Update All Components** - Search for:
   - `import Link from 'next/link'` → `import { Link } from 'react-router-dom'`
   - `import { useRouter } from 'next/navigation'` → `import { useNavigate } from 'react-router-dom'`
   - `'use client'` → Remove (not needed in Vite)

3. **Update Remaining API Calls** - Search for:
   - `fetch('/api/...')` → Use `apiFetch` from `@/lib/api-client`

4. **Add Routes to App.tsx** - Add routes for all converted pages

5. **Remove Next.js Dependencies** - From `src/yourstop/frontend/package.json`:
   - Remove `next` package
   - Remove Next.js specific scripts
   - Keep React Router dependencies

## 📝 Notes

- The API client (`api-client.ts`) provides a drop-in replacement for Next.js API routes
- All restaurant API calls now go through the client-side service layer
- Components, hooks, and lib files remain in `src/yourstop/frontend/src/` for now
- Pages are in `src/frontend/pages/yourstop/`

## 🎯 Conversion Pattern

```typescript
// OLD (Next.js)
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
const router = useRouter();
router.push('/path');
<Link href="/path">Link</Link>

// NEW (React Router)
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
const navigate = useNavigate();
navigate('/YourStop/path');
<Link to="/YourStop/path">Link</Link>
```


