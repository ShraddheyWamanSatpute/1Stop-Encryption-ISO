/**
 * ESS Error Screen
 * 
 * Displays user-friendly error messages with:
 * - Error-specific icons
 * - Clear action buttons
 * - Consistent styling
 */

"use client"

import React from "react"
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  useTheme,
} from "@mui/material"
import {
  Error as ErrorIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  WifiOff as NetworkIcon,
  LocationOff as LocationIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material"
import type { ESSError, ESSErrorCode } from "../types"
import { getErrorDisplayInfo } from "../utils/essErrorHandler"

interface ESSErrorScreenProps {
  error: ESSError
  onRetry?: () => void
  onDismiss?: () => void
}

const ERROR_ICONS: Record<ESSErrorCode, React.ReactElement> = {
  AUTH_REQUIRED: <LockIcon sx={{ fontSize: 48 }} />,
  WRONG_ROLE: <PersonIcon sx={{ fontSize: 48 }} />,
  NO_EMPLOYEE: <PersonIcon sx={{ fontSize: 48 }} />,
  NO_COMPANY: <PersonIcon sx={{ fontSize: 48 }} />,
  LOCATION_DENIED: <LocationIcon sx={{ fontSize: 48 }} />,
  LOCATION_TIMEOUT: <LocationIcon sx={{ fontSize: 48 }} />,
  LOCATION_UNAVAILABLE: <LocationIcon sx={{ fontSize: 48 }} />,
  CLOCK_FAILED: <ErrorIcon sx={{ fontSize: 48 }} />,
  NETWORK_ERROR: <NetworkIcon sx={{ fontSize: 48 }} />,
  DATABASE_ERROR: <ErrorIcon sx={{ fontSize: 48 }} />,
  VALIDATION_ERROR: <ErrorIcon sx={{ fontSize: 48 }} />,
  UNKNOWN_ERROR: <ErrorIcon sx={{ fontSize: 48 }} />,
}

const ERROR_COLORS: Record<ESSErrorCode, string> = {
  AUTH_REQUIRED: "warning.light",
  WRONG_ROLE: "info.light",
  NO_EMPLOYEE: "warning.light",
  NO_COMPANY: "warning.light",
  LOCATION_DENIED: "error.light",
  LOCATION_TIMEOUT: "warning.light",
  LOCATION_UNAVAILABLE: "warning.light",
  CLOCK_FAILED: "error.light",
  NETWORK_ERROR: "error.light",
  DATABASE_ERROR: "error.light",
  VALIDATION_ERROR: "warning.light",
  UNKNOWN_ERROR: "error.light",
}

const ESSErrorScreen: React.FC<ESSErrorScreenProps> = ({
  error,
  onRetry,
  onDismiss,
}) => {
  const theme = useTheme()
  const displayInfo = getErrorDisplayInfo(error)

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        bgcolor: "background.default",
        p: 3,
      }}
    >
      <Card sx={{ maxWidth: 400, width: "100%", borderRadius: 3 }}>
        <CardContent sx={{ textAlign: "center", p: 4 }}>
          {/* Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: ERROR_COLORS[error.code] || "error.light",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
              color: theme.palette.mode === "dark" ? "white" : "inherit",
            }}
          >
            {ERROR_ICONS[error.code] || <ErrorIcon sx={{ fontSize: 48 }} />}
          </Box>

          {/* Title */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            {displayInfo.title}
          </Typography>

          {/* Message */}
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            {displayInfo.message}
          </Typography>

          {/* Details (if any) */}
          {displayInfo.details && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3, fontStyle: "italic" }}
            >
              {displayInfo.details}
            </Typography>
          )}

          {/* Actions */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 3 }}>
            {error.recoverable && onRetry && (
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<RefreshIcon />}
                onClick={onRetry}
                sx={{ borderRadius: 2 }}
              >
                {displayInfo.action || "Try Again"}
              </Button>
            )}

            {onDismiss && (
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={onDismiss}
                sx={{ borderRadius: 2 }}
              >
                Dismiss
              </Button>
            )}

            {error.code === "AUTH_REQUIRED" && (
              <Button
                variant="contained"
                size="large"
                fullWidth
                href="/login"
                sx={{ borderRadius: 2 }}
              >
                Go to Login
              </Button>
            )}

            {error.code === "WRONG_ROLE" && (
              <Button
                variant="contained"
                size="large"
                fullWidth
                href="/company"
                sx={{ borderRadius: 2 }}
              >
                Go to Main Portal
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default ESSErrorScreen

