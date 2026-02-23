/**
 * ESS App Router
 * 
 * Main router component for Employee Self Service portal
 * Sets up all ESS routes with protected route wrapper
 */

"use client"

import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { ESSProvider } from "./context/ESSContext"
import { ESSProtectedRoute } from "./routes"
import ESSLayout from "./layouts/ESSLayout"

// Pages
import ESSDashboard from "./pages/ESSDashboard"
import ESSSchedule from "./pages/ESSSchedule"
import ESSClock from "./pages/ESSClock"
import ESSDocuments from "./pages/ESSDocuments"
import ESSProfile from "./pages/ESSProfile"
import ESSTimeOff from "./pages/ESSTimeOff"
import ESSPayslips from "./pages/ESSPayslips"
import ESSPerformance from "./pages/ESSPerformance"
import ESSEmergencyContacts from "./pages/ESSEmergencyContacts"
import ESSHolidays from "./pages/ESSHolidays"
import ESSCompanySelector from "./pages/ESSCompanySelector"
import Login from "../frontend/pages/Login"

const ESSApp: React.FC = () => {
  return (
    <ESSProvider>
      <ESSProtectedRoute>
        <Routes>
          {/* Public login route - handled by ESSProtectedRoute redirect if not authenticated */}
          <Route path="/login" element={<Login />} />
          
          {/* Company Selector - Must be first */}
          <Route path="/company-select" element={<ESSCompanySelector />} />
          
          {/* Main ESS Routes with Layout */}
          <Route element={<ESSLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ESSDashboard />} />
            <Route path="schedule" element={<ESSSchedule />} />
            <Route path="clock" element={<ESSClock />} />
            <Route path="documents" element={<ESSDocuments />} />
            <Route path="profile" element={<ESSProfile />} />
            <Route path="time-off" element={<ESSTimeOff />} />
            <Route path="payslips" element={<ESSPayslips />} />
            <Route path="performance" element={<ESSPerformance />} />
            <Route path="emergency-contacts" element={<ESSEmergencyContacts />} />
            <Route path="holidays" element={<ESSHolidays />} />
          </Route>
          
          {/* Catch all - redirect to dashboard (relative path) */}
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </ESSProtectedRoute>
    </ESSProvider>
  )
}

export default ESSApp

