/**
 * POS Integration Settings Component
 * Manages POS system integrations (Lightspeed, Square, Toast, etc.)
 */

"use client"

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Snackbar,
  InputAdornment,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material'
import {
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Link as LinkIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material'
import { useCompany } from '../../../backend/context/CompanyContext'
import { LightspeedAuthService } from '../../../backend/services/pos-integration/lightspeed/LightspeedAuthService'
import { LightspeedSyncService } from '../../../backend/services/pos-integration/lightspeed/LightspeedSyncService'
import { LightspeedSettings } from '../../../backend/services/pos-integration/types'
import { db, ref, get, set } from '../../../backend/services/Firebase'

const authService = new LightspeedAuthService()
const syncService = new LightspeedSyncService()

interface POSIntegrationSettingsProps {
  companyId?: string
  siteId?: string
  subsiteId?: string
}

const POSIntegrationSettings: React.FC<POSIntegrationSettingsProps> = ({
  companyId: propCompanyId,
  siteId: propSiteId,
  subsiteId: propSubsiteId,
}) => {
  const { state: companyState } = useCompany()
  const companyId = propCompanyId || companyState.companyID
  const siteId = propSiteId || companyState.selectedSiteID
  const subsiteId = propSubsiteId || companyState.selectedSubsiteID

  const [settings, setSettings] = useState<LightspeedSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [guideExpanded, setGuideExpanded] = useState(true)
  const [copied, setCopied] = useState(false)

  // Form state
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [redirectUri, setRedirectUri] = useState(`${window.location.origin}/oauth/callback/lightspeed`)
  const [syncProducts, setSyncProducts] = useState(true)
  const [syncSales, setSyncSales] = useState(true)
  const [syncCustomers, setSyncCustomers] = useState(false)
  const [syncInventory, setSyncInventory] = useState(true)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false)
  const [autoSyncInterval, setAutoSyncInterval] = useState(60) // minutes

  // Dialog states
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false)

  // Load settings
  useEffect(() => {
    if (companyId) {
      loadSettings()
    }
  }, [companyId, siteId, subsiteId])

  // Check for OAuth callback data
  useEffect(() => {
    const oauthData = sessionStorage.getItem('lightspeed_oauth_data')
    if (oauthData && companyId) {
      const data = JSON.parse(oauthData)
      handleOAuthCallback(data)
      sessionStorage.removeItem('lightspeed_oauth_data')
    }
  }, [companyId])

  // Get settings path based on company/site/subsite level
  const getSettingsPath = () => {
    if (!companyId) return null
    let path = `companies/${companyId}`
    
    if (subsiteId && siteId) {
      // Subsite level
      path = `companies/${companyId}/sites/${siteId}/subsites/${subsiteId}/settings/lightspeedIntegration`
    } else if (siteId) {
      // Site level
      path = `companies/${companyId}/sites/${siteId}/settings/lightspeedIntegration`
    } else {
      // Company level
      path = `companies/${companyId}/settings/lightspeedIntegration`
    }
    
    return path
  }

  const loadSettings = async () => {
    if (!companyId) return

    try {
      setLoading(true)
      const settingsPath = getSettingsPath()
      if (!settingsPath) return
      
      const settingsRef = ref(db, settingsPath)
      const snapshot = await get(settingsRef)

      if (snapshot.exists()) {
        const data = snapshot.val()
        setSettings(data)
        setClientId(data.clientId || '')
        setClientSecret(data.clientSecret || '')
        setRedirectUri(data.redirectUri || redirectUri)
        setSyncProducts(data.syncProducts !== undefined ? data.syncProducts : true)
        setSyncSales(data.syncSales !== undefined ? data.syncSales : true)
        setSyncCustomers(data.syncCustomers !== undefined ? data.syncCustomers : false)
        setSyncInventory(data.syncInventory !== undefined ? data.syncInventory : true)
        setAutoSyncEnabled(data.autoSyncEnabled !== undefined ? data.autoSyncEnabled : false)
        setAutoSyncInterval(data.autoSyncInterval || 60)
      } else {
        // Initialize default settings
        const defaultSettings: LightspeedSettings = {
          provider: 'lightspeed',
          isEnabled: false,
          isConnected: false,
          syncStatus: 'idle',
          redirectUri: redirectUri,
          autoSyncEnabled: false,
          autoSyncInterval: 60,
          syncProducts: true,
          syncSales: true,
          syncCustomers: false,
          syncInventory: true,
          createdAt: Date.now(),
        }
        setSettings(defaultSettings)
      }
    } catch (err: any) {
      console.error('Error loading settings:', err)
      setError(err.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!companyId || !settings) return

    try {
      setSaving(true)
      setError(null)

      const updatedSettings: LightspeedSettings = {
        ...settings,
        clientId: clientId || settings.clientId,
        clientSecret: clientSecret || settings.clientSecret,
        redirectUri,
        syncProducts,
        syncSales,
        syncCustomers,
        syncInventory,
        autoSyncEnabled,
        autoSyncInterval,
        updatedAt: Date.now(),
      }

      const settingsPath = getSettingsPath()
      if (!settingsPath) return
      
      const settingsRef = ref(db, settingsPath)
      await set(settingsRef, updatedSettings)

      setSettings(updatedSettings)
      setSuccess('Settings saved successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error saving settings:', err)
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleConnect = () => {
    if (!clientId) {
      setError('Please enter your Lightspeed Client ID')
      return
    }

    // Store return path
    sessionStorage.setItem('lightspeed_oauth_return_path', window.location.pathname)

    // Generate state token
    const state = authService.generateState()
    const stateExpiry = Math.floor(Date.now() / 1000) + 600 // 10 minutes

      // Save state to settings
      if (settings) {
        const updatedSettings = {
          ...settings,
          clientId,
          clientSecret,
          redirectUri,
          oauthState: state,
          oauthStateExpiry: stateExpiry,
          updatedAt: Date.now(),
        }
        const settingsPath = getSettingsPath()
        if (settingsPath) {
          const settingsRef = ref(db, settingsPath)
          set(settingsRef, updatedSettings).catch(console.error)
        }
      }

    // Generate authorization URL
    const scope = 'products:read sales:read customers:read inventory:read'
    const authUrl = authService.getAuthorizationUrl(clientId, redirectUri, scope, state)

    // Redirect to Lightspeed
    window.location.href = authUrl
  }

  const handleOAuthCallback = async (oauthData: any) => {
    if (!companyId || !settings) return

    try {
      setLoading(true)
      setError(null)

      // Validate state
      if (!authService.validateState(oauthData.state, settings.oauthState, settings.oauthStateExpiry)) {
        setError('Invalid OAuth state. Please try again.')
        return
      }

      // Exchange code for token
      const tokenResponse = await authService.exchangeCodeForToken(
        oauthData.code,
        settings.clientId || clientId,
        settings.clientSecret || clientSecret,
        redirectUri,
        oauthData.domainPrefix
      )

      // Update settings with token
      const updatedSettings: LightspeedSettings = {
        ...settings,
        isEnabled: true,
        isConnected: true,
        connectedAt: Date.now(),
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        tokenExpiry: tokenResponse.expires,
        tokenType: tokenResponse.token_type,
        domainPrefix: oauthData.domainPrefix,
        scope: tokenResponse.scope,
        oauthState: undefined,
        oauthStateExpiry: undefined,
        syncStatus: 'idle',
        updatedAt: Date.now(),
      }

      const settingsPath = getSettingsPath()
      if (!settingsPath) return
      
      const settingsRef = ref(db, settingsPath)
      await set(settingsRef, updatedSettings)

      setSettings(updatedSettings)
      setSuccess('Successfully connected to Lightspeed!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error handling OAuth callback:', err)
      setError(err.message || 'Failed to complete OAuth connection')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!companyId || !settings) return

    try {
      setLoading(true)
      const updatedSettings: LightspeedSettings = {
        ...settings,
        isEnabled: false,
        isConnected: false,
        accessToken: undefined,
        refreshToken: undefined,
        tokenExpiry: undefined,
        domainPrefix: undefined,
        syncStatus: 'idle',
        updatedAt: Date.now(),
      }

      const settingsPath = getSettingsPath()
      if (!settingsPath) return
      
      const settingsRef = ref(db, settingsPath)
      await set(settingsRef, updatedSettings)

      setSettings(updatedSettings)
      setSuccess('Disconnected from Lightspeed')
      setTimeout(() => setSuccess(null), 3000)
      setDisconnectDialogOpen(false)
    } catch (err: any) {
      console.error('Error disconnecting:', err)
      setError(err.message || 'Failed to disconnect')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!companyId || !siteId || !settings) return

    try {
      setSyncing(true)
      setError(null)

      const updatedSettings = {
        ...settings,
        syncStatus: 'syncing' as const,
        updatedAt: Date.now(),
      }
      const settingsPath = getSettingsPath()
      if (!settingsPath) return
      
      const settingsRef = ref(db, settingsPath)
      await set(settingsRef, updatedSettings)

      const result = await syncService.fullSync(updatedSettings, companyId, siteId, subsiteId || undefined)

      const finalSettings: LightspeedSettings = {
        ...updatedSettings,
        syncStatus: result.success ? 'success' : 'error',
        syncError: result.errors && result.errors.length > 0 ? result.errors[0].message : undefined,
        lastSyncAt: Date.now(),
        updatedAt: Date.now(),
      }
      await set(settingsRef, finalSettings)

      setSettings(finalSettings)
      setSuccess(result.success ? 'Sync completed successfully!' : 'Sync completed with errors')
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: any) {
      console.error('Error syncing:', err)
      setError(err.message || 'Failed to sync')
      
      if (settings) {
        const errorSettings: LightspeedSettings = {
          ...settings,
          syncStatus: 'error',
          syncError: err.message || 'Sync failed',
          updatedAt: Date.now(),
        }
        const settingsPath = getSettingsPath()
        if (settingsPath) {
          const settingsRef = ref(db, settingsPath)
          await set(settingsRef, errorSettings)
          setSettings(errorSettings)
        }
      }
    } finally {
      setSyncing(false)
    }
  }

  if (loading && !settings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    )
  }

  const isConnected = settings?.isConnected || false

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardHeader
          title="Lightspeed Retail Integration"
          subheader="Connect your Lightspeed Retail (X-Series) account to sync products, sales, and inventory"
          avatar={<SettingsIcon />}
          action={
            isConnected && (
              <Chip
                icon={<CheckCircleIcon />}
                label="Connected"
                color="success"
                variant="outlined"
              />
            )
          }
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {!isConnected ? (
            <>
              {/* Step-by-Step Guide */}
              <Accordion expanded={guideExpanded} onChange={() => setGuideExpanded(!guideExpanded)} sx={{ mb: 3 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HelpIcon color="primary" />
                    <Typography variant="h6">Step-by-Step Connection Guide</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Stepper orientation="vertical" activeStep={-1}>
                    <Step>
                      <StepLabel>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Step 1: Register as a Developer
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          If you don't have a Lightspeed Developer account yet:
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Button
                            variant="outlined"
                            startIcon={<OpenInNewIcon />}
                            href="https://developers.lightspeedhq.com"
                            target="_blank"
                            rel="noopener"
                            sx={{ mb: 1 }}
                          >
                            Open Lightspeed Developer Portal
                          </Button>
                        </Box>
                        <Typography variant="body2" color="text.secondary" component="div">
                          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                            <li>Click "Sign Up" or "Register"</li>
                            <li>Create your developer account (separate from your Lightspeed Retail account)</li>
                            <li>Verify your email address</li>
                          </ul>
                        </Typography>
                      </StepContent>
                    </Step>

                    <Step>
                      <StepLabel>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Step 2: Create Your Application
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Once logged into the Developer Portal:
                        </Typography>
                        <Typography variant="body2" color="text.secondary" component="div">
                          <ol style={{ marginTop: 8, paddingLeft: 20 }}>
                            <li>Go to "Applications" or "My Apps"</li>
                            <li>Click "Create New Application" or "Add Application"</li>
                            <li>Select "Lightspeed Retail (X-Series)" as the platform</li>
                            <li>Enter an application name (e.g., "1Stop Integration")</li>
                            <li>Add a description (optional)</li>
                          </ol>
                        </Typography>
                      </StepContent>
                    </Step>

                    <Step>
                      <StepLabel>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Step 3: Configure Redirect URI
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          In your Lightspeed application settings, add this redirect URI:
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            mb: 2,
                            bgcolor: 'background.default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2,
                          }}
                        >
                          <Typography
                            variant="body2"
                            component="code"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.875rem',
                              wordBreak: 'break-all',
                              flex: 1,
                            }}
                          >
                            {redirectUri}
                          </Typography>
                          <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                navigator.clipboard.writeText(redirectUri)
                                setCopied(true)
                                setTimeout(() => setCopied(false), 2000)
                              }}
                            >
                              {copied ? <CheckIcon color="success" /> : <CopyIcon />}
                            </IconButton>
                          </Tooltip>
                        </Paper>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            <strong>Important:</strong> The redirect URI must match exactly (including http/https and port number).
                            You can add multiple redirect URIs if you need both development and production URLs.
                          </Typography>
                        </Alert>
                        <Typography variant="body2" color="text.secondary" component="div">
                          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                            <li>Copy the redirect URI above</li>
                            <li>Paste it into the "Redirect URI" or "Callback URL" field in your Lightspeed app</li>
                            <li>Click "Save" or "Update"</li>
                          </ul>
                        </Typography>
                      </StepContent>
                    </Step>

                    <Step>
                      <StepLabel>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Step 4: Get Your Credentials
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          After creating your application, you'll see:
                        </Typography>
                        <Typography variant="body2" color="text.secondary" component="div">
                          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                            <li><strong>Client ID:</strong> A unique identifier for your app (usually visible immediately)</li>
                            <li><strong>Client Secret:</strong> A secret key (may need to click "Show" or "Reveal")</li>
                          </ul>
                        </Typography>
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            <strong>Keep your Client Secret secure!</strong> Don't share it publicly. You'll need both values below.
                          </Typography>
                        </Alert>
                      </StepContent>
                    </Step>

                    <Step>
                      <StepLabel>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Step 5: Enter Credentials & Connect
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Enter your credentials in the form below, then click "Connect to Lightspeed":
                        </Typography>
                        <Typography variant="body2" color="text.secondary" component="div">
                          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                            <li>Paste your Client ID into the first field</li>
                            <li>Paste your Client Secret into the second field</li>
                            <li>Verify the redirect URI matches what you set in Lightspeed</li>
                            <li>Click "Connect to Lightspeed"</li>
                            <li>You'll be redirected to Lightspeed to authorize the connection</li>
                            <li>After authorization, you'll be redirected back automatically</li>
                          </ul>
                        </Typography>
                      </StepContent>
                    </Step>
                  </Stepper>
                </AccordionDetails>
              </Accordion>

              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
                Enter Your Lightspeed Credentials
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Client ID"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                    placeholder="Enter your Lightspeed Client ID"
                    helperText={
                      <Box>
                        <Typography variant="caption" display="block">
                          Found in your Lightspeed Developer Portal → Applications → Your App
                        </Typography>
                        <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                          {!clientId && 'Required'}
                        </Typography>
                      </Box>
                    }
                    InputProps={{
                      endAdornment: clientId && (
                        <InputAdornment position="end">
                          <CheckIcon color="success" fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Client Secret"
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    required
                    placeholder="Enter your Lightspeed Client Secret"
                    helperText={
                      <Box>
                        <Typography variant="caption" display="block">
                          Found in your Lightspeed Developer Portal → Applications → Your App → Show Secret
                        </Typography>
                        <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                          {!clientSecret && 'Required'}
                        </Typography>
                      </Box>
                    }
                    InputProps={{
                      endAdornment: clientSecret && (
                        <InputAdornment position="end">
                          <CheckIcon color="success" fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Redirect URI"
                    value={redirectUri}
                    onChange={(e) => setRedirectUri(e.target.value)}
                    helperText="Must match exactly what you set in your Lightspeed app settings"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Copy redirect URI">
                            <IconButton
                              size="small"
                              onClick={() => {
                                navigator.clipboard.writeText(redirectUri)
                                setCopied(true)
                                setTimeout(() => setCopied(false), 2000)
                              }}
                            >
                              {copied ? <CheckIcon color="success" /> : <CopyIcon />}
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleConnect}
                  disabled={!clientId || !clientSecret || saving}
                  startIcon={<LinkIcon />}
                  size="large"
                  sx={{ minWidth: 200 }}
                >
                  {saving ? 'Connecting...' : 'Connect to Lightspeed'}
                </Button>
                {(!clientId || !clientSecret) && (
                  <Typography variant="body2" color="text.secondary">
                    Please enter both Client ID and Client Secret to continue
                  </Typography>
                )}
              </Box>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Need help?</strong> Click the guide above for detailed step-by-step instructions.
                  If you encounter issues, make sure your redirect URI matches exactly in both places.
                </Typography>
              </Alert>
            </>
          ) : (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Connected to: <strong>{settings?.domainPrefix || 'Unknown'}.retail.lightspeed.app</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                  Sync Level: {subsiteId ? 'Subsite' : siteId ? 'Site' : 'Company'}
                </Typography>
                {settings?.lastSyncAt && (
                  <Typography variant="body2" color="text.secondary">
                    Last sync: {new Date(settings.lastSyncAt).toLocaleString()}
                  </Typography>
                )}
                {settings?.syncStatus === 'syncing' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    <Typography variant="body2">Syncing...</Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Sync Settings
              </Typography>

              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={syncProducts}
                      onChange={(e) => setSyncProducts(e.target.checked)}
                    />
                  }
                  label="Sync Products"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                  Import products from Lightspeed into your stock system
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={syncSales}
                      onChange={(e) => setSyncSales(e.target.checked)}
                    />
                  }
                  label="Sync Sales"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                  Import sales transactions from Lightspeed into your POS system
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={syncInventory}
                      onChange={(e) => setSyncInventory(e.target.checked)}
                    />
                  }
                  label="Sync Inventory"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                  Update inventory levels from Lightspeed
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={syncCustomers}
                      onChange={(e) => setSyncCustomers(e.target.checked)}
                    />
                  }
                  label="Sync Customers"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                  Import customer data from Lightspeed
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Auto Sync
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={autoSyncEnabled}
                    onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                  />
                }
                label="Enable Automatic Sync"
                sx={{ mb: 2 }}
              />

              {autoSyncEnabled && (
                <FormControl fullWidth sx={{ mb: 3, maxWidth: 300 }}>
                  <InputLabel>Sync Interval</InputLabel>
                  <Select
                    value={autoSyncInterval}
                    onChange={(e) => setAutoSyncInterval(e.target.value as number)}
                    label="Sync Interval"
                  >
                    <MenuItem value={15}>Every 15 minutes</MenuItem>
                    <MenuItem value={30}>Every 30 minutes</MenuItem>
                    <MenuItem value={60}>Every hour</MenuItem>
                    <MenuItem value={240}>Every 4 hours</MenuItem>
                    <MenuItem value={1440}>Daily</MenuItem>
                  </Select>
                </FormControl>
              )}

              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSync}
                  disabled={syncing || !companyId}
                  startIcon={syncing ? <CircularProgress size={20} /> : <SyncIcon />}
                >
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>

                <Button
                  variant="outlined"
                  onClick={saveSettings}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setDisconnectDialogOpen(true)}
                >
                  Disconnect
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={disconnectDialogOpen} onClose={() => setDisconnectDialogOpen(false)}>
        <DialogTitle>Disconnect Lightspeed?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to disconnect from Lightspeed? You'll need to reconnect and re-authorize to sync data again.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisconnectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDisconnect} color="error" variant="contained">
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy Success Snackbar */}
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Redirect URI copied to clipboard!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}

export default POSIntegrationSettings

