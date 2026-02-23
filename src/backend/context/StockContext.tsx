"use client"

import React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import { useCompany } from "./CompanyContext"
import { useSettings } from "./SettingsContext"
import { createNotification } from "../functions/Notifications"
// SiteContext has been merged into CompanyContext
import * as StockDB from "../rtdatabase/Stock"
import * as StockFunctions from "../functions/Stock"
import { measurePerformance } from "../utils/PerformanceTimer"
import { createCachedFetcher } from "../utils/CachedFetcher"
import type { 
  Product, 
  StockData, 
  Purchase, 
  StockCount,
  StockState,
  StockAction,
  StockContextType,
  StockProviderProps
} from "../interfaces/Stock"

// Interfaces moved to interfaces/Stock.tsx

// Initial state
const initialState: StockState = {
  companyID: null,
  siteID: null,
  subsiteID: null,
  products: [],
  suppliers: [],
  measures: [],
  salesDivisions: [],
  categories: [],
  subcategories: [],
  subCategories: [],  // Alias for backward compatibility
  courses: [],
  purchases: [],
  stockCounts: [],
  stockItems: [],
  purchaseOrders: [],
  parLevels: [],
  latestCounts: {},
  purchaseHistory: [],
  salesHistory: [],
  loading: false,
  error: null,
  dataVersion: 0, // Increments on data changes to trigger re-renders
}

// Reducer
const stockReducer = (state: StockState, action: StockAction): StockState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false }
    case "SET_COMPANY_ID":
      return { ...state, companyID: action.payload }
    case "SET_SITE_ID":
      return { ...state, siteID: action.payload }
    case "SET_SUBSITE_ID":
      return { ...state, subsiteID: action.payload }
    case "SET_PRODUCTS":
      return { ...state, products: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_SUPPLIERS":
      return { ...state, suppliers: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_MEASURES":
      return { ...state, measures: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_SALES_DIVISIONS":
      return { ...state, salesDivisions: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_CATEGORIES":
      return { ...state, categories: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_SUBCATEGORIES":
      return { ...state, subcategories: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_PURCHASES":
      return { ...state, purchases: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_STOCK_COUNTS":
      return { ...state, stockCounts: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_STOCK_ITEMS":
      return { ...state, stockItems: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_PURCHASE_ORDERS":
      return { ...state, purchaseOrders: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_LATEST_COUNTS":
      return { ...state, latestCounts: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_PURCHASE_HISTORY":
      return { ...state, purchaseHistory: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_SALES_HISTORY":
      return { ...state, salesHistory: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_ALL_DATA":
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null,
        dataVersion: state.dataVersion + 1,
      }
    case "ADD_PRODUCT":
      return { ...state, products: [...state.products, action.payload], dataVersion: state.dataVersion + 1 }
    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map((p) => (p.id === action.payload.id ? action.payload : p)),
        dataVersion: state.dataVersion + 1,
      }
    case "DELETE_PRODUCT":
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
        dataVersion: state.dataVersion + 1,
      }
    case "ADD_SUPPLIER":
      return { ...state, suppliers: [...state.suppliers, action.payload], dataVersion: state.dataVersion + 1 }
    case "UPDATE_SUPPLIER":
      return {
        ...state,
        suppliers: state.suppliers.map((s) => (s.id === action.payload.id ? action.payload : s)),
        dataVersion: state.dataVersion + 1,
      }
    case "DELETE_SUPPLIER":
      return {
        ...state,
        suppliers: state.suppliers.filter((s) => s.id !== action.payload),
        dataVersion: state.dataVersion + 1,
      }
    default:
      return state
  }
}

// Context
// StockContextType interface moved to interfaces/Stock.tsx

const StockContext = createContext<StockContextType | undefined>(undefined)

// Provider component
// StockProviderProps interface moved to interfaces/Stock.tsx

export const StockProvider: React.FC<StockProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(stockReducer, initialState)
  const { state: companyState, isOwner, hasPermission } = useCompany()
  const { state: settingsState } = useSettings()
  
  // Track if we're currently loading data and last loaded path
  const isLoading = React.useRef(false)
  const lastLoadedPath = React.useRef<string>("")
  const isInitialized = React.useRef(false)

  // Update company and site IDs when they change
  React.useEffect(() => {
    dispatch({ type: "SET_COMPANY_ID", payload: companyState.companyID || null })
    dispatch({ type: "SET_SITE_ID", payload: companyState.selectedSiteID || null })
    dispatch({ type: "SET_SUBSITE_ID", payload: companyState.selectedSubsiteID || null })
  }, [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID])

  // Compute and track the base path for stock module
  const basePath = React.useMemo(() => {
    if (!companyState.companyID) return ""
    
    // For stock data, check both site and subsite levels
    // This matches the actual Firebase data structure
    let root = `companies/${companyState.companyID}`
    
    if (companyState.selectedSiteID) {
      root += `/sites/${companyState.selectedSiteID}`
      
      // If subsite is selected, also check subsite level
      if (companyState.selectedSubsiteID) {
        root += `/subsites/${companyState.selectedSubsiteID}`
      }
    }
    
    return `${root}/data/stock`
  }, [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID])

  // Helper function to get multiple possible paths for stock data
  const getStockPaths = React.useCallback(() => {
    if (!companyState.companyID) return []
    
    const paths = []
    const companyRoot = `companies/${companyState.companyID}`
    
    if (companyState.selectedSiteID) {
      // If subsite is selected, prioritize subsite level first
      if (companyState.selectedSubsiteID) {
        paths.push(`${companyRoot}/sites/${companyState.selectedSiteID}/subsites/${companyState.selectedSubsiteID}/data/stock`)
        paths.push(`${companyRoot}/sites/${companyState.selectedSiteID}/data/stock`)
      } else {
        // If no subsite selected, only check site level
        paths.push(`${companyRoot}/sites/${companyState.selectedSiteID}/data/stock`)
      }
    }
    
    return paths
  }, [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID])

  // Helper functions with useCallback to prevent unnecessary re-creation
  const refreshProducts = React.useCallback(async () => {
    const paths = getStockPaths()
    if (paths.length === 0) return
    
    // Prevent multiple simultaneous calls
    if (isLoading.current) {
      console.log("Products refresh already in progress, skipping")
      return
    }
    
    try {
      // Try each path until we find data
      for (const path of paths) {
        try {
          await StockFunctions.refreshProducts(path, StockDB.fetchProducts, dispatch)
          console.log(`Products loaded from path: ${path}`)
          return // Success, exit early
        } catch (error) {
          console.log(`No products found at path: ${path}`)
          continue // Try next path
        }
      }
      console.log("No products found at any path")
    } catch (error) {
      console.error("Error refreshing products:", error)
    }
  }, [getStockPaths, dispatch])

  const refreshSuppliers = React.useCallback(async () => {
    const paths = getStockPaths()
    if (paths.length === 0) return
    
    try {
      // Try each path until we find data
      for (const path of paths) {
        try {
          await StockFunctions.refreshSuppliers(path, StockDB.fetchSuppliersFromBasePath, dispatch)
          console.log(`Suppliers loaded from path: ${path}`)
          return // Success, exit early
        } catch (error) {
          console.log(`No suppliers found at path: ${path}`)
          continue // Try next path
        }
      }
      console.log("No suppliers found at any path")
    } catch (error) {
      console.error("Error refreshing suppliers:", error)
    }
  }, [getStockPaths, dispatch])

  const refreshMeasures = React.useCallback(async () => {
    const paths = getStockPaths()
    if (paths.length === 0) return
    
    try {
      // Try each path until we find data
      for (const path of paths) {
        try {
          await StockFunctions.refreshMeasures(path, StockDB.fetchMeasuresFromBasePath, dispatch)
          console.log(`Measures loaded from path: ${path}`)
          return // Success, exit early
        } catch (error) {
          console.log(`No measures found at path: ${path}`)
          continue // Try next path
        }
      }
      console.log("No measures found at any path")
    } catch (error) {
      console.error("Error refreshing measures:", error)
    }
  }, [getStockPaths, dispatch])

  // Create cached fetchers for critical data
  const fetchProductsCached = React.useMemo(() => createCachedFetcher(StockDB.fetchProducts, 'products'), [])
  const fetchMeasuresCached = React.useMemo(() => createCachedFetcher(StockDB.fetchMeasuresFromBasePath, 'measures'), [])

  const refreshAll = React.useCallback(async () => {
    const paths = getStockPaths()
    if (paths.length === 0) {
      // Ensure loading is false if no paths available
      dispatch({ type: "SET_LOADING", payload: false })
      return
    }
    
    try {
      await measurePerformance('StockContext', 'refreshAll', async () => {
        dispatch({ type: "SET_LOADING", payload: true })
        
        try {
        const basePath = paths[0] || ""
        
        // Helper to fetch from first available path
        const fetchFromPaths = async <T,>(fetchFn: (path: string) => Promise<T[]>): Promise<T[]> => {
          for (const path of paths) {
            try {
              const data = await fetchFn(path)
              if (data && data.length > 0) return data
            } catch (error) {
              console.warn(`Failed to load from ${path}:`, error)
              continue
            }
          }
          return []
        }
        
        // PROGRESSIVE LOADING: Critical data first (for immediate UI)
        const [products, measures] = await Promise.all([
          fetchProductsCached(basePath, false).catch(() => fetchFromPaths(StockDB.fetchProducts)),
          fetchMeasuresCached(basePath, false).catch(() => fetchFromPaths(StockDB.fetchMeasuresFromBasePath)),
        ])
        
        // Fetch latest counts if we have products and measures
        let latestCounts: Record<string, any> = {}
        if (products.length > 0 && measures.length > 0) {
          for (const path of paths) {
            try {
              latestCounts = await StockDB.fetchLatestCountsForProductsFromBasePath(path, products, measures)
              if (Object.keys(latestCounts).length > 0) break
            } catch (error) {
              continue
            }
          }
        }
        
        // Update critical data immediately
        dispatch({
          type: "SET_ALL_DATA",
          payload: {
            products: products || [],
            measures: measures || [],
            latestCounts,
            suppliers: [],
            salesDivisions: [],
            categories: [],
            subcategories: [],
            purchases: [],
            stockCounts: [],
            stockItems: [],
            purchaseOrders: [],
            purchaseHistory: [],
            salesHistory: [],
          },
        })
        
        isInitialized.current = true
        lastLoadedPath.current = basePath
        console.log("📦 StockContext: Critical data loaded (products, measures) for", basePath)
        
        // BACKGROUND: Load non-critical data after (non-blocking)
        const loadBackgroundData = () => {
          Promise.all([
            fetchFromPaths(StockDB.fetchSuppliersFromBasePath),
            fetchFromPaths(StockDB.fetchCategoriesFromBasePath),
            fetchFromPaths(StockDB.fetchSubcategoriesFromBasePath),
            fetchFromPaths(StockDB.fetchSalesDivisionsFromBasePath),
            fetchFromPaths(StockDB.fetchCourses),
          ]).then(([suppliers, categories, subcategories, salesDivisions]) => {
            dispatch({
              type: "SET_ALL_DATA",
              payload: {
                products: [],
                suppliers: suppliers || [],
                measures: [],
                salesDivisions: salesDivisions || [],
                categories: categories || [],
                subcategories: subcategories || [],
                purchases: [],
                stockCounts: [],
                stockItems: [],
                purchaseOrders: [],
                latestCounts: {},
                purchaseHistory: [],
                salesHistory: [],
              },
            })
            console.log("📦 StockContext: Background data loaded for", basePath)
          }).catch(error => {
            console.warn('Error loading background stock data:', error)
          })
        }
        
        // Use requestIdleCallback if available, otherwise setTimeout
        if ('requestIdleCallback' in window) {
          requestIdleCallback(loadBackgroundData, { timeout: 2000 })
        } else {
          setTimeout(loadBackgroundData, 100)
        }
        
      } catch (error) {
        console.error("Error refreshing all stock data:", error)
        dispatch({ type: "SET_ERROR", payload: "Failed to load stock data" })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
        isLoading.current = false
      }
      }, () => ({
        products: state.products.length,
        suppliers: state.suppliers.length,
        measures: state.measures.length,
      }))
    } catch (error) {
      // Ensure loading is cleared even if measurePerformance fails
      console.error("Error in measurePerformance wrapper:", error)
      dispatch({ type: "SET_LOADING", payload: false })
      isLoading.current = false
      throw error
    }
  }, [getStockPaths, dispatch, state.products, state.measures, fetchProductsCached, fetchMeasuresCached])

  const getStockData = (): StockData => {
    return StockFunctions.getStockData(state.products, state.suppliers, state.measures)
  }

  // Permission functions - Owner has full access
  // Check for dashboard permission (which exists in default permissions) or any stock permission
  const canViewStock = React.useCallback(() => {
    if (isOwner()) return true
    
    // If permissions aren't loaded yet, allow access (will be checked again when loaded)
    // This prevents blocking users during initial load
    const perms = companyState.permissions
    if (!perms || !perms.roles) {
      if (process.env.NODE_ENV === 'development') {
        console.log("🔍 canViewStock: No permissions loaded, allowing access (fail-open)")
      }
      return true
    }
    
    // Check for dashboard permission (most common) or items permission
    const hasAccess = hasPermission("stock", "dashboard", "view") || 
                      hasPermission("stock", "items", "view") ||
                      hasPermission("stock", "orders", "view") ||
                      hasPermission("stock", "counts", "view") ||
                      hasPermission("stock", "categories", "view") ||
                      hasPermission("stock", "suppliers", "view") ||
                      hasPermission("stock", "reports", "view")
    
    // If no explicit permission found, check default permissions for user's role
    // This handles cases where permissions might not be fully configured
    if (!hasAccess) {
      const userRole = companyState.user?.role?.toLowerCase() || perms.defaultRole || 'staff'
      const rolePerms = perms.roles?.[userRole]?.modules?.stock
      
      if (rolePerms) {
        const hasDefaultAccess = Boolean(
          rolePerms.dashboard?.view || 
          rolePerms.items?.view || 
          rolePerms.orders?.view ||
          rolePerms.counts?.view ||
          rolePerms.categories?.view ||
          rolePerms.suppliers?.view ||
          rolePerms.reports?.view
        )
        
        if (process.env.NODE_ENV === 'development' && !hasDefaultAccess) {
          console.log("🔍 canViewStock: No stock permissions found for role:", userRole, "permissions:", rolePerms)
        }
        
        return hasDefaultAccess
      } else {
        // If role not found in permissions, check if default role has access
        const defaultRolePerms = perms.roles?.[perms.defaultRole || 'staff']?.modules?.stock
        if (defaultRolePerms) {
          return Boolean(
            defaultRolePerms.dashboard?.view || 
            defaultRolePerms.items?.view || 
            defaultRolePerms.orders?.view ||
            defaultRolePerms.counts?.view
          )
        }
        
        // Last resort: if permissions structure exists but no role matches, allow access
        // This prevents blocking users when permissions aren't properly configured
        if (process.env.NODE_ENV === 'development') {
          console.warn("🔍 canViewStock: Role not found in permissions, allowing access (fail-open)", {
            userRole,
            availableRoles: Object.keys(perms.roles || {}),
            defaultRole: perms.defaultRole
          })
        }
        return true
      }
    }
    
    return hasAccess
  }, [isOwner, hasPermission, companyState.permissions, companyState.user?.role])

  const canEditStock = React.useCallback(() => {
    if (isOwner()) return true
    // Check for dashboard edit permission or items edit permission
    return hasPermission("stock", "dashboard", "edit") || 
           hasPermission("stock", "items", "edit") ||
           hasPermission("stock", "orders", "edit") ||
           hasPermission("stock", "counts", "edit")
  }, [isOwner, hasPermission])

  const canDeleteStock = React.useCallback(() => {
    if (isOwner()) return true
    // Check for dashboard delete permission or items delete permission
    return hasPermission("stock", "dashboard", "delete") || 
           hasPermission("stock", "items", "delete") ||
           hasPermission("stock", "orders", "delete") ||
           hasPermission("stock", "counts", "delete")
  }, [isOwner, hasPermission])

  const ownerCheck = React.useCallback(() => {
    return isOwner()
  }, [isOwner])

  // Data operation functions (product operations moved to end)

  const savePurchase = React.useCallback(async (purchase: Purchase) => {
    if (!basePath) return
    try {
      await StockDB.savePurchase(basePath, purchase)
      await refreshAll()
    } catch (error) {
      console.error("Error saving purchase:", error)
      throw error
    }
  }, [basePath, refreshAll])

  const fetchAllPurchases = React.useCallback(async (): Promise<Purchase[]> => {
    if (!basePath) return []
    try {
      return await StockDB.fetchAllPurchasesFromBasePath(basePath)
    } catch (error) {
      console.error("Error fetching purchases:", error)
      throw error
    }
  }, [basePath])

  const deletePurchase = React.useCallback(async (purchaseId: string) => {
    if (!basePath) return
    try {
      await StockDB.deletePurchase(basePath, purchaseId)
      await refreshAll()
    } catch (error) {
      console.error("Error deleting purchase:", error)
      throw error
    }
  }, [basePath, refreshAll])

  const saveStockCount = React.useCallback(async (stockCount: StockCount) => {
    if (!basePath) return
    try {
      await StockDB.saveStockCount(basePath, stockCount)
      await refreshAll()
    } catch (error) {
      console.error("Error saving stock count:", error)
      throw error
    }
  }, [basePath, refreshAll])

  const fetchAllStockCounts = React.useCallback(async (): Promise<StockCount[]> => {
    if (!basePath) return []
    try {
      return await StockDB.fetchAllStockCountsFromBasePath(basePath)
    } catch (error) {
      console.error("Error fetching stock counts:", error)
      throw error
    }
  }, [basePath])

  const deleteStockCount = React.useCallback(async (stockCountId: string) => {
    if (!basePath) return
    try {
      await StockDB.deleteStockCount2(basePath, stockCountId)
      await refreshAll()
    } catch (error) {
      console.error("Error deleting stock count:", error)
      throw error
    }
  }, [basePath, refreshAll])

  const fetchLatestCountsForProducts = React.useCallback(async (): Promise<Record<string, any>> => {
    const paths = getStockPaths()
    if (paths.length === 0 || !state.products.length || !state.measures.length) return {}
    
    try {
      // Try each path until we find data
      for (const path of paths) {
        try {
          const counts = await StockDB.fetchLatestCountsForProductsFromBasePath(path, state.products, state.measures)
          if (counts && Object.keys(counts).length > 0) {
            console.log(`Latest counts loaded from path: ${path}`)
            return counts
          }
        } catch (error) {
          console.log(`No latest counts found at path: ${path}`)
          continue // Try next path
        }
      }
      console.log("No latest counts found at any path")
      return {}
    } catch (error) {
      console.error("Error fetching latest counts:", error)
      throw error
    }
  }, [getStockPaths, state.products, state.measures])

  const saveParLevelProfile = React.useCallback(async (profile: any) => {
    if (!basePath) return
    try {
      await StockDB.saveParLevelProfile(basePath, profile)
    } catch (error) {
      console.error("Error saving par level profile:", error)
      throw error
    }
  }, [basePath])

  const fetchParProfiles = React.useCallback(async (): Promise<any[]> => {
    const paths = getStockPaths()
    if (paths.length === 0) return []
    
    try {
      // Try each path until we find data
      for (const path of paths) {
        try {
          const profiles = await StockDB.fetchParProfiles(path)
          if (profiles && profiles.length > 0) {
            console.log(`Par profiles loaded from path: ${path}`)
            return profiles
          }
        } catch (error) {
          console.log(`No par profiles found at path: ${path}`)
          continue // Try next path
        }
      }
      console.log("No par profiles found at any path")
      return []
    } catch (error) {
      console.error("Error fetching par profiles:", error)
      throw error
    }
  }, [getStockPaths])

  const deleteParProfile = React.useCallback(async (profileId: string) => {
    if (!basePath) return
    try {
      await StockDB.deleteParProfile(basePath, profileId)
    } catch (error) {
      console.error("Error deleting par profile:", error)
      throw error
    }
  }, [basePath])

  const fetchMeasureData = React.useCallback(async (measureId: string): Promise<any> => {
    if (!basePath) return null
    try {
      return await StockDB.fetchMeasureData(basePath, measureId)
    } catch (error) {
      console.error("Error fetching measure data:", error)
      throw error
    }
  }, [basePath])

  const fetchSalesHistory = React.useCallback(async (): Promise<any[]> => {
    const paths = getStockPaths()
    if (paths.length === 0) return []
    
    try {
      // Try each path until we find data
      for (const path of paths) {
        try {
          const sales = await StockDB.fetchSalesHistoryFromBasePath(path)
          if (sales && sales.length > 0) {
            console.log(`Sales history loaded from path: ${path}`)
            return sales
          }
        } catch (error) {
          console.log(`No sales history found at path: ${path}`)
          continue // Try next path
        }
      }
      console.log("No sales history found at any path")
      return []
    } catch (error) {
      console.error("Error fetching sales history:", error)
      throw error
    }
  }, [getStockPaths])

  const fetchPurchasesHistory = React.useCallback(async (): Promise<any[]> => {
    const paths = getStockPaths()
    if (paths.length === 0) return []
    
    try {
      // Try each path until we find data
      for (const path of paths) {
        try {
          const purchases = await StockDB.fetchPurchasesHistoryFromBasePath(path)
          if (purchases && purchases.length > 0) {
            console.log(`Purchases history loaded from path: ${path}`)
            return purchases
          }
        } catch (error) {
          console.log(`No purchases history found at path: ${path}`)
          continue // Try next path
        }
      }
      console.log("No purchases history found at any path")
      return []
    } catch (error) {
      console.error("Error fetching purchases history:", error)
      throw error
    }
  }, [getStockPaths])

  const fetchCurrentStock = React.useCallback(async (): Promise<any[]> => {
    const paths = getStockPaths()
    if (paths.length === 0) return []
    
    try {
      // Try each path until we find data
      for (const path of paths) {
        try {
          const stock = await StockDB.fetchCurrentStock(path)
          if (stock && stock.length > 0) {
            console.log(`Current stock loaded from path: ${path}`)
            return stock
          }
        } catch (error) {
          console.log(`No current stock found at path: ${path}`)
          continue // Try next path
        }
      }
      console.log("No current stock found at any path")
      return []
    } catch (error) {
      console.error("Error fetching current stock:", error)
      throw error
    }
  }, [getStockPaths])

  const fetchPresetsFromDB = React.useCallback(async (): Promise<any[]> => {
    if (!basePath) return []
    try {
      return await StockDB.fetchPresetsFromDB(basePath)
    } catch (error) {
      console.error("Error fetching presets:", error)
      throw error
    }
  }, [basePath])

  const savePresetToDB = React.useCallback(async (presetData: any) => {
    if (!basePath) return
    try {
      await StockDB.savePresetToDB(basePath, presetData)
    } catch (error) {
      console.error("Error saving preset:", error)
      throw error
    }
  }, [basePath])

  const fetchCourses = React.useCallback(async (): Promise<any[]> => {
    if (!basePath) return []
    try {
      return await StockDB.fetchCourses(basePath)
    } catch (error) {
      console.error("Error fetching courses:", error)
      throw error
    }
  }, [basePath])

  const saveCourse = React.useCallback(async (course: any) => {
    if (!basePath) return
    try {
      await StockDB.saveCourse(basePath, course)
    } catch (error) {
      console.error("Error saving course:", error)
      throw error
    }
  }, [basePath])

  const updateCourse = React.useCallback(async (courseId: string, course: any) => {
    if (!basePath) return
    try {
      await StockDB.updateCourse(basePath, courseId, course)
    } catch (error) {
      console.error("Error updating course:", error)
      throw error
    }
  }, [basePath])

  const deleteCourse = React.useCallback(async (courseId: string) => {
    if (!basePath) return
    try {
      await StockDB.deleteCourse(basePath, courseId)
    } catch (error) {
      console.error("Error deleting course:", error)
      throw error
    }
  }, [basePath])

  const createSupplier = React.useCallback(async (supplier: any) => {
    if (!basePath) return
    try {
      await StockDB.createSupplier2(basePath, supplier)
      await refreshSuppliers()
    } catch (error) {
      console.error("Error creating supplier:", error)
      throw error
    }
  }, [basePath, refreshSuppliers])

  const updateSupplier = React.useCallback(async (supplierId: string, supplier: any) => {
    if (!basePath) return
    try {
      await StockDB.updateSupplier(basePath, supplierId, supplier)
      await refreshSuppliers()
    } catch (error) {
      console.error("Error updating supplier:", error)
      throw error
    }
  }, [basePath, refreshSuppliers])

  const createProduct = React.useCallback(async (product: any) => {
    console.log("🔍 StockContext: createProduct called")
    console.log("🔍 StockContext: basePath:", basePath)
    console.log("🔍 StockContext: companyState:", {
      companyID: companyState.companyID,
      selectedSiteID: companyState.selectedSiteID,
      selectedSubsiteID: companyState.selectedSubsiteID
    })
    console.log("🔍 StockContext: product data:", product)
    
    if (!basePath) {
      console.log("❌ StockContext: No basePath available, cannot create product")
      return undefined
    }
    
    try {
      console.log("🔍 StockContext: Calling StockFunctions.createProduct with basePath:", basePath)
      const createdProduct = await StockFunctions.createProduct(basePath, product)
      console.log("✅ StockContext: Product created successfully:", createdProduct)
      
      console.log("🔍 StockContext: Refreshing products...")
      await refreshProducts()
      console.log("✅ StockContext: Products refreshed")
      
      return createdProduct.id
    } catch (error) {
      console.error("❌ StockContext: Error creating product:", error)
      throw error
    }
  }, [basePath, refreshProducts, companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID])

  const updateProduct = React.useCallback(async (productId: string, product: any) => {
    if (!basePath) return
    try {
      await StockFunctions.updateProduct(basePath, productId, product)
      // Instead of refreshing all products, just update the specific product in state
      dispatch({ 
        type: "UPDATE_PRODUCT", 
        payload: { id: productId, ...product, updatedAt: new Date().toISOString() }
      })
    } catch (error) {
      console.error("Error updating product:", error)
      throw error
    }
  }, [basePath])

  const deleteSupplier = React.useCallback(async (supplierId: string) => {
    if (!basePath) return
    try {
      await StockDB.deleteSupplier(basePath, supplierId)
      await refreshSuppliers()
    } catch (error) {
      console.error("Error deleting supplier:", error)
      throw error
    }
  }, [basePath, refreshSuppliers])

  const fetchLocations = React.useCallback(async (): Promise<any[]> => {
    if (!basePath) return []
    try {
      return await StockDB.fetchLocations(basePath)
    } catch (error) {
      console.error("Error fetching locations:", error)
      throw error
    }
  }, [basePath])

  const updateLocation = React.useCallback(async (locationId: string, location: any) => {
    if (!basePath) return
    try {
      await StockDB.updateLocation(basePath, locationId, location)
    } catch (error) {
      console.error("Error updating location:", error)
      throw error
    }
  }, [basePath])

  const deleteLocation = React.useCallback(async (locationId: string) => {
    if (!basePath) return
    try {
      await StockDB.deleteLocation(basePath, locationId)
    } catch (error) {
      console.error("Error deleting location:", error)
      throw error
    }
  }, [basePath])

  const fetchSuppliers = React.useCallback(async (): Promise<any[]> => {
    if (!basePath) return []
    try {
      return await StockDB.fetchSuppliersFromBasePath(basePath)
    } catch (error) {
      console.error("Error fetching suppliers:", error)
      throw error
    }
  }, [basePath])

  const fetchMeasures = React.useCallback(async (): Promise<any[]> => {
    if (!basePath) return []
    try {
      return await StockDB.fetchMeasuresFromBasePath(basePath)
    } catch (error) {
      console.error("Error fetching measures:", error)
      throw error
    }
  }, [basePath])

  const saveMeasure = React.useCallback(async (measure: any) => {
    if (!basePath) return
    try {
      await StockDB.saveMeasureToBasePath(basePath, measure)
      await refreshMeasures()
    } catch (error) {
      console.error("Error saving measure:", error)
      throw error
    }
  }, [basePath, refreshMeasures])

  const updateMeasure = React.useCallback(async (measureId: string, measure: any) => {
    if (!basePath) return
    try {
      await StockDB.updateMeasureInBasePath(basePath, measureId, measure)
      await refreshMeasures()
    } catch (error) {
      console.error("Error updating measure:", error)
      throw error
    }
  }, [basePath, refreshMeasures])

  const deleteMeasure = React.useCallback(async (measureId: string) => {
    if (!basePath) return
    try {
      await StockDB.deleteMeasureFromBasePath(basePath, measureId)
      await refreshMeasures()
    } catch (error) {
      console.error("Error deleting measure:", error)
      throw error
    }
  }, [basePath, refreshMeasures])

  const getGoogleMapsApiKey = React.useCallback((): string => {
    return StockFunctions.getGoogleMapsApiKey()
  }, [])

  const parseAddressComponents = React.useCallback((components: any[]): any => {
    return StockFunctions.parseAddressComponents(components)
  }, [])

  // createLocation function removed - doesn't exist in backend


  // Stock Locations CRUD
  const createStockLocation = React.useCallback(async (locationData: any) => {
    if (!basePath) return
    try {
      const locationId = await StockFunctions.createStockLocation(basePath, locationData)
      await refreshAll() // Refresh to get updated locations
      return locationId
    } catch (error) {
      console.error("Error creating stock location:", error)
      throw error
    }
  }, [basePath, refreshAll])

  const updateStockLocation = React.useCallback(async (locationId: string, locationData: any) => {
    if (!basePath) return
    try {
      await StockFunctions.updateStockLocation(basePath, locationId, locationData)
      await refreshAll() // Refresh to get updated locations
    } catch (error) {
      console.error("Error updating stock location:", error)
      throw error
    }
  }, [basePath, refreshAll])

  const deleteStockLocation = React.useCallback(async (locationId: string) => {
    if (!basePath) return
    try {
      await StockFunctions.deleteStockLocation(basePath, locationId)
      await refreshAll() // Refresh to get updated locations
    } catch (error) {
      console.error("Error deleting stock location:", error)
      throw error
    }
  }, [basePath, refreshAll])

  // Par Levels CRUD
  const createParLevel = React.useCallback(async (parLevelData: any) => {
    if (!basePath) return
    try {
      const parLevelId = await StockFunctions.createParLevel(basePath, parLevelData)
      await refreshAll() // Refresh to get updated par levels
      return parLevelId
    } catch (error) {
      console.error("Error creating par level:", error)
      throw error
    }
  }, [basePath, refreshAll])

  const updateParLevel = React.useCallback(async (parLevelId: string, parLevelData: any) => {
    if (!basePath) return
    try {
      await StockFunctions.updateParLevel(basePath, parLevelId, parLevelData)
      await refreshAll() // Refresh to get updated par levels
    } catch (error) {
      console.error("Error updating par level:", error)
      throw error
    }
  }, [basePath, refreshAll])

  const deleteParLevel = React.useCallback(async (parLevelId: string) => {
    if (!basePath) return
    try {
      await StockFunctions.deleteParLevel(basePath, parLevelId)
      await refreshAll() // Refresh to get updated par levels
    } catch (error) {
      console.error("Error deleting par level:", error)
      throw error
    }
  }, [basePath, refreshAll])

  const fetchProductById = React.useCallback(async (productId: string): Promise<Product | null> => {
    if (!basePath) return null
    try {
      return await StockDB.fetchProductById(basePath, productId)
    } catch (error) {
      console.error("Error fetching product by ID:", error)
      throw error
    }
  }, [basePath])

  const saveProduct = React.useCallback(async (product: Product, isUpdate: boolean = false) => {
    if (!basePath) return
    try {
      await StockDB.saveProduct(product, basePath, isUpdate)
      
      // Add notification
      try {
        await createNotification(
          companyState.companyID,
          settingsState.auth?.uid || 'system',
          'stock',
          isUpdate ? 'updated' : 'created',
          isUpdate ? 'Product Updated' : 'Product Added',
          `${product.name} was ${isUpdate ? 'updated' : 'added to inventory'}`,
          {
            siteId: companyState.selectedSiteID || undefined,
            priority: 'medium',
            category: isUpdate ? 'info' : 'success',
            details: {
              entityId: product.id,
              entityName: product.name,
              newValue: product,
              changes: {
                product: { from: isUpdate ? null : {}, to: product }
              }
            }
          }
        )
      } catch (notificationError) {
        console.warn('Failed to create notification:', notificationError)
      }
      
      await refreshProducts()
    } catch (error) {
      console.error("Error saving product:", error)
      throw error
    }
  }, [basePath, refreshProducts, companyState.companyID, companyState.selectedSiteID, settingsState.auth?.uid])

  const deleteProduct = React.useCallback(async (productId: string) => {
    if (!basePath) return
    try {
      // Get product info before deletion for notification
      const productToDelete = state.products.find(p => p.id === productId)
      
      await StockDB.deleteProduct(basePath, productId)
      
      // Add notification
      if (productToDelete) {
        try {
          await createNotification(
            companyState.companyID,
            settingsState.auth?.uid || 'system',
            'stock',
            'deleted',
            'Product Removed',
            `${productToDelete.name} was removed from inventory`,
            {
              siteId: companyState.selectedSiteID || undefined,
              priority: 'medium',
              category: 'warning',
              details: {
                entityId: productId,
                entityName: productToDelete.name,
                oldValue: productToDelete,
                changes: {
                  product: { from: productToDelete, to: null }
                }
              }
            }
          )
        } catch (notificationError) {
          console.warn('Failed to create notification:', notificationError)
        }
      }
      
      await refreshProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      throw error
    }
  }, [basePath, refreshProducts, state.products, companyState.companyID, companyState.selectedSiteID, settingsState.auth?.uid])

  // Till screen functions
  const fetchTillScreen = React.useCallback(async (screenId: string): Promise<any> => {
    if (!basePath) return null
    try {
      return await StockDB.fetchTillScreen(basePath, screenId)
    } catch (error) {
      console.error("Error fetching till screen:", error)
      throw error
    }
  }, [basePath])

  const saveTillScreenWithId = React.useCallback(async (screenId: string, screenData: any) => {
    if (!basePath) return
    try {
      await StockDB.saveTillScreenWithId(basePath, screenId, screenData)
    } catch (error) {
      console.error("Error saving till screen:", error)
      throw error
    }
  }, [basePath])

  const fetchStockHistory = React.useCallback(async (): Promise<any[]> => {
    if (!basePath) return []
    try {
      return await StockDB.fetchStockHistory(basePath)
    } catch (error) {
      console.error("Error fetching stock history:", error)
      throw error
    }
  }, [basePath])

  // Category CRUD functions
  const createCategory = React.useCallback(async (categoryData: any): Promise<string | undefined> => {
    if (!basePath) return undefined
    try {
      const categoryId = await StockFunctions.createCategory(basePath, categoryData)
      // Refresh only categories, subcategories, and sales divisions
      const [categories, subcategories, salesDivisions] = await Promise.all([
        StockDB.fetchCategoriesFromBasePath(basePath),
        StockDB.fetchSubcategoriesFromBasePath(basePath),
        StockDB.fetchSalesDivisionsFromBasePath(basePath)
      ])
      dispatch({ type: "SET_CATEGORIES", payload: categories })
      dispatch({ type: "SET_SUBCATEGORIES", payload: subcategories })
      dispatch({ type: "SET_SALES_DIVISIONS", payload: salesDivisions })
      return categoryId
    } catch (error) {
      console.error("Error creating category:", error)
      throw error
    }
  }, [basePath, dispatch])

  const updateCategory = React.useCallback(async (categoryId: string, categoryData: any): Promise<void> => {
    if (!basePath) return
    try {
      await StockFunctions.updateCategory(basePath, categoryId, categoryData)
      // Refresh only categories, subcategories, and sales divisions
      const [categories, subcategories, salesDivisions] = await Promise.all([
        StockDB.fetchCategoriesFromBasePath(basePath),
        StockDB.fetchSubcategoriesFromBasePath(basePath),
        StockDB.fetchSalesDivisionsFromBasePath(basePath)
      ])
      dispatch({ type: "SET_CATEGORIES", payload: categories })
      dispatch({ type: "SET_SUBCATEGORIES", payload: subcategories })
      dispatch({ type: "SET_SALES_DIVISIONS", payload: salesDivisions })
    } catch (error) {
      console.error("Error updating category:", error)
      throw error
    }
  }, [basePath, dispatch])

  const deleteCategory = React.useCallback(async (categoryId: string): Promise<void> => {
    if (!basePath) return
    try {
      await StockFunctions.deleteCategory(basePath, categoryId)
      // Refresh only categories, subcategories, and sales divisions
      const [categories, subcategories, salesDivisions] = await Promise.all([
        StockDB.fetchCategoriesFromBasePath(basePath),
        StockDB.fetchSubcategoriesFromBasePath(basePath),
        StockDB.fetchSalesDivisionsFromBasePath(basePath)
      ])
      dispatch({ type: "SET_CATEGORIES", payload: categories })
      dispatch({ type: "SET_SUBCATEGORIES", payload: subcategories })
      dispatch({ type: "SET_SALES_DIVISIONS", payload: salesDivisions })
    } catch (error) {
      console.error("Error deleting category:", error)
      throw error
    }
  }, [basePath, dispatch])

  // Debounced lazy loading - only load when basePath stabilizes
  const lastBasePathRef = React.useRef<string>("")
  const refreshTimeoutRef = React.useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Wait for dependencies: Settings and Company must be ready first
    if (!settingsState.auth || settingsState.loading) {
      // Ensure loading is cleared if settings aren't ready
      dispatch({ type: "SET_LOADING", payload: false })
      return // Settings not ready yet
    }
    
    if (!companyState.companyID && settingsState.auth.isLoggedIn) {
      // Ensure loading is cleared if company isn't selected
      dispatch({ type: "SET_LOADING", payload: false })
      return // Company not selected yet (but user is logged in)
    }
    
    // Clear any pending refresh
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
    
    // Only load if basePath is valid and different from last loaded
    if (basePath && basePath !== lastBasePathRef.current) {
      // Debounce to prevent rapid refreshes during company/site switching
      refreshTimeoutRef.current = setTimeout(() => {
        lastBasePathRef.current = basePath
        
        // Load data with progressive loading (critical first, then background)
        // Critical: products, measures (most commonly used)
        // Background: suppliers, categories, etc.
        refreshAll().catch(error => {
          console.warn('Stock data refresh failed, maintaining old data:', error)
          // Ensure loading is cleared on error
          dispatch({ type: "SET_LOADING", payload: false })
          // Keep old data visible even if refresh fails
        })
      }, 100) // Reduced debounce for faster loading
    } else if (!basePath) {
      // Ensure loading is cleared if basePath is empty
      dispatch({ type: "SET_LOADING", payload: false })
    } else if (basePath === lastBasePathRef.current && isInitialized.current) {
      // If basePath hasn't changed and we're already initialized, ensure loading is cleared
      dispatch({ type: "SET_LOADING", payload: false })
    }
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [basePath, settingsState.auth, settingsState.loading, companyState.companyID, refreshAll, dispatch])

  // Load purchase and sales history after products and measures are loaded
  useEffect(() => {
    const loadHistoryData = async () => {
      if (!basePath || !state.products.length || !state.measures.length) return
      
      try {
        console.log('Loading purchase and sales history...')
        const [purchaseHist, salesHist] = await Promise.all([
          fetchPurchasesHistory(),
          fetchSalesHistory()
        ])
        
        dispatch({ type: "SET_PURCHASE_HISTORY", payload: purchaseHist })
        dispatch({ type: "SET_SALES_HISTORY", payload: salesHist })
        console.log('History data loaded:', { purchases: purchaseHist.length, sales: salesHist.length })
      } catch (error) {
        console.error('Error loading history data:', error)
      }
    }
    
    loadHistoryData()
  }, [basePath, state.products.length, state.measures.length, fetchPurchasesHistory, fetchSalesHistory, dispatch])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: StockContextType = React.useMemo(() => ({
    state,
    dispatch,
    refreshProducts,
    refreshSuppliers,
    refreshMeasures,
    refreshAll,
    getStockData,
    canViewStock,
    canEditStock,
    canDeleteStock,
    isOwner: ownerCheck,
    basePath,
    // Data operation functions
    saveProduct,
    fetchProductById,
    deleteProduct,
    createProduct,
    updateProduct,
    savePurchase,
    fetchAllPurchases,
    deletePurchase,
    saveStockCount,
    fetchAllStockCounts,
    deleteStockCount,
    fetchLatestCountsForProducts,
    saveParLevelProfile,
    fetchParProfiles,
    deleteParProfile,
    fetchMeasureData,
    fetchSalesHistory,
    fetchPurchasesHistory,
    fetchCurrentStock,
    fetchPresetsFromDB,
    savePresetToDB,
    fetchCourses,
    saveCourse,
    updateCourse,
    deleteCourse,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    fetchLocations,
    updateLocation,
    deleteLocation,
    fetchSuppliers,
    fetchMeasures,
    saveMeasure,
    updateMeasure,
    deleteMeasure,
    // Till screen functions
    fetchTillScreen,
    saveTillScreenWithId,
    fetchStockHistory,
    getGoogleMapsApiKey,
    parseAddressComponents,
    // Helper functions
    getParLevelValue: StockFunctions.getParLevelValue,
    getParLevelMeasureId: StockFunctions.getParLevelMeasureId,
    // New CRUD functions
    createCategory,
    updateCategory,
    deleteCategory,
    createStockLocation,
    updateStockLocation,
    deleteStockLocation,
    createParLevel,
    updateParLevel,
    deleteParLevel,
  }), [
    state,
    dispatch,
    refreshProducts,
    refreshSuppliers,
    refreshMeasures,
    refreshAll,
    getStockData,
    canViewStock,
    canEditStock,
    canDeleteStock,
    ownerCheck,
    basePath,
    saveProduct,
    fetchProductById,
    deleteProduct,
    createProduct,
    updateProduct,
    savePurchase,
    fetchAllPurchases,
    deletePurchase,
    saveStockCount,
    fetchAllStockCounts,
    deleteStockCount,
    fetchLatestCountsForProducts,
    saveParLevelProfile,
    fetchParProfiles,
    deleteParProfile,
    fetchMeasureData,
    fetchSalesHistory,
    fetchPurchasesHistory,
    fetchCurrentStock,
    fetchPresetsFromDB,
    savePresetToDB,
    fetchCourses,
    saveCourse,
    updateCourse,
    deleteCourse,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    fetchLocations,
    updateLocation,
    deleteLocation,
    fetchSuppliers,
    fetchMeasures,
    saveMeasure,
    updateMeasure,
    deleteMeasure,
    fetchTillScreen,
    saveTillScreenWithId,
    fetchStockHistory,
    getGoogleMapsApiKey,
    parseAddressComponents,
    StockFunctions,
    createCategory,
    updateCategory,
    deleteCategory,
    createStockLocation,
    updateStockLocation,
    deleteStockLocation,
    createParLevel,
    updateParLevel,
    deleteParLevel,
  ])

  return <StockContext.Provider value={contextValue}>{children}</StockContext.Provider>
}

// Hook to use the context - graceful handling when not loaded
export const useStock = (): StockContextType => {
  const context = useContext(StockContext)
  if (context === undefined) {
    // Return a safe default context instead of throwing error
    // This allows components to render even when Stock module isn't loaded yet
    // Suppress warnings during initial load - components will wait for providers via guards
    // Only warn in development mode if this persists after initial load
    // (Warnings are expected during initial render before providers are ready)
    
    const emptyContext: StockContextType = {
      state: {
        companyID: null,
        siteID: null,
        subsiteID: null,
        products: [],
        suppliers: [],
        measures: [],
        salesDivisions: [],
        categories: [],
        subcategories: [],
        subCategories: [],
        courses: [],
        purchases: [],
        stockCounts: [],
        stockItems: [],
        purchaseOrders: [],
        parLevels: [],
        latestCounts: {},
        purchaseHistory: [],
        salesHistory: [],
        loading: false,
        error: null,
        dataVersion: 0,
      },
      dispatch: () => {},
      refreshProducts: async () => {},
      refreshSuppliers: async () => {},
      refreshMeasures: async () => {},
      refreshAll: async () => {},
      getStockData: () => ({ products: [], suppliers: [], measures: [], salesDivisions: [], categories: [], subcategories: [] }),
      canViewStock: () => false,
      canEditStock: () => false,
      canDeleteStock: () => false,
      isOwner: () => false,
      basePath: "",
      saveProduct: async () => {},
      fetchProductById: async () => null,
      deleteProduct: async () => {},
      createProduct: async () => undefined,
      updateProduct: async () => {},
      savePurchase: async () => {},
      fetchAllPurchases: async () => [],
      deletePurchase: async () => {},
      saveStockCount: async () => {},
      fetchAllStockCounts: async () => [],
      deleteStockCount: async () => {},
      fetchLatestCountsForProducts: async () => ({}),
      saveParLevelProfile: async () => {},
      fetchParProfiles: async () => [],
      deleteParProfile: async () => {},
      fetchMeasureData: async () => null,
      fetchSalesHistory: async () => [],
      fetchPurchasesHistory: async () => [],
      fetchCurrentStock: async () => [],
      fetchPresetsFromDB: async () => [],
      savePresetToDB: async () => {},
      fetchCourses: async () => [],
      saveCourse: async () => {},
      updateCourse: async () => {},
      deleteCourse: async () => {},
      createSupplier: async () => {},
      updateSupplier: async () => {},
      deleteSupplier: async () => {},
      fetchLocations: async () => [],
      updateLocation: async () => {},
      deleteLocation: async () => {},
      fetchSuppliers: async () => [],
      fetchMeasures: async () => [],
      saveMeasure: async () => {},
      updateMeasure: async () => {},
      deleteMeasure: async () => {},
      fetchTillScreen: async () => null,
      saveTillScreenWithId: async () => {},
      fetchStockHistory: async () => [],
      getGoogleMapsApiKey: () => "",
      parseAddressComponents: () => ({}),
      getParLevelValue: () => 0,
      getParLevelMeasureId: () => undefined,
      createCategory: async () => undefined,
      updateCategory: async () => {},
      deleteCategory: async () => {},
      createStockLocation: async () => undefined,
      updateStockLocation: async () => {},
      deleteStockLocation: async () => {},
      createParLevel: async () => undefined,
      updateParLevel: async () => {},
      deleteParLevel: async () => {},
    }
    
    return emptyContext
  }
  return context
}

// Export types for frontend components to use
export type { 
  Product, 
  StockData, 
  Purchase, 
  StockCount,
  StockCountItem,
  Supplier,
  Measure,
  CategoryType,
  StockItem,
  PurchaseOrder,
  Bill,
  Sale,
  TillScreen,
  PaymentType,
  FloorPlan,
  Table,
  Card,
  Discount,
  Promotion,
  Correction,
  BagCheckItem,
  Location,
  Site,
  HeadCell,
  SortDirection,
  MeasureOption,
  FilterGroup,
  Filter,
  ProductRow,
  Column,
  TabPanelProps,
  StockDataGridProps,
  NewPaymentTypeProps,
  NewDeviceProps,
  NewCorrectionProps,
  UIParLevel,
  UIParLevelProfile,
  ParLevelProfileFromDB,
  PurchaseItem,
  StockPreset,
  Ticket,
  TicketSale,
  BagCheckConfig,
  PaymentIntegration
} from "../interfaces/Stock"
