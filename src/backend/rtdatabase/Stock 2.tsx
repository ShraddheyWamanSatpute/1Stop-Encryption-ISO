"use client"
// React imports removed - no longer using hooks in rtdatabase
import { db, ref, get, remove, update, push, set, child, onValue } from "../services/Firebase"
// CompanyContext import removed - all functions now use basePath parameter
import type {
  Product,
  Purchase,
  StockCount,
  StockPreset,
  StockLocation,
  FloorPlan,
  Table,
  PurchaseItem,
  StockCountItem,
  Ticket,
  TicketSale,
  BagCheckItem,
  BagCheckConfig,
  ParLevelProfile,
} from "../interfaces/Stock"

import type {
  CategoryType,
  Sale,
  Bill,
  PaymentType,
  Device,
  Location,
  Correction,
  TillScreen,
  Discount,
  Promotion,
  StockItem,
  Supplier,
  PurchaseOrder,
} from "../interfaces/Stock"
import { v4 as uuidv4 } from "uuid"
import dayjs from "dayjs"

export async function deleteLocation(basePath: string, locationID: string): Promise<void> {
  const locationPath = `${basePath}/locations/${locationID}`
  await remove(ref(db, locationPath))
}

// SalesDivision CRUD functions
export async function addSalesDivision(basePath: string, salesDivision: Record<string, unknown>): Promise<string> {
  try {
    const salesDivisionsRef = ref(db, `${basePath}/salesDivisions`)
    const newSalesDivisionRef = push(salesDivisionsRef)
    const salesDivisionId = newSalesDivisionRef.key || uuidv4()
    
    await set(newSalesDivisionRef, {
      ...salesDivision,
      id: salesDivisionId,
      createdAt: salesDivision.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    
    return salesDivisionId
  } catch (error) {
    console.error('Error adding sales division:', error)
    throw error
  }
}

export async function updateSalesDivision(basePath: string, salesDivisionID: string, updates: Record<string, unknown>): Promise<void> {
  try {
    const salesDivisionRef = ref(db, `${basePath}/salesDivisions/${salesDivisionID}`)
    
    await update(salesDivisionRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating sales division:', error)
    throw error
  }
}

export async function deleteSalesDivision(basePath: string, salesDivisionID: string): Promise<void> {
  try {
    await remove(ref(db, `${basePath}/salesDivisions/${salesDivisionID}`))
  } catch (error) {
    console.error('Error deleting sales division:', error)
    throw error
  }
}

// Sale CRUD functions
export async function addSale(basePath: string, sale: Omit<Sale, "id">): Promise<string> {
  try {
    const salesRef = ref(db, `${basePath}/sales`)
    const newSaleRef = push(salesRef)
    const saleId = newSaleRef.key || uuidv4()
    
    const saleRecord = sale as unknown as Record<string, unknown>
    await set(newSaleRef, {
      ...sale,
      id: saleId,
      createdAt: (saleRecord.createdAt as string) || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    
    return saleId
  } catch (error) {
    console.error('Error adding sale:', error)
    throw error
  }
}

export async function updateSale(basePath: string, saleID: string, updates: Partial<Sale>): Promise<void> {
  try {
    const saleRef = ref(db, `${basePath}/sales/${saleID}`)
    
    await update(saleRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating sale:', error)
    throw error
  }
}

export async function deleteSale(basePath: string, saleID: string): Promise<void> {
  try {
    await remove(ref(db, `${basePath}/sales/${saleID}`))
  } catch (error) {
    console.error('Error deleting sale:', error)
    throw error
  }
}

export async function addTaxRate(basePath: string, taxRate: number): Promise<void> {
  const taxRef = ref(db, `${basePath}/tax`)
  const newTaxRef = push(taxRef)
  await set(newTaxRef, { rate: taxRate })
}

export async function updateSalesCategory(
  categoryId: string,
  updatedCategory: CategoryType,
  basePath: string,
): Promise<void> {
  const categoryRef = ref(db, `${basePath}/categories/${categoryId}`)
  await set(categoryRef, updatedCategory)
}

export async function deleteSalesCategory(basePath: string, categoryId: string): Promise<void> {
  const categoryRef = ref(db, `${basePath}/categories/${categoryId}`)
  await remove(categoryRef)
}

export const getStockCount = async (
  basePath: string,
): Promise<{ stockData: StockCountItem[]; date: string }> => {
  if (!basePath) return { stockData: [], date: "" }

  const stockRef = ref(db, `${basePath}/stockCounts`)

  const snapshot = await get(stockRef)

  if (!snapshot.exists()) {
    return { stockData: [], date: "" }
  }

  const stockData: StockCountItem[] = Object.entries(snapshot.val().items || {}).map(([id, data]) => {
    const itemData = data as StockCountItem

    return {
      id: id,
      name: itemData.name || "Unknown Item",
      measureId: itemData.measureId || "",
      unitName: itemData.unitName || "",
      countedQuantity: itemData.countedQuantity ?? 0,
      countedTotal: itemData.countedTotal ?? 0,
      previousQuantity: itemData.previousQuantity ?? 0,
      salesDivisionId: itemData.salesDivisionId || "",
      categoryId: itemData.categoryId || "",
      subcategoryId: itemData.subcategoryId || "",
      type: itemData.type || "Unknown",
    }
  })

  const date = snapshot.val().date || ""

  return { stockData, date }
}

export async function recordSale(
  basePath: string,
  product: Product,
  measureId: string,
  unitPrice: number,
  quantity: number,
  paymentMethod: string,
  currentStock: number
): Promise<Sale> {
  const now = new Date()
  const sale: Sale = {
    id: uuidv4(),
    productId: product.id,
    measureId: measureId,
    productName: product.name,
    quantity: quantity,
    salePrice: unitPrice * quantity,
    paymentMethod: paymentMethod,
    date: dayjs(now).format("MM/DD/YYYY"),
    time: dayjs(now).format("HH:mm:ss"),
    billId: "",
    terminalId: "",
    tradingDate: dayjs(now).format("MM/DD/YYYY"),
  }

  // Record the sale in the sales collection
  const salesPath = `${basePath}/sales/${sale.id}`
  await set(ref(db, salesPath), sale)

  // Update the stock for the product
  const newStock = Math.max(0, currentStock - quantity)
  const productPath = `${basePath}/products/${product.id}`
  await update(ref(db, productPath), { stock: newStock })

  return sale
}

export async function fetchOpenBills(basePath: string): Promise<Bill[]> {
  const billsRef = ref(db, `${basePath}/bills`)
  console.log("Fetching open bills from path:", `${basePath}/bills`)
  try {
    const snapshot = await get(billsRef)
    console.log("Bills snapshot exists:", snapshot.exists())
    if (snapshot.exists()) {
      const billsData = snapshot.val() as Record<string, unknown>
      console.log("Raw bills data:", billsData)
      const bills: Bill[] = Object.entries(billsData)
        .map(([id, value]) => {
          const billData = value as Record<string, unknown>
          console.log("Processing bill:", id, billData)
          // Convert string IDs to BillItem objects if needed
          let items = billData.items
          if (Array.isArray(items) && items.length > 0 && typeof items[0] === 'string') {
            // Convert string IDs to BillItem objects
            items = items.map((itemId: string, index: number) => ({
              id: itemId,
              productId: itemId,
              name: `Item ${index + 1}`,
              quantity: 1,
              price: 0,
              total: 0,
              status: "active"
            }))
          }
          return { id, ...billData, items } as Bill
        })
        .filter((bill) => bill.status === "Open")
      console.log("Filtered open bills:", bills)
      return bills
    }
    return []
  } catch (error) {
    console.error("Error fetching open bills:", error)
    return []
  }
}

export async function fetchClosedBills(basePath: string): Promise<Bill[]> {
  const billsRef = ref(db, `${basePath}/bills`)
  console.log("Fetching closed bills from path:", `${basePath}/bills`)
  try {
    const snapshot = await get(billsRef)
    console.log("Bills snapshot exists:", snapshot.exists())
    if (snapshot.exists()) {
      const billsData = snapshot.val() as Record<string, unknown>
      console.log("Raw bills data:", billsData)
      const bills: Bill[] = Object.entries(billsData)
        .map(([id, value]) => {
          const billData = value as Record<string, unknown>
          console.log("Processing bill:", id, billData)
          // Convert string IDs to BillItem objects if needed
          let items = billData.items
          if (Array.isArray(items) && items.length > 0 && typeof items[0] === 'string') {
            // Convert string IDs to BillItem objects
            items = items.map((itemId: string, index: number) => ({
              id: itemId,
              productId: itemId,
              name: `Item ${index + 1}`,
              quantity: 1,
              price: 0,
              total: 0,
              status: "active"
            }))
          }
          return { id, ...billData, items } as Bill
        })
        .filter((bill) => bill.status === "Closed")
      console.log("Filtered closed bills:", bills)
      return bills
    }
    return []
  } catch (error) {
    console.error("Error fetching closed bills:", error)
    return []
  }
}

export async function saveBill(basePath: string, bill: Bill): Promise<void> {
  const billRef = ref(db, `${basePath}/bills/${bill.id}`)
  await set(billRef, bill)
}

// Product CRUD operations with basePath parameter
export async function fetchProducts(basePath: string): Promise<Product[]> {
  const productsRef = ref(db, `${basePath}/products`)
  try {
    const snapshot = await get(productsRef)
    if (snapshot.exists()) {
      const productsData = snapshot.val()
      return Object.entries(productsData).map(([id, data]) => ({
        id,
        ...(data as Omit<Product, 'id'>)
      }))
    }
    return []
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function fetchProductById(basePath: string, productId: string): Promise<Product | null> {
  try {
    const productRef = ref(db, `${basePath}/products/${productId}`)
    const snapshot = await get(productRef)
    
    if (!snapshot.exists()) return null
    
    return {
      ...snapshot.val(),
      id: productId
    } as Product
  } catch (error) {
    console.error("Error fetching product by ID:", error)
    throw error
  }
}

export async function addProduct(basePath: string, product: Omit<Product, "id">): Promise<string> {
  try {
    const productsRef = ref(db, `${basePath}/products`)
    const newProductRef = push(productsRef)
    await set(newProductRef, {
      ...product,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return newProductRef.key || ""
  } catch (error) {
    console.error("Error adding product:", error)
    throw error
  }
}

export async function createProduct(basePath: string, product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
  try {
    const productsRef = ref(db, `${basePath}/products`)
    const newProductRef = push(productsRef)
    const productId = newProductRef.key || uuidv4()
    
    const newProduct: Product = {
      ...product,
      id: productId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    await set(newProductRef, newProduct)
    return newProduct
  } catch (error) {
    console.error("Error creating product:", error)
    throw error
  }
}

export async function updateProduct(basePath: string, productId: string, product: Partial<Product>): Promise<void> {
  try {
    const productRef = ref(db, `${basePath}/products/${productId}`)
    await update(productRef, {
      ...product,
      updatedAt: Date.now(),
    })
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

export async function deleteProduct(basePath: string, productId: string): Promise<void> {
  try {
    const productRef = ref(db, `${basePath}/products/${productId}`)
    await remove(productRef)
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}

export async function fetchSales(basePath: string): Promise<Sale[]> {
  const salesRef = ref(db, `${basePath}/sales`)
  try {
    const snapshot = await get(salesRef)
    if (snapshot.exists()) {
      const val = snapshot.val() as Record<string, unknown>
      const salesData: Sale[] = Object.entries(val).map(([id, data]) => {
        const d = data as Record<string, unknown>
        return {
          id,
          productId: d.productId,
          productName: d.productName,
          quantity: Number(d.quantity),
          salePrice: Number(d.salePrice || 0),
          date: d.date,
          time: d.time,
          paymentMethod: d.paymentMethod,
          measureId: d.measureId,
          billId: d.billId,
          terminalId: d.terminalId,
          tradingDate: d.tradingDate,
        } as Sale
      })
      return salesData
    }
    return []
  } catch (error) {
    console.error("Error fetching sales:", error)
    return []
  }
}

// Legacy function for backward compatibility
export async function fetchProductsLegacy(companyID: string, siteID: string): Promise<Product[]> {
  const basePath = `companies/${companyID}/sites/${siteID}/data/stock`
  return fetchProducts(basePath)
}

// Legacy function for backward compatibility
export async function fetchProductByIdLegacy(productId: string, companyID: string, siteID: string): Promise<Product | null> {
  const basePath = `companies/${companyID}/sites/${siteID}/data/stock`
  return fetchProductById(basePath, productId)
}

export function subscribeToPaymentTypes(basePath: string, callback: (data: PaymentType[]) => void) {
  const paymentTypesRef = ref(db, `${basePath}/paymentTypes`)
  const unsubscribe = onValue(paymentTypesRef, (snapshot) => {
    if (snapshot.exists()) {
      const dataList: PaymentType[] = Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        name: (value as { name: string }).name || "Unnamed Payment Type",
        type: (value as { type: "cash" | "card" }).type || "cash",
      }))
      callback(dataList)
    } else {
      callback([])
    }
  })
  return unsubscribe
}

export async function updatePaymentType(basePath: string, paymentType: PaymentType): Promise<void> {
  try {
    const paymentRef = ref(db, `${basePath}/paymentTypes/${paymentType.id}`)
    await set(paymentRef, {
      ...paymentType,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating payment type:', error)
    throw error
  }
}

export async function deletePaymentType(basePath: string, id: string): Promise<void> {
  try {
    await remove(ref(db, `${basePath}/paymentTypes/${id}`))
  } catch (error) {
    console.error('Error deleting payment type:', error)
    throw error
  }
}

export async function addPaymentType(
  basePath: string,
  payment: { name: string; type: "cash" | "card" },
): Promise<string> {
  try {
    const paymentTypesRef = ref(db, `${basePath}/paymentTypes`)
    const newPaymentRef = push(paymentTypesRef)
    const paymentTypeId = newPaymentRef.key || uuidv4()
    
    await set(newPaymentRef, {
      ...payment,
      id: paymentTypeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    
    return paymentTypeId
  } catch (error) {
    console.error('Error adding payment type:', error)
    throw error
  }
}

export function subscribeToDevices(basePath: string, callback: (devices: Device[]) => void) {
  const devicesRef = ref(db, `${basePath}/devices`)
  return onValue(devicesRef, (snapshot) => {
    const snapshotData = snapshot.val()
    if (snapshotData && typeof snapshotData === "object") {
      const devices: Device[] = Object.entries(snapshotData).map(([id, value]) => ({
        ...(value as Device),
        id,
      }))
      callback(devices)
    } else {
      callback([])
    }
  })
}

export function subscribeToLocations(basePath: string, callback: (locations: Location[]) => void) {
  return onValue(ref(db, `${basePath}/locations`), (snapshot) => {
    if (snapshot.exists()) {
      const locs: Location[] = Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        name: (value as { name: string }).name,
        description: (value as { description?: string }).description || "",
        active: (value as { active?: boolean }).active !== false,
      }))
      callback(locs)
    } else {
      callback([])
    }
  })
}

export async function addDevice(
  basePath: string,
  device: {
    name: string
    type: "Tablet" | "PC" | "Phone" | "Printer" | "Scanner" | "Other"
    connection: "LAN" | "Online"
    location: StockLocation
    status: "Active" | "Inactive" | "Maintenance"
  },
): Promise<void> {
  const devicesRef = ref(db, `${basePath}/devices`)
  const newDeviceRef = push(devicesRef)
  await set(newDeviceRef, device)
}

export async function updateDevice(basePath: string, device: Device): Promise<void> {
  const deviceRef = ref(db, `${basePath}/devices/${device.id}`)
  await update(deviceRef, device)
}

export async function deleteDevice(basePath: string, id: string): Promise<void> {
  await remove(ref(db, `${basePath}/devices/${id}`))
}

export function subscribeToCorrections(
  basePath: string,
  callback: (corrections: Correction[]) => void,
) {
  const correctionsRef = ref(db, `${basePath}/corrections`)
  return onValue(correctionsRef, (snapshot) => {
    if (snapshot.exists()) {
      const dataList: Correction[] = Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        name: (value as { name: string }).name || "Unnamed Correction",
        type: (value as { type: "void" | "waste" | "edit" }).type || "edit",
      }))
      callback(dataList)
    } else {
      callback([])
    }
  })
}

export async function addCorrection(
  basePath: string,
  correction: { name: string; type: "void" | "waste" | "edit" },
): Promise<void> {
  const correctionsRef = ref(db, `${basePath}/corrections`)
  const newCorrectionRef = push(correctionsRef)
  await set(newCorrectionRef, correction)
}

export async function updateCorrection(basePath: string, correction: Correction): Promise<void> {
  const correctionRef = ref(db, `${basePath}/corrections/${correction.id}`)
  await set(correctionRef, {
    name: correction.name,
    type: correction.type,
  })
}

export async function deleteCorrection(basePath: string, id: string): Promise<void> {
  await remove(ref(db, `${basePath}/corrections/${id}`))
}

// useProducts hook removed - use StockContext via useStock() instead

export async function saveTillScreen(basePath: string, screen: TillScreen): Promise<string> {
  try {
    const screensRef = ref(db, `${basePath}/tillScreens`)

    if (screen.id) {
      // Update existing screen
      console.log("Updating existing screen:", screen.id) // Debug log
      await updateTillScreen(basePath, screen)
      return screen.id
    } else {
      // Create new screen
      console.log("Creating new screen") // Debug log
      const newScreenRef = push(screensRef)
      const screenData = {
        name: screen.name,
        layout: screen.layout || [],
        settings: screen.settings || {
          aspectRatio: "16:9",
          canvasWidth: 1600,
          canvasHeight: 900,
          gridSize: 25,
          snapToGrid: true,
          isScrollable: false,
        },
        isDefault: screen.isDefault || false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      await set(newScreenRef, screenData)
      console.log("New screen created with ID:", newScreenRef.key) // Debug log
      return newScreenRef.key || ""
    }
  } catch (error) {
    console.error("Error saving till screen:", error)
    throw error
  }
}

export async function fetchStockHistory(basePath: string): Promise<Array<Record<string, unknown>>> {
  const snapshot = await get(ref(db, `${basePath}/stockCounts`))
  const data = snapshot.val() || {}
  return Object.values(data)
}

export const subscribeTillScreens = (basePath: string, callback: (data: TillScreen[]) => void) => {
  const screensRef = ref(db, `${basePath}/tillscreens`)
  console.log("subscribeTillScreens - Looking for data at:", `${basePath}/tillscreens`)
  return onValue(
    screensRef,
    (snapshot) => {
      console.log("subscribeTillScreens - Snapshot exists:", snapshot.exists())
      if (snapshot.exists()) {
        const data = snapshot.val()
        console.log("Raw till screens data:", data) // Debug log

        const dataRecord = data as Record<string, unknown>
        const screens: TillScreen[] = Object.entries(dataRecord).map(([id, value]) => {
          const screenData = value as Record<string, unknown>
          return {
            id,
            name: String(screenData.name ?? '') || "Unnamed Screen",
            layout: Array.isArray(screenData.layout) ? screenData.layout as TillScreen['layout'] : [],
            settings: (screenData.settings != null ? screenData.settings : {
              aspectRatio: "16:9",
              canvasWidth: 1600,
              canvasHeight: 900,
              gridSize: 25,
              snapToGrid: true,
              isScrollable: false,
            }) as TillScreen['settings'],
            isDefault: Boolean(screenData.isDefault),
            createdAt: Number(screenData.createdAt) || Date.now(),
            updatedAt: Number(screenData.updatedAt) || Date.now(),
          }
        })

        console.log("Processed till screens:", screens) // Debug log
        callback(screens)
      } else {
        console.log("No till screens found") // Debug log
        callback([])
      }
    },
    (error) => {
      console.error("Error subscribing to till screens:", error)
      callback([])
    },
  )
}

export const deleteTillScreen = async (basePath: string, screenId: string): Promise<void> => {
  try {
    console.log(`Deleting till screen: ${screenId} from ${basePath}`) // Debug log
    const tillScreenPath = `${basePath}/tillScreens/${screenId}`
    const screenRef = ref(db, tillScreenPath)
    await remove(screenRef)
    console.log("Till screen deleted successfully") // Debug log
  } catch (error) {
    console.error("Error deleting till screen:", error)
    throw error
  }
}

export const setDefaultTillScreen = (basePath: string, screenId: string) => {
  // First, reset all screens to not be default
  const tillScreensPath = `${basePath}/tillScreens`
  const screensRef = ref(db, tillScreensPath)
  return get(screensRef).then((snapshot) => {
    if (snapshot.exists()) {
      const updates: Record<string, boolean> = {}
      Object.keys(snapshot.val()).forEach((id) => {
        updates[`${id}/isDefault`] = false
      })
      return update(screensRef, updates).then(() => {
        // Then set the selected screen as default
        const screenRef = ref(db, `${tillScreensPath}/${screenId}`)
        return update(screenRef, { isDefault: true })
      })
    }
    return Promise.resolve()
  })
}

// New functions for Bill CRUD operations
export async function createBill(basePath: string, bill: Bill): Promise<void> {
  const newBillRef = push(ref(db, `${basePath}/bills`))
  await set(newBillRef, bill)
}

export async function updateBill(basePath: string, bill: Bill): Promise<void> {
  const billRef = ref(db, `${basePath}/bills/${bill.id}`)
  await update(billRef, bill)
}

export async function deleteBill(basePath: string, billId: string): Promise<void> {
  const billRef = ref(db, `${basePath}/bills/${billId}`)
  await remove(billRef)
}

export async function fetchBill(basePath: string, billId: string): Promise<Bill | null> {
  const billRef = ref(db, `${basePath}/bills/${billId}`)
  try {
    const snapshot = await get(billRef)
    if (snapshot.exists()) {
      return { id: billId, ...(snapshot.val() as Omit<Bill, "id">) }
    }
    return null
  } catch (error) {
    console.error("Error fetching bill:", error)
    return null
  }
}

// Add these missing functions after the existing functions

// Function to fetch payment types
export async function fetchPaymentTypes(basePath: string): Promise<PaymentType[]> {
  const paymentTypesRef = ref(db, `${basePath}/payments`)
  try {
    const snapshot = await get(paymentTypesRef)
    if (snapshot.exists()) {
      const dataList: PaymentType[] = Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        name: (value as { name: string }).name || "Unnamed Payment Type",
        type: (value as { type: "cash" | "card" }).type || "cash",
      }))
      return dataList
    }
    return []
  } catch (error) {
    console.error("Error fetching payment types:", error)
    return []
  }
}

// Note: Legacy product functions (addProductLegacy, updateProductLegacy, deleteProductLegacy)
// are defined at the end of this file for backward compatibility

// Function to fetch devices
export async function fetchDevices(basePath: string): Promise<Device[]> {
  const devicesRef = ref(db, `${basePath}/devices`)
  try {
    const snapshot = await get(devicesRef)
    if (snapshot.exists()) {
      const snapshotData = snapshot.val()
      if (snapshotData && typeof snapshotData === "object") {
        const devices: Device[] = Object.entries(snapshotData).map(([id, value]) => ({
          ...(value as Device),
          id,
        }))
        return devices
      }
    }
    return []
  } catch (error) {
    console.error("Error fetching devices:", error)
    return []
  }
}

// Function to fetch corrections
export async function fetchCorrections(basePath: string): Promise<Correction[]> {
  const correctionsRef = ref(db, `${basePath}/corrections`)
  try {
    const snapshot = await get(correctionsRef)
    if (snapshot.exists()) {
      const dataList: Correction[] = Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        name: (value as { name: string }).name || "Unnamed Correction",
        type: (value as { type: "void" | "waste" | "edit" }).type || "edit",
      }))
      return dataList
    }
    return []
  } catch (error) {
    console.error("Error fetching corrections:", error)
    return []
  }
}

// Functions for Discounts and Promotions
export async function fetchDiscounts(basePath: string): Promise<Discount[]> {
  const discountsRef = ref(db, `${basePath}/discounts`)
  try {
    const snapshot = await get(discountsRef)
    if (snapshot.exists()) {
      const discounts: Discount[] = Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        ...(value as Omit<Discount, "id">),
      }))
      return discounts
    }
    return []
  } catch (error) {
    console.error("Error fetching discounts:", error)
    return []
  }
}

export async function addDiscount(basePath: string, discount: Omit<Discount, "id">): Promise<string> {
  const discountsRef = ref(db, `${basePath}/discounts`)
  const newDiscountRef = push(discountsRef)
  await set(newDiscountRef, discount)
  return newDiscountRef.key || ""
}

export async function updateDiscount(basePath: string, discount: Discount): Promise<void> {
  const discountRef = ref(db, `${basePath}/discounts/${discount.id}`)
  await update(discountRef, discount)
}

export async function deleteDiscount(basePath: string, discountId: string): Promise<void> {
  const discountRef = ref(db, `${basePath}/discounts/${discountId}`)
  await remove(discountRef)
}

export async function fetchPromotions(basePath: string): Promise<Promotion[]> {
  const promotionsRef = ref(db, `${basePath}/promotions`)
  try {
    const snapshot = await get(promotionsRef)
    if (snapshot.exists()) {
      const promotions: Promotion[] = Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        ...(value as Omit<Promotion, "id">),
      }))
      return promotions
    }
    return []
  } catch (error) {
    console.error("Error fetching promotions:", error)
    return []
  }
}

export async function addPromotion(
  basePath: string,
  promotion: Omit<Promotion, "id">,
): Promise<string> {
  const promotionsRef = ref(db, `${basePath}/promotions`)
  const newPromotionRef = push(promotionsRef)
  await set(newPromotionRef, promotion)
  return newPromotionRef.key || ""
}

export async function updatePromotion(basePath: string, promotion: Promotion): Promise<void> {
  const promotionRef = ref(db, `${basePath}/promotions/${promotion.id}`)
  await update(promotionRef, promotion)
}

export async function deletePromotion(basePath: string, promotionId: string): Promise<void> {
  const promotionRef = ref(db, `${basePath}/promotions/${promotionId}`)
  await remove(promotionRef)
}

export async function fetchSalesDivisions(basePath: string): Promise<Array<Record<string, unknown>>> {
  const salesDivisionsRef = ref(db, `${basePath}/salesDivisions`)
  try {
    const snapshot = await get(salesDivisionsRef)
    if (snapshot.exists()) {
      const fetched: Array<Record<string, unknown>> = Object.entries(snapshot.val() as Record<string, unknown>).map(([id, data]) => ({ id, ...(data as Record<string, unknown>) }))
      console.log("Fetched sales divisions from database:", fetched)
      console.log("First sales division color:", fetched[0]?.color)
      return fetched
    }
    return []
  } catch (error) {
    console.error("Error fetching sales divisions:", error)
    return []
  }
}

export async function fetchCategories(basePath: string): Promise<Array<Record<string, unknown>>> {
  const categoriesRef = ref(db, `${basePath}/categories`)
  try {
    const snapshot = await get(categoriesRef)
    if (snapshot.exists()) {
      const fetched: Array<Record<string, unknown>> = Object.entries(snapshot.val() as Record<string, unknown>).map(([id, data]) => ({ id, ...(data as Record<string, unknown>) }))
      console.log("Fetched categories from database:", fetched)
      console.log("First category color:", fetched[0]?.color)
      return fetched
    }
    return []
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

export async function fetchSubcategories(basePath: string): Promise<Array<Record<string, unknown>>> {
  const subcategoriesRef = ref(db, `${basePath}/subcategories`)
  try {
    const snapshot = await get(subcategoriesRef)
    if (snapshot.exists()) {
      const fetched: Array<Record<string, unknown>> = Object.entries(snapshot.val() as Record<string, unknown>).map(([id, data]) => ({ id, ...(data as Record<string, unknown>) }))
      console.log("Fetched subcategories from database:", fetched)
      console.log("First subcategory color:", fetched[0]?.color)
      return fetched
    }
    return []
  } catch (error) {
    console.error("Error fetching subcategories:", error)
    return []
  }
}

// Add fetchGroups function
export const fetchGroups = async (basePath: string): Promise<Array<Record<string, unknown>>> => {
  const groupsRef = ref(db, `${basePath}/groups`)
  try {
    const snapshot = await get(groupsRef)
    if (snapshot.exists()) {
      const val = snapshot.val() as Record<string, unknown>
      return Object.entries(val).map(([id, data]) => ({ id, ...(data as Record<string, unknown>) }))
    }
    return []
  } catch (error) {
    console.error("Error fetching groups:", error)
    return []
  }
}

// Add saveGroup function
export const saveGroup = async (basePath: string, groupData: Record<string, unknown>): Promise<string> => {
  const groupsRef = ref(db, `${basePath}/groups`)
  const newGroupRef = push(groupsRef)
  await set(newGroupRef, groupData)
  return newGroupRef.key || ""
}

// Legacy useStockData hook has been removed. Use StockContext via useStock() instead.

// Legacy function for backward compatibility
export async function addProductLegacy(product: Omit<Product, "id">, companyID: string, siteID: string): Promise<string> {
  const basePath = `companies/${companyID}/sites/${siteID}/data/stock`
  return addProduct(basePath, product)
}

// Legacy function for backward compatibility
export async function updateProductLegacy(product: Product, companyID: string, siteID: string): Promise<void> {
  const basePath = `companies/${companyID}/sites/${siteID}/data/stock`
  const { id, ...productWithoutId } = product
  return updateProduct(basePath, id, productWithoutId)
}

// Legacy function for backward compatibility
export async function deleteProductLegacy(productId: string, companyID: string, siteID: string): Promise<void> {
  const basePath = `companies/${companyID}/sites/${siteID}/data/stock`
  return deleteProduct(basePath, productId)
}

// Note: saveProduct function is implemented below at line ~1077

export const getStockCountHistory = async (basePath: string) => {
  const snapshot = await get(ref(db, `${basePath}/stockCounts`))
  const data = snapshot.val() || {}
  return Object.values(data)
}

export const getPurchasesHistory = async (basePath: string) => {
  const snapshot = await get(ref(db, `${basePath}/purchases`))
  const data = snapshot.val() || {}
  return Object.values(data)
}

export const getSalesHistory = async (basePath: string) => {
  const snapshot = await get(ref(db, `${basePath}/sales`))
  const data = snapshot.val() || {}
  return Object.values(data)
}

export const fetchPurchases = async (basePath: string) => {
  const snapshot = await get(ref(db, `${basePath}/purchases`))
  const data = snapshot.val() || {}
  return Object.values(data)
}

export const fetchPurchasesHistory = async (basePath: string): Promise<any[]> => {
  const snapshot = await get(ref(db, `${basePath}/purchases`))
  const data = snapshot.val() || {}
  return Object.values(data)
}

export const fetchSalesHistory = async (basePath: string): Promise<any[]> => {
  const snapshot = await get(ref(db, `${basePath}/sales`))
  const data = snapshot.val() || {}
  return Object.values(data)
}

export const saveProduct = async (
  product: Product,
  basePath: string,
  editing: boolean,
): Promise<void> => {
  // Validate product data
  if (!product.name) {
    throw new Error("Product name is required")
  }

  // Check for duplicate purchase units
  if (product.purchase?.units) {
    const purchaseCombinations = new Set<string>()
    for (const unit of product.purchase.units) {
      const key = `${(unit as any).supplierId || 'default'}-${unit.measure}`
      if (purchaseCombinations.has(key)) {
        throw new Error("Duplicate supplier and measure combinations are not allowed")
      }
      purchaseCombinations.add(key)
    }
  }

  // Check for duplicate sales units
  if (product.sale?.units) {
    const salesMeasures = new Set<string>()
    for (const unit of product.sale.units) {
      if (salesMeasures.has(unit.measure)) {
        throw new Error("Duplicate sales measures are not allowed")
      }
      salesMeasures.add(unit.measure)
    }
  }

  // Calculate tax amounts if tax percentages are provided
  if (product.taxPercent && product.purchase?.price) {
    product.taxAmount = (product.purchase.price * product.taxPercent) / 100
  }

  // Save the product
  const productsRef = ref(db, `${basePath}/products`)
  if (editing && product.id) {
    await update(child(productsRef, product.id), product)
  } else {
    const newProductRef = push(productsRef)
    await set(newProductRef, product)
  }
}

export const createMeasure = async (
  measureData: { name: string; quantity: string; unit: string },
  basePath: string,
) => {
  const unitsRef = ref(db, `${basePath}/measures`)
  await set(push(unitsRef), measureData)
}

export const fetchMeasureData = async (
  measureId: string,
  basePath: string,
): Promise<{ totalQuantity: number; unit: string }> => {
  if (!measureId) {
    console.warn("fetchMeasureData: measureId is empty or undefined")
    throw new Error("Measure ID is required")
  }
  
  if (!basePath) {
    console.warn("fetchMeasureData: basePath is empty or undefined")
    throw new Error("Base path is required")
  }

  try {
    const measureRef = ref(db, `${basePath}/measures/${measureId}`)
    const snapshot = await get(measureRef)
    
    if (snapshot.exists()) {
      const measureData = snapshot.val() as {
        quantity: number | string
        unit: string
      }
      
      if (!measureData) {
        console.warn(`fetchMeasureData: measure data is null for ID: ${measureId}`)
        throw new Error(`Measure data is null for ID: ${measureId}`)
      }
      
      const qty =
        typeof measureData.quantity === "string" ? Number.parseFloat(measureData.quantity) : measureData.quantity || 1
      const unit = (measureData.unit || "unit").toLowerCase()
      
      if (unit === "kg") {
        return { totalQuantity: qty * 1000, unit: "g" }
      } else if (unit === "l") {
        return { totalQuantity: qty * 1000, unit: "ml" }
      }
      return { totalQuantity: qty, unit: measureData.unit }
    } else {
      console.warn(`fetchMeasureData: Measure not found in database for ID: ${measureId} at path: ${basePath}/measures/${measureId}`)
      throw new Error(`Measure not found for ID: ${measureId}`)
    }
  } catch (error) {
    console.error(`fetchMeasureData: Error fetching measure ${measureId}:`, error)
    throw error
  }
}

export const createSupplier = async (
  supplierData: {
    name: string
    address: string
    ref: string
    orderUrl: string
    contacts: { name: string; email: string; phone: string }[]
    description?: string
  },
  basePath: string,
): Promise<string> => {
  const suppliersRef = ref(db, `${basePath}/suppliers`)
  const newRef = push(suppliersRef)
  const id = newRef.key || ""
  await set(newRef, { id, ...supplierData })
  return id
}

export const updateSupplier = async (basePath: string, supplierId: string, supplierData: any): Promise<void> => {
  try {
    const supplierRef = ref(db, `${basePath}/suppliers/${supplierId}`)
    await set(supplierRef, supplierData)
  } catch (error) {
    console.error('Error updating supplier:', error)
    throw error
  }
}

export const deleteSupplier = async (basePath: string, supplierId: string): Promise<void> => {
  try {
    const supplierRef = ref(db, `${basePath}/suppliers/${supplierId}`)
    await remove(supplierRef)
  } catch (error) {
    console.error('Error deleting supplier:', error)
    throw error
  }
}

export const createCategory = async (categoryData: any, basePath: string): Promise<void> => {
  try {
    console.log("Creating category:", categoryData)
    console.log("Category color field:", categoryData.color)
    
    const categoryWithTimestamp = {
      ...categoryData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    console.log("Category with timestamp:", categoryWithTimestamp)
    console.log("Color in timestamped data:", categoryWithTimestamp.color)

    let path = ""
    if (categoryData.kind === "SaleDivision") {
      path = `${basePath}/salesDivisions`
    } else if (categoryData.kind === "Category") {
      path = `${basePath}/categories`
    } else if (categoryData.kind === "Subcategory") {
      path = `${basePath}/subcategories`
    }

    const catRef = ref(db, path)
    const newCategoryRef = push(catRef)
    await set(newCategoryRef, { ...categoryWithTimestamp, id: newCategoryRef.key })
    
    console.log("Category created successfully")
  } catch (error) {
    console.error("Error creating category:", error)
    throw error
  }
}

export const updateCategory = async (
  categoryId: string,
  categoryData: any,
  basePath: string,
  kind: string,
): Promise<void> => {
  try {
    console.log("Updating category:", categoryId, categoryData)
    
    const categoryWithTimestamp = {
      ...categoryData,
      updatedAt: new Date().toISOString(),
    }

    let path = ""
    if (kind === "SaleDivision") {
      path = `${basePath}/salesDivisions/${categoryId}`
    } else if (kind === "Category") {
      path = `${basePath}/categories/${categoryId}`
    } else if (kind === "Subcategory") {
      path = `${basePath}/subcategories/${categoryId}`
    }

    const categoryRef = ref(db, path)
    await set(categoryRef, categoryWithTimestamp)
    
    console.log("Category updated successfully")
  } catch (error) {
    console.error("Error updating category:", error)
    throw error
  }
}

export const deleteCategory = async (categoryId: string, kind: string, basePath: string): Promise<void> => {
  try {
    console.log("Deleting category:", categoryId, kind)
    
    let path = ""
    if (kind === "SaleDivision") {
      path = `${basePath}/salesDivisions/${categoryId}`
    } else if (kind === "Category") {
      path = `${basePath}/categories/${categoryId}`
    } else if (kind === "Subcategory") {
      path = `${basePath}/subcategories/${categoryId}`
    }

    const categoryRef = ref(db, path)
    await remove(categoryRef)
    
    console.log("Category deleted successfully")
  } catch (error) {
    console.error("Error deleting category:", error)
    throw error
  }
}


export const getItemMeasures = async (
  itemId: string,
 basePath: string,
): Promise<{
  default: {
    measureId: string
    quantity: number
    supplierId: string
    cost: number
  } | null
  alternatives: Array<{
    measureId: string
    quantity: number
    supplierId: string
    cost: number
  }>
}> => {
  try {
    const productRef = ref(db, `${basePath}/products/${itemId}`)
    const snapshot = await get(productRef)

    if (!snapshot.exists()) {
      return { default: null, alternatives: [] }
    }

    const product = snapshot.val()
    if (!product.purchase) {
      return { default: null, alternatives: [] }
    }

    const defaultMeasure = product.purchase.defaultMeasure
    const defaultUnit = product.purchase.units.find((u: any) => u.measure === defaultMeasure)

    // Return null if no default unit or no valid supplierId
    if (!defaultUnit?.supplierId) {
      return { default: null, alternatives: [] }
    }

    const defaultDetails = {
      measureId: defaultMeasure,
      quantity: defaultUnit.amount || 1,
      supplierId: defaultUnit.supplierId,
      cost: defaultUnit.price || 0
    }

    const alternatives = product.purchase.units
      .filter((u: any) => u.measure !== defaultMeasure && u.supplierId)
      .map((u: any) => ({
        measureId: u.measure,
        quantity: u.amount || 1,
        supplierId: u.supplierId,
        cost: u.price || 0
      }))

    return {
      default: defaultDetails,
      alternatives
    }
  } catch (error) {
    console.error('Error getting item measures:', error)
    return { default: null, alternatives: [] }
  }
}

export const calculateCostPerUnit = (product: Product): number => {
  if (!product.purchase) return 0
  const price = product.purchase.price
  const quantity = product.purchase.quantity
  const unit = product.purchase.measure.toLowerCase()
  let factor = 1
  if (unit === "kg") factor = 1000
  else if (unit === "l") factor = 1000
  return price / (quantity * factor)
}

export const calculateIngredientCost = async (
  ingredient: { itemId: string; measure: string; quantity: number },
  product: Product,
  basePath: string,
): Promise<{ totalCost: number; totalQuantity: number; baseUnit: string }> => {
  const conversion = await fetchMeasureData(ingredient.measure, basePath)
  const totalQuantity = conversion.totalQuantity * ingredient.quantity
  const costPerUnit = calculateCostPerUnit(product)
  const totalCost = costPerUnit * totalQuantity
  return { totalCost, totalQuantity, baseUnit: conversion.unit }
}

export const getConversionGroup = (unit: string): string => {
  const u = unit.toLowerCase()
  if (u === "kg" || u === "g") return "g"
  if (u === "l" || u === "ml") return "ml"
  return u // for example, "single"
}

export const getCompatibleMeasures = (defaultMeasureId: string, measures: any[]): any[] => {
  const defaultMeasure = measures.find((m) => m.id === defaultMeasureId)
  if (!defaultMeasure) return measures // if not found, return all
  const conversionGroup = getConversionGroup(defaultMeasure.unit)
  return measures.filter((m) => getConversionGroup(m.unit) === conversionGroup)
}

export const savePreset = async (basePath: string, presetData: StockPreset) => {
  const presetRef = ref(db, `${basePath}/presets`)
  await set(push(presetRef), presetData)
}

export const getPresets = async (basePath: string): Promise<StockPreset[]> => {
  const presetsRef = ref(db, `${basePath}/presets`)
  const snapshot = await get(presetsRef)

  if (!snapshot.exists()) {
    return []
  }

  // Fetch and format presets efficiently
  const presetsData = snapshot.val() as {
    [key: string]: { [key: string]: { itemID: string; unitID: string } }
  }
  return Object.entries(presetsData).map(([name, items]) => ({
    name,
    items: Object.entries(items).map(([index, item]) => ({
      index: Number(index),
      itemID: item.itemID,
      unitID: item.unitID,
    })),
  }))
}

export async function updatePurchase(basePath: string, purchase: Purchase): Promise<void> {
  try {
    const purchaseRef = ref(db, `${basePath}/purchases/${purchase.id}`)
    await update(purchaseRef, {
      ...purchase,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating purchase:', error)
    throw error
  }
}

export async function createPurchase(basePath: string, purchase: Purchase): Promise<string> {
  try {
    const newPurchaseRef = push(ref(db, `${basePath}/purchases`))
    const purchaseId = newPurchaseRef.key || uuidv4()
    
    await set(newPurchaseRef, {
      ...purchase,
      id: purchaseId,
      createdAt: purchase.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    
    return purchaseId
  } catch (error) {
    console.error('Error creating purchase:', error)
    throw error
  }
}

export async function savePurchase(basePath: string, purchase: Purchase): Promise<string | void> {
  try {
    if (purchase.id) {
      await updatePurchase(basePath, purchase)
      return purchase.id
    } else {
      return await createPurchase(basePath, purchase)
    }
  } catch (error) {
    console.error('Error saving purchase:', error)
    throw error
  }
}

export const addPurchase = createPurchase

export async function deletePurchase(basePath: string, purchaseID: string): Promise<void> {
  try {
    await remove(ref(db, `${basePath}/purchases/${purchaseID}`))
  } catch (error) {
    console.error('Error deleting purchase:', error)
    throw error
  }
}

export async function fetchAllPurchases(basePath: string): Promise<Purchase[]> {
  const purchasesRef = ref(db, `${basePath}/purchases`)
  try {
    const snapshot = await get(purchasesRef)
    if (snapshot.exists()) {
      const purchaseData = snapshot.val()
      const allPurchases = Object.entries(purchaseData).map(([id, data]) => ({
        id,
        ...(data as Purchase),
      }))
      return allPurchases
    } else {
      return []
    }
  } catch (error) {
    console.error("Error fetching purchases:", error)
    return []
  }
}

export async function fetchAllStockCounts(basePath: string): Promise<StockCount[]> {
  const stockRef = ref(db, `${basePath}/stockCounts`)
  try {
    const snapshot = await get(stockRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      // Convert the data into an array of StockCount including the id.
      const allStockCounts = Object.entries(data).map(([id, value]) => ({
        id,
        ...(value as Omit<StockCount, "id">),
      }))
      return allStockCounts
    }
    return []
  } catch (error) {
    console.error("Error fetching stock counts:", error)
    return []
  }
}

export async function saveStockCount(basePath: string, stock: StockCount): Promise<void> {
  if (stock.id) {
    const stockRef = ref(db, `${basePath}/stockCounts/${stock.id}`)
    await update(stockRef, stock)
  } else {
    const stockRef = ref(db, `${basePath}/stockCounts`)
    await set(push(stockRef), stock)
  }
}

export async function fetchLatestCountsForProducts(
  basePath: string,
  products: Product[],
  measures: any[],
): Promise<{
  [productId: string]: {
    baseQuantity: number
    baseUnit: string
    date: string
  }
}> {
  const snapshot = await get(ref(db, `${basePath}/stockCounts`))
  const allCounts = snapshot.val() ? Object.values(snapshot.val()) : []
  const result: {
    [productId: string]: {
      baseQuantity: number
      baseUnit: string
      date: string
    }
  } = {}

  for (const product of products) {
    if (!product.id) continue
    // Filter and sort stock counts that contain an entry for this product.
    const countsWithProduct = allCounts
      .filter((sc: any) => sc.items && sc.items.some((item: any) => item.id === product.id))
      .sort((a: any, b: any) => new Date(b.dateUK).getTime() - new Date(a.dateUK).getTime())
    for (const stock of countsWithProduct as StockCount[]) {
      const entries = stock.items.filter((item: any) => item.id === product.id)
      const grouped: { [unit: string]: number } = {}
      entries.forEach((entry) => {
        const measure = measures.find((m: any) => m.id === entry.measureId)
        if (!measure) return
        // Normalize units: if unit is kg convert to g; if l convert to ml.
        let unit = String(measure.unit).toLowerCase()
        if (unit === "kg") unit = "g"
        else if (unit === "l") unit = "ml"
        const qty = convertToBase(entry.measureId, entry.countedTotal || 0, measures)
        grouped[unit] = (grouped[unit] || 0) + qty
      })
      // Use the default measure from the product's purchase info.
      const defaultMeasureId = product.purchase?.defaultMeasure
      const targetMeasure = measures.find((m: any) => m.id === defaultMeasureId)
      let targetUnit = targetMeasure ? String(targetMeasure.unit).toLowerCase() : null
      if (targetUnit === "kg") targetUnit = "g"
      else if (targetUnit === "l") targetUnit = "ml"
      if (targetUnit && grouped[targetUnit]) {
        result[product.id] = {
          baseQuantity: grouped[targetUnit],
          baseUnit: targetUnit,
          date: stock.dateUK,
        }
        break // Stop after the first (latest) applicable stock count.
      }
    }
  }
  return result
}

export const fetchPresetsFromDB = async (basePath: string): Promise<StockPreset[]> => {
  const presetsRef = ref(db, `${basePath}/presets`)
  const snapshot = await get(presetsRef)

  if (!snapshot.exists()) {
    return []
  }

  const presetsData: Record<
    string,
    {
      name?: string
      items?: Record<string, { itemID?: string; unitID?: string }>
    }
  > = snapshot.val()

  if (!presetsData || typeof presetsData !== "object") {
    console.error("Invalid preset data structure:", presetsData)
    return []
  }

  return Object.entries(presetsData).map(([presetId, preset]) => ({
    id: presetId, // ✅ Store Firebase ID for easy reference
    name: preset.name || "Untitled Preset",
    items: preset.items
      ? Object.entries(preset.items).map(([index, item]) => ({
          index: Number(index) || 0,
          itemID: item.itemID || "",
          unitID: item.unitID || "",
        }))
      : [],
  }))
}

export const savePresetToDB = async (basePath: string, presetData: StockPreset) => {
  const presetRef = ref(db, `${basePath}/presets`)
  await set(push(presetRef), presetData)
}

export async function transferStock(
  companyID: string,
  fromSite: string,
  toSite: string,
  itemID: string,
  currentQuantity: number,
  transferQuantity: number,
  itemData: { itemID: string; name: string; quantity: number },
): Promise<void> {
  // References for the source and destination stock items.
  const fromRef = ref(db, `companies/${companyID}/sites/${fromSite}/data/stock/items/${itemID}`)
  const toRef = ref(db, `companies/${companyID}/sites/${toSite}/data/stock/items/${itemID}`)

  // Deduct stock from the source site.
  await update(fromRef, {
    quantity: currentQuantity - transferQuantity,
  })

  // Get current quantity at destination site.
  const toSnapshot = await get(toRef)
  const currentToQuantity = toSnapshot.exists() ? toSnapshot.val().quantity || 0 : 0

  // Add stock to the destination site.
  await set(toRef, {
    ...itemData,
    quantity: currentToQuantity + transferQuantity,
  })
}

export async function fetchStockLocations(basePath: string): Promise<StockLocation[]> {
  const locationsRef = ref(db, `${basePath}/locations`)
  try {
    const snapshot = await get(locationsRef)
    if (snapshot.exists()) {
      const locations: StockLocation[] = Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        ...(value as Omit<StockLocation, "id">),
      }))
      return locations
    }
    return []
  } catch (error) {
    console.error("Error fetching stock locations:", error)
    return []
  }
}

export async function addStockLocation(
  basePath: string,
  location: Omit<StockLocation, "id">,
): Promise<string> {
  const locationsRef = ref(db, `${basePath}/locations`)
  const newLocationRef = push(locationsRef)
  await set(newLocationRef, location)
  return newLocationRef.key || ""
}

export async function updateStockLocation(basePath: string, location: StockLocation): Promise<void> {
  const locationRef = ref(db, `${basePath}/locations/${location.id}`)
  await update(locationRef, location)
}

export async function deleteStockLocation(basePath: string, locationId: string): Promise<void> {
  const locationRef = ref(db, `${basePath}/locations/${locationId}`)
  await remove(locationRef)
}

export async function fetchFloorPlans(basePath: string): Promise<FloorPlan[]> {
  const floorPlansRef = ref(db, `${basePath}/floorPlans`)
  try {
    const snapshot = await get(floorPlansRef)
    if (snapshot.exists()) {
      const floorPlans: FloorPlan[] = Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        ...(value as Omit<FloorPlan, "id">),
      }))
      return floorPlans
    }
    return []
  } catch (error) {
    console.error("Error fetching floor plans:", error)
    return []
  }
}

export async function fetchTillScreens(basePath: string): Promise<TillScreen[]> {
  const tillScreensRef = ref(db, `${basePath}/tillscreens`)
  try {
    const snapshot = await get(tillScreensRef)
    if (snapshot.exists()) {
      const tillScreens: TillScreen[] = Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        ...(value as Omit<TillScreen, "id">),
      }))
      return tillScreens
    }
    return []
  } catch (error) {
    console.error("Error fetching till screens:", error)
    return []
  }
}

export async function addFloorPlan(
  companyID: string,
  siteID: string,
  floorPlan: Omit<FloorPlan, "id">,
): Promise<string> {
  const floorPlansRef = ref(db, `companies/${companyID}/sites/${siteID}/data/stock/floorPlans`)
  const newFloorPlanRef = push(floorPlansRef)
  await set(newFloorPlanRef, floorPlan)
  return newFloorPlanRef.key || ""
}

export async function updateFloorPlan(basePath: string, floorPlan: FloorPlan): Promise<void> {
  const floorPlanRef = ref(db, `${basePath}/floorPlans/${floorPlan.id}`)
  await update(floorPlanRef, floorPlan)
}

export async function addFloorPlanWithBasePath(basePath: string, floorPlan: Omit<FloorPlan, "id">): Promise<string> {
  const floorPlansRef = ref(db, `${basePath}/floorPlans`)
  const newFloorPlanRef = push(floorPlansRef)
  await set(newFloorPlanRef, floorPlan)
  return newFloorPlanRef.key || ""
}

export async function deleteFloorPlan(basePath: string, floorPlanId: string): Promise<void> {
  const floorPlanRef = ref(db, `${basePath}/floorPlans/${floorPlanId}`)
  await remove(floorPlanRef)
}

export async function fetchTables(basePath: string): Promise<Table[]> {
  const tablesRef = ref(db, `${basePath}/tables`)
  try {
    const snapshot = await get(tablesRef)
    if (snapshot.exists()) {
      const tables: Table[] = Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        ...(value as Omit<Table, "id">),
      }))
      return tables
    }
    return []
  } catch (error) {
    console.error("Error fetching tables:", error)
    return []
  }
}

export async function addTable(basePath: string, table: Omit<Table, "id">): Promise<string> {
  const tablesRef = ref(db, `${basePath}/tables`)
  const newTableRef = push(tablesRef)
  await set(newTableRef, table)
  return newTableRef.key || ""
}

export async function updateTable(basePath: string, table: Table): Promise<void> {
  const tableRef = ref(db, `${basePath}/tables/${table.id}`)
  await update(tableRef, table)
}

export async function deleteTable(basePath: string, tableId: string): Promise<void> {
  const tableRef = ref(db, `${basePath}/tables/${tableId}`)
  await remove(tableRef)
}

export async function updateTillScreen(basePath: string, screen: TillScreen): Promise<void> {
  if (!screen.id) {
    throw new Error("Screen ID is required for update")
  }
  const screenRef = ref(db, `${basePath}/tillScreens/${screen.id}`)
  await update(screenRef, {
    name: screen.name,
    layout: screen.layout,
    settings: screen.settings,
    isDefault: screen.isDefault,
    updatedAt: Date.now(),
  })
}

// Ticket Management RTDatabase Functions
export async function saveTicket(basePath: string, ticket: Ticket): Promise<void> {
  const ticketRef = ref(db, `${basePath}/tickets/${ticket.id}`)
  await set(ticketRef, ticket)
}

export async function updateTicketInDb(basePath: string, ticketId: string, updates: Partial<Ticket>): Promise<void> {
  const ticketRef = ref(db, `${basePath}/tickets/${ticketId}`)
  await update(ticketRef, updates)
}

export async function deleteTicketFromDb(basePath: string, ticketId: string): Promise<void> {
  const ticketRef = ref(db, `${basePath}/tickets/${ticketId}`)
  await remove(ticketRef)
}

export async function fetchTickets(basePath: string): Promise<Ticket[]> {
  const ticketsRef = ref(db, `${basePath}/tickets`)
  const snapshot = await get(ticketsRef)
  
  if (!snapshot.exists()) {
    return []
  }
  
  const ticketsData = snapshot.val()
  return Object.entries(ticketsData).map(([id, data]: [string, any]) => ({
    id,
    ...data,
  }))
}

// Ticket Sales RTDatabase Functions
export async function saveTicketSale(basePath: string, sale: TicketSale): Promise<void> {
  const saleRef = ref(db, `${basePath}/ticketSales/${sale.id}`)
  await set(saleRef, sale)
}

export async function getTicketSaleByQR(basePath: string, qrCode: string): Promise<TicketSale | null> {
  const salesRef = ref(db, `${basePath}/ticketSales`)
  const snapshot = await get(salesRef)
  
  if (!snapshot.exists()) {
    return null
  }
  
  const salesData = snapshot.val()
  const saleEntry = Object.entries(salesData).find(([_, sale]: [string, any]) => sale.qrCode === qrCode)
  
  if (!saleEntry) {
    return null
  }
  
  const [id, data] = saleEntry
  if (data && typeof data === 'object') {
    return { id, ...(data as object) } as TicketSale
  }
  return null
}

export async function updateTicketSaleInDb(basePath: string, saleId: string, updates: Partial<TicketSale>): Promise<void> {
  const saleRef = ref(db, `${basePath}/ticketSales/${saleId}`)
  await update(saleRef, updates)
}

export async function fetchTicketSales(basePath: string): Promise<TicketSale[]> {
  const salesRef = ref(db, `${basePath}/ticketSales`)
  const snapshot = await get(salesRef)
  
  if (!snapshot.exists()) {
    return []
  }
  
  const salesData = snapshot.val()
  return Object.entries(salesData).map(([id, data]: [string, any]) => ({
    id,
    ...data,
  }))
}

// Bag Check RTDatabase Functions
export async function saveBagCheckItem(basePath: string, item: BagCheckItem): Promise<void> {
  const itemRef = ref(db, `${basePath}/bagCheck/${item.id}`)
  await set(itemRef, item)
}

export async function updateBagCheckItemInDb(basePath: string, itemId: string, updates: Partial<BagCheckItem>): Promise<void> {
  const itemRef = ref(db, `${basePath}/bagCheck/${itemId}`)
  await update(itemRef, updates)
}

export async function getBagCheckItemByQR(basePath: string, qrCode: string): Promise<BagCheckItem | null> {
  const itemsRef = ref(db, `${basePath}/bagCheck`)
  const snapshot = await get(itemsRef)
  
  if (!snapshot.exists()) {
    return null
  }
  
  const itemsData = snapshot.val()
  const itemEntry = Object.entries(itemsData).find(([_, item]: [string, any]) => item.qrCode === qrCode)
  
  if (!itemEntry) {
    return null
  }
  
  const [id, data] = itemEntry
  if (data && typeof data === 'object') {
    return { id, ...(data as object) } as BagCheckItem
  }
  return null
}

export async function fetchBagCheckItems(basePath: string): Promise<BagCheckItem[]> {
  const itemsRef = ref(db, `${basePath}/bagCheck`)
  const snapshot = await get(itemsRef)
  
  if (!snapshot.exists()) {
    return []
  }
  
  const itemsData = snapshot.val()
  return Object.entries(itemsData).map(([id, data]: [string, any]) => ({
    id,
    ...data,
  }))
}

// Bag Check Config RTDatabase Functions
export async function fetchBagCheckConfig(basePath: string): Promise<BagCheckConfig | null> {
  const configRef = ref(db, `${basePath}/bagCheckConfig`)
  const snapshot = await get(configRef)
  
  if (!snapshot.exists()) {
    // Return default config
    return {
      id: 'default',
      bagPrice: 5.00,
      coatPrice: 3.00,
      otherPrice: 2.00,
      requirePhone: true,
      requireInitials: true,
      autoGenerateQR: true,
      isActive: true,
      updatedAt: Date.now(),
    }
  }
  
  return snapshot.val()
}

export async function saveBagCheckConfig(basePath: string, config: Partial<BagCheckConfig>): Promise<void> {
  const configRef = ref(db, `${basePath}/data/pos/bagCheckConfig`)
  await update(configRef, config)
}

/**
 * Convert quantity to base units (g for weight, ml for volume)
 * Uses same logic as StockFunctions.convertToBaseUnits
 * 
 * FORMULA: quantity * measure.quantity * unit_multiplier
 * @param measureId - The measure ID to look up
 * @param quantity - The quantity to convert (number of measure units)
 * @param measures - Array of measure definitions
 * @returns Quantity in base units (g, ml, or base count)
 */
export const convertToBase = (measureId: string, quantity: number, measures: any[]): number => {
  // Validate inputs
  if (!quantity || quantity < 0) return 0
  if (!measureId || !measures || measures.length === 0) return quantity
  
  const measure = measures.find((m) => m.id === measureId)
  if (!measure) return quantity
  
  const unit = String(measure.unit || '').toLowerCase().trim()
  const measureQuantity = Number(measure.quantity) || 1
  
  // Validate measure quantity
  if (measureQuantity <= 0) return quantity
  
  // Base conversion
  let baseQuantity = quantity * measureQuantity
  
  // Apply unit multiplier
  if (unit === "kg") {
    baseQuantity *= 1000  // kg to g
  } else if (unit === "l" || unit === "litre" || unit === "liter") {
    baseQuantity *= 1000  // l to ml
  }
  
  return baseQuantity
}

export const fetchParLevels = async (basePath: string): Promise<ParLevelProfile[]> => {
  const parLevelsRef = ref(db, `${basePath}/parLevels`)
  try {
    const snapshot = await get(parLevelsRef)
    if (snapshot.exists()) {
      const parLevels: ParLevelProfile[] = Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        ...(value as Omit<ParLevelProfile, "id">),
      }))
      return parLevels
    }
    return []
  } catch (error) {
    console.error("Error fetching par levels:", error)
    return []
  }
}

export const saveParLevel = async (basePath: string, parLevel: ParLevelProfile): Promise<string> => {
  const parLevelsRef = ref(db, `${basePath}/parLevels`)
  if (parLevel.id) {
    await update(child(parLevelsRef, parLevel.id), parLevel)
    return parLevel.id
  } else {
    const newParLevelRef = push(parLevelsRef)
    await set(newParLevelRef, parLevel)
    return newParLevelRef.key || ""
  }
}

export const deleteParLevel = async (basePath: string, parLevelId: string): Promise<void> => {
  const parLevelRef = ref(db, `${basePath}/parLevels/${parLevelId}`)
  await remove(parLevelRef)
}

export const fetchMeasures = async (basePath: string): Promise<any[]> => {
  const measuresRef = ref(db, `${basePath}/measures`)
  try {
    const snapshot = await get(measuresRef)
    if (snapshot.exists()) {
      const fetched = Object.entries(snapshot.val() as Record<string, any>).map(([id, data]) => ({ id, ...data }))
      return fetched
    }
    return []
  } catch (error) {
    console.error("Error fetching measures:", error)
    return []
  }
}

export const fetchMeasuresFromBasePath = async (basePath: string): Promise<any[]> => {
  const measuresRef = ref(db, `${basePath}/measures`)

  try {
    const snapshot = await get(measuresRef)
    if (snapshot.exists()) {
      const fetched = Object.entries(snapshot.val() as Record<string, any>).map(([id, data]) => ({ id, ...data }))
      return fetched
    }
    return []
  } catch (error) {
    console.error("Error fetching measures:", error)
    return []
  }
}

export const fetchSuppliers = async (basePath: string): Promise<any[]> => {
  const suppliersRef = ref(db, `${basePath}/suppliers`)
  try {
    const snapshot = await get(suppliersRef)
    if (snapshot.exists()) {
      const fetched = Object.entries(snapshot.val() as Record<string, any>).map(([id, data]) => ({ id, ...data }))
      return fetched
    }
    return []
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    return []
  }
}

export const fetchStockItems = async (basePath: string): Promise<StockItem[]> => {
  const stockItemsRef = ref(db, `${basePath}/items`)
  try {
    const snapshot = await get(stockItemsRef)
    if (snapshot.exists()) {
      const stockItems: StockItem[] = Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        ...(value as Omit<StockItem, "id">),
      }))
      return stockItems
    }
    return []
  } catch (error) {
    console.error("Error fetching stock items:", error)
    return []
  }
}

export const addStockItem = async (basePath: string, item: Omit<StockItem, "id">): Promise<string> => {
  const stockItemsRef = ref(db, `${basePath}/items`)
  const newItemRef = push(stockItemsRef)
  await set(newItemRef, item)
  return newItemRef.key || ""
}

export const updateStockItem = async (basePath: string, item: StockItem): Promise<void> => {
  const itemRef = ref(db, `${basePath}/items/${item.id}`)
  await update(itemRef, item)
}

export const deleteStockItem = async (basePath: string, itemId: string): Promise<void> => {
  const itemRef = ref(db, `${basePath}/items/${itemId}`)
  await remove(itemRef)
}

export const fetchSuppliersData = async (basePath: string): Promise<Supplier[]> => {
  const suppliersRef = ref(db, `${basePath}/suppliers`)
  try {
    const snapshot = await get(suppliersRef)
    if (snapshot.exists()) {
      const suppliers: Supplier[] = Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        ...(value as Omit<Supplier, "id">),
      }))
      return suppliers
    }
    return []
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    return []
  }
}

export const fetchSuppliersFromBasePath = async (basePath: string): Promise<Supplier[]> => {
  const suppliersRef = ref(db, `${basePath}/suppliers`)
  try {
    const snapshot = await get(suppliersRef)
    if (snapshot.exists()) {
      const suppliers: Supplier[] = Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        ...(value as Omit<Supplier, "id">),
      }))
      return suppliers
    }
    return []
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    return []
  }
}

export const addSupplier = async (
  basePath: string,
  supplier: Omit<Supplier, "id">,
): Promise<string> => {
  try {
    const suppliersRef = ref(db, `${basePath}/suppliers`)
    const newSupplierRef = push(suppliersRef)
    const supplierId = newSupplierRef.key || ""
    
    await set(newSupplierRef, {
      ...supplier,
      id: supplierId,
      createdAt: supplier.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    
    return supplierId
  } catch (error) {
    console.error('Error adding supplier:', error)
    throw error
  }
}

export const fetchPurchaseOrders = async (basePath: string): Promise<PurchaseOrder[]> => {
  const purchaseOrdersRef = ref(db, `${basePath}/purchaseOrders`)
  try {
    const snapshot = await get(purchaseOrdersRef)
    if (snapshot.exists()) {
      const purchaseOrders: PurchaseOrder[] = Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        ...(value as Omit<PurchaseOrder, "id">),
      }))
      return purchaseOrders
    }
    return []
  } catch (error) {
    console.error("Error fetching purchase orders:", error)
    return []
  }
}

export const addPurchaseOrder = async (
  basePath: string,
  purchaseOrder: Omit<PurchaseOrder, "id">,
): Promise<string> => {
  const purchaseOrdersRef = ref(db, `${basePath}/purchaseOrders`)
  const newPurchaseOrderRef = push(purchaseOrdersRef)
  await set(newPurchaseOrderRef, purchaseOrder)
  return newPurchaseOrderRef.key || ""
}

export const updatePurchaseOrder = async (
  basePath: string,
  purchaseOrder: PurchaseOrder,
): Promise<void> => {
  const purchaseOrderRef = ref(
    db,
    `${basePath}/purchaseOrders/${purchaseOrder.id}`,
  )
  await update(purchaseOrderRef, purchaseOrder)
}

// Add missing functions referenced in frontend components
export const fetchLocations = async (basePath: string): Promise<Location[]> => {
  try {
    const locationsRef = ref(db, `${basePath}/locations`)
    const snapshot = await get(locationsRef)
    
    if (snapshot.exists()) {
      return Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
        id,
        ...data,
      }))
    }
    return []
  } catch (error) {
    console.error("Error fetching locations:", error)
    throw error
  }
}


export const fetchCurrentStock = async (basePath: string): Promise<any[]> => {
  try {
    const stockRef = ref(db, `${basePath}/current`)
    const snapshot = await get(stockRef)
    
    if (snapshot.exists()) {
      return Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
        id,
        ...data,
      }))
    }
    return []
  } catch (error) {
    console.error("Error fetching current stock:", error)
    throw error
  }
}

export const createTable = async (basePath: string, table: Omit<Table, "id">): Promise<string> => {
  const tableBasePath = `${basePath}/data/stock`
  return addTable(tableBasePath, table)
}

export const saveFloorPlan = async (basePath: string, floorPlan: FloorPlan): Promise<string> => {
  const floorPlanBasePath = `${basePath}/data/stock`
  if (floorPlan.id) {
    await updateFloorPlan(floorPlanBasePath, floorPlan)
    return floorPlan.id
  } else {
    return addFloorPlanWithBasePath(floorPlanBasePath, floorPlan)
  }
}

// Function to fetch measure units (alias for fetchMeasures)
export const fetchMeasureUnits = async (basePath: string): Promise<any[]> => {
  try {
    const measuresBasePath = `${basePath}/data/stock/measures`
    const snapshot = await get(ref(db, measuresBasePath))
    
    if (snapshot.exists()) {
      const measures: any[] = []
      snapshot.forEach((childSnapshot) => {
        const measure = {
          id: childSnapshot.key,
          ...childSnapshot.val(),
        }
        measures.push(measure)
      })
      return measures
    }
    return []
  } catch (error) {
    console.error('Error fetching measure units:', error)
    return []
  }
}

// Note: fetchStockCounts2 is already defined elsewhere in this file

export const deletePurchaseOrder = async (
  basePath: string,
  purchaseOrderId: string,
): Promise<void> => {
  const purchaseOrderRef = ref(
    db,
    `${basePath}/data/stock/purchaseOrders/${purchaseOrderId}`,
  )
  await remove(purchaseOrderRef)
}

export async function updateStockCountStatus(
  basePath: string,
  stockCountId: string,
  status: "Awaiting Submission" | "Awaiting Approval" | "Approved",
): Promise<void> {
  const stockRef = ref(db, `${basePath}/data/stock/stockCounts/${stockCountId}`)
  await update(stockRef, { status })
}

export async function updatePurchaseStatus(
  basePath: string,
  purchaseId: string,
  status: "Awaiting Submission" | "Awaiting Approval" | "Approved",
): Promise<void> {
  const purchaseRef = ref(db, `${basePath}/data/stock/purchases/${purchaseId}`)
  await update(purchaseRef, { status })
}

export function combineDuplicateStockItems(items: StockCountItem[]): StockCountItem[] {
  const combined = new Map<string, StockCountItem>()

  items.forEach((item) => {
    const key = `${item.id}-${item.measureId}`
    if (combined.has(key)) {
      const existing = combined.get(key)!
      existing.countedQuantity += item.countedQuantity
      existing.countedTotal += item.countedTotal
    } else {
      combined.set(key, { ...item })
    }
  })

  return Array.from(combined.values())
}

export function combineDuplicatePurchaseItems(items: PurchaseItem[]): PurchaseItem[] {
  const combined = new Map<string, PurchaseItem>()

  items.forEach((item) => {
    const key = `${item.itemID}-${item.measureId}-${item.supplierId}`
    if (combined.has(key)) {
      const existing = combined.get(key)!
      existing.quantity += item.quantity
      existing.totalPrice += item.totalPrice
      existing.taxAmount = (existing.taxAmount || 0) + (item.taxAmount || 0)
      existing.priceExcludingVAT = (existing.priceExcludingVAT || 0) + (item.priceExcludingVAT || 0)
    } else {
      combined.set(key, { ...item })
    }
  })

  return Array.from(combined.values())
}

// Add missing till screen function
export const fetchTillScreen = async (basePath: string, screenId: string): Promise<any> => {
  const screenRef = ref(db, `${basePath}/data/stock/tillScreens/${screenId}`)
  const snapshot = await get(screenRef)
  if (snapshot.exists()) {
    return {
      id: screenId,
      ...snapshot.val(),
    }
  }
  return null
}

// Update saveTillScreen to accept screenId parameter
export const saveTillScreenWithId = async (
  basePath: string,
  screenId: string,
  screenData: any,
): Promise<void> => {
  const screenRef = ref(db, `${basePath}/data/stock/tillScreens/${screenId}`)
  await set(screenRef, screenData)
}

// Stock Items
export const fetchStockItems2 = async (basePath: string): Promise<StockItem[]> => {
  try {
    const stockItemsRef = ref(db, `${basePath}/data/stock/items`)
    const snapshot = await get(stockItemsRef)

    if (snapshot.exists()) {
      return Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
        id,
        ...data,
      }))
    }
    return []
  } catch (error) {
    console.error("Error fetching stock items:", error)
    throw error
  }
}

export const createStockItem2 = async (basePath: string, item: Omit<StockItem, "id">): Promise<StockItem> => {
  try {
    const stockItemsRef = ref(db, `${basePath}/data/stock/items`)
    const newItemRef = push(stockItemsRef)
    const id = newItemRef.key as string

    const newItem = {
      ...item,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await set(newItemRef, newItem)
    return newItem
  } catch (error) {
    console.error("Error creating stock item:", error)
    throw error
  }
}

export const updateStockItem2 = async (
  basePath: string,
  itemId: string,
  updates: Partial<StockItem>,
): Promise<void> => {
  try {
    const itemRef = ref(db, `${basePath}/data/stock/items/${itemId}`)
    const updatedFields = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    await update(itemRef, updatedFields)
  } catch (error) {
    console.error("Error updating stock item:", error)
    throw error
  }
}

export const deleteStockItem2 = async (basePath: string, itemId: string): Promise<void> => {
  try {
    const itemRef = ref(db, `${basePath}/data/stock/items/${itemId}`)
    await remove(itemRef)
  } catch (error) {
    console.error("Error deleting stock item:", error)
    throw error
  }
}

// Suppliers
export const fetchSuppliers2 = async (basePath: string): Promise<Supplier[]> => {
  try { 
    const suppliersRef = ref(db, `${basePath}/data/stock/suppliers`)
    const snapshot = await get(suppliersRef)

    if (snapshot.exists()) {
      return Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
        id,
        ...data,
      }))
    }
    return []
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    throw error
  }
}

export const createSupplier2 = async (basePath: string, supplier: Omit<Supplier, "id">): Promise<Supplier> => {
  try {
    const suppliersRef = ref(db, `${basePath}/data/stock/suppliers`)
    const newSupplierRef = push(suppliersRef)
    const id = newSupplierRef.key as string

    const newSupplier = {
      ...supplier,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await set(newSupplierRef, newSupplier)
    return newSupplier
  } catch (error) {
    console.error("Error creating supplier:", error)
    throw error
  }
}

// Purchase Orders
export const fetchPurchaseOrders2 = async (basePath: string): Promise<PurchaseOrder[]> => {
  try {
    const purchaseOrdersRef = ref(db, `${basePath}/data/stock/purchaseOrders`)
    const snapshot = await get(purchaseOrdersRef)

    if (snapshot.exists()) {
      return Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
        id,
        ...data,
      }))
    }
    return []
  } catch (error) {
    console.error("Error fetching purchase orders:", error)
    throw error
  }
}

export const createPurchaseOrder2 = async (
  basePath: string,
  purchaseOrder: Omit<PurchaseOrder, "id">,
): Promise<PurchaseOrder> => {
  try {
    const purchaseOrdersRef = ref(db, `${basePath}/purchaseOrders`)
    const newPurchaseOrderRef = push(purchaseOrdersRef)
    const id = newPurchaseOrderRef.key as string

    const newPurchaseOrder = {
      ...purchaseOrder,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await set(newPurchaseOrderRef, newPurchaseOrder)
    return newPurchaseOrder
  } catch (error) {
    console.error("Error creating purchase order:", error)
    throw error
  }
}

// Stock Counts
export const fetchStockCounts2 = async (basePath: string): Promise<StockCount[]> => {
  try {
    const stockCountsRef = ref(db, `${basePath}/stockCounts`)
    const snapshot = await get(stockCountsRef)

    if (snapshot.exists()) {
      return Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
        id,
        ...data,
      }))
    }
    return []
  } catch (error) {
    console.error("Error fetching stock counts:", error)
    throw error
  }
}

export const createStockCount2 = async (basePath: string, stockCount: Omit<StockCount, "id">): Promise<StockCount> => {
  try {
    const stockCountsRef = ref(db, `${basePath}/data/stock/stockCounts`)
    const newStockCountRef = push(stockCountsRef)
    const id = newStockCountRef.key as string

    const newStockCount = {
      ...stockCount,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await set(newStockCountRef, newStockCount)
    return newStockCount
  } catch (error) {
    console.error("Error creating stock count:", error)
    throw error
  }
}

export const updateStockCount2 = async (
  basePath: string,
  stockCountId: string,
  updates: Partial<StockCount>,
): Promise<void> => {
  try {
    const stockCountRef = ref(db, `${basePath}/data/stock/stockCounts/${stockCountId}`)
    const updatedFields = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    await update(stockCountRef, updatedFields)
  } catch (error) {
    console.error("Error updating stock count:", error)
    throw error
  }
}

export const deleteStockCount2 = async (basePath: string, stockCountId: string): Promise<void> => {
  try {
    const stockCountRef = ref(db, `${basePath}/data/stock/stockCounts/${stockCountId}`)
    await remove(stockCountRef)
  } catch (error) {
    console.error("Error deleting stock count:", error)
    throw error
  }
}

// Stock Movement/Adjustments
export const adjustStockLevel2 = async (
  basePath: string,
  itemId: string,
  adjustment: number,
  reason: string,
  userId: string,
): Promise<void> => {
  try {
    // Get current stock item
    const itemRef = ref(db, `${basePath}/data/stock/items/${itemId}`)
    const itemSnapshot = await get(itemRef)

    if (!itemSnapshot.exists()) {
      throw new Error("Stock item not found")
    }

    const currentItem = itemSnapshot.val()
    const newQuantity = Math.max(0, (currentItem.currentStock || 0) + adjustment)

    // Update stock level
    await update(itemRef, {
      currentStock: newQuantity,
      updatedAt: new Date().toISOString(),
    })

    // Record stock movement
    const movementsRef = ref(db, `${basePath}/data/stock/stockMovements`)
    const newMovementRef = push(movementsRef)

    await set(newMovementRef, {
      itemId,
      type: adjustment > 0 ? "adjustment_in" : "adjustment_out",
      quantity: Math.abs(adjustment),
      reason,
      userId,
      timestamp: new Date().toISOString(),
      previousStock: currentItem.currentStock || 0,
      newStock: newQuantity,
    })
  } catch (error) {
    console.error("Error adjusting stock level:", error)
    throw error
  }
}

// Low Stock Alerts
export const getLowStockItems2 = async (basePath: string): Promise<StockItem[]> => {
  try {
    const stockItems = await fetchStockItems2(basePath)
    return stockItems.filter((item) => item.currentStock <= (item.reorderLevel || 0) && item.trackStock !== false)
  } catch (error) {
    console.error("Error getting low stock items:", error)
    throw error
  }
}

// Stock Valuation
export const calculateStockValuation2 = async (
  basePath: string,
): Promise<{
  totalValue: number
  totalItems: number
  lowStockCount: number
}> => {
  try {
    const stockItems = await fetchStockItems2(basePath)

    const totalValue = stockItems.reduce((sum, item) => sum + (item.currentStock || 0) * (item.costPrice || 0), 0)

    const totalItems = stockItems.length

    const lowStockCount = stockItems.filter((item) => item.currentStock <= (item.reorderLevel || 0)).length

    return {
      totalValue,
      totalItems,
      lowStockCount,
    }
  } catch (error) {
    console.error("Error calculating stock valuation:", error)
    throw error
  }
}

// Location Management
export const addLocation = async (
  basePath: string,
  location: Omit<Location, 'id'>
): Promise<Location> => {
  try {
    const locationsRef = ref(db, `${basePath}/data/stock/locations`);
    const newLocationRef = push(locationsRef);
    const newLocation = {
      ...location,
      id: newLocationRef.key as string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await set(newLocationRef, newLocation);
    return newLocation;
  } catch (error) {
    console.error('Error adding location:', error);
    throw error;
  }
};

export const updateLocation = async (
  basePath: string,
  locationId: string,
  updates: Partial<Location> = {}  // Make updates optional with default empty object
): Promise<void> => {
  try {
    const locationRef = ref(db, `${basePath}/data/stock/locations/${locationId}`);
    await update(locationRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

// Update supplier type to be required

// Additional Till System Functions for complete POS functionality
export async function createSaleRecord(basePath: string, saleData: any): Promise<string> {
  const salesRef = ref(db, `${basePath}/data/pos/sales`)
  const newSaleRef = push(salesRef)
  const saleId = newSaleRef.key || ""
  
  const sale = {
    ...saleData,
    id: saleId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  
  await set(newSaleRef, sale)
  
  // Update product stock levels if items exist
  if (saleData.items && Array.isArray(saleData.items)) {
    for (const item of saleData.items) {
      await updateProductStockLevel(basePath, item.productId, -item.quantity)
    }
  }
  
  return saleId
}

export async function updateProductStockLevel(basePath: string, productId: string, quantityChange: number): Promise<void> {
  const productRef = ref(db, `${basePath}/products/${productId}`)
  const snapshot = await get(productRef)
  
  if (snapshot.exists()) {
    const product = snapshot.val()
    const currentStock = product.currentStock || 0
    const newStock = Math.max(0, currentStock + quantityChange)
    
    await update(productRef, {
      currentStock: newStock,
      updatedAt: Date.now(),
    })
  }
}
interface PurchaseDetails {
  measureId: string
  quantity: number
  supplierId: string
  cost: number
}

// Helper function to check if unit has valid supplierId
function hasValidSupplierId(unit: { supplierId?: string }): unit is { supplierId: string } {
  return typeof unit?.supplierId === 'string';
}

export const getPurchaseDetails = async (
  product: Product,
  measureId: string
): Promise<PurchaseDetails | null> => {
  if (!product.purchase) return null;

  const unit = product.purchase.units.find(u => u.measure === measureId);
  if (!unit || !hasValidSupplierId(unit)) return null;

  const details: PurchaseDetails = {
    measureId,
    quantity: unit.quantity || 1,
    supplierId: unit.supplierId,
    cost: unit.price || 0
  };

  return details;
};

// BasePath versions of fetch functions for subsite support
export const fetchSalesDivisionsFromBasePath = async (basePath: string): Promise<any[]> => {
  const salesDivisionsRef = ref(db, `${basePath}/salesDivisions`)
  try {
    const snapshot = await get(salesDivisionsRef)
    if (snapshot.exists()) {
      const fetched = Object.entries(snapshot.val() as Record<string, any>).map(([id, data]) => ({ id, ...data }))
      return fetched
    }
    return []
  } catch (error) {
    console.error("Error fetching sales divisions:", error)
    return []
  }
}

export const fetchCategoriesFromBasePath = async (basePath: string): Promise<any[]> => {
  const categoriesRef = ref(db, `${basePath}/categories`)
  try {
    const snapshot = await get(categoriesRef)
    if (snapshot.exists()) {
      const fetched = Object.entries(snapshot.val() as Record<string, any>).map(([id, data]) => ({ id, ...data }))
      return fetched
    }
    return []
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

export const fetchSubcategoriesFromBasePath = async (basePath: string): Promise<any[]> => {
  const subcategoriesRef = ref(db, `${basePath}/subcategories`)
  try {
    const snapshot = await get(subcategoriesRef)
    if (snapshot.exists()) {
      const fetched = Object.entries(snapshot.val() as Record<string, any>).map(([id, data]) => ({ id, ...data }))
      return fetched
    }
    return []
  } catch (error) {
    console.error("Error fetching subcategories:", error)
    return []
  }
}

export const fetchAllPurchasesFromBasePath = async (basePath: string): Promise<Purchase[]> => {
  const purchasesRef = ref(db, `${basePath}/purchases`)
  try {
    const snapshot = await get(purchasesRef)
    if (snapshot.exists()) {
      const purchases: Purchase[] = Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        ...(value as Omit<Purchase, "id">),
      }))
      return purchases
    }
    return []
  } catch (error) {
    console.error("Error fetching purchases:", error)
    return []
  }
}

export const fetchAllStockCountsFromBasePath = async (basePath: string): Promise<StockCount[]> => {
  const stockRef = ref(db, `${basePath}/stockCounts`)
  try {
    const snapshot = await get(stockRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      const allStockCounts = Object.entries(data).map(([id, value]) => ({
        id,
        ...(value as Omit<StockCount, "id">),
      }))
      return allStockCounts
    }
    return []
  } catch (error) {
    console.error("Error fetching stock counts:", error)
    return []
  }
}

export const fetchStockItemsFromBasePath = async (basePath: string): Promise<StockItem[]> => {
  const stockItemsRef = ref(db, `${basePath}/items`)
  try {
    const snapshot = await get(stockItemsRef)
    if (snapshot.exists()) {
      const stockItems: StockItem[] = Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        ...(value as Omit<StockItem, "id">),
      }))
      return stockItems
    }
    return []
  } catch (error) {
    console.error("Error fetching stock items:", error)
    return []
  }
}

export const fetchPurchaseOrdersFromBasePath = async (basePath: string): Promise<PurchaseOrder[]> => {
  const purchaseOrdersRef = ref(db, `${basePath}/purchaseOrders`)
  try {
    const snapshot = await get(purchaseOrdersRef)
    if (snapshot.exists()) {
      const purchaseOrders: PurchaseOrder[] = Object.entries(snapshot.val()).map(([id, value]) => ({
        id,
        ...(value as Omit<PurchaseOrder, "id">),
      }))
      return purchaseOrders
    }
    return []
  } catch (error) {
    console.error("Error fetching purchase orders:", error)
    return []
  }
}

export const fetchLatestCountsForProductsFromBasePath = async (basePath: string, products: any[], measures: any[]): Promise<Record<string, any>> => {
  try {
    // Use the existing fetchLatestCountsForProducts implementation
    return await fetchLatestCountsForProducts(basePath, products, measures)
  } catch (error) {
    console.error("Error fetching latest counts:", error)
    return {}
  }
}

export const fetchPurchasesHistoryFromBasePath = async (basePath: string): Promise<any[]> => {
  const purchasesRef = ref(db, `${basePath}/data/stock/purchases`)
  try { 
    const snapshot = await get(purchasesRef)
    if (snapshot.exists()) {
      return Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...(data as Record<string, any>) }))
    }
    return []
  } catch (error) {
    console.error("Error fetching purchases history:", error)
    return []
  }
}

export const fetchSalesHistoryFromBasePath = async (basePath: string): Promise<any[]> => {
  const salesRef = ref(db, `${basePath}/data/pos/sales`)
  try {
    const snapshot = await get(salesRef)
    if (snapshot.exists()) {
      return Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...(data as Record<string, any>) }))
    }
    return []
  } catch (error) {
    console.error("Error fetching sales history:", error)
    return []
  }
}

// Par Level Profile Functions
export async function saveParLevelProfile(basePath: string, profile: ParLevelProfile): Promise<void> {
  try {
    console.log("Saving par level profile:", profile)
    
    // Clean the profile data to remove undefined values
    const cleanedProfile = cleanProfileData(profile)
    
    const profileData = {
      ...cleanedProfile,
      updatedAt: new Date().toISOString()
    }
    
    if (profile.id) {
      // Update existing profile
      const profileRef = ref(db, `${basePath}/data/stock/parProfiles/${profile.id}`)
      await set(profileRef, profileData)
    } else {
      // Create new profile
      const profilesRef = ref(db, `${basePath}/data/stock/parProfiles`)
      const newProfileRef = push(profilesRef)
      const profileId = newProfileRef.key as string
      
      const newProfile = {
        ...profileData,
        id: profileId,
        createdAt: new Date().toISOString()
      }
      
      await set(newProfileRef, newProfile)
    }
    
    console.log("Par level profile saved successfully")
  } catch (error) {
    console.error("Error saving par level profile:", error)
    throw error
  }
}

// Helper function to clean profile data and remove undefined values
function cleanProfileData(profile: ParLevelProfile): ParLevelProfile {
  const cleanedProfile = { ...profile }
  
  if (cleanedProfile.parLevels) {
    const cleanedParLevels: { [key: string]: any } = {}
    
    Object.entries(cleanedProfile.parLevels).forEach(([productId, value]) => {
      if (typeof value === "object" && value !== null) {
        const cleanedValue: any = {}
        
        // Only include defined properties
        if (typeof value.parLevel === "number") {
          cleanedValue.parLevel = value.parLevel
        }
        
        if (value.measureId && typeof value.measureId === "string" && value.measureId.trim() !== "") {
          cleanedValue.measureId = value.measureId.trim()
        }
        
        // Only add the value if it has valid data
        if (cleanedValue.parLevel !== undefined) {
          if (cleanedValue.measureId) {
            cleanedParLevels[productId] = cleanedValue
          } else {
            // If no measureId, just save as number
            cleanedParLevels[productId] = cleanedValue.parLevel
          }
        }
      } else if (typeof value === "number") {
        cleanedParLevels[productId] = value
      }
    })
    
    cleanedProfile.parLevels = cleanedParLevels
  }
  
  return cleanedProfile
}

export async function fetchParProfiles(basePath: string): Promise<ParLevelProfile[]> {
  try {
    console.log("Fetching par level profiles from basePath:", basePath)
    const profilesRef = ref(db, `${basePath}/data/stock/parProfiles`)
    const snapshot = await get(profilesRef)
    
    if (snapshot.exists()) {
      const profilesData = snapshot.val()
      const profiles: ParLevelProfile[] = Object.entries(profilesData).map(([id, data]: [string, any]) => ({
        id,
        ...data
      }))
      
      console.log("Fetched par level profiles:", profiles)
      return profiles
    }
    
    console.log("No par level profiles found")
    return []
  } catch (error) {
    console.error("Error fetching par level profiles:", error)
    return []
  }
}

export async function deleteParProfile(basePath: string, profileId: string): Promise<void> {
  try {
    console.log("Deleting par level profile:", profileId)
    const profileRef = ref(db, `${basePath}/data/stock/parProfiles/${profileId}`)
    await remove(profileRef)
    console.log("Par level profile deleted successfully")
  } catch (error) {
    console.error("Error deleting par level profile:", error)
    throw error
  }
}

// ===== STOCK CONTEXT DATABASE FUNCTIONS =====

// Course operations
export async function fetchCourses(basePath: string): Promise<any[]> {
  try {
    const coursesRef = ref(db, `${basePath}/courses`)
    const snapshot = await get(coursesRef)
    if (snapshot.exists()) {
      const coursesData = snapshot.val()
      return Object.entries(coursesData)
        .map(([id, data]) => ({
          id,
          ...(data as any),
        }))
        .filter((course) => course.active !== false)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    }
    return []
  } catch (error) {
    console.error("Error fetching courses:", error)
    throw error
  }
}

export async function saveCourse(basePath: string, course: any): Promise<void> {
  try {
    const courseId = Date.now().toString()
    const courseRef = ref(db, `${basePath}/courses/${courseId}`)
    await set(courseRef, {
      ...course,
      id: courseId,
      displayOrder: 0,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error saving course:", error)
    throw error
  }
}

export async function updateCourse(basePath: string, courseId: string, course: any): Promise<void> {
  try {
    const courseRef = ref(db, `${basePath}/courses/${courseId}`)
    await update(courseRef, {
      ...course,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error updating course:", error)
    throw error
  }
}

export async function deleteCourse(basePath: string, courseId: string): Promise<void> {
  try {
    const courseRef = ref(db, `${basePath}/courses/${courseId}`)
    await remove(courseRef)
  } catch (error) {
    console.error("Error deleting course:", error)
    throw error
  }
}

// Measure operations
export async function saveMeasureToBasePath(basePath: string, measure: any): Promise<void> {
  try {
    const newMeasureRef = ref(db, `${basePath}/measures`)
    const measureRef = push(newMeasureRef)
    const measureId = measureRef.key as string
    await set(measureRef, {
      ...measure,
      id: measureId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error saving measure:", error)
    throw error
  }
}

export async function updateMeasureInBasePath(basePath: string, measureId: string, measure: any): Promise<void> {
  try {
    const measureRef = ref(db, `${basePath}/measures/${measureId}`)
    await update(measureRef, {
      ...measure,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error updating measure:", error)
    throw error
  }
}

export async function deleteMeasureFromBasePath(basePath: string, measureId: string): Promise<void> {
  try {
    const measureRef = ref(db, `${basePath}/measures/${measureId}`)
    await remove(measureRef)
  } catch (error) {
    console.error("Error deleting measure:", error)
    throw error
  }
}


