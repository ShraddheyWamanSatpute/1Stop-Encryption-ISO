/**
 * ESS Route Utilities
 * 
 * Utility functions to handle route paths that work with both /mobile and /ess routes
 */

/**
 * Gets the base path for ESS routes based on current location
 * Returns "/mobile" or "/ess" depending on current route
 */
export const getESSBasePath = (): string => {
  if (typeof window === "undefined") {
    return "/mobile" // Default to /mobile
  }
  
  const pathname = window.location.pathname
  if (pathname.startsWith("/mobile")) {
    return "/mobile"
  }
  // Default to /ess for backward compatibility
  return "/ess"
}

/**
 * Gets the full path for an ESS route
 * @param route - The route path (e.g., "dashboard", "schedule")
 * @returns The full path (e.g., "/mobile/dashboard" or "/ess/dashboard")
 */
export const getESSPath = (route: string): string => {
  const basePath = getESSBasePath()
  const cleanRoute = route.startsWith("/") ? route.slice(1) : route
  return `${basePath}/${cleanRoute}`
}

/**
 * Gets the dashboard path
 */
export const getESSDashboardPath = (): string => {
  return getESSPath("dashboard")
}

/**
 * Gets the company select path
 */
export const getESSCompanySelectPath = (): string => {
  return getESSPath("company-select")
}

