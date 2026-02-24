"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Snackbar,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  IconButton,
} from "@mui/material"
import {
  Edit,
  Save,
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  AccountBalance as BankIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  PrivacyTip as PrivacyIcon,
} from "@mui/icons-material"
import { useSettings } from "../../backend/context/SettingsContext"
import { useNavigate, useLocation } from "react-router-dom"
import GDPRPrivacyTab from "../components/settings/GDPRPrivacyTab"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
      style={{ height: "100%", display: value === index ? "flex" : "none", flexDirection: "column" }}
    >
      {value === index && <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    "aria-controls": `settings-tabpanel-${index}`,
  }
}

const Settings = () => {
  const { state, updatePersonal, updatePreferences, refreshSettings, updateAvatar } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()

  const tabsConfig = useMemo(
    () => [
      { label: "Personal Info", slug: "personal", icon: <PersonIcon /> },
      { label: "Account & Security", slug: "account", icon: <SecurityIcon /> },
      { label: "Preferences", slug: "preferences", icon: <NotificationsIcon /> },
      { label: "Companies", slug: "companies", icon: <BusinessIcon /> },
      { label: "Privacy & GDPR", slug: "privacy", icon: <PrivacyIcon /> },
    ],
    [],
  )

  const [activeTab, setActiveTab] = useState(0)
  const [isTabsExpanded, setIsTabsExpanded] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoRemoved, setPhotoRemoved] = useState(false)

  // Form state for personal info
  const [personalForm, setPersonalForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
  })

  // Form state for account & security
  const [accountForm, setAccountForm] = useState({
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    bankDetails: {
      accountHolderName: "",
      bankName: "",
      accountNumber: "",
      sortCode: "",
      iban: "",
    },
    niNumber: "",
    taxCode: "",
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
      email: "",
    },
  })

  // Form state for companies
  const [companies, setCompanies] = useState<any[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)

  // Form state for preferences
  const [preferencesForm, setPreferencesForm] = useState({
    theme: "light" as "light" | "dark",
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    // Extended notification preferences for all sections
    notificationPreferences: {
      // HR Section
      hr: {
        newEmployee: { email: true, push: true, sms: false },
        employeeUpdate: { email: true, push: false, sms: false },
        leaveRequest: { email: true, push: true, sms: false },
        shiftChange: { email: true, push: true, sms: false },
        payrollUpdate: { email: true, push: false, sms: false },
      },
      // Stock Section
      stock: {
        lowStock: { email: true, push: true, sms: false },
        stockUpdate: { email: true, push: false, sms: false },
        orderReceived: { email: true, push: true, sms: false },
        stockAlert: { email: true, push: true, sms: false },
      },
      // Finance Section
      finance: {
        invoiceCreated: { email: true, push: false, sms: false },
        paymentReceived: { email: true, push: true, sms: false },
        paymentDue: { email: true, push: true, sms: false },
        financialReport: { email: true, push: false, sms: false },
      },
      // Booking Section
      booking: {
        newBooking: { email: true, push: true, sms: false },
        bookingUpdate: { email: true, push: true, sms: false },
        bookingCancelled: { email: true, push: true, sms: false },
      },
      // System
      system: {
        systemNotifications: { email: true, push: false, sms: false },
        securityAlerts: { email: true, push: true, sms: true },
        maintenance: { email: true, push: false, sms: false },
      },
      // Marketing
      marketing: {
        promotions: { email: false, push: false, sms: false },
        newsletters: { email: false, push: false, sms: false },
      },
    },
    emailPreferences: {
      lowStock: true,
      orderUpdates: true,
      systemNotifications: true,
      marketing: false,
    },
    language: "en",
  })

  // Update form values when settings state changes
  useEffect(() => {
    if (!state.loading) {
      setPersonalForm({
        firstName: state.settings.personal.firstName || "",
        middleName: state.settings.personal.middleName || "",
        lastName: state.settings.personal.lastName || "",
        email: state.settings.personal.email || "",
        phone: state.settings.personal.phone || "",
      })
      
      // Set photo preview from avatar
      if (state.settings.personal.avatar) {
        setPhotoPreview(state.settings.personal.avatar)
      } else {
        setPhotoPreview(null)
      }
      setPhotoRemoved(false)

      setAccountForm({
        address: {
          street: state.settings.personal.address?.street || "",
          city: state.settings.personal.address?.city || "",
          state: state.settings.personal.address?.state || "",
          zipCode: state.settings.personal.address?.zipCode || "",
          country: state.settings.personal.address?.country || "",
        },
        bankDetails: {
          accountHolderName: state.settings.personal.bankDetails?.accountHolderName || "",
          bankName: state.settings.personal.bankDetails?.bankName || "",
          accountNumber: state.settings.personal.bankDetails?.accountNumber || "",
          sortCode: state.settings.personal.bankDetails?.sortCode || "",
          iban: state.settings.personal.bankDetails?.iban || "",
        },
        niNumber: state.settings.personal.niNumber || "",
        taxCode: state.settings.personal.taxCode || "",
        emergencyContact: {
          name: state.settings.personal.emergencyContact?.name || "",
          relationship: state.settings.personal.emergencyContact?.relationship || "",
          phone: state.settings.personal.emergencyContact?.phone || "",
          email: state.settings.personal.emergencyContact?.email || "",
        },
      })

      setPreferencesForm({
        theme: state.settings.preferences.theme,
        notifications: { ...state.settings.preferences.notifications },
        notificationPreferences: (state.settings.preferences as any).notificationPreferences || {
          hr: {
            newEmployee: { email: true, push: true, sms: false },
            employeeUpdate: { email: true, push: false, sms: false },
            leaveRequest: { email: true, push: true, sms: false },
            shiftChange: { email: true, push: true, sms: false },
            payrollUpdate: { email: true, push: false, sms: false },
          },
          stock: {
            lowStock: { email: true, push: true, sms: false },
            stockUpdate: { email: true, push: false, sms: false },
            orderReceived: { email: true, push: true, sms: false },
            stockAlert: { email: true, push: true, sms: false },
          },
          finance: {
            invoiceCreated: { email: true, push: false, sms: false },
            paymentReceived: { email: true, push: true, sms: false },
            paymentDue: { email: true, push: true, sms: false },
            financialReport: { email: true, push: false, sms: false },
          },
          booking: {
            newBooking: { email: true, push: true, sms: false },
            bookingUpdate: { email: true, push: true, sms: false },
            bookingCancelled: { email: true, push: true, sms: false },
          },
          system: {
            systemNotifications: { email: true, push: false, sms: false },
            securityAlerts: { email: true, push: true, sms: true },
            maintenance: { email: true, push: false, sms: false },
          },
          marketing: {
            promotions: { email: false, push: false, sms: false },
            newsletters: { email: false, push: false, sms: false },
          },
        },
        emailPreferences: { ...state.settings.preferences.emailPreferences },
        language: state.settings.preferences.language,
      })
    }
  }, [state.loading, state.settings])

  // Track if we've already refreshed settings for this session to prevent unnecessary refreshes
  const hasRefreshedRef = useRef<string>('')
  
  // Only refresh settings once per user/company combination, and only if settings aren't already loaded
  // This prevents unnecessary refreshes that cause app-wide re-renders (like Sidebar flashing)
  useEffect(() => {
    const refreshKey = `${state.auth.uid}-${state.user?.currentCompanyID}`
    
    // Skip if we've already refreshed for this user/company combination
    if (hasRefreshedRef.current === refreshKey) {
      return
    }
    
    // Only refresh if:
    // 1. We have auth and company ID
    // 2. Settings aren't currently loading
    // 3. Settings aren't already loaded (check if personal settings have meaningful data)
    if (state.auth.uid && state.user?.currentCompanyID && !state.loading) {
      // Check if settings are already loaded by checking if personal settings have data
      // Use a more specific check - if firstName exists and is not empty, settings are loaded
      const settingsLoaded = state.settings?.personal?.firstName && 
                            state.settings.personal.firstName.trim().length > 0
      
      if (!settingsLoaded) {
        // Settings not loaded, refresh them (but only once per user/company)
        hasRefreshedRef.current = refreshKey
        // Use a small delay to prevent blocking the initial render and reduce flash
        const timeoutId = setTimeout(() => {
          refreshSettings()
        }, 50)
        
        return () => clearTimeout(timeoutId)
      } else {
        // Settings already loaded, just mark as refreshed
        hasRefreshedRef.current = refreshKey
      }
    }
  }, [state.auth.uid, state.user?.currentCompanyID, state.loading, refreshSettings])

  const tabCount = tabsConfig.length

  useEffect(() => {
    if (activeTab >= tabCount) {
      setActiveTab(0)
    }
  }, [activeTab, tabCount])

  useEffect(() => {
    if (!tabCount) {
      return
    }

    const pathWithoutTrailingSlash = location.pathname.replace(/\/+$/, "")
    const segments = pathWithoutTrailingSlash.split("/").filter(Boolean)
    const settingsIndex = segments.findIndex((segment) => segment === "Settings" || segment === "settings")
    const tabSegment = settingsIndex !== -1 ? segments[settingsIndex + 1] : undefined

    const defaultSlug = tabsConfig[0]?.slug
    const slugToPascalPath = (slug: string) => {
      return slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("")
    }

    if (!tabSegment) {
      if (defaultSlug) {
        const defaultPath = `/Settings/${slugToPascalPath(defaultSlug)}`
        if (location.pathname !== defaultPath) {
          navigate(defaultPath, { replace: true })
        }
      }
      if (activeTab !== 0) {
        setActiveTab(0)
        setEditMode(false)
      }
      return
    }

    // Match tab by slug, handling both PascalCase paths and lowercase slugs
    const matchedIndex = tabsConfig.findIndex((tab) => {
      const pascalSlug = slugToPascalPath(tab.slug)
      return tab.slug === tabSegment || pascalSlug === tabSegment || tabSegment?.toLowerCase() === tab.slug
    })
    if (matchedIndex === -1) {
      if (defaultSlug) {
        const defaultPath = `/Settings/${slugToPascalPath(defaultSlug)}`
        if (location.pathname !== defaultPath) {
          navigate(defaultPath, { replace: true })
        }
      }
      if (activeTab !== 0) {
        setActiveTab(0)
        setEditMode(false)
      }
      return
    }

    if (matchedIndex !== activeTab) {
      setActiveTab(matchedIndex)
      setEditMode(false)
    }
  }, [activeTab, location.pathname, navigate, tabCount, tabsConfig])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setEditMode(false)
    const selectedTab = tabsConfig[newValue]
    if (!selectedTab) {
      return
    }

    const slugToPascalPath = (slug: string) => {
      return slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("")
    }
    const targetPath = `/Settings/${slugToPascalPath(selectedTab.slug)}`
    if (location.pathname !== targetPath) {
      navigate(targetPath)
    }
  }

  const toggleTabsExpanded = () => {
    setIsTabsExpanded(!isTabsExpanded)
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      // Determine which tab is active and save appropriate settings
      if (activeTab === 0) {
        // Personal info - upload photo if changed, or clear if removed
        if (photoFile) {
          const avatarUrl = await updateAvatar(photoFile)
          if (avatarUrl) {
            await updatePersonal({ ...personalForm, avatar: avatarUrl })
          } else {
            throw new Error("Failed to upload avatar")
          }
        } else if (photoRemoved) {
          // Photo was removed - clear avatar
          await updatePersonal({ ...personalForm, avatar: "" })
        } else {
          await updatePersonal(personalForm)
        }
      } else if (activeTab === 1) {
        // Account & Security settings
        await updatePersonal({ ...personalForm, ...accountForm })
      } else if (activeTab === 2) {
        // Preferences
        await updatePreferences(preferencesForm)
      }

      setSuccessMessage("Settings saved successfully")
      setEditMode(false)
      setPhotoFile(null) // Clear photo file after successful save
      setPhotoRemoved(false) // Reset photo removal flag
    } catch (error) {
      console.error("Error saving settings:", error)
      setErrorMessage("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  // Handle photo change
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrorMessage('Image size must be less than 5MB')
        return
      }
      
      setPhotoFile(file)
      setPhotoRemoved(false) // Reset removal flag when new photo is selected
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        setPhotoPreview(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setPhotoPreview(null)
    setPhotoFile(null)
    setPhotoRemoved(true)
    // Mark avatar for removal - will be cleared on save
  }

  const handleCloseSnackbar = () => {
    setSuccessMessage(null)
    setErrorMessage(null)
  }

  // Handle personal form changes
  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPersonalForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle account form changes
  const handleAccountChange = (section: string, field: string, value: string) => {
    if (section === "niNumber" || section === "taxCode") {
      // Handle top-level fields
      setAccountForm((prev) => ({
        ...prev,
        [section]: value,
      }))
    } else {
      // Handle nested object fields
      setAccountForm((prev) => ({
        ...prev,
        [section]: {
          ...(prev[section as keyof typeof prev] as object),
          [field]: value,
        },
      }))
    }
  }

  // Handle address autocomplete (Google Places integration)

  // Load user companies from SettingsContext
  const loadUserCompanies = async () => {
    setLoadingCompanies(true)
    try {
      // Get user companies from SettingsContext state
      if (state.user && state.user.companies) {
        const userCompanies = state.user.companies.map(company => ({
          id: company.companyID,
          name: company.companyName,
          role: company.role,
          department: company.department,
          joinedAt: new Date(company.joinedAt).toLocaleDateString(),
          status: company.isDefault ? "Default" : "Active",
        }))
        setCompanies(userCompanies)
        console.log("Loaded companies from SettingsContext:", userCompanies)
      } else {
        // If no companies in state, refresh settings to load from backend
        await refreshSettings()
        if (state.user && state.user.companies) {
          const userCompanies = state.user.companies.map(company => ({
            id: company.companyID,
            name: company.companyName,
            role: company.role,
            department: company.department,
            joinedAt: new Date(company.joinedAt).toLocaleDateString(),
            status: company.isDefault ? "Default" : "Active",
          }))
          setCompanies(userCompanies)
        } else {
          setCompanies([])
        }
      }
    } catch (error) {
      console.error("Error loading companies from SettingsContext:", error)
      setErrorMessage("Failed to load companies")
      setCompanies([])
    } finally {
      setLoadingCompanies(false)
    }
  }

  // Load companies when tab is accessed
  useEffect(() => {
    if (activeTab === 3) {
      loadUserCompanies()
    }
  }, [activeTab])

  // Handle preferences form changes
  const handleNotificationChange = (name: string, checked: boolean) => {
    setPreferencesForm((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [name]: checked,
      },
    }))
  }

  const handleEmailPrefChange = (name: string, checked: boolean) => {
    setPreferencesForm((prev) => ({
      ...prev,
      emailPreferences: {
        ...prev.emailPreferences,
        [name]: checked,
      },
    }))
  }

  const handleNotificationPrefChange = (
    section: string,
    category: string,
    type: "email" | "push" | "sms",
    checked: boolean
  ) => {
    setPreferencesForm((prev) => {
      const prefs = prev.notificationPreferences as Record<string, Record<string, Record<string, boolean>>>
      const sectionPrefs = prefs[section] ?? {}
      const categoryPrefs = (sectionPrefs[category] as Record<string, boolean>) ?? {}
      return {
        ...prev,
        notificationPreferences: {
          ...prefs,
          [section]: {
            ...sectionPrefs,
            [category]: { ...categoryPrefs, [type]: checked },
          },
        } as typeof prev.notificationPreferences,
      }
    })
  }

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    setPreferencesForm((prev) => ({
      ...prev,
      language: event.target.value,
    }))
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 64px)",
        overflow: "hidden",
        m: 0,
        mt: isTabsExpanded ? 0 : -3,
        p: 0,
        transition: "margin 0.3s ease",
      }}
    >
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }}>
          {errorMessage}
        </Alert>
      </Snackbar>

      {isTabsExpanded && (
        <Paper 
          sx={{ 
            borderBottom: 1, 
            borderColor: "divider", 
            bgcolor: "primary.main", 
            color: "primary.contrastText",
            m: 0,
            p: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                flexGrow: 1,
                "& .MuiTabs-scrollButtons": {
                  "&.Mui-disabled": {
                    opacity: 0,
                    width: 0,
                  },
                },
                "& .MuiTabs-scroller": {
                  overflow: "visible !important",
                },
                "& .MuiTab-root": {
                  color: "primary.contrastText",
                  opacity: 0.7,
                  "&.Mui-selected": {
                    color: "primary.contrastText",
                    opacity: 1,
                  },
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "primary.contrastText",
                },
              }}
            >
              {tabsConfig.map((tab, index) => (
                <Tab key={tab.slug} icon={tab.icon} label={tab.label} {...a11yProps(index)} />
              ))}
            </Tabs>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Button
                onClick={editMode ? handleSave : () => setEditMode(true)}
                variant={editMode ? "contained" : "outlined"}
                color="inherit"
                size="small"
                startIcon={saving ? <CircularProgress size={16} /> : (editMode ? <Save /> : <Edit />)}
                disabled={saving}
              >
                {saving ? "Saving..." : (editMode ? "Save" : "Edit")}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "background.paper",
          m: 0,
          p: 0,
          lineHeight: 0,
        }}
      >
        <IconButton
          onClick={toggleTabsExpanded}
          size="small"
          sx={{
            color: "text.primary",
            m: 0,
            p: 0.5,
            "&:hover": {
              bgcolor: "transparent",
              opacity: 0.7,
            },
          }}
        >
          {isTabsExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflow: "auto", width: "100%" }}>
        {/* Personal Info Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 4, height: "100%", display: "flex", flexDirection: "column" }}>
            <Grid container spacing={4} sx={{ flexGrow: 1 }}>
              <Grid item xs={12} sm={4} md={3}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start" }}>
                  <Avatar
                    src={photoPreview || state.settings.personal.avatar || undefined}
                    sx={{ 
                      width: 150, 
                      height: 150, 
                      mb: 3,
                      bgcolor: "primary.main"
                    }}
                  >
                    {!photoPreview && !state.settings.personal.avatar && (
                      <PersonIcon sx={{ fontSize: 75 }} />
                    )}
                  </Avatar>
                  {editMode && (
                    <Box sx={{ display: "flex", gap: 1.5, flexDirection: "column", width: "100%" }}>
                      <input
                        accept="image/*"
                        style={{ display: "none" }}
                        id="photo-upload"
                        type="file"
                        onChange={handlePhotoChange}
                      />
                      <label htmlFor="photo-upload">
                        <Button 
                          variant="outlined" 
                          component="span" 
                          startIcon={<PhotoCameraIcon />} 
                          size="small"
                          fullWidth
                        >
                          Upload
                        </Button>
                      </label>
                      {(photoPreview || state.settings.personal.avatar) && (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={handleRemovePhoto}
                          fullWidth
                        >
                          Remove
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} sm={8} md={9}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="First Name"
                      name="firstName"
                      fullWidth
                      size="small"
                      value={personalForm.firstName}
                      onChange={handlePersonalChange}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Middle Name"
                      name="middleName"
                      fullWidth
                      size="small"
                      value={personalForm.middleName}
                      onChange={handlePersonalChange}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Last Name"
                      name="lastName"
                      fullWidth
                      size="small"
                      value={personalForm.lastName}
                      onChange={handlePersonalChange}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email"
                      name="email"
                      fullWidth
                      size="small"
                      value={personalForm.email}
                      onChange={handlePersonalChange}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone"
                      name="phone"
                      fullWidth
                      size="small"
                      value={personalForm.phone}
                      onChange={handlePersonalChange}
                      disabled={!editMode}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Account & Security Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 4, height: "100%", overflow: "auto" }}>
            <Grid container spacing={4}>
              {/* Address Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                  <LocationIcon />
                  Address Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Street Address"
                      name="street"
                      fullWidth
                      size="small"
                      value={accountForm.address.street}
                      onChange={(e) => handleAccountChange("address", "street", e.target.value)}
                      disabled={!editMode}
                      placeholder="Enter your street address"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="City"
                      name="city"
                      fullWidth
                      size="small"
                      value={accountForm.address.city}
                      onChange={(e) => handleAccountChange("address", "city", e.target.value)}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="State/Province"
                      name="state"
                      fullWidth
                      size="small"
                      value={accountForm.address.state}
                      onChange={(e) => handleAccountChange("address", "state", e.target.value)}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="ZIP/Postal Code"
                      name="zipCode"
                      fullWidth
                      size="small"
                      value={accountForm.address.zipCode}
                      onChange={(e) => handleAccountChange("address", "zipCode", e.target.value)}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Country"
                      name="country"
                      fullWidth
                      size="small"
                      value={accountForm.address.country}
                      onChange={(e) => handleAccountChange("address", "country", e.target.value)}
                      disabled={!editMode}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Bank Details Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                  <BankIcon />
                  Bank Details
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Account Holder Name"
                      name="accountHolderName"
                      fullWidth
                      size="small"
                      value={accountForm.bankDetails.accountHolderName}
                      onChange={(e) => handleAccountChange("bankDetails", "accountHolderName", e.target.value)}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Bank Name"
                      name="bankName"
                      fullWidth
                      size="small"
                      value={accountForm.bankDetails.bankName}
                      onChange={(e) => handleAccountChange("bankDetails", "bankName", e.target.value)}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Account Number"
                      name="accountNumber"
                      fullWidth
                      size="small"
                      value={accountForm.bankDetails.accountNumber}
                      onChange={(e) => handleAccountChange("bankDetails", "accountNumber", e.target.value)}
                      disabled={!editMode}
                      type="password"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Sort Code"
                      name="sortCode"
                      fullWidth
                      size="small"
                      value={accountForm.bankDetails.sortCode}
                      onChange={(e) => handleAccountChange("bankDetails", "sortCode", e.target.value)}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="IBAN"
                      name="iban"
                      fullWidth
                      size="small"
                      value={accountForm.bankDetails.iban}
                      onChange={(e) => handleAccountChange("bankDetails", "iban", e.target.value)}
                      disabled={!editMode}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Tax & Identification Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Tax & Identification
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="National Insurance Number"
                      name="niNumber"
                      fullWidth
                      size="small"
                      value={accountForm.niNumber}
                      onChange={(e) => handleAccountChange("niNumber", "", e.target.value)}
                      disabled={!editMode}
                      placeholder="XX 12 34 56 X"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Tax Code"
                      name="taxCode"
                      fullWidth
                      size="small"
                      value={accountForm.taxCode}
                      onChange={(e) => handleAccountChange("taxCode", "", e.target.value)}
                      disabled={!editMode}
                      placeholder="1257L"
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Emergency Contact Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Emergency Contact
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Contact Name"
                      name="name"
                      fullWidth
                      size="small"
                      value={accountForm.emergencyContact.name}
                      onChange={(e) => handleAccountChange("emergencyContact", "name", e.target.value)}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Relationship"
                      name="relationship"
                      fullWidth
                      size="small"
                      value={accountForm.emergencyContact.relationship}
                      onChange={(e) => handleAccountChange("emergencyContact", "relationship", e.target.value)}
                      disabled={!editMode}
                      placeholder="e.g., Spouse, Parent, Sibling"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone Number"
                      name="phone"
                      fullWidth
                      size="small"
                      value={accountForm.emergencyContact.phone}
                      onChange={(e) => handleAccountChange("emergencyContact", "phone", e.target.value)}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email Address"
                      name="email"
                      fullWidth
                      size="small"
                      value={accountForm.emergencyContact.email}
                      onChange={(e) => handleAccountChange("emergencyContact", "email", e.target.value)}
                      disabled={!editMode}
                      type="email"
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Preferences Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 4, height: "100%", overflow: "auto" }}>
            <Grid container spacing={4}>
              {/* Global Notification Settings */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Global Notification Settings
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferencesForm.notifications.email}
                          onChange={(e) => handleNotificationChange("email", e.target.checked)}
                          disabled={!editMode}
                          color="primary"
                        />
                      }
                      label="Email Notifications"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferencesForm.notifications.push}
                          onChange={(e) => handleNotificationChange("push", e.target.checked)}
                          disabled={!editMode}
                          color="primary"
                        />
                      }
                      label="Push Notifications"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferencesForm.notifications.sms}
                          onChange={(e) => handleNotificationChange("sms", e.target.checked)}
                          disabled={!editMode}
                          color="primary"
                        />
                      }
                      label="SMS Notifications"
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* HR Notifications */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  HR Notifications
                </Typography>
                <Grid container spacing={3}>
                  {Object.entries(preferencesForm.notificationPreferences.hr).map(([key, value]) => (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, textTransform: "capitalize" }}>
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value.email}
                                onChange={(e) => handleNotificationPrefChange("hr", key, "email", e.target.checked)}
                                disabled={!editMode}
                                size="small"
                                color="primary"
                              />
                            }
                            label="Email"
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value.push}
                                onChange={(e) => handleNotificationPrefChange("hr", key, "push", e.target.checked)}
                                disabled={!editMode}
                                size="small"
                                color="primary"
                              />
                            }
                            label="Push"
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value.sms}
                                onChange={(e) => handleNotificationPrefChange("hr", key, "sms", e.target.checked)}
                                disabled={!editMode}
                                size="small"
                                color="primary"
                              />
                            }
                            label="SMS"
                          />
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {/* Stock Notifications */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Stock Notifications
                </Typography>
                <Grid container spacing={3}>
                  {Object.entries(preferencesForm.notificationPreferences.stock).map(([key, value]) => (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, textTransform: "capitalize" }}>
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value.email}
                                onChange={(e) => handleNotificationPrefChange("stock", key, "email", e.target.checked)}
                                disabled={!editMode}
                                size="small"
                                color="primary"
                              />
                            }
                            label="Email"
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value.push}
                                onChange={(e) => handleNotificationPrefChange("stock", key, "push", e.target.checked)}
                                disabled={!editMode}
                                size="small"
                                color="primary"
                              />
                            }
                            label="Push"
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value.sms}
                                onChange={(e) => handleNotificationPrefChange("stock", key, "sms", e.target.checked)}
                                disabled={!editMode}
                                size="small"
                                color="primary"
                              />
                            }
                            label="SMS"
                          />
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {/* Finance Notifications */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Finance Notifications
                </Typography>
                <Grid container spacing={3}>
                  {Object.entries(preferencesForm.notificationPreferences.finance).map(([key, value]) => (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, textTransform: "capitalize" }}>
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value.email}
                                onChange={(e) => handleNotificationPrefChange("finance", key, "email", e.target.checked)}
                                disabled={!editMode}
                                size="small"
                                color="primary"
                              />
                            }
                            label="Email"
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value.push}
                                onChange={(e) => handleNotificationPrefChange("finance", key, "push", e.target.checked)}
                                disabled={!editMode}
                                size="small"
                                color="primary"
                              />
                            }
                            label="Push"
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value.sms}
                                onChange={(e) => handleNotificationPrefChange("finance", key, "sms", e.target.checked)}
                                disabled={!editMode}
                                size="small"
                                color="primary"
                              />
                            }
                            label="SMS"
                          />
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {/* Booking Notifications */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Booking Notifications
                </Typography>
                <Grid container spacing={3}>
                  {Object.entries(preferencesForm.notificationPreferences.booking).map(([key, value]) => (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, textTransform: "capitalize" }}>
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value.email}
                                onChange={(e) => handleNotificationPrefChange("booking", key, "email", e.target.checked)}
                                disabled={!editMode}
                                size="small"
                                color="primary"
                              />
                            }
                            label="Email"
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value.push}
                                onChange={(e) => handleNotificationPrefChange("booking", key, "push", e.target.checked)}
                                disabled={!editMode}
                                size="small"
                                color="primary"
                              />
                            }
                            label="Push"
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value.sms}
                                onChange={(e) => handleNotificationPrefChange("booking", key, "sms", e.target.checked)}
                                disabled={!editMode}
                                size="small"
                                color="primary"
                              />
                            }
                            label="SMS"
                          />
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {/* System Notifications */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  System Notifications
                </Typography>
                <Grid container spacing={3}>
                  {Object.entries(preferencesForm.notificationPreferences.system).map(([key, value]) => (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, textTransform: "capitalize" }}>
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value.email}
                                onChange={(e) => handleNotificationPrefChange("system", key, "email", e.target.checked)}
                                disabled={!editMode}
                                size="small"
                                color="primary"
                              />
                            }
                            label="Email"
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value.push}
                                onChange={(e) => handleNotificationPrefChange("system", key, "push", e.target.checked)}
                                disabled={!editMode}
                                size="small"
                                color="primary"
                              />
                            }
                            label="Push"
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value.sms}
                                onChange={(e) => handleNotificationPrefChange("system", key, "sms", e.target.checked)}
                                disabled={!editMode}
                                size="small"
                                color="primary"
                              />
                            }
                            label="SMS"
                          />
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {/* Marketing Notifications */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Marketing Notifications
                </Typography>
                <Grid container spacing={3}>
                  {Object.entries(preferencesForm.notificationPreferences.marketing).map(([key, value]) => (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, textTransform: "capitalize" }}>
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value.email}
                                onChange={(e) => handleNotificationPrefChange("marketing", key, "email", e.target.checked)}
                                disabled={!editMode}
                                size="small"
                                color="primary"
                              />
                            }
                            label="Email"
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value.push}
                                onChange={(e) => handleNotificationPrefChange("marketing", key, "push", e.target.checked)}
                                disabled={!editMode}
                                size="small"
                                color="primary"
                              />
                            }
                            label="Push"
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value.sms}
                                onChange={(e) => handleNotificationPrefChange("marketing", key, "sms", e.target.checked)}
                                disabled={!editMode}
                                size="small"
                                color="primary"
                              />
                            }
                            label="SMS"
                          />
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {/* Language & Theme */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Language & Theme
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!editMode} size="small">
                      <InputLabel id="language-select-label">Language</InputLabel>
                      <Select
                        labelId="language-select-label"
                        value={preferencesForm.language}
                        onChange={handleLanguageChange}
                        label="Language"
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="fr">French</MenuItem>
                        <MenuItem value="es">Spanish</MenuItem>
                        <MenuItem value="de">German</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferencesForm.theme === "dark"}
                          onChange={(e) =>
                            setPreferencesForm((prev) => ({
                              ...prev,
                              theme: e.target.checked ? "dark" : "light",
                            }))
                          }
                          disabled={!editMode}
                          color="primary"
                        />
                      }
                      label="Dark Mode"
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Companies Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: 4, height: "100%", overflow: "auto" }}>
            <Grid container spacing={3}>
              {loadingCompanies ? (
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                    <CircularProgress />
                  </Box>
                </Grid>
              ) : (
                <>
                  {companies.map((company) => (
                    <Grid item xs={12} sm={6} md={4} key={company.id}>
                      <Box
                        sx={{
                          border: 1,
                          borderColor: "divider",
                          borderRadius: 1,
                          p: 2,
                          "&:hover": {
                            boxShadow: 2,
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                          <BusinessIcon sx={{ mr: 1, color: "primary.main", fontSize: 20 }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {company.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          <strong>Role:</strong> {company.role}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          <strong>Department:</strong> {company.department}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Joined:</strong> {company.joinedAt}
                        </Typography>
                        <Chip
                          label={company.status}
                          color={company.status === "Default" ? "primary" : "success"}
                          size="small"
                        />
                      </Box>
                    </Grid>
                  ))}
                  {companies.length === 0 && !loadingCompanies && (
                    <Grid item xs={12}>
                      <Box sx={{ p: 4, textAlign: "center" }}>
                        <BusinessIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No Companies Found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          You are not currently associated with any companies.
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          </Box>
        </TabPanel>

        {/* Privacy & GDPR Tab */}
        <TabPanel value={activeTab} index={4}>
          <GDPRPrivacyTab />
        </TabPanel>
      </Box>
    </Box>
  )
}

export default Settings
