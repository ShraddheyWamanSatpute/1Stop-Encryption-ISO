"use client"

import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo, useRef } from "react"
import { useCompany } from "./CompanyContext"
import { useSettings } from "./SettingsContext"
import { createNotification } from "../functions/Notifications"
import { measurePerformance } from "../utils/PerformanceTimer"
import { createCachedFetcher } from "../utils/CachedFetcher"
// import { useCompany } from "./CompanyContext" - removed as it's no longer used
import * as BookingsFunctions from "../functions/Bookings"
import { 
  Booking, 
  BookingType, 
  Table, 
  BookingStatus, 
  Customer, 
  WaitlistEntry, 
  BookingSettings,
  FloorPlan,
  BookingStats,
  BookingTag,
  TableElement,
  Location
} from "../interfaces/Bookings"

// Define the state interface
interface BookingsState {
  companyID: string | null;
  siteID: string | null;
  subsiteID: string | null;
  bookings: Booking[];
  bookingTypes: BookingType[];
  tables: Table[];
  bookingStatuses: BookingStatus[];
  bookingTags: BookingTag[];
  customers: Customer[];
  waitlistEntries: WaitlistEntry[];
  bookingSettings: BookingSettings | null;
  floorPlans: FloorPlan[];
  bookingStats: BookingStats | null;
  locations: Location[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

// Initial state
const initialState: BookingsState = {
  companyID: null,
  siteID: null,
  subsiteID: null,
  bookings: [],
  bookingTypes: [],
  tables: [],
  bookingStatuses: [],
  bookingTags: [],
  customers: [],
  waitlistEntries: [],
  bookingSettings: null,
  floorPlans: [],
  bookingStats: null,
  locations: [],
  loading: false,
  error: null,
  initialized: false
}

// Action types enum
enum BookingsActionType {
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  SET_COMPANY_ID = 'SET_COMPANY_ID',
  SET_SITE_ID = 'SET_SITE_ID',
  SET_SUBSITE_ID = 'SET_SUBSITE_ID',
  SET_LOCATIONS = 'SET_LOCATIONS',
  SET_BOOKINGS = 'SET_BOOKINGS',
  ADD_BOOKING = 'ADD_BOOKING',
  UPDATE_BOOKING = 'UPDATE_BOOKING',
  DELETE_BOOKING = 'DELETE_BOOKING',
  SET_BOOKING_TYPES = 'SET_BOOKING_TYPES',
  ADD_BOOKING_TYPE = 'ADD_BOOKING_TYPE',
  UPDATE_BOOKING_TYPE = 'UPDATE_BOOKING_TYPE',
  DELETE_BOOKING_TYPE = 'DELETE_BOOKING_TYPE',
  SET_TABLES = 'SET_TABLES',
  ADD_TABLE = 'ADD_TABLE',
  UPDATE_TABLE = 'UPDATE_TABLE',
  DELETE_TABLE = 'DELETE_TABLE',
  SET_BOOKING_STATUSES = 'SET_BOOKING_STATUSES',
  ADD_BOOKING_STATUS = 'ADD_BOOKING_STATUS',
  UPDATE_BOOKING_STATUS = 'UPDATE_BOOKING_STATUS',
  DELETE_BOOKING_STATUS = 'DELETE_BOOKING_STATUS',
  SET_BOOKING_TAGS = 'SET_BOOKING_TAGS',
  ADD_BOOKING_TAG = 'ADD_BOOKING_TAG',
  UPDATE_BOOKING_TAG = 'UPDATE_BOOKING_TAG',
  DELETE_BOOKING_TAG = 'DELETE_BOOKING_TAG',
  SET_CUSTOMERS = 'SET_CUSTOMERS',
  ADD_CUSTOMER = 'ADD_CUSTOMER',
  UPDATE_CUSTOMER = 'UPDATE_CUSTOMER',
  DELETE_CUSTOMER = 'DELETE_CUSTOMER',
  SET_WAITLIST_ENTRIES = 'SET_WAITLIST_ENTRIES',
  ADD_WAITLIST_ENTRY = 'ADD_WAITLIST_ENTRY',
  UPDATE_WAITLIST_ENTRY = 'UPDATE_WAITLIST_ENTRY',
  DELETE_WAITLIST_ENTRY = 'DELETE_WAITLIST_ENTRY',
  SET_BOOKING_SETTINGS = 'SET_BOOKING_SETTINGS',
  UPDATE_BOOKING_SETTINGS = 'UPDATE_BOOKING_SETTINGS',
  SET_FLOOR_PLANS = 'SET_FLOOR_PLANS',
  ADD_FLOOR_PLAN = 'ADD_FLOOR_PLAN',
  UPDATE_FLOOR_PLAN = 'UPDATE_FLOOR_PLAN',
  DELETE_FLOOR_PLAN = 'DELETE_FLOOR_PLAN',
  SET_BOOKING_STATS = 'SET_BOOKING_STATS',
  SET_INITIALIZED = 'SET_INITIALIZED',
  BATCH_UPDATE = 'BATCH_UPDATE',
  RESET = 'RESET'
}

// Define action types using discriminated union
type BookingsAction =
  | { type: BookingsActionType.SET_LOADING; payload: boolean }
  | { type: BookingsActionType.SET_ERROR; payload: string | null }
  | { type: BookingsActionType.SET_COMPANY_ID; payload: string | null }
  | { type: BookingsActionType.SET_SITE_ID; payload: string | null }
  | { type: BookingsActionType.SET_SUBSITE_ID; payload: string | null }
  | { type: BookingsActionType.SET_LOCATIONS; payload: Location[] }
  | { type: BookingsActionType.SET_BOOKINGS; payload: Booking[] }
  | { type: BookingsActionType.ADD_BOOKING; payload: Booking }
  | { type: BookingsActionType.UPDATE_BOOKING; payload: { id: string; updates: Partial<Booking> } }
  | { type: BookingsActionType.DELETE_BOOKING; payload: string }
  | { type: BookingsActionType.SET_BOOKING_TYPES; payload: BookingType[] }
  | { type: BookingsActionType.ADD_BOOKING_TYPE; payload: BookingType }
  | { type: BookingsActionType.UPDATE_BOOKING_TYPE; payload: { id: string; updates: Partial<BookingType> } }
  | { type: BookingsActionType.DELETE_BOOKING_TYPE; payload: string }
  | { type: BookingsActionType.SET_TABLES; payload: Table[] }
  | { type: BookingsActionType.ADD_TABLE; payload: Table }
  | { type: BookingsActionType.UPDATE_TABLE; payload: { id: string; updates: Partial<Table> } }
  | { type: BookingsActionType.DELETE_TABLE; payload: string }
  | { type: BookingsActionType.SET_BOOKING_STATUSES; payload: BookingStatus[] }
  | { type: BookingsActionType.ADD_BOOKING_STATUS; payload: BookingStatus }
  | { type: BookingsActionType.UPDATE_BOOKING_STATUS; payload: { id: string; updates: Partial<BookingStatus> } }
  | { type: BookingsActionType.DELETE_BOOKING_STATUS; payload: string }
  | { type: BookingsActionType.SET_BOOKING_TAGS; payload: BookingTag[] }
  | { type: BookingsActionType.ADD_BOOKING_TAG; payload: BookingTag }
  | { type: BookingsActionType.UPDATE_BOOKING_TAG; payload: { id: string; updates: Partial<BookingTag> } }
  | { type: BookingsActionType.DELETE_BOOKING_TAG; payload: string }
  | { type: BookingsActionType.SET_CUSTOMERS; payload: Customer[] }
  | { type: BookingsActionType.ADD_CUSTOMER; payload: Customer }
  | { type: BookingsActionType.UPDATE_CUSTOMER; payload: { id: string; updates: Partial<Customer> } }
  | { type: BookingsActionType.DELETE_CUSTOMER; payload: string }
  | { type: BookingsActionType.SET_WAITLIST_ENTRIES; payload: WaitlistEntry[] }
  | { type: BookingsActionType.ADD_WAITLIST_ENTRY; payload: WaitlistEntry }
  | { type: BookingsActionType.UPDATE_WAITLIST_ENTRY; payload: { id: string; updates: Partial<WaitlistEntry> } }
  | { type: BookingsActionType.DELETE_WAITLIST_ENTRY; payload: string }
  | { type: BookingsActionType.SET_BOOKING_SETTINGS; payload: BookingSettings }
  | { type: BookingsActionType.UPDATE_BOOKING_SETTINGS; payload: Partial<BookingSettings> }
  | { type: BookingsActionType.SET_FLOOR_PLANS; payload: FloorPlan[] }
  | { type: BookingsActionType.ADD_FLOOR_PLAN; payload: FloorPlan }
  | { type: BookingsActionType.UPDATE_FLOOR_PLAN; payload: { id: string; updates: Partial<FloorPlan> } }
  | { type: BookingsActionType.DELETE_FLOOR_PLAN; payload: string }
  | { type: BookingsActionType.SET_BOOKING_STATS; payload: BookingStats }
  | { type: BookingsActionType.SET_INITIALIZED; payload: boolean }
  | { 
      type: BookingsActionType.BATCH_UPDATE; 
      payload: {
        bookings?: Booking[]
        bookingTypes?: BookingType[]
        tables?: Table[]
        bookingStatuses?: BookingStatus[]
        bookingTags?: BookingTag[]
        customers?: Customer[]
        waitlistEntries?: WaitlistEntry[]
        bookingSettings?: BookingSettings | null
        floorPlans?: FloorPlan[]
        locations?: Location[]
        initialized?: boolean
      }
    }
  | { type: BookingsActionType.RESET }

// Reducer function
const bookingsReducer = (state: BookingsState, action: BookingsAction): BookingsState => {
  switch (action.type) {
    case BookingsActionType.SET_LOADING:
      return { ...state, loading: action.payload }
    case BookingsActionType.SET_ERROR:
      return { ...state, error: action.payload }
    case BookingsActionType.SET_COMPANY_ID:
      return { ...state, companyID: action.payload }
    case BookingsActionType.SET_SITE_ID:
      return { ...state, siteID: action.payload }
    case BookingsActionType.SET_SUBSITE_ID:
      return { ...state, subsiteID: action.payload }
    case BookingsActionType.SET_LOCATIONS:
      return { ...state, locations: action.payload }
    case BookingsActionType.SET_BOOKINGS:
      return { ...state, bookings: action.payload }
    case BookingsActionType.ADD_BOOKING:
      return { ...state, bookings: [...state.bookings, action.payload] }
    case BookingsActionType.UPDATE_BOOKING:
      return {
        ...state,
        bookings: state.bookings.map(booking => 
          booking.id === action.payload.id 
            ? { ...booking, ...action.payload.updates } 
            : booking
        )
      }
    case BookingsActionType.DELETE_BOOKING:
      return {
        ...state,
        bookings: state.bookings.filter(booking => booking.id !== action.payload)
      }
    case BookingsActionType.SET_BOOKING_TYPES:
      return { ...state, bookingTypes: action.payload }
    case BookingsActionType.ADD_BOOKING_TYPE:
      return { ...state, bookingTypes: [...state.bookingTypes, action.payload] }
    case BookingsActionType.UPDATE_BOOKING_TYPE:
      return {
        ...state,
        bookingTypes: state.bookingTypes.map(bookingType => 
          bookingType.id === action.payload.id 
            ? { ...bookingType, ...action.payload.updates } 
            : bookingType
        )
      }
    case BookingsActionType.DELETE_BOOKING_TYPE:
      return {
        ...state,
        bookingTypes: state.bookingTypes.filter(bookingType => bookingType.id !== action.payload)
      }
    case BookingsActionType.SET_TABLES:
      return { ...state, tables: action.payload }
    case BookingsActionType.ADD_TABLE:
      return { ...state, tables: [...state.tables, action.payload] }
    case BookingsActionType.UPDATE_TABLE:
      return {
        ...state,
        tables: state.tables.map(table => 
          table.id === action.payload.id 
            ? { ...table, ...action.payload.updates } 
            : table
        )
      }
    case BookingsActionType.DELETE_TABLE:
      return {
        ...state,
        tables: state.tables.filter(table => table.id !== action.payload)
      }
    case BookingsActionType.SET_BOOKING_STATUSES:
      return { ...state, bookingStatuses: action.payload }
    case BookingsActionType.ADD_BOOKING_STATUS:
      return { ...state, bookingStatuses: [...state.bookingStatuses, action.payload] }
    case BookingsActionType.UPDATE_BOOKING_STATUS:
      return {
        ...state,
        bookingStatuses: state.bookingStatuses.map(status => 
          status.id === action.payload.id 
            ? { ...status, ...action.payload.updates } 
            : status
        )
      }
    case BookingsActionType.DELETE_BOOKING_STATUS:
      return {
        ...state,
        bookingStatuses: state.bookingStatuses.filter(status => status.id !== action.payload)
      }
    case BookingsActionType.SET_BOOKING_TAGS:
      return { ...state, bookingTags: action.payload }
    case BookingsActionType.ADD_BOOKING_TAG:
      return { ...state, bookingTags: [...state.bookingTags, action.payload] }
    case BookingsActionType.UPDATE_BOOKING_TAG:
      return {
        ...state,
        bookingTags: state.bookingTags.map(tag => 
          tag.id === action.payload.id 
            ? { ...tag, ...action.payload.updates } 
            : tag
        )
      }
    case BookingsActionType.DELETE_BOOKING_TAG:
      return {
        ...state,
        bookingTags: state.bookingTags.filter(tag => tag.id !== action.payload)
      }
    case BookingsActionType.SET_CUSTOMERS:
      return { ...state, customers: action.payload }
    case BookingsActionType.ADD_CUSTOMER:
      return { ...state, customers: [...state.customers, action.payload] }
    case BookingsActionType.UPDATE_CUSTOMER:
      return {
        ...state,
        customers: state.customers.map(customer => 
          customer.id === action.payload.id 
            ? { ...customer, ...action.payload.updates } 
            : customer
        )
      }
    case BookingsActionType.DELETE_CUSTOMER:
      return {
        ...state,
        customers: state.customers.filter(customer => customer.id !== action.payload)
      }
    case BookingsActionType.SET_WAITLIST_ENTRIES:
      return { ...state, waitlistEntries: action.payload }
    case BookingsActionType.ADD_WAITLIST_ENTRY:
      return { ...state, waitlistEntries: [...state.waitlistEntries, action.payload] }
    case BookingsActionType.UPDATE_WAITLIST_ENTRY:
      return {
        ...state,
        waitlistEntries: state.waitlistEntries.map(entry => 
          entry.id === action.payload.id 
            ? { ...entry, ...action.payload.updates } 
            : entry
        )
      }
    case BookingsActionType.DELETE_WAITLIST_ENTRY:
      return {
        ...state,
        waitlistEntries: state.waitlistEntries.filter(entry => entry.id !== action.payload)
      }
    case BookingsActionType.SET_BOOKING_SETTINGS:
      return { ...state, bookingSettings: action.payload }
    case BookingsActionType.UPDATE_BOOKING_SETTINGS:
      return { 
        ...state, 
        bookingSettings: state.bookingSettings 
          ? { ...state.bookingSettings, ...action.payload } 
          : action.payload as BookingSettings 
      }
    case BookingsActionType.SET_FLOOR_PLANS:
      return { ...state, floorPlans: action.payload }
    case BookingsActionType.ADD_FLOOR_PLAN:
      return { ...state, floorPlans: [...state.floorPlans, action.payload] }
    case BookingsActionType.UPDATE_FLOOR_PLAN:
      return {
        ...state,
        floorPlans: state.floorPlans.map(plan => 
          plan.id === action.payload.id 
            ? { ...plan, ...action.payload.updates } 
            : plan
        )
      }
    case BookingsActionType.DELETE_FLOOR_PLAN:
      return {
        ...state,
        floorPlans: state.floorPlans.filter(plan => plan.id !== action.payload)
      }
    case BookingsActionType.SET_BOOKING_STATS:
      return { ...state, bookingStats: action.payload }
    case BookingsActionType.SET_INITIALIZED:
      return { ...state, initialized: action.payload }
    case BookingsActionType.BATCH_UPDATE:
      return {
        ...state,
        ...(action.payload.bookings !== undefined && { bookings: action.payload.bookings }),
        ...(action.payload.bookingTypes !== undefined && { bookingTypes: action.payload.bookingTypes }),
        ...(action.payload.tables !== undefined && { tables: action.payload.tables }),
        ...(action.payload.bookingStatuses !== undefined && { bookingStatuses: action.payload.bookingStatuses }),
        ...(action.payload.bookingTags !== undefined && { bookingTags: action.payload.bookingTags }),
        ...(action.payload.customers !== undefined && { customers: action.payload.customers }),
        ...(action.payload.waitlistEntries !== undefined && { waitlistEntries: action.payload.waitlistEntries }),
        ...(action.payload.bookingSettings !== undefined && { bookingSettings: action.payload.bookingSettings }),
        ...(action.payload.floorPlans !== undefined && { floorPlans: action.payload.floorPlans }),
        ...(action.payload.locations !== undefined && { locations: action.payload.locations }),
        ...(action.payload.initialized !== undefined && { initialized: action.payload.initialized }),
      }
    case BookingsActionType.RESET:
      return initialState
    default:
      return state
  }
}

// Define the context interface
interface BookingsContextType extends BookingsState {
  // Derived data source path(s)
  basePath: string
  // Permission functions
  canViewBookings: () => boolean
  canEditBookings: () => boolean
  canDeleteBookings: () => boolean
  isOwner: () => boolean
  // Booking operations
  fetchBookings: () => Promise<void>;
  fetchBookingsByCustomer: (customerId: string) => Promise<void>;
  fetchBookingsByTable: (tableId: string) => Promise<void>;
  fetchBookingsByDate: (date: string) => Promise<void>;
  addBooking: (booking: Omit<Booking, "id" | "createdAt" | "updatedAt">) => Promise<Booking>;
  updateBooking: (bookingId: string, updates: Partial<Booking>) => Promise<void>;
  deleteBooking: (bookingId: string) => Promise<void>;
  
  // Booking type operations
  fetchBookingTypes: () => Promise<void>;
  addBookingType: (bookingType: Omit<BookingType, "id">) => Promise<BookingType>;
  updateBookingType: (bookingTypeId: string, updates: Partial<BookingType>) => Promise<void>;
  deleteBookingType: (bookingTypeId: string) => Promise<void>;
  
  // Table operations
  fetchTables: () => Promise<void>;
  addTable: (table: Omit<Table, "id">) => Promise<Table>;
  updateTable: (tableId: string, updates: Partial<Table>) => Promise<void>;
  deleteTable: (tableId: string) => Promise<void>;
  
  // Booking status operations
  fetchBookingStatuses: () => Promise<void>;
  addBookingStatus: (status: Omit<BookingStatus, "id" | "createdAt" | "updatedAt">) => Promise<BookingStatus>;
  updateBookingStatus: (statusId: string, updates: Partial<BookingStatus>) => Promise<void>;
  deleteBookingStatus: (statusId: string) => Promise<void>;
  
  // Customer operations
  fetchCustomers: () => Promise<void>;
  addCustomer: (customer: Customer) => Promise<Customer>;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  
  // Waitlist operations
  fetchWaitlistEntries: () => Promise<void>;
  addWaitlistEntry: (entry: Omit<WaitlistEntry, "id" | "timeAdded" | "status">) => Promise<WaitlistEntry>;
  updateWaitlistEntry: (entryId: string, updates: Partial<WaitlistEntry>) => Promise<void>;
  deleteWaitlistEntry: (entryId: string) => Promise<void>;
  createWaitlistEntry: (entryData: any) => Promise<any>;
  
  // Tag operations
  createTag: (tagData: any) => Promise<any>;
  updateTag: (tagId: string, tagData: any) => Promise<void>;
  deleteTag: (tagId: string) => Promise<void>;
  
  // Preorder profile operations
  createPreorderProfile: (profileData: any) => Promise<any>;
  updatePreorderProfile: (profileId: string, profileData: any) => Promise<void>;
  
  // Settings operations
  fetchBookingSettings: () => Promise<void>;
  updateBookingSettings: (updates: Partial<BookingSettings>) => Promise<void>;
  
  // OAuth operations
  checkOAuthToken: (provider: 'gmail' | 'outlook') => Promise<boolean>;
  
  // Floor plan operations
  fetchFloorPlans: () => Promise<void>;
  addFloorPlan: (floorPlan: Partial<FloorPlan>) => Promise<FloorPlan>;
  updateFloorPlan: (floorPlanId: string, updates: Partial<FloorPlan>) => Promise<void>;
  deleteFloorPlan: (floorPlanId: string) => Promise<void>;
  
  // Table element operations for floor plans
  addTableToFloorPlan: (floorPlanId: string, tableElement: Omit<TableElement, "id">) => Promise<TableElement>;
  updateTableInFloorPlan: (floorPlanId: string, tableElementId: string, updates: Partial<TableElement>) => Promise<void>;
  removeTableFromFloorPlan: (floorPlanId: string, tableElementId: string) => Promise<void>;
  
  // Stats operations
  fetchBookingStats: () => Promise<void>;
  
  // Booking tags operations
  fetchBookingTags: () => Promise<void>;
  addBookingTag: (tag: Omit<BookingTag, "id" | "createdAt" | "updatedAt">) => Promise<BookingTag>;
  updateBookingTag: (tagId: string, updates: Partial<BookingTag>) => Promise<void>;
  deleteBookingTag: (tagId: string) => Promise<void>;
  
  // Preorder profile operations
  fetchPreorderProfiles: () => Promise<PreorderProfile[]>;
  savePreorderProfile: (profile: PreorderProfile) => Promise<string>;
  deletePreorderProfile: (profileId: string) => Promise<void>;
  
  // Stock integration operations
  fetchStockCourses: () => Promise<Array<Record<string, unknown>>>;
  fetchStockProducts: () => Promise<Array<Record<string, unknown>>>;
  
  // Utility functions
  calculateEndTime: (arrivalTime: string, duration: number) => string;
  generateTimeSlots: (intervalMinutes?: number) => string[];
  normalizeColor: (color: string | undefined) => string;
  
  // Reset state
  resetBookingsState: () => void;
}

// Create the context
const BookingsContext = createContext<BookingsContextType | undefined>(undefined)







// Create a hook for accessing the BookingsContext - graceful handling when not loaded
// Track warnings to avoid spam during initial load
let bookingsWarningShown = false

export const useBookings = (): BookingsContextType => {
  const context = useContext(BookingsContext)
  if (context === undefined) {
    // Return a safe default context instead of throwing error
    // This allows components to render even when Bookings module isn't loaded yet
    // Only warn once in development mode to reduce console noise
    if (process.env.NODE_ENV === 'development' && !bookingsWarningShown) {
      bookingsWarningShown = true
      // Only warn if it's not expected (i.e., not during initial navigation)
      console.warn("useBookings called outside BookingsProvider - returning empty context (this is normal during initial load)")
    }
    
    const emptyContext: BookingsContextType = {
      companyID: null,
      siteID: null,
      subsiteID: null,
      bookings: [],
      bookingTypes: [],
      tables: [],
      bookingStatuses: [],
      bookingTags: [],
      customers: [],
      waitlistEntries: [],
      bookingSettings: null,
      floorPlans: [],
      bookingStats: null,
      locations: [],
      loading: false,
      error: null,
      initialized: false,
      basePath: "",
      canViewBookings: () => false,
      canEditBookings: () => false,
      canDeleteBookings: () => false,
      isOwner: () => false,
      fetchBookings: async () => {},
      fetchBookingsByCustomer: async () => {},
      fetchBookingsByTable: async () => {},
      fetchBookingsByDate: async () => {},
      addBooking: async () => ({} as Booking),
      updateBooking: async () => {},
      deleteBooking: async () => {},
      fetchBookingTypes: async () => {},
      addBookingType: async () => ({} as BookingType),
      updateBookingType: async () => {},
      deleteBookingType: async () => {},
      fetchTables: async () => {},
      addTable: async () => ({} as any),
      updateTable: async () => {},
      deleteTable: async () => {},
      fetchBookingStatuses: async () => {},
      addBookingStatus: async () => ({} as any),
      updateBookingStatus: async () => {},
      deleteBookingStatus: async () => {},
      fetchCustomers: async () => {},
      addCustomer: async () => ({} as any),
      updateCustomer: async () => {},
      deleteCustomer: async () => {},
      fetchWaitlistEntries: async () => {},
      addWaitlistEntry: async () => ({} as any),
      updateWaitlistEntry: async () => {},
      deleteWaitlistEntry: async () => {},
      createWaitlistEntry: async () => ({}),
      createTag: async () => ({}),
      updateTag: async () => {},
      deleteTag: async () => {},
      createPreorderProfile: async () => ({}),
      updatePreorderProfile: async () => {},
      fetchBookingSettings: async () => {},
      updateBookingSettings: async () => {},
      checkOAuthToken: async () => false,
      fetchFloorPlans: async () => {},
      addFloorPlan: async () => ({} as any),
      updateFloorPlan: async () => {},
      deleteFloorPlan: async () => {},
      addTableToFloorPlan: async () => ({} as any),
      updateTableInFloorPlan: async () => {},
      removeTableFromFloorPlan: async () => {},
      fetchBookingStats: async () => {},
      fetchBookingTags: async () => {},
      addBookingTag: async () => ({} as any),
      updateBookingTag: async () => {},
      deleteBookingTag: async () => {},
      fetchPreorderProfiles: async () => [],
      savePreorderProfile: async () => "",
      deletePreorderProfile: async () => {},
      fetchStockCourses: async () => [],
      fetchStockProducts: async () => [],
      calculateEndTime: () => "",
      generateTimeSlots: () => [],
      normalizeColor: () => "#000000",
      resetBookingsState: () => {},
    }
    
    return emptyContext
  }
  return context
}

// Export types for frontend components to use
export type { 
  Booking, 
  BookingType, 
  Table, 
  BookingStatus, 
  Customer, 
  WaitlistEntry, 
  BookingSettings,
  FloorPlan,
  BookingStats,
  BookingTag,
  TableElement
} from "../interfaces/Bookings"

// Create the BookingsProvider component
interface BookingsProviderProps {
  children: React.ReactNode
}

export const BookingsProvider: React.FC<BookingsProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(bookingsReducer, initialState)
  const { state: companyState, isOwner, hasPermission } = useCompany()
  const { state: settingsState } = useSettings()
  const isInitializing = useRef(false)
  const lastBasePath = useRef<string>("")

  // Multi-path loader for Bookings data - prioritize subsite over site
  const getBookingsPaths = useCallback(() => {
    if (!companyState.companyID) return []
    const paths = []
    const companyRoot = `companies/${companyState.companyID}`
    if (companyState.selectedSiteID) {
      // If subsite is selected, prioritize subsite level first
      if (companyState.selectedSubsiteID) {
        paths.push(`${companyRoot}/sites/${companyState.selectedSiteID}/subsites/${companyState.selectedSubsiteID}/data/bookings`)
        paths.push(`${companyRoot}/sites/${companyState.selectedSiteID}/data/bookings`)
      } else {
        // If no subsite selected, only check site level
        paths.push(`${companyRoot}/sites/${companyState.selectedSiteID}/data/bookings`)
      }
    }
    return paths
  }, [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID])

  // Compute the current bookings base path derived from company/site selection (backwards compatibility)
  const basePath = useMemo(() => {
    const paths = getBookingsPaths()
    return paths.length > 0 ? paths[0] : ""
  }, [getBookingsPaths])

  // Update company and site IDs when they change
  useEffect(() => {
    dispatch({ type: BookingsActionType.SET_COMPANY_ID, payload: companyState.companyID || null })
    dispatch({ type: BookingsActionType.SET_SITE_ID, payload: companyState.selectedSiteID || null })
    dispatch({ type: BookingsActionType.SET_SUBSITE_ID, payload: companyState.selectedSubsiteID || null })
  }, [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID])

  // Debounced lazy loading - only initialize when basePath stabilizes
  const refreshTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Wait for dependencies: Settings and Company must be ready first
    if (!settingsState.auth || settingsState.loading) {
      return // Settings not ready yet
    }
    
    // If no company selected but user is logged in, mark as initialized with empty state
    if (!companyState.companyID && settingsState.auth.isLoggedIn) {
      if (!state.initialized) {
        dispatch({ type: BookingsActionType.SET_INITIALIZED, payload: true })
        if (process.env.NODE_ENV === 'development') {
          console.log("✅ BookingsContext: Initialized with empty state (no company selected)")
        }
      }
      return // Company not selected yet (but user is logged in)
    }
    
    // Clear any pending refresh
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    const init = async () => {
      // Prevent duplicate initialization
      if (!companyState.companyID || !basePath || isInitializing.current) {
        // If no basePath but we have a company, mark as initialized with empty state
        if (companyState.companyID && !basePath && !state.initialized) {
          dispatch({ type: BookingsActionType.SET_INITIALIZED, payload: true })
          if (process.env.NODE_ENV === 'development') {
            console.log("✅ BookingsContext: Initialized with empty state (no site selected)")
          }
        }
        return
      }
      if (basePath === lastBasePath.current && state.initialized) return
      
      // For subsite-level data, we need both siteID and subsiteID
      if (companyState.selectedSubsiteID && !companyState.selectedSiteID) return
      
      isInitializing.current = true
      lastBasePath.current = basePath
      dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
      
      await measurePerformance('BookingsContext', 'init', async () => {
        try {
          const paths = getBookingsPaths()
          
          // Create cached fetchers
          const fetchBookingsCached = createCachedFetcher(
            async (_path: string) => {
              for (const p of paths) {
                try {
                  const data = await BookingsFunctions.getBookings(p)
                  if (data && data.length > 0) return data
                } catch (error) {
                  continue
                }
              }
              return []
            },
            'bookings'
          )
          const fetchTablesCached = createCachedFetcher(BookingsFunctions.getTables, 'tables')
          const fetchBookingTypesCached = createCachedFetcher(BookingsFunctions.getBookingTypes, 'bookingTypes')
          const fetchBookingStatusesCached = createCachedFetcher(BookingsFunctions.getBookingStatuses, 'bookingStatuses')
          
          // PROGRESSIVE LOADING: Critical data first (for immediate UI)
          const [bookings, tables] = await Promise.all([
            fetchBookingsCached(basePath, false).catch(() => []),
            fetchTablesCached(basePath, false).catch(() => []),
          ])
          
          // Update critical data immediately
          dispatch({ 
            type: BookingsActionType.BATCH_UPDATE, 
            payload: {
              bookings: bookings || [],
              tables: tables || [],
              initialized: true
            }
          })
          
          console.log("📅 BookingsContext: Critical data loaded (bookings, tables) for", basePath)
          
          // BACKGROUND: Load non-critical data after (non-blocking)
          const loadBackgroundData = () => {
            Promise.all([
              fetchBookingTypesCached(basePath, false).catch(() => []),
              fetchBookingStatusesCached(basePath, false).catch(() => []),
            ]).then(([bookingTypes, bookingStatuses]) => {
              dispatch({ 
                type: BookingsActionType.BATCH_UPDATE, 
                payload: {
                  bookingTypes: bookingTypes || [],
                  bookingStatuses: bookingStatuses || [],
                }
              })
              console.log("📅 BookingsContext: Background data loaded for", basePath)
            }).catch(error => {
              console.warn('Error loading background bookings data:', error)
            })
          }
          
          // Use requestIdleCallback if available, otherwise setTimeout
          if ('requestIdleCallback' in window) {
            requestIdleCallback(loadBackgroundData, { timeout: 2000 })
          } else {
            setTimeout(loadBackgroundData, 100)
          }
        } catch (error) {
          console.warn('Bookings data refresh failed, maintaining old data:', error)
          // Keep old data visible even if refresh fails
        } finally {
          isInitializing.current = false
          dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
        }
      }, () => ({
        bookings: state.bookings?.length || 0,
        tables: state.tables?.length || 0,
        bookingTypes: state.bookingTypes?.length || 0,
      }))
    }

    // Only initialize if basePath is valid and different
    if (basePath && basePath !== lastBasePath.current) {
      // Debounce to prevent rapid refreshes during company/site switching
      refreshTimeoutRef.current = setTimeout(() => {
        void init()
      }, 100) // Reduced debounce for faster loading
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [basePath, settingsState.auth, settingsState.loading, companyState.companyID])

  // Booking operations with multi-path loading
  const fetchBookings = useCallback(async () => {
    const paths = getBookingsPaths()
    if (paths.length === 0) return
    
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      for (const path of paths) {
        try {
          console.log("Bookings Context - trying to load bookings from path:", path)
          const bookings = await BookingsFunctions.getBookings(path)
          if (bookings && bookings.length > 0) {
            console.log("Bookings Context - loaded bookings from path:", path)
            dispatch({ type: BookingsActionType.SET_BOOKINGS, payload: bookings })
            return
          }
        } catch (error) {
          console.log("Bookings Context - failed to load bookings from path:", path, error)
          continue
        }
      }
      console.log("Bookings Context - no bookings data found in any path")
      dispatch({ type: BookingsActionType.SET_BOOKINGS, payload: [] })
    } catch (error) {
      console.error("Error fetching bookings:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to fetch bookings" })
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [getBookingsPaths])

  const fetchBookingsByDate = useCallback(async (date: string) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const bookings = await BookingsFunctions.getBookingsByDate(basePath, date)
      dispatch({ type: BookingsActionType.SET_BOOKINGS, payload: bookings })
    } catch (error) {
      console.error("Error fetching bookings by date:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to fetch bookings by date" })
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  // Note: getBookingsByCustomer doesn't exist in the backend, using custom implementation
  const fetchBookingsByCustomer = useCallback(async (customerId: string) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      // Get all bookings and filter by customer ID
      const allBookings = await BookingsFunctions.getBookings(basePath)
      const customerBookings = allBookings.filter(booking => booking.customerId === customerId)
      dispatch({ type: BookingsActionType.SET_BOOKINGS, payload: customerBookings })
    } catch (error) {
      console.error("Error fetching bookings by customer:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to fetch bookings by customer" })
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  // Note: getBookingsByTable doesn't exist in the backend, using custom implementation
  const fetchBookingsByTable = useCallback(async (tableId: string) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      // Get all bookings and filter by table ID
      const allBookings = await BookingsFunctions.getBookings(basePath)
      const tableBookings = allBookings.filter(booking => booking.tableId === tableId)
      dispatch({ type: BookingsActionType.SET_BOOKINGS, payload: tableBookings })
    } catch (error) {
      console.error("Error fetching bookings by table:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to fetch bookings by table" })
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const addBooking = useCallback(async (booking: Omit<Booking, "id" | "createdAt" | "updatedAt">): Promise<Booking> => {
    if (!basePath) {
      throw new Error("Base path not available")
    }
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const newBooking = await BookingsFunctions.addBooking(basePath, booking)
      if (!newBooking) {
        throw new Error("Failed to create booking")
      }
      dispatch({ type: BookingsActionType.ADD_BOOKING, payload: newBooking })
      
      // Add notification
      try {
        await createNotification(
          companyState.companyID,
          settingsState.auth?.uid || 'system',
          'booking',
          'created',
          'Booking Created',
          `New booking for ${booking.customer || 'customer'} on ${booking.date}`,
          {
            siteId: companyState.selectedSiteID || undefined,
            priority: 'medium',
            category: 'success',
            details: {
              entityId: newBooking.id,
              entityName: `Booking for ${booking.customer || 'customer'}`,
              newValue: newBooking,
              changes: {
                booking: { from: {}, to: newBooking }
              }
            }
          }
        )
      } catch (notificationError) {
        console.warn('Failed to create notification:', notificationError)
      }
      
      return newBooking
    } catch (error) {
      console.error("Error adding booking:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to add booking" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath, companyState.companyID, companyState.selectedSiteID, settingsState.auth?.uid])

  const updateBooking = useCallback(async (bookingId: string, updates: Partial<Booking>) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      // First get the full booking
      const bookings = await BookingsFunctions.getBookings(basePath)
      const booking = bookings.find(b => b.id === bookingId)
      
      if (!booking) {
        throw new Error(`Booking with ID ${bookingId} not found`)
      }

      // Then update it with the new values
      await BookingsFunctions.updateBooking(basePath, booking.id, updates)
      dispatch({ type: BookingsActionType.UPDATE_BOOKING, payload: { id: bookingId, updates } })
      
      // Add notification
      try {
        await createNotification(
          companyState.companyID,
          settingsState.auth?.uid || 'system',
          'booking',
          'updated',
          'Booking Updated',
          `Booking for ${booking.customer || 'customer'} was updated`,
          {
            siteId: companyState.selectedSiteID || undefined,
            priority: 'medium',
            category: 'info',
            details: {
              entityId: bookingId,
              entityName: `Booking for ${booking.customer || 'customer'}`,
              oldValue: booking,
              newValue: { ...booking, ...updates },
              changes: {
                booking: { from: booking, to: { ...booking, ...updates } }
              }
            }
          }
        )
      } catch (notificationError) {
        console.warn('Failed to create notification:', notificationError)
      }
    } catch (error) {
      console.error("Error updating booking:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to update booking" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const deleteBooking = useCallback(async (bookingId: string) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      // Get booking info before deletion for notification
      const bookings = await BookingsFunctions.getBookings(basePath)
      const bookingToDelete = bookings.find(b => b.id === bookingId)
      
      await BookingsFunctions.deleteBooking(basePath, bookingId)
      dispatch({ type: BookingsActionType.DELETE_BOOKING, payload: bookingId })
      
      // Add notification
      if (bookingToDelete) {
        try {
          await createNotification(
            companyState.companyID,
            settingsState.auth?.uid || 'system',
            'booking',
            'deleted',
            'Booking Cancelled',
            `Booking for ${bookingToDelete.customer || 'customer'} was cancelled`,
            {
              siteId: companyState.selectedSiteID || undefined,
              priority: 'medium',
              category: 'warning',
              details: {
                entityId: bookingId,
                entityName: `Booking for ${bookingToDelete.customer || 'customer'}`,
                oldValue: bookingToDelete,
                changes: {
                  booking: { from: bookingToDelete, to: null }
                }
              }
            }
          )
        } catch (notificationError) {
          console.warn('Failed to create notification:', notificationError)
        }
      }
    } catch (error) {
      console.error("Error deleting booking:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to delete booking" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath, companyState.companyID, companyState.selectedSiteID, settingsState.auth?.uid])

  // Booking type operations
  const fetchBookingTypes = useCallback(async () => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const bookingTypes = await BookingsFunctions.getBookingTypes(basePath)
      dispatch({ type: BookingsActionType.SET_BOOKING_TYPES, payload: bookingTypes })
    } catch (error) {
      console.error("Error fetching booking types:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to fetch booking types" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  // Booking type operations
  const addBookingType = useCallback(async (bookingType: Omit<BookingType, "id">) => {
    if (!basePath) throw new Error("Base path not available")
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const newType = await BookingsFunctions.addBookingType(basePath, bookingType)
      dispatch({ type: BookingsActionType.ADD_BOOKING_TYPE, payload: newType })
      return newType
    } catch (error) {
      console.error("Error adding booking type:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to add booking type" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const updateBookingType = useCallback(async (bookingTypeId: string, updates: Partial<BookingType>) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      await BookingsFunctions.updateBookingType(basePath, bookingTypeId, updates)
      dispatch({ type: BookingsActionType.UPDATE_BOOKING_TYPE, payload: { id: bookingTypeId, updates } })
    } catch (error) {
      console.error("Error updating booking type:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to update booking type" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const deleteBookingType = useCallback(async (bookingTypeId: string) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      await BookingsFunctions.deleteBookingType(basePath, bookingTypeId)
      dispatch({ type: BookingsActionType.DELETE_BOOKING_TYPE, payload: bookingTypeId })
    } catch (error) {
      console.error("Error deleting booking type:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to delete booking type" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  // Table operations
  const fetchTables = useCallback(async () => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const tables = await BookingsFunctions.getTables(basePath)
      dispatch({ type: BookingsActionType.SET_TABLES, payload: tables })
    } catch (error) {
      console.error("Error fetching tables:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to fetch tables" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const addTable = useCallback(async (table: Omit<Table, "id">) => {
    if (!basePath) throw new Error("Base path not available")
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const newTable = await BookingsFunctions.addTable(basePath, table)
      dispatch({ type: BookingsActionType.ADD_TABLE, payload: newTable })
      return newTable
    } catch (error) {
      console.error("Error adding table:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to add table" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const updateTable = useCallback(async (tableId: string, updates: Partial<Table>) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      await BookingsFunctions.updateTable(basePath, tableId, updates)
      dispatch({ type: BookingsActionType.UPDATE_TABLE, payload: { id: tableId, updates } })
    } catch (error) {
      console.error("Error updating table:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to update table" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const deleteTable = useCallback(async (tableId: string) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      await BookingsFunctions.deleteTable(basePath, tableId)
      dispatch({ type: BookingsActionType.DELETE_TABLE, payload: tableId })
    } catch (error) {
      console.error("Error deleting table:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to delete table" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  // Booking status operations
  const fetchBookingStatuses = useCallback(async () => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const statuses = await BookingsFunctions.getBookingStatuses(basePath)
      dispatch({ type: BookingsActionType.SET_BOOKING_STATUSES, payload: statuses })
    } catch (error) {
      console.error("Error fetching booking statuses:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to fetch booking statuses" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const addBookingStatus = useCallback(async (status: Omit<BookingStatus, "id" | "createdAt" | "updatedAt">) => {
    if (!basePath) throw new Error("Base path not available")
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const newStatus = await BookingsFunctions.addBookingStatus(basePath, status)
      dispatch({ type: BookingsActionType.ADD_BOOKING_STATUS, payload: newStatus })
      return newStatus
    } catch (error) {
      console.error("Error adding booking status:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to add booking status" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const updateBookingStatus = useCallback(async (statusId: string, updates: Partial<BookingStatus>) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      await BookingsFunctions.updateBookingStatus(basePath, statusId, updates)
      dispatch({ type: BookingsActionType.UPDATE_BOOKING_STATUS, payload: { id: statusId, updates } })
    } catch (error) {
      console.error("Error updating booking status:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to update booking status" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const deleteBookingStatus = useCallback(async (statusId: string) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      await BookingsFunctions.deleteBookingStatus(basePath, statusId)
      dispatch({ type: BookingsActionType.DELETE_BOOKING_STATUS, payload: statusId })
    } catch (error) {
      console.error("Error deleting booking status:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to delete booking status" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  // Customer operations
  const fetchCustomers = useCallback(async () => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const customers = await BookingsFunctions.getCustomers(basePath)
      dispatch({ type: BookingsActionType.SET_CUSTOMERS, payload: customers })
    } catch (error) {
      console.error("Error fetching customers:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to fetch customers" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const addCustomer = useCallback(async (customer: Customer) => {
    if (!basePath) throw new Error("Base path not available")
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const newCustomer = await BookingsFunctions.saveCustomerData(basePath, customer)
      dispatch({ type: BookingsActionType.ADD_CUSTOMER, payload: newCustomer })
      return newCustomer
    } catch (error) {
      console.error("Error adding customer:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to add customer" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const updateCustomer = useCallback(async (customerId: string, updates: Partial<Customer>) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      // Need to get the full customer first, then apply updates
      const customers = await BookingsFunctions.getCustomers(basePath)
      const customer = customers.find(c => c.id === customerId)
      
      if (!customer) {
        throw new Error(`Customer with ID ${customerId} not found`)
      }
      
      const updatedCustomer = { ...customer, ...updates }
      await BookingsFunctions.saveCustomerData(basePath, updatedCustomer)
      dispatch({ type: BookingsActionType.UPDATE_CUSTOMER, payload: { id: customerId, updates } })
    } catch (error) {
      console.error("Error updating customer:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to update customer" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const deleteCustomer = useCallback(async (customerId: string) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      await BookingsFunctions.deleteCustomer(basePath, customerId)
      dispatch({ type: BookingsActionType.DELETE_CUSTOMER, payload: customerId })
    } catch (error) {
      console.error("Error deleting customer:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to delete customer" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  // Reset state
  const resetBookingsState = useCallback(() => {
    dispatch({ type: BookingsActionType.RESET })
  }, [])

  // Waitlist operations
  const fetchWaitlistEntries = useCallback(async () => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const entries = await BookingsFunctions.getWaitlist(basePath)
      dispatch({ type: BookingsActionType.SET_WAITLIST_ENTRIES, payload: entries })
    } catch (error) {
      console.error("Error fetching waitlist entries:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to fetch waitlist entries" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const addWaitlistEntry = useCallback(async (entry: Omit<WaitlistEntry, "id" | "timeAdded" | "status">) => {
    if (!basePath) throw new Error("Base path not available")
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const newEntry = await BookingsFunctions.addWaitlistEntry(basePath, entry)
      dispatch({ type: BookingsActionType.ADD_WAITLIST_ENTRY, payload: newEntry })
      return newEntry
    } catch (error) {
      console.error("Error adding waitlist entry:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to add waitlist entry" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const updateWaitlistEntry = useCallback(async (entryId: string, updates: Partial<WaitlistEntry>) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      await BookingsFunctions.updateWaitlist(basePath, entryId, updates)
      dispatch({ type: BookingsActionType.UPDATE_WAITLIST_ENTRY, payload: { id: entryId, updates } })
    } catch (error) {
      console.error("Error updating waitlist entry:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to update waitlist entry" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const deleteWaitlistEntry = useCallback(async (entryId: string) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      await BookingsFunctions.removeWaitlistEntry(basePath, entryId)
      dispatch({ type: BookingsActionType.DELETE_WAITLIST_ENTRY, payload: entryId })
    } catch (error) {
      console.error("Error deleting waitlist entry:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to delete waitlist entry" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  // Booking settings operations
  const fetchBookingSettings = useCallback(async () => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const settings = await BookingsFunctions.getBookingSettings(basePath)
      if (settings) {
        dispatch({ type: BookingsActionType.SET_BOOKING_SETTINGS, payload: settings })
      }
    } catch (error) {
      console.error("Error fetching booking settings:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to fetch booking settings" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const updateBookingSettings = useCallback(async (updates: Partial<BookingSettings>) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      // Need to get the full settings first, then apply updates
      const currentSettings = await BookingsFunctions.getBookingSettings(basePath)
      if (!currentSettings) {
        throw new Error("No existing booking settings found")
      }
      
      // Ensure required fields have default values
      const updatedSettings: BookingSettings = {
        ...currentSettings,
        ...updates,
        openTimes: currentSettings.openTimes || {},
        bookingTypes: currentSettings.bookingTypes || {}
      }
      
      await BookingsFunctions.updateBookingSettings(basePath, updatedSettings)
      dispatch({ type: BookingsActionType.SET_BOOKING_SETTINGS, payload: updatedSettings })
    } catch (error) {
      console.error("Error updating booking settings:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to update booking settings" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  // OAuth token check
  const checkOAuthToken = useCallback(async (provider: 'gmail' | 'outlook') => {
    if (!companyState.companyID) return false
    
    try {
      const companyId = companyState.companyID
      const siteId = companyState.selectedSiteID || 'default'
      const subsiteId = companyState.selectedSubsiteID || 'default'
      const tokenDocId = `${companyId}_${siteId}_${subsiteId}_${provider}`
      
      // Check if OAuth token exists in Firestore
      const response = await fetch(`https://us-central1-stop-test-8025f.cloudfunctions.net/checkOAuthStatus?tokenDocId=${tokenDocId}`)
      const result = await response.json()
      
      return result.exists && result.valid
    } catch (error) {
      console.error("Error checking OAuth token:", error)
      return false
    }
  }, [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID])

  // Floor plans operations
  const fetchFloorPlans = useCallback(async () => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const floorPlans = await BookingsFunctions.getFloorPlans(basePath)
      dispatch({ type: BookingsActionType.SET_FLOOR_PLANS, payload: floorPlans })
    } catch (error) {
      console.error("Error fetching floor plans:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to fetch floor plans" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  // Floor plan CRUD operations
  const addFloorPlan = useCallback(async (floorPlan: Partial<FloorPlan>) => {
    if (!basePath) throw new Error("Base path not available")
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const completeFloorPlan = {
        id: "",
        name: floorPlan.name || "New Floor Plan",
        tables: floorPlan.tables || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...floorPlan
      } as FloorPlan
      
      const newFloorPlan = await BookingsFunctions.saveFloorPlan(basePath, completeFloorPlan)
      dispatch({ type: BookingsActionType.ADD_FLOOR_PLAN, payload: newFloorPlan })
      return newFloorPlan
    } catch (error) {
      console.error("Error adding floor plan:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to add floor plan" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const updateFloorPlan = useCallback(async (floorPlanId: string, updates: Partial<FloorPlan>) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const floorPlans = await BookingsFunctions.getFloorPlans(basePath)
      const floorPlan = floorPlans.find(fp => fp.id === floorPlanId)
      
      if (!floorPlan) {
        throw new Error(`Floor plan with ID ${floorPlanId} not found`)
      }
      
      const updatedFloorPlan = { 
        ...floorPlan, 
        ...updates,
        updatedAt: new Date().toISOString() 
      }
      
      await BookingsFunctions.saveFloorPlan(basePath, updatedFloorPlan)
      dispatch({ type: BookingsActionType.UPDATE_FLOOR_PLAN, payload: { id: floorPlanId, updates } })
    } catch (error) {
      console.error("Error updating floor plan:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to update floor plan" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const deleteFloorPlan = useCallback(async (floorPlanId: string) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      await BookingsFunctions.removeFloorPlan(basePath, floorPlanId)
      dispatch({ type: BookingsActionType.DELETE_FLOOR_PLAN, payload: floorPlanId })
    } catch (error) {
      console.error("Error deleting floor plan:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to delete floor plan" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  // Table element operations for floor plans
  const addTableToFloorPlan = useCallback(async (floorPlanId: string, tableElement: Omit<TableElement, "id">) => {
    if (!basePath) throw new Error("Base path not available")
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const newTableElement = await BookingsFunctions.addTableToLayout(basePath, floorPlanId, tableElement)
      const floorPlans = await BookingsFunctions.getFloorPlans(basePath)
      dispatch({ type: BookingsActionType.SET_FLOOR_PLANS, payload: floorPlans })
      return newTableElement
    } catch (error) {
      console.error("Error adding table to floor plan:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to add table to floor plan" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const updateTableInFloorPlan = useCallback(async (floorPlanId: string, tableElementId: string, updates: Partial<TableElement>) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      await BookingsFunctions.updateTableInFloorPlan(basePath, floorPlanId, tableElementId, updates)
      const floorPlans = await BookingsFunctions.getFloorPlans(basePath)
      dispatch({ type: BookingsActionType.SET_FLOOR_PLANS, payload: floorPlans })
    } catch (error) {
      console.error("Error updating table in floor plan:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to update table in floor plan" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const removeTableFromFloorPlan = useCallback(async (floorPlanId: string, tableElementId: string) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      await BookingsFunctions.removeTableFromLayout(basePath, floorPlanId, tableElementId)
      const floorPlans = await BookingsFunctions.getFloorPlans(basePath)
      dispatch({ type: BookingsActionType.SET_FLOOR_PLANS, payload: floorPlans })
    } catch (error) {
      console.error("Error removing table from floor plan:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to remove table from floor plan" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  // Booking stats and tags operations
  const fetchBookingStats = useCallback(async () => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const stats = await BookingsFunctions.getBookingStats(basePath)
      dispatch({ type: BookingsActionType.SET_BOOKING_STATS, payload: stats })
    } catch (error) {
      console.error("Error fetching booking stats:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to fetch booking stats" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const fetchBookingTags = useCallback(async () => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const tags = await BookingsFunctions.getBookingTags(basePath)
      dispatch({ type: BookingsActionType.SET_BOOKING_TAGS, payload: tags })
    } catch (error) {
      console.error("Error fetching booking tags:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to fetch booking tags" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const addBookingTag = useCallback(async (tag: Omit<BookingTag, "id">) => {
    if (!basePath) throw new Error("Base path not available")
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      const newTag = await BookingsFunctions.addBookingTag(basePath, tag)
      dispatch({ type: BookingsActionType.ADD_BOOKING_TAG, payload: newTag })
      return newTag
    } catch (error) {
      console.error("Error adding booking tag:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to add booking tag" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const updateBookingTag = useCallback(async (tagId: string, updates: Partial<BookingTag>) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      await BookingsFunctions.updateBookingTag(basePath, tagId, updates)
      dispatch({ type: BookingsActionType.UPDATE_BOOKING_TAG, payload: { id: tagId, updates } })
    } catch (error) {
      console.error("Error updating booking tag:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to update booking tag" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  const deleteBookingTag = useCallback(async (tagId: string) => {
    if (!basePath) return
    dispatch({ type: BookingsActionType.SET_LOADING, payload: true })
    try {
      await BookingsFunctions.deleteBookingTag(basePath, tagId)
      dispatch({ type: BookingsActionType.DELETE_BOOKING_TAG, payload: tagId })
    } catch (error) {
      console.error("Error deleting booking tag:", error)
      dispatch({ type: BookingsActionType.SET_ERROR, payload: "Failed to delete booking tag" })
      throw error
    } finally {
      dispatch({ type: BookingsActionType.SET_LOADING, payload: false })
    }
  }, [basePath])

  // Preorder profile operations
  const fetchPreorderProfiles = useCallback(async () => {
    const paths = getBookingsPaths()
    if (paths.length === 0) return []
    
    try {
      for (const path of paths) {
        try {
          console.log("Bookings Context - trying to load preorder profiles from path:", path)
          const profiles = await BookingsFunctions.getPreorderProfiles(path)
          if (profiles && profiles.length > 0) {
            console.log("Bookings Context - loaded preorder profiles from path:", path)
            return profiles
          }
        } catch (error) {
          console.log("Bookings Context - failed to load preorder profiles from path:", path, error)
          continue
        }
      }
      console.log("Bookings Context - no preorder profiles data found in any path")
      return []
    } catch (error) {
      console.error("Error fetching preorder profiles:", error)
      throw error
    }
  }, [getBookingsPaths])

  const savePreorderProfile = useCallback(async (profile: any) => {
    const paths = getBookingsPaths()
    if (paths.length === 0) throw new Error("Base path not available")
    
    try {
      console.log("Bookings Context - saving preorder profile to path:", paths[0])
      return await BookingsFunctions.savePreorderProfile(paths[0], profile)
    } catch (error) {
      console.error("Error saving preorder profile:", error)
      throw error
    }
  }, [getBookingsPaths])

  const deletePreorderProfile = useCallback(async (profileId: string) => {
    const paths = getBookingsPaths()
    if (paths.length === 0) return
    
    try {
      console.log("Bookings Context - deleting preorder profile from path:", paths[0])
      await BookingsFunctions.deletePreorderProfile(paths[0], profileId)
    } catch (error) {
      console.error("Error deleting preorder profile:", error)
      throw error
    }
  }, [getBookingsPaths])

  // Stock integration operations
  const fetchStockCourses = useCallback(async () => {
    if (!companyState.companyID || !companyState.selectedSiteID) return []
    try {
      return await BookingsFunctions.getStockCourses(companyState.companyID, companyState.selectedSiteID)
    } catch (error) {
      console.error("Error fetching stock courses:", error)
      throw error
    }
  }, [companyState.companyID, companyState.selectedSiteID])

  const fetchStockProducts = useCallback(async () => {
    if (!companyState.companyID || !companyState.selectedSiteID) return []
    try {
      return await BookingsFunctions.getStockProducts(companyState.companyID, companyState.selectedSiteID)
    } catch (error) {
      console.error("Error fetching stock products:", error)
      throw error
    }
  }, [companyState.companyID, companyState.selectedSiteID])

  // Additional CRUD functions
  const createWaitlistEntry = useCallback(async (entryData: any) => {
    const paths = getBookingsPaths()
    if (paths.length === 0) throw new Error("Base path not available")
    
    try {
      const entry = await BookingsFunctions.addWaitlistEntry(paths[0], entryData)
      await fetchBookings()
      return entry
    } catch (error) {
      console.error("Error creating waitlist entry:", error)
      throw error
    }
  }, [getBookingsPaths, fetchBookings])

  const createTag = useCallback(async (tagData: any) => {
    const paths = getBookingsPaths()
    if (paths.length === 0) throw new Error("Base path not available")
    
    try {
      const tag = await BookingsFunctions.addBookingTag(paths[0], tagData)
      await fetchBookings()
      return tag
    } catch (error) {
      console.error("Error creating tag:", error)
      throw error
    }
  }, [getBookingsPaths, fetchBookings])

  const updateTag = useCallback(async (tagId: string, tagData: any) => {
    const paths = getBookingsPaths()
    if (paths.length === 0) return
    
    try {
      await BookingsFunctions.updateBookingTag(paths[0], tagId, tagData)
      await fetchBookings()
    } catch (error) {
      console.error("Error updating tag:", error)
      throw error
    }
  }, [getBookingsPaths, fetchBookings])

  const deleteTag = useCallback(async (tagId: string) => {
    const paths = getBookingsPaths()
    if (paths.length === 0) return
    
    try {
      await BookingsFunctions.deleteBookingTag(paths[0], tagId)
      await fetchBookings()
    } catch (error) {
      console.error("Error deleting tag:", error)
      throw error
    }
  }, [getBookingsPaths, fetchBookings])

  const createPreorderProfile = useCallback(async (profileData: Omit<PreorderProfile, "id" | "createdAt" | "updatedAt">) => {
    const paths = getBookingsPaths()
    if (paths.length === 0) throw new Error("Base path not available")
    
    try {
      const profile = await BookingsFunctions.savePreorderProfile(paths[0], profileData)
      await fetchBookings()
      return profile
    } catch (error) {
      console.error("Error creating preorder profile:", error)
      throw error
    }
  }, [getBookingsPaths, fetchBookings])

  const updatePreorderProfile = useCallback(async (profileId: string, profileData: Partial<PreorderProfile>) => {
    const paths = getBookingsPaths()
    if (paths.length === 0) return
    
    try {
      await BookingsFunctions.savePreorderProfile(paths[0], { ...profileData, id: profileId })
      await fetchBookings()
    } catch (error) {
      console.error("Error updating preorder profile:", error)
      throw error
    }
  }, [getBookingsPaths, fetchBookings])

  // Memoize context value to prevent unnecessary re-renders
  const value: BookingsContextType = useMemo(() => ({
    ...state,
    basePath,
    fetchBookings,
    fetchBookingsByCustomer,
    fetchBookingsByTable,
    fetchBookingsByDate,
    addBooking,
    updateBooking,
    deleteBooking,
    fetchBookingTypes,
    addBookingType,
    updateBookingType,
    deleteBookingType,
    fetchTables,
    addTable,
    updateTable,
    deleteTable,
    fetchBookingStatuses,
    addBookingStatus,
    updateBookingStatus,
    deleteBookingStatus,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    fetchWaitlistEntries,
    addWaitlistEntry,
    updateWaitlistEntry,
    deleteWaitlistEntry,
    fetchBookingSettings,
    updateBookingSettings,
    checkOAuthToken,
    fetchFloorPlans,
    addFloorPlan,
    updateFloorPlan,
    deleteFloorPlan,
    addTableToFloorPlan,
    updateTableInFloorPlan,
    removeTableFromFloorPlan,
    fetchBookingStats,
    fetchBookingTags,
    addBookingTag,
    updateBookingTag,
    deleteBookingTag,
    fetchPreorderProfiles,
    savePreorderProfile,
    deletePreorderProfile,
    fetchStockCourses,
    fetchStockProducts,
    createWaitlistEntry,
    createTag,
    updateTag,
    deleteTag,
    createPreorderProfile,
    updatePreorderProfile,
    // Utility functions
    calculateEndTime: (arrivalTime: string, duration: number) => {
      return BookingsFunctions.calculateEndTime(arrivalTime, duration)
    },
    generateTimeSlots: (intervalMinutes: number = 30) => {
      return BookingsFunctions.generateTimeSlots(intervalMinutes)
    },
    normalizeColor: (color: string | undefined) => {
      return BookingsFunctions.normalizeColor(color)
    },
    resetBookingsState,
    // Permission functions - Owner has full access
    canViewBookings: () => isOwner() || hasPermission("bookings", "reservations", "view"),
    canEditBookings: () => isOwner() || hasPermission("bookings", "reservations", "edit"),
    canDeleteBookings: () => isOwner() || hasPermission("bookings", "reservations", "delete"),
    isOwner: () => isOwner()
  }), [
    state,
    basePath,
    fetchBookings,
    fetchBookingsByDate,
    fetchBookingsByCustomer,
    addBooking,
    updateBooking,
    deleteBooking,
    fetchTables,
    addTable,
    updateTable,
    deleteTable,
    fetchBookingTypes,
    addBookingType,
    updateBookingType,
    deleteBookingType,
    fetchBookingStatuses,
    addBookingStatus,
    updateBookingStatus,
    fetchWaitlistEntries,
    addWaitlistEntry,
    updateWaitlistEntry,
    deleteWaitlistEntry,
    fetchBookingSettings,
    updateBookingSettings,
    checkOAuthToken,
    fetchFloorPlans,
    addFloorPlan,
    updateFloorPlan,
    deleteFloorPlan,
    addTableToFloorPlan,
    updateTableInFloorPlan,
    removeTableFromFloorPlan,
    fetchBookingStats,
    fetchBookingTags,
    addBookingTag,
    updateBookingTag,
    deleteBookingTag,
    fetchPreorderProfiles,
    savePreorderProfile,
    deletePreorderProfile,
    fetchStockCourses,
    fetchStockProducts,
    createWaitlistEntry,
    createTag,
    updateTag,
    deleteTag,
    createPreorderProfile,
    updatePreorderProfile,
    deleteBookingStatus,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    resetBookingsState,
    isOwner,
    hasPermission,
  ])

  // Reset warning flag when provider mounts (so real issues can be detected)
  React.useEffect(() => {
    bookingsWarningShown = false
  }, [])

  return (
    <BookingsContext.Provider value={value}>
      {children}
    </BookingsContext.Provider>
  )
}
