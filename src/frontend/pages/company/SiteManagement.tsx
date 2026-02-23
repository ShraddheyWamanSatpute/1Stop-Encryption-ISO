"use client"

import type React from "react"
import { useState, useCallback, useMemo, useEffect } from "react"
import { useSettings } from "../../../backend/context/SettingsContext"
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Snackbar,
  TextField,
  Typography,
  Alert,
  Chip,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Switch,
} from "@mui/material"
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  Store as StoreIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ContentCopy as ContentCopyIcon,
} from "@mui/icons-material"
import DataHeader from "../../components/reusable/DataHeader"
import CRUDModal from "../../components/reusable/CRUDModal"
import { useCompany } from "../../../backend/context/CompanyContext"
import RequireCompanyContext from "../../components/global/RequireCompanyContext"
import { registerWithEmailAndPassword } from "../../../backend/rtdatabase/Settings"
import { addUserToCompanyInDb, setCompanyUserInDb } from "../../../backend/rtdatabase/Company"
import { db, ref, set } from "../../../backend/services/Firebase"

// Define form state interfaces
interface NewSiteForm {
  name: string
  description: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  isMainSite: boolean
}

interface NewSubsiteForm {
  name: string
  description: string
  location: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

interface EditSiteForm {
  siteID: string
  name: string
  description: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  isMainSite: boolean
}

interface EditSubsiteForm extends NewSubsiteForm {
  subsiteID: string
}

const SiteManagement: React.FC = () => {
  const {
    state,
    createSite,
    createSubsite,
    updateSite,
    updateSubsite,
    deleteSite,
    deleteSubsite,
    updateSiteDataManagement,
    updateSubsiteDataManagement,
    selectSite,
    refreshSites
  } = useCompany()

  const { state: settingsState } = useSettings()
  const currentUser = settingsState.user

  // UI state
  const [loading, setLoading] = useState<boolean>(false)
  const [siteDialogOpen, setSiteDialogOpen] = useState<boolean>(false)
  const [subsiteDialogOpen, setSubsiteDialogOpen] = useState<boolean>(false)
  const [editSiteDialogOpen, setEditSiteDialogOpen] = useState<boolean>(false)
  const [editSubsiteDialogOpen, setEditSubsiteDialogOpen] = useState<boolean>(false)
  const [dataManagementDialogOpen, setDataManagementDialogOpen] = useState<boolean>(false)
  const [selectedSiteID, setSelectedSiteID] = useState<string | null>(null)
  const [selectedSubsiteID, setSelectedSubsiteID] = useState<string | null>(null)
  const [snackbarState, setSnackbarState] = useState<{
    open: boolean
    message: string
    severity: "success" | "error"
  }>({
    open: false,
    message: "",
    severity: "success",
  })

  // Form states
  const [newSite, setNewSite] = useState<NewSiteForm>({
    name: "",
    description: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    isMainSite: false,
  })

  const [newSubsite, setNewSubsite] = useState<NewSubsiteForm>({
    name: "",
    description: "",
    location: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  })

  const [editSite, setEditSite] = useState<EditSiteForm>({
    siteID: "",
    name: "",
    description: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    isMainSite: false,
  })

  const [editSubsite, setEditSubsite] = useState<EditSubsiteForm>({
    subsiteID: "",
    name: "",
    description: "",
    location: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  })

  const [siteDataConfig, setSiteDataConfig] = useState<{
    accessibleModules: { [key: string]: "company" | "site" | "subsite" };
    accessibleSites: string[];
    accessibleSubsites: string[];
  }>({
    accessibleModules: {},
    accessibleSites: [],
    accessibleSubsites: []
  })

  // Helpers to compute current saved config and detect changes
  const currentSavedConfig = useMemo(() => {
    if (!selectedSiteID) return { accessibleSites: [], accessibleSubsites: [] }
    const site = state.sites?.find(s => s.siteID === selectedSiteID)
    if (selectedSubsiteID) {
      const subsite = site?.subsites && (site.subsites as any)[selectedSubsiteID]
      return {
        accessibleSites: subsite?.dataManagement?.accessibleSites || [],
        accessibleSubsites: subsite?.dataManagement?.accessibleSubsites || []
      }
    }
    return {
      accessibleSites: site?.dataManagement?.accessibleSites || [],
      accessibleSubsites: site?.dataManagement?.accessibleSubsites || []
    }
  }, [state.sites, selectedSiteID, selectedSubsiteID])

  const arraysEqualIgnoreOrder = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false
    const sa = [...a].sort()
    const sb = [...b].sort()
    return sa.every((v, i) => v === sb[i])
  }

  const isDataConfigDirty = useMemo(() => {
    return !arraysEqualIgnoreOrder(siteDataConfig.accessibleSites, currentSavedConfig.accessibleSites) ||
           !arraysEqualIgnoreOrder(siteDataConfig.accessibleSubsites, currentSavedConfig.accessibleSubsites)
  }, [siteDataConfig, currentSavedConfig])

  // Dialog close handler with unsaved-changes guard
  const handleCloseDataManagementDialog = useCallback(() => {
    if (isDataConfigDirty) {
      const confirmClose = window.confirm("Discard unsaved data access changes?")
      if (!confirmClose) return
    }
    setDataManagementDialogOpen(false)
  }, [isDataConfigDirty])

  const [createAccountDialogOpen, setCreateAccountDialogOpen] = useState<boolean>(false)
  const [accountForm, setAccountForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    siteId: "",
    subsiteId: "",
  })
  const isEmailValid = useMemo(() => {
    if (!accountForm.email) return false
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(accountForm.email)
  }, [accountForm.email])
  const isPasswordValid = useMemo(() => {
    return accountForm.password.length >= 6
  }, [accountForm.password])
  const doPasswordsMatch = useMemo(() => {
    return accountForm.password === accountForm.confirmPassword && accountForm.password.length > 0
  }, [accountForm.password, accountForm.confirmPassword])
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set())

  // Toggle site expansion
  const toggleSiteExpansion = useCallback((siteId: string) => {
    setExpandedSites((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(siteId)) {
        newSet.delete(siteId)
      } else {
        newSet.add(siteId)
      }
      return newSet
    })
  }, [])

  // Snackbar close handler
  const handleCloseSnackbar = useCallback(() => {
    setSnackbarState((prev) => ({ ...prev, open: false }))
  }, [])

  // Handler functions for site and subsite operations
  const handleDeleteSite = useCallback(
    async (siteId: string) => {
      const confirmed = window.confirm("Delete this site and all nested data? This cannot be undone.")

      if (!confirmed) return

      try {
        await deleteSite(siteId)
        setSnackbarState({
          open: true,
          message: "Site deleted successfully",
          severity: "success",
        })
      } catch (error) {
        console.error("Error deleting site:", error)
        setSnackbarState({
          open: true,
          message: "Failed to delete site",
          severity: "error",
        })
      }
    },
    [deleteSite],
  )

  const handleDeleteSubsite = useCallback(
    async (siteId: string, subsiteId: string) => {
      const confirmed = window.confirm("Delete this subsite and its data? This cannot be undone.")

      if (!confirmed) return

      try {
        await deleteSubsite(siteId, subsiteId)
        setSnackbarState({
          open: true,
          message: "Subsite deleted successfully",
          severity: "success",
        })
      } catch (error) {
        console.error("Error deleting subsite:", error)
        setSnackbarState({
          open: true,
          message: "Failed to delete subsite",
          severity: "error",
        })
      }
    },
    [deleteSubsite],
  )

  // Handler functions for dialog operations
  const validateSiteForm = (site: NewSiteForm | EditSiteForm) => {
    const errors: { [key: string]: string } = {};
    if (!site.name.trim()) {
      errors.name = "Site name is required";
    }
    return errors;
  };

  const handleCreateSite = useCallback(async () => {
    const errors = validateSiteForm(newSite);
    if (Object.keys(errors).length > 0) {
      setSnackbarState({
        open: true,
        message: Object.values(errors)[0],
        severity: "error"
      });
      return;
    }

    try {
      await createSite({
        name: newSite.name,
        description: newSite.description,
        address: newSite.address,
        isMainSite: newSite.isMainSite,
        subsites: {},
        teams: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      setSiteDialogOpen(false)
      setNewSite({
        name: "",
        description: "",
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
        isMainSite: false,
      })
      setSnackbarState({
        open: true,
        message: "Site created successfully",
        severity: "success",
      })
    } catch (error) {
      console.error("Error creating site:", error)
      setSnackbarState({
        open: true,
        message: "Failed to create site",
        severity: "error",
      })
    }
  }, [createSite, newSite])

  const validateSubsiteForm = (subsite: NewSubsiteForm | EditSubsiteForm) => {
    const errors: { [key: string]: string } = {};
    if (!subsite.name.trim()) {
      errors.name = "Subsite name is required";
    }
    return errors;
  };

  const handleCreateSubsite = useCallback(async () => {
    if (!selectedSiteID) return;

    const errors = validateSubsiteForm(newSubsite);
    if (Object.keys(errors).length > 0) {
      setSnackbarState({
        open: true,
        message: Object.values(errors)[0],
        severity: "error"
      });
      return;
    }

    try {
      const selectedSite = state.sites?.find((site) => site.siteID === selectedSiteID)
      if (selectedSite) {
        selectSite(selectedSiteID, selectedSite.name)
      }

      await createSubsite({
        name: newSubsite.name,
        description: newSubsite.description,
        location: newSubsite.location || "",
        address: newSubsite.address,
        teams: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      setSubsiteDialogOpen(false)
      setNewSubsite({
        name: "",
        description: "",
        location: "",
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
      })
      setSnackbarState({
        open: true,
        message: "Subsite created successfully",
        severity: "success",
      })
    } catch (error) {
      console.error("Error creating subsite:", error)
      setSnackbarState({
        open: true,
        message: "Failed to create subsite",
        severity: "error",
      })
    }
  }, [createSubsite, selectedSiteID, newSubsite, selectSite, state.sites])

  const handleEditSite = useCallback(async () => {
    if (!selectedSiteID) return;

    const errors = validateSiteForm(editSite);
    if (Object.keys(errors).length > 0) {
      setSnackbarState({
        open: true,
        message: Object.values(errors)[0],
        severity: "error"
      });
      return;
    }

    try {
      const updateData = {
        name: editSite.name,
        description: editSite.description,
        address: editSite.address,
        isMainSite: editSite.isMainSite,
      }

      await updateSite(selectedSiteID, updateData)
      setEditSiteDialogOpen(false)
      setSnackbarState({
        open: true,
        message: "Site updated successfully",
        severity: "success",
      })
    } catch (error) {
      console.error("Error updating site:", error)
      setSnackbarState({
        open: true,
        message: "Failed to update site",
        severity: "error",
      })
    }
  }, [updateSite, selectedSiteID, editSite])

  const handleEditSubsite = useCallback(async () => {
    if (!selectedSiteID || !selectedSubsiteID) return;

    const errors = validateSubsiteForm(editSubsite);
    if (Object.keys(errors).length > 0) {
      setSnackbarState({
        open: true,
        message: Object.values(errors)[0],
        severity: "error"
      });
      return;
    }

    try {
      const updateData = {
        name: editSubsite.name,
        description: editSubsite.description,
        location: editSubsite.location,
        address: editSubsite.address,
      }

      await updateSubsite(selectedSiteID, selectedSubsiteID, updateData)
      setEditSubsiteDialogOpen(false)
      setSnackbarState({
        open: true,
        message: "Subsite updated successfully",
        severity: "success",
      })
    } catch (error) {
      console.error("Error updating subsite:", error)
      setSnackbarState({
        open: true,
        message: "Failed to update subsite",
        severity: "error",
      })
    }
  }, [updateSubsite, selectedSiteID, selectedSubsiteID, editSubsite])

  const handleUpdateDataManagement = useCallback(async () => {
    if (!selectedSiteID) {
      setSnackbarState({
        open: true,
        message: "No site selected",
        severity: "error",
      });
      return;
    }

    try {
      // If no sites/subsites are selected, default to current path
      const config = {
        accessibleModules: siteDataConfig.accessibleModules || {},
        accessibleSites: siteDataConfig.accessibleSites.length > 0 
          ? [...siteDataConfig.accessibleSites]
          : [selectedSiteID],
        accessibleSubsites: siteDataConfig.accessibleSubsites.length > 0
          ? [...siteDataConfig.accessibleSubsites]
          : selectedSubsiteID ? [selectedSubsiteID] : []
      };

      console.log('Saving config:', config);

      if (selectedSubsiteID) {
        console.log('Updating subsite data management:', selectedSiteID, selectedSubsiteID, config);
        await updateSubsiteDataManagement(selectedSiteID, selectedSubsiteID, config);
      } else {
        console.log('Updating site data management:', selectedSiteID, config);
        await updateSiteDataManagement(selectedSiteID, config);
      }

      // Update the global site/subsite data context
      console.log('Refreshing sites data');
      await refreshSites();
      // Data source configuration updated - sites will use the new configuration automatically
      
      setDataManagementDialogOpen(false);
      setSnackbarState({
        open: true,
        message: "Data access configuration updated successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating data access configuration:", error);
      setSnackbarState({
        open: true,
        message: error instanceof Error ? error.message : "Failed to update data access configuration",
        severity: "error",
      });
    }
  }, [
    updateSiteDataManagement,
    updateSubsiteDataManagement,
    selectedSiteID,
    selectedSubsiteID,
    siteDataConfig,
    refreshSites,
    setSnackbarState,
    setDataManagementDialogOpen
  ])

  // Handle creating site account
  const handleCreateSiteAccount = useCallback(async () => {
    if (!state.companyID || !accountForm.email || !accountForm.password || !accountForm.siteId) {
      setSnackbarState({
        open: true,
        message: "Please fill in all required fields",
        severity: "error",
      })
      return
    }

    if (!isEmailValid) {
      setSnackbarState({
        open: true,
        message: "Please enter a valid email address",
        severity: "error",
      })
      return
    }

    if (!isPasswordValid) {
      setSnackbarState({
        open: true,
        message: "Password must be at least 6 characters",
        severity: "error",
      })
      return
    }

    if (!doPasswordsMatch) {
      setSnackbarState({
        open: true,
        message: "Passwords do not match",
        severity: "error",
      })
      return
    }

    try {
      setLoading(true)
      
      // Step 1: Create Firebase Auth account
      const { uid } = await registerWithEmailAndPassword(
        accountForm.email,
        accountForm.password,
        `Site Account - ${state.sites?.find((s) => s.siteID === accountForm.siteId)?.name || ""}`
      )

      // Step 2: Add user to company users
      const siteName = state.sites?.find((s) => s.siteID === accountForm.siteId)?.name || ""
      const subsiteName = accountForm.subsiteId 
        ? Object.values(state.sites?.find((s) => s.siteID === accountForm.siteId)?.subsites || {}).find(
            (sub: any) => sub.subsiteID === accountForm.subsiteId
          )?.name || ""
        : ""

      const companyData = {
        companyID: state.companyID,
        companyName: state.companyName || "",
        role: "site",
        department: "Site Operations",
        accessLevel: accountForm.subsiteId ? "subsite" : "site",
        siteId: accountForm.siteId,
        siteName: siteName,
        subsiteId: accountForm.subsiteId || undefined,
        subsiteName: subsiteName || undefined,
        assignedSites: [accountForm.siteId],
        joinedAt: Date.now(),
        isDefault: false,
      }

      // Add to user's companies list
      await addUserToCompanyInDb(uid, state.companyID, companyData)

      // Add to company's users list
      await setCompanyUserInDb(state.companyID, uid, {
        email: accountForm.email,
        displayName: `Site Account - ${siteName}`,
        role: "site",
        department: "Site Operations",
        joinedAt: Date.now(),
      })

      // Step 3: Create user profile in database
      await set(ref(db, `users/${uid}`), {
        uid,
        email: accountForm.email,
        displayName: `Site Account - ${siteName}`,
        role: "site",
        department: "Site Operations",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })

      setSnackbarState({
        open: true,
        message: `Site account created successfully for ${accountForm.email}`,
        severity: "success",
      })

      // Reset form
      setAccountForm({
        email: "",
        password: "",
        confirmPassword: "",
        siteId: "",
        subsiteId: "",
      })
      setCreateAccountDialogOpen(false)
    } catch (error: any) {
      console.error("Error creating site account:", error)
      let errorMessage = "Failed to create site account"
      if (error.message?.includes("email-already-in-use")) {
        errorMessage = "An account with this email already exists"
      } else if (error.message) {
        errorMessage = error.message
      }
      setSnackbarState({
        open: true,
        message: errorMessage,
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }, [state.companyID, accountForm, currentUser, state.companyName, state.sites, isEmailValid, isPasswordValid, doPasswordsMatch])

  // Helper functions for data conversion

  const renderSites = useMemo(() => {
    if (!state.sites || state.sites.length === 0) return <Typography>No sites found</Typography>

    return (
      <List>
        {state.sites.map((site) => {
          const siteSubsites = site.subsites && typeof site.subsites === "object" ? Object.values(site.subsites) : []

          return (
            <Box key={site.siteID}  sx={{ mb: 2 }}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconButton size="small" onClick={() => toggleSiteExpansion(site.siteID)} sx={{ p: 0.5 }}>
                        {expandedSites.has(site.siteID) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      <BusinessIcon color="primary" />
                      <Typography variant="h6">{site.name}</Typography>
                      {site.isMainSite && <Chip size="small" color="primary" label="Main Site" sx={{ ml: 1 }} />}
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        ({siteSubsites.length} subsites)
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box component="span">
                      <Typography component="span" variant="body2" color="text.secondary" display="block">
                        {site.description}
                      </Typography>
                      <Typography component="span" variant="body2" color="text.secondary" display="block">
                        {site.address && Object.values(site.address).some(val => val.trim())
                          ? [
                              site.address.street,
                              site.address.city,
                              site.address.state,
                              site.address.zipCode,
                              site.address.country
                            ].filter(val => val.trim()).join(", ")
                          : "No address provided"}
                      </Typography>
                    </Box>
                  }
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title="Add Subsite">
                    <IconButton
                      onClick={() => {
                        setSelectedSiteID(site.siteID)
                        setSubsiteDialogOpen(true)
                      }}
                      color="primary"
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Configure Data Management">
                    <IconButton
                      onClick={() => {
                        setSelectedSiteID(site.siteID)
                        setSiteDataConfig(site.dataManagement || {
                          accessibleModules: {},
                          accessibleSites: [],
                          accessibleSubsites: []
                        })
                        setDataManagementDialogOpen(true)
                      }}
                      color="primary"
                    >
                      <SettingsIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Site">
                    <IconButton
                      onClick={() => {
                        setSelectedSiteID(site.siteID)
                        setEditSite({
                          siteID: site.siteID,
                          name: site.name || "",
                          description: site.description || "",
                          address: site.address || {
                            street: "",
                            city: "",
                            state: "",
                            zipCode: "",
                            country: "",
                          },
                          isMainSite: site.isMainSite || false,
                        })
                        setEditSiteDialogOpen(true)
                      }}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Site">
                    <IconButton onClick={() => handleDeleteSite(site.siteID)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>

              {expandedSites.has(site.siteID) && (
                <>
                  <Divider />
                  <Box sx={{ pl: 4, pr: 2, py: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Subsites
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setSelectedSiteID(site.siteID)
                          setSubsiteDialogOpen(true)
                        }}
                      >
                        Add Subsite
                      </Button>
                    </Box>

                    <List dense>
                      {siteSubsites && siteSubsites.length > 0 ? (
                        siteSubsites.map((subsite) => (
                          <ListItem key={subsite.subsiteID}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <StoreIcon fontSize="small" color="action" />
                                  <Typography variant="body2">{subsite.name}</Typography>
                                </Box>
                              }
                              secondary={
                                <Box component="span">
                                  <Typography component="span" variant="body2" color="text.secondary" display="block">
                                    {subsite.description}
                                  </Typography>
                                  <Typography component="span" variant="body2" color="text.secondary" display="block">
                                    {subsite.address && Object.values(subsite.address).some(val => val.trim())
                                      ? [
                                          subsite.address.street,
                                          subsite.address.city,
                                          subsite.address.state,
                                          subsite.address.zipCode,
                                          subsite.address.country
                                        ].filter(val => val.trim()).join(", ")
                                      : "No address provided"}
                                  </Typography>
                                </Box>
                              }
                            />
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Tooltip title="Configure Data Management">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedSiteID(site.siteID)
                                    setSelectedSubsiteID(subsite.subsiteID)
                                    setSiteDataConfig(
                                      subsite.dataManagement || {
                                          accessibleModules: {},
                                          accessibleSites: [],
                                          accessibleSubsites: []
                                        },
                                    )
                                    setDataManagementDialogOpen(true)
                                  }}
                                  color="primary"
                                >
                                  <SettingsIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Subsite">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedSiteID(site.siteID)
                                    setSelectedSubsiteID(subsite.subsiteID)
                                    setEditSubsite({
                                      subsiteID: subsite.subsiteID,
                                      name: subsite.name || "",
                                      description: subsite.description || "",
                                      location: subsite.location || "",
                                      address: subsite.address || {
                                        street: "",
                                        city: "",
                                        state: "",
                                        zipCode: "",
                                        country: "",
                                      },
                                    })
                                    setEditSubsiteDialogOpen(true)
                                  }}
                                  color="primary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Subsite">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteSubsite(site.siteID, subsite.subsiteID)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </ListItem>
                        ))
                      ) : (
                        <ListItem>
                          <ListItemText
                            primary={
                              <Typography variant="body2" color="text.secondary">
                                No subsites found
                              </Typography>
                            }
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                </>
              )}
            </Box>
          )
        })}
      </List>
    )
  }, [state.sites, handleDeleteSite, handleDeleteSubsite, expandedSites, toggleSiteExpansion])


  return (
    <RequireCompanyContext>
    <Box sx={{ p: 0 }}>
      <DataHeader
        onRefresh={refreshSites}
        showDateControls={false}
        additionalControls={
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: "white" }}>
            Site Management
          </Typography>
        }
        additionalButtons={[
          {
            label: "Create Site Account",
            icon: <PersonIcon />,
            onClick: () => setCreateAccountDialogOpen(true),
            variant: "outlined" as const,
            color: "secondary" as const
          },
          {
            label: "Add Site",
            icon: <AddIcon />,
            onClick: () => setSiteDialogOpen(true),
            variant: "contained" as const,
            color: "primary" as const
          }
        ]}
      />

      <Card>
        <CardContent>
          {/* Header actions moved to primary toolbar above for consistency */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderSites
          )}

          {/* Add Site Modal */}
          <CRUDModal
            open={siteDialogOpen}
            onClose={() => setSiteDialogOpen(false)}
            title="Add New Site"
            icon={<AddIcon />}
            mode="create"
            onSave={handleCreateSite}
            saveButtonText="Create"
            maxWidth="sm"
          >
            <TextField
              autoFocus
              margin="dense"
              label="Site Name"
              fullWidth
              required
              value={newSite.name}
              onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
              error={!newSite.name.trim()}
              helperText={!newSite.name.trim() ? "Site name is required" : ""}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newSite.description}
              onChange={(e) => setNewSite({ ...newSite, description: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Street"
              fullWidth
              value={newSite.address.street}
              onChange={(e) =>
                setNewSite({
                  ...newSite,
                  address: {
                    ...newSite.address,
                    street: e.target.value,
                  },
                })
              }
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                margin="dense"
                label="City"
                fullWidth
                value={newSite.address.city}
                onChange={(e) =>
                  setNewSite({
                    ...newSite,
                    address: {
                      ...newSite.address,
                      city: e.target.value,
                    },
                  })
                }
              />
              <TextField
                margin="dense"
                label="State/Province"
                fullWidth
                value={newSite.address.state}
                onChange={(e) =>
                  setNewSite({
                    ...newSite,
                    address: {
                      ...newSite.address,
                      state: e.target.value,
                    },
                  })
                }
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                margin="dense"
                label="Postal/Zip Code"
                fullWidth
                value={newSite.address.zipCode}
                onChange={(e) =>
                  setNewSite({
                    ...newSite,
                    address: {
                      ...newSite.address,
                      zipCode: e.target.value,
                    },
                  })
                }
              />
              <TextField
                margin="dense"
                label="Country"
                fullWidth
                value={newSite.address.country}
                onChange={(e) =>
                  setNewSite({
                    ...newSite,
                    address: {
                      ...newSite.address,
                      country: e.target.value,
                    },
                  })
                }
              />
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={newSite.isMainSite}
                  onChange={(e) => setNewSite({ ...newSite, isMainSite: e.target.checked })}
                  color="primary"
                />
              }
              label="Main Site"
              sx={{ mt: 2 }}
            />
          </CRUDModal>

          {/* Add Subsite Modal */}
          <CRUDModal
            open={subsiteDialogOpen}
            onClose={() => setSubsiteDialogOpen(false)}
            title="Add New Subsite"
            icon={<StoreIcon />}
            mode="create"
            onSave={handleCreateSubsite}
            saveButtonText="Create"
            maxWidth="sm"
          >
            <TextField
              autoFocus
              margin="dense"
              label="Subsite Name"
              fullWidth
              required
              value={newSubsite.name}
              onChange={(e) => setNewSubsite({ ...newSubsite, name: e.target.value })}
              error={!newSubsite.name.trim()}
              helperText={!newSubsite.name.trim() ? "Subsite name is required" : ""}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newSubsite.description}
              onChange={(e) => setNewSubsite({ ...newSubsite, description: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Location"
              fullWidth
              value={newSubsite.location}
              onChange={(e) => setNewSubsite({ ...newSubsite, location: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Street"
              fullWidth
              value={newSubsite.address.street}
              onChange={(e) =>
                setNewSubsite({
                  ...newSubsite,
                  address: {
                    ...newSubsite.address,
                    street: e.target.value,
                  },
                })
              }
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                margin="dense"
                label="City"
                fullWidth
                value={newSubsite.address.city}
                onChange={(e) =>
                  setNewSubsite({
                    ...newSubsite,
                    address: {
                      ...newSubsite.address,
                      city: e.target.value,
                    },
                  })
                }
              />
              <TextField
                margin="dense"
                label="State/Province"
                fullWidth
                value={newSubsite.address.state}
                onChange={(e) =>
                  setNewSubsite({
                    ...newSubsite,
                    address: {
                      ...newSubsite.address,
                      state: e.target.value,
                    },
                  })
                }
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                margin="dense"
                label="Postal/Zip Code"
                fullWidth
                value={newSubsite.address.zipCode}
                onChange={(e) =>
                  setNewSubsite({
                    ...newSubsite,
                    address: {
                      ...newSubsite.address,
                      zipCode: e.target.value,
                    },
                  })
                }
              />
              <TextField
                margin="dense"
                label="Country"
                fullWidth
                value={newSubsite.address.country}
                onChange={(e) =>
                  setNewSubsite({
                    ...newSubsite,
                    address: {
                      ...newSubsite.address,
                      country: e.target.value,
                    },
                  })
                }
              />
            </Box>
          </CRUDModal>

          {/* Edit Site Dialog */}
          <Dialog 
            open={editSiteDialogOpen} 
            onClose={() => setEditSiteDialogOpen(false)} 
            maxWidth="sm" 
            fullWidth
            disableEnforceFocus
            keepMounted
            aria-labelledby="edit-site-dialog-title"
          >
            <DialogTitle id="edit-site-dialog-title">Edit Site</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Site Name"
                fullWidth
                value={editSite.name}
                onChange={(e) => setEditSite({ ...editSite, name: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={editSite.description}
                onChange={(e) => setEditSite({ ...editSite, description: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Street"
                fullWidth
                value={editSite.address.street}
                onChange={(e) =>
                  setEditSite({
                    ...editSite,
                    address: {
                      ...editSite.address,
                      street: e.target.value,
                    },
                  })
                }
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  margin="dense"
                  label="City"
                  fullWidth
                  value={editSite.address.city}
                  onChange={(e) =>
                    setEditSite({
                      ...editSite,
                      address: {
                        ...editSite.address,
                        city: e.target.value,
                      },
                    })
                  }
                />
                <TextField
                  margin="dense"
                  label="State/Province"
                  fullWidth
                  value={editSite.address.state}
                  onChange={(e) =>
                    setEditSite({
                      ...editSite,
                      address: {
                        ...editSite.address,
                        state: e.target.value,
                      },
                    })
                  }
                />
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  margin="dense"
                  label="Postal/Zip Code"
                  fullWidth
                  value={editSite.address.zipCode}
                  onChange={(e) =>
                    setEditSite({
                      ...editSite,
                      address: {
                        ...editSite.address,
                        zipCode: e.target.value,
                      },
                    })
                  }
                />
                <TextField
                  margin="dense"
                  label="Country"
                  fullWidth
                  value={editSite.address.country}
                  onChange={(e) =>
                    setEditSite({
                      ...editSite,
                      address: {
                        ...editSite.address,
                        country: e.target.value,
                      },
                    })
                  }
                />
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={editSite.isMainSite}
                    onChange={(e) => setEditSite({ ...editSite, isMainSite: e.target.checked })}
                    color="primary"
                  />
                }
                label="Main Site"
                sx={{ mt: 2 }}
              />

            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditSiteDialogOpen(false)} color="primary">
                Cancel
              </Button>
              <Button onClick={handleEditSite} color="primary" disabled={!editSite.name}>
                Save Changes
              </Button>
            </DialogActions>
          </Dialog>

          {/* Edit Subsite Dialog */}
          <Dialog 
            open={editSubsiteDialogOpen} 
            onClose={() => setEditSubsiteDialogOpen(false)} 
            maxWidth="sm" 
            fullWidth
            disableEnforceFocus
            keepMounted
            aria-labelledby="edit-subsite-dialog-title"
          >
            <DialogTitle id="edit-subsite-dialog-title">Edit Subsite</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Subsite Name"
                fullWidth
                value={editSubsite.name}
                onChange={(e) => setEditSubsite({ ...editSubsite, name: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={editSubsite.description}
                onChange={(e) => setEditSubsite({ ...editSubsite, description: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Location"
                fullWidth
                value={editSubsite.location}
                onChange={(e) => setEditSubsite({ ...editSubsite, location: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Street"
                fullWidth
                value={editSubsite.address.street}
                onChange={(e) =>
                  setEditSubsite({
                    ...editSubsite,
                    address: {
                      ...editSubsite.address,
                      street: e.target.value,
                    },
                  })
                }
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  margin="dense"
                  label="City"
                  fullWidth
                  value={editSubsite.address.city}
                  onChange={(e) =>
                    setEditSubsite({
                      ...editSubsite,
                      address: {
                        ...editSubsite.address,
                        city: e.target.value,
                      },
                    })
                  }
                />
                <TextField
                  margin="dense"
                  label="State/Province"
                  fullWidth
                  value={editSubsite.address.state}
                  onChange={(e) =>
                    setEditSubsite({
                      ...editSubsite,
                      address: {
                        ...editSubsite.address,
                        state: e.target.value,
                      },
                    })
                  }
                />
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  margin="dense"
                  label="Postal/Zip Code"
                  fullWidth
                  value={editSubsite.address.zipCode}
                  onChange={(e) =>
                    setEditSubsite({
                      ...editSubsite,
                      address: {
                        ...editSubsite.address,
                        zipCode: e.target.value,
                      },
                    })
                  }
                />
                <TextField
                  margin="dense"
                  label="Country"
                  fullWidth
                  value={editSubsite.address.country}
                  onChange={(e) =>
                    setEditSubsite({
                      ...editSubsite,
                      address: {
                        ...editSubsite.address,
                        country: e.target.value,
                      },
                    })
                  }
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditSubsiteDialogOpen(false)} color="primary">
                Cancel
              </Button>
              <Button onClick={handleEditSubsite} color="primary" disabled={!editSubsite.name}>
                Save Changes
              </Button>
            </DialogActions>
          </Dialog>

          {/* Data Management Dialog - Using CRUD Modal */}
          <CRUDModal
            open={dataManagementDialogOpen}
            onClose={handleCloseDataManagementDialog}
            title={`Configure Data Access for ${selectedSubsiteID ? "Subsite" : "Site"}`}
            icon={<SettingsIcon />}
            mode="edit"
            onSave={handleUpdateDataManagement}
            saveButtonText={isDataConfigDirty ? "Save Configuration" : "No changes"}
            maxWidth="md"
            hideDefaultActions={true}
            actions={
              <>
                <Button onClick={handleCloseDataManagementDialog}>Cancel</Button>
                <Button onClick={() => setSiteDataConfig({
                  accessibleModules: siteDataConfig.accessibleModules,
                  accessibleSites: [...currentSavedConfig.accessibleSites],
                  accessibleSubsites: [...currentSavedConfig.accessibleSubsites]
                })} disabled={!isDataConfigDirty}>
                  Reset
                </Button>
                <Button onClick={handleUpdateDataManagement} variant="contained" color="primary" disabled={!isDataConfigDirty}>
                  {isDataConfigDirty ? "Save Configuration" : "No changes"}
                </Button>
              </>
            }
          >
            <Typography variant="body2" color="text.secondary" paragraph>
              Select which sites and subsites should be accessible.
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Accessible Sites</Typography>
              <FormControl fullWidth>
                {state.sites?.map((site) => (
                  <FormControlLabel
                    key={site.siteID}
                    control={
                      <Checkbox
                        checked={siteDataConfig.accessibleSites.includes(site.siteID)}
                        onChange={(e) => {
                          setSiteDataConfig(prev => ({
                            ...prev,
                            accessibleSites: e.target.checked 
                              ? [...prev.accessibleSites, site.siteID]
                              : prev.accessibleSites.filter(id => id !== site.siteID)
                          }))
                        }}
                      />
                    }
                    label={site.name}
                  />
                ))}
              </FormControl>
            </Box>
            
            <Box>
              <Typography variant="subtitle1" gutterBottom>Accessible Subsites</Typography>
              <FormControl fullWidth>
                {state.sites?.map((site) => (
                  site.subsites && Object.values(site.subsites).map((subsite: any) => (
                    <FormControlLabel
                      key={subsite.subsiteID}
                      control={
                        <Checkbox
                          checked={siteDataConfig.accessibleSubsites.includes(subsite.subsiteID)}
                          onChange={(e) => {
                            setSiteDataConfig(prev => ({
                              ...prev,
                              accessibleSubsites: e.target.checked
                                ? [...prev.accessibleSubsites, subsite.subsiteID]
                                : prev.accessibleSubsites.filter(id => id !== subsite.subsiteID)
                            }))
                          }}
                        />
                      }
                      label={`${subsite.name} (${site.name})`}
                    />
                  ))
                ))}
              </FormControl>
            </Box>
          </CRUDModal>

          {/* Create Site Account Modal */}
          <CRUDModal
            open={createAccountDialogOpen}
            onClose={() => {
              setCreateAccountDialogOpen(false)
              setAccountForm({
                email: "",
                password: "",
                confirmPassword: "",
                siteId: "",
                subsiteId: "",
              })
            }}
            title="Create Site Account"
            icon={<PersonIcon />}
            mode="create"
            onSave={handleCreateSiteAccount}
            saveButtonText="Create Account"
            maxWidth="sm"
          >
            <TextField
              autoFocus
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              required
              value={accountForm.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccountForm({ ...accountForm, email: e.target.value })}
              error={Boolean(accountForm.email) && !isEmailValid}
              helperText={Boolean(accountForm.email) && !isEmailValid ? "Invalid email format" : ""}
            />
            <TextField
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              required
              value={accountForm.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccountForm({ ...accountForm, password: e.target.value })}
              error={Boolean(accountForm.password) && !isPasswordValid}
              helperText={Boolean(accountForm.password) && !isPasswordValid ? "Password must be at least 6 characters" : ""}
            />
            <TextField
              margin="dense"
              label="Confirm Password"
              type="password"
              fullWidth
              required
              value={accountForm.confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
              error={Boolean(accountForm.confirmPassword) && !doPasswordsMatch}
              helperText={Boolean(accountForm.confirmPassword) && !doPasswordsMatch ? "Passwords do not match" : ""}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
              This will create a login account for site/subsite devices. The account will be added to company users and recognized as an employee for usage purposes.
            </Typography>
            <FormControl fullWidth margin="dense">
              <InputLabel>Site</InputLabel>
              <Select
                value={accountForm.siteId}
                onChange={(e: SelectChangeEvent) => setAccountForm({ ...accountForm, siteId: e.target.value as string, subsiteId: "" })}
                label="Site"
                required
              >
                {state.sites?.map((site) => (
                  <MenuItem key={site.siteID} value={site.siteID}>
                    {site.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Subsite (Optional)</InputLabel>
              <Select
                value={accountForm.subsiteId}
                onChange={(e) => setAccountForm({ ...accountForm, subsiteId: e.target.value })}
                label="Subsite (Optional)"
                disabled={!accountForm.siteId}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {accountForm.siteId &&
                  state.sites?.find((site) => site.siteID === accountForm.siteId)?.subsites &&
                  Object.values(state.sites.find((site) => site.siteID === accountForm.siteId)?.subsites || {}).map(
                    (subsite: any) => (
                      <MenuItem key={subsite.subsiteID} value={subsite.subsiteID}>
                        {subsite.name}
                      </MenuItem>
                    ),
                  )}
              </Select>
            </FormControl>
          </CRUDModal>


          <Snackbar open={snackbarState.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
            <Alert onClose={handleCloseSnackbar} severity={snackbarState.severity} sx={{ width: "100%" }}>
              {snackbarState.message}
            </Alert>
          </Snackbar>
        </CardContent>
      </Card>
    </Box>
    </RequireCompanyContext>
  )
}

export default SiteManagement
