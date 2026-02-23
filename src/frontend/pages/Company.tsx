"use client"

import type React from "react"
import { useState, useEffect, useMemo, lazy, Suspense } from "react"
import {
  Box,
  Tabs,
  Tab,
  Paper,
  IconButton,
  CircularProgress,
  Typography
} from "@mui/material"
import {
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  History as HistoryIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  AssignmentInd as AssignmentIndIcon,
  People as PeopleIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material"
import { useCompany } from "../../backend/context/CompanyContext"
import { useNavigate, useLocation } from "react-router-dom"

// Lazy load components to improve tab switching performance
const CompanyInfo = lazy(() => import("./company/CompanyInfo.tsx"))
const SiteManagement = lazy(() => import("./company/SiteManagement.tsx"))
const Permissions = lazy(() => import("./company/Permissions"))
const Checklists = lazy(() => import("./company/Checklists"))
const ChecklistHistory = lazy(() => import("./company/ChecklistHistory"))
const MyChecklist = lazy(() => import("./company/MyChecklist"))
const ChecklistDashboard = lazy(() => import("./company/ChecklistDashboard"))
const UserSiteAllocation = lazy(() => import("./company/UserSiteAllocation"))
const ChecklistTypes = lazy(() => import("./company/ChecklistTypes"))
const ContractManagement = lazy(() => import("./company/ContractManagement"))

const Company: React.FC = () => {
  const { hasPermission } = useCompany()
  const navigate = useNavigate()
  const location = useLocation()

  const [tabValue, setTabValue] = useState(0)
  const [isTabsExpanded, setIsTabsExpanded] = useState(true)

  const toggleTabsExpanded = () => {
    setIsTabsExpanded(!isTabsExpanded)
  }

  // Define tabs with permission-based visibility (no hard-coded roles)
  const tabs = useMemo(() => [
    {
      label: "Dashboard",
      icon: <BusinessIcon />,
      path: "/Company/Dashboard",
      show: hasPermission("company", "dashboard", "view"),
    },
    {
      label: "Company Info",
      icon: <BusinessIcon />,
      path: "/Company/Info",
      show: hasPermission("company", "info", "view"),
    },
    {
      label: "Site Management",
      icon: <LocationOnIcon />,
      path: "/Company/SiteManagement",
      show: hasPermission("company", "siteManagement", "view"),
    },
    {
      label: "User Allocation",
      icon: <PeopleIcon />,
      path: "/Company/User-Allocation",
      show: hasPermission("company", "userAllocation", "view"),
    },
    {
      label: "Permissions",
      icon: <SecurityIcon />,
      path: "/Company/Permissions",
      show: hasPermission("company", "permissions", "view"),
    },
    {
      label: "Checklists",
      icon: <AssignmentIcon />,
      path: "/Company/Checklists",
      show: hasPermission("company", "checklists", "view"),
    },
    {
      label: "Checklist History",
      icon: <HistoryIcon />,
      path: "/Company/Checklist-History",
      show: hasPermission("company", "checklistHistory", "view"),
    },
    {
      label: "Checklist Categories",
      icon: <CategoryIcon />,
      path: "/Company/Checklist-Types",
      show: hasPermission("company", "checklistTypes", "view"),
    },
    {
      label: "My Checklists",
      icon: <AssignmentIndIcon />,
      path: "/Company/My-Checklist",
      show: hasPermission("company", "myChecklists", "view"),
    },
    {
      label: "Contracts",
      icon: <DescriptionIcon />,
      path: "/Company/Contracts",
      show: hasPermission("company", "setup", "view"),
    },
  ], [hasPermission])

  // Filter tabs based on permissions - useMemo prevents unnecessary filtering
  const visibleTabs = useMemo(() => tabs.filter(tab => tab.show), [tabs])

  useEffect(() => {
    if (tabValue >= visibleTabs.length) {
      setTabValue(0)
    }
  }, [tabValue, visibleTabs.length])

  useEffect(() => {
    if (!visibleTabs.length) {
      return
    }

    const pathWithoutTrailingSlash = location.pathname.replace(/\/+$/, "")
    const matchedIndex = visibleTabs.findIndex((tab) =>
      pathWithoutTrailingSlash === tab.path || pathWithoutTrailingSlash.startsWith(`${tab.path}/`),
    )

    const defaultPath = visibleTabs[0]?.path

    if (matchedIndex === -1) {
      if (defaultPath && pathWithoutTrailingSlash !== defaultPath) {
        navigate(defaultPath, { replace: true })
      }
      if (tabValue !== 0) {
        setTabValue(0)
      }
      return
    }

    if (matchedIndex !== tabValue) {
      setTabValue(matchedIndex)
    }
  }, [location.pathname, navigate, tabValue, visibleTabs])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
    const selectedTab = visibleTabs[newValue]
    if (!selectedTab) {
      return
    }

    if (location.pathname !== selectedTab.path) {
      navigate(selectedTab.path)
    }
  }

  if (visibleTabs.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          p: 3,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Access Restricted
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          You don't have permission to access any company features. Please contact your administrator.
        </Typography>
      </Box>
    )
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
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="company tabs"
            sx={{
              px: 2,
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
            {visibleTabs.map((tab, _index) => (
              <Tab
                key={tab.path}
                icon={tab.icon}
                label={tab.label}
              />
            ))}
          </Tabs>
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

      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: "auto", 
          width: "100%",
        }}
      >
        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
          {(() => {
            const currentTab = visibleTabs[tabValue]
            if (!currentTab) return null
            
            switch (currentTab.path) {
              case "/Company/Dashboard":
                return <ChecklistDashboard />
              case "/Company/Info":
                return <CompanyInfo />
              case "/Company/SiteManagement":
                return <SiteManagement />
              case "/Company/User-Allocation":
                return <UserSiteAllocation />
              case "/Company/Permissions":
                return <Permissions />
              case "/Company/Checklists":
                return <Checklists />
              case "/Company/Checklist-History":
                return <ChecklistHistory />
              case "/Company/Checklist-Types":
                return <ChecklistTypes />
              case "/Company/My-Checklist":
                return <MyChecklist />
              case "/Company/Contracts":
                return <ContractManagement />
              default:
                return null
            }
          })()}
        </Suspense>
      </Box>
    </Box>
  )
}

export default Company
