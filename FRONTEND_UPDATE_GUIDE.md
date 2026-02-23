# Frontend Update Guide - Ensuring UI Updates When Data Changes

## Overview

This guide shows you how to ensure your frontend components properly update when context data changes. The context system now includes data versioning and helper utilities to guarantee reactivity.

---

## Quick Start

### Basic Usage (Automatic Updates)

Most components will update automatically when using contexts:

```typescript
import { useStock } from '@/backend/context/StockContext'

function ProductList() {
  const { state } = useStock()
  
  // Component automatically re-renders when state.products changes
  // because state.dataVersion increments on every data change
  return (
    <div>
      {state.products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

**How it works:**
- Every data change increments `state.dataVersion`
- React detects the version change
- Component re-renders automatically
- ✅ No additional code needed!

---

## Advanced Usage

### 1. Watch for Specific Data Changes

Use the `useContextWatcher` hook to react to specific data changes:

```typescript
import { useStock } from '@/backend/context/StockContext'
import { useContextWatcher } from '@/backend/context/helpers'

function ProductAnalytics() {
  const { state } = useStock()
  
  // This will only re-render when products change
  const products = useContextWatcher(
    () => state.products,
    [state.dataVersion], // Watch dataVersion for changes
    (newProducts) => {
      console.log('Products updated:', newProducts.length)
      // Run analytics, update charts, etc.
    }
  )
  
  return <div>Total Products: {products.length}</div>
}
```

---

### 2. Track Data Freshness

Show users when data might be stale:

```typescript
import { useStock } from '@/backend/context/StockContext'
import { useDataFreshness } from '@/backend/context/helpers'

function ProductList() {
  const { state, refreshAll } = useStock()
  
  // Track if data is fresh (< 30 seconds old)
  const { isFresh, refresh } = useDataFreshness(
    state.products,
    () => {
      console.log('Data is stale, consider refreshing')
    },
    30000 // 30 seconds
  )
  
  return (
    <div>
      {!isFresh && (
        <Banner>
          Data may be outdated.
          <Button onClick={() => { refresh(); refreshAll(); }}>
            Refresh
          </Button>
        </Banner>
      )}
      {state.products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

---

### 3. Wait for Data to Load

Show loading states while data initializes:

```typescript
import { useStock } from '@/backend/context/StockContext'
import { useDataReady } from '@/backend/context/helpers'

function ProductDashboard() {
  const { state } = useStock()
  
  // Only show content when data is loaded
  const isReady = useDataReady(state.loading, state.products.length > 0)
  
  if (!isReady) {
    return <LoadingSpinner />
  }
  
  return (
    <div>
      {/* Your dashboard content */}
      <ProductList products={state.products} />
    </div>
  )
}
```

---

### 4. Show Loading Overlay (Maintain Old Data)

Best UX: Show old data with loading indicator:

```typescript
import { useStock } from '@/backend/context/StockContext'

function ProductList() {
  const { state, refreshAll } = useStock()
  
  return (
    <div className="relative">
      {/* Loading overlay - doesn't hide content */}
      {state.loading && (
        <div className="absolute top-0 right-0 p-4">
          <Spinner /> Updating...
        </div>
      )}
      
      {/* Content always visible */}
      {state.products.map(product => (
        <ProductCard 
          key={product.id} 
          product={product}
          dimmed={state.loading} // Optionally dim while loading
        />
      ))}
      
      {/* Refresh button */}
      <Button onClick={refreshAll} disabled={state.loading}>
        {state.loading ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  )
}
```

---

### 5. Manual Force Update (Use Sparingly!)

Only if automatic updates aren't working:

```typescript
import { useStock } from '@/backend/context/StockContext'
import { useForceUpdate } from '@/backend/context/helpers'

function ProblematicComponent() {
  const { state } = useStock()
  const forceUpdate = useForceUpdate()
  
  // Manually force re-render if needed
  useEffect(() => {
    if (someCondition) {
      forceUpdate()
    }
  }, [state.dataVersion])
  
  return <div>{/* Your content */}</div>
}
```

---

## Common Patterns

### Pattern 1: Real-Time Data Display

```typescript
function LiveStockCount() {
  const { state, refreshAll } = useStock()
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshAll, 30000)
    return () => clearInterval(interval)
  }, [refreshAll])
  
  // Component automatically updates when data changes
  return (
    <div>
      <h2>Current Stock ({state.dataVersion})</h2>
      <p>Last updated: {new Date().toLocaleTimeString()}</p>
      {state.products.map(product => (
        <div key={product.id}>
          {product.name}: {product.quantity}
        </div>
      ))}
    </div>
  )
}
```

---

### Pattern 2: Optimistic Updates

```typescript
function ProductEditor({ productId }: { productId: string }) {
  const { state, updateProduct } = useStock()
  const [localProduct, setLocalProduct] = useState<Product | null>(null)
  
  // Find product from context
  const product = state.products.find(p => p.id === productId)
  
  // Update local state when context updates
  useEffect(() => {
    if (product) {
      setLocalProduct(product)
    }
  }, [product, state.dataVersion]) // Re-sync when data changes
  
  const handleSave = async () => {
    if (!localProduct) return
    
    try {
      // Optimistic update - show changes immediately
      setLocalProduct({ ...localProduct, lastUpdated: new Date() })
      
      // Save to backend
      await updateProduct(productId, localProduct)
      
      // Context will refresh and update the UI automatically
    } catch (error) {
      // Revert on error
      setLocalProduct(product)
    }
  }
  
  return (
    <form onSubmit={handleSave}>
      {/* Form fields */}
    </form>
  )
}
```

---

### Pattern 3: Derived Data with Auto-Update

```typescript
function ProductStatistics() {
  const { state } = useStock()
  
  // This will auto-recalculate when state.dataVersion changes
  const stats = useMemo(() => ({
    total: state.products.length,
    lowStock: state.products.filter(p => p.quantity < p.reorderLevel).length,
    totalValue: state.products.reduce((sum, p) => sum + (p.quantity * p.cost), 0)
  }), [state.products, state.dataVersion]) // Dependency on dataVersion
  
  return (
    <div>
      <h2>Statistics</h2>
      <p>Total Products: {stats.total}</p>
      <p>Low Stock Items: {stats.lowStock}</p>
      <p>Total Value: ${stats.totalValue.toFixed(2)}</p>
    </div>
  )
}
```

---

### Pattern 4: Cross-Context Coordination

```typescript
function OrderSummary() {
  const { state: stockState } = useStock()
  const { state: financeState } = useFinance()
  
  // Auto-updates when either context changes
  const summary = useMemo(() => {
    const stockValue = stockState.products.reduce(
      (sum, p) => sum + (p.quantity * p.cost), 0
    )
    const pendingInvoices = financeState.invoices.filter(
      i => i.status === 'pending'
    )
    
    return {
      stockValue,
      pendingInvoices: pendingInvoices.length,
      totalPending: pendingInvoices.reduce((sum, i) => sum + i.total, 0)
    }
  }, [
    stockState.dataVersion, 
    financeState.dataVersion
  ]) // Watch both versions!
  
  return (
    <div>
      <h2>Business Summary</h2>
      <p>Stock Value: ${summary.stockValue.toFixed(2)}</p>
      <p>Pending Invoices: {summary.pendingInvoices}</p>
      <p>Total Pending: ${summary.totalPending.toFixed(2)}</p>
    </div>
  )
}
```

---

## Troubleshooting

### Problem: Component Doesn't Update

**Symptoms:**
- Data changes in context but UI doesn't reflect it
- Old data still showing after refresh

**Solutions:**

1. **Check Dependencies:**
```typescript
// ❌ BAD - Missing dataVersion dependency
useMemo(() => {
  return state.products.length
}, [state.products]) // Might not detect changes

// ✅ GOOD - Include dataVersion
useMemo(() => {
  return state.products.length
}, [state.products, state.dataVersion])
```

2. **Force Update:**
```typescript
const forceUpdate = useForceUpdate()

useEffect(() => {
  forceUpdate()
}, [state.dataVersion])
```

3. **Check Context Provider:**
```typescript
// Make sure your component is wrapped in the provider
<StockProvider>
  <YourComponent />
</StockProvider>
```

---

### Problem: Too Many Re-renders

**Symptoms:**
- Console warning about too many re-renders
- Performance issues

**Solutions:**

1. **Use useMemo for Expensive Calculations:**
```typescript
// ❌ BAD - Recalculates every render
function ExpensiveComponent() {
  const { state } = useStock()
  const result = heavyCalculation(state.products) // Runs every render!
  return <div>{result}</div>
}

// ✅ GOOD - Only recalculates when needed
function ExpensiveComponent() {
  const { state } = useStock()
  const result = useMemo(
    () => heavyCalculation(state.products),
    [state.dataVersion] // Only when data changes
  )
  return <div>{result}</div>
}
```

2. **Use React.memo for Components:**
```typescript
const ProductCard = React.memo(({ product }: { product: Product }) => {
  return <div>{product.name}</div>
}, (prevProps, nextProps) => {
  // Only re-render if product actually changed
  return prevProps.product.id === nextProps.product.id &&
         prevProps.product.updatedAt === nextProps.product.updatedAt
})
```

---

### Problem: Data Not Loading

**Symptoms:**
- Empty arrays even after page load
- No loading indicator showing

**Solutions:**

1. **Check Context Initialization:**
```typescript
function MyComponent() {
  const { state, refreshAll } = useStock()
  
  // Manually trigger load if needed
  useEffect(() => {
    if (state.products.length === 0 && !state.loading) {
      refreshAll()
    }
  }, [])
  
  return <div>...</div>
}
```

2. **Verify basePath:**
```typescript
function Debug() {
  const { state, basePath } = useStock()
  
  console.log('BasePath:', basePath)
  console.log('Data loaded:', state.dataVersion)
  console.log('Products:', state.products.length)
  
  return null
}
```

---

## Best Practices

### ✅ DO:

1. **Use `state.dataVersion` in dependencies:**
```typescript
useEffect(() => {
  // Your code
}, [state.dataVersion])
```

2. **Show loading states:**
```typescript
{state.loading && <LoadingIndicator />}
```

3. **Keep old data visible during refresh:**
```typescript
{state.loading && <Banner>Updating...</Banner>}
{state.products.map(product => <Card key={product.id} {...product} />)}
```

4. **Use context helpers:**
```typescript
const isReady = useDataReady(state.loading, state.products.length > 0)
```

### ❌ DON'T:

1. **Don't clear data during loading:**
```typescript
// ❌ BAD
if (state.loading) return <Spinner />

// ✅ GOOD
return (
  <>
    {state.loading && <LoadingOverlay />}
    <Content data={state.products} />
  </>
)
```

2. **Don't forget dataVersion in dependencies:**
```typescript
// ❌ BAD
useMemo(() => calculate(state.products), [])

// ✅ GOOD
useMemo(() => calculate(state.products), [state.dataVersion])
```

3. **Don't use force update as first solution:**
```typescript
// ❌ BAD - Force update shouldn't be needed
const forceUpdate = useForceUpdate()
useEffect(() => forceUpdate(), [state.products])

// ✅ GOOD - Let React handle it
// React automatically updates when state.dataVersion changes
```

---

## Data Version Tracking

Every context now includes a `dataVersion` number that increments whenever data changes:

```typescript
{
  products: [...],
  dataVersion: 5 // Increments: 0 → 1 → 2 → 3 → 4 → 5
}
```

**When dataVersion increments:**
- ✅ New data loaded from server
- ✅ Item added/updated/deleted
- ✅ Data refreshed
- ✅ Company/site switched

**When dataVersion doesn't increment:**
- ⏭️ Loading state changes
- ⏭️ Error state changes  
- ⏭️ basePath changes (without data change)

---

## Summary

### For Simple Cases:
Just use the context - React handles everything:
```typescript
const { state } = useStock()
// Component auto-updates when state.dataVersion changes
```

### For Complex Cases:
Use helper hooks:
```typescript
const products = useContextWatcher(() => state.products, [state.dataVersion])
const isReady = useDataReady(state.loading, state.products.length > 0)
const { isFresh } = useDataFreshness(state.products)
```

### Remember:
- ✅ `dataVersion` increments on every data change
- ✅ React automatically detects version changes
- ✅ Components re-render automatically
- ✅ No manual intervention needed in 95% of cases

---

Happy coding! 🎉

