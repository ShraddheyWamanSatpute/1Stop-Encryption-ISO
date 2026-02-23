/**
 * Device Router Component
 * 
 * Routes users based on device type:
 * - Mobile phones -> /Mobile
 * - PC/Tablets -> / (root)
 */

"use client"

import React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { getDeviceRoute } from "../utils/deviceDetection"

const DeviceRouter: React.FC = () => {
  const location = useLocation()
  
  // If already on /Mobile, /ESS, or legacy routes, don't redirect
  if (location.pathname.startsWith("/Mobile") || 
      location.pathname.startsWith("/ESS") ||
      location.pathname.startsWith("/mobile") || 
      location.pathname.startsWith("/ess") || 
      location.pathname.startsWith("/app")) {
    return null
  }
  
  // Redirect based on device type
  const route = getDeviceRoute()
  return <Navigate to={route} replace />
}

export default DeviceRouter

