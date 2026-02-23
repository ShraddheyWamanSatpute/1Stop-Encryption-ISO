"use client"

import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  FormControl,
  CircularProgress,
  Box,
  Select,
  MenuItem,
  Typography,
  SelectChangeEvent,
} from "@mui/material"
import { useCompany } from "../../../backend/context/CompanyContext"
import type { Site } from "../../../backend/interfaces/Company"
import SubsiteDropdown from "./SubsiteDropdown"

const SiteDropdown: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { 
    state: companyState, 
    selectSite, 
    getUserAccessibleSites, 
    autoSelectSiteIfOnlyOne 
  } = useCompany()
  const [selectedSite, setSelectedSite] = useState<string>("")
  const navigate = useNavigate()

  // Reset when company changes
  useEffect(() => {
    setSelectedSite("")
    setSites([])
    setIsLoading(true)
    setError(null)
  }, [companyState.companyID])

  // Fetch accessible sites when company changes
  useEffect(() => {
    const loadAccessibleSites = async () => {
      if (companyState.companyID) {
        try {
          setIsLoading(true)
          // Use the new getUserAccessibleSites function
          const accessibleSites = await getUserAccessibleSites()
          
          if (accessibleSites && accessibleSites.length > 0) {
            setSites(accessibleSites)
            setError(null)
            
            // Auto-select if only one site is accessible
            if (accessibleSites.length === 1 && !companyState.selectedSiteID) {
              await autoSelectSiteIfOnlyOne()
            }
          } else {
            setSites([])
            setError("No accessible sites found for this company")
          }
        } catch (error) {
          console.error("Error loading accessible sites:", error)
          setError("Failed to load sites")
          setSites([])
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadAccessibleSites()
  }, [companyState.companyID, getUserAccessibleSites, autoSelectSiteIfOnlyOne, companyState.selectedSiteID])

  // Sync with company state site selection
  useEffect(() => {
    if (companyState.selectedSiteID) {
      // Check if the selected site ID is valid
      const isValidSite = sites.some(site => site.siteID === companyState.selectedSiteID)
      if (isValidSite) {
        setSelectedSite(companyState.selectedSiteID)
      } else {
        // If invalid site ID, clear the selection
        console.warn("Invalid site ID detected:", companyState.selectedSiteID)
        selectSite("", "") // Clear site selection in context
        setSelectedSite("") // Set to empty string instead of null
        // Clear from localStorage
        localStorage.removeItem("selectedSiteID")
        localStorage.removeItem("selectedSiteName")
      }
    } else {
      setSelectedSite("")
    }
  }, [companyState.selectedSiteID, sites, selectSite])

  const handleSelectSite = (event: SelectChangeEvent<unknown>) => {
    const siteID = event.target.value as string

    if (siteID === "createNew") {
      navigate("/Company/SiteManagement")
      return
    }
    
    // Handle None selection (empty string)
    if (siteID === "") {
      console.log("No site selected (None)")
      selectSite("", "") // Clear site selection in context
      setSelectedSite("") // Set to empty string instead of null
      return
    }

    const selected = sites.find((s) => s.siteID === siteID)
    if (selected) {
      console.log("Site selected:", selected.name, "ID:", selected.siteID)
      selectSite(selected.siteID, selected.name || "Unknown Site")
      setSelectedSite(selected.siteID)
    }
  }

  // Don't render if no company is selected
  if (!companyState.companyID) {
    return null
  }

  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
      {isLoading ? (
        <CircularProgress size={24} />
      ) : error ? (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      ) : (
        <>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: "200px" }}>
              <Select
                value={selectedSite}
                onChange={handleSelectSite}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) return "Select a Site"
                  const selectedSiteObj = sites.find((s) => s.siteID === selected)
                  return selectedSiteObj?.name || "Select a Site"
                }}
                sx={{
                  color: "white",
                  ".MuiSelect-icon": { color: "white" },
                  ".MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255, 255, 255, 0.5)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "white",
                  },
                }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {sites.map((site) => (
                  <MenuItem key={site.siteID} value={site.siteID}>
                    {site.name || "Unknown Site"}
                  </MenuItem>
                ))}
                <MenuItem value="createNew">+ Create New Site</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Only render SubsiteDropdown if a site is selected (not empty string) */}
          {selectedSite && <SubsiteDropdown />}
        </>
      )}
    </Box>
  )
}

export default SiteDropdown
