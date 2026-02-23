"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useSettings } from "../context/SettingsContext"

interface ProtectedRouteProps {
  element: React.ReactElement
  allowedRoles?: ("admin" | "musician" | "customer")[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, allowedRoles }) => {
  const { state } = useSettings()
  const location = useLocation()
  const [redirectPath, setRedirectPath] = useState<string | null>(null)

  const currentPath = location.pathname || ""
  const currentUser = state.user
  const userRole = currentUser?.companies?.[0]?.role || "user"

  useEffect(() => {
    // Wait for auth state to resolve before deciding
    if (state.loading) {
      setRedirectPath(null)
      return
    }

    if (!state.auth.isLoggedIn) {
      setRedirectPath("/login")
      return
    }

    if (allowedRoles && !allowedRoles.includes(userRole as "admin" | "musician" | "customer")) {
      setRedirectPath("/login")
      return
    }

    if (currentPath === "/") {
      // Redirect to company dashboard by default
      setRedirectPath("/company")
    } else {
      setRedirectPath(null)
    }
  }, [state.loading, state.auth.isLoggedIn, userRole, allowedRoles, currentPath])

  // While loading auth state, render nothing (or a small placeholder)
  if (state.loading) {
    return null
  }

  // Render the redirect or the protected element
  if (redirectPath) {
    return <Navigate to={redirectPath} state={{ from: currentPath }} replace />
  }

  return element
}

export default ProtectedRoute
