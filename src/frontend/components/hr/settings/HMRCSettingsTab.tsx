"use client"

import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import {
  Save as SaveIcon,
  VpnKey as VpnKeyIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  Refresh as RefreshIcon,
  Article as ArticleIcon,
} from "@mui/icons-material"
import { useCompany } from "../../../../backend/context/CompanyContext"
import { auth } from "../../../../backend/services/Firebase"
import { fetchHMRCSettings, saveHMRCSettings, updateHMRCTokens } from "../../../../backend/functions/HMRCSettings"
import { HMRCAuthService } from "../../../../backend/services/hmrc"
import type { HMRCSettings } from "../../../../backend/interfaces/Company"

const HMRCSettingsTab: React.FC = () => {
  const { state: companyState } = useCompany()
  const companyId = companyState.companyID
  const siteId = companyState.selectedSiteID
  const subsiteId = companyState.selectedSubsiteID

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hmrcSettings, setHmrcSettings] = useState<Partial<HMRCSettings> | null>(null)
  const [settingsLevel, setSettingsLevel] = useState<"company" | "site" | "subsite">("subsite")
  const [settingsFoundAt, setSettingsFoundAt] = useState<"company" | "site" | "subsite" | null>(null)

  // OAuth state
  const [oauthConnecting, setOauthConnecting] = useState(false)
  const [oauthStatus, setOauthStatus] = useState<'disconnected' | 'connected' | 'expired'>('disconnected')
  
  // Help dialog state
  const [helpDialogOpen, setHelpDialogOpen] = useState(false)

  // Check if OAuth is configured (only clientId needed for authorization URL)
  const isOAuthConfigured = !!import.meta.env.VITE_HMRC_CLIENT_ID

  // Initialize with defaults
  const defaultSettings: Partial<HMRCSettings> = {
    employerPAYEReference: "",
    accountsOfficeReference: "",
    hmrcOfficeNumber: "",
    hmrcEnvironment: "sandbox",
    autoSubmitFPS: false,
    requireFPSApproval: true,
    fpsSubmissionLeadTime: 0,
    isApprenticeshipLevyPayer: false,
    apprenticeshipLevyAllowance: 15000,
    apprenticeshipLevyRate: 0.005,
    claimsEmploymentAllowance: false,
    employmentAllowanceAmount: 5000,
    employmentAllowanceUsed: 0,
    hmrcPaymentDay: 19,
    hmrcPaymentMethod: "direct_debit",
    isRegisteredTroncOperator: false,
    currentTaxYear: "2024-25",
    fiscalYearEnd: "05-04",
    useSandboxForTesting: true,
    autoEnrolmentPostponement: 0,
    postponementLetterSent: false,
    yearEndRemindersSent: false,
    notifyBeforeFPSDeadline: true,
    notifyBeforePaymentDeadline: true,
    notificationLeadDays: 3,
    payrollRetentionYears: 6,
    autoArchiveOldRecords: false,
    connectedCompanies: [],
  }

  // Determine default level based on what's selected
  useEffect(() => {
    if (subsiteId && siteId) {
      setSettingsLevel("subsite")
    } else if (siteId) {
      setSettingsLevel("site")
    } else if (companyId) {
      setSettingsLevel("company")
    }
  }, [companyId, siteId, subsiteId])

  // Load settings on mount
  useEffect(() => {
    if (companyId) {
      loadSettings()
    }
  }, [companyId, siteId, subsiteId])

  // Check OAuth status
  useEffect(() => {
    if (hmrcSettings) {
      if (hmrcSettings.hmrcAccessToken && hmrcSettings.hmrcTokenExpiry) {
        const now = Date.now()
        const expiry = hmrcSettings.hmrcTokenExpiry
        if (expiry > now + 300000) { // 5 minutes buffer
          setOauthStatus('connected')
        } else {
          setOauthStatus('expired')
        }
      } else {
        setOauthStatus('disconnected')
      }
    }
  }, [hmrcSettings])

  const loadSettings = async () => {
    if (!companyId) return

    setLoading(true)
    setError(null)

    try {
      const { settings, foundAt } = await fetchHMRCSettings(companyId, siteId || null, subsiteId || null)
      if (settings) {
        setHmrcSettings(settings)
        setSettingsFoundAt(foundAt)
        // If settings found, use that level as the default
        if (foundAt) {
          setSettingsLevel(foundAt)
        }
      } else {
        setHmrcSettings(defaultSettings)
        setSettingsFoundAt(null)
      }
    } catch (err: any) {
      console.error('Error loading HMRC settings:', err)
      setError(`Failed to load settings: ${err.message}`)
      setHmrcSettings(defaultSettings)
      setSettingsFoundAt(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!companyId) {
      setError('Company ID missing')
      return
    }

    // Validate level selection
    if (settingsLevel === "subsite" && (!siteId || !subsiteId)) {
      setError('Subsite must be selected to save at subsite level')
      return
    }
    if (settingsLevel === "site" && !siteId) {
      setError('Site must be selected to save at site level')
      return
    }

    // Validate required fields
    if (!hmrcSettings?.employerPAYEReference) {
      setError('PAYE reference is required')
      return
    }

    if (!hmrcSettings?.accountsOfficeReference) {
      setError('Accounts Office reference is required')
      return
    }

    // Extract office number from PAYE reference
    const payeRef = hmrcSettings.employerPAYEReference
    const officeNumber = payeRef.split('/')[0] || ""

    setSaving(true)
    setError(null)

    try {
      // SECURITY: Remove credential fields before saving (should not be stored per-company)
      const settingsToSave = { ...hmrcSettings, hmrcOfficeNumber: officeNumber }
      delete (settingsToSave as any).hmrcClientId
      delete (settingsToSave as any).hmrcClientSecret

      await saveHMRCSettings(companyId, siteId || null, subsiteId || null, settingsLevel, settingsToSave as Partial<HMRCSettings>)

      setSuccess('HMRC settings saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error saving HMRC settings:', err)
      setError(`Failed to save settings: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleConnectHMRC = async () => {
    if (!companyId || !hmrcSettings) {
      setError('Please save basic settings first')
      return
    }

    // SECURITY: Only use clientId from environment variables (for authorization URL only)
    // Client secret is NOT needed client-side and is stored server-side in Firebase Secrets
    const clientId = import.meta.env.VITE_HMRC_CLIENT_ID

    // Check if OAuth is configured
    if (!clientId) {
      setError('HMRC OAuth is not configured. Please contact the platform administrator to set up HMRC integration.')
      return
    }

    setOauthConnecting(true)
    setError(null)

    try {
      const authService = new HMRCAuthService()
      // Get redirect URI from environment variable or use default
      const redirectUri = import.meta.env.VITE_HMRC_REDIRECT_URI || `${window.location.origin}/hmrc/callback`
      
      // Debug logs
      console.log('=== HMRC OAuth Connection Debug ===')
      console.log('Client ID:', clientId ? `${clientId.substring(0, 10)}...` : 'NOT SET')
      console.log('Redirect URI:', redirectUri)
      console.log('Environment:', hmrcSettings.hmrcEnvironment || 'sandbox')
      console.log('Current Origin:', window.location.origin)
      console.log('================================')
      
      // Determine scope based on available APIs
      // For testing: Use 'hello' scope for Hello World API
      // For production: Use 'write:paye-employer-paye-employer' for Real Time Information API
      // Check environment variable to allow override, or default to hello for testing
      const scope = import.meta.env.VITE_HMRC_OAUTH_SCOPE || 'hello' // Default to 'hello' for Hello World testing
      
      console.log('Using OAuth scope:', scope)
      console.log('Note: Using Hello World API scope for testing. For RTI submissions, you need Real Time Information API subscription.')
      
      try {
        const authUrl = authService.getAuthorizationUrl(
          clientId,
          redirectUri,
          scope,
          hmrcSettings.hmrcEnvironment || 'sandbox'
        )
        
        console.log('Authorization URL:', authUrl)
        
        // Store state for callback
        sessionStorage.setItem('hmrc_oauth_state', JSON.stringify({
          companyId,
          siteId,
          subsiteId,
          level: settingsLevel,
          environment: hmrcSettings.hmrcEnvironment
        }))

        // Redirect to HMRC
        window.location.href = authUrl
      } catch (authError: any) {
        console.error('Error generating authorization URL:', authError)
        setError(`Failed to initiate OAuth: ${authError.message}`)
        setOauthConnecting(false)
      }
    } catch (err: any) {
      console.error('Error initiating OAuth:', err)
      setError(`Failed to connect to HMRC: ${err.message}. Make sure you've subscribed to "Real Time Information online" API and the redirect URI matches exactly in HMRC Developer Hub.`)
      setOauthConnecting(false)
    }
  }

  const handleRefreshToken = async () => {
    if (!companyId || !hmrcSettings) return

    if (!hmrcSettings.hmrcRefreshToken) {
      setError('Refresh token missing. Please reconnect to HMRC.')
      return
    }

    const currentUser = auth.currentUser
    if (!currentUser) {
      setError('You must be signed in to refresh the HMRC token.')
      return
    }

    setOauthConnecting(true)
    setError(null)

    try {
      const firebaseIdToken = await currentUser.getIdToken()

      // Get Firebase project ID from config or environment
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'stop-test-8025f'
      const region = 'us-central1'
      const isDevelopment = import.meta.env.DEV
      const fnBase = isDevelopment
        ? `http://127.0.0.1:5001/${projectId}/${region}` // Local emulator
        : `https://${region}-${projectId}.cloudfunctions.net` // Production

      // SECURITY: Client only sends refreshToken and environment
      // Credentials are stored server-side in Firebase Secrets
      const requestBody = {
        refreshToken: hmrcSettings.hmrcRefreshToken,
        environment: hmrcSettings.hmrcEnvironment || 'sandbox'
      }

      const response = await fetch(`${fnBase}/refreshHMRCToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseIdToken}`,
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to refresh token')
      }

      const result = await response.json()

      if (!result.success || !result.tokens) {
        throw new Error('Invalid response from token refresh function')
      }

      await updateHMRCTokens(companyId, siteId || null, subsiteId || null, {
        accessToken: result.tokens.access_token,
        refreshToken: result.tokens.refresh_token,
        expiresIn: result.tokens.expires_in
      })

      setSuccess('Token refreshed successfully!')
      await loadSettings()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error refreshing token:', err)
      setError(`Failed to refresh token: ${err.message}`)
    } finally {
      setOauthConnecting(false)
    }
  }

  const handleInputChange = (field: keyof HMRCSettings, value: any) => {
    setHmrcSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          HMRC Integration Settings
        </Typography>
        <Button
          variant="outlined"
          startIcon={<HelpIcon />}
          onClick={() => setHelpDialogOpen(true)}
          sx={{ ml: 2 }}
        >
          Connection Guide
        </Button>
      </Box>

      {/* Configuration Level Selector */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Configuration Level" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Choose where to store HMRC settings. Settings are checked in this order: Subsite → Site → Company
              </Alert>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Settings Level</InputLabel>
                <Select
                  value={settingsLevel}
                  onChange={(e) => setSettingsLevel(e.target.value as "company" | "site" | "subsite")}
                  label="Settings Level"
                >
                  <MenuItem value="subsite" disabled={!subsiteId || !siteId}>
                    Subsite {subsiteId ? `(${companyState.selectedSubsiteName || subsiteId})` : '(Not Selected)'}
                  </MenuItem>
                  <MenuItem value="site" disabled={!siteId}>
                    Site {siteId ? `(${companyState.selectedSiteName || siteId})` : '(Not Selected)'}
                  </MenuItem>
                  <MenuItem value="company">
                    Company {companyId ? `(${companyState.companyName || companyId})` : ''}
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {settingsFoundAt && (
              <Grid item xs={12} sm={6}>
                <Alert severity="success" sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon sx={{ mr: 1 }} />
                  Settings found at: <strong>{settingsFoundAt}</strong> level
                </Alert>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* OAuth Connection Status */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="HMRC Connection"
          avatar={<VpnKeyIcon color={oauthStatus === 'connected' ? 'success' : 'disabled'} />}
          action={
            oauthStatus === 'connected' ? (
              <Chip icon={<CheckCircleIcon />} label="Connected" color="success" size="small" />
            ) : oauthStatus === 'expired' ? (
              <Chip icon={<ErrorIcon />} label="Expired" color="warning" size="small" />
            ) : (
              <Chip label="Not Connected" color="default" size="small" />
            )
          }
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              {!isOAuthConfigured ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  HMRC OAuth is not configured. The platform administrator needs to set up HMRC API credentials in Firebase Secrets.
                </Alert>
              ) : (
              <Alert severity={oauthStatus === 'connected' ? 'success' : 'info'} sx={{ mb: 2 }}>
                {oauthStatus === 'connected' 
                  ? 'Connected to HMRC. Your payroll can be automatically submitted.'
                  : oauthStatus === 'expired'
                  ? 'Your HMRC connection has expired. Click "Refresh Token" to reconnect.'
                  : 'Connect to HMRC to enable automatic RTI submissions. You only need to do this once.'}
              </Alert>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                startIcon={oauthConnecting ? <CircularProgress size={20} /> : <VpnKeyIcon />}
                onClick={handleConnectHMRC}
                disabled={oauthConnecting || oauthStatus === 'connected' || !isOAuthConfigured}
                fullWidth
              >
                {oauthStatus === 'connected' ? 'Connected' : 'Connect to HMRC'}
              </Button>
            </Grid>
            {oauthStatus === 'expired' && (
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefreshToken}
                  disabled={oauthConnecting}
                  fullWidth
                >
                  Refresh Token
                </Button>
              </Grid>
            )}
            {hmrcSettings?.lastHMRCAuthDate && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Last connected: {new Date(hmrcSettings.lastHMRCAuthDate).toLocaleString()}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Employer Identification */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Employer Identification" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Tooltip
                title="Your PAYE Reference is found on HMRC correspondence, payslips, or in your HMRC online account. Format: ###/AB###### (e.g., 123/AB45678)"
                arrow
              >
                <TextField
                  fullWidth
                  label="PAYE Reference"
                  value={hmrcSettings?.employerPAYEReference || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    handleInputChange('employerPAYEReference', value)
                    // Auto-extract office number
                    const officeNumber = value.split('/')[0] || ""
                    handleInputChange('hmrcOfficeNumber', officeNumber)
                  }}
                  placeholder="123/AB45678"
                  helperText="Format: ###/AB###### (e.g., 123/AB45678)"
                  required
                  InputProps={{
                    endAdornment: (
                      <IconButton size="small" onClick={() => setHelpDialogOpen(true)}>
                        <HelpIcon fontSize="small" />
                      </IconButton>
                    )
                  }}
                />
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Tooltip
                title="Your Accounts Office Reference is found on HMRC correspondence or in your HMRC online account. Format: ###PA######## (e.g., 123PA00012345)"
                arrow
              >
                <TextField
                  fullWidth
                  label="Accounts Office Reference"
                  value={hmrcSettings?.accountsOfficeReference || ""}
                  onChange={(e) => handleInputChange('accountsOfficeReference', e.target.value)}
                  placeholder="123PA00012345"
                  helperText="Format: ###PA######## (e.g., 123PA00012345)"
                  required
                  InputProps={{
                    endAdornment: (
                      <IconButton size="small" onClick={() => setHelpDialogOpen(true)}>
                        <HelpIcon fontSize="small" />
                      </IconButton>
                    )
                  }}
                />
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Corporation Tax Reference (Optional)"
                value={hmrcSettings?.corporationTaxReference || ""}
                onChange={(e) => handleInputChange('corporationTaxReference', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="VAT Registration Number (Optional)"
                value={hmrcSettings?.vatRegistrationNumber || ""}
                onChange={(e) => handleInputChange('vatRegistrationNumber', e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* RTI Submission Settings */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="RTI Submission Settings" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={hmrcSettings?.autoSubmitFPS || false}
                    onChange={(e) => handleInputChange('autoSubmitFPS', e.target.checked)}
                  />
                }
                label="Automatically submit FPS after payroll approval"
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4, mt: 0.5 }}>
                When enabled, payroll will be automatically submitted to HMRC when approved
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={hmrcSettings?.requireFPSApproval || true}
                    onChange={(e) => handleInputChange('requireFPSApproval', e.target.checked)}
                  />
                }
                label="Require manual approval before FPS submission"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="FPS Submission Lead Time (Days)"
                value={hmrcSettings?.fpsSubmissionLeadTime || 0}
                onChange={(e) => handleInputChange('fpsSubmissionLeadTime', parseInt(e.target.value) || 0)}
                helperText="Days before payment date to submit FPS"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Environment</InputLabel>
                <Select
                  value={hmrcSettings?.hmrcEnvironment || "sandbox"}
                  onChange={(e) => handleInputChange('hmrcEnvironment', e.target.value)}
                  label="Environment"
                >
                  <MenuItem value="sandbox">Sandbox (Testing)</MenuItem>
                  <MenuItem value="production">Production (Live)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Employment Allowance */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Employment Allowance</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={hmrcSettings?.claimsEmploymentAllowance || false}
                    onChange={(e) => handleInputChange('claimsEmploymentAllowance', e.target.checked)}
                  />
                }
                label="Claim Employment Allowance"
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4, mt: 0.5 }}>
                You can claim up to £5,000 per year to reduce your employer National Insurance contributions
              </Typography>
            </Grid>
            {hmrcSettings?.claimsEmploymentAllowance && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Employment Allowance Amount"
                    value={hmrcSettings?.employmentAllowanceAmount || 5000}
                    onChange={(e) => handleInputChange('employmentAllowanceAmount', parseFloat(e.target.value) || 5000)}
                    helperText="Maximum: £5,000 per year"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Amount Used This Year"
                    value={hmrcSettings?.employmentAllowanceUsed || 0}
                    onChange={(e) => handleInputChange('employmentAllowanceUsed', parseFloat(e.target.value) || 0)}
                    helperText="Amount already used in current tax year"
                  />
                </Grid>
              </>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Apprenticeship Levy */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Apprenticeship Levy</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={hmrcSettings?.isApprenticeshipLevyPayer || false}
                    onChange={(e) => handleInputChange('isApprenticeshipLevyPayer', e.target.checked)}
                  />
                }
                label="Apprenticeship Levy Payer"
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4, mt: 0.5 }}>
                Required if your annual payroll is over £3 million
              </Typography>
            </Grid>
            {hmrcSettings?.isApprenticeshipLevyPayer && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Levy Allowance"
                    value={hmrcSettings?.apprenticeshipLevyAllowance || 15000}
                    onChange={(e) => handleInputChange('apprenticeshipLevyAllowance', parseFloat(e.target.value) || 15000)}
                    helperText="Standard allowance: £15,000"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Levy Rate"
                    value={((hmrcSettings?.apprenticeshipLevyRate || 0.005) * 100).toFixed(2)}
                    onChange={(e) => handleInputChange('apprenticeshipLevyRate', (parseFloat(e.target.value) || 0) / 100)}
                    helperText="Standard rate: 0.5%"
                    InputProps={{
                      endAdornment: <Typography variant="body2">%</Typography>
                    }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Notifications */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Notifications</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={hmrcSettings?.notifyBeforeFPSDeadline || false}
                    onChange={(e) => handleInputChange('notifyBeforeFPSDeadline', e.target.checked)}
                  />
                }
                label="Notify before FPS deadline"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={hmrcSettings?.notifyBeforePaymentDeadline || false}
                    onChange={(e) => handleInputChange('notifyBeforePaymentDeadline', e.target.checked)}
                  />
                }
                label="Notify before HMRC payment deadline"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Notification Lead Days"
                value={hmrcSettings?.notificationLeadDays || 3}
                onChange={(e) => handleInputChange('notificationLeadDays', parseInt(e.target.value) || 3)}
                helperText="Days in advance to send notifications"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="email"
                label="Notification Email"
                value={hmrcSettings?.notificationEmail || ""}
                onChange={(e) => handleInputChange('notificationEmail', e.target.value)}
                helperText="Email address for payroll notifications"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={loadSettings}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          Save Settings
        </Button>
      </Box>

      {/* Error/Success Messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>

      {/* Connection Guide Help Dialog */}
      <Dialog
        open={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ArticleIcon />
          HMRC API Connection Guide
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Follow these simple steps to connect your HMRC account. The entire process takes less than 5 minutes!
          </Alert>

          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <CheckCircleIcon color="success" />
            Step 1: Choose Configuration Level
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ml: 4 }}>
            Select where to store your HMRC settings (Company, Site, or Subsite). Settings are checked in this order: Subsite → Site → Company.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <CheckCircleIcon color="success" />
            Step 2: Enter Your HMRC Details
          </Typography>
          <List sx={{ ml: 4, mb: 2 }}>
            <ListItem>
              <ListItemIcon>
                <Typography variant="body2" fontWeight="bold">1.</Typography>
              </ListItemIcon>
              <ListItemText
                primary="PAYE Reference"
                secondary="Format: ###/AB###### (e.g., 123/AB45678). Found on HMRC correspondence or payslips."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Typography variant="body2" fontWeight="bold">2.</Typography>
              </ListItemIcon>
              <ListItemText
                primary="Accounts Office Reference"
                secondary="Format: ###PA######## (e.g., 123PA00012345). Found on HMRC correspondence."
              />
            </ListItem>
          </List>

          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <CheckCircleIcon color="success" />
            Step 3: Save Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ml: 4 }}>
            Click "Save Settings" to store your HMRC details. Wait for the success message before proceeding.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <CheckCircleIcon color="success" />
            Step 4: Connect to HMRC
          </Typography>
          <List sx={{ ml: 4, mb: 2 }}>
            <ListItem>
              <ListItemIcon>
                <Typography variant="body2" fontWeight="bold">1.</Typography>
              </ListItemIcon>
              <ListItemText
                primary="Click 'Connect to HMRC'"
                secondary="This will redirect you to HMRC's authorization page."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Typography variant="body2" fontWeight="bold">2.</Typography>
              </ListItemIcon>
              <ListItemText
                primary="Log in with Government Gateway"
                secondary="Use your Government Gateway credentials (the same account you use for HMRC online services)."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Typography variant="body2" fontWeight="bold">3.</Typography>
              </ListItemIcon>
              <ListItemText
                primary="Authorize the Application"
                secondary="Review the permissions and click 'Authorize' to grant access."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Typography variant="body2" fontWeight="bold">4.</Typography>
              </ListItemIcon>
              <ListItemText
                primary="You're Done!"
                secondary="You'll be redirected back and see 'Successfully Connected!' message."
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            📋 What You'll Need
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="PAYE Reference (format: 123/AB45678)" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Accounts Office Reference (format: 123PA00012345)" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Government Gateway account access" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Admin access to HR settings" />
            </ListItem>
          </List>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            ⚠️ Common Issues
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="'HMRC settings not configured'"
                secondary="Make sure you've saved your settings before connecting. Click 'Save Settings' first."
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="'Authorization failed'"
                secondary="Ensure you're using the correct Government Gateway account with access to your PAYE scheme."
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="'Token expired'"
                secondary="Click 'Refresh Token' to automatically renew your connection. No need to re-authorize."
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="'PAYE Reference format incorrect'"
                secondary="Check the format: ###/AB###### (e.g., 123/AB45678). No spaces allowed."
              />
            </ListItem>
          </List>

          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              ✅ Success Checklist
            </Typography>
            <Typography variant="body2" component="div">
              • Selected configuration level<br />
              • Entered PAYE Reference<br />
              • Entered Accounts Office Reference<br />
              • Saved settings<br />
              • Connected to HMRC<br />
              • Authorized the application<br />
              • See "Connected" status
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setHelpDialogOpen(false)
              // Scroll to connection section
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            Got It - Let's Connect!
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default HMRCSettingsTab

