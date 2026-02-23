/**
 * ESS Context Provider
 * 
 * Main state management for ESS Portal:
 * - Triple verification (auth + role + employee)
 * - Data isolation (staff sees only their data)
 * - Clock in/out management
 * - Company settings integration
 * - Multi-company support
 */

"use client"

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
} from "react"
import { useSettings } from "../../backend/context/SettingsContext"
import { useCompany } from "../../backend/context/CompanyContext"
import { useHR } from "../../backend/context/HRContext"
import { db, ref, get, set, push, update } from "../../backend/services/Firebase"
import { parseISO } from "date-fns"
import { ESSSessionPersistence } from "../utils/essSessionPersistence"
import {
  filterCurrentEmployee,
  filterUpcomingShifts,
  filterPendingTimeOff,
  filterApprovedTimeOff,
  filterRecentAttendance,
  filterEmployeePayslips,
  filterEmployeePerformanceReviews,
  calculateHolidayBalance,
  determineClockStatus,
} from "../utils/essDataFilters"
import type { PerformanceReview } from "../../backend/interfaces/HRs"
import {
  createESSError,
  handleFirebaseError,
  logESSError,
} from "../utils/essErrorHandler"
import { useESSDevice } from "../hooks/useESSDevice"
import type {
  ESSState,
  ESSAuthState,
  ESSContextValue,
  ESSCompanySettings,
  ESSClockInPayload,
  ESSClockOutPayload,
  ESSTimeOffRequest,
  ESSError,
  ESSPerformanceReview,
  ESSUserRole,
  ESSEmergencyContact,
} from "../types"

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_COMPANY_SETTINGS: ESSCompanySettings = {
  clockInRequiresLocation: true,
  allowEarlyClockIn: true,
  earlyClockInMinutes: 15,
  allowLateClockOut: true,
  autoClockOutEnabled: false,
  autoClockOutTime: "23:59",
  breakDurationMinutes: 30,
}

const INITIAL_STATE: ESSState = {
  currentEmployee: null,
  employeeId: null,
  isEmployeeLinked: false,
  emulatedEmployeeId: null,
  isClockedIn: false,
  clockInTime: null,
  lastClockEvent: null,
  upcomingShifts: [],
  pendingTimeOff: [],
  approvedTimeOff: [],
  recentAttendance: [],
  payslips: [],
  performanceReviews: [],
  publicHolidays: [],
  holidayBalance: {
    total: 0,
    used: 0,
    pending: 0,
    remaining: 0,
    carryOver: 0,
  },
  companySettings: DEFAULT_COMPANY_SETTINGS,
  isLoading: true,
  isInitialized: false,
  error: null,
  emergencyContacts: [],
}

// ============================================
// REDUCER
// ============================================

type ESSAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: ESSError | null }
  | { type: "SET_INITIALIZED"; payload: boolean }
  | { type: "SET_EMPLOYEE"; payload: { employee: ESSState["currentEmployee"]; employeeId: string | null } }
  | { type: "SET_EMULATED_EMPLOYEE"; payload: string | null }
  | { type: "SET_CLOCK_STATUS"; payload: { isClockedIn: boolean; clockInTime: number | null; lastClockEvent: ESSState["lastClockEvent"] } }
  | { type: "SET_SCHEDULES"; payload: ESSState["upcomingShifts"] }
  | { type: "SET_TIME_OFF"; payload: { pending: ESSState["pendingTimeOff"]; approved: ESSState["approvedTimeOff"] } }
  | { type: "SET_ATTENDANCE"; payload: ESSState["recentAttendance"] }
  | { type: "SET_PAYSLIPS"; payload: ESSState["payslips"] }
  | { type: "SET_PERFORMANCE_REVIEWS"; payload: ESSState["performanceReviews"] }
  | { type: "SET_PUBLIC_HOLIDAYS"; payload: ESSState["publicHolidays"] }
  | { type: "SET_HOLIDAY_BALANCE"; payload: ESSState["holidayBalance"] }
  | { type: "SET_COMPANY_SETTINGS"; payload: ESSCompanySettings }
  | { type: "SET_EMERGENCY_CONTACTS"; payload: ESSState["emergencyContacts"] }
  | { type: "RESET_STATE" }

const essReducer = (state: ESSState, action: ESSAction): ESSState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false }
    case "SET_INITIALIZED":
      return { ...state, isInitialized: action.payload }
    case "SET_EMPLOYEE":
      return {
        ...state,
        currentEmployee: action.payload.employee,
        employeeId: action.payload.employeeId,
        isEmployeeLinked: !!action.payload.employee,
      }
    case "SET_EMULATED_EMPLOYEE":
      return {
        ...state,
        emulatedEmployeeId: action.payload,
      }
    case "SET_CLOCK_STATUS":
      return {
        ...state,
        isClockedIn: action.payload.isClockedIn,
        clockInTime: action.payload.clockInTime,
        lastClockEvent: action.payload.lastClockEvent,
      }
    case "SET_SCHEDULES":
      return { ...state, upcomingShifts: action.payload }
    case "SET_TIME_OFF":
      return {
        ...state,
        pendingTimeOff: action.payload.pending,
        approvedTimeOff: action.payload.approved,
      }
    case "SET_ATTENDANCE":
      return { ...state, recentAttendance: action.payload }
    case "SET_PAYSLIPS":
      return { ...state, payslips: action.payload }
    case "SET_PERFORMANCE_REVIEWS":
      return { ...state, performanceReviews: action.payload }
    case "SET_PUBLIC_HOLIDAYS":
      return { ...state, publicHolidays: action.payload }
    case "SET_HOLIDAY_BALANCE":
      return { ...state, holidayBalance: action.payload }
    case "SET_COMPANY_SETTINGS":
      return { ...state, companySettings: action.payload }
    case "SET_EMERGENCY_CONTACTS":
      return { ...state, emergencyContacts: action.payload }
    case "RESET_STATE":
      return INITIAL_STATE
    default:
      return state
  }
}

// ============================================
// CONTEXT
// ============================================

const ESSContext = createContext<ESSContextValue | undefined>(undefined)

// ============================================
// PROVIDER
// ============================================

interface ESSProviderProps {
  children: React.ReactNode
}

export const ESSProvider: React.FC<ESSProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(essReducer, INITIAL_STATE)

  // Get data from existing contexts
  const { state: settingsState } = useSettings()
  const { state: companyState, getBasePath } = useCompany()
  const { state: hrState, updateSchedule } = useHR()

  // Device detection
  const deviceInfo = useESSDevice()

  // ============================================
  // DERIVED AUTH STATE
  // ============================================

  const authState = useMemo((): ESSAuthState => {
    const isAuthenticated = settingsState.auth?.isLoggedIn === true
    const userId = settingsState.auth?.uid || null
    const userRoleRaw = companyState.user?.role?.toLowerCase() || null
    const userRole: ESSUserRole | null = userRoleRaw && ["staff", "manager", "admin", "owner"].includes(userRoleRaw)
      ? (userRoleRaw as ESSUserRole)
      : null
    const currentCompanyId = companyState.companyID || null
    const currentSiteId = companyState.selectedSiteID || null

    // Get companies from settingsState
    const userCompanies = settingsState.user?.companies || []
    const companies = userCompanies.map((c: any) => ({
      companyId: c.companyID,
      companyName: c.companyName || c.name || "",
      role: (c.role?.toLowerCase() || "staff") as ESSUserRole,
      siteId: c.siteId || "",
      siteName: c.siteName || "",
    }))

    return {
      isAuthenticated,
      userId,
      userRole,
      currentCompanyId,
      currentSiteId,
      companies,
      isMultiCompany: companies.length > 1,
    }
  }, [settingsState.auth, settingsState.user, companyState])

  // ============================================
  // LOAD COMPANY SETTINGS
  // Enhanced with better error recovery and fallback logic
  // ============================================

  const loadCompanySettings = useCallback(async () => {
    if (!authState.currentCompanyId) {
      // No company ID - use defaults
      dispatch({ type: "SET_COMPANY_SETTINGS", payload: DEFAULT_COMPANY_SETTINGS })
      return
    }

    let retryCount = 0
    const maxRetries = 2

    const attemptLoad = async (): Promise<void> => {
      try {
        const settingsPath = `companies/${authState.currentCompanyId}/settings`
        const settingsRef = ref(db, settingsPath)
        const snapshot = await get(settingsRef)

        if (snapshot.exists()) {
          const settings = snapshot.val()
          
          // Validate and merge settings with defaults
          const mergedSettings: ESSCompanySettings = {
            clockInRequiresLocation: 
              typeof settings.clockInRequiresLocation === "boolean" 
                ? settings.clockInRequiresLocation 
                : DEFAULT_COMPANY_SETTINGS.clockInRequiresLocation,
            allowEarlyClockIn: 
              typeof settings.allowEarlyClockIn === "boolean" 
                ? settings.allowEarlyClockIn 
                : DEFAULT_COMPANY_SETTINGS.allowEarlyClockIn,
            earlyClockInMinutes: 
              typeof settings.earlyClockInMinutes === "number" && settings.earlyClockInMinutes > 0
                ? settings.earlyClockInMinutes 
                : DEFAULT_COMPANY_SETTINGS.earlyClockInMinutes,
            allowLateClockOut: 
              typeof settings.allowLateClockOut === "boolean" 
                ? settings.allowLateClockOut 
                : DEFAULT_COMPANY_SETTINGS.allowLateClockOut,
            autoClockOutEnabled: 
              typeof settings.autoClockOutEnabled === "boolean" 
                ? settings.autoClockOutEnabled 
                : DEFAULT_COMPANY_SETTINGS.autoClockOutEnabled,
            autoClockOutTime: 
              typeof settings.autoClockOutTime === "string" && settings.autoClockOutTime.length > 0
                ? settings.autoClockOutTime 
                : DEFAULT_COMPANY_SETTINGS.autoClockOutTime,
            breakDurationMinutes: 
              typeof settings.breakDurationMinutes === "number" && settings.breakDurationMinutes >= 0
                ? settings.breakDurationMinutes 
                : DEFAULT_COMPANY_SETTINGS.breakDurationMinutes,
          }

          dispatch({
            type: "SET_COMPANY_SETTINGS",
            payload: mergedSettings,
          })
        } else {
          // Settings don't exist - use defaults
          console.log("[ESS] Company settings not found, using defaults")
          dispatch({ type: "SET_COMPANY_SETTINGS", payload: DEFAULT_COMPANY_SETTINGS })
        }
      } catch (error: any) {
        console.error("[ESS] Failed to load company settings (attempt " + (retryCount + 1) + "):", error)
        
        // Retry on network errors
        if (retryCount < maxRetries && (
          error?.code === "unavailable" || 
          error?.code === "network-error" ||
          error?.message?.includes("network")
        )) {
          retryCount++
          console.log("[ESS] Retrying company settings load...")
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
          return attemptLoad()
        }
        
        // Use defaults on error after retries
        console.warn("[ESS] Using default company settings due to error")
        dispatch({ type: "SET_COMPANY_SETTINGS", payload: DEFAULT_COMPANY_SETTINGS })
      }
    }

    await attemptLoad()
  }, [authState.currentCompanyId])

  // ============================================
  // LOAD EMPLOYEE DATA
  // ============================================

  const loadEmployeeData = useCallback(() => {
    // If emulated employee is set (owner mode), use that employee
    if (state.emulatedEmployeeId && hrState.employees) {
      const emulatedEmployee = hrState.employees.find((emp: any) => emp.id === state.emulatedEmployeeId)
      if (emulatedEmployee) {
        dispatch({
          type: "SET_EMPLOYEE",
          payload: {
            employee: emulatedEmployee,
            employeeId: emulatedEmployee.id,
          },
        })
        return
      }
    }

    // Otherwise, use normal employee lookup
    if (!authState.userId || !hrState.employees) {
      dispatch({ type: "SET_EMPLOYEE", payload: { employee: null, employeeId: null } })
      dispatch({ type: "SET_EMERGENCY_CONTACTS", payload: [] })
      return
    }

    const employee = filterCurrentEmployee(hrState.employees, authState.userId)
    
    dispatch({
      type: "SET_EMPLOYEE",
      payload: {
        employee,
        employeeId: employee?.id || null,
      },
    })
    
    // Emergency contacts will be loaded by loadEmergencyContacts() in loadFilteredData()
  }, [authState.userId, hrState.employees, state.emulatedEmployeeId])

  // ============================================
  // LOAD EMERGENCY CONTACTS
  // ============================================

  const loadEmergencyContacts = useCallback(() => {
    if (!state.currentEmployee) {
      dispatch({ type: "SET_EMERGENCY_CONTACTS", payload: [] })
      return
    }

    const employee = state.currentEmployee
    
    // Load emergency contacts from employee record
    // Employee interface has emergencyContact (singular object), convert to array format
    let emergencyContacts: ESSEmergencyContact[] = []
    if (employee?.emergencyContact) {
      const ec = employee.emergencyContact as any
      emergencyContacts = [{
        id: ec.id || `ec-${Date.now()}`,
        name: ec.name || "",
        relationship: ec.relationship || "",
        phone: ec.phone || "",
        email: ec.email,
        isPrimary: true,
      }]
    } else if ((employee as any)?.emergencyContacts) {
      // If employee has emergencyContacts array, use it
      emergencyContacts = (employee as any).emergencyContacts as ESSEmergencyContact[]
    }
    
    dispatch({ type: "SET_EMERGENCY_CONTACTS", payload: emergencyContacts })
  }, [state.currentEmployee])

  // ============================================
  // LOAD FILTERED DATA
  // Optimized for ESS: Only loads employee-specific data
  // Filters from HRContext data efficiently (no duplicate fetches)
  // ============================================

  const loadFilteredData = useCallback(() => {
    // Use emulated employee ID if set, otherwise use normal employee ID
    const employeeId = state.emulatedEmployeeId || state.employeeId
    if (!employeeId) {
      // Clear all data if no employee ID
      dispatch({ type: "SET_SCHEDULES", payload: [] })
      dispatch({ type: "SET_TIME_OFF", payload: { pending: [], approved: [] } })
      dispatch({ type: "SET_ATTENDANCE", payload: [] })
      dispatch({ type: "SET_PAYSLIPS", payload: [] })
      dispatch({ type: "SET_PERFORMANCE_REVIEWS", payload: [] })
      dispatch({ type: "SET_HOLIDAY_BALANCE", payload: { total: 0, used: 0, pending: 0, remaining: 0, carryOver: 0 } })
      return
    }

    // ESS only needs filtered data for current employee
    // All data comes from HRContext (already loaded/cached)
    // This is efficient - no additional network requests

    // Load upcoming shifts (filtered by employee) - no limit, get all upcoming
    // Debug logging
    console.log('[ESS] Loading shifts:', {
      totalSchedules: hrState.schedules?.length || 0,
      employeeId,
      schedulesSample: hrState.schedules?.slice(0, 3).map((s: any) => ({
        id: s.id,
        employeeId: s.employeeId || s.employeeID,
        date: s.date,
        status: s.status
      }))
    })
    
    const upcomingShifts = filterUpcomingShifts(hrState.schedules || [], employeeId)
    
    console.log('[ESS] Filtered shifts:', {
      count: upcomingShifts.length,
      shifts: upcomingShifts.slice(0, 5).map((s: any) => ({
        id: s.id,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime
      }))
    })
    
    dispatch({ type: "SET_SCHEDULES", payload: upcomingShifts })

    // Load time off (filtered by employee)
    const pendingTimeOff = filterPendingTimeOff(hrState.timeOffs || [], employeeId)
    const approvedTimeOff = filterApprovedTimeOff(hrState.timeOffs || [], employeeId)
    dispatch({ type: "SET_TIME_OFF", payload: { pending: pendingTimeOff, approved: approvedTimeOff } })

    // Load attendance (filtered by employee)
    const recentAttendance = filterRecentAttendance(hrState.attendances || [], employeeId)
    dispatch({ type: "SET_ATTENDANCE", payload: recentAttendance })

    // Determine clock status from attendance
    // Preserve clock status if there was a recent clock event (within last 10 minutes)
    // This prevents losing clock status during navigation if attendance hasn't synced yet
    const clockStatus = determineClockStatus(recentAttendance)
    const hasRecentClockEvent = state.lastClockEvent && 
      (Date.now() - state.lastClockEvent.timestamp) < 10 * 60 * 1000 // 10 minutes
    
    // If we have a recent clock-in event and current state says we're clocked in,
    // but attendance records don't show it yet, preserve the clock status
    // This handles the case where the database write hasn't propagated yet
    if (hasRecentClockEvent && state.isClockedIn && state.clockInTime && !clockStatus.isClockedIn) {
      // Keep the existing clock status - don't overwrite with stale attendance data
      // The attendance record will sync eventually
    } else {
      // Use the calculated status from attendance records (most accurate)
      dispatch({ type: "SET_CLOCK_STATUS", payload: clockStatus })
    }

    // Load payslips (filtered by employee)
    const payslips = filterEmployeePayslips(hrState.payrollRecords || [], employeeId)
    dispatch({ type: "SET_PAYSLIPS", payload: payslips })

    // Load performance reviews (filtered by employee)
    // Note: HRContext stores PerformanceReviewForm[], but we need PerformanceReview[]
    // Convert PerformanceReview to ESSPerformanceReview format
    const rawReviews = filterEmployeePerformanceReviews(
      (hrState.performanceReviews || []) as any as PerformanceReview[],
      employeeId
    )
    
    // Convert PerformanceReview to ESSPerformanceReview
    const performanceReviews: ESSPerformanceReview[] = rawReviews.map((review) => ({
      id: review.id,
      reviewPeriod: review.reviewPeriod,
      reviewDate: review.startDate, // Use startDate as reviewDate
      endDate: review.endDate,
      overallScore: review.overallScore,
      feedback: review.comments, // Map comments to feedback
      comments: review.comments, // Keep comments for backward compatibility
      goals: review.goals?.map((goal) => ({
        title: goal.description,
        description: goal.description,
        dueDate: goal.dueDate,
        completed: goal.status === "completed",
        status: goal.status,
      })),
      strengths: review.strengths,
      areasForImprovement: review.areasForImprovement,
      status: review.status,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      qualificationAssessment: review.qualificationAssessment,
    }))
    
    dispatch({ type: "SET_PERFORMANCE_REVIEWS", payload: performanceReviews })

    // Calculate holiday balance (uses employee data + time offs + attendances for hours worked)
    // Use current employee from state (which may be emulated)
    if (state.currentEmployee) {
      // Pass attendances to calculate actual hours worked for accrual
      const holidayBalance = calculateHolidayBalance(
        state.currentEmployee, 
        hrState.timeOffs || [],
        hrState.attendances || [] // Pass attendances for actual hours worked calculation
      )
      dispatch({ type: "SET_HOLIDAY_BALANCE", payload: holidayBalance })
    } else {
      // If no employee, set default balance
      dispatch({ type: "SET_HOLIDAY_BALANCE", payload: { total: 0, used: 0, pending: 0, remaining: 0, carryOver: 0 } })
    }

    // Load emergency contacts (from employee record)
    loadEmergencyContacts()
  }, [state.employeeId, state.emulatedEmployeeId, state.currentEmployee, hrState, loadEmergencyContacts])

  // ============================================
  // INITIALIZATION EFFECT
  // ============================================

  useEffect(() => {
    const initialize = async () => {
      // Wait for auth to be ready
      if (!authState.isAuthenticated || !authState.userId) {
        dispatch({ type: "SET_LOADING", payload: false })
        return
      }

      // Wait for company data to load
      if (companyState.loading) {
        return
      }

      // Initialize for staff role, or owners with emulated employee
      // Owners can use ESS when they have an emulated employee selected
      if (authState.userRole !== "staff" && authState.userRole !== "owner") {
        dispatch({ type: "SET_LOADING", payload: false })
        return
      }

      // For owners, allow initialization even without employee (they can select one)
      if (authState.userRole === "owner" && !state.emulatedEmployeeId) {
        // Owner can still initialize, but won't have employee data until they select one
        dispatch({ type: "SET_LOADING", payload: false })
        dispatch({ type: "SET_INITIALIZED", payload: true })
        return
      }

      // ESS Optimization: Only wait for essential HR data (employees)
      // Other data (schedules, timeOffs, etc.) loads in background
      // This makes ESS initialization faster
      if (!hrState.initialized || hrState.employees.length === 0) {
        // Wait for employees to load (critical data)
        // This is the minimum needed to find current employee
        return
      }

      dispatch({ type: "SET_LOADING", payload: true })

      try {
        // Load company settings (lightweight)
        await loadCompanySettings()

        // Load employee data (from already-loaded HRContext employees)
        loadEmployeeData()

        // Enable ESS mode in session
        if (authState.currentCompanyId) {
          ESSSessionPersistence.enableESSMode(
            authState.currentCompanyId,
            authState.currentSiteId || undefined
          )
        }

        dispatch({ type: "SET_INITIALIZED", payload: true })
      } catch (error) {
        console.error("[ESS] Initialization error:", error)
        const essError = handleFirebaseError(error)
        logESSError(essError, "initialization")
        dispatch({ type: "SET_ERROR", payload: essError })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }

    initialize()
  }, [
    authState.isAuthenticated,
    authState.userId,
    authState.userRole,
    authState.currentCompanyId,
    authState.currentSiteId,
    companyState.loading,
    hrState.initialized,
    hrState.employees.length,
    loadCompanySettings,
    loadEmployeeData,
  ])

  // ============================================
  // LOAD FILTERED DATA WHEN EMPLOYEE CHANGES
  // ============================================

  useEffect(() => {
    // Reload employee data when emulated employee changes
    if (state.emulatedEmployeeId !== null || state.employeeId) {
      loadEmployeeData()
    }
  }, [state.emulatedEmployeeId, loadEmployeeData])

  useEffect(() => {
    const effectiveEmployeeId = state.emulatedEmployeeId || state.employeeId
    if (effectiveEmployeeId && state.isInitialized) {
      loadFilteredData()
    }
  }, [state.employeeId, state.emulatedEmployeeId, state.isInitialized, hrState.schedules, hrState.timeOffs, hrState.attendances, hrState.payrollRecords, hrState.performanceReviews, loadFilteredData])

  // ============================================
  // SESSION PERSISTENCE
  // ============================================

  useEffect(() => {
    // Save current path on navigation
    const handlePathChange = () => {
      if (authState.isAuthenticated && window.location.pathname.startsWith("/ess/")) {
        ESSSessionPersistence.saveCurrentPath(window.location.pathname)
      }
    }

    handlePathChange()
    window.addEventListener("popstate", handlePathChange)
    return () => window.removeEventListener("popstate", handlePathChange)
  }, [authState.isAuthenticated])

  // Refresh session on activity
  useEffect(() => {
    const handleActivity = () => {
      ESSSessionPersistence.refreshSession()
    }

    window.addEventListener("click", handleActivity)
    window.addEventListener("keypress", handleActivity)

    return () => {
      window.removeEventListener("click", handleActivity)
      window.removeEventListener("keypress", handleActivity)
    }
  }, [])

  // ============================================
  // ACTIONS
  // ============================================

  const refreshData = useCallback(async () => {
    if (!state.employeeId) return

    dispatch({ type: "SET_LOADING", payload: true })

    try {
      loadFilteredData()
    } catch (error) {
      const essError = handleFirebaseError(error)
      logESSError(essError, "refreshData")
      dispatch({ type: "SET_ERROR", payload: essError })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [state.employeeId, loadFilteredData])

  // ============================================
  // CLOCK IN - ✅ PATH FIXED
  // ============================================
  const clockIn = useCallback(async (payload?: ESSClockInPayload): Promise<boolean> => {
    if (!state.employeeId || !authState.currentCompanyId) {
      dispatch({
        type: "SET_ERROR",
        payload: createESSError("CLOCK_FAILED", "Employee or company not found"),
      })
      return false
    }

    if (state.isClockedIn) {
      dispatch({
        type: "SET_ERROR",
        payload: createESSError("CLOCK_FAILED", "You are already clocked in"),
      })
      return false
    }

    // Check if employee is on leave (approved time off for today)
    const today = new Date().toISOString().split("T")[0]
    const todayTimestamp = new Date(today).getTime()
    const isOnLeave = state.approvedTimeOff.some((timeOff) => {
      const startDate = new Date(timeOff.startDate).toISOString().split("T")[0]
      const endDate = new Date(timeOff.endDate).toISOString().split("T")[0]
      return today >= startDate && today <= endDate && timeOff.status === "approved"
    })

    if (isOnLeave) {
      dispatch({
        type: "SET_ERROR",
        payload: createESSError(
          "CLOCK_FAILED",
          "You cannot clock in while on approved leave. Please contact HR if you need to work during your leave period."
        ),
      })
      return false
    }

    dispatch({ type: "SET_LOADING", payload: true })

    try {
      const basePath = getBasePath("hr")
      // ✅ FIXED: Added /hr/ to path
      // Path structure: companies/{companyID}/[sites/{siteID}/[subsites/{subsiteID}/]]data/hr/attendances
      const attendancePath = `${basePath}/data/hr/attendances`
      
      // Log the path for debugging
      console.log('[ESS Clock In] Saving to path:', attendancePath, {
        companyID: companyState.companyID,
        siteID: companyState.selectedSiteID,
        subsiteID: companyState.selectedSubsiteID,
        basePath,
      })
      
      const attendanceRef = ref(db, attendancePath)
      const newAttendanceRef = push(attendanceRef)

      const now = Date.now()
      const today = new Date().toISOString().split("T")[0]
      const clockInTimeISO = new Date().toISOString()

      const attendanceData: any = {
        id: newAttendanceRef.key,
        employeeId: state.employeeId,
        date: now,
        dateString: today,
        clockIn: clockInTimeISO,
        clockOut: null,
        status: "present",
        createdAt: now,
        updatedAt: now,
      }

      // Add location if provided
      let locationString: string | undefined = undefined
      if (payload?.location) {
        attendanceData.location = {
          latitude: payload.location.latitude,
          longitude: payload.location.longitude,
        }
        // Format location as string for schedule
        locationString = JSON.stringify({
          latitude: payload.location.latitude,
          longitude: payload.location.longitude,
          accuracy: payload.location.accuracy,
        })
      }

      // Add notes if provided
      if (payload?.notes) {
        attendanceData.notes = payload.notes
      }

      console.log('[ESS Clock In] Saving attendance record with ID:', newAttendanceRef.key)
      await set(newAttendanceRef, attendanceData)

      // Also update the schedule if there's a matching schedule for today
      try {
        const todaySchedule = hrState.schedules.find(
          (s) =>
            s.employeeId === state.employeeId &&
            s.date === today &&
            s.status !== "draft" &&
            s.status !== "cancelled"
        )

        if (todaySchedule && updateSchedule) {
          await updateSchedule(todaySchedule.id, {
            clockInTime: clockInTimeISO,
            clockInLocation: locationString,
          })
        }
      } catch (scheduleError) {
        // Log but don't fail the clock in if schedule update fails
        console.warn("Failed to update schedule with clock in time:", scheduleError)
      }

      // Update local state immediately
      dispatch({
        type: "SET_CLOCK_STATUS",
        payload: {
          isClockedIn: true,
          clockInTime: now,
          lastClockEvent: {
            type: "in",
            timestamp: now,
            location: payload?.location,
          },
        },
      })

      // Refresh attendance data to ensure it's synced
      // This prevents clock status from disappearing on navigation
      setTimeout(() => {
        loadFilteredData()
      }, 500) // Small delay to allow database write to complete

      return true
    } catch (error) {
      const essError = handleFirebaseError(error)
      logESSError(essError, "clockIn")
      dispatch({ type: "SET_ERROR", payload: essError })
      return false
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [state.employeeId, state.isClockedIn, state.approvedTimeOff, authState.currentCompanyId, getBasePath, hrState.schedules, updateSchedule])

  // ============================================
  // CLOCK OUT - ✅ PATH FIXED
  // ============================================
  const clockOut = useCallback(async (payload?: ESSClockOutPayload): Promise<boolean> => {
    if (!state.employeeId || !authState.currentCompanyId) {
      dispatch({
        type: "SET_ERROR",
        payload: createESSError("CLOCK_FAILED", "Employee or company not found"),
      })
      return false
    }

    if (!state.isClockedIn) {
      dispatch({
        type: "SET_ERROR",
        payload: createESSError("CLOCK_FAILED", "You are not clocked in"),
      })
      return false
    }

    dispatch({ type: "SET_LOADING", payload: true })

    try {
      const basePath = getBasePath("hr")
      // ✅ FIXED: Added /hr/ to path
      // Path structure: companies/{companyID}/[sites/{siteID}/[subsites/{subsiteID}/]]data/hr/attendances
      const attendancePath = `${basePath}/data/hr/attendances`

      // Log the path for debugging
      console.log('[ESS Clock Out] Reading from path:', attendancePath, {
        companyID: companyState.companyID,
        siteID: companyState.selectedSiteID,
        subsiteID: companyState.selectedSubsiteID,
        basePath,
      })

      // Find today's attendance record
      const today = new Date().toISOString().split("T")[0]
      const attendanceRef = ref(db, attendancePath)
      const snapshot = await get(attendanceRef)

      if (!snapshot.exists()) {
        throw new Error("No attendance records found")
      }

      const attendances = snapshot.val()
      let todayAttendanceKey: string | null = null

      // Find today's clock-in record for this employee
      Object.entries(attendances).forEach(([key, value]: [string, any]) => {
        if (
          value.employeeId === state.employeeId &&
          value.clockIn &&
          !value.clockOut &&
          new Date(value.date).toISOString().split("T")[0] === today
        ) {
          todayAttendanceKey = key
        }
      })

      if (!todayAttendanceKey) {
        throw new Error("No active clock-in found for today")
      }

      const now = Date.now()
      const clockOutTimeISO = new Date().toISOString()
      const updateData: any = {
        clockOut: clockOutTimeISO,
        updatedAt: now,
      }

      // Add location if provided
      let locationString: string | undefined = undefined
      if (payload?.location) {
        updateData.clockOutLocation = {
          latitude: payload.location.latitude,
          longitude: payload.location.longitude,
        }
        // Format location as string for schedule
        locationString = JSON.stringify({
          latitude: payload.location.latitude,
          longitude: payload.location.longitude,
          accuracy: payload.location.accuracy,
        })
      }

      // Add notes if provided
      if (payload?.notes) {
        updateData.clockOutNotes = payload.notes
      }

      // Add shift feedback if provided
      if (payload?.shiftFeedback) {
        updateData.shiftFeedback = payload.shiftFeedback
      }

      // ✅ FIXED: Added /hr/ to path
      const updateRef = ref(db, `${attendancePath}/${todayAttendanceKey}`)
      console.log('[ESS Clock Out] Updating attendance record:', `${attendancePath}/${todayAttendanceKey}`)
      await update(updateRef, updateData)

      // Also update the schedule if there's a matching schedule for today
      try {
        const todaySchedule = hrState.schedules.find(
          (s) =>
            s.employeeId === state.employeeId &&
            s.date === today &&
            s.status !== "draft" &&
            s.status !== "cancelled"
        )

        if (todaySchedule && updateSchedule) {
          // Calculate actual hours
          let actualHours = 0
          if (todaySchedule.clockInTime) {
            try {
              const clockIn = parseISO(todaySchedule.clockInTime)
              const clockOut = parseISO(clockOutTimeISO)
              const diffMs = clockOut.getTime() - clockIn.getTime()
              actualHours = diffMs / (1000 * 60 * 60) // Convert to hours
            } catch {
              // If parsing fails, leave actualHours as 0
            }
          }

          await updateSchedule(todaySchedule.id, {
            clockOutTime: clockOutTimeISO,
            clockOutLocation: locationString,
            actualHours,
          })
        }
      } catch (scheduleError) {
        // Log but don't fail the clock out if schedule update fails
        console.warn("Failed to update schedule with clock out time:", scheduleError)
      }

      // Update local state
      dispatch({
        type: "SET_CLOCK_STATUS",
        payload: {
          isClockedIn: false,
          clockInTime: null,
          lastClockEvent: {
            type: "out",
            timestamp: now,
            location: payload?.location,
          },
        },
      })

      return true
    } catch (error) {
      const essError = handleFirebaseError(error)
      logESSError(essError, "clockOut")
      dispatch({ type: "SET_ERROR", payload: essError })
      return false
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [state.employeeId, state.isClockedIn, authState.currentCompanyId, getBasePath, hrState.schedules, updateSchedule])

  // ============================================
  // REQUEST TIME OFF - ✅ PATH FIXED
  // ============================================
  const requestTimeOff = useCallback(async (request: ESSTimeOffRequest): Promise<boolean> => {
    if (!state.employeeId || !authState.currentCompanyId) {
      dispatch({
        type: "SET_ERROR",
        payload: createESSError("VALIDATION_ERROR", "No employee or company data found. Please ensure you are logged in and have selected a company."),
      })
      return false
    }

    dispatch({ type: "SET_LOADING", payload: true })

    try {
      const basePath = getBasePath("hr")
      // ✅ FIXED: Added /hr/ to path
      const timeOffPath = `${basePath}/data/hr/timeOffs`
      const timeOffRef = ref(db, timeOffPath)
      const newTimeOffRef = push(timeOffRef)

      const now = Date.now()

      // Convert date strings to timestamps (matching main app TimeOff interface)
      // TimeOff interface expects: startDate: number, endDate: number
      const startDateTimestamp = new Date(request.startDate).getTime()
      const endDateTimestamp = new Date(request.endDate).getTime()

      const timeOffData = {
        id: newTimeOffRef.key,
        employeeId: state.employeeId,
        type: request.type,
        startDate: startDateTimestamp,
        endDate: endDateTimestamp,
        totalDays: request.totalDays,
        notes: request.notes || "",
        status: "pending",
        requestedAt: now,
        createdAt: now,
        updatedAt: now,
      }

      await set(newTimeOffRef, timeOffData)

      // Refresh data to show new request
      await refreshData()

      return true
    } catch (error) {
      const essError = handleFirebaseError(error)
      logESSError(essError, "requestTimeOff")
      dispatch({ type: "SET_ERROR", payload: essError })
      return false
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [state.employeeId, authState.currentCompanyId, getBasePath, refreshData])

  // ============================================
  // CANCEL TIME OFF REQUEST - ✅ PATH FIXED
  // ============================================
  const cancelTimeOffRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!authState.currentCompanyId) {
      dispatch({
        type: "SET_ERROR",
        payload: createESSError("VALIDATION_ERROR", "Company not found"),
      })
      return false
    }

    dispatch({ type: "SET_LOADING", payload: true })

    try {
      const basePath = getBasePath("hr")
      // ✅ FIXED: Added /hr/ to path
      const timeOffPath = `${basePath}/data/hr/timeOffs/${requestId}`
      const timeOffRef = ref(db, timeOffPath)

      await update(timeOffRef, {
        status: "cancelled",
        cancelledAt: Date.now(),
        updatedAt: Date.now(),
      })

      // Refresh data
      await refreshData()

      return true
    } catch (error) {
      const essError = handleFirebaseError(error)
      logESSError(essError, "cancelTimeOffRequest")
      dispatch({ type: "SET_ERROR", payload: essError })
      return false
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [authState.currentCompanyId, getBasePath, refreshData])

  // ============================================
  // UPDATE EMERGENCY CONTACTS - ✅ PATH FIXED
  // ============================================
  const updateEmergencyContacts = useCallback(async (contacts: ESSEmergencyContact[]): Promise<boolean> => {
    if (!state.employeeId || !authState.currentCompanyId) {
      dispatch({
        type: "SET_ERROR",
        payload: createESSError("VALIDATION_ERROR", "Employee or company not found"),
      })
      return false
    }

    dispatch({ type: "SET_LOADING", payload: true })

    try {
      const basePath = getBasePath("hr")
      // ✅ FIXED: Added /hr/ to path
      const employeePath = `${basePath}/data/hr/employees/${state.employeeId}`
      const employeeRef = ref(db, employeePath)

      // Update employee record with emergency contacts
      await update(employeeRef, {
        emergencyContacts: contacts,
        updatedAt: Date.now(),
      })

      // Update local state
      dispatch({ type: "SET_EMERGENCY_CONTACTS", payload: contacts })

      return true
    } catch (error) {
      const essError = handleFirebaseError(error)
      logESSError(essError, "updateEmergencyContacts")
      dispatch({ type: "SET_ERROR", payload: essError })
      return false
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [state.employeeId, authState.currentCompanyId, getBasePath])

  // ============================================
  // SWITCH COMPANY
  // ============================================
  const switchCompany = useCallback(async (companyId: string): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: true })
    dispatch({ type: "RESET_STATE" })

    // Update session persistence
    ESSSessionPersistence.enableESSMode(companyId)

    // The CompanyContext should handle the actual company switch
    // This will trigger re-initialization through the useEffect
  }, [])

  // ============================================
  // CLEAR ERROR
  // ============================================
  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null })
  }, [])

  // ============================================
  // OWNER EMULATION
  // ============================================
  const setEmulatedEmployee = useCallback((employeeId: string | null) => {
    dispatch({ type: "SET_EMULATED_EMPLOYEE", payload: employeeId })
  }, [])

  const clearEmulatedEmployee = useCallback(() => {
    dispatch({ type: "SET_EMULATED_EMPLOYEE", payload: null })
  }, [])

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const contextValue = useMemo((): ESSContextValue => ({
    state,
    authState,
    deviceInfo,
    refreshData,
    clockIn,
    clockOut,
    requestTimeOff,
    cancelTimeOffRequest,
    updateEmergencyContacts,
    switchCompany,
    clearError,
    setEmulatedEmployee,
    clearEmulatedEmployee,
  }), [
    state,
    authState,
    deviceInfo,
    refreshData,
    clockIn,
    clockOut,
    requestTimeOff,
    cancelTimeOffRequest,
    updateEmergencyContacts,
    switchCompany,
    clearError,
    setEmulatedEmployee,
    clearEmulatedEmployee,
  ])

  return (
    <ESSContext.Provider value={contextValue}>
      {children}
    </ESSContext.Provider>
  )
}

// ============================================
// HOOK
// ============================================

export const useESS = (): ESSContextValue => {
  const context = useContext(ESSContext)
  if (context === undefined) {
    throw new Error("useESS must be used within an ESSProvider")
  }
  return context
}

export default ESSContext