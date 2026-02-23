# Stock Components Update - Data Version Tracking

## Update Pattern for All Stock Components

This document provides the standard pattern for updating stock components to use the new data version tracking system.

---

## Standard Update Pattern

### 1. **Import Helper Hooks**

Add at the top of your component:

```typescript
import { useDataReady } from '@/backend/context/helpers'
```

### 2. **Add dataVersion to Dependencies**

Update all `useEffect`, `useMemo`, and `useCallback` hooks:

```typescript
// ❌ BEFORE
useEffect(() => {
  // Your code
}, [state.products])

// ✅ AFTER
useEffect(() => {
  // Your code
}, [state.products, state.dataVersion])
```

### 3. **Add Loading Overlay Pattern**

Replace loading screens with overlay pattern:

```typescript
// ❌ BEFORE
if (state.loading) return <LoadingSpinner />

// ✅ AFTER
return (
  <div className="relative">
    {state.loading && (
      <div className="absolute top-0 right-0 z-50 p-4 bg-blue-50 rounded shadow">
        <Spinner size="sm" /> Updating...
      </div>
    )}
    {/* Your content always visible */}
  </div>
)
```

### 4. **Use Derived State with dataVersion**

Update any derived state calculations:

```typescript
// ❌ BEFORE
const filteredProducts = useMemo(() => {
  return state.products.filter(p => p.category === selectedCategory)
}, [state.products, selectedCategory])

// ✅ AFTER
const filteredProducts = useMemo(() => {
  return state.products.filter(p => p.category === selectedCategory)
}, [state.products, state.dataVersion, selectedCategory])
```

### 5. **Add Refresh Indicator**

Show when data was last updated:

```typescript
<div className="flex items-center gap-2">
  <span className="text-sm text-gray-500">
    Data Version: {state.dataVersion}
  </span>
  {state.loading && <Spinner size="xs" />}
</div>
```

---

## Component-Specific Updates

### Management Components (List/Table Views)

**Files:**
- `CategoriesManagement.tsx`
- `CoursesManagement.tsx`
- `LocationsManagement.tsx`
- `MeasuresManagement.tsx`
- `ParLevelsManagement.tsx`
- `SuppliersManagement.tsx`

**Standard Pattern:**

```typescript
import React, { useState, useEffect, useMemo } from 'react'
import { useStock } from '@/backend/context/StockContext'
import { useDataReady } from '@/backend/context/helpers'

export function ProductsManagement() {
  const { state, refreshAll } = useStock()
  const [searchTerm, setSearchTerm] = useState('')
  
  // Wait for initial data load
  const isReady = useDataReady(state.loading, state.products.length > 0)
  
  // Filtered data with dataVersion dependency
  const filteredProducts = useMemo(() => {
    return state.products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [state.products, state.dataVersion, searchTerm])
  
  // Show minimal loading on first load only
  if (!isReady && state.products.length === 0) {
    return <LoadingSpinner />
  }
  
  return (
    <div className="relative">
      {/* Loading overlay - doesn't block view */}
      {state.loading && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg shadow">
          <Spinner size="sm" />
          <span className="text-sm">Refreshing...</span>
        </div>
      )}
      
      {/* Header with refresh button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Products</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            v{state.dataVersion}
          </span>
          <button
            onClick={refreshAll}
            disabled={state.loading}
            className="btn btn-secondary"
          >
            {state.loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {/* Search bar */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search products..."
        className="input mb-4"
      />
      
      {/* Content - always visible */}
      <div className={state.loading ? 'opacity-75' : ''}>
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {/* Empty state */}
      {filteredProducts.length === 0 && !state.loading && (
        <div className="text-center py-8 text-gray-500">
          No products found
        </div>
      )}
    </div>
  )
}
```

---

### Form Components

**Files:**
- `forms/ProductForm.tsx`
- `forms/SupplierForm.tsx`
- `forms/CategoryForm.tsx`
- `forms/MeasureForm.tsx`
- `forms/LocationForm.tsx`
- `forms/ParLevelForm.tsx`
- `forms/CourseForm.tsx`

**Standard Pattern:**

```typescript
import React, { useState, useEffect } from 'react'
import { useStock } from '@/backend/context/StockContext'

interface ProductFormProps {
  productId?: string
  onSave?: () => void
  onCancel?: () => void
}

export function ProductForm({ productId, onSave, onCancel }: ProductFormProps) {
  const { state, createProduct, updateProduct } = useStock()
  const [formData, setFormData] = useState<Partial<Product>>({})
  const [saving, setSaving] = useState(false)
  
  // Load existing product if editing
  useEffect(() => {
    if (productId) {
      const product = state.products.find(p => p.id === productId)
      if (product) {
        setFormData(product)
      }
    }
  }, [productId, state.products, state.dataVersion]) // ← Add dataVersion
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      if (productId) {
        await updateProduct(productId, formData)
      } else {
        await createProduct(formData)
      }
      onSave?.()
    } catch (error) {
      console.error('Save failed:', error)
      alert('Failed to save product')
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}
      <input
        type="text"
        value={formData.name || ''}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Product Name"
        className="input"
        required
      />
      
      {/* Save buttons */}
      <div className="flex gap-2">
        <button 
          type="submit" 
          disabled={saving || state.loading}
          className="btn btn-primary"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button 
          type="button" 
          onClick={onCancel}
          disabled={saving}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>
      
      {/* Show if context is refreshing */}
      {state.loading && (
        <p className="text-sm text-gray-500">
          Data is being refreshed...
        </p>
      )}
    </form>
  )
}
```

---

### Table Components

**Files:**
- `StockTable.tsx`
- `StockDataGrid.tsx`
- `ParLevelsTable.tsx`
- `StockCountTable.tsx`
- `PurchaseOrdersTable.tsx`

**Standard Pattern:**

```typescript
import React, { useMemo, useState } from 'react'
import { useStock } from '@/backend/context/StockContext'

interface StockTableProps {
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function StockTable({ onEdit, onDelete }: StockTableProps) {
  const { state, deleteProduct } = useStock()
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // Sorted data with dataVersion dependency
  const sortedProducts = useMemo(() => {
    return [...state.products].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      const modifier = sortDirection === 'asc' ? 1 : -1
      return aVal > bVal ? modifier : -modifier
    })
  }, [state.products, state.dataVersion, sortField, sortDirection])
  
  const handleDelete = async (id: string) => {
    if (confirm('Delete this product?')) {
      try {
        await deleteProduct(id)
      } catch (error) {
        alert('Failed to delete product')
      }
    }
  }
  
  return (
    <div className="relative overflow-x-auto">
      {/* Loading indicator */}
      {state.loading && (
        <div className="absolute top-2 right-2 z-10">
          <Spinner size="sm" />
        </div>
      )}
      
      <table className="w-full">
        <thead>
          <tr>
            <th 
              onClick={() => {
                setSortField('name')
                setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
              }}
              className="cursor-pointer"
            >
              Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th>Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody className={state.loading ? 'opacity-75' : ''}>
          {sortedProducts.map(product => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.quantity}</td>
              <td>
                <button onClick={() => onEdit?.(product.id)}>Edit</button>
                <button onClick={() => handleDelete(product.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {sortedProducts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {state.loading ? 'Loading...' : 'No products'}
        </div>
      )}
    </div>
  )
}
```

---

### Grid/Dashboard Components

**Files:**
- `ManagementGrid.tsx`
- `ReportsGrid.tsx`

**Standard Pattern:**

```typescript
import React, { useMemo } from 'react'
import { useStock } from '@/backend/context/StockContext'
import { useDataFreshness } from '@/backend/context/helpers'

export function StockDashboard() {
  const { state, refreshAll } = useStock()
  
  // Track data freshness
  const { isFresh, refresh } = useDataFreshness(
    state.products,
    () => console.log('Stock data is stale'),
    60000 // 1 minute
  )
  
  // Calculate statistics with dataVersion dependency
  const stats = useMemo(() => ({
    total: state.products.length,
    lowStock: state.products.filter(p => p.quantity < p.reorderLevel).length,
    outOfStock: state.products.filter(p => p.quantity === 0).length,
    totalValue: state.products.reduce((sum, p) => sum + (p.quantity * p.cost), 0)
  }), [state.products, state.dataVersion])
  
  const handleRefresh = async () => {
    refresh()
    await refreshAll()
  }
  
  return (
    <div className="p-6">
      {/* Header with freshness indicator */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Stock Dashboard</h1>
        <div className="flex items-center gap-4">
          {!isFresh && (
            <span className="text-sm text-orange-600">
              ⚠️ Data may be outdated
            </span>
          )}
          <span className="text-sm text-gray-500">
            v{state.dataVersion}
          </span>
          <button
            onClick={handleRefresh}
            disabled={state.loading}
            className="btn btn-primary"
          >
            {state.loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {/* Stats grid */}
      <div className={`grid grid-cols-4 gap-4 mb-6 ${state.loading ? 'opacity-75' : ''}`}>
        <StatCard title="Total Products" value={stats.total} />
        <StatCard title="Low Stock" value={stats.lowStock} variant="warning" />
        <StatCard title="Out of Stock" value={stats.outOfStock} variant="danger" />
        <StatCard title="Total Value" value={`$${stats.totalValue.toFixed(2)}`} />
      </div>
      
      {/* Loading overlay */}
      {state.loading && (
        <div className="flex justify-center items-center py-4">
          <Spinner /> <span className="ml-2">Updating dashboard...</span>
        </div>
      )}
      
      {/* Additional dashboard content */}
      <div className="grid grid-cols-2 gap-6">
        <LowStockWidget products={state.products} dataVersion={state.dataVersion} />
        <RecentActivityWidget dataVersion={state.dataVersion} />
      </div>
    </div>
  )
}

// Sub-component with dataVersion prop
function LowStockWidget({ products, dataVersion }: { products: Product[], dataVersion: number }) {
  const lowStockItems = useMemo(() => {
    return products.filter(p => p.quantity < p.reorderLevel)
  }, [products, dataVersion])
  
  return (
    <div className="card">
      <h3>Low Stock Items ({lowStockItems.length})</h3>
      {lowStockItems.map(item => (
        <div key={item.id}>{item.name}: {item.quantity}</div>
      ))}
    </div>
  )
}
```

---

## Common Patterns

### Pattern 1: Search/Filter

```typescript
const [searchTerm, setSearchTerm] = useState('')

const filteredData = useMemo(() => {
  return state.products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
}, [state.products, state.dataVersion, searchTerm])
```

### Pattern 2: Pagination

```typescript
const [page, setPage] = useState(0)
const [pageSize, setPageSize] = useState(25)

const paginatedData = useMemo(() => {
  const start = page * pageSize
  return state.products.slice(start, start + pageSize)
}, [state.products, state.dataVersion, page, pageSize])
```

### Pattern 3: Grouped Data

```typescript
const groupedByCategory = useMemo(() => {
  return state.products.reduce((acc, product) => {
    const category = product.category || 'Uncategorized'
    if (!acc[category]) acc[category] = []
    acc[category].push(product)
    return acc
  }, {} as Record<string, Product[]>)
}, [state.products, state.dataVersion])
```

### Pattern 4: Cross-Context Data

```typescript
import { useStock } from '@/backend/context/StockContext'
import { useFinance } from '@/backend/context/FinanceContext'

function CombinedReport() {
  const { state: stockState } = useStock()
  const { state: financeState } = useFinance()
  
  const report = useMemo(() => ({
    stockValue: stockState.products.reduce((sum, p) => sum + p.value, 0),
    revenue: financeState.invoices.reduce((sum, i) => sum + i.total, 0)
  }), [
    stockState.products, 
    stockState.dataVersion,
    financeState.invoices,
    financeState.dataVersion
  ])
  
  return <div>Combined Report</div>
}
```

---

## Migration Checklist

For each component, verify:

- [ ] Import `useDataReady` or other helpers if needed
- [ ] Add `state.dataVersion` to all `useEffect` dependencies
- [ ] Add `state.dataVersion` to all `useMemo` dependencies
- [ ] Add `state.dataVersion` to all `useCallback` dependencies
- [ ] Replace loading screens with loading overlays
- [ ] Add data version indicator
- [ ] Add refresh button with loading state
- [ ] Test that component updates when data changes
- [ ] Test that old data remains visible during refresh
- [ ] Verify no console errors or warnings

---

## Testing Script

```typescript
// Test script for each component
describe('StockComponent Updates', () => {
  it('should update when data changes', async () => {
    const { getByText, rerender } = render(<StockComponent />)
    
    // Initial data version
    expect(getByText(/v0/)).toBeInTheDocument()
    
    // Trigger data change
    await act(async () => {
      await createProduct({ name: 'Test' })
    })
    
    // Version should increment
    expect(getByText(/v1/)).toBeInTheDocument()
  })
  
  it('should show loading overlay without hiding content', async () => {
    const { getByText, queryByText } = render(<StockComponent />)
    
    // Content visible
    expect(getByText('Product 1')).toBeInTheDocument()
    
    // Trigger refresh
    fireEvent.click(getByText('Refresh'))
    
    // Loading indicator appears
    expect(getByText('Refreshing...')).toBeInTheDocument()
    
    // Content still visible
    expect(getByText('Product 1')).toBeInTheDocument()
  })
})
```

---

## Summary

**Key Changes for All Components:**

1. ✅ Add `dataVersion` to dependencies
2. ✅ Use loading overlays instead of replacement screens
3. ✅ Show data version indicator
4. ✅ Keep content visible during refresh
5. ✅ Use helper hooks for advanced scenarios

**Result:**
- Components update automatically when data changes
- Better UX with visible content during loading
- Guaranteed reactivity across all stock components

