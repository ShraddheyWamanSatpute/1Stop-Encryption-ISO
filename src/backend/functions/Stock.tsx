"use client"
import type {
  Product,
  Supplier,
  StockData
} from "../interfaces/Stock"

// ===== BUSINESS LOGIC FUNCTIONS =====

// Permission functions
export function canViewStock(hasPermission: (permission: string) => boolean): boolean {
  return hasPermission("stock.view")
}

export function canEditStock(hasPermission: (permission: string) => boolean): boolean {
  return hasPermission("stock.edit")
}

export function canDeleteStock(hasPermission: (permission: string) => boolean): boolean {
  return hasPermission("stock.delete")
}

export function isOwnerCheck(isOwner: () => boolean): boolean {
  return isOwner()
}

// ===== PRODUCT CRUD FUNCTIONS =====

export async function createProduct(basePath: string, product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
  const StockDB = await import("../rtdatabase/Stock")
  return await StockDB.createProduct(basePath, product)
}

export async function updateProduct(basePath: string, productId: string, updates: Partial<Product>): Promise<void> {
  const StockDB = await import("../rtdatabase/Stock")
  return await StockDB.updateProduct(basePath, productId, updates)
}

// ===== UTILITY FUNCTIONS =====

// Google Maps utility functions
export function getGoogleMapsApiKey(): string {
  return (
    (typeof process !== "undefined" ? (process as any).env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : undefined) ||
    ((typeof import.meta !== "undefined" ? (import.meta as any).env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : undefined)) ||
    ""
  )
}

export function parseAddressComponents(components: any[]): any {
  if (typeof window === "undefined") return {}
  
  const comps = components || []
  const get = (type: string) => comps.find((c: any) => c.types.includes(type))?.long_name || ""
  
  const streetNumber = get("street_number")
  const route = get("route")
  const address = [streetNumber, route].filter(Boolean).join(" ")
  
  const city = get("locality") || get("postal_town") || get("sublocality")
  const state = get("administrative_area_level_1")
  const postcode = get("postal_code")
  const country = get("country")
  
  return {
    address,
    city,
    state,
    postcode,
    country
  }
}

// ===== DATA PROCESSING FUNCTIONS =====

// Stock data aggregation function
export function getStockData(products: Product[], suppliers: Supplier[], measures: any[]): StockData {
  return {
    products,
    suppliers,
    measures,
    salesDivisions: [],
    categories: [],
    subcategories: [],
    totalProducts: products.length,
    totalSuppliers: suppliers.length,
    totalMeasures: measures.length
  }
}

// ParLevel Helper Functions
export function getParLevelValue(value: number | { parLevel: number; measureId: string }): number {
  if (typeof value === 'number') {
    return value;
  }
  return value.parLevel;
}

export function getParLevelMeasureId(value: number | { parLevel: number; measureId: string }): string | undefined {
  if (typeof value === 'number') {
    return undefined;
  }
  return value.measureId;
}

// ===== DATA REFRESH FUNCTIONS =====

export async function refreshProducts(
  basePath: string, 
  fetchProducts: (basePath: string) => Promise<Product[]>,
  dispatch: (action: any) => void
): Promise<void> {
  if (!basePath) {
    dispatch({ type: "SET_LOADING", payload: false })
    return
  }

  try {
    console.log("Starting product refresh...")
    dispatch({ type: "SET_LOADING", payload: true })
    dispatch({ type: "SET_ERROR", payload: null })
    
    const products = await fetchProducts(basePath)
    console.log("Products fetched successfully:", products.length)
    
    dispatch({ type: "SET_PRODUCTS", payload: products })
    dispatch({ type: "SET_LOADING", payload: false })
    
    console.log("Product refresh completed successfully")
  } catch (error) {
    console.error("Error refreshing products:", error)
    dispatch({ type: "SET_LOADING", payload: false })
    dispatch({ type: "SET_ERROR", payload: "Failed to refresh products" })
  }
}

export async function refreshSuppliers(
  basePath: string, 
  fetchSuppliersFromBasePath: (basePath: string) => Promise<any[]>,
  dispatch: (action: any) => void
): Promise<void> {
  if (!basePath) return

  try {
    const suppliers = await fetchSuppliersFromBasePath(basePath)
    dispatch({ type: "SET_SUPPLIERS", payload: suppliers })
  } catch (error) {
    console.error("Error refreshing suppliers:", error)
  }
}

export async function refreshMeasures(
  basePath: string, 
  fetchMeasuresFromBasePath: (basePath: string) => Promise<any[]>,
  dispatch: (action: any) => void
): Promise<void> {
  if (!basePath) return

  try {
    const measures = await fetchMeasuresFromBasePath(basePath)
    dispatch({ type: "SET_MEASURES", payload: measures })
  } catch (error) {
    console.error("Error refreshing measures:", error)
  }
}

export async function refreshAll(
  basePath: string,
  isLoading: React.MutableRefObject<boolean>,
  lastLoadedPath: React.MutableRefObject<string>,
  isInitialized: React.MutableRefObject<boolean>,
  dispatch: (action: any) => void,
  fetchProducts: (basePath: string) => Promise<Product[]>,
  fetchMeasuresFromBasePath: (basePath: string) => Promise<any[]>,
  fetchSuppliersFromBasePath: (basePath: string) => Promise<any[]>,
  fetchCategories: (basePath: string) => Promise<any[]>,
  fetchSubcategories: (basePath: string) => Promise<any[]>,
  fetchSalesDivisions: (basePath: string) => Promise<any[]>,
  fetchCourses: (basePath: string) => Promise<any[]>,
  fetchLatestCountsForProducts: (basePath: string) => Promise<Record<string, any>>
): Promise<void> {
  if (!basePath || isLoading.current) {
    dispatch({ type: "SET_LOADING", payload: false })
    return
  }
  
  // Prevent duplicate loading for same path
  if (basePath === lastLoadedPath.current && isInitialized.current) {
    dispatch({ type: "SET_LOADING", payload: false })
    return
  }

  try {
    // Set loading state
    isLoading.current = true
    lastLoadedPath.current = basePath
    dispatch({ type: "SET_LOADING", payload: true })
    dispatch({ type: "SET_ERROR", payload: null })

    // IMMEDIATE: Load only critical stock data for basic functionality
    const [products, measures] = await Promise.all([
      fetchProducts(basePath),
      fetchMeasuresFromBasePath(basePath),
    ])

    // Update state with critical data first
    dispatch({ type: "SET_PRODUCTS", payload: products })
    dispatch({ type: "SET_MEASURES", payload: measures })

    // BACKGROUND: Load additional data for enhanced functionality
    const [
      suppliers,
      categories,
      subcategories,
      salesDivisions,
      courses,
      latestCounts
    ] = await Promise.all([
      fetchSuppliersFromBasePath(basePath),
      fetchCategories(basePath),
      fetchSubcategories(basePath),
      fetchSalesDivisions(basePath),
      fetchCourses(basePath),
      fetchLatestCountsForProducts(basePath),
    ])

    // Update state with additional data
    dispatch({
      type: "SET_ALL_DATA",
      payload: {
        products,
        suppliers,
        measures,
        salesDivisions,
        categories,
        subcategories,
        courses,
        purchases: [],
        stockCounts: [],
        stockItems: [],
        purchaseOrders: [],
        latestCounts,
        purchaseHistory: [],
        salesHistory: [],
      },
    })

    // Mark as initialized
    isInitialized.current = true
    dispatch({ type: "SET_LOADING", payload: false })
    isLoading.current = false
  } catch (error) {
    console.error("Error refreshing all data:", error)
    dispatch({ type: "SET_ERROR", payload: "Failed to load stock data" })
    dispatch({ type: "SET_LOADING", payload: false })
    isLoading.current = false
  }
}

// Category CRUD functions
export async function createCategory(basePath: string, categoryData: any): Promise<string> {
  const { createCategory: createCategoryRTDB } = await import('../rtdatabase/Stock')
  await createCategoryRTDB(categoryData, basePath)
  return 'category-created' // Return a placeholder ID
}

export async function updateCategory(basePath: string, categoryId: string, categoryData: any): Promise<void> {
  const { updateCategory: updateCategoryRTDB } = await import('../rtdatabase/Stock')
  await updateCategoryRTDB(categoryId, categoryData, basePath, categoryData.kind)
}

export async function deleteCategory(basePath: string, categoryId: string): Promise<void> {
  const { deleteCategory: deleteCategoryRTDB } = await import('../rtdatabase/Stock')
  await deleteCategoryRTDB(categoryId, 'Category', basePath)
}

// Stock Location CRUD functions
export async function createStockLocation(basePath: string, locationData: any): Promise<string> {
  const { addStockLocation } = await import('../rtdatabase/Stock')
  return await addStockLocation(basePath, locationData)
}

export async function updateStockLocation(basePath: string, locationId: string, locationData: any): Promise<void> {
  const { updateStockLocation: updateStockLocationRTDB } = await import('../rtdatabase/Stock')
  await updateStockLocationRTDB(basePath, { ...locationData, id: locationId })
}

export async function deleteStockLocation(basePath: string, locationId: string): Promise<void> {
  const { deleteStockLocation: deleteStockLocationRTDB } = await import('../rtdatabase/Stock')
  await deleteStockLocationRTDB(basePath, locationId)
}

// Par Level CRUD functions
export async function createParLevel(basePath: string, parLevelData: any): Promise<string> {
  const { saveParLevel } = await import('../rtdatabase/Stock')
  return await saveParLevel(basePath, parLevelData)
}

export async function updateParLevel(basePath: string, parLevelId: string, parLevelData: any): Promise<void> {
  const { saveParLevel } = await import('../rtdatabase/Stock')
  await saveParLevel(basePath, { ...parLevelData, id: parLevelId })
}

export async function deleteParLevel(basePath: string, parLevelId: string): Promise<void> {
  const { deleteParLevel: deleteParLevelRTDB } = await import('../rtdatabase/Stock')
  await deleteParLevelRTDB(basePath, parLevelId)
}

// ===== STOCK CALCULATION HELPER FUNCTIONS =====

/**
 * Convert quantity to base units (g for weight, ml for volume, or base unit for counts)
 * 
 * FORMULA: quantity * measure.quantity * unit_multiplier
 * 
 * Where:
 * - quantity: Number of measure units being counted/sold/purchased
 * - measure.quantity: How many base units are in ONE measure unit
 * - unit_multiplier: 1000 for kg→g or l→ml, otherwise 1
 * 
 * EXAMPLES:
 * 1. Measure "6-pack" has quantity=6, unit="single"
 *    User counts 5 units → 5 * 6 * 1 = 30 singles
 * 
 * 2. Measure "Case" has quantity=2, unit="kg"
 *    User counts 3 units → 3 * 2 * 1000 = 6,000g
 * 
 * 3. Measure "Bottle" has quantity=750, unit="ml"
 *    User counts 4 units → 4 * 750 * 1 = 3,000ml
 * 
 * 4. Measure "Box" has quantity=0.5, unit="kg"
 *    User counts 10 units → 10 * 0.5 * 1000 = 5,000g
 * 
 * @param quantity - The quantity to convert (number of measure units)
 * @param measureId - The measure ID to look up
 * @param measures - Array of measure definitions
 * @returns Quantity in base units (g, ml, or base count)
 */
export function convertToBaseUnits(quantity: number, measureId: string, measures: any[]): number {
  // Validate inputs
  if (!quantity || quantity < 0) return 0
  if (!measureId) {
    // Only warn in development mode
    if (process.env.NODE_ENV === 'development') {
      console.warn('convertToBaseUnits: No measureId provided')
    }
    return quantity
  }
  if (!measures || measures.length === 0) {
    // Don't warn if measures array is empty - likely still loading
    return quantity
  }
  
  // Find the measure definition
  const measure = measures.find((m) => m.id === measureId)
  if (!measure) {
    // Only warn in development mode to reduce console noise
    // This can happen during initial load or with invalid data
    if (process.env.NODE_ENV === 'development') {
      console.warn(`convertToBaseUnits: Measure not found for ID: ${measureId}`)
    }
    return quantity
  }
  
  // Get unit and quantity from measure
  const unit = String(measure.unit || '').toLowerCase().trim()
  const measureQuantity = Number(measure.quantity) || 1
  
  // Validate measure quantity
  if (measureQuantity <= 0) {
    // Only warn in development mode
    if (process.env.NODE_ENV === 'development') {
      console.warn(`convertToBaseUnits: Invalid measure quantity (${measureQuantity}) for measure ${measureId}`)
    }
    return quantity
  }
  
  // Base conversion: quantity * measure.quantity
  let baseQuantity = quantity * measureQuantity
  
  // Apply unit multiplier for weight/volume conversions
  if (unit === "kg") {
    baseQuantity *= 1000  // kg to g
  } else if (unit === "l" || unit === "litre" || unit === "liter") {
    baseQuantity *= 1000  // l to ml
  }
  // For other units (g, ml, single, unit, etc.), no multiplier needed
  
  return baseQuantity
}

/**
 * Get the base unit for a measure (g for kg, ml for l, or the original unit)
 * @param measureId - The measure ID
 * @param measures - Array of measure definitions
 * @returns Base unit string
 */
export function getBaseUnit(measureId: string, measures: any[]): string {
  const measure = measures.find((m) => m.id === measureId)
  if (!measure) return ""
  
  const unit = String(measure.unit).toLowerCase()
  if (unit === "kg") return "g"
  if (unit === "l") return "ml"
  return measure.unit || ""
}

/**
 * Get price for a product's default sales measure
 * Uses the sale.units array with sale.defaultMeasure
 * @param product - The product
 * @returns Price for default sales measure, or 0
 */
export function getDefaultSalePrice(product: any): number {
  if (!product.sale?.units || !product.sale?.defaultMeasure) {
    return product.salesPrice || product.sale?.price || 0
  }
  
  const defaultUnit = product.sale.units.find(
    (u: any) => u.measure === product.sale.defaultMeasure
  )
  
  return defaultUnit?.price || product.salesPrice || product.sale?.price || 0
}

/**
 * Get price for a product's default purchase measure
 * Uses the purchase.units array with purchase.defaultMeasure
 * @param product - The product
 * @returns Price for default purchase measure, or 0
 */
export function getDefaultPurchasePrice(product: any): number {
  if (!product.purchase?.units || !product.purchase?.defaultMeasure) {
    return product.purchasePrice || product.purchase?.price || 0
  }
  
  const defaultUnit = product.purchase.units.find(
    (u: any) => u.measure === product.purchase.defaultMeasure
  )
  
  return defaultUnit?.price || product.purchasePrice || product.purchase?.price || 0
}

/**
 * Calculate current/predicted stock from stock counts, purchases, and sales
 * Formula: Latest Stock Count + Purchases Since Count - Sales Since Count (all in base units)
 * @param productId - The product ID
 * @param stockCounts - Array of stock counts
 * @param purchases - Array of purchases
 * @param sales - Array of sales
 * @param measures - Array of measure definitions
 * @param endDate - Calculate stock up to this date (defaults to now)
 * @returns Stock quantity in base units
 */
export function calculateCurrentStock(
  productId: string,
  stockCounts: any[],
  purchases: any[],
  sales: any[],
  measures: any[],
  endDate: Date = new Date()
): { quantity: number; baseUnit: string } {
  // Find the most recent stock count before endDate
  const relevantCounts = stockCounts
    .filter((sc: any) => {
      const countDate = new Date(sc.dateUK || sc.date || 0)
      return countDate <= endDate && sc.items?.some((item: any) => item.id === productId)
    })
    .sort((a: any, b: any) => {
      const dateA = new Date(a.dateUK || a.date || 0).getTime()
      const dateB = new Date(b.dateUK || b.date || 0).getTime()
      return dateB - dateA // Most recent first
    })
  
  let stockQuantity = 0
  let baseUnit = "unit"
  const lastCountDate = new Date(0)
  
  if (relevantCounts.length > 0) {
    const latestCount = relevantCounts[0]
    const countItems = latestCount.items.filter((item: any) => item.id === productId)
    
    // Sum all items for this product in the count (in base units)
    countItems.forEach((item: any) => {
      const baseQty = convertToBaseUnits(item.countedTotal || 0, item.measureId, measures)
      stockQuantity += baseQty
      
      // Set base unit from first item
      if (!baseUnit || baseUnit === "unit") {
        baseUnit = getBaseUnit(item.measureId, measures)
      }
    })
    
    lastCountDate.setTime(new Date(latestCount.dateUK || latestCount.date || 0).getTime())
  }
  
  // Add purchases since last count (in base units)
  purchases.forEach((purchase: any) => {
    const purchaseDate = new Date(purchase.dateUK || purchase.orderDate || purchase.date || 0)
    if (purchaseDate > lastCountDate && purchaseDate <= endDate && purchase.items) {
      purchase.items.forEach((item: any) => {
        if (item.itemID === productId || item.productId === productId) {
          const baseQty = convertToBaseUnits(item.quantity || 0, item.measureId, measures)
          stockQuantity += baseQty
        }
      })
    }
  })
  
  // Subtract sales since last count (in base units)
  sales.forEach((sale: any) => {
    const saleDate = new Date(sale.tradingDate || sale.date || 0)
    if (saleDate > lastCountDate && saleDate <= endDate) {
      if (sale.productId === productId || sale.itemID === productId) {
        const baseQty = convertToBaseUnits(sale.quantity || 0, sale.measureId, measures)
        stockQuantity -= baseQty
      }
    }
  })
  
  return {
    quantity: Math.max(0, stockQuantity),
    baseUnit
  }
}

/**
 * Calculate stock accuracy from variance between predicted and actual counts
 * @param predictedStock - Predicted stock in base units
 * @param actualCount - Actual counted stock in base units
 * @returns Accuracy percentage (0-100)
 */
export function calculateStockAccuracy(predictedStock: number, actualCount: number): number {
  if (actualCount === 0) return 0
  
  const variance = Math.abs(predictedStock - actualCount)
  const accuracy = Math.max(0, 100 - (variance / actualCount * 100))
  
  return Math.round(accuracy * 100) / 100 // Round to 2 decimal places
}

/**
 * Calculate stock turnover using standard formula: COGS / Average Inventory Value
 * @param products - Array of products with stock and price data
 * @param sales - Array of sales
 * @param measures - Array of measure definitions
 * @param periodDays - Period in days to calculate turnover (default 30)
 * @returns Stock turnover ratio
 */
export function calculateStockTurnover(
  products: any[],
  sales: any[],
  measures: any[],
  periodDays: number = 30
): number {
  // Calculate COGS (Cost of Goods Sold) from sales
  let totalCOGS = 0
  
  sales.forEach((sale: any) => {
    const product = products.find(p => p.id === sale.productId || p.id === sale.itemID)
    if (product) {
      // Use getProductCost which handles recipe costs properly
      const costPerUnit = getProductCost(product, products, measures, sale.measureId)
      const baseQty = convertToBaseUnits(sale.quantity || 0, sale.measureId, measures)
      
      // COGS = quantity sold * cost per unit
      totalCOGS += baseQty * costPerUnit
    }
  })
  
  // Calculate Average Inventory Value using effective costs
  let totalInventoryValue = 0
  
  products.forEach((product: any) => {
    const currentStock = product.currentStock || product.predictedStock || 0
    // Use effectiveCost if available, otherwise calculate it
    const costPerUnit = product.effectiveCost || getProductCost(product, products, measures)
    totalInventoryValue += currentStock * costPerUnit
  })
  
  const averageInventoryValue = totalInventoryValue / Math.max(1, products.length)
  
  // Stock Turnover = COGS / Average Inventory Value
  // Annualize if period is less than a year
  const annualizationFactor = 365 / periodDays
  const turnover = averageInventoryValue > 0 
    ? (totalCOGS / averageInventoryValue) * annualizationFactor 
    : 0
  
  return Math.round(turnover * 100) / 100 // Round to 2 decimal places
}

/**
 * Calculate cost of a recipe by summing ingredient costs in base units
 * For recipe-type products, this is the true cost instead of purchase price
 * 
 * @param recipe - Recipe object with ingredients array
 * @param products - All products (to look up ingredient costs)
 * @param measures - All measures (for unit conversions)
 * @returns Total recipe cost
 */
export function calculateRecipeCost(
  recipe: {
    ingredients: Array<{
      itemId: string
      measure: string
      quantity: number
    }>
  } | undefined,
  products: any[],
  measures: any[]
): number {
  if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
    return 0
  }
  
  let totalCost = 0
  
  recipe.ingredients.forEach((ingredient) => {
    // Find the ingredient product
    const ingredientProduct = products.find(p => p.id === ingredient.itemId)
    if (!ingredientProduct) {
      console.warn(`Recipe ingredient product not found: ${ingredient.itemId}`)
      return
    }
    
    // Get the cost per base unit of the ingredient
    // For recipe ingredients, use their purchase price (or their recipe cost if they're also recipes)
    let costPerBaseUnit = 0
    
    if (ingredientProduct.type === "recipe" || ingredientProduct.type === "choice" || ingredientProduct.type === "prepped-item") {
      // Recursively calculate cost for nested recipes
      const ingredientDefaultUnit = ingredientProduct.sale?.units?.find(
        (u: any) => u.measure === ingredientProduct.sale?.defaultMeasure
      )
      if (ingredientDefaultUnit?.recipe) {
        costPerBaseUnit = calculateRecipeCost(ingredientDefaultUnit.recipe, products, measures)
      } else {
        costPerBaseUnit = getDefaultPurchasePrice(ingredientProduct)
      }
    } else {
      // For non-recipe items, use purchase price
      const purchasePrice = getDefaultPurchasePrice(ingredientProduct)
      const purchaseMeasure = ingredientProduct.purchase?.defaultMeasure
      
      if (purchaseMeasure) {
        // Convert purchase price to cost per base unit
        const purchaseBaseQty = convertToBaseUnits(1, purchaseMeasure, measures)
        costPerBaseUnit = purchaseBaseQty > 0 ? purchasePrice / purchaseBaseQty : purchasePrice
      } else {
        costPerBaseUnit = purchasePrice
      }
    }
    
    // Convert ingredient quantity to base units
    const ingredientBaseQty = convertToBaseUnits(
      ingredient.quantity || 0,
      ingredient.measure,
      measures
    )
    
    // Add to total cost
    totalCost += costPerBaseUnit * ingredientBaseQty
  })
  
  return totalCost
}

/**
 * Get the effective cost for a product (purchase price or recipe cost)
 * For recipe-type products, calculates cost from ingredients
 * For regular products, uses default purchase price
 * 
 * @param product - The product
 * @param products - All products (for ingredient lookup)
 * @param measures - All measures (for conversions)
 * @param measureId - Optional specific measure to calculate cost for (uses default if not provided)
 * @returns Cost for the product/measure
 */
export function getProductCost(
  product: any,
  products: any[],
  measures: any[],
  measureId?: string
): number {
  // Determine which measure to use
  const targetMeasureId = measureId || product.sale?.defaultMeasure || product.purchase?.defaultMeasure
  
  // For recipe-type products, calculate from ingredients
  if (product.type === "recipe" || product.type === "choice" || product.type === "prepped-item") {
    // Find the sales unit for this measure
    const saleUnit = product.sale?.units?.find((u: any) => u.measure === targetMeasureId)
    
    if (saleUnit?.recipe) {
      return calculateRecipeCost(saleUnit.recipe, products, measures)
    }
    
    // Fallback to purchase price if no recipe defined
    return getDefaultPurchasePrice(product)
  }
  
  // For non-recipe products, use purchase price
  return getDefaultPurchasePrice(product)
}

