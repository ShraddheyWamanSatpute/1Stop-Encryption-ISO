"use client"

import React, { useEffect, useState, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
} from "@mui/material"
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from "@mui/icons-material"
import { auth } from "../../../backend/services/Firebase"
import { updateHMRCTokens } from "../../../backend/functions/HMRCSettings"

const HMRCOAuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState<string>('')
  const isProcessingRef = useRef(false)

  useEffect(() => {
    // Prevent multiple executions
    if (isProcessingRef.current) {
      console.log('OAuth callback already processing, skipping...')
      return
    }

    const handleCallback = async () => {
      isProcessingRef.current = true
      try {
        // Debug: Log the full URL to see what HMRC returned
        console.log('HMRC Callback URL:', window.location.href)
        console.log('URL Search Params:', window.location.search)
        
        // Get authorization code from URL
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          setStatus('error')
          setMessage(`OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`)
          return
        }

        if (!code) {
          setStatus('error')
          setMessage('No authorization code received. Make sure the redirect URI in HMRC Developer Hub matches exactly: ' + (import.meta.env.VITE_HMRC_REDIRECT_URI || `${window.location.origin}/hmrc/callback`))
          return
        }

        // Get stored state
        const storedState = sessionStorage.getItem('hmrc_oauth_state')
        if (!storedState) {
          setStatus('error')
          setMessage('OAuth state not found. Please try connecting again.')
          return
        }

        const stateData = JSON.parse(storedState)
        const { companyId, siteId, subsiteId, environment } = stateData

        // Exchange code for tokens using Firebase Function (server-side to avoid CORS)
        // Get redirect URI from environment variable or use default (must match the one used in authorization)
        const redirectUri = import.meta.env.VITE_HMRC_REDIRECT_URI || `${window.location.origin}/hmrc/callback`

        // Get Firebase project ID from config or environment
        const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'stop-test-8025f'
        const region = 'us-central1'
        const isDevelopment = import.meta.env.DEV
        const fnBase = isDevelopment
          ? `http://127.0.0.1:5001/${projectId}/${region}` // Local emulator
          : `https://${region}-${projectId}.cloudfunctions.net` // Production

        // SECURITY: Require Firebase auth - server verifies ID token before exchanging OAuth code
        const currentUser = auth.currentUser
        if (!currentUser) {
          setStatus('error')
          setMessage('You must be signed in to complete HMRC authorization.')
          return
        }
        const firebaseIdToken = await currentUser.getIdToken()

        // SECURITY: Client only sends code, redirectUri, and environment
        // Credentials are stored server-side in Firebase Secrets
        const requestBody = {
          code,
          redirectUri,
          environment: environment || 'sandbox'
        }

        console.log('Calling Firebase Function:', `${fnBase}/exchangeHMRCToken`)
        console.log('Request body:', {
          code: code?.substring(0, 10) + '...',
          redirectUri,
          environment: environment || 'sandbox'
        })

        // Add timeout to fetch (30 seconds)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)

        let response
        try {
          response = await fetch(`${fnBase}/exchangeHMRCToken`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${firebaseIdToken}`,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          })
          clearTimeout(timeoutId)
        } catch (fetchError: any) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError') {
            throw new Error('Request timed out after 30 seconds. Please check if the Firebase Functions emulator is running.')
          }
          throw fetchError
        }

        console.log('Firebase Function response status:', response.status)

        if (!response.ok) {
          let errorData
          try {
            errorData = await response.json()
          } catch {
            const text = await response.text()
            throw new Error(`Server error (${response.status}): ${text}`)
          }
          
          console.error('HMRC token exchange error response:', errorData)
          
          // Provide more helpful error message
          const errorMessage = errorData.message || errorData.error || 'Failed to exchange authorization code for tokens'
          throw new Error(errorMessage)
        }

        const result = await response.json()

        if (!result.success || !result.tokens) {
          throw new Error('Invalid response from token exchange function')
        }

        // Save tokens at the same level where settings are stored
        await updateHMRCTokens(companyId, siteId || null, subsiteId || null, {
          accessToken: result.tokens.access_token,
          refreshToken: result.tokens.refresh_token,
          expiresIn: result.tokens.expires_in
        })

        // Clear stored state
        sessionStorage.removeItem('hmrc_oauth_state')

        setStatus('success')
        setMessage('Successfully connected to HMRC!')

        // Redirect to HR Settings after 3 seconds
        setTimeout(() => {
          navigate('/HR?tab=settings')
        }, 3000)
      } catch (err: any) {
        console.error('Error handling OAuth callback:', err)
        setStatus('error')
        setMessage(`Failed to complete OAuth: ${err.message}`)
      } finally {
        isProcessingRef.current = false
      }
    }

    handleCallback()
  }, [searchParams, navigate])

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        p: 3,
      }}
    >
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          {status === 'processing' && (
            <>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom>
                Connecting to HMRC...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we complete the authorization.
              </Typography>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom color="success.main">
                Successfully Connected!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {message}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Redirecting to HR Settings...
              </Typography>
            </>
          )}

          {status === 'error' && (
            <>
              <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom color="error.main">
                Connection Failed
              </Typography>
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                {message}
              </Alert>
              <Button
                variant="contained"
                onClick={() => navigate('/HR?tab=settings')}
              >
                Go to HR Settings
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default HMRCOAuthCallback

