# Lazy Provider Optimization - Settings & Company Instant Loading

## Problem Identified
SettingsProvider and CompanyProvider were wrapped **inside** LazyContextProvider, adding unnecessary overhead and potential delays.

## Solution

### 1. Moved Settings & Company Outside LazyContextProvider
**Before:**
```tsx
<LazyContextProvider>
  <SettingsProvider>
    <CompanyProvider>
      <App />
    </CompanyProvider>
  </SettingsProvider>
</LazyContextProvider>
```

**After:**
```tsx
<SettingsProvider>
  <CompanyProvider>
    <LazyContextProvider>
      <App />
    </LazyContextProvider>
  </CompanyProvider>
</SettingsProvider>
```

**Impact:**
- Settings and Company load **FIRST** - no lazy loading overhead
- They're always available instantly
- LazyContextProvider only manages module contexts (HR, Stock, etc.)

### 2. Optimized LazyContextProvider

#### Removed 100ms Delay
- **Before**: `setTimeout(..., 100)` for async sections
- **After**: Uses `Promise.resolve().then()` (microtask) - instant execution
- **Impact**: Async sections load immediately

#### Optimized Preloading
- **Before**: `setTimeout(..., 1000)` for preloading
- **After**: Uses `requestIdleCallback` (or microtask fallback)
- **Impact**: Preloading doesn't block critical operations

#### Added 'company' to Initial Sections
- **Before**: Only `['settings', 'assistant', 'notifications']`
- **After**: `['settings', 'company', 'assistant', 'notifications']`
- **Impact**: Company marked as always loaded

#### Lazy State Initialization
- **Before**: Direct object creation
- **After**: Uses lazy initializer `useState(() => ({...}))`
- **Impact**: Slightly faster initial render

## Performance Improvements

### Before
- Settings/Company wrapped in LazyContextProvider → extra render cycle
- 100ms delay for async sections
- 1000ms delay for preloading
- **Total overhead**: ~1100ms+ of delays

### After
- Settings/Company load FIRST → instant availability
- 0ms delay for async sections (microtasks)
- Non-blocking preloading (requestIdleCallback)
- **Total overhead**: 0ms delays

## Expected Load Times

### SettingsContext
- **Before**: ~150-500ms + LazyContextProvider overhead
- **After**: ~150-500ms (no overhead)

### CompanyContext
- **Before**: ~100-300ms + LazyContextProvider overhead
- **After**: ~100-300ms (no overhead)

## Files Changed

1. **src/main.tsx**
   - Moved SettingsProvider and CompanyProvider outside LazyContextProvider
   - They now load first, before any lazy loading logic

2. **src/frontend/components/global/LazyContextProvider.tsx**
   - Removed 100ms setTimeout delay (now uses microtasks)
   - Optimized preloadSection to use requestIdleCallback
   - Added 'company' to initial loaded sections
   - Used lazy state initialization

## Benefits

1. **Instant Availability**: Settings and Company are always available
2. **No Overhead**: No lazy loading delays for core contexts
3. **Faster Rendering**: One less provider layer for core contexts
4. **Better Architecture**: Core contexts separate from lazy contexts
5. **Non-Blocking**: Preloading doesn't block critical operations

## Provider Hierarchy (New)

```
BrowserRouter
└── SettingsProvider (ALWAYS LOADED FIRST)
    └── CompanyProvider (ALWAYS LOADED FIRST)
        └── LazyContextProvider (manages module contexts)
            └── App
                └── LazyProviders (conditionally loads modules)
```

## Testing

Settings and Company should now:
1. Load **instantly** on app start
2. Be available **before** any lazy contexts
3. Have **zero** lazy loading overhead
4. Work **immediately** without waiting






