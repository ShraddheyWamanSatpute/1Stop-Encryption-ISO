import React, { useState, useCallback, useEffect, useRef } from "react"
import {
  Box,
  IconButton,
  Stack,
  Typography,
  Collapse,
  Paper
} from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import ExpandLessIcon from "@mui/icons-material/ExpandLess"
import { useCompany } from "../../../backend/context/CompanyContext"
import { useSettings } from "../../../backend/context/SettingsContext"
import { areDependenciesReady } from "../../../backend/utils/ContextDependencies"
import CompanyDropdown from "./CompanyDropdown"
import SiteDropdown from "./SiteDropdown"
import SubsiteDropdown from "./SubsiteDropdown"

const LocationSelector: React.FC = () => {
  const { state } = useCompany()
  const { state: settingsState } = useSettings()
  const [isExpanded, setIsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  
  // Wait for core contexts (Settings and Company) to be ready before rendering
  // This ensures dropdowns have access to the data they need
  const coreContextsReady = areDependenciesReady(settingsState, state)

  // Get the innermost selected location name for display
  const getInnermostLocation = useCallback(() => {
    if (state.selectedSubsiteName) {
      return state.selectedSubsiteName
    }
    if (state.selectedSiteName) {
      return state.selectedSiteName
    }
    if (state.company?.companyName) {
      return state.company.companyName
    }
    return "Select Location"
  }, [state.selectedSubsiteName, state.selectedSiteName, state.company])

  // Collapse the selector when clicking outside
  useEffect(() => {
    const onClickAway = (e: MouseEvent) => {
      if (!isExpanded) return
      const target = e.target as Node
      // Ignore clicks inside MUI select/popover menus (rendered in a portal)
      const isElement = (target as any)?.nodeType === 1
      const el = isElement ? (target as Element) : null
      const inMuiMenu = !!el?.closest('.MuiPopover-root, .MuiMenuItem-root, [role="listbox"], .MuiModal-root')
      if (inMuiMenu) return

      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsExpanded(false)
      }
    }
    document.addEventListener('mousedown', onClickAway)
    return () => document.removeEventListener('mousedown', onClickAway)
  }, [isExpanded])

  // Don't render until core contexts are ready
  if (!coreContextsReady) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            color: 'white',
            minWidth: 120
          }}
        >
          Loading...
        </Typography>
      </Box>
    )
  }

  return (
    <Box ref={containerRef} sx={{ display: 'flex', alignItems: 'center' }}>
      <Paper 
        elevation={0} 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          bgcolor: 'transparent',
          p: 1,
          borderRadius: 1
        }}
      >
        <IconButton
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{ 
            mr: 1,
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>

        <Collapse in={isExpanded} orientation="horizontal">
          <Stack direction="row" spacing={1} sx={{ mr: 2 }}>
            <CompanyDropdown />
            {state.companyID && <SiteDropdown />}
            {state.selectedSiteID && <SubsiteDropdown />}
          </Stack>
        </Collapse>

        {!isExpanded && (
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: 'white',
              minWidth: 120
            }}
          >
            {getInnermostLocation()}
          </Typography>
        )}
      </Paper>
    </Box>
  )
}

export default LocationSelector