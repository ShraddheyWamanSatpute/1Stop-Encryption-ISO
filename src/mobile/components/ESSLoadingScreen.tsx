/**
 * ESS Loading Screen
 * 
 * Full-screen loading indicator with:
 * - Animated spinner
 * - Optional message
 * - Consistent branding
 */

"use client"

import React from "react"
import {
  Box,
  CircularProgress,
  Typography,
} from "@mui/material"

// Define the props interface
interface ESSLoadingScreenProps {
  message?: string
}

const ESSLoadingScreen: React.FC<ESSLoadingScreenProps> = ({
  message = "Loading...",
}) => {

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        // Use array syntax for fallback values (100dvh with 100vh fallback)
        minHeight: ["100vh", "100dvh"],
        bgcolor: "background.default",
        gap: 3,
      }}
    >
      <CircularProgress
        size={56}
        thickness={4}
        sx={{ color: "primary.main" }}
      />
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ textAlign: "center" }}
      >
        {message}
      </Typography>
    </Box>
  )
}

export default ESSLoadingScreen