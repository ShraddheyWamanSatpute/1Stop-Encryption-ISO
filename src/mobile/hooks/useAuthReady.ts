/**
 * Auth Ready Hook
 * 
 * Waits for authentication AND user data to be fully loaded
 * before allowing navigation decisions
 */

import { useState, useEffect, useCallback } from "react"
import { useSettings } from "../../backend/context/SettingsContext"
import { useCompany } from "../../backend/context/CompanyContext"
import { useHR } from "../../backend/context/HRContext"

interface AuthReadyState {
  isReady: boolean
  isAuthenticated: boolean
  userId: string | null
  userRole: string | null
  hasEmployeeRecord: boolean
  companies: string[]
  isLoading: boolean
  error: string | null
}

const INITIAL_STATE: AuthReadyState = {
  isReady: false,
  isAuthenticated: false,
  userId: null,
  userRole: null,
  hasEmployeeRecord: false,
  companies: [],
  isLoading: true,
  error: null,
}

// Maximum time to wait for data to load (ms)
const MAX_WAIT_TIME = 10000
// Polling interval (ms)
const POLL_INTERVAL = 100

export const useAuthReady = () => {
  const { state: settingsState } = useSettings()
  const { state: companyState } = useCompany()
  // useHR handles missing provider gracefully, so we can call it safely
  const { state: hrState } = useHR()

  const [authState, setAuthState] = useState<AuthReadyState>(INITIAL_STATE)

  // Check if all required data is loaded
  const checkDataReady = useCallback((): AuthReadyState => {
    const isAuthenticated = settingsState.auth?.isLoggedIn === true
    const userId = settingsState.auth?.uid || null

    // Not authenticated - we're ready (to redirect to login)
    if (!isAuthenticated || !userId) {
      return {
        isReady: true,
        isAuthenticated: false,
        userId: null,
        userRole: null,
        hasEmployeeRecord: false,
        companies: [],
        isLoading: false,
        error: null,
      }
    }

    // Still loading company data
    if (companyState.loading || !companyState.user) {
      return {
        ...INITIAL_STATE,
        isAuthenticated: true,
        userId,
        isLoading: true,
      }
    }

    // Get role directly from companyState.user.role
    // (Your CompanyContext User interface has role as a direct property)
    const userRole = companyState.user.role?.toLowerCase() || null

    // Still loading role
    if (!userRole) {
      return {
        ...INITIAL_STATE,
        isAuthenticated: true,
        userId,
        isLoading: true,
      }
    }

    // Get companies from settingsState.user.companies (array of company objects)
    const userCompanies = settingsState.user?.companies || []
    const companyIds = userCompanies
      .map((c: any) => c.companyID)
      .filter(Boolean) as string[]

    // No companies found
    if (companyIds.length === 0) {
      return {
        isReady: true,
        isAuthenticated: true,
        userId,
        userRole,
        hasEmployeeRecord: false,
        companies: [],
        isLoading: false,
        error: "No company access found",
      }
    }

    // For staff, also check employee record
    if (userRole === "staff") {
      // Still loading HR data
      if (hrState.isLoading || !hrState.employees) {
        return {
          ...INITIAL_STATE,
          isAuthenticated: true,
          userId,
          userRole,
          companies: companyIds,
          isLoading: true,
        }
      }

      // Check for employee record
      const hasEmployeeRecord = hrState.employees?.some(
        (emp: any) =>
          String(emp.userId) === String(userId) ||
          String(emp.id) === String(userId)
      ) || false

      return {
        isReady: true,
        isAuthenticated: true,
        userId,
        userRole,
        hasEmployeeRecord,
        companies: companyIds,
        isLoading: false,
        error: null,
      }
    }

    // Non-staff roles are ready without employee check
    return {
      isReady: true,
      isAuthenticated: true,
      userId,
      userRole,
      hasEmployeeRecord: false, // Not relevant for non-staff
      companies: companyIds,
      isLoading: false,
      error: null,
    }
  }, [settingsState.auth, settingsState.user, companyState, hrState])

  // Poll for data readiness
  useEffect(() => {
    let pollCount = 0
    const maxPolls = MAX_WAIT_TIME / POLL_INTERVAL
    let timeoutId: ReturnType<typeof setTimeout>

    const pollForReady = () => {
      const state = checkDataReady()
      setAuthState(state)

      if (state.isReady) {
        return // Done
      }

      pollCount++
      if (pollCount >= maxPolls) {
        // Timeout - force ready with error
        setAuthState({
          ...state,
          isReady: true,
          isLoading: false,
          error: "Timeout loading user data",
        })
        return
      }

      // Continue polling
      timeoutId = setTimeout(pollForReady, POLL_INTERVAL)
    }

    pollForReady()

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [checkDataReady])

  // Wait for auth ready (returns a promise)
  const waitForReady = useCallback((): Promise<AuthReadyState> => {
    return new Promise((resolve) => {
      const checkReady = () => {
        const state = checkDataReady()
        if (state.isReady) {
          resolve(state)
        } else {
          setTimeout(checkReady, POLL_INTERVAL)
        }
      }
      checkReady()
    })
  }, [checkDataReady])

  return {
    ...authState,
    waitForReady,
  }
}

export default useAuthReady