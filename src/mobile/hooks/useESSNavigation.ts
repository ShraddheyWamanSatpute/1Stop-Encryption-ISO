/**
 * ESS Navigation Hook
 * 
 * Handles navigation with proper history management:
 * - Prevents broken back button flows
 * - Manages navigation stack
 * - Provides safe navigation methods
 */

import { useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"

// Define navigation hierarchy
const NAVIGATION_HIERARCHY: Record<string, string> = {
  // Secondary pages → their parent
  "/ess/time-off": "/ess/profile",
  "/ess/payslips": "/ess/profile",
  "/ess/performance": "/ess/profile",
  "/ess/emergency-contacts": "/ess/profile",
  "/ess/holidays": "/ess/profile",
  // Primary pages → dashboard
  "/ess/schedule": "/ess/dashboard",
  "/ess/clock": "/ess/dashboard",
  "/ess/documents": "/ess/dashboard",
  "/ess/profile": "/ess/dashboard",
  // Company selector → dashboard (after selection)
  "/ess/company-select": "/ess/dashboard",
}

// Pages that should replace history (not add to stack)
const REPLACE_PAGES = [
  "/ess/dashboard",
  "/ess/company-select",
]

export const useESSNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()

  /**
   * Navigate to a page with proper history handling
   */
  const navigateTo = useCallback((
    path: string,
    options?: { replace?: boolean }
  ) => {
    const shouldReplace = options?.replace || REPLACE_PAGES.includes(path)
    navigate(path, { replace: shouldReplace })
  }, [navigate])

  /**
   * Go back with fallback to parent page
   */
  const goBack = useCallback(() => {
    const currentPath = location.pathname
    const parentPath = NAVIGATION_HIERARCHY[currentPath]

    if (parentPath) {
      // Navigate to defined parent
      navigate(parentPath, { replace: true })
    } else if (window.history.length > 1) {
      // Try browser back
      navigate(-1)
    } else {
      // Fallback to dashboard
      navigate("/ess/dashboard", { replace: true })
    }
  }, [location.pathname, navigate])

  /**
   * Navigate after action completion (e.g., after clock in)
   * Replaces current entry to prevent back to action page
   */
  const navigateAfterAction = useCallback((path: string) => {
    navigate(path, { replace: true })
  }, [navigate])

  /**
   * Reset navigation to dashboard
   * Clears forward history
   */
  const resetToHome = useCallback(() => {
    navigate("/ess/dashboard", { replace: true })
    // Clear forward history
    window.history.pushState(null, "", "/ess/dashboard")
  }, [navigate])

  return {
    navigateTo,
    goBack,
    navigateAfterAction,
    resetToHome,
    currentPath: location.pathname,
  }
}

export default useESSNavigation

