"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { passwordReset } from "../components/AuthFunctions"
import {
  Container,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Box,
  Stack,
  Alert,
  InputAdornment,
  Fade,
  useTheme,
  IconButton,
} from "@mui/material"
import { Email, ArrowBack, LockReset, CheckCircle } from "@mui/icons-material"

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const theme = useTheme()

  const handlePasswordReset = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setMessage("")
    setError("")
    setIsSuccess(false)

    try {
      if (!email) {
        throw new Error("Email address is required.")
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error("Please enter a valid email address.")
      }

      await passwordReset(email)
      setIsSuccess(true)
      setMessage("Password reset email sent successfully! Please check your inbox and spam folder.")
    } catch (error: any) {
      console.error("Password reset error:", error)

      let errorMessage = "An error occurred while sending the reset email."

      if (error.code) {
        switch (error.code) {
          case "auth/user-not-found":
            errorMessage = "No account found with this email address."
            break
          case "auth/invalid-email":
            errorMessage = "Please enter a valid email address."
            break
          case "auth/too-many-requests":
            errorMessage = "Too many requests. Please try again later."
            break
          case "auth/network-request-failed":
            errorMessage = "Network error. Please check your connection."
            break
          default:
            errorMessage = error.message || "Failed to send reset email. Please try again."
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    navigate("/LogIn")
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
            : "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Fade in timeout={800}>
          <Card
            elevation={24}
            sx={{
              borderRadius: 4,
              overflow: "hidden",
              backdropFilter: "blur(20px)",
              background: theme.palette.mode === "dark" ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.9)",
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* Back Button */}
              <Box mb={2}>
                <IconButton
                  onClick={handleBackToLogin}
                  disabled={isLoading}
                  sx={{
                    color: theme.palette.text.secondary,
                    "&:hover": {
                      backgroundColor: `${theme.palette.primary.main}10`,
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  <ArrowBack />
                </IconButton>
              </Box>

              {/* Header */}
              <Box textAlign="center" mb={4}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: isSuccess
                      ? `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`
                      : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    mb: 2,
                    boxShadow: isSuccess
                      ? `0 8px 32px ${theme.palette.success.main}40`
                      : `0 8px 32px ${theme.palette.primary.main}40`,
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  {isSuccess ? (
                    <CheckCircle sx={{ fontSize: 40, color: "white" }} />
                  ) : (
                    <LockReset sx={{ fontSize: 40, color: "white" }} />
                  )}
                </Box>

                <Typography variant="h4" fontWeight={700} color={isSuccess ? "success.main" : "primary"} gutterBottom>
                  {isSuccess ? "Email Sent!" : "Reset Password"}
                </Typography>

                <Typography variant="body1" color="text.secondary">
                  {isSuccess
                    ? "We've sent password reset instructions to your email"
                    : "Enter your email address and we'll send you a link to reset your password"}
                </Typography>
              </Box>

              {/* Success Message */}
              {isSuccess && message && (
                <Fade in>
                  <Alert
                    severity="success"
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                    }}
                  >
                    {message}
                  </Alert>
                </Fade>
              )}

              {/* Error Message */}
              {error && (
                <Fade in>
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                    }}
                  >
                    {error}
                  </Alert>
                </Fade>
              )}

              {/* Reset Form */}
              {!isSuccess && (
                <Box component="form" onSubmit={handlePasswordReset}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="Enter your email address"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        },
                      }}
                    />

                    <Button
                      fullWidth
                      variant="contained"
                      type="submit"
                      disabled={isLoading}
                      size="large"
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        boxShadow: `0 8px 32px ${theme.palette.primary.main}40`,
                        "&:hover": {
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                          transform: "translateY(-2px)",
                          boxShadow: `0 12px 40px ${theme.palette.primary.main}50`,
                        },
                        "&:disabled": {
                          background: theme.palette.action.disabledBackground,
                        },
                      }}
                    >
                      {isLoading ? "Sending Reset Email..." : "Send Reset Email"}
                    </Button>
                  </Stack>
                </Box>
              )}

              {/* Action Buttons */}
              <Box mt={4}>
                <Stack spacing={2}>
                  {isSuccess && (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleBackToLogin}
                      size="large"
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                        boxShadow: `0 8px 32px ${theme.palette.success.main}40`,
                        "&:hover": {
                          background: `linear-gradient(135deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`,
                          transform: "translateY(-2px)",
                          boxShadow: `0 12px 40px ${theme.palette.success.main}50`,
                        },
                      }}
                    >
                      Back to Login
                    </Button>
                  )}

                  {!isSuccess && (
                    <Button
                      fullWidth
                      variant="text"
                      onClick={handleBackToLogin}
                      disabled={isLoading}
                      sx={{
                        color: theme.palette.text.secondary,
                        "&:hover": {
                          backgroundColor: `${theme.palette.primary.main}10`,
                          color: theme.palette.primary.main,
                        },
                      }}
                    >
                      Back to Login
                    </Button>
                  )}

                  {isSuccess && (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Didn't receive the email? Check your spam folder or{" "}
                      <Button
                        variant="text"
                        onClick={() => {
                          setIsSuccess(false)
                          setMessage("")
                          setError("")
                        }}
                        sx={{
                          p: 0,
                          minWidth: "auto",
                          textTransform: "none",
                          color: theme.palette.primary.main,
                          "&:hover": {
                            backgroundColor: "transparent",
                            textDecoration: "underline",
                          },
                        }}
                      >
                        try again
                      </Button>
                    </Typography>
                  )}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Box>
  )
}

export default ResetPassword
