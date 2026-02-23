/**
 * ESS Layout
 * 
 * Main layout component for ESS Portal:
 * - Mobile-first design
 * - NO sidebar navigation
 * - Bottom navigation for primary pages
 * - Consistent header with Staff Workplace name on all pages
 * - Safe area handling for iOS
 */

"use client"

import React, { useEffect, useRef } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Box, CircularProgress } from "@mui/material"
import { useESS } from "../context/ESSContext"
import { useESSNavigation } from "../hooks/useESSNavigation"
import { ESSSessionPersistence } from "../utils/essSessionPersistence"
import { usePullToRefresh } from "../hooks/usePullToRefresh"
import ESSHeader from "./ESSHeader.tsx"
import ESSBottomNavigation from "./ESSBottomNavigation.tsx"
import ESSLoadingScreen from "../components/ESSLoadingScreen"

// ============================================
// PAGE CONFIGURATION
// ============================================

// Page titles mapping
const PAGE_TITLES: Record<string, string> = {
  "/ess/dashboard": "Home",
  "/ess/schedule": "My Schedule",
  "/ess/clock": "Clock In/Out",
  "/ess/documents": "My Documents",
  "/ess/profile": "Profile",
  "/ess/time-off": "Time Off",
  "/ess/payslips": "Payslips",
  "/ess/performance": "Performance",
  "/ess/emergency-contacts": "Emergency Contacts",
  "/ess/holidays": "Holiday Balance",
  "/ess/company-select": "Select Company",
}

// ============================================
// COMPONENT
// ============================================

const ESSLayout: React.FC = () => {
  const location = useLocation()
  const { state, authState, refreshData } = useESS()
  const { goBack, currentPath } = useESSNavigation()
  const mainContentRef = useRef<HTMLDivElement>(null)

  // Get page title
  const pageTitle = PAGE_TITLES[location.pathname] || "ESS Portal"

  // Pull to refresh
  const { isRefreshing, pullDistance, pullProgress } = usePullToRefresh({
    onRefresh: refreshData,
    threshold: 80,
    elementRef: mainContentRef,
  })

  // ============================================
  // SCROLL TO TOP ON NAVIGATION
  // ============================================

  useEffect(() => {
    // Scroll to top when navigating to a new page
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [location.pathname])

  // ============================================
  // SESSION PERSISTENCE
  // ============================================

  useEffect(() => {
    // Save current path for session restore
    if (authState.isAuthenticated && location.pathname.startsWith("/ess/")) {
      ESSSessionPersistence.saveCurrentPath(location.pathname)
    }
  }, [authState.isAuthenticated, location.pathname])

  // ============================================
  // HARDWARE BACK BUTTON HANDLER (Android)
  // ============================================

  useEffect(() => {
    const handlePopState = () => {
      // If on dashboard, let browser handle it (exit behavior)
      if (currentPath === "/ess/dashboard") {
        return
      }

      // Use our navigation
      goBack()
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [currentPath, goBack])

  // ============================================
  // LOADING STATE
  // ============================================

  if (state.isLoading && !state.isInitialized) {
    return <ESSLoadingScreen message="Loading your data..." />
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh", // Use dynamic viewport height for mobile
        bgcolor: "background.default",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        // Safe area for iOS notch
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      {/* Header - Consistent across all pages (no back button) */}
      <ESSHeader
        title={pageTitle}
      />

      {/* Main Content Area with Pull to Refresh */}
      <Box
        component="main"
        ref={mainContentRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
          position: "relative",
          // Safe area for iOS home indicator + bottom nav
          paddingBottom: `calc(80px + env(safe-area-inset-bottom))`,
        }}
      >
        {/* Pull to Refresh Indicator */}
        {pullDistance > 0 && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: Math.min(pullDistance, 80),
              transform: `translateY(${Math.min(pullDistance - 80, 0)}px)`,
              transition: isRefreshing ? "none" : "transform 0.2s ease-out",
              zIndex: 1000,
            }}
          >
            {isRefreshing ? (
              <CircularProgress size={24} />
            ) : (
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: `3px solid ${pullProgress >= 1 ? "primary.main" : "grey.300"}`,
                  borderTopColor: "primary.main",
                  transform: `rotate(${pullProgress * 360}deg)`,
                  transition: "transform 0.2s ease-out",
                }}
              />
            )}
          </Box>
        )}
        <Outlet />
      </Box>

      {/* Bottom Navigation - Show on all ESS pages */}
      <ESSBottomNavigation />
    </Box>
  )
}

export default ESSLayout

