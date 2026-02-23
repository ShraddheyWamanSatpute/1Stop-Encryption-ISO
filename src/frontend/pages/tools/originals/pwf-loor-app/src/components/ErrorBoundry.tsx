"use client"

import type React from "react"
import { Box, Typography, Button, Alert, Stack } from "@mui/material"
import { ErrorOutline, Refresh } from "@mui/icons-material"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "We encountered an error while loading this content.",
  onRetry,
}) => {
  return (
    <Box py={4}>
      <Alert
        severity="error"
        icon={<ErrorOutline />}
        sx={{
          borderRadius: 2,
          "& .MuiAlert-message": {
            width: "100%",
          },
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          <Typography variant="body2">{message}</Typography>
          {onRetry && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={onRetry}
              sx={{ alignSelf: "flex-start" }}
            >
              Try Again
            </Button>
          )}
        </Stack>
      </Alert>
    </Box>
  )
}

export default ErrorState
