/**
 * ESS Header
 * 
 * Consistent header across all ESS pages:
 * - 1Stop logo and text on left
 * - Company name centered (with dropdown for multi-company)
 * - Profile avatar on right with clock status indicator
 */

"use client"

import React, { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  useTheme,
  Chip,
} from "@mui/material"
import {
  Person as PersonIcon,
  People as PeopleIcon,
} from "@mui/icons-material"
import { useESS } from "../context/ESSContext"
import { useCompany } from "../../backend/context/CompanyContext"
import { useSettings } from "../../backend/context/SettingsContext"
import ESSLocationSelector from "../components/ESSLocationSelector"
import ESSEmployeeSelector from "../components/ESSEmployeeSelector"

// ============================================
// PROPS INTERFACE
// ============================================

interface ESSHeaderProps {
  title: string
  actionButton?: React.ReactNode
}

// ============================================
// COMPONENT
// ============================================

const ESSHeader: React.FC<ESSHeaderProps> = ({
  title: _title, // Title is passed but not displayed (company name is shown instead)
  actionButton,
}) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { state: essState } = useESS()
  const { state: companyState } = useCompany()
  const { state: settingsState } = useSettings()
  const [locationSelectorOpen, setLocationSelectorOpen] = useState(false)
  const [employeeSelectorOpen, setEmployeeSelectorOpen] = useState(false)

  // Check if user is owner
  const isOwner = useMemo(() => {
    const currentCompanyId = companyState.companyID || settingsState.user?.currentCompanyID
    return settingsState?.user?.companies?.find(
      (c: any) => c.companyID === currentCompanyId
    )?.role === 'owner' || companyState.user?.role?.toLowerCase() === 'owner'
  }, [settingsState?.user?.companies, companyState.companyID, companyState.user?.role])

  // ============================================
  // HANDLERS
  // ============================================

  const handleProfileClick = () => {
    const currentPath = window.location.pathname
    if (currentPath.startsWith("/mobile/")) {
      navigate("/mobile/profile")
    } else {
      navigate("/ess/profile")
    }
  }

  // Get current location display (subsite > site > company)
  const getCurrentLocation = (): string => {
    if (companyState.selectedSubsiteName) {
      return companyState.selectedSubsiteName
    }
    if (companyState.selectedSiteName) {
      return companyState.selectedSiteName
    }
    if (companyState.company?.companyName) {
      return companyState.company.companyName
    }
    return "Select Location"
  }

  const handleLocationClick = () => {
    setLocationSelectorOpen(true)
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          zIndex: (theme) => theme.zIndex.appBar,
          flexShrink: 0,
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 64, sm: 72 },
          px: { xs: 1.5, sm: 2 },
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          position: "relative",
          }}
        >
        {/* Left Section: Logo only (no text) - Clickable to go to home */}
        <Box 
          onClick={() => navigate("/ess/dashboard")}
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            minWidth: 0, 
            flexShrink: 0,
            flex: "0 0 auto",
            maxWidth: { xs: "35%", sm: "40%" },
            cursor: "pointer",
            "&:active": {
              opacity: 0.8,
            },
          }}
        >
          {/* Logo only - no text */}
          <Box
            component="img"
            src="/logo.png"
            alt="1Stop"
            sx={{
              height: { xs: 40, sm: 48 },
              width: "auto",
              objectFit: "contain",
              display: "block",
              flexShrink: 0,
            }}
            onError={(e) => {
              // Fallback if logo doesn't load
              e.currentTarget.style.display = "none"
            }}
          />
        </Box>

        {/* Center: Current Location (Subsite/Site/Company) - Clickable */}
          <Box
            onClick={handleLocationClick}
            sx={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
            justifyContent: "center",
            maxWidth: { xs: "45%", sm: "50%" },
            pointerEvents: "auto",
            cursor: "pointer",
            px: 1,
            py: 0.5,
            borderRadius: 1,
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.1)",
            },
            "&:active": {
              bgcolor: "rgba(255, 255, 255, 0.2)",
            },
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontWeight: 500,
                color: "white",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: { xs: 180, sm: 250 },
                fontSize: { xs: "1.125rem", sm: "1.25rem" },
                textAlign: "center",
              }}
            >
              {getCurrentLocation()}
            </Typography>
        </Box>

        {/* Right Section: Action Button (if provided), Employee Selector (for owners), and Profile Avatar */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 1,
            flexShrink: 0,
            minWidth: 0,
            flex: "0 0 auto",
            maxWidth: { xs: "20%", sm: "25%" },
          }}
        >
          {actionButton}
          {/* Employee Selector for Owners */}
          {isOwner && (
            <IconButton
              onClick={() => setEmployeeSelectorOpen(true)}
              sx={{
                p: 0.5,
                flexShrink: 0,
                "&:active": {
                  transform: "scale(0.95)",
                },
              }}
              aria-label="Select employee to view as"
            >
              <Chip
                icon={<PeopleIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                label={essState.emulatedEmployeeId ? "Viewing As" : "Select"}
                size="small"
                sx={{
                  bgcolor: essState.emulatedEmployeeId ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)",
                  color: "white",
                  fontSize: { xs: "0.7rem", sm: "0.75rem" },
                  height: { xs: 24, sm: 28 },
                  "& .MuiChip-icon": {
                    color: "white",
                  },
                }}
              />
            </IconButton>
          )}
            <IconButton
              onClick={handleProfileClick}
              sx={{
                p: 0.5,
              flexShrink: 0,
                "&:active": {
                  transform: "scale(0.95)",
                },
              }}
            aria-label="Go to profile"
            >
              <Avatar
                src={essState.currentEmployee?.profilePicture || undefined}
                sx={{
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                bgcolor: essState.currentEmployee?.profilePicture ? "transparent" : "white",
                  // Clock status indicator ring
                  border: essState.isClockedIn
                    ? `2px solid ${theme.palette.success.main}`
                    : `2px solid transparent`,
                }}
              >
                {essState.currentEmployee?.profilePicture ? null : (
                  <Typography
                    sx={{
                      fontSize: { xs: 16, sm: 18 },
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                    }}
                  >
                    {essState.currentEmployee?.firstName?.[0] || ""}{essState.currentEmployee?.lastName?.[0] || ""}
                  </Typography>
                )}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <ESSLocationSelector 
        open={locationSelectorOpen} 
        onClose={() => setLocationSelectorOpen(false)} 
      />
      {isOwner && (
        <ESSEmployeeSelector
          open={employeeSelectorOpen}
          onClose={() => setEmployeeSelectorOpen(false)}
        />
      )}
    </>
  )
}

export default ESSHeader