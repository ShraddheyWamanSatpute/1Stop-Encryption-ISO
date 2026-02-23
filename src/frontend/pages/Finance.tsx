"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  IconButton,
} from "@mui/material"
import {
  Dashboard as DashboardIcon,
  PointOfSale as SalesIcon,
  AccountBalance as BankingIcon,
  ShoppingCart as PurchasesIcon,
  Receipt as ExpensesIcon,
  Contacts as ContactsIcon,
  Calculate as AccountingIcon,
  BarChart as ReportsIcon,
  CurrencyExchange as CurrencyIcon,
  AccountBalanceWallet as BudgetingIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material"

// Import all finance components
import Dashboard from "./finance/Dashboard"
import Sales from "./finance/Sales"
import Banking from "./finance/Banking"
import Purchases from "./finance/Purchases"
import Expenses from "./finance/Expenses"
import Contacts from "./finance/Contacts"
import Accounting from "./finance/Accounting"
import Reports from "./finance/Reports"
import Currency from "./finance/Currency"
import Budgeting from "./finance/Budgeting"
import Settings from "./finance/Settings"

// Import Finance context
import { useFinance } from "../../backend/context/FinanceContext"
import { useCompany } from "../../backend/context/CompanyContext"
import { useNavigate, useLocation } from "react-router-dom"

const Finance = () => {
  // Use the Finance context to access finance data and actions
  // Note: Data loading is handled automatically by FinanceContext
  const { state: companyState, hasPermission } = useCompany()
  const navigate = useNavigate()
  const location = useLocation()

  const [activeTab, setActiveTab] = useState(0)
  const [isTabsExpanded, setIsTabsExpanded] = useState(true)
  const navigationRef = useRef<string | null>(null)

  // Note: Finance data initialization is handled by FinanceContext
  // No need to call refreshAll() here - it causes duplicate loading

  // Show message if no company/site selected
  if (!companyState.companyID || !companyState.selectedSiteID) {
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
          Finance Management
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Please select a company and site to access financial data.
        </Typography>
      </Box>
    )
  }

  // Define main navigation categories with permission checks - memoize to prevent re-renders
  const mainCategories = useMemo(() => [
    {
      id: 0,
      label: "Dashboard",
      slug: "dashboard",
      icon: <DashboardIcon />,
      component: <Dashboard />,
      permission: hasPermission("finance", "dashboard", "view"),
    },
    {
      id: 1,
      label: "Sales",
      slug: "sales",
      icon: <SalesIcon />,
      component: <Sales />,
      permission: hasPermission("finance", "sales", "view"),
    },
    {
      id: 2,
      label: "Banking",
      slug: "banking",
      icon: <BankingIcon />,
      component: <Banking />,
      permission: hasPermission("finance", "banking", "view"),
    },
    {
      id: 3,
      label: "Purchases",
      slug: "purchases",
      icon: <PurchasesIcon />,
      component: <Purchases />,
      permission: hasPermission("finance", "purchases", "view"),
    },
    {
      id: 4,
      label: "Expenses",
      slug: "expenses",
      icon: <ExpensesIcon />,
      component: <Expenses />,
      permission: hasPermission("finance", "expenses", "view"),
    },
    {
      id: 5,
      label: "Contacts",
      slug: "contacts",
      icon: <ContactsIcon />,
      component: <Contacts />,
      permission: hasPermission("finance", "contacts", "view"),
    },
    {
      id: 6,
      label: "Accounting",
      slug: "accounting",
      icon: <AccountingIcon />,
      component: <Accounting />,
      permission: hasPermission("finance", "accounting", "view"),
    },
    {
      id: 7,
      label: "Currency",
      slug: "currency",
      icon: <CurrencyIcon />,
      component: <Currency />,
      permission: hasPermission("finance", "currency", "view"),
    },
    {
      id: 8,
      label: "Budgeting",
      slug: "budgeting",
      icon: <BudgetingIcon />,
      component: <Budgeting />,
      permission: hasPermission("finance", "budgeting", "view"),
    },
    {
      id: 9,
      label: "Reports",
      slug: "reports",
      icon: <ReportsIcon />,
      component: <Reports />,
      permission: hasPermission("finance", "reports", "view"),
    },
    {
      id: 10,
      label: "Settings",
      slug: "settings",
      icon: <SettingsIcon />,
      component: <Settings />,
      permission: hasPermission("finance", "settings", "edit"),
    },
  ], [hasPermission])

  // Memoize visibleCategories to prevent unnecessary re-renders
  const visibleCategories = useMemo(() => {
    return mainCategories.filter((category) => category.permission)
  }, [mainCategories])

  // Show message if no categories are visible due to permissions
  if (visibleCategories.length === 0) {
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
          You don't have permission to access any finance features. Please contact your administrator.
        </Typography>
      </Box>
    )
  }

  useEffect(() => {
    if (activeTab >= visibleCategories.length) {
      setActiveTab(0)
    }
  }, [visibleCategories.length, activeTab])

  useEffect(() => {
    if (!visibleCategories.length) {
      return
    }

    const pathWithoutTrailingSlash = location.pathname.replace(/\/+$/, "")
    
    // Prevent infinite loops by checking if we just navigated to this path
    if (navigationRef.current === pathWithoutTrailingSlash) {
      navigationRef.current = null
      return
    }

    const pathSegments = pathWithoutTrailingSlash.split("/").filter(Boolean)
    const financeIndex = pathSegments.findIndex((segment) => segment === "Finance" || segment === "finance")
    const tabSegment = financeIndex !== -1 ? pathSegments[financeIndex + 1] : undefined

    const defaultSlug = visibleCategories[0]?.slug
    const slugToPascalPath = (slug: string) => {
      return slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("")
    }

    if (!tabSegment) {
      if (defaultSlug) {
        const defaultPath = `/Finance/${slugToPascalPath(defaultSlug)}`
        // Only navigate if we're not already on the correct path
        if (location.pathname !== defaultPath && !location.pathname.startsWith(defaultPath + "/")) {
          navigationRef.current = defaultPath
          navigate(defaultPath, { replace: true })
          return
        }
      }
      if (activeTab !== 0) {
        setActiveTab(0)
      }
      return
    }

    // Match category by slug, handling both PascalCase paths and lowercase slugs
    const matchedIndex = visibleCategories.findIndex((category) => {
      const pascalSlug = slugToPascalPath(category.slug)
      return category.slug === tabSegment || pascalSlug === tabSegment || tabSegment?.toLowerCase() === category.slug
    })
    if (matchedIndex === -1) {
      if (defaultSlug) {
        const defaultPath = `/Finance/${slugToPascalPath(defaultSlug)}`
        // Only navigate if we're not already on the correct path
        if (location.pathname !== defaultPath && !location.pathname.startsWith(defaultPath + "/")) {
          navigationRef.current = defaultPath
          navigate(defaultPath, { replace: true })
          return
        }
      }
      if (activeTab !== 0) {
        setActiveTab(0)
      }
      return
    }

    if (matchedIndex !== activeTab) {
      setActiveTab(matchedIndex)
    }
  }, [activeTab, location.pathname, navigate, visibleCategories.length])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)

    const selectedCategory = visibleCategories[newValue]
    if (!selectedCategory?.slug) {
      return
    }

    const slugToPascalPath = (slug: string) => {
      return slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("")
    }
    const targetPath = `/Finance/${slugToPascalPath(selectedCategory.slug)}`
    if (location.pathname !== targetPath) {
      navigate(targetPath)
    }
  }

  const toggleTabsExpanded = () => {
    setIsTabsExpanded(!isTabsExpanded)
  }

  // Main layout (Top horizontal tabs like Bookings and HR)
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
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
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
            {visibleCategories.map((category) => (
              <Tab key={category.slug ?? category.id} icon={category.icon} label={category.label} />
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
        {/* Render the appropriate component based on active tab */}
        {visibleCategories[activeTab] && visibleCategories[activeTab].component}
      </Box>
    </Box>
  )
}

export default Finance
