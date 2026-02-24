"use client"

import React, { createContext, useContext, useReducer, useCallback, useEffect } from "react"
import { auth, db, ref, get, set } from "../services/Firebase"
import { useSettings } from "./SettingsContext"
// import { createRole, createEmployee } from "../functions/HRs"
import { 
  createCompany as createCompanyFn,
  updateCompany as updateCompanyFn,
  addUserToCompany,
  getUserCompanies,
  getSites,
  getCompanyUsers as getCompanyUsersFromDb,
  fetchCompanySetup as fetchCompanySetupFn,
  saveCompanySetup as saveCompanySetupFn,
  fetchChecklists as fetchChecklistsFn,
  createChecklist as createChecklistFn,
  updateChecklist as updateChecklistFn,
  deleteChecklist as deleteChecklistFn,
  updateRolePermissions as updateRolePermissionsFn,
  updateDepartmentPermissions as updateDepartmentPermissionsFn,
  updateUserPermissions as updateUserPermissionsFn,
  getConfig as getConfigFn,
  updateCompanyConfig as updateCompanyConfigFn,
  // updateSiteConfig as updateSiteConfigFn,
  // updateSubsiteConfig as updateSubsiteConfigFn,
  createSiteInvite as createSiteInviteFn,
  getSiteInvites as getSiteInvitesFn,
  getSiteInviteByCode as getSiteInviteByCodeFn,
  acceptSiteInvite as acceptSiteInviteFn,
  fetchUserProfile as fetchUserProfileFn,
  getSubsite,
} from "../functions/Company"
import { 
  createSiteInDb,
  createSubsiteInDb,
  updateSubsiteInDb,
  deleteSubsiteFromDb,
  deleteSiteFromDb,
  updateSiteInDb,
  fetchChecklistCompletionsFromDb,
  createChecklistCompletionInDb,
} from "../rtdatabase/Company"
import {
  CompanyPermissions,
  DEFAULT_PERMISSIONS,
  SiteDataConfig,
  Team,
  Site,
  Subsite,
  COMPANY_PERMISSION_KEY_ALIASES,
  CompanyChecklist,
  ChecklistCompletion,
  SiteInvite,
  SiteInviteData,
  CompanySetup,
} from "../interfaces/Company"
import { SessionPersistence } from "../../frontend/utils/sessionPersistence"
import { performanceTimer } from "../utils/PerformanceTimer"
import { verifyCurrentUserTenantAccess } from "../utils/tenantVerification"
import { auditTrailService } from "../services/gdpr/AuditTrailService"

// Note: Will import consolidated functions once they are properly exported
// For now, using direct Firebase operations until backend consolidation is complete

interface Company {
  companyID: string
  companyName: string
  companyLogo: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  companyWebsite: string
  companyDescription: string
  companyIndustry: string
  companySize: string
  companyType: string
  companyStatus: string
  companyCreated: string
  companyUpdated: string
  permissions: CompanyPermissions
  joinCode?: string
  joinCodeExpiry?: number
  dataManagement?: DataManagementConfig
}

interface DataManagementConfig {
  stock: "company" | "site" | "subsite"
  hr: "company" | "site" | "subsite"
  finance: "company" | "site" | "subsite"
  bookings: "company" | "site" | "subsite"
  pos: "company" | "site" | "subsite"
  messenger: "company" | "site" | "subsite"
  /** Optional shape when payload uses accessibleModules (e.g. from API) */
  accessibleModules?: {
    stock?: "company" | "site" | "subsite"
    hr?: "company" | "site" | "subsite"
    finance?: "company" | "site" | "subsite"
    bookings?: "company" | "site" | "subsite"
    pos?: "company" | "site" | "subsite"
    messenger?: "company" | "site" | "subsite"
  }
}


// Use Site and Subsite from Company.tsx interfaces
// Site interface already includes companyID in the imported definition

interface User {
  uid: string
  email: string
  role: string
  department: string
  displayName?: string
}

interface CompanyState {
  companyName: string
  companyID: string
  company: Company | null
  user: User | null
  permissions: CompanyPermissions
  loading: boolean
  error: string | null
  // Site management
  selectedSiteID: string | null
  selectedSiteName: string | null
  selectedSubsiteID: string | null
  selectedSubsiteName: string | null
  selectedTeamID: string | null
  selectedTeamName: string | null
  sites: Site[]
  subsites: Subsite[]
  teams: Team[]
  dataManagement: DataManagementConfig
}

/** Context state view: adds derived selectedCompany/selectedSite/selectedCompanyID for component compatibility */
export type CompanyStateView = CompanyState & {
  selectedCompany: (Company & { id: string }) | null
  selectedSite: { id: string; siteID: string; name: string } | null
  selectedCompanyID: string
}

export type CompanyAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_COMPANY_ID"; payload: string }
  | { type: "SET_COMPANY"; payload: Company | Partial<Company> }
  | { type: "SET_USER"; payload: User | Partial<User> | null }
  | { type: "SET_PERMISSIONS"; payload: CompanyPermissions }
  | { type: "SET_DATA_MANAGEMENT"; payload: DataManagementConfig }
  | { type: "SELECT_SITE"; payload: { siteID: string; siteName: string } }
  | { type: "SELECT_SUBSITE"; payload: { subsiteID: string; subsiteName: string; dataManagement?: DataManagementConfig } }
  | { type: "SELECT_TEAM"; payload: { teamID: string; teamName: string } }
  | { type: "SET_SITES"; payload: Site[] }
  | { type: "SET_SUBSITES"; payload: Subsite[] }
  | { type: "SET_TEAMS"; payload: Team[] }
  | { type: "CLEAR_SITE_SELECTION" }
  | { type: "CLEAR_COMPANY" }
  | { type: "UPDATE_COMPANY_LOGO"; payload: string }

const DEFAULT_DATA_MANAGEMENT: DataManagementConfig = {
  stock: "site",
  hr: "site",
  finance: "company",
  bookings: "site",
  pos: "site",
  messenger: "company",
}

// Initialize state with values from session persistence (optimized for fast startup)
const getInitialState = (): CompanyState => {
  if (typeof window !== "undefined") {
    try {
      // Use new session persistence for better performance
      const sessionState = SessionPersistence.getSessionState()
      
      // Fallback to localStorage for backward compatibility
      const savedCompanyID = sessionState.companyID || localStorage.getItem("selectedCompanyID") || localStorage.getItem("companyID")
      const savedCompanyName = sessionState.companyName || localStorage.getItem("selectedCompanyName")
      const savedSiteID = sessionState.selectedSiteID || localStorage.getItem("selectedSiteID")
      const savedSiteName = sessionState.selectedSiteName || localStorage.getItem("selectedSiteName")
      const savedSubsiteID = sessionState.selectedSubsiteID || localStorage.getItem("selectedSubsiteID")
      const savedSubsiteName = sessionState.selectedSubsiteName || localStorage.getItem("selectedSubsiteName")

      return {
        companyID: savedCompanyID || "",
        companyName: savedCompanyName || "",
        company: null,
        user: null,
        permissions: DEFAULT_PERMISSIONS,
        loading: false, // Start with loading false for faster initial render
        error: null,
        selectedSiteID: savedSiteID || null,
        selectedSiteName: savedSiteName || null,
        selectedSubsiteID: savedSubsiteID || null,
        selectedSubsiteName: savedSubsiteName || null,
        selectedTeamID: null,
        selectedTeamName: null,
        sites: [],
        subsites: [],
        teams: [],
        dataManagement: DEFAULT_DATA_MANAGEMENT,
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
    }
  }

  return {
    companyID: "",
    companyName: "",
    company: null,
    user: null,
    permissions: DEFAULT_PERMISSIONS,
    loading: false, // Start optimistic for better performance
    error: null,
    selectedSiteID: null,
    selectedSiteName: null,
    selectedSubsiteID: null,
    selectedSubsiteName: null,
    selectedTeamID: null,
    selectedTeamName: null,
    sites: [],
    subsites: [],
    teams: [],
    dataManagement: DEFAULT_DATA_MANAGEMENT,
  }
}

const initialState = getInitialState()

const companyReducer = (state: CompanyState, action: CompanyAction): CompanyState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false }
    case "SET_COMPANY_ID": {
      const payload = action.payload
      if (typeof payload !== "string") {
        console.warn("Invalid companyID format in reducer, attempting to fix:", payload)
        if (payload && typeof payload === "object") {
          const keys = Object.keys(payload)
          if (keys.length >= 1 && keys[0].includes("-")) {

            return { ...state, companyID: keys[0], error: null }
          }
        }
        // If we can't fix it, just clear the company ID instead of erroring
        console.warn("Could not fix companyID format, clearing company ID")
        return { ...state, companyID: "", error: null }
      }
      return { ...state, companyID: payload, error: null }
    }
    case "SET_COMPANY":
      // Map accessibleModules to dataManagement format if needed
      let dataManagement = DEFAULT_DATA_MANAGEMENT
      
      if (action.payload.dataManagement) {
        if (action.payload.dataManagement.accessibleModules) {
          // New format: dataManagement.accessibleModules
          dataManagement = {
            stock: action.payload.dataManagement.accessibleModules.stock || DEFAULT_DATA_MANAGEMENT.stock,
            hr: action.payload.dataManagement.accessibleModules.hr || DEFAULT_DATA_MANAGEMENT.hr,
            finance: action.payload.dataManagement.accessibleModules.finance || DEFAULT_DATA_MANAGEMENT.finance,
            bookings: action.payload.dataManagement.accessibleModules.bookings || DEFAULT_DATA_MANAGEMENT.bookings,
            pos: action.payload.dataManagement.accessibleModules.pos || DEFAULT_DATA_MANAGEMENT.pos,
            messenger: action.payload.dataManagement.accessibleModules.messenger || DEFAULT_DATA_MANAGEMENT.messenger,
          }
        } else {
          // Direct format: dataManagement.hr, etc.
          dataManagement = { ...DEFAULT_DATA_MANAGEMENT, ...action.payload.dataManagement }
        }
      }
      
      return {
        ...state,
        company: action.payload as Company | null,
        dataManagement,
        loading: false,
        error: null,
      }
    case "SET_USER":
      return { ...state, user: action.payload as User | null }
    case "SET_PERMISSIONS":
      return { ...state, permissions: action.payload }
    case "SET_DATA_MANAGEMENT":
      return { ...state, dataManagement: action.payload }
    case "SELECT_SITE": {
      // When a site is selected, automatically extract subsites from that site
      // This works the same way sites are loaded when a company is selected
      const selectedSite = state.sites.find(site => site.siteID === action.payload.siteID)
      let extractedSubsites: Subsite[] = []
      
      if (selectedSite?.subsites && typeof selectedSite.subsites === 'object') {
        // Extract subsites from the selected site
        // Subsites are stored as Record<string, Subsite> where key is subsiteID
        try {
          extractedSubsites = Object.entries(selectedSite.subsites)
            .filter(([subsiteId, subsite]: [string, any]) => {
              if (!subsite || typeof subsite !== 'object') return false
              // Must have at least a name to be valid
              return subsite.name || subsiteId
            })
            .map(([subsiteId, subsite]: [string, any]) => {
              // Use subsiteID from object, or fall back to the key
              const id = subsite.subsiteID || subsite.id || subsiteId
              return {
                subsiteID: id,
                name: subsite.name || '',
                description: subsite.description || '',
                location: subsite.location || '',
                address: subsite.address || {
                  street: '',
                  city: '',
                  state: '',
                  zipCode: '',
                  country: ''
                },
                teams: subsite.teams || {},
                createdAt: subsite.createdAt || Date.now(),
                updatedAt: subsite.updatedAt || Date.now(),
                dataManagement: subsite.dataManagement,
              } as Subsite
            })
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 SELECT_SITE: Extracted ${extractedSubsites.length} subsites from site ${action.payload.siteID}`, {
              siteHasSubsites: !!selectedSite.subsites,
              subsitesType: typeof selectedSite.subsites,
              subsitesKeys: selectedSite.subsites ? Object.keys(selectedSite.subsites) : [],
              extractedSubsites: extractedSubsites.map(s => ({ id: s.subsiteID, name: s.name }))
            })
          }
        } catch (error) {
          console.error('Error extracting subsites in SELECT_SITE:', error)
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 SELECT_SITE: No subsites found for site ${action.payload.siteID}`, {
            selectedSite: selectedSite ? { siteID: selectedSite.siteID, name: selectedSite.name } : null,
            hasSubsites: !!selectedSite?.subsites,
            subsitesType: typeof selectedSite?.subsites,
          })
        }
      }
      
      return {
        ...state,
        selectedSiteID: action.payload.siteID,
        selectedSiteName: action.payload.siteName,
        selectedSubsiteID: null, // Clear subsite selection when site changes
        selectedSubsiteName: null,
        selectedTeamID: null,
        selectedTeamName: null,
        subsites: extractedSubsites, // Set subsites from selected site
      }
    }
    case "SELECT_SUBSITE":
      return {
        ...state,
        selectedSubsiteID: action.payload.subsiteID,
        selectedSubsiteName: action.payload.subsiteName,
        selectedTeamID: null,
        selectedTeamName: null,
        // Update dataManagement if provided (e.g., from subsite-specific config)
        dataManagement: action.payload.dataManagement || state.dataManagement,
      }
    case "SELECT_TEAM":
      return {
        ...state,
        selectedTeamID: action.payload.teamID,
        selectedTeamName: action.payload.teamName,
      }
    case "SET_SITES": {
      // When sites are loaded, automatically extract subsites from the selected site (if any)
      // This ensures subsites are available immediately when sites load
      const newSites = action.payload
      let extractedSubsites: Subsite[] = []
      
      if (state.selectedSiteID) {
        const selectedSite = newSites.find((site: Site) => site.siteID === state.selectedSiteID)
        if (selectedSite?.subsites && typeof selectedSite.subsites === 'object') {
          // Extract subsites from the selected site
          // Subsites are stored as Record<string, Subsite> where key is subsiteID
          try {
            extractedSubsites = Object.entries(selectedSite.subsites)
              .filter(([subsiteId, subsite]: [string, any]) => {
                if (!subsite || typeof subsite !== 'object') return false
                // Must have at least a name to be valid
                return subsite.name || subsiteId
              })
              .map(([subsiteId, subsite]: [string, any]) => {
                // Use subsiteID from object, or fall back to the key
                const id = subsite.subsiteID || subsite.id || subsiteId
                return {
                  subsiteID: id,
                  name: subsite.name || '',
                  description: subsite.description || '',
                  location: subsite.location || '',
                  address: subsite.address || {
                    street: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: ''
                  },
                  teams: subsite.teams || {},
                  createdAt: subsite.createdAt || Date.now(),
                  updatedAt: subsite.updatedAt || Date.now(),
                  dataManagement: subsite.dataManagement,
                } as Subsite
              })
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`🔍 SET_SITES: Extracted ${extractedSubsites.length} subsites from selected site ${state.selectedSiteID}`, {
                selectedSiteID: state.selectedSiteID,
                siteHasSubsites: !!selectedSite.subsites,
                subsitesKeys: selectedSite.subsites ? Object.keys(selectedSite.subsites) : [],
                extractedSubsites: extractedSubsites.map(s => ({ id: s.subsiteID, name: s.name }))
              })
            }
          } catch (error) {
            console.error('Error extracting subsites in SET_SITES:', error)
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 SET_SITES: No subsites found for selected site ${state.selectedSiteID}`, {
              selectedSite: selectedSite ? { siteID: selectedSite.siteID, name: selectedSite.name } : null,
              hasSubsites: !!selectedSite?.subsites,
              subsitesType: typeof selectedSite?.subsites,
            })
          }
        }
      }
      
      return { 
        ...state, 
        sites: newSites,
        subsites: extractedSubsites, // Update subsites when sites are loaded
      }
    }
    case "SET_SUBSITES":
      return { ...state, subsites: action.payload }
    case "SET_TEAMS":
      return { ...state, teams: action.payload }
    case "CLEAR_SITE_SELECTION":
      return {
        ...state,
        selectedSiteID: null,
        selectedSiteName: null,
        selectedSubsiteID: null,
        selectedSubsiteName: null,
        selectedTeamID: null,
        selectedTeamName: null,
      }
    case "CLEAR_COMPANY":
      return { ...initialState, loading: false }
    case "UPDATE_COMPANY_LOGO":
      return {
        ...state,
        company: state.company ? { ...state.company, companyLogo: action.payload } : null
      }
    default:
      return state
  }
}

interface CompanyContextType {
  state: CompanyStateView
  dispatch: React.Dispatch<CompanyAction>
  setCompanyID: (companyID: string | object) => void
  selectSite: (siteID: string, siteName: string) => void
  selectSubsite: (subsiteID: string, subsiteName: string) => Promise<void>
  selectTeam: (teamID: string, teamName: string) => void
  clearSiteSelection: () => void
  createSite: (site: Omit<Site, "siteID" | "companyID">) => Promise<string>
  createSubsite: (subsite: Omit<Subsite, "subsiteID">) => Promise<string>
  createTeam: (team: Omit<Team, "teamID">, subsiteId?: string | null) => Promise<string>
  updateSite: (siteID: string, site: Partial<Site>) => Promise<void>
  updateSubsite: (siteID: string, subsiteID: string, subsite: Partial<Subsite>) => Promise<void>
  deleteSite: (siteID: string) => Promise<void>
  deleteSubsite: (siteID: string, subsiteID: string) => Promise<void>
  refreshSites: (force?: boolean) => Promise<void>
  fetchSites: () => Promise<void>
  initializeCompanyData: (companyID: string) => Promise<void>
  ensureSitesLoaded: () => Promise<void>
  
  // Site access control functions
  getUserAccessibleSites: () => Promise<Site[]>
  autoSelectSiteIfOnlyOne: () => Promise<void>
  getSiteHierarchy: () => Promise<{site: Site, subsites: Subsite[]}[]>
  
  // Permission functions
  isOwner: () => boolean
  hasPermission: (
    module: string,
    page: string,
    action: "view" | "edit" | "delete",
    role?: string,
    department?: string,
  ) => boolean
  getUserPermissions: () => CompanyPermissions["roles"][string] | null
  checkUserPermission: (permissionIndex: number) => boolean
  updateUserPermissions: (userId: string, permissions: boolean[]) => Promise<void>
  updateRolePermissions: (roleId: string, permissions: boolean[]) => Promise<void>
  updateDepartmentPermissions: (departmentId: string, permissions: boolean[]) => Promise<void>
  
  // Configuration functions
  getConfig: (configType: string) => Promise<string[]>
  updateConfig: (configType: string, config: string[]) => Promise<void>
  
  // Checklist functions
  getChecklists: () => Promise<CompanyChecklist[]>
  createChecklistItem: (checklist: Partial<CompanyChecklist>) => Promise<CompanyChecklist>
  updateChecklistItem: (checklistId: string, updates: Partial<CompanyChecklist>) => Promise<void>
  deleteChecklistItem: (checklistId: string) => Promise<void>
  fetchChecklists: () => Promise<CompanyChecklist[]>
  fetchChecklistCompletionsByUser: (userId: string) => Promise<ChecklistCompletion[]>
  fetchUserProfile: (userId: string) => Promise<User | null>
  filterChecklistsByStatus: (checklists: CompanyChecklist[], status: string) => CompanyChecklist[]
  
  // Checklist completion functions
  createChecklistCompletion: (completion: Partial<ChecklistCompletion>) => Promise<string>
  getChecklistCompletions: (filters?: Partial<ChecklistCompletion>) => Promise<ChecklistCompletion[]>
  updateChecklistCompletion: (completionId: string, updates: Partial<ChecklistCompletion>) => Promise<void>
  
  // Site invite functions
  createSiteInvite: (siteId: string, inviteData: SiteInviteData) => Promise<string>
  getSiteInvites: (siteId?: string) => Promise<SiteInvite[]>
  getSiteInviteByCode: (inviteCode: string) => Promise<SiteInvite | null>
  acceptSiteInvite: (inviteId: string, userId: string) => Promise<{ success: boolean; message: string }>
  
  // Role and department management functions
  addRole: (roleData: { name: string; label?: string; departmentId?: string; permissions?: CompanyPermissions }) => Promise<{ id: string; name: string; label?: string }>
  addDepartment: (departmentData: { name: string; description?: string; managerId?: string }) => Promise<{ id: string; name: string }>
  deleteRole: (roleId: string) => Promise<void>
  deleteDepartment: (departmentId: string) => Promise<void>
  
  // Company setup functions
  fetchCompanySetup: () => Promise<CompanySetup | null>
  saveCompanySetup: (setupData: Partial<CompanySetup>) => Promise<void>
  updateCompanyLogo: (logoUrl: string) => Promise<void>
  
  // Dashboard functions
  getChecklistScores: () => Promise<Record<string, number>>
  getAvailableTabsForUser: () => string[]
  
  // Base path functions (consolidated from SiteContext)
  getBasePath: (module?: keyof DataManagementConfig) => string
  
  // Company data configuration
  fetchDataConfiguration: () => Promise<Record<string, boolean>>
  saveDataConfiguration: (config: Record<string, boolean>, cascadeToMainSite?: boolean) => Promise<void>
  
  // Legacy functions (maintained for backward compatibility)
  generateJoinCode: (roleId?: string) => Promise<string>
  joinCompanyByCode: (code: string) => Promise<boolean>
  updateDataManagementConfig: (config: DataManagementConfig) => Promise<void>
  updateSiteDataManagement: (siteID: string, config: SiteDataConfig) => Promise<void>
  updateSubsiteDataManagement: (siteID: string, subsiteID: string, config: SiteDataConfig) => Promise<void>

  // User management functions
  getCompanyUsers: (companyId: string) => Promise<User[]>

  // Exposed helpers for frontend components
  fetchUserCompanies: (userId: string) => Promise<{ companyID: string; companyName: string; userPermission: string }[]>
  createCompany: (setupData: Partial<CompanySetup>) => Promise<string>
}

export const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

const applyCompanyAliasMappings = (modules?: Record<string, any>) => {
  if (!modules?.company) return
  const companyModule = modules.company as Record<string, any>

  Object.entries(COMPANY_PERMISSION_KEY_ALIASES).forEach(([aliasKey, legacyKey]) => {
    if (!companyModule[aliasKey] && companyModule[legacyKey]) {
      companyModule[aliasKey] = { ...companyModule[legacyKey] }
    }
  })
}

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Log initialization only once (reduced logging for performance)
  if (process.env.NODE_ENV === 'development') {
    console.log('⚡ CompanyContext: Initializing...');
  }
  
  const [state, dispatch] = useReducer(companyReducer, initialState)

  // Derived state for components that use selectedCompany/selectedSite/selectedCompanyID
  const stateView: CompanyStateView = React.useMemo(() => {
    const selectedCompany = state.company
      ? { ...state.company, id: state.company.companyID }
      : null
    const selectedSite =
      state.selectedSiteID != null
        ? {
            id: state.selectedSiteID,
            siteID: state.selectedSiteID,
            name: state.selectedSiteName ?? "",
          }
        : null
    return {
      ...state,
      selectedCompany,
      selectedSite,
      selectedCompanyID: state.companyID,
    }
  }, [state])

  // Get user data from SettingsContext
  const { state: settingsState } = useSettings()

  // Sync user data from SettingsContext (with loading prevention)
  const [hasInitializedUser, setHasInitializedUser] = React.useState(false)
  
  useEffect(() => {
    if (settingsState.user && settingsState.auth.isLoggedIn && !hasInitializedUser) {
      // Find the current company's role and department from user's companies
      const currentCompany = settingsState.user.companies.find(
        company => company.companyID === settingsState.user?.currentCompanyID || company.isDefault
      )
      
      // Convert SettingsContext user to CompanyContext user format
      const companyUser: User = {
        uid: settingsState.user.uid,
        email: settingsState.user.email,
        role: currentCompany?.role || 'user', // Get role from current company
        department: currentCompany?.department || '',
        displayName: settingsState.user.displayName || settingsState.auth.displayName || '',
      }
      
      dispatch({ type: "SET_USER", payload: companyUser })
      
      // Auto-select the current company if available - OPTIMIZED: Start immediately
      if (settingsState.user.currentCompanyID && settingsState.user.currentCompanyID !== state.companyID) {
        // Set company ID immediately - this triggers initializeCompanyData which loads from cache instantly
        dispatch({ type: "SET_COMPANY_ID", payload: settingsState.user.currentCompanyID })
        console.log(`⚡ Company Context: Auto-selected company from session - ${settingsState.user.currentCompanyID} (will load from cache instantly)`)
      }
      
      setHasInitializedUser(true)
    } else if (!settingsState.auth.isLoggedIn) {
      // Clear user if not logged in
      dispatch({ type: "SET_USER", payload: null })
      setHasInitializedUser(false)
    }
  }, [settingsState.user?.uid, settingsState.auth.isLoggedIn, hasInitializedUser, settingsState.user?.currentCompanyID, state.companyID])

  // Set company ID

  // Site management functions




  // Lazy loading state management
  const [isInitialized, setIsInitialized] = React.useState(false)
  const [loadingSites, setLoadingSites] = React.useState(false)

  // Track which company the sites belong to
  const sitesCompanyIDRef = React.useRef<string | null>(null)
  
  // Refresh sites data with caching and deduplication - OPTIMIZED FOR INSTANT LOADING
  const refreshSites = useCallback(async (force: boolean = false) => {
    if (!state.companyID) {
      console.warn("⚠️ Company Context: Cannot refresh sites - no companyID")
      return
    }
    
    // Prevent duplicate requests unless forcing
    if (loadingSites && !force) {
      console.log("⏳ Company Context: Sites already loading, skipping duplicate request")
      return
    }
    
    // Check if sites belong to current company
    const sitesBelongToCurrentCompany = sitesCompanyIDRef.current === state.companyID
    
    // Skip if sites already loaded for this company and not forcing
    if (!force && state.sites && state.sites.length > 0 && sitesBelongToCurrentCompany) {
      console.log(`✅ Company Context: Sites already loaded for company ${state.companyID} (${state.sites.length} sites), skipping fetch`)
      return
    }
    
    // If company changed, we need to reload sites
    if (sitesCompanyIDRef.current && sitesCompanyIDRef.current !== state.companyID) {
      console.log(`🔄 Company Context: Company changed from ${sitesCompanyIDRef.current} to ${state.companyID}, reloading sites...`)
    }
    
    try {
      setLoadingSites(true)
      const timer = performanceTimer?.start('CompanyContext', 'refreshSites') || { stop: () => {}, fail: () => {} }
      console.log(`🔄 Company Context: Loading sites for company ${state.companyID}...`)
      const sitesArray = await getSites(state.companyID)
      
      // Update the company ID that sites belong to
      sitesCompanyIDRef.current = state.companyID
      
      // Only update if data actually changed (prevents unnecessary re-renders)
      const currentSitesJson = JSON.stringify(state.sites)
      const newSitesJson = JSON.stringify(sitesArray)
      
      if (currentSitesJson !== newSitesJson) {
        dispatch({ type: "SET_SITES", payload: sitesArray })
        
        // Cache sites for instant loading next time
        SessionPersistence.cacheSites(state.companyID, sitesArray)
        
        if (typeof timer !== 'string' && timer.stop) {
          timer.stop()
        }
        console.log(`✅ Company Context: Updated ${sitesArray.length} sites for company ${state.companyID} and cached`)
      } else {
        if (typeof timer !== 'string' && timer.stop) {
          timer.stop()
        }
        console.log(`✅ Company Context: Sites data unchanged (${sitesArray.length} sites)`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const timer = performanceTimer?.start('CompanyContext', 'refreshSites') || { stop: () => {}, fail: () => {} }
      if (typeof timer !== 'string' && timer.fail) {
        timer.fail()
      }
      console.error("❌ Company Context: Error refreshing sites:", error)
      dispatch({ type: "SET_ERROR", payload: `Failed to load sites: ${errorMessage}` })
      // Clear the ref on error so it can retry
      sitesCompanyIDRef.current = null
    } finally {
      setLoadingSites(false)
    }
  }, [state.companyID, state.sites, dispatch, loadingSites])

  // Ensure sites are loaded (on-demand loading)
  const ensureSitesLoaded = useCallback(async () => {
    if (!state.companyID) return
    if (state.sites && state.sites.length > 0) return // Already loaded
    if (loadingSites) return // Already loading
    
    console.log("📍 Company Context: Loading sites on-demand for", state.companyID)
    await refreshSites(true)
  }, [state.companyID, state.sites, loadingSites, refreshSites])

  // Initialize company data - OPTIMIZED: Load from cache instantly, then refresh from Firebase
  const initializeCompanyData = useCallback(async (companyID: string) => {
    if (isInitialized || !companyID) return

    // Tenant verification (ISO 27001 / SOC 2): ensure user has access before loading company data
    const hasAccess = await verifyCurrentUserTenantAccess(companyID)
    if (!hasAccess) {
      SessionPersistence.saveSessionState({ companyID: "" })
      dispatch({ type: "SET_COMPANY_ID", payload: "" })
      dispatch({ type: "SET_COMPANY", payload: {} })
      dispatch({ type: "CLEAR_SITE_SELECTION" })
      dispatch({ type: "SET_SITES", payload: [] })
      dispatch({ type: "SET_ERROR", payload: "You no longer have access to this company." })
      return
    }
    
    try {
      setIsInitialized(true)
      const timer = performanceTimer?.start('CompanyContext', 'initializeCompanyData') || { stop: () => {}, fail: () => {} }
      
      // Reduced logging for performance
      if (process.env.NODE_ENV === 'development') {
        console.log("🏢 CompanyContext: Initializing company data (INSTANT CACHE + PARALLEL FIREBASE):", {
          companyID: companyID,
          selectedSiteID: state.selectedSiteID,
          currentSitesCount: state.sites?.length || 0,
        });
      }
      
      // STEP 1: Load from SessionPersistence cache INSTANTLY (fastest path)
      // This allows dropdowns to appear immediately while Firebase loads in background
      const cachedSites = SessionPersistence.getCachedSites(companyID)
      if (cachedSites && cachedSites.length > 0) {
        // Check if cached sites have subsites - if not, they're from old cache format
        const hasSubsites = cachedSites.some(site => site.subsites && Object.keys(site.subsites || {}).length > 0)
        
        if (hasSubsites) {
          // Set sites immediately from cache - dropdowns will work instantly
          dispatch({ type: "SET_SITES", payload: cachedSites })
          sitesCompanyIDRef.current = companyID
          if (process.env.NODE_ENV === 'development') {
            console.log(`⚡ CompanyContext: Loaded ${cachedSites.length} sites from SessionPersistence cache (INSTANT)`)
          }
        } else {
          // Old cache format without subsites - skip cache and load from Firebase immediately
          if (process.env.NODE_ENV === 'development') {
            console.log(`⚠️ CompanyContext: Cached sites missing subsites, loading from Firebase instead`)
          }
          // Don't set cached sites, let Firebase load happen immediately
        }
      }
      
      // STEP 2: Load sites from Firebase (immediate if cache was skipped, background if cache was used)
      // Determine if we need to load immediately (cache was skipped due to missing subsites)
      const shouldLoadImmediately = !cachedSites || cachedSites.length === 0 || 
        !cachedSites.some(site => site.subsites && Object.keys(site.subsites || {}).length > 0)
      
      if (!loadingSites) {
        setLoadingSites(true)
        
        const loadSitesFromFirebase = async () => {
          try {
            const sitesArray = await getSites(companyID)
            sitesCompanyIDRef.current = companyID
            
            // Update sites in state (refresh from Firebase)
            dispatch({ type: "SET_SITES", payload: sitesArray })
            
            // Cache sites for next time (with subsites)
            SessionPersistence.cacheSites(companyID, sitesArray)
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ CompanyContext: Loaded ${sitesArray.length} sites from Firebase${shouldLoadImmediately ? ' (IMMEDIATE - cache missing subsites)' : ' (BACKGROUND)'}`)
            }
            
            // Restore selections from Firebase data (refresh after cache)
            const storedSiteId = localStorage.getItem('selectedSiteID')
            const storedSiteName = localStorage.getItem('selectedSiteName')
            if (storedSiteId && sitesArray.some(s => s.siteID === storedSiteId)) {
              dispatch({ 
                type: 'SELECT_SITE', 
                payload: { siteID: storedSiteId, siteName: storedSiteName || '' } 
              })
              
              // Restore subsite
              const storedSubsiteId = localStorage.getItem('selectedSubsiteID')
              const storedSubsiteName = localStorage.getItem('selectedSubsiteName')
              if (storedSubsiteId && storedSubsiteName) {
                const site = sitesArray.find(s => s.siteID === storedSiteId)
                if (site?.subsites) {
                  const subsites = Object.values(site.subsites)
                  const subsiteObj = subsites.find((ss: Subsite | null | undefined) => {
                    if (!ss) return false
                    const subsiteWithId = ss as Subsite & { id?: string }
                    return ss.subsiteID === storedSubsiteId || subsiteWithId.id === storedSubsiteId
                  })
                  if (subsiteObj) {
                    const subsiteWithId = subsiteObj as Subsite & { id?: string }
                    const actualSubsiteId = subsiteObj.subsiteID || subsiteWithId.id || storedSubsiteId
                    const actualSubsiteName = subsiteObj.name || storedSubsiteName
                    dispatch({ 
                      type: 'SELECT_SUBSITE', 
                      payload: { subsiteID: actualSubsiteId, subsiteName: actualSubsiteName } 
                    })
                  }
                }
              }
            }
            
            if (timer && typeof timer !== 'string' && timer.stop) {
              timer.stop()
            } else if (typeof timer === 'string') {
              performanceTimer?.end(timer)
            }
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ CompanyContext: Sites refreshed from Firebase - ${sitesArray.length} sites`)
            }
            
            // Mark as ready if this was an immediate load (cache was skipped)
            if (shouldLoadImmediately) {
              if (process.env.NODE_ENV === 'development') {
                console.log(`✅ CompanyContext: READY - Company ${companyID} initialized (Firebase immediate - cache missing subsites)`)
              }
            }
          } catch (error) {
            console.error("Error loading sites from Firebase:", error)
            // Don't set error state - cache is already loaded (if used), Firebase is just a refresh
          } finally {
            setLoadingSites(false)
          }
        }
        
        // Load immediately if cache was skipped, otherwise load in background
        if (shouldLoadImmediately) {
          loadSitesFromFirebase()
        } else {
          Promise.resolve().then(loadSitesFromFirebase)
        }
      }
      
      // Mark as ready - immediately if cache was used, after Firebase load if cache was skipped
      if (!shouldLoadImmediately) {
        // Cache was used, mark ready immediately
        if (timer && typeof timer !== 'string' && timer.stop) {
          timer.stop()
        }
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ CompanyContext: READY - Company ${companyID} initialized (cache loaded instantly, Firebase refreshing in background)`)
        }
      }
      // If shouldLoadImmediately is true, ready state will be set after Firebase load completes
      
    } catch (error) {
      console.error("Error initializing company data:", error)
      dispatch({ type: "SET_ERROR", payload: `Failed to initialize company: ${error}` })
      setLoadingSites(false)
    }
  }, [isInitialized, state.selectedSiteID, state.sites, loadingSites])

  // Set company ID function with session persistence
  const setCompanyID = useCallback((companyID: string | { companyID?: string }) => {
    const id = typeof companyID === 'string' ? companyID : companyID.companyID || ''
    try {
      if (typeof window !== "undefined") {
        // Use session persistence for better management
        SessionPersistence.saveSessionState({ companyID: id })
      }
    } catch {}
    dispatch({ type: "SET_COMPANY_ID", payload: id })
  }, [dispatch])

  // Site selection functions with session persistence
  const selectSite = useCallback((siteID: string, siteName: string) => {
    try {
      if (typeof window !== "undefined") {
        SessionPersistence.saveSessionState({
          selectedSiteID: siteID,
          selectedSiteName: siteName,
        })
      }
    } catch {}
    dispatch({ type: "SELECT_SITE", payload: { siteID, siteName } })
  }, [dispatch])

  const selectSubsite = useCallback(async (subsiteID: string, subsiteName: string) => {
    try {
      if (typeof window !== "undefined") {
        SessionPersistence.saveSessionState({
          selectedSubsiteID: subsiteID,
          selectedSubsiteName: subsiteName,
        })
      }
      
      // Load subsite-specific dataManagement configuration
      let subsiteDataManagement: DataManagementConfig | undefined = undefined
      if (state.companyID && state.selectedSiteID) {
        try {
          const subsiteData = await getSubsite(state.companyID, state.selectedSiteID, subsiteID)
          if (subsiteData?.dataManagement) {
            // Map accessibleModules to dataManagement format if needed
            if (subsiteData.dataManagement.accessibleModules) {
              subsiteDataManagement = {
                stock: subsiteData.dataManagement.accessibleModules.stock || DEFAULT_DATA_MANAGEMENT.stock,
                hr: subsiteData.dataManagement.accessibleModules.hr || DEFAULT_DATA_MANAGEMENT.hr,
                finance: subsiteData.dataManagement.accessibleModules.finance || DEFAULT_DATA_MANAGEMENT.finance,
                bookings: subsiteData.dataManagement.accessibleModules.bookings || DEFAULT_DATA_MANAGEMENT.bookings,
                pos: subsiteData.dataManagement.accessibleModules.pos || DEFAULT_DATA_MANAGEMENT.pos,
                messenger: subsiteData.dataManagement.accessibleModules.messenger || DEFAULT_DATA_MANAGEMENT.messenger,
              }
            }
          }
        } catch (error) {
          console.error("Failed to load subsite dataManagement:", error)
        }
      }
      
      dispatch({ type: "SELECT_SUBSITE", payload: { subsiteID, subsiteName, dataManagement: subsiteDataManagement } })
    } catch (error) {
      console.error("Error in selectSubsite:", error)
      // Fallback to basic selection without dataManagement
      dispatch({ type: "SELECT_SUBSITE", payload: { subsiteID, subsiteName } })
    }
  }, [dispatch, state.companyID, state.selectedSiteID])

  const selectTeam = useCallback((teamID: string, teamName: string) => {
    dispatch({ type: "SELECT_TEAM", payload: { teamID, teamName } })
  }, [dispatch])

  const clearSiteSelection = useCallback(() => {
    dispatch({ type: "CLEAR_SITE_SELECTION" })
  }, [dispatch])


  // Site management helpers from functions module are imported above (createSite, etc.)

  const updateSite = useCallback(async (siteID: string, site: Partial<Site>): Promise<void> => {
    if (!state.companyID) {
      throw new Error("Company ID is required to update a site")
    }
    try {
      await updateSiteInDb(state.companyID, siteID, site)
      await refreshSites()
    } catch (error) {
      console.error("Error updating site:", error)
      throw error
    }
  }, [state.companyID, refreshSites])

  const updateSubsite = useCallback(async (siteID: string, subsiteID: string, subsite: Partial<Subsite>): Promise<void> => {
    if (!state.companyID) {
      throw new Error("Company ID is required to update a subsite")
    }
    try {
      await updateSubsiteInDb(state.companyID, siteID, subsiteID, subsite)
      await refreshSites()
    } catch (error) {
      console.error("Error updating subsite:", error)
      throw error
    }
  }, [state.companyID, refreshSites])

  const deleteSite = useCallback(async (siteID: string): Promise<void> => {
    if (!state.companyID) {
      throw new Error("Company ID is required to delete a site")
    }
    try {
      await deleteSiteFromDb(state.companyID, siteID)
      await refreshSites()
    } catch (error) {
      console.error("Error deleting site:", error)
      throw error
    }
  }, [state.companyID, refreshSites])

  const deleteSubsite = useCallback(async (siteID: string, subsiteID: string): Promise<void> => {
    if (!state.companyID) {
      throw new Error("Company ID is required to delete a subsite")
    }
    try {
      await deleteSubsiteFromDb(state.companyID, siteID, subsiteID)
      await refreshSites()
    } catch (error) {
      console.error("Error deleting subsite:", error)
      throw error
    }
  }, [state.companyID, refreshSites])

  const fetchSites = useCallback(async (): Promise<void> => {
    await refreshSites()
  }, [refreshSites])

  // Lazy load company data when companyID changes (only when needed)
  const [loadedCompanyID, setLoadedCompanyID] = React.useState<string | null>(null)
  
  useEffect(() => {
    if (state.companyID && state.companyID !== loadedCompanyID) {
      console.log(`🔄 Company Context: Company ID changed from ${loadedCompanyID} to ${state.companyID}`)
      
      // Reset initialization state when company changes
      setIsInitialized(false)
      setLoadedCompanyID(state.companyID)
      
      // Clear sites company ID ref so sites will reload for new company
      sitesCompanyIDRef.current = null
      
      // Initialize IMMEDIATELY - no delays, instant loading
      // Use microtask to ensure it runs in current event loop but doesn't block
      Promise.resolve().then(() => {
        initializeCompanyData(state.companyID).catch(error => {
          console.error("Failed to initialize company data:", error)
        })
      })
    } else if (state.companyID && state.companyID === loadedCompanyID && !isInitialized) {
      // If companyID matches but not initialized, initialize it
      console.log(`🔄 Company Context: Re-initializing company ${state.companyID}`)
      initializeCompanyData(state.companyID).catch(error => {
        console.error("Failed to initialize company data:", error)
      })
    }
  }, [state.companyID, isInitialized, initializeCompanyData, loadedCompanyID])

  // REMOVED: Auto-restore site/subsite selection useEffect hooks
  // Site and subsite restoration now happens in initializeCompanyData after sites load
  // This prevents multiple reloads and ensures everything loads in one batch

  // Helper function to check if user is owner
  const isOwner = useCallback((): boolean => {
    return state.user?.role?.toLowerCase() === 'owner'
  }, [state.user?.role])

  // Permission functions
  const getUserPermissions = useCallback((): CompanyPermissions["roles"][string] | null => {
    // Owner has full access - return a permissions object with all modules enabled
    if (isOwner()) {
      return {
        modules: {
          // All modules with full permissions
          bookings: { dashboard: { view: true, edit: true, delete: true }, bookings: { view: true, edit: true, delete: true }, tables: { view: true, edit: true, delete: true } },
          stock: { dashboard: { view: true, edit: true, delete: true }, products: { view: true, edit: true, delete: true }, suppliers: { view: true, edit: true, delete: true } },
          hr: { dashboard: { view: true, edit: true, delete: true }, employees: { view: true, edit: true, delete: true }, roles: { view: true, edit: true, delete: true } },
          finance: { dashboard: { view: true, edit: true, delete: true }, accounts: { view: true, edit: true, delete: true }, transactions: { view: true, edit: true, delete: true } },
          pos: { dashboard: { view: true, edit: true, delete: true }, sales: { view: true, edit: true, delete: true }, products: { view: true, edit: true, delete: true } },
          messenger: { dashboard: { view: true, edit: true, delete: true }, messages: { view: true, edit: true, delete: true }, contacts: { view: true, edit: true, delete: true } }
        }
      }
    }

    const perms = state.permissions
    if (!perms || !perms.roles) return null
    const roleKey = (state.user?.role || perms.defaultRole || 'staff').toLowerCase()
    const deptKey = (state.user?.department || perms.defaultDepartment || 'front-of-house').toLowerCase()
    const rolePerms = perms.roles[roleKey]
    const deptPerms = perms.departments?.[deptKey]
    // Merge role and department permissions (OR logic)
    if (!rolePerms && !deptPerms) return null
    const merged: CompanyPermissions["roles"][string] = { modules: {} }
    const mergeFrom = (src?: CompanyPermissions["roles"][string]) => {
      if (!src || !src.modules) return
      Object.keys(src.modules).forEach((moduleName) => {
        if (!merged.modules[moduleName]) {
          merged.modules[moduleName] = {}
        }
        Object.keys(src.modules[moduleName]).forEach((pageName) => {
          if (!merged.modules[moduleName][pageName]) {
            merged.modules[moduleName][pageName] = { view: false, edit: false, delete: false }
          }
          const pagePerms = src.modules[moduleName][pageName]
          const mergedPagePerms = merged.modules[moduleName][pageName]
          if (pagePerms && mergedPagePerms) {
            Object.keys(pagePerms).forEach((actionName) => {
              const actionKey = actionName as keyof typeof pagePerms
              if (actionKey in mergedPagePerms) {
                const mergedPage = mergedPagePerms as unknown as Record<string, boolean>
                mergedPage[actionName] = mergedPage[actionName] || Boolean(pagePerms[actionKey])
              }
            })
          }
        })
      })
    }
    mergeFrom(rolePerms)
    mergeFrom(deptPerms)
    applyCompanyAliasMappings(merged.modules as unknown as Record<string, Record<string, Record<string, boolean>>>)
    return merged
  }, [state.permissions, state.user, isOwner])

  const hasPermission = useCallback((module: string, page: string, action: "view" | "edit" | "delete", roleOverride?: string, deptOverride?: string): boolean => {
    // Allow while loading to avoid blocking UI
    if (state.loading) return true
    const perms = state.permissions
    if (!perms) return true

    // Owner role has full access to everything
    const userRole = roleOverride || state.user?.role?.toLowerCase()
    
    // Permission check logging removed for cleaner console
    
    // Check if user is owner (multiple ways to be safe)
    const isUserOwner = userRole === 'owner' || 
                       state.user?.role === 'owner' ||
                       state.user?.role === 'Owner' ||
                       state.user?.role?.toLowerCase() === 'owner'
    
    if (isUserOwner) {
      return true
    }

    // If overrides provided, check specific role/department first
    const check = (p: CompanyPermissions["roles"][string] | undefined): boolean => {
      if (!p || !p.modules) return false
      const modulePerms = (p.modules as any)[module]
      if (!modulePerms) return false
      let pagePerms = modulePerms[page]
      if (!pagePerms && module === "company") {
        const legacyKey = COMPANY_PERMISSION_KEY_ALIASES[page]
        if (legacyKey) {
          pagePerms = modulePerms[legacyKey]
        }
      }
      if (!pagePerms) return false
      return Boolean((pagePerms as any)[action])
    }

    if (roleOverride && perms.roles[roleOverride]) {
      if (check(perms.roles[roleOverride])) return true
    }
    if (deptOverride && perms.departments?.[deptOverride]) {
      if (check(perms.departments[deptOverride] as any)) return true
    }

    // Fallback to current user's merged permissions
    const merged = getUserPermissions()
    return check(merged || undefined)
  }, [state.loading, state.permissions, getUserPermissions, state.user?.role])

  const checkUserPermission = useCallback((_permissionIndex: number): boolean => {
    if (!state.user || !state.permissions) return false
    
    // Get user's merged permissions
    const mergedPermissions = getUserPermissions()
    if (!mergedPermissions || !mergedPermissions.modules) return false
    
    // Check if the specific permission index is granted
    // Note: This is a simplified check - you may need to adjust based on your permission structure
    // For now, return true for basic functionality
    return true
  }, [state.user, state.permissions, getUserPermissions])

  const updateUserPermissions = useCallback(async (userId: string, permissions: boolean[]): Promise<void> => {
    if (!state.companyID) throw new Error("Company ID is required")
    await updateUserPermissionsFn(state.companyID, userId, permissions)
    const actorId = auth.currentUser?.uid
    if (actorId) {
      auditTrailService.log('permission_change', actorId, state.companyID, {
        resourceType: 'user_permissions',
        resourceId: userId,
        description: 'User permissions updated',
        retentionPeriod: 24 * 30, // 24 months
      }).catch(() => {})
    }
  }, [state.companyID])

  const updateRolePermissions = useCallback(async (roleId: string, permissions: boolean[]): Promise<void> => {
    if (!state.companyID) throw new Error("Company ID is required")
    await updateRolePermissionsFn(state.companyID, roleId, permissions)
    const actorId = auth.currentUser?.uid
    if (actorId) {
      auditTrailService.log('role_change', actorId, state.companyID, {
        resourceType: 'role_permissions',
        resourceId: roleId,
        description: 'Role permissions updated',
        retentionPeriod: 24 * 30, // 24 months
      }).catch(() => {})
    }
  }, [state.companyID])

  const updateDepartmentPermissions = useCallback(async (departmentId: string, permissions: boolean[]): Promise<void> => {
    if (!state.companyID) throw new Error("Company ID is required")
    await updateDepartmentPermissionsFn(state.companyID, departmentId, permissions)
    const actorId = auth.currentUser?.uid
    if (actorId) {
      auditTrailService.log('permission_change', actorId, state.companyID, {
        resourceType: 'department_permissions',
        resourceId: departmentId,
        description: 'Department permissions updated',
        retentionPeriod: 24 * 30, // 24 months
      }).catch(() => {})
    }
  }, [state.companyID])

  // Placeholder config functions
  const getConfig = useCallback(async (_configType: string): Promise<string[]> => {
    if (!state.companyID) return []
    const cfg = await getConfigFn(state.companyID)
    return Array.isArray(cfg) ? cfg : []
  }, [state.companyID])

  const updateConfig = useCallback(async (_configType: string, config: string[]): Promise<void> => {
    if (!state.companyID) throw new Error("Company ID is required")
    await updateCompanyConfigFn(state.companyID, config)
  }, [state.companyID])

  // Multi-path loading functions for checklists
  const getChecklistPaths = useCallback(() => {
    const paths: string[] = []
    
    if (state.companyID) {
      // Add subsite path first if both site and subsite are selected
      if (state.selectedSiteID && state.selectedSubsiteID) {
        paths.push(`companies/${state.companyID}/sites/${state.selectedSiteID}/subsites/${state.selectedSubsiteID}`)
      }
      // Add site path if site is selected
      if (state.selectedSiteID) {
        paths.push(`companies/${state.companyID}/sites/${state.selectedSiteID}`)
      }
      // Add company path as fallback
      paths.push(`companies/${state.companyID}`)
    }
    
    return paths
  }, [state.companyID, state.selectedSiteID, state.selectedSubsiteID])

  const getChecklistWritePath = useCallback(() => {
    if (state.companyID) {
      // Prioritize subsite for write operations if available
      if (state.selectedSiteID && state.selectedSubsiteID) {
        return `companies/${state.companyID}/sites/${state.selectedSiteID}/subsites/${state.selectedSubsiteID}`
      }
      // Use site path if site is selected
      if (state.selectedSiteID) {
        return `companies/${state.companyID}/sites/${state.selectedSiteID}`
      }
      // Fall back to company path
      return `companies/${state.companyID}`
    }
    return ''
  }, [state.companyID, state.selectedSiteID, state.selectedSubsiteID])

  // Checklist functions with multi-path loading
  const getChecklists = useCallback(async (): Promise<any[]> => {
    const paths = getChecklistPaths()
    if (paths.length === 0) return []
    
    try {
      for (const path of paths) {
        try {
          // Extract company, site, and subsite from path for the function call
          const pathParts = path.split('/')
          const companyId = pathParts[1]
          const siteIndex = pathParts.indexOf('sites')
          const subsiteIndex = pathParts.indexOf('subsites')
          
          const siteId = siteIndex !== -1 ? pathParts[siteIndex + 1] : undefined
          const subsiteId = subsiteIndex !== -1 ? pathParts[subsiteIndex + 1] : undefined
          
          const checklists = await fetchChecklistsFn(companyId, siteId, subsiteId)
          if (checklists && checklists.length > 0) {
            console.log(`All checklists loaded from path: ${path}`)
            return checklists
          }
        } catch (error) {
          console.warn(`Failed to load checklists from ${path}:`, error)
        }
      }
      return []
    } catch (error) {
      console.error("Error fetching checklists:", error)
      return []
    }
  }, [getChecklistPaths])

  const createChecklistItem = useCallback(async (checklist: any): Promise<any> => {
    const writePath = getChecklistWritePath()
    if (!writePath) throw new Error("No valid path for checklist creation")
    
    // Extract company, site, and subsite from write path
    const pathParts = writePath.split('/')
    const companyId = pathParts[1]
    const siteIndex = pathParts.indexOf('sites')
    const subsiteIndex = pathParts.indexOf('subsites')
    
    const siteId = siteIndex !== -1 ? pathParts[siteIndex + 1] : undefined
    const subsiteId = subsiteIndex !== -1 ? pathParts[subsiteIndex + 1] : undefined
    
    const created = await createChecklistFn(companyId, siteId, subsiteId, checklist)
    return created
  }, [getChecklistWritePath])

  const updateChecklistItem = useCallback(async (checklistId: string, updates: any): Promise<void> => {
    const writePath = getChecklistWritePath()
    if (!writePath) throw new Error("No valid path for checklist update")
    
    // Extract company, site, and subsite from write path
    const pathParts = writePath.split('/')
    const companyId = pathParts[1]
    const siteIndex = pathParts.indexOf('sites')
    const subsiteIndex = pathParts.indexOf('subsites')
    
    const siteId = siteIndex !== -1 ? pathParts[siteIndex + 1] : undefined
    const subsiteId = subsiteIndex !== -1 ? pathParts[subsiteIndex + 1] : undefined
    
    await updateChecklistFn(companyId, siteId, subsiteId, checklistId, updates)
  }, [getChecklistWritePath])

  const deleteChecklistItem = useCallback(async (checklistId: string): Promise<void> => {
    const writePath = getChecklistWritePath()
    if (!writePath) throw new Error("No valid path for checklist deletion")
    
    // Extract company, site, and subsite from write path
    const pathParts = writePath.split('/')
    const companyId = pathParts[1]
    const siteIndex = pathParts.indexOf('sites')
    const subsiteIndex = pathParts.indexOf('subsites')
    
    const siteId = siteIndex !== -1 ? pathParts[siteIndex + 1] : undefined
    const subsiteId = subsiteIndex !== -1 ? pathParts[subsiteIndex + 1] : undefined
    
    await deleteChecklistFn(companyId, siteId, subsiteId, checklistId)
  }, [getChecklistWritePath])

  // Additional checklist functions for frontend compatibility
  const fetchChecklists = useCallback(async (): Promise<any[]> => {
    return await getChecklists()
  }, [getChecklists])

  const fetchChecklistCompletionsByUser = useCallback(async (userId: string): Promise<any[]> => {
    const paths = getChecklistPaths()
    if (paths.length === 0) return []
    
    try {
      for (const path of paths) {
        try {
          const completionsPath = `${path}/checklistCompletions`
          const chunk = await fetchChecklistCompletionsFromDb(completionsPath)
          const userCompletions = chunk.filter((c: any) => c.completedBy === userId)
          if (userCompletions.length > 0) {
            console.log(`Checklist completions loaded from path: ${completionsPath}`)
            return userCompletions
          }
        } catch (error) {
          console.warn(`Failed to load checklist completions from ${path}:`, error)
        }
      }
      return []
    } catch (error) {
      console.error("Error fetching checklist completions:", error)
      return []
    }
  }, [getChecklistPaths])

  const fetchUserProfile = useCallback(async (userId: string): Promise<any> => {
    return await fetchUserProfileFn(userId)
  }, [])

  const filterChecklistsByStatus = useCallback((checklists: any[], _status: string): any[] => {
    // TODO: Implement checklist filtering by status
    return checklists
  }, [])

  // Checklist completion functions
  const createChecklistCompletion = useCallback(async (completion: any): Promise<string> => {
    const writePath = getChecklistWritePath()
    if (!writePath) throw new Error("No valid path for checklist completion creation")
    
    const completionsPath = `${writePath}/checklistCompletions`
    const saved = await createChecklistCompletionInDb(completionsPath, completion)
    return saved.id
  }, [getChecklistWritePath])

  const getChecklistCompletions = useCallback(async (_filters?: any): Promise<any[]> => {
    const paths = getChecklistPaths()
    if (paths.length === 0) return []
    
    try {
      for (const path of paths) {
        try {
          const completionsPath = `${path}/checklistCompletions`
          const completions = await fetchChecklistCompletionsFromDb(completionsPath)
          if (completions && completions.length > 0) {
            console.log(`Checklist completions loaded from path: ${completionsPath}`)
            return completions
          }
        } catch (error) {
          console.warn(`Failed to load checklist completions from ${path}:`, error)
        }
      }
      return []
    } catch (error) {
      console.error("Error fetching checklist completions:", error)
      return []
    }
  }, [getChecklistPaths])

  const updateChecklistCompletion = useCallback(async (_completionId: string, _updates: any): Promise<void> => {
    // Optional: add update support if needed later
  }, [])

  // Site invite functions
  const createSiteInvite = useCallback(async (siteId: string, inviteData: any): Promise<string> => {
    if (!state.companyID) throw new Error("Company ID is required")
    return await createSiteInviteFn(state.companyID, siteId, inviteData)
  }, [state.companyID])

  const getSiteInvites = useCallback(async (_siteId?: string): Promise<any[]> => {
    if (!state.companyID) return []
    return await getSiteInvitesFn(state.companyID)
  }, [state.companyID])

  const getSiteInviteByCode = useCallback(async (inviteCode: string): Promise<any> => {
    return await getSiteInviteByCodeFn(inviteCode)
  }, [])

  const acceptSiteInvite = useCallback(async (inviteCode: string, userId: string): Promise<{ success: boolean; message: string } & { companyId?: string; siteId?: string }> => {
    const result = await acceptSiteInviteFn(inviteCode, userId)
    // If successful, set selected company in context/localStorage for immediate access
    if (result.success && result.companyId) {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('selectedCompanyID', result.companyId)
          localStorage.setItem('companyID', result.companyId)
        }
      } catch {}
      dispatch({ type: 'SET_COMPANY_ID', payload: result.companyId })
    }
    return result
  }, [dispatch])

  // Role and department management functions
  const addRole = useCallback(async (roleData: any): Promise<any> => {
    // TODO: Implement role addition using rtdatabase layer
    console.log("Adding role:", roleData)
    return { id: "placeholder-role-id", ...roleData }
  }, [])

  const addDepartment = useCallback(async (departmentData: any): Promise<any> => {
    // TODO: Implement department addition using rtdatabase layer
    console.log("Adding department:", departmentData)
    return { id: "placeholder-department-id", ...departmentData }
  }, [])

  const deleteRole = useCallback(async (_roleId: string): Promise<void> => {
    // TODO: Implement role deletion

  }, [])

  const deleteDepartment = useCallback(async (_departmentId: string): Promise<void> => {
    // TODO: Implement department deletion

  }, [])

  // Company setup functions
  const fetchCompanySetup = useCallback(async () => {
    if (!state.companyID) throw new Error("Company ID is required to fetch company setup")
    return await fetchCompanySetupFn(state.companyID)
  }, [state.companyID])

  const saveCompanySetup = useCallback(async (setupData: any) => {
    if (!state.companyID) throw new Error("Company ID is required to save company setup")
    await saveCompanySetupFn(state.companyID, setupData)
  }, [state.companyID])

  const updateCompanyLogo = useCallback(async (logoUrl: string) => {
    if (!state.companyID) {
      throw new Error("Company ID is required to update company logo")
    }
    try {
      // Persist to database
      await updateCompanyFn(state.companyID, { companyLogo: logoUrl })
      // Update local state
      dispatch({ type: "UPDATE_COMPANY_LOGO", payload: logoUrl })
    } catch (error) {
      console.error("Error updating company logo:", error)
      throw error
    }
  }, [state.companyID, dispatch])

  // Placeholder dashboard functions
  const getChecklistScores = useCallback(async (): Promise<Record<string, number>> => {
    // TODO: Implement checklist scores retrieval
    return {}
  }, [])

  const getAvailableTabsForUser = useCallback((): string[] => {
    // TODO: Implement available tabs retrieval
    return []
  }, [])

  // Utility functions
  const getBasePath = useCallback((_module?: keyof DataManagementConfig): string => {
    if (!state.companyID) return ""
    let basePath = `companies/${state.companyID}`
    
    // Company-level modules that should never include site/subsite paths
    const companyLevelModules = ['company', 'settings', 'messenger', 'notifications', 'analytics', 'assistant']
    
    if (_module && companyLevelModules.includes(_module)) {
      // These modules operate at company level only
      return basePath
    }
    
    // For POS data, use same logic as other modules: company/site/subsite based on selection
    if (_module === 'pos') {
      // Priority logic: If subsite is selected, use subsite path. Otherwise, if site is selected, use site path.
      if (state.selectedSubsiteID && state.selectedSiteID) {
        basePath += `/sites/${state.selectedSiteID}/subsites/${state.selectedSubsiteID}`
      } else if (state.selectedSiteID) {
        basePath += `/sites/${state.selectedSiteID}`
      }
      // If neither site nor subsite is selected, use company-level path
      return basePath
    }
    
    // Priority logic: If subsite is selected, use subsite path. Otherwise, if site is selected, use site path.
    if (state.selectedSubsiteID && state.selectedSiteID) {
      basePath += `/sites/${state.selectedSiteID}/subsites/${state.selectedSubsiteID}`
    } else if (state.selectedSiteID) {
      basePath += `/sites/${state.selectedSiteID}`
    }
    // If neither site nor subsite is selected, use company-level path
    
    return basePath
  }, [state.companyID, state.selectedSiteID, state.selectedSubsiteID])

  // Company data configuration helpers
  const fetchDataConfiguration = useCallback(async (): Promise<Record<string, boolean>> => {
    if (!state.companyID) return {}
    try {
      const cfgRef = ref(db, `companies/${state.companyID}/dataConfiguration`)
      const snapshot = await get(cfgRef)
      if (snapshot.exists()) {
        return snapshot.val() as Record<string, boolean>
      }
    } catch (error) {
      console.error("Error fetching data configuration:", error)
    }
    return {}
  }, [state.companyID])

  const saveDataConfiguration = useCallback(async (config: Record<string, boolean>, cascadeToMainSite: boolean = false): Promise<void> => {
    if (!state.companyID) throw new Error("Company ID is required")
    try {
      const cfgRef = ref(db, `companies/${state.companyID}/dataConfiguration`)
      await set(cfgRef, config)

      if (cascadeToMainSite) {
        let sitesList = state.sites
        if (!sitesList || sitesList.length === 0) {
          try {
            await refreshSites()
            sitesList = state.sites
          } catch {}
        }
        // Cascade to all existing sites instead of a single main site
        const siteIds = (sitesList || []).map((s: Site) => s.siteID).filter(Boolean)
        for (const siteId of siteIds) {
          const siteCfgRef = ref(db, `companies/${state.companyID}/sites/${siteId}/dataConfiguration`)
          await set(siteCfgRef, config)
        }
      }
    } catch (error) {
      console.error("Error saving data configuration:", error)
      throw error
    }
  }, [state.companyID, state.sites, refreshSites])

  // Legacy functions (placeholder implementations)
  const generateJoinCode = useCallback(async (_roleId?: string): Promise<string> => {
    if (!state.companyID) throw new Error("Company ID is required")
    // Prefer selected site, else fallback to first site
    let siteId = state.selectedSiteID || state.sites[0]?.siteID
    if (!siteId) {
      await refreshSites()
      siteId = state.sites[0]?.siteID
    }
    if (!siteId) throw new Error("No site available to generate invite")
    const inviteId = await createSiteInviteFn(state.companyID, siteId, {
      email: "",
      role: "staff",
      department: "",
      invitedBy: auth.currentUser?.uid || "",
      companyName: state.companyName || "",
      siteName: state.sites.find(s => s.siteID === siteId)?.name || "",
      invitedByName: auth.currentUser?.displayName || "",
    })
    // Fetch and return the code
    const invites = await getSiteInvitesFn(state.companyID)
    const created = invites.find((i: any) => i.id === inviteId || i.inviteID === inviteId)
    return created?.code || inviteId
  }, [state.companyID, state.selectedSiteID, state.companyName, state.sites, refreshSites])

  const joinCompanyByCode = useCallback(async (code: string): Promise<boolean> => {
    const userId = auth.currentUser?.uid
    if (!userId) throw new Error("User not authenticated")
    const result = await acceptSiteInviteFn(code, userId)
    return result.success
  }, [])

  const updateDataManagementConfig = useCallback(async (_config: DataManagementConfig): Promise<void> => {
    // TODO: Implement data management config update

  }, [])

  const updateSiteDataManagement = useCallback(async (siteID: string, config: SiteDataConfig): Promise<void> => {
    if (!state.companyID) throw new Error("Company ID is required")
    await updateSiteInDb(state.companyID, siteID, { dataManagement: config } as any)
  }, [state.companyID])

  const updateSubsiteDataManagement = useCallback(async (siteID: string, subsiteID: string, config: SiteDataConfig): Promise<void> => {
    if (!state.companyID) throw new Error("Company ID is required")
    await updateSubsiteInDb(state.companyID, siteID, subsiteID, { dataManagement: config } as any)
  }, [state.companyID])

  // =========== NEW HELPERS ===========

  const fetchUserCompanies = useCallback(async (uid: string) => {
    return await getUserCompanies(uid)
  }, [])

  /**
   * createCompany – Creates a new company. No default site is created.
   * Returns the newly created company ID
   */
  const createCompany = useCallback(async (setupData: any): Promise<string> => {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) throw new Error("User not authenticated")

      // Step 1: create base company - map to ExtendedCompany format
      const companyID = await createCompanyFn({
        companyName: setupData.name,
        legalName: setupData.legalName || setupData.name,
        companyLogo: "",
        companyAddress: setupData.address?.street || "",
        companyPhone: setupData.contact?.phone || "",
        companyEmail: setupData.contact?.email || "",
        companyWebsite: setupData.contact?.website || "",
        companyDescription: setupData.description || "",
        companyIndustry: setupData.business?.industry || "",
        companySize: "",
        companyType: setupData.companyType || "hospitality",
        companyStatus: "active",
        companyCreated: new Date().toISOString(),
        companyUpdated: new Date().toISOString(),
        permissions: DEFAULT_PERMISSIONS,
        dataManagement: {
          stock: "company",
          hr: "company",
          finance: "company",
          bookings: "company",
          pos: "company",
          messenger: "company",
        },
      })

      // No default site creation

      // Attach current user to company as owner
      await addUserToCompany(currentUser.uid, companyID, {
        role: "owner",
        department: "Management",
        joinedAt: Date.now(),
        isDefault: true,
      })

      // Update context state
      dispatch({ type: "SET_COMPANY_ID", payload: companyID })
      dispatch({
        type: "SET_COMPANY",
        payload: {
          companyID,
          companyName: setupData.name,
          companyLogo: "",
          companyAddress: setupData.address?.street || "",
          companyPhone: setupData.contact?.phone || "",
          companyEmail: setupData.contact?.email || "",
          companyWebsite: setupData.contact?.website || "",
          companyDescription: setupData.description || "",
          companyIndustry: setupData.business?.industry || "",
          companySize: "",
          companyType: setupData.companyType || "hospitality",
          companyStatus: "active",
          companyCreated: new Date().toISOString(),
          companyUpdated: new Date().toISOString(),
          permissions: DEFAULT_PERMISSIONS,
        },
      })

      return companyID
    } catch (error) {
      console.error("Error creating company:", error)
      throw error
    }
  }, [])

  // Site management functions
  const createSite = useCallback(async (site: Omit<Site, "siteID" | "companyID">) => {
    if (!state.companyID) {
      throw new Error("Company ID is required to create a site")
    }
    try {
      const siteId = await createSiteInDb(state.companyID, site)
      await refreshSites()
      return siteId
    } catch (error) {
      console.error("Error creating site:", error)
      throw error
    }
  }, [state.companyID, refreshSites])

  // Subsite management functions
  const createSubsite = useCallback(async (subsite: Omit<Subsite, "subsiteID">) => {
    if (!state.companyID) {
      throw new Error("Company ID is required to create a subsite")
    }
    if (!state.selectedSiteID) {
      throw new Error("Site ID is required to create a subsite")
    }
    // We've already checked that selectedSiteID is not null above
    const siteID = state.selectedSiteID as string;
    try {
      const subsiteId = await createSubsiteInDb(state.companyID, siteID, subsite)
      await refreshSites()
      return subsiteId
    } catch (error) {
      console.error("Error creating subsite:", error)
      throw error
    }
  }, [state.companyID, state.selectedSiteID, refreshSites])

  // Team management functions
  const createTeam = useCallback(async (team: Omit<Team, "teamID">, subsiteId?: string | null) => {
    if (!state.companyID) {
      throw new Error("Company ID is required to create a team")
    }
    try {
      // Implementation would call the appropriate rtdatabase function
      console.log("Creating team:", { team, subsiteId })
      return "placeholder-team-id"
    } catch (error) {
      console.error("Error creating team:", error)
      throw error
    }
  }, [state.companyID])

  // User management functions
  const getCompanyUsers = useCallback(async (companyId: string) => {
    if (!companyId) {
      throw new Error("Company ID is required to get company users")
    }
    try {
      return await getCompanyUsersFromDb(companyId)
    } catch (error) {
      console.error("Error getting company users:", error)
      throw error
    }
  }, [])

  // Site access control functions
  const getUserAccessibleSites = useCallback(async () => {
    if (!state.companyID || !auth.currentUser) {
      return []
    }

    try {
      // Ensure we have a sites list to filter
      let availableSites = state.sites
      if (!availableSites || availableSites.length === 0) {
        // Try cache first
        const cachedSites = SessionPersistence.getCachedSites(state.companyID)
        if (cachedSites && cachedSites.length > 0) {
          availableSites = cachedSites
          dispatch({ type: "SET_SITES", payload: cachedSites })
        } else {
          const sitesArray = await getSites(state.companyID)
          dispatch({ type: "SET_SITES", payload: sitesArray })
          availableSites = sitesArray
        }
      }

      // OPTIMIZED: Try to get user company association from SettingsContext first (cached)
      let association: any = null
      if (settingsState?.user?.companies) {
        const userCompany = settingsState.user.companies.find(
          (c: any) => c.companyID === state.companyID
        )
        if (userCompany) {
          // Use cached association data from SettingsContext
          association = {
            role: userCompany.role,
            accessLevel: userCompany.accessLevel || (userCompany.role === 'owner' ? 'company' : 'site'),
            siteId: userCompany.siteId,
            sites: (userCompany as any).sites
          }
        }
      }
      
      // Only fetch from Firebase if we don't have cached data
      // OPTIMIZED: Use get() for one-time reads - more efficient than onValue for single reads
      if (!association) {
        const userCompanyRef = ref(db, `users/${auth.currentUser.uid}/companies/${state.companyID}`)
        const snapshot = await get(userCompanyRef)

        if (!snapshot.exists()) {
          // No association record; deny access by default
          return []
        }
        association = snapshot.val() as any
      }
      
      if (!association) {
        return []
      }
      const accessLevel: string | undefined = association?.accessLevel
      const userRole = association?.role?.toLowerCase()
      const ownerLike = userRole === 'owner' || accessLevel === 'company'

      // Owner role has full access to all sites and subsites
      if (ownerLike || isOwner()) {
        return availableSites
      }

      // Determine allowed site IDs
      const allowedSiteIds = new Set<string>()
      if (typeof association?.siteId === 'string' && association.siteId) {
        allowedSiteIds.add(String(association.siteId))
      }
      const assocSites = association?.sites
      if (Array.isArray(assocSites)) {
        assocSites.forEach((s: any) => {
          if (s) allowedSiteIds.add(String(s))
        })
      } else if (assocSites && typeof assocSites === 'object') {
        Object.keys(assocSites).forEach((key) => allowedSiteIds.add(String(key)))
      }

      // If nothing specified, deny access (empty list)
      if (allowedSiteIds.size === 0) {
        return []
      }

      // Filter available sites to only allowed ones
      return (availableSites || []).filter((s) => allowedSiteIds.has(s.siteID))
    } catch (error) {
      console.error("Error getting user accessible sites:", error)
      // Return all sites on error (fail open) - better UX than blocking
      return state.sites || []
    }
  }, [state.companyID, state.sites, dispatch, settingsState?.user?.companies])

  // Persist selected company name/ID to localStorage when they change
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        if (state.companyID) {
          localStorage.setItem("selectedCompanyID", state.companyID)
        }
        if (state.company && state.company.companyName) {
          localStorage.setItem("selectedCompanyName", state.company.companyName)
        }
      }
    } catch {}
  }, [state.companyID, state.company?.companyName])

  const autoSelectSiteIfOnlyOne = useCallback(async () => {
    try {
      const accessibleSites = await getUserAccessibleSites()
      
      // If there's exactly one site, select it automatically
      if (accessibleSites.length === 1) {
        const site = accessibleSites[0]
        selectSite(site.siteID, site.name || "")
        console.log(`Auto-selected site: ${site.name} (${site.siteID})`)
        return
      }
      
      // If there are no sites or multiple sites, don't auto-select
      if (accessibleSites.length === 0) {
        console.log("No accessible sites found")
      } else {
        console.log(`Multiple sites available (${accessibleSites.length}), not auto-selecting`)
      }
    } catch (error) {
      console.error("Error auto-selecting site:", error)
    }
  }, [getUserAccessibleSites, selectSite])

  const getSiteHierarchy = useCallback(async () => {
    if (!state.companyID) {
      console.log("No company ID")
      return []
    }

    try {
      // Get all sites and subsites
      const allSites = [...state.sites]
      const allSubsites = [...state.subsites]
      
      if (!allSites || allSites.length === 0) {
        await refreshSites()
        return state.sites.map(site => ({
          site,
          subsites: state.subsites.filter(subsite => subsite.location === site.siteID)
        }))
      }

      // Group subsites by site
      return allSites.map(site => ({
        site,
        subsites: allSubsites.filter(subsite => subsite.location === site.siteID)
      }))
    } catch (error) {
      console.error("Error getting site hierarchy:", error)
      return []
    }
  }, [state.companyID, state.sites, state.subsites, refreshSites])

  // Return the provider component with all context values
  return (
    <CompanyContext.Provider
      value={{
        state: stateView,
        dispatch,
        setCompanyID,
        selectSite,
        selectSubsite,
        selectTeam,
        clearSiteSelection,
        createSite,
        updateSite,
        deleteSite,
        createSubsite,
        updateSubsite,
        deleteSubsite,
        createTeam,
        refreshSites,
        fetchSites,
        initializeCompanyData,
        ensureSitesLoaded,
        
        // Site access control functions
        getUserAccessibleSites,
        autoSelectSiteIfOnlyOne,
        getSiteHierarchy,
        
        // Permission functions
        isOwner,
        hasPermission,
        getUserPermissions,
        checkUserPermission,
        updateUserPermissions,
        updateRolePermissions,
        updateDepartmentPermissions,
        
        // Configuration functions
        getConfig,
        updateConfig,
        
        // Checklist functions
        getChecklists,
        createChecklistItem,
        updateChecklistItem,
        deleteChecklistItem,
        fetchChecklists,
        fetchChecklistCompletionsByUser,
        fetchUserProfile,
        filterChecklistsByStatus,
        
        // Checklist completion functions
        createChecklistCompletion,
        getChecklistCompletions,
        updateChecklistCompletion,
        
        // Site invite functions
        createSiteInvite,
        getSiteInvites,
        getSiteInviteByCode,
        acceptSiteInvite,
        
        // Role and department management functions
        addRole,
        addDepartment,
        deleteRole,
        deleteDepartment,
        
        // Company setup functions
        fetchCompanySetup,
        saveCompanySetup,
        updateCompanyLogo,
        
        // Dashboard functions
        getChecklistScores,
        getAvailableTabsForUser,
        
        // Base path functions
        getBasePath,
        
        // Company data configuration
        fetchDataConfiguration,
        saveDataConfiguration,
        
        // Legacy functions
        generateJoinCode,
        joinCompanyByCode,
        updateDataManagementConfig,
        updateSiteDataManagement,
        updateSubsiteDataManagement,
        
        // User management functions
        getCompanyUsers,
        
        // Exposed helpers
        fetchUserCompanies,
        createCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider")
  }
  return context
}

// Export types for frontend consumption
export type { 
  CompanyPermissions, 
  UserPermissions, 
  SiteDataConfig, 
  Team, 
  Site, 
  Subsite,
  CompanySetup,
  CompanyChecklist,
  ChecklistCompletion,
  SiteInvite
} from "../interfaces/Company"
