/**
 * ESS Location Selector Dialog
 * 
 * Mobile-friendly dialog for selecting company/site/subsite
 * Similar to the main app's LocationSelector but optimized for mobile
 */

"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Collapse,
  Card,
  CardContent,
} from "@mui/material"
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Store as StoreIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material"
import { useCompany } from "../../backend/context/CompanyContext"
import { useSettings } from "../../backend/context/SettingsContext"

interface ESSLocationSelectorProps {
  open: boolean
  onClose: () => void
}

const ESSLocationSelector: React.FC<ESSLocationSelectorProps> = ({ open, onClose }) => {
  const { state: companyState, setCompanyID, selectSite, selectSubsite, getUserAccessibleSites } = useCompany()
  const { state: settingsState } = useSettings()
  const [companyExpanded, setCompanyExpanded] = useState(!companyState.companyID)
  const [siteExpanded, setSiteExpanded] = useState(!!companyState.companyID && !companyState.selectedSiteID)
  const [subsiteExpanded, setSubsiteExpanded] = useState(!!companyState.selectedSiteID && !companyState.selectedSubsiteID)

  // Get user companies
  const userCompanies = useMemo(() => {
    if (!settingsState.auth.uid || !settingsState.user?.companies) return []
    return settingsState.user.companies.map(company => ({
      companyID: company.companyID,
      companyName: company.companyName || "",
      role: company.role || 'user',
    }))
  }, [settingsState.auth.uid, settingsState.user?.companies])

  // Get sites for current company
  const [sites, setSites] = useState<any[]>([])
  const [subsites, setSubsites] = useState<any[]>([])
  const [loadingSites, setLoadingSites] = useState(false)

  useEffect(() => {
    if (!companyState.companyID || !open) {
      setSites([])
      setSubsites([])
      return
    }

    const loadSites = async () => {
      setLoadingSites(true)
      try {
        // getUserAccessibleSites uses state.companyID internally, no parameter needed
        const accessibleSites = await getUserAccessibleSites()
        setSites(accessibleSites || [])
      } catch (error) {
        console.error("Error loading sites:", error)
        setSites([])
      } finally {
        setLoadingSites(false)
      }
    }

    loadSites()
  }, [companyState.companyID, open, getUserAccessibleSites])

  // Get subsites for selected site
  useEffect(() => {
    if (!companyState.selectedSiteID || !open) {
      setSubsites([])
      return
    }

    // Get subsites from company state - convert Record to array
    const site = companyState.sites?.find(s => s.siteID === companyState.selectedSiteID)
    if (site?.subsites) {
      // Convert Record<string, Subsite> to array
      const subsitesArray = Object.entries(site.subsites).map(([subsiteID, subsite]) => ({
        ...subsite,
        subsiteID: subsite.subsiteID || subsiteID, // Use subsiteID from object if available, otherwise use key
        subsiteName: subsite.name || "",
      }))
      setSubsites(subsitesArray)
    } else {
      setSubsites([])
    }
  }, [companyState.selectedSiteID, companyState.sites, open])

  const handleCompanySelect = async (companyID: string) => {
    if (companyID === companyState.companyID) {
      onClose()
      return
    }

    setCompanyID(companyID)
    setCompanyExpanded(false) // Collapse companies when one is selected
    setSiteExpanded(true) // Expand sites when company is selected
    // Sites and subsites will reload automatically via useEffect
  }

  const handleSiteSelect = async (siteID: string, siteName: string) => {
    if (siteID === companyState.selectedSiteID) {
      onClose()
      return
    }

    selectSite(siteID, siteName)
    setSiteExpanded(false) // Collapse sites when one is selected
    setSubsiteExpanded(true) // Expand subsites when site is selected
    // Clear subsite when site changes
    selectSubsite("", "")
  }

  const handleSubsiteSelect = (subsiteID: string, subsiteName: string) => {
    if (subsiteID === companyState.selectedSubsiteID) {
      onClose()
      return
    }

    selectSubsite(subsiteID, subsiteName)
    onClose()
  }

  // Get current location display text
  const getCurrentLocation = (): string => {
    if (companyState.selectedSubsiteName) {
      return companyState.selectedSubsiteName
    }
    if (companyState.selectedSiteName) {
      return companyState.selectedSiteName
    }
    if (companyState.company?.companyName) {
      return companyState.company.companyName
    }
    return "Select Location"
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          m: 0,
          maxHeight: "100vh",
        }
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        Select Location
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        {/* Selected Company/Site/Subsite at Top */}
        {companyState.companyID && (
          <Card sx={{ m: 2, mb: 1, bgcolor: "primary.main", color: "white" }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" sx={{ opacity: 0.9, display: "block", mb: 0.5 }}>
                Selected
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {getCurrentLocation()}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Company Selection - Collapsible */}
        <Box>
          <ListItemButton
            onClick={() => setCompanyExpanded(!companyExpanded)}
            sx={{
              bgcolor: "primary.main",
              color: "white",
              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
          >
            <BusinessIcon sx={{ mr: 1 }} />
            <ListItemText primary="Company" />
            {companyExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
          <Collapse in={companyExpanded}>
            <List sx={{ pt: 0 }}>
              {userCompanies.map((company) => (
                <ListItem key={company.companyID} disablePadding>
                  <ListItemButton
                    selected={company.companyID === companyState.companyID}
                    onClick={() => handleCompanySelect(company.companyID)}
                  >
                    <ListItemText
                      primary={company.companyName}
                      secondary={company.role}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </Box>

        {/* Site Selection - Only show if company is selected, Collapsible */}
        {companyState.companyID && (
          <>
            <Divider />
            <Box>
              <ListItemButton
                onClick={() => setSiteExpanded(!siteExpanded)}
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                }}
              >
                <LocationIcon sx={{ mr: 1 }} />
                <ListItemText primary="Site" />
                {loadingSites && <CircularProgress size={16} sx={{ ml: 1, color: "white" }} />}
                {siteExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </ListItemButton>
              <Collapse in={siteExpanded}>
                <List sx={{ pt: 0 }}>
                  {loadingSites ? (
                    <ListItem>
                      <Box sx={{ display: "flex", justifyContent: "center", width: "100%", py: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    </ListItem>
                  ) : sites.length > 0 ? (
                    <>
                      <ListItem disablePadding>
                        <ListItemButton
                          selected={!companyState.selectedSiteID}
                          onClick={() => handleSiteSelect("", "")}
                        >
                          <ListItemText primary="No Site" />
                        </ListItemButton>
                      </ListItem>
                      {sites.map((site) => (
                        <ListItem key={site.siteID} disablePadding>
                          <ListItemButton
                            selected={site.siteID === companyState.selectedSiteID}
                            onClick={() => handleSiteSelect(site.siteID, site.name || "")}
                          >
                            <ListItemText primary={site.name || site.siteName || "Unnamed Site"} />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </>
                  ) : (
                    <ListItem>
                      <ListItemText primary="No sites available" secondary="Select a company first" />
                    </ListItem>
                  )}
                </List>
              </Collapse>
            </Box>
          </>
        )}

        {/* Subsite Selection - Only show if site is selected, Collapsible */}
        {companyState.selectedSiteID && (
          <>
            <Divider />
            <Box>
              <ListItemButton
                onClick={() => setSubsiteExpanded(!subsiteExpanded)}
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                }}
              >
                <StoreIcon sx={{ mr: 1 }} />
                <ListItemText primary="Subsite" />
                {subsiteExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </ListItemButton>
              <Collapse in={subsiteExpanded}>
                <List sx={{ pt: 0 }}>
                  <ListItem disablePadding>
                    <ListItemButton
                      selected={!companyState.selectedSubsiteID}
                      onClick={() => handleSubsiteSelect("", "")}
                    >
                      <ListItemText primary="No Subsite" />
                    </ListItemButton>
                  </ListItem>
                  {subsites.map((subsite) => (
                    <ListItem key={subsite.subsiteID} disablePadding>
                      <ListItemButton
                        selected={subsite.subsiteID === companyState.selectedSubsiteID}
                        onClick={() => handleSubsiteSelect(subsite.subsiteID, subsite.subsiteName || "")}
                      >
                        <ListItemText primary={subsite.subsiteName || "Unnamed Subsite"} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ESSLocationSelector

