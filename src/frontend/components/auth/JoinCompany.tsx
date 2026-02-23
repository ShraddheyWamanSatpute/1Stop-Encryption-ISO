"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Avatar,
  Divider
} from "@mui/material"
import {
  Business as BusinessIcon
} from "@mui/icons-material"
import { useSettings } from "../../../backend/context/SettingsContext"
import { useCompany } from "../../../backend/context/CompanyContext"
import { themeConfig } from "../../../theme/AppTheme"

const JoinCompany: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { state: settingsState, login, register } = useSettings()
  const { acceptSiteInvite, getSiteInviteByCode } = useCompany()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteData, setInviteData] = useState<any>(null)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: ""
  })

  const inviteCode = searchParams.get("code")

  useEffect(() => {
    const loadInviteData = async () => {
      if (!inviteCode) {
        setError("Invalid invite link - missing code")
        setLoading(false)
        return
      }

      try {
        const invite = await getSiteInviteByCode(inviteCode)
        if (!invite) {
          setError("Invalid or expired invite link")
          setLoading(false)
          return
        }

        // Check if invite is expired
        if (invite.expiresAt && Date.now() > invite.expiresAt) {
          setError("This invite link has expired")
          setLoading(false)
          return
        }

        setInviteData(invite)
        setLoading(false)
      } catch (error) {
        console.error("Error loading invite:", error)
        setError("Failed to load invite information")
        setLoading(false)
      }
    }

    loadInviteData()
  }, [inviteCode, getSiteInviteByCode])

  const handleSignIn = async () => {
    if (!formData.email || !formData.password) {
      setError("Please enter email and password")
      return
    }

    try {
      setLoading(true)
      await login(formData.email, formData.password)
      
      if (inviteData) {
        // Accept the invite
        const acceptResult = await acceptSiteInvite(inviteData.code, settingsState.auth.uid!)
        if (acceptResult.success) {
          navigate("/Company")
        } else {
          setError(acceptResult.message || "Failed to accept invite")
        }
      } else {
        navigate("/Company")
      }
    } catch (error) {
      setError("Sign in failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError("Please fill in all fields")
      return
    }

    try {
      setLoading(true)
      await register(formData.email, formData.password)
      
      if (inviteData) {
        // Accept the invite
        const acceptResult = await acceptSiteInvite(inviteData.code, settingsState.auth.uid!)
        if (acceptResult.success) {
          navigate("/Company")
        } else {
          setError(acceptResult.message || "Failed to accept invite")
        }
      } else {
        navigate("/Company")
      }
    } catch (error) {
      setError("Sign up failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh",
        bgcolor: themeConfig.colors.background.default 
      }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error && !inviteData) {
    return (
      <Box sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh",
        bgcolor: themeConfig.colors.background.default,
        p: 3
      }}>
        <Card sx={{ maxWidth: 400, width: "100%" }}>
          <CardContent sx={{ textAlign: "center", p: 4 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button 
              variant="contained" 
              onClick={() => navigate("/Login")}
              fullWidth
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    )
  }

  // If user is already signed in, just accept the invite
  if (settingsState.auth.uid && inviteData) {
    const acceptInviteDirectly = async () => {
      try {
        setLoading(true)
        const result = await acceptSiteInvite(inviteData.code, settingsState.auth.uid!)
        if (result.success) {
          navigate("/Company")
        } else {
          setError(result.message || "Failed to accept invite")
        }
      } catch (error) {
        setError("Failed to accept invite")
      } finally {
        setLoading(false)
      }
    }

    return (
      <Box sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh",
        bgcolor: themeConfig.colors.background.default,
        p: 3
      }}>
        <Card sx={{ maxWidth: 500, width: "100%" }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Avatar sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: themeConfig.colors.primary.main,
                mx: "auto",
                mb: 2
              }}>
                <BusinessIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h5" gutterBottom>
                Join {inviteData.companyName}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                You've been invited to join {inviteData.companyName} as a {inviteData.role} at {inviteData.siteName}.
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Signed in as: {settingsState.auth.email}
              </Typography>
              <Button
                variant="contained"
                onClick={acceptInviteDirectly}
                disabled={loading}
                fullWidth
                size="large"
              >
                {loading ? <CircularProgress size={24} /> : "Accept Invitation"}
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box sx={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "100vh",
      bgcolor: themeConfig.colors.background.default,
      p: 3
    }}>
      <Card sx={{ maxWidth: 500, width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Avatar sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: themeConfig.colors.primary.main,
              mx: "auto",
              mb: 2
            }}>
              <BusinessIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" gutterBottom>
              Join {inviteData?.companyName}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              You've been invited to join {inviteData?.companyName} as a {inviteData?.role} at {inviteData?.siteName}.
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Button
              variant={isSigningUp ? "outlined" : "contained"}
              onClick={() => setIsSigningUp(false)}
              fullWidth
              sx={{ mb: 1 }}
            >
              Sign In to Existing Account
            </Button>
            <Button
              variant={isSigningUp ? "contained" : "outlined"}
              onClick={() => setIsSigningUp(true)}
              fullWidth
            >
              Create New Account
            </Button>
          </Box>

          {!isSigningUp ? (
            // Sign In Form
            <Box>
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "16px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "16px"
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "16px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "16px"
                }}
              />
              <Button
                variant="contained"
                onClick={handleSignIn}
                disabled={loading}
                fullWidth
                size="large"
              >
                {loading ? <CircularProgress size={24} /> : "Sign In & Join Company"}
              </Button>
            </Box>
          ) : (
            // Sign Up Form
            <Box>
              <input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "16px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "16px"
                }}
              />
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "16px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "16px"
                }}
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "16px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "16px"
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "16px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "16px"
                }}
              />
              <Button
                variant="contained"
                onClick={handleSignUp}
                disabled={loading}
                fullWidth
                size="large"
              >
                {loading ? <CircularProgress size={24} /> : "Create Account & Join Company"}
              </Button>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default JoinCompany
