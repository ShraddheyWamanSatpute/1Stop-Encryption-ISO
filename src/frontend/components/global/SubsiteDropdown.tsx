"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  FormControl,
  CircularProgress,
  Box,
  Select as MuiSelect,
  MenuItem as MuiMenuItem,
  type SelectChangeEvent,
  styled,
} from "@mui/material"
import { useCompany } from "../../../backend/context/CompanyContext"
import type { Site, Subsite } from "../../../backend/interfaces/Company"

// Styled components
const Select = styled(MuiSelect)({
  minWidth: "200px",
})

const MenuItem = styled(MuiMenuItem)({})

const SubsiteDropdown: React.FC = () => {
  const [subsites, setSubsites] = useState<{ subsiteID: string; subsiteName: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [, setError] = useState<string | null>(null)
  const { state: companyState, selectSubsite } = useCompany()
  const [selectedSubsite, setSelectedSubsite] = useState<string | null>(null)
  const navigate = useNavigate()

  // Reset when site changes
  useEffect(() => {
    setSelectedSubsite(null)
    setSubsites([])
    setIsLoading(false)
    setError(null)
  }, [companyState.selectedSiteID])

  // OPTIMIZED: Use subsites directly from CompanyContext (same pattern as SiteDropdown uses sites)
  // Subsites are automatically extracted when a site is selected, just like sites are loaded when company is selected
  // FALLBACK: If subsites aren't in state, extract them directly from the selected site
  const memoizedSubsites = useMemo(() => {
    if (!companyState.selectedSiteID) {
      return []
    }

    // First, try to use subsites from CompanyContext state (preferred - already extracted)
    if (companyState.subsites && companyState.subsites.length > 0) {
      try {
        return companyState.subsites
          .filter((subsite: Subsite) => subsite && subsite.subsiteID && subsite.name)
          .map((subsite: Subsite) => ({
            subsiteID: subsite.subsiteID,
            subsiteName: subsite.name,
          }))
      } catch (error) {
        console.error("Error processing subsites from state:", error)
      }
    }

    // FALLBACK: Extract subsites directly from the selected site if not in state
    // This handles cases where extraction might have failed or sites were loaded before selection
    if (companyState.sites && companyState.sites.length > 0) {
      const selectedSite = companyState.sites.find((site: Site) => site.siteID === companyState.selectedSiteID)
      if (selectedSite?.subsites && typeof selectedSite.subsites === 'object') {
        try {
          const extracted = Object.entries(selectedSite.subsites)
            .filter(([subsiteId, subsite]: [string, any]) => {
              if (!subsite || typeof subsite !== 'object') return false
              return (subsite.subsiteID || subsite.id || subsiteId) && (subsite.name || subsiteId)
            })
            .map(([subsiteId, subsite]: [string, any]) => {
              const id = subsite.subsiteID || subsite.id || subsiteId
              const name = subsite.name || "Unknown Subsite"
              return {
                subsiteID: id,
                subsiteName: name,
              }
            })
          
          if (process.env.NODE_ENV === 'development' && extracted.length > 0) {
            console.log(`🔍 SubsiteDropdown: Extracted ${extracted.length} subsites from site directly (fallback)`, {
              selectedSiteID: companyState.selectedSiteID,
              subsitesFromState: companyState.subsites?.length || 0,
              extractedCount: extracted.length,
            })
          }
          
          return extracted
        } catch (error) {
          console.error("Error extracting subsites from site:", error)
        }
      }
    }

    return []
  }, [companyState.selectedSiteID, companyState.subsites, companyState.sites])

  // Update subsites when memoized data changes
  useEffect(() => {
    setSubsites(memoizedSubsites)
    setError(memoizedSubsites.length === 0 ? null : null)
    
    // Debug logging to help diagnose issues
    if (process.env.NODE_ENV === 'development') {
      if (companyState.selectedSiteID) {
        console.log('🔍 SubsiteDropdown Debug:', {
          selectedSiteID: companyState.selectedSiteID,
          subsitesFromState: companyState.subsites?.length || 0,
          memoizedSubsitesCount: memoizedSubsites.length,
          subsitesCount: subsites.length,
        })
      }
    }
  }, [memoizedSubsites, companyState.selectedSiteID, companyState.subsites, subsites.length])

  // Sync with company state selection - wait for subsites to be available before validating
  useEffect(() => {
    // Wait for subsites to be loaded before validating selection
    if (memoizedSubsites.length === 0 && companyState.selectedSubsiteID) {
      // If we have a selected subsite but no subsites loaded yet, keep it
      // This prevents clearing during the loading phase
      return
    }
    
    if (companyState.selectedSubsiteID) {
      // Validate that the selected subsite exists in the loaded subsites
      const isValidSubsite = memoizedSubsites.some(s => s.subsiteID === companyState.selectedSubsiteID)
      if (isValidSubsite) {
        setSelectedSubsite(companyState.selectedSubsiteID)
      } else if (memoizedSubsites.length > 0) {
        // Subsite doesn't exist in loaded subsites, clear it
        console.warn("Invalid subsite ID detected:", companyState.selectedSubsiteID, "Available subsites:", memoizedSubsites.map(s => s.subsiteID))
        setSelectedSubsite(null)
        // Note: We don't clear from context here to avoid race conditions
        // The CompanyContext will handle clearing invalid subsites
      }
    } else {
      setSelectedSubsite(null)
    }
  }, [companyState.selectedSubsiteID, memoizedSubsites])

  const handleSelectSubsite = (event: SelectChangeEvent<unknown>) => {
    const subsiteID = event.target.value as string

    if (subsiteID === "createNew") {
      navigate("/Company/SiteManagement")
      return
    }

    if (subsiteID === "") {
      selectSubsite("", "") // Clear subsite selection
      setSelectedSubsite(null)
      return
    }

    const selected = subsites.find((s) => s.subsiteID === subsiteID)
    if (selected) {
      selectSubsite(selected.subsiteID, selected.subsiteName)
      setSelectedSubsite(selected.subsiteID)
    }
  }

  // Don't render if no site is selected
  if (!companyState.selectedSiteID) {
    return null
  }

  // Always render if a site is selected - show dropdown even if subsites are still loading
  // This provides better UX than hiding the dropdown
  // The dropdown will show "Select a Subsite" if no subsites are available yet

  return (
    <Box>
      {isLoading ? (
        <CircularProgress size={24} />
      ) : (
        <FormControl fullWidth size="small">
          <Select
            value={selectedSubsite || ""}
            onChange={handleSelectSubsite}
            displayEmpty
            renderValue={(selected: unknown) => {
              if (!selected) return "Select a Subsite"
              const selectedSubsiteObj = subsites.find((s) => s.subsiteID === selected)
              return selectedSubsiteObj?.subsiteName || "Select a Subsite"
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
            <MenuItem key="none" value="">
              <em>None</em>
            </MenuItem>
            {subsites.map((subsite, index) => (
              <MenuItem 
                key={subsite.subsiteID || `subsite-${index}`} 
                value={subsite.subsiteID}
              >
                {subsite.subsiteName}
              </MenuItem>
            ))}
            <MenuItem key="createNew" value="createNew">+ Create New Subsite</MenuItem>
          </Select>
        </FormControl>
      )}
    </Box>
  )
}

export default SubsiteDropdown
