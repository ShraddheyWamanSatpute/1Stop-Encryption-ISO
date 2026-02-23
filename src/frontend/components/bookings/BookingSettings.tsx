import type React from "react";
import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  CardHeader,
  Alert,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Link,
} from "@mui/material";
import {
  Save as SaveIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  AccessTime as AccessTimeIcon,
  Email as EmailIcon,
  Help as HelpIcon,
  VpnKey as VpnKeyIcon,
  OpenInNew as OpenInNewIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { APP_KEYS } from "../../../config/keys";
import { useBookings as useBookingsContext, BookingSettings as BackendBookingSettings } from "../../../backend/context/BookingsContext";
import type { SelectChangeEvent } from "@mui/material";
import { ref, get, set } from 'firebase/database';
import { db, auth } from '../../../backend/services/Firebase';


const defaultBusinessHours = [
  { day: "Monday", closed: false, open: "09:00", close: "17:00" },
  { day: "Tuesday", closed: false, open: "09:00", close: "17:00" },
  { day: "Wednesday", closed: false, open: "09:00", close: "17:00" },
  { day: "Thursday", closed: false, open: "09:00", close: "17:00" },
  { day: "Friday", closed: false, open: "09:00", close: "17:00" },
  { day: "Saturday", closed: false, open: "10:00", close: "16:00" },
  { day: "Sunday", closed: true, open: "10:00", close: "16:00" },
];

// Use the backend interface directly
type BookingSettingsState = BackendBookingSettings;

const BookingSettings: React.FC = () => {
  const { 
    bookingSettings,
    fetchBookingSettings,
    updateBookingSettings,
    loading,
    error: contextError,
    companyID,
    siteID,
    subsiteID
  } = useBookingsContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newBlackoutDate, setNewBlackoutDate] = useState("");
  const [newBlackoutReason, setNewBlackoutReason] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [gmailEmail, setGmailEmail] = useState("");
  const [gmailAppPassword, setGmailAppPassword] = useState("");
  const [senderName, setSenderName] = useState("1Stop Booking System");
  const [savingEmailConfig, setSavingEmailConfig] = useState(false);
  const [showAppPasswordHelp, setShowAppPasswordHelp] = useState(false);

  // Save email configuration
  const handleSaveEmailConfig = async () => {
    if (!gmailEmail || !gmailAppPassword) {
      setError('Please enter both Gmail address and App Password');
      return;
    }

    setSavingEmailConfig(true);
    setError(null);

    try {
      const configPath = `companies/${companyID}/sites/${siteID || 'default'}/subsites/${subsiteID || 'default'}/emailConfig`;
      const configRef = ref(db, configPath);
      
      await set(configRef, {
        email: gmailEmail,
        appPassword: gmailAppPassword,
        senderName: senderName || '1Stop System',
        updatedAt: Date.now()
      });

      setSuccess('Email configuration saved successfully!');
    } catch (error: any) {
      console.error('Error saving email config:', error);
      setError(`Failed to save configuration: ${error.message}`);
    } finally {
      setSavingEmailConfig(false);
    }
  };

  // Load email configuration
  const loadEmailConfig = async () => {
    try {
      const configPath = `companies/${companyID}/sites/${siteID || 'default'}/subsites/${subsiteID || 'default'}/emailConfig`;
      const configRef = ref(db, configPath);
      const snapshot = await get(configRef);
      
      if (snapshot.exists()) {
        const config = snapshot.val();
        setGmailEmail(config.email || '');
        setGmailAppPassword(config.appPassword || '');
        setSenderName(config.senderName || '1Stop System');
      }
    } catch (error) {
      console.error('Error loading email config:', error);
    }
  };

  // Send test email
  const handleSendTestEmail = async () => {
    if (!testEmail) {
      setError('Please enter an email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setSendingTestEmail(true);
    setError(null);
    setSuccess(null);

    try {
      const projectId = APP_KEYS.firebase.projectId;
      if (!projectId) {
        setError('Firebase project ID not configured. Set VITE_FIREBASE_PROJECT_ID in .env');
        return;
      }
      const region = "us-central1";
      const fnBase = `https://${region}-${projectId}.cloudfunctions.net`;
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setError('You must be signed in to send test emails');
        return;
      }
      
      const response = await fetch(`${fnBase}/sendEmailWithGmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientEmail: testEmail,
          subject: 'Test Email from 1Stop System',
          body: `Hello,\n\nThis is a test email from your 1Stop booking system.\n\nSent at: ${new Date().toLocaleString()}\n\nIf you received this email, your email integration is working properly!\n\nBest regards,\n1Stop Team`,
          companyId: companyID || 'unknown-company',
          siteId: siteID || 'default',
          subsiteId: subsiteID || 'default'
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || `Test email sent successfully to ${testEmail}!`);
        setTestEmail('');
      } else {
        setError(data.error || 'Failed to send test email');
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      setError(`Failed to send test email: ${error.message || 'Unknown error'}`);
    } finally {
      setSendingTestEmail(false);
    }
  };

  const [settings, setSettings] = useState<BookingSettingsState>({
    openTimes: {},
    bookingTypes: {},
    businessHours: defaultBusinessHours,
    blackoutDates: [],
    allowOnlineBookings: true,
    maxDaysInAdvance: 30,
    minHoursInAdvance: 1,
    timeSlotInterval: 30,
    defaultDuration: 120,
    maxPartySize: 20,
    cancellationPolicy: "24 hours notice required.",
    confirmationEmailTemplate: "Thank you for your booking!",
    reminderEmailTemplate: "This is a reminder about your upcoming booking.",
    contactEmailProvider: "gmail",
    contactEmailAddress: "",
    googleClientId: "",
    googleClientSecret: "",
    googleRedirectUri: "",
    outlookClientId: "",
    outlookClientSecret: "",
    outlookRedirectUri: "",
    gmailConnected: false,
    outlookConnected: false,
    predefinedEmailTemplates: [],
  });

  useEffect(() => {
    // Load settings from context when component mounts
    loadSettings();
    
    // Load email configuration
    loadEmailConfig();
    
    // Handle OAuth callback
    handleOAuthCallback();
  }, [fetchBookingSettings]);

  // Handle OAuth callback when user returns from OAuth provider
  const handleOAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    const provider = urlParams.get('provider');
    
    if (error) {
      setError(`OAuth error: ${error}`);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    if (success === 'true' && provider) {
      if (provider === 'gmail') {
        setSuccess('Gmail account connected successfully!');
        setSettings(prev => {
          const updatedSettings = { ...prev, gmailConnected: true, contactEmailProvider: 'gmail' as const };
          // Auto-save the Gmail connection status and set as default provider
          updateBookingSettings(updatedSettings).catch(console.error);
          return updatedSettings;
        });
      } else if (provider === 'outlook') {
        setSuccess('Outlook account connected successfully!');
        setSettings(prev => {
          const updatedSettings = { ...prev, outlookConnected: true, contactEmailProvider: 'outlook' as const };
          // Auto-save the Outlook connection status and set as default provider
          updateBookingSettings(updatedSettings).catch(console.error);
          return updatedSettings;
        });
      }
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Also check for traditional OAuth callback parameters
    if (code && state) {
      const sessionProvider = sessionStorage.getItem('oauth_provider');
      
      if (sessionProvider === 'gmail' && state.includes('gmail')) {
        setSuccess('Gmail account connected successfully!');
        setSettings(prev => {
          const updatedSettings = { ...prev, gmailConnected: true, contactEmailProvider: 'gmail' as const };
          // Auto-save the Gmail connection status and set as default provider
          updateBookingSettings(updatedSettings).catch(console.error);
          return updatedSettings;
        });
        
      } else if (sessionProvider === 'outlook' && state.includes('outlook')) {
        setSuccess('Outlook account connected successfully!');
        setSettings(prev => {
          const updatedSettings = { ...prev, outlookConnected: true, contactEmailProvider: 'outlook' as const };
          // Auto-save the Outlook connection status and set as default provider
          updateBookingSettings(updatedSettings).catch(console.error);
          return updatedSettings;
        });
      }
      
      // Clean up session storage and URL parameters
      sessionStorage.removeItem('oauth_provider');
      sessionStorage.removeItem('oauth_return_path');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Load settings from context when available
  const loadSettings = async () => {
    try {
      await fetchBookingSettings();
    } catch (error) {
      console.error("Error loading booking settings:", error);
      setError("Failed to load settings. Please try again.");
    }
  };

  // Update local state when context settings change
  useEffect(() => {
    if (bookingSettings) {
      setSettings({
        openTimes: bookingSettings.openTimes ?? {},
        bookingTypes: bookingSettings.bookingTypes ?? {},
        businessHours: bookingSettings.businessHours ?? defaultBusinessHours,
        blackoutDates: bookingSettings.blackoutDates ?? [],
        allowOnlineBookings: bookingSettings.allowOnlineBookings ?? true,
        maxDaysInAdvance: bookingSettings.maxDaysInAdvance ?? 30,
        minHoursInAdvance: bookingSettings.minHoursInAdvance ?? 1,
        timeSlotInterval: bookingSettings.timeSlotInterval ?? 30,
        defaultDuration: bookingSettings.defaultDuration ?? 120,
        maxPartySize: bookingSettings.maxPartySize ?? 20,
        cancellationPolicy: bookingSettings.cancellationPolicy ?? "24 hours notice required.",
        confirmationEmailTemplate: bookingSettings.confirmationEmailTemplate ?? "Thank you for your booking!",
        reminderEmailTemplate: bookingSettings.reminderEmailTemplate ?? "This is a reminder about your upcoming booking.",
        contactEmailProvider: bookingSettings.contactEmailProvider ?? "gmail",
        contactEmailAddress: bookingSettings.contactEmailAddress ?? "",
        googleClientId: bookingSettings.googleClientId ?? "",
        googleClientSecret: bookingSettings.googleClientSecret ?? "",
        googleRedirectUri: bookingSettings.googleRedirectUri ?? "",
        outlookClientId: bookingSettings.outlookClientId ?? "",
        outlookClientSecret: bookingSettings.outlookClientSecret ?? "",
        outlookRedirectUri: bookingSettings.outlookRedirectUri ?? "",
        gmailConnected: bookingSettings.gmailConnected ?? false,
        outlookConnected: bookingSettings.outlookConnected ?? false,
        predefinedEmailTemplates: bookingSettings.predefinedEmailTemplates ?? [],
      });
    }
  }, [bookingSettings]);

  // Listen for OAuth success messages from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'OAUTH_SUCCESS') {
        const { provider } = event.data;
        setSuccess(`${provider} account connected successfully!`);
        
        // Update the connected status
        if (provider === 'gmail') {
          setSettings(prev => {
            const updatedSettings = { ...prev, gmailConnected: true, contactEmailProvider: 'gmail' as const };
            // Auto-save the Gmail connection status and set as default provider
            updateBookingSettings(updatedSettings).catch(console.error);
            return updatedSettings;
          });
        } else if (provider === 'outlook') {
          setSettings(prev => {
            const updatedSettings = { ...prev, outlookConnected: true, contactEmailProvider: 'outlook' as const };
            // Auto-save the Outlook connection status and set as default provider
            updateBookingSettings(updatedSettings).catch(console.error);
            return updatedSettings;
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    if (name) {
      setSettings((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const handleBusinessHourChange = (
    dayName: string,
    field: string,
    value: string | boolean
  ) => {
    const currentHours = settings.businessHours || [];
    const dayIndex = currentHours.findIndex(h => h && h.day === dayName);
    
    let updatedHours;
    if (dayIndex >= 0) {
      // Update existing day
      updatedHours = [...currentHours];
      updatedHours[dayIndex] = { ...updatedHours[dayIndex], [field]: value };
    } else {
      // Add new day entry
      const newDayEntry = {
        day: dayName,
        closed: field === 'closed' ? value as boolean : false,
        open: field === 'open' ? value as string : '09:00',
        close: field === 'close' ? value as string : '17:00',
        ...(dayName === 'Saturday' && { closed: false, open: '10:00', close: '16:00' }),
        ...(dayName === 'Sunday' && { closed: true, open: '10:00', close: '16:00' })
      };
      updatedHours = [...currentHours, newDayEntry];
    }
    
    setSettings((prev) => ({ ...prev, businessHours: updatedHours }));
  };

  const handleAddBlackoutDate = () => {
    if (!newBlackoutDate) return;

    const newBlackout = {
      date: newBlackoutDate,
      reason: newBlackoutReason || "Unavailable",
    };

    setSettings((prev) => ({
      ...prev,
      blackoutDates: [...(prev.blackoutDates || []), newBlackout],
    }));

    setNewBlackoutDate("");
    setNewBlackoutReason("");
  };

  const handleRemoveBlackoutDate = (index: number) => {
    const updatedBlackoutDates = [...(settings.blackoutDates || [])];
    updatedBlackoutDates.splice(index, 1);
    setSettings((prev) => ({ ...prev, blackoutDates: updatedBlackoutDates }));
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Currently editing, save the changes
      handleSaveSettings();
    } else {
      // Not editing, enter edit mode
      setIsEditing(true);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Save settings through context - settings already matches BackendBookingSettings interface
      await updateBookingSettings(settings);
      setSuccess("Settings saved successfully");
      setIsEditing(false); // Exit edit mode after successful save
    } catch (error) {
      console.error("Error saving booking settings:", error);
      setError("Failed to save settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Normalize business hours for rendering to avoid undefined entries
  const businessHoursList = useMemo(() => {
    const v: any = (settings as any)?.businessHours
    let arr: any[] = []
    if (Array.isArray(v)) arr = v
    else if (v && typeof v === 'object') arr = Object.values(v)
    
    // Always ensure we have all 7 days, using defaultBusinessHours as fallback
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    return daysOfWeek.map((dayName, idx) => {
      // Try to find existing hours for this day
      const existingHours = arr.find((h: any) => h && h.day === dayName)
      const defaultHours = defaultBusinessHours[idx]
      
      if (existingHours && typeof existingHours === 'object') {
        return {
          day: existingHours.day || dayName,
          closed: typeof existingHours.closed === 'boolean' ? existingHours.closed : false,
          open: existingHours.open || defaultHours?.open || '09:00',
          close: existingHours.close || defaultHours?.close || '17:00',
        }
      }
      
      // Use default hours for this day
      return {
        day: dayName,
        closed: defaultHours?.closed || false,
        open: defaultHours?.open || '09:00',
        close: defaultHours?.close || '17:00',
      }
    })
  }, [settings.businessHours])

  // Show loading state when context is loading
  if (loading && !bookingSettings) {
  return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccess(null)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {success}
        </Alert>
      </Snackbar>

      {(error || contextError) && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error || contextError}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* General Settings */}
        <Grid item xs={12}>
          <Card sx={{ 
            height: '100%',
            borderRadius: 3,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4
            },
            transition: 'all 0.3s ease-in-out'
          }}>
            <CardHeader
              title="General Settings"
              avatar={<SettingsIcon color="primary" />}
              titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
              action={
                <Button
                  variant="contained"
                  startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
                  onClick={handleEditToggle}
                  disabled={isLoading || loading}
                  size="small"
                  color={isEditing ? "success" : "primary"}
                >
                  {isEditing ? "Save Settings" : "Edit Settings"}
                </Button>
              }
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 1 }}>
              <Grid container spacing={3}>
                {/* Basic Settings Section */}
                <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.allowOnlineBookings}
                        onChange={handleSwitchChange}
                        name="allowOnlineBookings"
                            disabled={!isEditing}
                      />
                    }
                    label="Allow Online Bookings"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Max Days in Advance"
                    name="maxDaysInAdvance"
                    type="number"
                    value={settings.maxDaysInAdvance}
                    onChange={handleInputChange}
                    fullWidth
                        size="small"
                    inputProps={{ min: 1 }}
                        disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Min Hours in Advance"
                    name="minHoursInAdvance"
                    type="number"
                    value={settings.minHoursInAdvance}
                    onChange={handleInputChange}
                    fullWidth
                        size="small"
                    inputProps={{ min: 0 }}
                        disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                        label="Time Slot Interval (min)"
                    name="timeSlotInterval"
                    type="number"
                    value={settings.timeSlotInterval}
                    onChange={handleInputChange}
                    fullWidth
                        size="small"
                    inputProps={{ min: 15, step: 15 }}
                        disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                        label="Default Duration (min)"
                    name="defaultDuration"
                    type="number"
                    value={settings.defaultDuration}
                    onChange={handleInputChange}
                    fullWidth
                        size="small"
                    inputProps={{ min: 30, step: 15 }}
                        disabled={!isEditing}
                  />
                </Grid>
                    <Grid item xs={12}>
                  <TextField
                    label="Maximum Party Size"
                    name="maxPartySize"
                    type="number"
                    value={settings.maxPartySize}
                    onChange={handleInputChange}
                    fullWidth
                        size="small"
                    inputProps={{ min: 1 }}
                        disabled={!isEditing}
                  />
                </Grid>
                </Grid>
        </Grid>

                {/* Gmail App Password Configuration */}
        <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Box sx={{ 
                        p: 3, 
                        border: '2px solid', 
                        borderColor: 'primary.light', 
                        borderRadius: 3,
                        bgcolor: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)',
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            📧 Gmail Configuration (Simple & Secure)
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<HelpIcon />}
                            onClick={() => setShowAppPasswordHelp(true)}
                            sx={{ textTransform: 'none' }}
                          >
                            How to get App Password?
                          </Button>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Enter your Gmail address and App Password to send emails from your booking system.
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Gmail Address"
                              value={gmailEmail}
                              onChange={(e) => setGmailEmail(e.target.value)}
                              placeholder="your-email@gmail.com"
                              size="small"
                              fullWidth
                              type="email"
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Gmail App Password"
                              value={gmailAppPassword}
                              onChange={(e) => setGmailAppPassword(e.target.value)}
                              placeholder="16-character app password"
                              size="small"
                              fullWidth
                              type="password"
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Sender Name"
                              value={senderName}
                              onChange={(e) => setSenderName(e.target.value)}
                              placeholder="1Stop System"
                              size="small"
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Button
                              variant="contained"
                              onClick={handleSaveEmailConfig}
                              disabled={savingEmailConfig || !gmailEmail || !gmailAppPassword}
                              startIcon={savingEmailConfig ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                            >
                              {savingEmailConfig ? 'Saving...' : 'Save Email Configuration'}
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>

                    {/* Test Email Section */}
                    <Grid item xs={12}>
                      <Box sx={{ 
                        p: 3, 
                        border: '2px solid', 
                        borderColor: 'success.light', 
                        borderRadius: 3,
                        bgcolor: 'linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%)',
                      }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                          ✉️ Send Test Email
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Test your email configuration by sending a test email
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                          <TextField
                            label="Recipient Email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder="Enter email address to test"
                            size="small"
                            fullWidth
                            disabled={sendingTestEmail}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSendTestEmail();
                              }
                            }}
                          />
                          <Button
                            variant="contained"
                            color="success"
                            onClick={handleSendTestEmail}
                            disabled={sendingTestEmail || !testEmail || !gmailEmail}
                            startIcon={sendingTestEmail ? <CircularProgress size={16} color="inherit" /> : <EmailIcon />}
                            sx={{ minWidth: '120px', whiteSpace: 'nowrap' }}
                          >
                            {sendingTestEmail ? 'Sending...' : 'Send Test'}
                          </Button>
                        </Box>
                        {!gmailEmail && (
                          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                            Please configure your Gmail settings above first
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                      </Grid>
                </Grid>

                {/* Cancellation Policy Section */}
                <Grid item xs={12}>
                  <TextField
                    label="Cancellation Policy"
                    name="cancellationPolicy"
                    value={settings.cancellationPolicy}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    multiline
                    rows={3}
                    disabled={!isEditing}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
              </Grid>

            </CardContent>
          </Card>
        </Grid>


        {/* Business Hours */}
        <Grid item xs={12}>
          <Card sx={{ 
            height: '100%',
            borderRadius: 3,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4
            },
            transition: 'all 0.3s ease-in-out'
          }}>
            <CardHeader
              title="Business Hours"
              avatar={<AccessTimeIcon color="primary" />}
              titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                {businessHoursList.map((hours, index) => (
                  <Grid item xs={12} sm={6} md={3} lg={2} key={index}>
                    <Paper sx={{ 
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: hours.closed ? 'error.light' : 'success.light',
                      bgcolor: hours.closed ? 'error.50' : 'success.50',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      }
                    }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ 
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: hours.closed ? 'error.main' : 'success.main'
                        }}>
                          {hours.day}
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={!hours.closed}
                              onChange={(e) =>
                                handleBusinessHourChange(
                                  hours.day,
                                  "closed",
                                  !e.target.checked
                                )
                              }
                              size="small"
                              color={hours.closed ? 'error' : 'success'}
                              disabled={!isEditing}
                            />
                          }
                          label=""
                          sx={{ m: 0 }}
                        />
                      </Box>
                      {!hours.closed ? (
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <TextField 
                            label="Open" 
                            type="time" 
                            value={hours.open || "09:00"} 
                            onChange={(e) => handleBusinessHourChange(hours.day, "open", e.target.value)} 
                            InputLabelProps={{ shrink: true }} 
                            fullWidth 
                            size="small"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5
                              }
                            }}
                          />
                          <TextField 
                            label="Close" 
                            type="time" 
                            value={hours.close || "17:00"} 
                            onChange={(e) => handleBusinessHourChange(hours.day, "close", e.target.value)} 
                            InputLabelProps={{ shrink: true }} 
                            fullWidth 
                            size="small"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5
                              }
                            }}
                          />
                        </Box>
                      ) : (
                        <Typography variant="body2" color="error.main" sx={{ 
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          textAlign: 'center',
                          py: 1
                        }}>
                          Closed
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Blackout Dates */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ 
            height: '100%',
            borderRadius: 3,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4
            },
            transition: 'all 0.3s ease-in-out'
          }}>
            <CardHeader
              title="Unavailable Dates"
              avatar={<AccessTimeIcon color="primary" />}
              titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 1 }}>
              <Box sx={{ 
                p: 3, 
                border: '2px solid', 
                borderColor: 'primary.light', 
                borderRadius: 3,
                bgcolor: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)',
                mb: 3,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: 'primary.main', 
                    borderRadius: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mr: 2
                  }}>
                    <AddIcon sx={{ color: 'white', fontSize: '1.2rem' }} />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'primary.main' }}>
                    Add New Unavailable Date
                  </Typography>
                </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={5}>
                  <TextField
                      label="Select Date"
                    type="date"
                    value={newBlackoutDate}
                    onChange={(e) => setNewBlackoutDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                      size="small"
                      disabled={!isEditing}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          bgcolor: 'white',
                          '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'primary.main',
                            }
                          }
                        }
                      }}
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                      label="Reason (Optional)"
                    value={newBlackoutReason}
                    onChange={(e) => setNewBlackoutReason(e.target.value)}
                    fullWidth
                      size="small"
                      placeholder="e.g., Holiday, Maintenance, Private Event"
                      disabled={!isEditing}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          bgcolor: 'white',
                          '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'primary.main',
                            }
                          }
                        }
                      }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button
                    variant="contained"
                    onClick={handleAddBlackoutDate}
                      disabled={!newBlackoutDate || !isEditing}
                    fullWidth
                      size="small"
                      sx={{ 
                        height: "40px",
                        borderRadius: 2,
                        bgcolor: 'primary.main',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                          transform: 'translateY(-1px)',
                          boxShadow: 2
                        },
                        '&:disabled': {
                          bgcolor: 'grey.300',
                          color: 'grey.500'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                  >
                    <AddIcon />
                  </Button>
                </Grid>
              </Grid>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  width: 28, 
                  height: 28, 
                  bgcolor: 'warning.main', 
                  borderRadius: 1.5, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mr: 2
                }}>
                  <Typography sx={{ color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {settings.blackoutDates?.length || 0}
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'primary.main' }}>
                  Current Unavailable Dates ({settings.blackoutDates?.length || 0})
                </Typography>
              </Box>
                {settings.blackoutDates && settings.blackoutDates.length > 0 ? (
                <Grid container spacing={2}>
                  {settings.blackoutDates.map((blackout, index) => (
                    <Grid item xs={12} key={index}>
                      <Paper sx={{ 
                        p: 2.5,
                        border: '2px solid',
                        borderColor: 'warning.light',
                        bgcolor: 'linear-gradient(135deg, #fff8e1 0%, #ffffff 100%)',
                        borderRadius: 3,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 3,
                          borderColor: 'warning.main'
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          background: 'linear-gradient(90deg, #ff9800 0%, #ffc107 100%)',
                        }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ 
                            width: 40, 
                            height: 40, 
                            bgcolor: 'warning.main', 
                            borderRadius: 2, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            mr: 2
                          }}>
                            <Typography sx={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>
                              {new Date(blackout.date).getDate()}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.dark', mb: 0.5 }}>
                              {new Date(blackout.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                              {blackout.reason || 'No reason specified'}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton
                          onClick={() => handleRemoveBlackoutDate(index)}
                          sx={{ 
                            color: 'error.main',
                            bgcolor: 'error.50',
                            '&:hover': {
                              bgcolor: 'error.main',
                              color: 'white',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease-in-out'
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: 'grey.300',
                  borderRadius: 3,
                  bgcolor: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <Box sx={{ 
                    width: 60, 
                    height: 60, 
                    bgcolor: 'grey.200', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2
                  }}>
                    <Typography sx={{ color: 'grey.500', fontSize: '1.5rem' }}>📅</Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
                    No unavailable dates configured
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Add dates when bookings should be unavailable
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Email Templates */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ 
            height: '100%',
            borderRadius: 3,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4
            },
            transition: 'all 0.3s ease-in-out'
          }}>
            <CardHeader
              title="Email Templates"
              avatar={<EmailIcon color="primary" />}
              titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: 'success.main', 
                  borderRadius: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mr: 2
                }}>
                  <EmailIcon sx={{ color: 'white', fontSize: '1.2rem' }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'primary.main' }}>
                  Custom Email Templates ({settings.predefinedEmailTemplates?.length || 0})
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  {(settings.predefinedEmailTemplates || []).map((tpl, idx) => (
                    <Paper key={tpl.id || idx} sx={{ 
                      p: 3, 
                      mb: 3,
                      border: '2px solid',
                      borderColor: 'success.light',
                      borderRadius: 3,
                      bgcolor: 'linear-gradient(135deg, #f1f8e9 0%, #ffffff 100%)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4,
                        borderColor: 'success.main'
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #4caf50 0%, #8bc34a 100%)',
                      }
                    }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ 
                          width: 40, 
                          height: 40, 
                          bgcolor: 'success.main', 
                          borderRadius: 2, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          mr: 1
                        }}>
                          <Typography sx={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>
                            {idx + 1}
                          </Typography>
                        </Box>
                        <TextField 
                          label="Template Name" 
                          value={tpl.name} 
                          onChange={(e) => {
                            const next = [...(settings.predefinedEmailTemplates || [])]
                        next[idx] = { ...tpl, name: e.target.value }
                            setSettings(prev => ({ ...prev, predefinedEmailTemplates: next }))
                          }} 
                          size="small" 
                          placeholder="e.g., Welcome Email, Follow-up"
                          sx={{ 
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              bgcolor: 'white',
                              '&:hover': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'success.main',
                                }
                              }
                            }
                          }} 
                        />
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            const next = (settings.predefinedEmailTemplates || []).filter((_, i) => i !== idx)
                            setSettings(prev => ({ ...prev, predefinedEmailTemplates: next }))
                          }}
                          sx={{ 
                            color: 'error.main',
                            bgcolor: 'error.50',
                            '&:hover': {
                              bgcolor: 'error.main',
                              color: 'white',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease-in-out'
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField 
                            label="Subject Line" 
                            value={tpl.subject} 
                            onChange={(e) => {
                              const next = [...(settings.predefinedEmailTemplates || [])]
                        next[idx] = { ...tpl, subject: e.target.value }
                              setSettings(prev => ({ ...prev, predefinedEmailTemplates: next }))
                            }} 
                            size="small" 
                            fullWidth
                            placeholder="Enter email subject line"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: 'white',
                                '&:hover': {
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'success.main',
                                  }
                                }
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField 
                            label="Email Body" 
                            value={tpl.body} 
                            onChange={(e) => {
                              const next = [...(settings.predefinedEmailTemplates || [])]
                        next[idx] = { ...tpl, body: e.target.value }
                              setSettings(prev => ({ ...prev, predefinedEmailTemplates: next }))
                            }} 
                            size="small" 
                            fullWidth
                            multiline 
                            minRows={4}
                            placeholder="Enter your email content here..."
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: 'white',
                                '&:hover': {
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'success.main',
                                  }
                                }
                              }
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  <Box sx={{ 
                    p: 3, 
                    border: '2px dashed', 
                    borderColor: 'success.light',
                    borderRadius: 3,
                    bgcolor: 'linear-gradient(135deg, #f1f8e9 0%, #ffffff 100%)',
                    textAlign: 'center',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: 'success.main',
                      bgcolor: 'success.50'
                    }
                  }}>
                    <Button 
                      startIcon={<AddIcon />} 
                      size="medium" 
                      variant="outlined"
                      onClick={() => setSettings(prev => ({ ...prev, predefinedEmailTemplates: [...(prev.predefinedEmailTemplates || []), { name: '', subject: '', body: '' }] }))}
                      sx={{
                        borderRadius: 2,
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        borderColor: 'success.main',
                        color: 'success.main',
                        px: 3,
                        py: 1,
                        '&:hover': {
                          borderStyle: 'solid',
                          bgcolor: 'success.main',
                          color: 'white',
                          transform: 'translateY(-1px)',
                          boxShadow: 2
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      Add New Email Template
                    </Button>
                  </Box>
                </Grid>
              </Grid>
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontSize: '0.875rem', fontWeight: 600, color: 'primary.main' }}>
                  Default Email Templates
                </Typography>
                <Accordion sx={{ 
                  mb: 1,
                  borderRadius: 2,
                  '&:before': {
                    display: 'none',
                  },
                  '&.Mui-expanded': {
                    margin: 0,
                  }
                }}>
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      borderRadius: 2,
                      '&.Mui-expanded': {
                        minHeight: 48,
                      }
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      Confirmation Email Template
                    </Typography>
                </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                  <TextField
                    name="confirmationEmailTemplate"
                    value={settings.confirmationEmailTemplate}
                    onChange={handleInputChange}
                    fullWidth
                      size="small"
                    multiline
                      rows={3}
                      disabled={!isEditing}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                      sx={{ mt: 1, display: "block", fontSize: '0.7rem' }}
                  >
                    Available variables: {"{restaurant}"}, {"{date}"},{" "}
                    {"{time}"}, {"{guests}"}, {"{name}"}
                  </Typography>
                </AccordionDetails>
              </Accordion>
                <Accordion sx={{ 
                  borderRadius: 2,
                  '&:before': {
                    display: 'none',
                  },
                  '&.Mui-expanded': {
                    margin: 0,
                  }
                }}>
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      borderRadius: 2,
                      '&.Mui-expanded': {
                        minHeight: 48,
                      }
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      Reminder Email Template
                    </Typography>
                </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                  <TextField
                    name="reminderEmailTemplate"
                    value={settings.reminderEmailTemplate}
                    onChange={handleInputChange}
                    fullWidth
                      size="small"
                    multiline
                      rows={3}
                      disabled={!isEditing}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                      sx={{ mt: 1, display: "block", fontSize: '0.7rem' }}
                  >
                    Available variables: {"{restaurant}"}, {"{date}"},{" "}
                    {"{time}"}, {"{guests}"}, {"{name}"}
                  </Typography>
                </AccordionDetails>
              </Accordion>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gmail App Password Help Modal */}
      <Dialog 
        open={showAppPasswordHelp} 
        onClose={() => setShowAppPasswordHelp(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <VpnKeyIcon />
          How to Get Gmail App Password
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            An App Password is a 16-character code that lets your booking system send emails through your Gmail account. It's different from your regular Gmail password and more secure!
          </Alert>

          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" />
            Step-by-Step Guide
          </Typography>

          <List>
            <ListItem sx={{ display: 'list-item', listStyleType: 'decimal', ml: 2 }}>
              <ListItemText
                primary={<Typography variant="subtitle1" fontWeight={600}>Enable 2-Step Verification (if not already enabled)</Typography>}
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      App Passwords require 2-Step Verification to be turned on.
                    </Typography>
                    <Link 
                      href="https://myaccount.google.com/security" 
                      target="_blank" 
                      rel="noopener"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      Open Google Security Settings <OpenInNewIcon fontSize="small" />
                    </Link>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      → Click "2-Step Verification" and follow the setup
                    </Typography>
                  </Box>
                }
              />
            </ListItem>

            <ListItem sx={{ display: 'list-item', listStyleType: 'decimal', ml: 2 }}>
              <ListItemText
                primary={<Typography variant="subtitle1" fontWeight={600}>Go to App Passwords Page</Typography>}
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Link 
                      href="https://myaccount.google.com/apppasswords" 
                      target="_blank" 
                      rel="noopener"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}
                    >
                      Open App Passwords Page <OpenInNewIcon fontSize="small" />
                    </Link>
                    <Typography variant="body2" color="text.secondary">
                      Or manually: Go to your Google Account → Security → App passwords
                    </Typography>
                  </Box>
                }
              />
            </ListItem>

            <ListItem sx={{ display: 'list-item', listStyleType: 'decimal', ml: 2 }}>
              <ListItemText
                primary={<Typography variant="subtitle1" fontWeight={600}>Create an App Password</Typography>}
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      • In the "App name" field, type: <strong>1Stop Booking System</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      • Click <strong>"Create"</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Google will show a 16-character password like: <code>abcd efgh ijkl mnop</code>
                    </Typography>
                  </Box>
                }
              />
            </ListItem>

            <ListItem sx={{ display: 'list-item', listStyleType: 'decimal', ml: 2 }}>
              <ListItemText
                primary={<Typography variant="subtitle1" fontWeight={600}>Copy and Use</Typography>}
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      • <strong>Copy the 16-character password</strong> (you'll only see it once!)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      • Remove spaces: <code>abcdefghijklmnop</code>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Paste it into the "Gmail App Password" field above
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          </List>

          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              ✅ That's it! Click "Save Email Configuration" and you're ready to send emails!
            </Typography>
          </Alert>

          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              💡 Quick Tips:
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              • The App Password is <strong>different</strong> from your regular Gmail password
              • You can revoke it anytime from the App Passwords page
              • It only allows sending emails, not access to your account
              • Each app should have its own unique App Password
            </Typography>
          </Box>

          <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom color="warning.dark">
              ⚠️ Troubleshooting:
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              • <strong>"Can't find App Passwords?"</strong> → Enable 2-Step Verification first
              • <strong>"Authentication failed?"</strong> → Remove spaces from the password
              • <strong>"Invalid password?"</strong> → Generate a new App Password
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowAppPasswordHelp(false)} variant="contained">
            Got it!
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default BookingSettings;
