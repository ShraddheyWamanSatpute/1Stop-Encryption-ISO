# YourStop UI Restoration - Complete Task List

## Overview
Restore all original YourStop Next.js UI, theme, and animations to the Vite-converted version. The YourStop section must be completely separate from the main app (no sidebar, top bar, etc.).

---

## ✅ CRITICAL REQUIREMENTS

1. **Separate Layout**: YourStop must have its own layout with NO main app sidebar/topbar
2. **Original Theme**: Use exact same CSS variables, colors, fonts, and styling from `globals.css`
3. **Original Animations**: Preserve all transitions, hover effects, and animations
4. **Original Components**: Use original header, footer, and component styling
5. **Font Loading**: Load Inter and Playfair Display fonts exactly as in original

---

## 📋 TASK LIST

### 1. **CSS & Theme Setup** ⚠️ CRITICAL

#### 1.1 Import YourStop globals.css
- [ ] Copy `src/yourstop/frontend/src/app/globals.css` to main app
- [ ] Import it in `YourStopLayout.tsx` or create separate CSS entry point
- [ ] Ensure all CSS variables are available:
  - `--background`, `--foreground`, `--card`, etc.
  - `--brand-primary`, `--brand-secondary`, `--brand-accent`
  - `--gradient-primary`, `--gradient-accent`, `--gradient-neutral`
  - All typography classes: `.font-display`, `.font-heading`, `.font-body`, etc.
  - All utility classes: `.card-modern`, `.card-elevated`, `.card-glass`, `.btn-primary`, etc.

#### 1.2 Font Loading
- [ ] Add Google Fonts links to `YourStopLayout.tsx`:
  - Inter (weights: 300, 400, 500, 600)
  - Playfair Display (weights: 400, 500, 600, 700)
  - Space Grotesk (weights: 300, 400, 500, 600, 700)
- [ ] Ensure fonts are loaded before rendering

#### 1.3 Tailwind Configuration
- [ ] Verify Tailwind config includes YourStop color variables
- [ ] Ensure `container-modern` and `section-padding` classes work
- [ ] Verify responsive breakpoints match original

---

### 2. **Layout Structure** ⚠️ CRITICAL

#### 2.1 Update YourStopLayout.tsx
- [ ] Remove any main app layout dependencies
- [ ] Ensure it wraps ONLY YourStop routes (not main app)
- [ ] Add proper HTML structure:
  ```tsx
  <html lang="en" className="scroll-smooth">
    <head>
      {/* Font links */}
      {/* Meta tags */}
    </head>
    <body className="font-body antialiased bg-background text-foreground min-h-screen">
      <CustomerAuthProvider>
        <PWAInstallBanner />
        <Header />
        <main className="min-h-[calc(100vh-8rem)]">{children}</main>
        <Footer />
        <Toaster />
      </CustomerAuthProvider>
    </body>
  </html>
  ```

#### 2.2 Route Isolation
- [ ] Ensure YourStop routes in `App.tsx` are wrapped in separate route group
- [ ] Verify main app layout (MainLayout) is NOT applied to YourStop routes
- [ ] Check that `/YourStop/*` routes bypass main app sidebar/topbar

#### 2.3 PWA Components
- [ ] Add `PWAInstallBanner` component to layout
- [ ] Add `SEOOptimizer` component for meta tags

---

### 3. **Header Component** ⚠️ CRITICAL

#### 3.1 Restore Original Header Styling
- [ ] Use exact classes from original: `sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border/50`
- [ ] Restore logo styling with `bg-brand-primary` and hover animations
- [ ] Restore navigation links with underline animation
- [ ] Restore user dropdown with proper styling
- [ ] Restore mobile menu with animations

#### 3.2 Header Features
- [ ] Logo with Utensils icon and "BookMyTable" text
- [ ] Navigation: Explore, Booking, Contact, About
- [ ] User menu dropdown (if logged in)
- [ ] Sign in button (if not logged in)
- [ ] Mobile hamburger menu
- [ ] All hover effects and transitions

---

### 4. **Footer Component** ⚠️ CRITICAL

#### 4.1 Restore Original Footer Styling
- [ ] Use exact classes: `bg-muted/30 border-t border-border/50`
- [ ] Restore grid layout: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- [ ] Restore brand section with logo
- [ ] Restore contact info section
- [ ] Restore link sections (Company, Support, Features)
- [ ] Restore social media links
- [ ] Restore bottom copyright section

---

### 5. **Page Components - Restore Original UI**

#### 5.1 ExplorePage
- [ ] Restore hero section with exact styling
- [ ] Restore search bar with `bg-white rounded-lg shadow-sm border border-gray-200`
- [ ] Restore filter buttons and UI
- [ ] Restore restaurant grid with proper card styling
- [ ] Restore loading skeletons
- [ ] Restore "Load More" button styling
- [ ] Restore scroll-to-top button
- [ ] Restore all animations and transitions

#### 5.2 RestaurantsPage
- [ ] Restore header section: `bg-white border-b border-gray-200`
- [ ] Restore search and filter bar
- [ ] Restore restaurant cards with hover effects
- [ ] Restore grid/list view toggle
- [ ] Restore sorting options
- [ ] Restore pagination

#### 5.3 RestaurantDetailPage
- [ ] Restore hero image section
- [ ] Restore restaurant info cards
- [ ] Restore booking section styling
- [ ] Restore reviews section
- [ ] Restore map section
- [ ] Restore tabs (Overview, Menu, Reviews, Map)
- [ ] Restore all animations

#### 5.4 BookingPage
- [ ] Restore tab navigation styling
- [ ] Restore restaurant browse section
- [ ] Restore booking form styling
- [ ] Restore booking management section
- [ ] Restore all card styling

#### 5.5 AuthPage
- [ ] Restore tab system (Login/Signup/Reset)
- [ ] Restore form styling
- [ ] Restore OAuth buttons styling
- [ ] Restore error/success message styling
- [ ] Restore validation styling

#### 5.6 ProfilePage
- [ ] Restore profile tabs
- [ ] Restore form sections
- [ ] Restore card layouts
- [ ] Restore save/cancel button styling

#### 5.7 MyBookingsPage
- [ ] Restore booking cards
- [ ] Restore filter tabs (Upcoming/Past)
- [ ] Restore booking status badges
- [ ] Restore action buttons (Cancel/Modify)
- [ ] Restore empty state

#### 5.8 FavoritesPage
- [ ] Restore favorites grid
- [ ] Restore restaurant cards
- [ ] Restore empty state
- [ ] Restore remove favorite animations

#### 5.9 ContactPage
- [ ] Restore contact form
- [ ] Restore contact info cards
- [ ] Restore map section
- [ ] Restore FAQ section

#### 5.10 AboutPage
- [ ] Restore hero section
- [ ] Restore team section
- [ ] Restore timeline section
- [ ] Restore stats section with animations

#### 5.11 SearchPage
- [ ] Restore search filters
- [ ] Restore results grid
- [ ] Restore sort options

#### 5.12 ProfileManagementPage
- [ ] Restore navigation header
- [ ] Restore profile sections
- [ ] Restore link cards

---

### 6. **Component Styling** ⚠️ CRITICAL

#### 6.1 Restaurant Cards
- [ ] Restore `SimpleRestaurantCard` with original styling
- [ ] Restore `EnhancedRestaurantCard` with original styling
- [ ] Restore hover effects: `hover:shadow-lg transition-shadow`
- [ ] Restore image styling and error handling
- [ ] Restore badge styling
- [ ] Restore rating display

#### 6.2 Booking Components
- [ ] Restore `BookingModal` styling
- [ ] Restore `BookingSection` styling
- [ ] Restore `BookingManagement` styling
- [ ] Restore form inputs and selects
- [ ] Restore date/time pickers
- [ ] Restore confirmation animations

#### 6.3 UI Components
- [ ] Verify all Shadcn UI components use YourStop theme
- [ ] Restore button variants (primary, secondary, outline, ghost)
- [ ] Restore input styling
- [ ] Restore card styling
- [ ] Restore badge styling
- [ ] Restore dialog/modal styling
- [ ] Restore dropdown menu styling
- [ ] Restore toast notifications styling

---

### 7. **Animations & Transitions** ⚠️ CRITICAL

#### 7.1 Page Transitions
- [ ] Restore smooth page transitions
- [ ] Restore loading states with animations
- [ ] Restore skeleton loaders

#### 7.2 Hover Effects
- [ ] Restore button hover effects
- [ ] Restore card hover effects
- [ ] Restore link hover effects with underline animation
- [ ] Restore icon hover effects

#### 7.3 Scroll Animations
- [ ] Restore scroll-to-top button animation
- [ ] Restore infinite scroll loading animation
- [ ] Restore fade-in animations for cards

#### 7.4 Form Animations
- [ ] Restore input focus animations
- [ ] Restore validation error animations
- [ ] Restore success message animations

---

### 8. **Responsive Design** ⚠️ CRITICAL

#### 8.1 Mobile Layout
- [ ] Restore mobile header (hamburger menu)
- [ ] Restore mobile navigation
- [ ] Restore mobile search bar
- [ ] Restore mobile filters
- [ ] Restore mobile cards (single column)
- [ ] Restore mobile footer

#### 8.2 Tablet Layout
- [ ] Restore tablet grid (2 columns)
- [ ] Restore tablet navigation
- [ ] Restore tablet filters sidebar

#### 8.3 Desktop Layout
- [ ] Restore desktop grid (3-4 columns)
- [ ] Restore desktop navigation
- [ ] Restore desktop filters sidebar
- [ ] Restore desktop hover effects

---

### 9. **Route Configuration** ⚠️ CRITICAL

#### 9.1 App.tsx Updates
- [ ] Ensure YourStop routes are in separate route group
- [ ] Verify YourStop routes use `YourStopLayout` (not `MainLayout`)
- [ ] Ensure main app routes don't interfere
- [ ] Verify route isolation works correctly

#### 9.2 Route Structure
```
/YourStop → YourStopIndex (redirects to /YourStop/explore)
/YourStop/explore → ExplorePage
/YourStop/restaurants → RestaurantsPage
/YourStop/restaurants/:id → RestaurantDetailPage
/YourStop/booking → BookingPage
/YourStop/auth → AuthPage
/YourStop/profile-management → ProfileManagementPage
/YourStop/my-bookings → MyBookingsPage
/YourStop/favorites → FavoritesPage
/YourStop/contact → ContactPage
/YourStop/about → AboutPage
/YourStop/search → SearchPage
/YourStop/profile → ProfilePage
```

---

### 10. **Context Providers** ⚠️ CRITICAL

#### 10.1 Separate Contexts
- [ ] Ensure `CustomerAuthProvider` is only in YourStopLayout
- [ ] Verify no main app contexts leak into YourStop
- [ ] Ensure YourStop has isolated state management

#### 10.2 Provider Order
```tsx
<CustomerAuthProvider>
  <PWAInstallBanner />
  <Header />
  <main>{children}</main>
  <Footer />
  <Toaster />
</CustomerAuthProvider>
```

---

### 11. **Import Path Fixes**

#### 11.1 Update All Imports
- [ ] Fix `BookingPage.tsx` imports (user changed to `@yourstop/...`)
- [ ] Update all pages to use consistent import paths
- [ ] Either use:
  - Option A: Relative paths `../../../../yourstop/frontend/src/...`
  - Option B: Path aliases `@yourstop/...` (requires tsconfig setup)

#### 11.2 Path Alias Setup (if using Option B)
- [ ] Add to `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "paths": {
        "@yourstop/*": ["./src/yourstop/frontend/src/*"]
      }
    }
  }
  ```
- [ ] Add to `vite.config.ts`:
  ```ts
  resolve: {
    alias: {
      '@yourstop': path.resolve(__dirname, './src/yourstop/frontend/src')
    }
  }
  ```

---

### 12. **Meta Tags & SEO**

#### 12.1 SEO Component
- [ ] Add `SEOOptimizer` component to layout
- [ ] Ensure meta tags are set per page
- [ ] Ensure Open Graph tags
- [ ] Ensure Twitter cards

#### 12.2 Manifest & PWA
- [ ] Add manifest.json link
- [ ] Add theme-color meta tag
- [ ] Add apple-mobile-web-app meta tags
- [ ] Add favicon links

---

### 13. **Testing & Verification**

#### 13.1 Visual Comparison
- [ ] Compare each page side-by-side with original
- [ ] Verify colors match exactly
- [ ] Verify fonts match exactly
- [ ] Verify spacing matches exactly
- [ ] Verify animations match exactly

#### 13.2 Functionality Testing
- [ ] Test all navigation
- [ ] Test all forms
- [ ] Test all buttons
- [ ] Test all modals
- [ ] Test responsive breakpoints
- [ ] Test authentication flow

#### 13.3 Isolation Testing
- [ ] Verify main app sidebar/topbar don't appear
- [ ] Verify main app contexts don't interfere
- [ ] Verify YourStop works independently

---

## 🎯 PRIORITY ORDER

1. **CRITICAL (Do First)**:
   - CSS & Theme Setup (#1)
   - Layout Structure (#2)
   - Header Component (#3)
   - Footer Component (#4)
   - Route Configuration (#9)
   - Context Providers (#10)

2. **HIGH PRIORITY**:
   - Page Components (#5)
   - Component Styling (#6)
   - Import Path Fixes (#11)

3. **MEDIUM PRIORITY**:
   - Animations & Transitions (#7)
   - Responsive Design (#8)
   - Meta Tags & SEO (#12)

4. **FINAL**:
   - Testing & Verification (#13)

---

## 📝 NOTES

- The original YourStop uses a modern minimal design with:
  - Purple/Blue gradient brand colors
  - Space Grotesk for headings
  - Inter for body text
  - Smooth animations and transitions
  - Glass-morphism effects
  - Card-based layouts

- All pages should match the original exactly in:
  - Colors
  - Typography
  - Spacing
  - Animations
  - Layout structure

- The YourStop section must be completely isolated from the main app
