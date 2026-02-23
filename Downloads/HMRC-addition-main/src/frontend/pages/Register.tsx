"use client"

import type React from "react"
import { useState } from "react"
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from "@mui/material"
import { Visibility, VisibilityOff, Person, Email, Lock } from "@mui/icons-material"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import { useSettings } from "../../backend/context/SettingsContext"
import { ConsentService } from "../../backend/services/gdpr/ConsentService"
import { PrivacyPolicyService } from "../../backend/services/gdpr/PrivacyPolicy"
import { useCompany } from "../../backend/context/CompanyContext"

const Register: React.FC = () => {
  const navigate = useNavigate()
  const { register, updatePersonal, state: settingsState } = useSettings()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const consentService = new ConsentService()
  const privacyPolicyService = new PrivacyPolicyService()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validation
    if (!formData.firstName.trim()) {
      setError("First name is required")
      return
    }
    if (!formData.lastName.trim()) {
      setError("Last name is required")
      return
    }
    if (!formData.email.trim()) {
      setError("Email is required")
      return
    }
    if (!formData.password) {
      setError("Password is required")
      return
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (!privacyPolicyAccepted) {
      setError("You must accept the Privacy Policy to create an account")
      return
    }

    setLoading(true)

    try {
      // Register only accepts email and password parameters
      await register(
        formData.email.trim(),
        formData.password
      )
      
      // Update user profile with name information after successful registration
      try {
        await updatePersonal({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
        })
        
        // Record privacy policy consent after registration
        // Wait a moment for auth state to update
        setTimeout(async () => {
          const userId = settingsState.auth?.uid
          if (userId) {
            try {
              const policyVersion = privacyPolicyService.getPrivacyPolicy({
                companyName: 'Company',
                companyAddress: '',
                dpoName: 'Data Protection Officer',
                dpoEmail: 'dpo@company.com',
              }).version
              
              // Get user's IP address and user agent for audit trail
              const ipAddress = 'client-ip' // Would need to get from request in production
              const userAgent = navigator.userAgent
              
              await consentService.recordConsent(
                userId,
                '', // No company ID yet at registration
                'employee_records',
                {
                  lawfulBasis: 'consent',
                  policyVersion,
                  method: 'explicit',
                  ipAddress,
                  userAgent,
                }
              )
            } catch (consentError) {
              console.warn("Registration successful but consent recording failed:", consentError)
              // Continue with success message as registration was successful
            }
          }
        }, 500)
      } catch (profileError) {
        console.warn("Registration successful but profile update failed:", profileError)
        // Continue with success message as registration was successful
      }

      setSuccess("Account created successfully! Please check your email to verify your account before logging in.")

      // Clear form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      })

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/Login")
      }, 3000)
    } catch (err: any) {
      // Error handled by UI state
      setError(err.message || "Failed to create account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Create Account
          </Typography>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Join us to get started with your business management
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ width: "100%", mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: "100%" }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="firstName"
              label="First Name"
              name="firstName"
              autoComplete="given-name"
              autoFocus
              value={formData.firstName}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              autoComplete="family-name"
              value={formData.lastName}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={privacyPolicyAccepted}
                  onChange={(e) => setPrivacyPolicyAccepted(e.target.checked)}
                  required
                />
              }
              label={
                <Typography variant="body2">
                  I accept the{" "}
                  <Link component={RouterLink} to="/PrivacyPolicy" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </Link>
                  {" "}and consent to the processing of my personal data in accordance with UK GDPR
                </Typography>
              }
              sx={{ mt: 2, mb: 1 }}
            />

            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : "Create Account"}
            </Button>

            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Link component={RouterLink} to="/Login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default Register
