"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import { getDatabase, ref, query, orderByChild, equalTo, get } from "firebase/database"
import {
  Container,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  Card,
  CardContent,
  Box,
  Stack,
  Alert,
  IconButton,
  InputAdornment,
  Fade,
  useTheme,
} from "@mui/material"
import { Visibility, VisibilityOff, Restaurant, Email, Lock } from "@mui/icons-material"
import { useLogIn } from "../context/LogInContext"

const Login: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [keepSignedIn, setKeepSignedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { dispatch } = useLogIn()
  const navigate = useNavigate()
  const theme = useTheme()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      if (!email || !password) {
        throw new Error("Email and Password are required.")
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error("Please enter a valid email address.")
      }

      const auth = getAuth()
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const authUser = userCredential.user

      if (!authUser) {
        throw new Error("Authentication failed. Please try again.")
      }

      // Check if email is verified
      if (!authUser.emailVerified) {
        throw new Error("Please verify your email address before logging in.")
      }

      const db = getDatabase()
      const usersRef = ref(db, "users")
      const emailQuery = query(usersRef, orderByChild("email"), equalTo(authUser.email))
      const snapshot = await get(emailQuery)

      if (snapshot.exists()) {
        const userEntries = Object.values(snapshot.val()) as {
          uid: string
          email: string
          firstName?: string
        }[]
        const userData = userEntries[0]

        dispatch({
          type: "LOGIN",
          uid: userData.uid,
          email: userData.email,
          firstName: userData.firstName || userData.email.split("@")[0],
        })

        if (keepSignedIn) {
          localStorage.setItem("keepSignedIn", "true")
        }

        navigate("/")
      } else {
        throw new Error("User profile not found. Please contact support.")
      }
    } catch (error: any) {
      console.error("Login error:", error)

      // Handle specific Firebase errors
      let errorMessage = "An error occurred during login."

      if (error.code) {
        switch (error.code) {
          case "auth/invalid-credential":
          case "auth/wrong-password":
          case "auth/user-not-found":
            errorMessage = "Invalid email or password. Please try again."
            break
          case "auth/invalid-email":
            errorMessage = "Please enter a valid email address."
            break
          case "auth/user-disabled":
            errorMessage = "This account has been disabled. Please contact support."
            break
          case "auth/too-many-requests":
            errorMessage = "Too many failed attempts. Please try again later."
            break
          case "auth/network-request-failed":
            errorMessage = "Network error. Please check your connection."
            break
          default:
            errorMessage = error.message || "Login failed. Please try again."
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      setMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword)
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
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    mb: 2,
                    boxShadow: `0 8px 32px ${theme.palette.primary.main}40`,
                  }}
                >
                  <Restaurant sx={{ fontSize: 40, color: "white" }} />
                </Box>
                <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
                  Welcome Back
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Sign in to access PW Tools
                </Typography>
              </Box>

              {/* Error Message */}
              {message && (
                <Fade in>
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                    }}
                  >
                    {message}
                  </Alert>
                </Fade>
              )}

              {/* Login Form */}
              <Box component="form" onSubmit={handleLogin}>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
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

                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleTogglePasswordVisibility} edge="end" disabled={isLoading}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={keepSignedIn}
                        onChange={(e) => setKeepSignedIn(e.target.checked)}
                        disabled={isLoading}
                        color="primary"
                      />
                    }
                    label="Remember me"
                    sx={{ alignSelf: "flex-start" }}
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
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>

                  <Button
                    fullWidth
                    variant="text"
                    onClick={() => navigate("/ResetPassword")}
                    disabled={isLoading}
                    sx={{
                      color: theme.palette.primary.main,
                      "&:hover": {
                        backgroundColor: `${theme.palette.primary.main}10`,
                      },
                    }}
                  >
                    Forgot your password?
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Box>
  )
}

export default Login
