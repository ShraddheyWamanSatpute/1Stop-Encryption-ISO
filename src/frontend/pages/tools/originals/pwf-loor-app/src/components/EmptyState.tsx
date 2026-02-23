"use client"

import type React from "react"
import { Box, Typography, Button, Stack } from "@mui/material"
import { Inbox } from "@mui/icons-material"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon = <Inbox />, title, description, action }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={6}
      px={3}
      textAlign="center"
    >
      <Box
        sx={{
          color: "text.secondary",
          fontSize: "4rem",
          mb: 2,
          opacity: 0.5,
        }}
      >
        {icon}
      </Box>

      <Stack spacing={2} alignItems="center" maxWidth={400}>
        <Typography variant="h6" color="text.primary" fontWeight={600}>
          {title}
        </Typography>

        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}

        {action && (
          <Button variant="contained" onClick={action.onClick} sx={{ mt: 2 }}>
            {action.label}
          </Button>
        )}
      </Stack>
    </Box>
  )
}

export default EmptyState
