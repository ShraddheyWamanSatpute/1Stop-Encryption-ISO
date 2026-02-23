"use client"

import React from "react"
import { createContext, useContext, useMemo, useReducer, useEffect, useCallback } from "react"
import { useCompany } from "./CompanyContext"
import { useSettings } from "./SettingsContext"
import * as POSFunctions from "../functions/POS"
import { measurePerformance } from "../utils/PerformanceTimer"
import { createCachedFetcher } from "../utils/CachedFetcher"
import type { 
  Bill, TillScreen, PaymentType, FloorPlan, Table, Card, 
  Discount, Promotion, Correction, BagCheckItem,
  Location, Device, Ticket, TicketSale
} from "../interfaces/POS"

type DataLevel = "company" | "site" | "subsite"

// State interface
interface POSState {
  bills: Bill[]
  tillScreens: TillScreen[]
  paymentTypes: PaymentType[]
  floorPlans: FloorPlan[]
  tables: Table[]
  cards: Card[]
  discounts: Discount[]
  promotions: Promotion[]
  corrections: Correction[]
  bagCheckItems: BagCheckItem[]
  locations: Location[]
  devices: Device[]
  tickets: Ticket[]
  ticketSales: TicketSale[]
  groups: any[]
  courses: any[]
  loading: boolean
  error: string | null
}

// Action types
type POSAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_BILLS"; payload: Bill[] }
  | { type: "SET_TILL_SCREENS"; payload: TillScreen[] }
  | { type: "SET_PAYMENT_TYPES"; payload: PaymentType[] }
  | { type: "SET_FLOOR_PLANS"; payload: FloorPlan[] }
  | { type: "SET_TABLES"; payload: Table[] }
  | { type: "SET_CARDS"; payload: Card[] }
  | { type: "SET_DISCOUNTS"; payload: Discount[] }
  | { type: "SET_PROMOTIONS"; payload: Promotion[] }
  | { type: "SET_CORRECTIONS"; payload: Correction[] }
  | { type: "SET_BAG_CHECK_ITEMS"; payload: BagCheckItem[] }
  | { type: "SET_LOCATIONS"; payload: Location[] }
  | { type: "SET_DEVICES"; payload: Device[] }
  | { type: "SET_TICKETS"; payload: Ticket[] }
  | { type: "SET_TICKET_SALES"; payload: TicketSale[] }
  | { type: "SET_GROUPS"; payload: any[] }
  | { type: "SET_COURSES"; payload: any[] }
  | { type: "SET_ALL_DATA"; payload: {
      bills: Bill[]
      tillScreens: TillScreen[]
      paymentTypes: PaymentType[]
      floorPlans: FloorPlan[]
      tables: Table[]
      cards: Card[]
      discounts: Discount[]
      promotions: Promotion[]
      corrections: Correction[]
      bagCheckItems: BagCheckItem[]
      locations: Location[]
      devices: Device[]
      tickets: Ticket[]
      ticketSales: TicketSale[]
      groups: any[]
      courses: any[]
    } }

export interface POSContextValue {
  // State
  state: POSState
  
  // Base paths
  companyId: string
  siteId: string | null
  subsiteId: string | null
  dataLevel: DataLevel
  rootBasePath: string
  basePaths: string[]
  stockBasePath: string
  stockBasePaths: string[]
  paymentsPath: string
  paymentsPaths: string[]
  posDataPath: string
  posDataPaths: string[]
  getPath: (key: "stock" | "products" | "paymentTypes" | "pos" | "sales" | "tillScreens" | "bills") => string
  getPaths: (key: "stock" | "products" | "paymentTypes" | "pos" | "sales") => string[]
  
  // Data fetching functions
  refreshAll: () => Promise<void>
  refreshBills: () => Promise<void>
  refreshTillScreens: () => Promise<void>
  refreshPaymentTypes: () => Promise<void>
  refreshFloorPlans: () => Promise<void>
  refreshTables: () => Promise<void>
  refreshCards: () => Promise<void>
  refreshDiscounts: () => Promise<void>
  refreshPromotions: () => Promise<void>
  refreshCorrections: () => Promise<void>
  refreshBagCheckItems: () => Promise<void>
  refreshLocations: () => Promise<void>
  refreshDevices: () => Promise<void>
  refreshTickets: () => Promise<void>
  refreshTicketSales: () => Promise<void>
  refreshGroups: () => Promise<void>
  refreshCourses: () => Promise<void>
  
  // CRUD functions
  createBill: (bill: Omit<Bill, "id" | "createdAt" | "updatedAt">) => Promise<Bill>
  updateBill: (billId: string, updates: Partial<Bill>) => Promise<void>
  deleteBill: (billId: string) => Promise<void>
  createPaymentType: (paymentType: Omit<PaymentType, "id" | "createdAt" | "updatedAt">) => Promise<PaymentType>
  updatePaymentType: (paymentTypeId: string, updates: Partial<PaymentType>) => Promise<void>
  deletePaymentType: (paymentTypeId: string) => Promise<void>
  createTillScreen: (tillScreen: Omit<TillScreen, "id" | "createdAt" | "updatedAt">) => Promise<TillScreen>
  updateTillScreen: (tillScreenId: string, updates: Partial<TillScreen>) => Promise<void>
  deleteTillScreen: (tillScreenId: string) => Promise<void>
  createFloorPlan: (floorPlan: Omit<FloorPlan, "id" | "createdAt" | "updatedAt">) => Promise<FloorPlan>
  updateFloorPlan: (floorPlanId: string, updates: Partial<FloorPlan>) => Promise<void>
  deleteFloorPlan: (floorPlanId: string) => Promise<void>
  createTable: (table: Omit<Table, "id" | "createdAt" | "updatedAt">) => Promise<Table>
  updateTable: (tableId: string, updates: Partial<Table>) => Promise<void>
  deleteTable: (tableId: string) => Promise<void>
  createDiscount: (discount: Omit<Discount, "id" | "createdAt" | "updatedAt">) => Promise<Discount>
  updateDiscount: (discountId: string, updates: Partial<Discount>) => Promise<void>
  deleteDiscount: (discountId: string) => Promise<void>
  createPromotion: (promotion: Omit<Promotion, "id" | "createdAt" | "updatedAt">) => Promise<Promotion>
  updatePromotion: (promotionId: string, updates: Partial<Promotion>) => Promise<void>
  deletePromotion: (promotionId: string) => Promise<void>
  createCorrection: (correction: Omit<Correction, "id" | "createdAt" | "updatedAt">) => Promise<Correction>
  updateCorrection: (correctionId: string, updates: Partial<Correction>) => Promise<void>
  deleteCorrection: (correctionId: string) => Promise<void>
  createBagCheckItem: (bagCheckItem: Omit<BagCheckItem, "id" | "createdAt" | "updatedAt">) => Promise<BagCheckItem>
  updateBagCheckItem: (bagCheckItemId: string, updates: Partial<BagCheckItem>) => Promise<void>
  deleteBagCheckItem: (bagCheckItemId: string) => Promise<void>
  createLocation: (location: Omit<Location, "id" | "createdAt" | "updatedAt">) => Promise<Location>
  updateLocation: (locationId: string, updates: Partial<Location>) => Promise<void>
  deleteLocation: (locationId: string) => Promise<void>
  createDevice: (device: Omit<Device, "id" | "createdAt" | "updatedAt">) => Promise<Device>
  updateDevice: (deviceId: string, updates: Partial<Device>) => Promise<void>
  deleteDevice: (deviceId: string) => Promise<void>
  createCard: (card: Omit<Card, "id" | "createdAt" | "updatedAt">) => Promise<Card>
  updateCard: (cardId: string, updates: Partial<Card>) => Promise<void>
  deleteCard: (cardId: string) => Promise<void>
  createTicket: (ticket: Omit<Ticket, "id" | "createdAt" | "updatedAt">) => Promise<Ticket>
  updateTicket: (ticketId: string, updates: Partial<Ticket>) => Promise<void>
  deleteTicket: (ticketId: string) => Promise<void>
  createTicketSale: (ticketSale: Omit<TicketSale, "id" | "createdAt" | "updatedAt">) => Promise<TicketSale>
  updateTicketSale: (ticketSaleId: string, updates: Partial<TicketSale>) => Promise<void>
  deleteTicketSale: (ticketSaleId: string) => Promise<void>
  createGroup: (group: Omit<any, "id" | "createdAt" | "updatedAt">) => Promise<any>
  updateGroup: (groupId: string, updates: Partial<any>) => Promise<void>
  deleteGroup: (groupId: string) => Promise<void>
  createCourse: (course: Omit<any, "id" | "createdAt" | "updatedAt">) => Promise<any>
  updateCourse: (courseId: string, updates: Partial<any>) => Promise<void>
  deleteCourse: (courseId: string) => Promise<void>
  
  // Data lookup utilities
  getItemName: (itemId: string) => string
  getPaymentTypeName: (paymentTypeId: string) => string
  getLocationName: (locationId: string) => string
}

// Reducer
const posReducer = (state: POSState, action: POSAction): POSState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false }
    case "SET_BILLS":
      return { ...state, bills: action.payload }
    case "SET_TILL_SCREENS":
      return { ...state, tillScreens: action.payload }
    case "SET_PAYMENT_TYPES":
      return { ...state, paymentTypes: action.payload }
    case "SET_FLOOR_PLANS":
      return { ...state, floorPlans: action.payload }
    case "SET_TABLES":
      return { ...state, tables: action.payload }
    case "SET_CARDS":
      return { ...state, cards: action.payload }
    case "SET_DISCOUNTS":
      return { ...state, discounts: action.payload }
    case "SET_PROMOTIONS":
      return { ...state, promotions: action.payload }
    case "SET_CORRECTIONS":
      return { ...state, corrections: action.payload }
    case "SET_BAG_CHECK_ITEMS":
      return { ...state, bagCheckItems: action.payload }
    case "SET_LOCATIONS":
      return { ...state, locations: action.payload }
    case "SET_DEVICES":
      return { ...state, devices: action.payload }
    case "SET_TICKETS":
      return { ...state, tickets: action.payload }
    case "SET_TICKET_SALES":
      return { ...state, ticketSales: action.payload }
    case "SET_GROUPS":
      return { ...state, groups: action.payload }
    case "SET_COURSES":
      return { ...state, courses: action.payload }
    case "SET_ALL_DATA":
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null,
      }
    default:
      return state
  }
}

// Initial state
const initialState: POSState = {
  bills: [],
  tillScreens: [],
  paymentTypes: [],
  floorPlans: [],
  tables: [],
  cards: [],
  discounts: [],
  promotions: [],
  corrections: [],
  bagCheckItems: [],
  locations: [],
  devices: [],
  tickets: [],
  ticketSales: [],
  groups: [],
  courses: [],
  loading: false,
  error: null,
}

// Helper function to get base paths
function getBasePaths(
  companyId: string,
  selectedSiteId: string | null,
  selectedSubsiteId: string | null,
): string[] {
  const prefix = `companies/${companyId}`
  if (!companyId) return []

  // Priority logic: If subsite is selected, use subsite path. Otherwise, if site is selected, use site path.
  if (selectedSubsiteId && selectedSiteId) {
    return [`${prefix}/sites/${selectedSiteId}/subsites/${selectedSubsiteId}`]
  }
  if (selectedSiteId) {
    return [`${prefix}/sites/${selectedSiteId}`]
  }

  return [prefix]
}

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state: companyState, getBasePath } = useCompany()
  const { state: settingsState } = useSettings()
  const [posState, dispatch] = useReducer(posReducer, initialState)

  // Track last loaded path to prevent duplicate loads
  const lastLoadedPathRef = React.useRef<string>("")
  const refreshTimeoutRef = React.useRef<NodeJS.Timeout>()
  const isInitializedRef = React.useRef<boolean>(false)

  // Get base path for POS data (add /data/pos like stock section)
  const rootBasePath = React.useMemo(() => {
    const basePath = getBasePath("pos")
    return basePath ? `${basePath}/data/pos` : ""
  }, [getBasePath])

  // Get POS paths with subsite priority (same pattern as stock)
  const getPOSPaths = React.useCallback(() => {
    if (!companyState.companyID) return []
    
    const paths = []
    const companyRoot = `companies/${companyState.companyID}`
    
    if (companyState.selectedSiteID) {
      // If subsite is selected, prioritize subsite level first
      if (companyState.selectedSubsiteID) {
        paths.push(`${companyRoot}/sites/${companyState.selectedSiteID}/subsites/${companyState.selectedSubsiteID}/data/pos`)
        paths.push(`${companyRoot}/sites/${companyState.selectedSiteID}/data/pos`)
      } else {
        // If no subsite selected, only check site level
        paths.push(`${companyRoot}/sites/${companyState.selectedSiteID}/data/pos`)
      }
    } else {
      // If no site selected, try company level
      paths.push(`${companyRoot}/data/pos`)
    }
    
    return paths
  }, [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID])

  // Data fetching functions
  const refreshBills = async () => {
    const paths = getPOSPaths()
    if (paths.length === 0) return
    
    try {
      // Try each path until we find data
      for (const path of paths) {
        try {
          const bills = await POSFunctions.getBills(path)
          if (bills && bills.length > 0) {
            console.log(`Bills loaded from path: ${path}`)
            dispatch({ type: "SET_BILLS", payload: bills })
            return // Success, exit early
          }
        } catch (error) {
          console.log(`No bills found at path: ${path}`)
          continue // Try next path
        }
      }
      console.log("No bills found at any path")
      dispatch({ type: "SET_BILLS", payload: [] })
    } catch (error) {
      console.error("Error fetching bills:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch bills" })
    }
  }

  const refreshTillScreens = async () => {
    const paths = getPOSPaths()
    if (paths.length === 0) return
    
    try {
      // Try each path until we find data
      for (const path of paths) {
        try {
          const tillScreens = await POSFunctions.getTillScreens(path)
          if (tillScreens && tillScreens.length > 0) {
            console.log(`Till screens loaded from path: ${path}`)
            dispatch({ type: "SET_TILL_SCREENS", payload: tillScreens })
            return // Success, exit early
          }
        } catch (error) {
          console.log(`No till screens found at path: ${path}`)
          continue // Try next path
        }
      }
      console.log("No till screens found at any path")
      dispatch({ type: "SET_TILL_SCREENS", payload: [] })
    } catch (error) {
      console.error("Error fetching till screens:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch till screens" })
    }
  }

  const refreshPaymentTypes = async () => {
    const paths = getPOSPaths()
    if (paths.length === 0) return
    
    try {
      // Try each path until we find data
      for (const path of paths) {
        try {
          const paymentTypes = await POSFunctions.getPaymentTypes(path)
          if (paymentTypes && paymentTypes.length > 0) {
            dispatch({ type: "SET_PAYMENT_TYPES", payload: paymentTypes })
            return // Success, exit early
          }
        } catch (error) {
          continue // Try next path
        }
      }
      dispatch({ type: "SET_PAYMENT_TYPES", payload: [] })
    } catch (error) {
      console.error("Error fetching payment types:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch payment types" })
    }
  }

  const refreshFloorPlans = async () => {
    const paths = getPOSPaths()
    if (paths.length === 0) return
    
    try {
      // Try each path until we find data
      for (const path of paths) {
        try {
          const floorPlans = await POSFunctions.getFloorPlans(path)
          if (floorPlans && floorPlans.length > 0) {
            console.log(`Floor plans loaded from path: ${path}`)
            dispatch({ type: "SET_FLOOR_PLANS", payload: floorPlans })
            return // Success, exit early
          }
        } catch (error) {
          console.log(`No floor plans found at path: ${path}`)
          continue // Try next path
        }
      }
      console.log("No floor plans found at any path")
      dispatch({ type: "SET_FLOOR_PLANS", payload: [] })
    } catch (error) {
      console.error("Error fetching floor plans:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch floor plans" })
    }
  }

  const refreshTables = async () => {
    const paths = getPOSPaths()
    if (paths.length === 0) return
    
    try {
      // Try each path until we find data
      for (const path of paths) {
        try {
          const tables = await POSFunctions.getTables(path)
          if (tables && tables.length > 0) {
            console.log(`Tables loaded from path: ${path}`)
            dispatch({ type: "SET_TABLES", payload: tables })
            return // Success, exit early
          }
        } catch (error) {
          console.log(`No tables found at path: ${path}`)
          continue // Try next path
        }
      }
      console.log("No tables found at any path")
      dispatch({ type: "SET_TABLES", payload: [] })
    } catch (error) {
      console.error("Error fetching tables:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch tables" })
    }
  }

  const refreshCards = async () => {
    const paths = getPOSPaths()
    if (paths.length === 0) return
    
    try {
      // Try each path until we find data
      for (const path of paths) {
        try {
          const cards = await POSFunctions.getCards(path)
          if (cards && cards.length > 0) {
            console.log(`Cards loaded from path: ${path}`)
            dispatch({ type: "SET_CARDS", payload: cards })
            return // Success, exit early
          }
        } catch (error) {
          console.log(`No cards found at path: ${path}`)
          continue // Try next path
        }
      }
      console.log("No cards found at any path")
      dispatch({ type: "SET_CARDS", payload: [] })
    } catch (error) {
      console.error("Error fetching cards:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch cards" })
    }
  }

  const refreshDiscounts = async () => {
    if (!rootBasePath) return
    try {
      const discounts = await POSFunctions.getDiscounts(rootBasePath)
      dispatch({ type: "SET_DISCOUNTS", payload: discounts })
    } catch (error) {
      console.error("Error fetching discounts:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch discounts" })
    }
  }

  const refreshPromotions = async () => {
    if (!rootBasePath) return
    try {
      const promotions = await POSFunctions.getPromotions(rootBasePath)
      dispatch({ type: "SET_PROMOTIONS", payload: promotions })
    } catch (error) {
      console.error("Error fetching promotions:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch promotions" })
    }
  }

  const refreshCorrections = async () => {
    if (!rootBasePath) return
    try {
      const corrections = await POSFunctions.getCorrections(rootBasePath)
      dispatch({ type: "SET_CORRECTIONS", payload: corrections })
    } catch (error) {
      console.error("Error fetching corrections:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch corrections" })
    }
  }

  const refreshBagCheckItems = async () => {
    if (!rootBasePath) return
    try {
      const bagCheckItems = await POSFunctions.getBagCheckItems(rootBasePath)
      dispatch({ type: "SET_BAG_CHECK_ITEMS", payload: bagCheckItems })
    } catch (error) {
      console.error("Error fetching bag check items:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch bag check items" })
    }
  }

  const refreshTickets = async () => {
    if (!rootBasePath) return
    try {
      const tickets = await POSFunctions.getTickets(rootBasePath)
      dispatch({ type: "SET_TICKETS", payload: tickets })
    } catch (error) {
      console.error("Error fetching tickets:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch tickets" })
    }
  }

  const refreshTicketSales = async () => {
    if (!rootBasePath) return
    try {
      const ticketSales = await POSFunctions.getTicketSales(rootBasePath)
      dispatch({ type: "SET_TICKET_SALES", payload: ticketSales })
    } catch (error) {
      console.error("Error fetching ticket sales:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch ticket sales" })
    }
  }

  const refreshGroups = async () => {
    const paths = getPOSPaths()
    if (paths.length === 0) return
    
    try {
      // Try each path until we find data
      for (const path of paths) {
        try {
          const groups = await POSFunctions.getGroups(path)
          if (groups && groups.length > 0) {
            dispatch({ type: "SET_GROUPS", payload: groups })
            return // Success, exit early
          }
        } catch (error) {
          continue // Try next path
        }
      }
      dispatch({ type: "SET_GROUPS", payload: [] })
    } catch (error) {
      console.error("Error fetching groups:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch groups" })
    }
  }

  const refreshCourses = async () => {
    const paths = getPOSPaths()
    if (paths.length === 0) return
    
    try {
      // Try each path until we find data
      for (const path of paths) {
        try {
          const courses = await POSFunctions.getCourses(path)
          if (courses && courses.length > 0) {
            dispatch({ type: "SET_COURSES", payload: courses })
            return // Success, exit early
          }
        } catch (error) {
          continue // Try next path
        }
      }
      dispatch({ type: "SET_COURSES", payload: [] })
    } catch (error) {
      console.error("Error fetching courses:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch courses" })
    }
  }

  const refreshLocations = async () => {
    if (!rootBasePath) return
    try {
      const locations = await POSFunctions.getLocations(rootBasePath)
      dispatch({ type: "SET_LOCATIONS", payload: locations })
    } catch (error) {
      console.error("Error fetching locations:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch locations" })
    }
  }

  const refreshDevices = async () => {
    if (!rootBasePath) return
    try {
      const devices = await POSFunctions.getDevices(rootBasePath)
      dispatch({ type: "SET_DEVICES", payload: devices })
    } catch (error) {
      console.error("Error fetching devices:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch devices" })
    }
  }

  // Create cached fetchers for critical data
  const fetchBillsCached = useMemo(() => createCachedFetcher(
    async () => {
      const paths = getPOSPaths()
      for (const p of paths) {
        try {
          const data = await POSFunctions.getBills(p)
          if (data && data.length > 0) return data
        } catch (error) {
          continue
        }
      }
      return []
    },
    'bills'
  ), [])
  const fetchPaymentTypesCached = useMemo(() => createCachedFetcher(
    async () => {
      const paths = getPOSPaths()
      for (const p of paths) {
        try {
          const data = await POSFunctions.getPaymentTypes(p)
          if (data && data.length > 0) return data
        } catch (error) {
          continue
        }
      }
      return []
    },
    'paymentTypes'
  ), [])
  const fetchTablesCached = useMemo(() => createCachedFetcher(
    async () => {
      const paths = getPOSPaths()
      for (const p of paths) {
        try {
          const data = await POSFunctions.getTables(p)
          if (data && data.length > 0) return data
        } catch (error) {
          continue
        }
      }
      return []
    },
    'tables'
  ), [])

  const refreshAll = useCallback(async () => {
    if (!rootBasePath) {
      dispatch({ type: "SET_LOADING", payload: false })
      return
    }
    
    // Prevent duplicate loading for same path if already initialized
    if (rootBasePath === lastLoadedPathRef.current && isInitializedRef.current) {
      console.log("💳 POSContext - Already loaded data for path, skipping:", rootBasePath)
      return
    }
    
    try {
      await measurePerformance('POSContext', 'refreshAll', async () => {
        dispatch({ type: "SET_LOADING", payload: true })
        lastLoadedPathRef.current = rootBasePath
        isInitializedRef.current = false
        
        try {
        const paths = getPOSPaths()
        
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
        const [bills, paymentTypes, tables] = await Promise.all([
          fetchBillsCached(rootBasePath, false).catch(() => fetchFromPaths(POSFunctions.getBills)),
          fetchPaymentTypesCached(rootBasePath, false).catch(() => fetchFromPaths(POSFunctions.getPaymentTypes)),
          fetchTablesCached(rootBasePath, false).catch(() => fetchFromPaths(POSFunctions.getTables)),
        ])
        
        // Update critical data immediately
        dispatch({
          type: "SET_ALL_DATA",
          payload: {
            bills: bills || [],
            paymentTypes: paymentTypes || [],
            tables: tables || [],
            tillScreens: [],
            floorPlans: [],
            cards: [],
            discounts: [],
            promotions: [],
            corrections: [],
            bagCheckItems: [],
            locations: [],
            devices: [],
            tickets: [],
            ticketSales: [],
            groups: [],
            courses: [],
          },
        })
        
        console.log("💳 POSContext: Critical data loaded (bills, paymentTypes, tables) for", rootBasePath)
        isInitializedRef.current = true
        
        // BACKGROUND: Load non-critical data after (non-blocking)
        const loadBackgroundData = () => {
          Promise.all([
            fetchFromPaths(POSFunctions.getTillScreens),
            fetchFromPaths(POSFunctions.getFloorPlans),
            fetchFromPaths(POSFunctions.getCards),
            fetchFromPaths(POSFunctions.getGroups),
            fetchFromPaths(POSFunctions.getCourses),
            POSFunctions.getDiscounts(rootBasePath).catch(() => []),
            POSFunctions.getPromotions(rootBasePath).catch(() => []),
            POSFunctions.getCorrections(rootBasePath).catch(() => []),
            POSFunctions.getBagCheckItems(rootBasePath).catch(() => []),
            POSFunctions.getLocations(rootBasePath).catch(() => []),
            POSFunctions.getDevices(rootBasePath).catch(() => []),
            POSFunctions.getTickets(rootBasePath).catch(() => []),
            POSFunctions.getTicketSales(rootBasePath).catch(() => []),
          ]).then(([
            tillScreens, floorPlans, cards, groups, courses,
            discounts, promotions, corrections, bagCheckItems,
            locations, devices, tickets, ticketSales
          ]) => {
            dispatch({
              type: "SET_ALL_DATA",
              payload: {
                bills: [],
                tillScreens: tillScreens || [],
                paymentTypes: [],
                floorPlans: floorPlans || [],
                tables: [],
                cards: cards || [],
                discounts: discounts || [],
                promotions: promotions || [],
                corrections: corrections || [],
                bagCheckItems: bagCheckItems || [],
                locations: locations || [],
                devices: devices || [],
                tickets: tickets || [],
                ticketSales: ticketSales || [],
                groups: groups || [],
                courses: courses || [],
              },
            })
            console.log("💳 POSContext: Background data loaded for", rootBasePath)
          }).catch(error => {
            console.warn('Error loading background POS data:', error)
          })
        }
        
        // Use requestIdleCallback if available, otherwise setTimeout
        if ('requestIdleCallback' in window) {
          requestIdleCallback(loadBackgroundData, { timeout: 2000 })
        } else {
          setTimeout(loadBackgroundData, 100)
        }
        } catch (error) {
          console.error("Error refreshing all POS data:", error)
          dispatch({ type: "SET_ERROR", payload: "Failed to refresh data" })
        } finally {
          dispatch({ type: "SET_LOADING", payload: false })
        }
      }, () => ({
        bills: posState.bills?.length || 0,
        paymentTypes: posState.paymentTypes?.length || 0,
        tables: posState.tables?.length || 0,
      }))
    } catch (error) {
      // Ensure loading is cleared even if measurePerformance fails
      console.error("Error in measurePerformance wrapper:", error)
      dispatch({ type: "SET_LOADING", payload: false })
      throw error
    }
  }, [rootBasePath, getPOSPaths, fetchBillsCached, fetchPaymentTypesCached, fetchTablesCached, dispatch])

  // CRUD functions
  const createBill = async (bill: Omit<Bill, "id" | "createdAt" | "updatedAt">): Promise<Bill> => {
    if (!rootBasePath) throw new Error("Missing base path")
    const newBill = await POSFunctions.createBill(rootBasePath, bill)
    await refreshBills()
    return newBill
  }

  const updateBill = async (billId: string, updates: Partial<Bill>): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.updateBill(rootBasePath, billId, updates)
    await refreshBills()
  }

  const deleteBill = async (billId: string): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.deleteBill(rootBasePath, billId)
    await refreshBills()
  }

  const createPaymentType = async (paymentType: Omit<PaymentType, "id" | "createdAt" | "updatedAt">): Promise<PaymentType> => {
    if (!rootBasePath) throw new Error("Missing base path")
    const newPaymentType = await POSFunctions.createPaymentType(rootBasePath, paymentType)
    await refreshPaymentTypes()
    return newPaymentType
  }

  const updatePaymentType = async (paymentTypeId: string, updates: Partial<PaymentType>): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.updatePaymentType(rootBasePath, paymentTypeId, updates)
    await refreshPaymentTypes()
  }

  const deletePaymentType = async (paymentTypeId: string): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.deletePaymentType(rootBasePath, paymentTypeId)
    await refreshPaymentTypes()
  }

  const createTillScreen = async (tillScreen: Omit<TillScreen, "id" | "createdAt" | "updatedAt">): Promise<TillScreen> => {
    if (!rootBasePath) throw new Error("Missing base path")
    const newTillScreen = await POSFunctions.createTillScreen(rootBasePath, tillScreen)
    await refreshTillScreens()
    return newTillScreen
  }

  const updateTillScreen = async (tillScreenId: string, updates: Partial<TillScreen>): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.updateTillScreen(rootBasePath, tillScreenId, updates)
    await refreshTillScreens()
  }

  const deleteTillScreen = async (tillScreenId: string): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.deleteTillScreen(rootBasePath, tillScreenId)
    await refreshTillScreens()
  }

  const createFloorPlan = async (floorPlan: Omit<FloorPlan, "id" | "createdAt" | "updatedAt">): Promise<FloorPlan> => {
    if (!rootBasePath) throw new Error("Missing base path")
    const newFloorPlan = await POSFunctions.createFloorPlan(rootBasePath, floorPlan)
    await refreshFloorPlans()
    return newFloorPlan
  }

  const updateFloorPlan = async (floorPlanId: string, updates: Partial<FloorPlan>): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.updateFloorPlan(rootBasePath, floorPlanId, updates)
    await refreshFloorPlans()
  }

  const deleteFloorPlan = async (floorPlanId: string): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.deleteFloorPlan(rootBasePath, floorPlanId)
    await refreshFloorPlans()
  }

  const createTable = async (table: Omit<Table, "id" | "createdAt" | "updatedAt">): Promise<Table> => {
    if (!rootBasePath) throw new Error("Missing base path")
    const newTable = await POSFunctions.createTable(rootBasePath, table)
    await refreshTables()
    return newTable
  }

  const updateTable = async (tableId: string, updates: Partial<Table>): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.updateTable(rootBasePath, tableId, updates)
    await refreshTables()
  }

  const deleteTable = async (tableId: string): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.deleteTable(rootBasePath, tableId)
    await refreshTables()
  }

  const createDiscount = async (discount: Omit<Discount, "id" | "createdAt" | "updatedAt">): Promise<Discount> => {
    if (!rootBasePath) throw new Error("Missing base path")
    const newDiscount = await POSFunctions.createDiscount(rootBasePath, discount)
    await refreshDiscounts()
    return newDiscount
  }

  const updateDiscount = async (discountId: string, updates: Partial<Discount>): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.updateDiscount(rootBasePath, discountId, updates)
    await refreshDiscounts()
  }

  const deleteDiscount = async (discountId: string): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.deleteDiscount(rootBasePath, discountId)
    await refreshDiscounts()
  }

  const createPromotion = async (promotion: Omit<Promotion, "id" | "createdAt" | "updatedAt">): Promise<Promotion> => {
    if (!rootBasePath) throw new Error("Missing base path")
    const newPromotion = await POSFunctions.createPromotion(rootBasePath, promotion)
    await refreshPromotions()
    return newPromotion
  }

  const updatePromotion = async (promotionId: string, updates: Partial<Promotion>): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.updatePromotion(rootBasePath, promotionId, updates)
    await refreshPromotions()
  }

  const deletePromotion = async (promotionId: string): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.deletePromotion(rootBasePath, promotionId)
    await refreshPromotions()
  }

  const createCorrection = async (correction: Omit<Correction, "id" | "createdAt" | "updatedAt">): Promise<Correction> => {
    if (!rootBasePath) throw new Error("Missing base path")
    const newCorrection = await POSFunctions.createCorrection(rootBasePath, correction)
    await refreshCorrections()
    return newCorrection
  }

  const updateCorrection = async (correctionId: string, updates: Partial<Correction>): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.updateCorrection(rootBasePath, correctionId, updates)
    await refreshCorrections()
  }

  const deleteCorrection = async (correctionId: string): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.deleteCorrection(rootBasePath, correctionId)
    await refreshCorrections()
  }

  const createBagCheckItem = async (bagCheckItem: Omit<BagCheckItem, "id" | "createdAt" | "updatedAt">): Promise<BagCheckItem> => {
    if (!rootBasePath) throw new Error("Missing base path")
    const newBagCheckItem = await POSFunctions.createBagCheckItem(rootBasePath, bagCheckItem)
    await refreshBagCheckItems()
    return newBagCheckItem
  }

  const updateBagCheckItem = async (bagCheckItemId: string, updates: Partial<BagCheckItem>): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.updateBagCheckItem(rootBasePath, bagCheckItemId, updates)
    await refreshBagCheckItems()
  }

  const deleteBagCheckItem = async (bagCheckItemId: string): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.deleteBagCheckItem(rootBasePath, bagCheckItemId)
    await refreshBagCheckItems()
  }

  const createLocation = async (location: Omit<Location, "id" | "createdAt" | "updatedAt">): Promise<Location> => {
    if (!rootBasePath) throw new Error("Missing base path")
    const newLocation = await POSFunctions.createLocation(rootBasePath, location)
    await refreshLocations()
    return newLocation
  }

  const updateLocation = async (locationId: string, updates: Partial<Location>): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.updateLocation(rootBasePath, locationId, updates)
    await refreshLocations()
  }

  const deleteLocation = async (locationId: string): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.deleteLocation(rootBasePath, locationId)
    await refreshLocations()
  }

  const createDevice = async (device: Omit<Device, "id" | "createdAt" | "updatedAt">): Promise<Device> => {
    if (!rootBasePath) throw new Error("Missing base path")
    const newDevice = await POSFunctions.createDevice(rootBasePath, device)
    await refreshDevices()
    return newDevice
  }

  const updateDevice = async (deviceId: string, updates: Partial<Device>): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.updateDevice(rootBasePath, deviceId, updates)
    await refreshDevices()
  }

  const deleteDevice = async (deviceId: string): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.deleteDevice(rootBasePath, deviceId)
    await refreshDevices()
  }

  const createCard = async (card: Omit<Card, "id" | "createdAt" | "updatedAt">): Promise<Card> => {
    if (!rootBasePath) throw new Error("Missing base path")
    const newCard = await POSFunctions.createCard(rootBasePath, card)
    await refreshCards()
    return newCard
  }

  const updateCard = async (cardId: string, updates: Partial<Card>): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.updateCard(rootBasePath, cardId, updates)
    await refreshCards()
  }

  const deleteCard = async (cardId: string): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.deleteCard(rootBasePath, cardId)
    await refreshCards()
  }

  const createTicket = async (ticket: Omit<Ticket, "id" | "createdAt" | "updatedAt">): Promise<Ticket> => {
    if (!rootBasePath) throw new Error("Missing base path")
    const newTicket = await POSFunctions.createTicket(rootBasePath, ticket)
    await refreshTickets()
    return newTicket
  }

  const updateTicket = async (ticketId: string, updates: Partial<Ticket>): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.updateTicket(rootBasePath, ticketId, updates)
    await refreshTickets()
  }

  const deleteTicket = async (ticketId: string): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.deleteTicket(rootBasePath, ticketId)
    await refreshTickets()
  }

  const createTicketSale = async (ticketSale: Omit<TicketSale, "id" | "createdAt" | "updatedAt">): Promise<TicketSale> => {
    if (!rootBasePath) throw new Error("Missing base path")
    const newTicketSale = await POSFunctions.createTicketSale(rootBasePath, ticketSale)
    await refreshTicketSales()
    return newTicketSale
  }

  const updateTicketSale = async (ticketSaleId: string, updates: Partial<TicketSale>): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.updateTicketSale(rootBasePath, ticketSaleId, updates)
    await refreshTicketSales()
  }

  const deleteTicketSale = async (ticketSaleId: string): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.deleteTicketSale(rootBasePath, ticketSaleId)
    await refreshTicketSales()
  }

  const createGroup = async (group: Omit<any, "id" | "createdAt" | "updatedAt">): Promise<any> => {
    if (!rootBasePath) throw new Error("Missing base path")
    const newGroup = await POSFunctions.createGroup(rootBasePath, group)
    await refreshGroups()
    return newGroup
  }

  const updateGroup = async (groupId: string, updates: Partial<any>): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.updateGroup(rootBasePath, groupId, updates)
    await refreshGroups()
  }

  const deleteGroup = async (groupId: string): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.deleteGroup(rootBasePath, groupId)
    await refreshGroups()
  }

  const createCourse = async (course: Omit<any, "id" | "createdAt" | "updatedAt">): Promise<any> => {
    if (!rootBasePath) throw new Error("Missing base path")
    const newCourse = await POSFunctions.createCourse(rootBasePath, course)
    await refreshCourses()
    return newCourse
  }

  const updateCourse = async (courseId: string, updates: Partial<any>): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.updateCourse(rootBasePath, courseId, updates)
    await refreshCourses()
  }

  const deleteCourse = async (courseId: string): Promise<void> => {
    if (!rootBasePath) throw new Error("Missing base path")
    await POSFunctions.deleteCourse(rootBasePath, courseId)
    await refreshCourses()
  }

  // Data lookup utilities
  const getItemName = (itemId: string): string => {
    // TODO: Implement product lookup when StockProvider is available in scope
    // For now, return the item ID with a fallback format
    return `Item ${itemId}`
  }

  const getPaymentTypeName = (paymentTypeId: string): string => {
    const paymentType = posState.paymentTypes.find(pt => pt.id === paymentTypeId)
    return paymentType?.name || `Payment ${paymentTypeId}`
  }

  const getLocationName = (locationId: string): string => {
    const location = posState.locations.find(l => l.id === locationId)
    return location?.name || `Location ${locationId}`
  }

  // Computed values
  const basePaths = useMemo(() => 
    getBasePaths(
      companyState.companyID || "",
      companyState.selectedSiteID || null,
      companyState.selectedSubsiteID || null
    ), 
    [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID]
  )

  const dataLevel: DataLevel = useMemo(() => {
    if (companyState.selectedSubsiteID) return "subsite"
    if (companyState.selectedSiteID) return "site"
    return "company"
  }, [companyState.selectedSiteID, companyState.selectedSubsiteID])

  const stockBasePath = useMemo(() => getBasePath("stock"), [getBasePath])
  const stockBasePaths = useMemo(() => 
    getBasePaths(
      companyState.companyID || "",
      companyState.selectedSiteID || null,
      companyState.selectedSubsiteID || null
    ).map(path => `${path}/data/stock`), 
    [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID]
  )

  const paymentsPath = useMemo(() => getBasePath("pos"), [getBasePath])
  const paymentsPaths = useMemo(() => 
    getBasePaths(
      companyState.companyID || "",
      companyState.selectedSiteID || null,
      companyState.selectedSubsiteID || null
    ).map(path => `${path}/data/payments`), 
    [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID]
  )

  const posDataPath = useMemo(() => getBasePath("pos"), [getBasePath])
  const posDataPaths = useMemo(() => 
    getBasePaths(
      companyState.companyID || "",
      companyState.selectedSiteID || null,
      companyState.selectedSubsiteID || null
    ).map(path => `${path}/data/pos`), 
    [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID]
  )

  const getPath = useMemo(() => (key: "stock" | "products" | "paymentTypes" | "pos" | "sales" | "tillScreens" | "bills") => {
    const base = rootBasePath || ""
    switch (key) {
      case "stock":
        return `${base}/stock`
      case "products":
        return `${base}/products`
      case "paymentTypes":
        return `${base}/paymentTypes`
      case "pos":
        return `${base}/pos`
      case "sales":
        return `${base}/sales`
      case "tillScreens":
        return `${base}/tillScreens`
      case "bills":
        return `${base}/bills`
      default:
        return base
    }
  }, [rootBasePath])

  const getPaths = useMemo(() => (key: "stock" | "products" | "paymentTypes" | "pos" | "sales") => {
    return basePaths.map(path => {
      const base = `${path}/data`
      switch (key) {
        case "stock":
          return `${base}/stock`
        case "products":
          return `${base}/products`
        case "paymentTypes":
          return `${base}/paymentTypes`
        case "pos":
          return `${base}/pos`
        case "sales":
          return `${base}/sales`
        default:
          return base
      }
    })
  }, [basePaths])

  // Auto-refresh when base path changes
  useEffect(() => {
    // Wait for dependencies: Settings and Company must be ready first
    if (!settingsState.auth || settingsState.loading) {
      return // Settings not ready yet
    }
    
    if (!companyState.companyID && settingsState.auth.isLoggedIn) {
      return // Company not selected yet (but user is logged in)
    }
    
    // Clear any pending refresh
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
    
    // Only load if rootBasePath is valid and different from last loaded
    if (rootBasePath && rootBasePath !== lastLoadedPathRef.current) {
      // Reset initialized flag when path changes
      isInitializedRef.current = false
      // Debounce to prevent rapid refreshes during company/site switching
      refreshTimeoutRef.current = setTimeout(() => {
        refreshAll().catch(error => {
          console.warn('POS data refresh failed, maintaining old data:', error)
          // Ensure loading is cleared on error
          dispatch({ type: "SET_LOADING", payload: false })
        })
      }, 100) // Reduced debounce for faster loading
    }
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [rootBasePath, companyState.companyID, settingsState.auth, settingsState.loading, refreshAll, dispatch])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: POSContextValue = useMemo(() => ({
    state: posState,
    companyId: companyState.companyID || "",
    siteId: companyState.selectedSiteID || null,
    subsiteId: companyState.selectedSubsiteID || null,
    dataLevel,
    rootBasePath,
    basePaths,
    stockBasePath,
    stockBasePaths,
    paymentsPath,
    paymentsPaths,
    posDataPath,
    posDataPaths,
    getPath,
    getPaths,
    refreshAll,
    refreshBills,
    refreshTillScreens,
    refreshPaymentTypes,
    refreshFloorPlans,
    refreshTables,
    refreshCards,
    refreshDiscounts,
    refreshPromotions,
    refreshCorrections,
    refreshBagCheckItems,
    refreshLocations,
    refreshDevices,
    refreshTickets,
    refreshTicketSales,
    refreshGroups,
    refreshCourses,
    createBill,
    updateBill,
    deleteBill,
    createPaymentType,
    updatePaymentType,
    deletePaymentType,
    createTillScreen,
    updateTillScreen,
    deleteTillScreen,
    createFloorPlan,
    updateFloorPlan,
    deleteFloorPlan,
    createTable,
    updateTable,
    deleteTable,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    createPromotion,
    updatePromotion,
    deletePromotion,
    createCorrection,
    updateCorrection,
    deleteCorrection,
    createBagCheckItem,
    updateBagCheckItem,
    deleteBagCheckItem,
    createLocation,
    updateLocation,
    deleteLocation,
    createDevice,
    updateDevice,
    deleteDevice,
    createCard,
    updateCard,
    deleteCard,
    createTicket,
    updateTicket,
    deleteTicket,
    createTicketSale,
    updateTicketSale,
    deleteTicketSale,
    createGroup,
    updateGroup,
    deleteGroup,
    createCourse,
    updateCourse,
    deleteCourse,
    getItemName,
    getPaymentTypeName,
    getLocationName,
  }), [
    posState,
    companyState.companyID,
    companyState.selectedSiteID,
    companyState.selectedSubsiteID,
    dataLevel,
    rootBasePath,
    basePaths,
    stockBasePath,
    stockBasePaths,
    paymentsPath,
    paymentsPaths,
    posDataPath,
    posDataPaths,
    getPath,
    getPaths,
    refreshAll,
    refreshBills,
    refreshTillScreens,
    refreshPaymentTypes,
    refreshFloorPlans,
    refreshTables,
    refreshCards,
    refreshDiscounts,
    refreshPromotions,
    refreshCorrections,
    refreshBagCheckItems,
    refreshLocations,
    refreshDevices,
    refreshTickets,
    refreshTicketSales,
    refreshGroups,
    refreshCourses,
    createBill,
    updateBill,
    deleteBill,
    createPaymentType,
    updatePaymentType,
    deletePaymentType,
    createTillScreen,
    updateTillScreen,
    deleteTillScreen,
    createFloorPlan,
    updateFloorPlan,
    deleteFloorPlan,
    createTable,
    updateTable,
    deleteTable,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    createPromotion,
    updatePromotion,
    deletePromotion,
    createCorrection,
    updateCorrection,
    deleteCorrection,
    createBagCheckItem,
    updateBagCheckItem,
    deleteBagCheckItem,
    createLocation,
    updateLocation,
    deleteLocation,
    createDevice,
    updateDevice,
    deleteDevice,
    createCard,
    updateCard,
    deleteCard,
    createTicket,
    updateTicket,
    deleteTicket,
    createTicketSale,
    updateTicketSale,
    deleteTicketSale,
    createGroup,
    updateGroup,
    deleteGroup,
    createCourse,
    updateCourse,
    deleteCourse,
    getItemName,
    getPaymentTypeName,
    getLocationName,
  ])

  // Reset warning flag when provider mounts (so real issues can be detected)
  React.useEffect(() => {
    posWarningShown = false
  }, [])

  return (
    <POSContext.Provider value={contextValue}>
      {children}
    </POSContext.Provider>
  )
}

const POSContext = createContext<POSContextValue | undefined>(undefined)

// Track warnings to avoid spam during initial load
let posWarningShown = false

export const usePOS = (): POSContextValue => {
  const context = useContext(POSContext)
  if (context === undefined) {
    // Return a safe default context instead of throwing error
    // Only warn once in development mode to reduce console noise
    if (process.env.NODE_ENV === 'development' && !posWarningShown) {
      posWarningShown = true
      // Only warn if it's not expected (i.e., not during initial navigation)
      console.warn("usePOS called outside POSProvider - returning empty context (this is normal during initial load)")
    }
    
    // Use Proxy to provide empty implementations dynamically
    const emptyHandler: ProxyHandler<any> = {
      get(target, prop) {
        // Return empty arrays for list properties
        if (prop === 'bills' || prop === 'tillScreens' || prop === 'paymentTypes' ||
            prop === 'floorPlans' || prop === 'tables' || prop === 'cards' ||
            prop === 'discounts' || prop === 'promotions' || prop === 'corrections' ||
            prop === 'bagCheckItems' || prop === 'locations' || prop === 'devices' ||
            prop === 'tickets' || prop === 'ticketSales' || prop === 'groups' || prop === 'courses') {
          return []
        }
        // Return false for boolean properties
        if (prop === 'loading') {
          return false
        }
        // Return null for error
        if (prop === 'error') {
          return null
        }
        // Return empty strings for path properties
        if (prop === 'basePath' || prop === 'rootBasePath' || prop === 'stockBasePath' ||
            prop === 'paymentsPath' || prop === 'posDataPath' || prop === 'companyId') {
          return ''
        }
        // Return null for nullable properties
        if (prop === 'siteId' || prop === 'subsiteId') {
          return null
        }
        // Return 'company' for dataLevel
        if (prop === 'dataLevel') {
          return 'company'
        }
        // Return empty array for path arrays
        if (prop === 'basePaths' || prop === 'stockBasePaths' || prop === 'paymentsPaths' || prop === 'posDataPaths') {
          return []
        }
        // Return empty string for getPath
        if (prop === 'getPath') {
          return () => ''
        }
        // Return empty array for getPaths
        if (prop === 'getPaths') {
          return () => []
        }
        // Return async no-op for async functions
        if (typeof target[prop] === 'undefined') {
          return async () => {}
        }
        return target[prop]
      }
    }
    
    return new Proxy({ state: {} }, emptyHandler) as POSContextValue
  }
  return context
}

// Export types for frontend components to use
export type { 
  Bill, 
  BillItem,
  TillScreen, 
  PaymentType, 
  FloorPlan, 
  Table, 
  Card, 
  Discount, 
  Promotion, 
  Correction, 
  BagCheckItem,
  BagCheckConfig,
  Location, 
  Device,
  Sale,
  Ticket,
  TicketSale,
  PaymentIntegration
} from "../interfaces/POS"