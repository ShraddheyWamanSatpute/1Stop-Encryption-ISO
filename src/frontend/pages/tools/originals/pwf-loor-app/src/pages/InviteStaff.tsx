"use client"

import React, { useState } from "react"
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Stack,
  IconButton,
  Snackbar,
  Alert,
  useTheme,
} from "@mui/material"
import { ContentCopy, Share, Person } from "@mui/icons-material"
import * as QRCode from "qrcode"

const InviteStaff: React.FC = () => {
  const theme = useTheme()
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")

  // Registration link - you can modify this to match your actual registration URL
  const registrationLink = `${window.location.origin}/456321789`

  React.useEffect(() => {
    generateQRCode()
  }, [])

  const generateQRCode = async () => {
    try {
      const qrDataUrl = await QRCode.toDataURL(registrationLink, {
        width: 200,
        margin: 2,
        color: {
          dark: theme.palette.text.primary,
          light: theme.palette.background.paper,
        },
      })
      setQrCodeUrl(qrDataUrl)
    } catch (error) {
      console.error("Error generating QR code:", error)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(registrationLink)
      setSnackbarMessage("Registration link copied to clipboard!")
      setSnackbarOpen(true)
    } catch (error) {
      console.error("Failed to copy:", error)
      setSnackbarMessage("Failed to copy link")
      setSnackbarOpen(true)
    }
  }

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join PW Tools",
          text: "Register for PW Tools staff access",
          url: registrationLink,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      copyToClipboard()
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Person sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 1 }} />
          <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
            Invite Staff Members
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Share the registration link or QR code with new staff members
          </Typography>
        </Box>

        {/* Registration Link Card */}
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Registration Link
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Share this link with new staff members to create their accounts
            </Typography>

            <Stack spacing={2}>
              <TextField
                fullWidth
                value={registrationLink}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton onClick={copyToClipboard} edge="end">
                      <ContentCopy />
                    </IconButton>
                  ),
                }}
                variant="outlined"
              />

              <Stack direction="row" spacing={2}>
                <Button variant="contained" startIcon={<ContentCopy />} onClick={copyToClipboard} fullWidth>
                  Copy Link
                </Button>
                <Button variant="outlined" startIcon={<Share />} onClick={shareLink} fullWidth>
                  Share Link
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* QR Code Card */}
        <Card elevation={2}>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              QR Code
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Staff can scan this QR code to access the registration page
            </Typography>

            {qrCodeUrl && (
              <Box sx={{ display: "inline-block", p: 2, bgcolor: "background.default", borderRadius: 2 }}>
                <img src={qrCodeUrl || "/placeholder.svg"} alt="Registration QR Code" style={{ display: "block" }} />
              </Box>
            )}

            <Typography variant="caption" display="block" mt={2} color="text.secondary">
              Point your camera at the QR code to scan
            </Typography>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Paper sx={{ p: 3, bgcolor: theme.palette.primary.main + "08" }}>
          <Typography variant="h6" fontWeight={600} gutterBottom color="primary">
            Instructions for New Staff
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2">1. Click the registration link or scan the QR code</Typography>
            <Typography variant="body2">2. Fill out the registration form with their details</Typography>
            <Typography variant="body2">3. Wait for manager approval to activate their account</Typography>
            <Typography variant="body2">4. Once approved, they can log in and access the system</Typography>
          </Stack>
        </Paper>
      </Stack>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default InviteStaff
