/**
 * ESS Protected Route
 * 
 * Route guard with session restoration
 */

"use client"

import React, { useEffect, useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material"
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
} from "@mui/icons-material"
import { useESS } from "../context/ESSContext"
import { useAuthReady } from "../hooks/useAuthReady"
import { ESSSessionPersistence } from "../utils/essSessionPersistence"
import type { ESSAccessStatus } from "../types"

// ============================================
// TEMPORARY TESTING FLAGS - REMOVE AFTER TESTING
// ============================================
// Set to true to allow all roles to access ESS portal for testing
// Set to false to restore original behavior (staff only)
const TEMP_ALLOW_ALL_ROLES_FOR_TESTING = true

// Set to true to bypass authentication completely (for testing without Firebase)
// Set to false to require authentication
const TEMP_BYPASS_AUTHENTICATION = true
// ============================================

interface ESSProtectedRouteProps {
  children: React.ReactNode
}

const ESSProtectedRoute: React.FC<ESSProtectedRouteProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { state, authState } = useESS()
  const { isReady, isAuthenticated, userRole, hasEmployeeRecord } = useAuthReady()

  const [accessStatus, setAccessStatus] = useState<ESSAccessStatus>("loading")
  const [hasRestoredSession, setHasRestoredSession] = useState(false)

  // ============================================
  // SESSION RESTORATION (on first load only)
  // ============================================

useEffect(() => {
  if (!isReady || hasRestoredSession) return

  // Check if we should restore a session
  const shouldRestore = ESSSessionPersistence.shouldRestoreSession()
  
  // TEMPORARY: Allow all roles for testing
  // ORIGINAL: if (shouldRestore && isAuthenticated && userRole === "staff") {
  if (shouldRestore && isAuthenticated && (TEMP_ALLOW_ALL_ROLES_FOR_TESTING || userRole === "staff")) {
    const session = ESSSessionPersistence.getSession()
    
    if (session?.lastPath && session.lastPath !== location.pathname) {
      // Restore to last path
      navigate(session.lastPath, { replace: true })
    }
  }

  setHasRestoredSession(true)
}, [isReady, isAuthenticated, userRole, hasRestoredSession, location.pathname, navigate])
  // ============================================
  // DETERMINE ACCESS STATUS
  // ============================================

  useEffect(() => {
    if (!isReady) {
      setAccessStatus("loading")
      return
    }

    // TEMPORARY: Bypass authentication for testing
    if (TEMP_BYPASS_AUTHENTICATION) {
      setAccessStatus("authenticated")
      return
    }

    if (!isAuthenticated) {
      setAccessStatus("not-authenticated")
      return
    }

    // TEMPORARY: Allow all roles for testing
    // ORIGINAL: if (userRole !== "staff") {
    if (!TEMP_ALLOW_ALL_ROLES_FOR_TESTING && userRole !== "staff") {
      setAccessStatus("wrong-role")
      return
    }

    if (!hasEmployeeRecord && !state.isLoading) {
      // Wait for ESS context to finish loading before checking employee
      if (state.isInitialized && !state.isEmployeeLinked) {
        setAccessStatus("no-employee")
        return
      }
    }

    if (!authState.currentCompanyId) {
      setAccessStatus("no-company")
      return
    }

    if (state.error) {
      setAccessStatus("error")
      return
    }

    setAccessStatus("authenticated")
  }, [
    isReady,
    isAuthenticated,
    userRole,
    hasEmployeeRecord,
    authState.currentCompanyId,
    state.isLoading,
    state.isInitialized,
    state.isEmployeeLinked,
    state.error,
  ])

  // ============================================
  // BROWSER BACK BUTTON HANDLER
  // ============================================

  useEffect(() => {
    const handlePopState = () => {
      // If user is authenticated and tries to go back to login
      if (authState.isAuthenticated && window.location.pathname === "/login") {
        navigate("/ess/dashboard", { replace: true })
        return
      }

      // If user is on company selector but already has a company selected
      if (
        authState.currentCompanyId &&
        window.location.pathname === "/ess/company-select" &&
        !authState.isMultiCompany
      ) {
        navigate("/ess/dashboard", { replace: true })
        return
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [authState, navigate])

  // ============================================
  // REPLACE HISTORY ON LOAD
  // ============================================

  useEffect(() => {
    if (authState.isAuthenticated && location.pathname.startsWith("/ess/")) {
      window.history.replaceState(null, "", location.pathname)
    }
  }, [authState.isAuthenticated, location.pathname])

  // ============================================
  // RENDER BASED ON ACCESS STATUS
  // ============================================

  // Loading state
  if (accessStatus === "loading" || state.isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: "background.default",
          gap: 2,
        }}
      >
        <CircularProgress size={48} thickness={4} />
        <Typography variant="body1" color="text.secondary">
          Verifying access...
        </Typography>
      </Box>
    )
  }

  // Not authenticated - redirect to login (use current path base for mobile/ess)
  if (accessStatus === "not-authenticated") {
    // Allow login route to be accessible
    if (location.pathname.endsWith("/login")) {
      return <>{children}</>
    }
    
    ESSSessionPersistence.clearSession()
    // Use relative login path based on current route base
    const loginPath = location.pathname.startsWith("/mobile") ? "/mobile/login" : "/ess/login"
    return (
      <Navigate
        to={loginPath}
        state={{ from: location, returnTo: "ess" }}
        replace
      />
    )
  }

  // Wrong role - show access denied
  if (accessStatus === "wrong-role") {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: "background.default",
          p: 3,
        }}
      >
        <Card sx={{ maxWidth: 400, width: "100%", borderRadius: 3 }}>
          <CardContent sx={{ textAlign: "center", p: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "info.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
              }}
            >
              <BusinessIcon sx={{ fontSize: 40, color: "info.dark" }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              Staff Portal Only
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              This portal is designed for staff members only. 
              As a {userRole || "manager"}, please use the main portal to access all features.
            </Typography>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => navigate("/company", { replace: true })}
              sx={{ borderRadius: 2 }}
            >
              Go to Main Portal
            </Button>
          </CardContent>
        </Card>
      </Box>
    )
  }

  // No employee record
  if (accessStatus === "no-employee") {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: "background.default",
          p: 3,
        }}
      >
        <Card sx={{ maxWidth: 400, width: "100%", borderRadius: 3 }}>
          <CardContent sx={{ textAlign: "center", p: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "warning.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
              }}
            >
              <PersonIcon sx={{ fontSize: 40, color: "warning.dark" }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              Profile Not Found
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Your account is not linked to an employee profile. 
              Please contact your manager to set up your profile.
            </Typography>

            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={() => {
                ESSSessionPersistence.clearSession()
                navigate("/login", { replace: true })
              }}
              sx={{ borderRadius: 2 }}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    )
  }

  // No company
  if (accessStatus === "no-company") {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: "background.default",
          p: 3,
        }}
      >
        <Card sx={{ maxWidth: 400, width: "100%", borderRadius: 3 }}>
          <CardContent sx={{ textAlign: "center", p: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "warning.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
              }}
            >
              <WarningIcon sx={{ fontSize: 40, color: "warning.dark" }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              No Company Access
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              You don't have access to any company. 
              Please contact your administrator.
            </Typography>

            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={() => {
                ESSSessionPersistence.clearSession()
                navigate("/login", { replace: true })
              }}
              sx={{ borderRadius: 2 }}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    )
  }

  // Error state
  if (accessStatus === "error" && state.error) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: "background.default",
          p: 3,
        }}
      >
        <Card sx={{ maxWidth: 400, width: "100%", borderRadius: 3 }}>
          <CardContent sx={{ textAlign: "center", p: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "error.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
              }}
            >
              <WarningIcon sx={{ fontSize: 40, color: "error.dark" }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              {state.error.code === "AUTH_REQUIRED" ? "Session Expired" : "Error"}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              {state.error.message}
            </Typography>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => {
                if (state.error?.code === "AUTH_REQUIRED") {
                  ESSSessionPersistence.clearSession()
                  navigate("/login", { replace: true })
                } else {
                  window.location.reload()
                }
              }}
              sx={{ borderRadius: 2 }}
            >
              {state.error.code === "AUTH_REQUIRED" ? "Go to Login" : "Retry"}
            </Button>
          </CardContent>
        </Card>
      </Box>
    )
  }

  // Allow login route to be accessible even when authenticated (will redirect after login)
  if (location.pathname.endsWith("/login")) {
    return <>{children}</>
  }

  // Authenticated - render children
  return <>{children}</>
}

export default ESSProtectedRoute