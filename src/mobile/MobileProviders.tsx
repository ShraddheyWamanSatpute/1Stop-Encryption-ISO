/**
 * Mobile Providers
 * 
 * Lightweight provider wrapper for mobile (ESS) routes.
 * Only loads HRProvider which is essential for ESS functionality.
 * 
 * SettingsProvider and CompanyProvider are already loaded in main.tsx
 */

"use client"

import React from "react"
import { HRProvider } from "../backend/context/HRContext"

interface MobileProvidersProps {
  children: React.ReactNode
}

const MobileProviders: React.FC<MobileProvidersProps> = ({ children }) => {
  // Only wrap with HRProvider - Settings and Company are already loaded in main.tsx
  // This keeps mobile loading fast by avoiding heavy contexts
  return <HRProvider>{children}</HRProvider>
}

export default MobileProviders

