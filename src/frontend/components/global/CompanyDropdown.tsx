"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import {
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  Box,
  Typography,
  Button,
} from "@mui/material"
import { useNavigate } from "react-router-dom"
import { useSettings } from "../../../backend/context/SettingsContext"
import { useCompany } from "../../../backend/context/CompanyContext"
import { DEFAULT_PERMISSIONS } from "../../../backend/interfaces/Company"

// Define Company interface locally since it's not exported from the interface file
interface Company {
  companyID: string
  companyName: string
  userPermission: string
  uid?: string
}

const CompanyDropdown: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const { state } = useSettings()
  const { state: companyState, setCompanyID, dispatch: companyDispatch, fetchSites } = useCompany()
  const [selectedCompany, setSelectedCompany] = useState<string | null>(companyState.companyID || null)
  const navigate = useNavigate()
  const previousUserCompaniesRef = useRef<string>("")

  // Memoize user companies to prevent unnecessary recalculations
  const userCompanies = useMemo(() => {
    if (!state.auth.uid || !state.user?.companies) return []
    
    return state.user.companies.map(company => ({
      companyID: company.companyID,
      companyName: company.companyName,
      userPermission: company.role || 'user',
      uid: state.auth.uid || undefined
    }))
  }, [state.auth.uid, state.user?.companies])

  // Load companies from cache immediately on mount, then update from Firebase
  useEffect(() => {
    // Try to load from localStorage first for instant display
    try {
      const cachedState = localStorage.getItem('settingsState')
      if (cachedState) {
        const parsed = JSON.parse(cachedState)
        if (parsed.user?.companies && Array.isArray(parsed.user.companies)) {
          const cachedCompanies = parsed.user.companies.map((company: any) => ({
            companyID: company.companyID,
            companyName: company.companyName,
            userPermission: company.role || 'user',
            uid: parsed.auth?.uid
          }))
          if (cachedCompanies.length > 0) {
            setCompanies(cachedCompanies)
            console.log(`⚡ CompanyDropdown: Loaded ${cachedCompanies.length} companies from cache (INSTANT)`)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load companies from cache:', error)
    }
  }, []) // Only run once on mount

  // Update companies when userCompanies changes (from Firebase) - but only if different
  useEffect(() => {
    // Create a stable string representation for comparison
    const newCompaniesStr = JSON.stringify(userCompanies.map(c => ({ companyID: c.companyID, companyName: c.companyName })))
    
    // Only update if the data actually changed
    if (previousUserCompaniesRef.current !== newCompaniesStr) {
      previousUserCompaniesRef.current = newCompaniesStr
      
      if (userCompanies.length === 0) {
        // Only clear if user is logged in (don't clear if just loading)
        if (state.auth.isLoggedIn) {
          setCompanies([])
        }
      } else {
        setCompanies(userCompanies)
        console.log(`✅ CompanyDropdown: Updated ${userCompanies.length} companies from SettingsContext (Firebase)`)
      }
    }
  }, [userCompanies, state.auth.isLoggedIn])

  // Update selected company when company state changes (for session restoration)
  useEffect(() => {
    if (companyState.companyID !== selectedCompany) {
      // Verify that the companyID exists in our companies list before setting it
      if (companyState.companyID) {
        const companyExists = companies.some((company) => company.companyID === companyState.companyID)
        if (companyExists) {
          setSelectedCompany(companyState.companyID)
        } else if (companies.length > 0) {
          // Company doesn't exist in list, clear selection
          console.warn("Company ID from context not found in available companies:", companyState.companyID)
          setSelectedCompany("")
          setCompanyID("")
        }
        // If companies.length === 0, wait for companies to load before validating
      } else {
        setSelectedCompany("")
      }
    }
  }, [companyState.companyID, companies, selectedCompany, setCompanyID])

  const handleSelectCompany = (event: SelectChangeEvent<unknown>) => {
    const companyID = event.target.value

    if (companyID === "createNew") {
      navigate("/CreateCompany")
      return
    }

    const selected = companies.find((c: Company) => c.companyID === companyID)
    if (selected) {
      // First set the company ID to ensure context updates properly
      if (typeof selected.companyID === "string") {
        try {
          // Persist last selected company for restore on next login
          localStorage.setItem("selectedCompanyID", selected.companyID)
          localStorage.setItem("selectedCompanyName", selected.companyName || "")
        } catch {}
        companyDispatch({
          type: "SET_COMPANY_ID",
          payload: selected.companyID,
        })

        // Then set the company object with all properties
        companyDispatch({
          type: "SET_COMPANY",
          payload: {
            companyID: selected.companyID,
            companyName: selected.companyName,
            companyLogo: "",
            companyAddress: "",
            companyPhone: "",
            companyEmail: "",
            companyWebsite: "",
            companyDescription: "",
            companyIndustry: "",
            companySize: "",
            companyType: "",
            companyStatus: "",
            companyCreated: "",
            companyUpdated: "",
            permissions: DEFAULT_PERMISSIONS,
          },
        })

        // Trigger sites loading for the selected company
        fetchSites()

        // Update local state
        setSelectedCompany(selected.companyID)
      } else {
        console.error("Invalid companyID format:", selected.companyID)
      }
    } else {
      console.error("Selected company not found in companies list:", companyID)
      setSelectedCompany("")
    }
  }

  // Removed error handling since we're not using error state anymore

  return (
    <Box>
      {state.auth.isLoggedIn === false ? (
        // User is not logged in
        <Typography variant="caption" color="white">
          Please log in
        </Typography>
      ) : companies.length === 0 ? (
        // If no companies are found and not loading, show only the Create New Company button
        <Button variant="contained" color="primary" onClick={() => navigate("/CreateCompany")} size="small">
          + Create New Company
        </Button>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <FormControl fullWidth size="small">
            <Select
              value={
                selectedCompany && companies.some((c: Company) => c.companyID === selectedCompany) 
                  ? selectedCompany 
                  : ""
              }
              onChange={handleSelectCompany}
              displayEmpty
              renderValue={(selected: unknown) => {
                if (!selected || selected === "") return "Select a Company"

                // First try to find in loaded companies
                const selectedCompanyObj = companies.find((c: Company) => c.companyID === selected)
                if (selectedCompanyObj?.companyName) {
                  return selectedCompanyObj.companyName
                }

                // Fallback to session-stored company name for immediate display
                if (selected === companyState.companyID && companyState.companyName) {
                  return companyState.companyName
                }

                return "Select a Company"
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
              {companies.map((company: Company, index: number) => (
                <MenuItem key={company.companyID || `company-${index}`} value={company.companyID}>
                  {`${company.companyName}`}
                </MenuItem>
              ))}
              <MenuItem key="createNew" value="createNew">+ Create New Company</MenuItem>
            </Select>
          </FormControl>


        </Box>
      )}
    </Box>
  )
}

export default CompanyDropdown
