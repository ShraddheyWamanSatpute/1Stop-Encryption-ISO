import type React from "react"
import { Box, CircularProgress, Typography, Fade } from "@mui/material"

interface LoadingSpinnerProps {
  message?: string
  size?: number
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "Loading...", size = 40 }) => {
  return (
    <Fade in timeout={300}>
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={4} gap={2}>
        <CircularProgress size={size} thickness={4} />
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Box>
    </Fade>
  )
}

export default LoadingSpinner
