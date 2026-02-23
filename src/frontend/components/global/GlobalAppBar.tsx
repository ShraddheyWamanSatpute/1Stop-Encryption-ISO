"use client"

import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Badge, Box, Divider, ListItemIcon, ListItemText, Button, useTheme } from "@mui/material"
import { useNavigate } from "react-router-dom"
import {
  Dashboard,
  Inventory,
  Notifications,
  Settings,
  DarkMode,
  LightMode,
  Warning,
  ShoppingCart,
  People,
  EventNote,
  PointOfSale,
  Message,
  Login,
  AppRegistration,
  LockReset,
  AddCircle,
  ListAlt,
  TrendingUp,
  Receipt,
  RestaurantMenu,
  BarChart,
  AttachMoney,
  AccountBalance,
  Payment,
  MonetizationOn,
  Assessment,
} from "@mui/icons-material"
import { useSettings } from "../../../backend/context/SettingsContext"
import { useCompany } from "../../../backend/context/CompanyContext"
import { useNotifications } from "../../../backend/context/NotificationsContext"
import { areDependenciesReady } from "../../../backend/utils/ContextDependencies"
import { Alert } from "@mui/material"
import LocationSelector from "./LocationSelector"

// Add a keyframe animation for the logo
const logoAnimation = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
`

interface GlobalAppBarProps {
  darkMode: boolean
  toggleDarkMode: () => void
  sidebarOpen?: boolean
  toggleSidebar?: () => void
  sidebarWidth?: number
}

const GlobalAppBar = ({ darkMode, toggleDarkMode, sidebarWidth }: GlobalAppBarProps) => {
  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = useSettings()
  const { state: companyState } = useCompany()
  const { state: notificationsState, markAsRead, markAllAsRead } = useNotifications()
  
  // Check if core contexts (Settings and Company) are ready)
  // This ensures the top bar dropdowns load before other components access context data
  const coreContextsReady = areDependenciesReady(state, companyState)

  // Add style element for animations
  useEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = logoAnimation
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null)
  const isAuthPage =
    location.pathname === "/Login" || location.pathname === "/Register" || location.pathname === "/Reset-Password" ||
    location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/reset-password"

  // Helper function to convert PascalCase or camelCase to readable title
  const formatRouteTitle = (segment: string): string => {
    // Handle special cases first
    const specialCases: Record<string, string> = {
      "POS": "Point of Sale",
      "HR": "Human Resources",
      "ESS": "Employee Self Service",
      "OAuth": "OAuth",
      "HMRC": "HMRC",
      "AddItem": "Add New Item",
      "EditItem": "Edit Item",
      "AddPurchase": "Add Purchase Order",
      "EditPurchase": "Edit Purchase Order",
      "AddStockCount": "Add Stock Count",
      "EditStockCount": "Edit Stock Count",
      "AddParLevel": "Add Par Level",
      "ItemSales": "Item Sales",
      "TillScreen": "Till Screen",
      "TillUsage": "Till Usage",
      "TillManagement": "Till Management",
      "MenuManagement": "Menu Management",
      "MenuAdd": "Add Menu Item",
      "MenuEdit": "Edit Menu Item",
      "OrdersEdit": "Edit Order",
      "SiteManagement": "Site Management",
      "UserAllocation": "User Allocation",
      "ChecklistHistory": "Checklist History",
      "ChecklistTypes": "Checklist Types",
      "MyChecklist": "My Checklists",
      "ScheduleManager": "Schedule Manager",
      "AICalendar": "AI Calendar",
      "ChartOfAccounts": "Chart of Accounts",
      "ResetPassword": "Reset Password",
      "JoinCompany": "Join Company",
      "AcceptSiteInvite": "Accept Site Invite",
      "FloorFriend": "Floor Friend",
      "PdfToExcel": "PDF to Excel",
      "ExcelToPdf": "Excel to PDF",
      "ExcelReformat": "Excel Reformat",
      "PurchaseOrders": "Purchase Orders",
      "StockCounts": "Stock Counts",
      "ParLevels": "Par Levels",
    }

    if (specialCases[segment]) {
      return specialCases[segment]
    }

    // Convert PascalCase to Title Case
    // Split on capital letters and join with spaces
    const words = segment.replace(/([A-Z])/g, " $1").trim().split(" ")
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ")
  }

  // Get page title and icon based on current route
  const getPageInfo = () => {
    const path = location.pathname.toLowerCase()
    const pathSegments = location.pathname.split("/").filter(Boolean)
    
    // Handle root and dashboard
    if (path === "/" || path === "/dashboard" || pathSegments.length === 0) {
      return { title: "Dashboard", icon: <Dashboard /> }
    }

    // Get main section (first segment)
    const mainSection = pathSegments[0]
    const mainSectionLower = mainSection.toLowerCase()

    // Define section icons
    const sectionIcons: Record<string, React.ReactElement> = {
      "stock": <Inventory />,
      "hr": <People />,
      "bookings": <EventNote />,
      "pos": <PointOfSale />,
      "finance": <AttachMoney />,
      "company": <Settings />,
      "settings": <Settings />,
      "messenger": <Message />,
      "analytics": <BarChart />,
      "tools": <Settings />,
      "notifications": <Notifications />,
      "yourstop": <RestaurantMenu />,
      "login": <Login />,
      "register": <AppRegistration />,
      "resetpassword": <LockReset />,
      "reset-password": <LockReset />,
      "join": <AppRegistration />,
      "joincompany": <AppRegistration />,
      "acceptsiteinvite": <AppRegistration />,
      "mobile": <Settings />,
      "ess": <Settings />,
    }

    // Handle auth pages
    if (mainSectionLower === "login") return { title: "Login", icon: <Login /> }
    if (mainSectionLower === "register") return { title: "Register", icon: <AppRegistration /> }
    if (mainSectionLower === "resetpassword" || mainSectionLower === "reset-password") {
      return { title: "Reset Password", icon: <LockReset /> }
    }
    if (mainSectionLower === "joincompany") return { title: "Join Company", icon: <AppRegistration /> }
    if (mainSectionLower === "acceptsiteinvite") return { title: "Accept Site Invite", icon: <AppRegistration /> }

    // Handle main sections with no sub-routes
    if (pathSegments.length === 1) {
      const title = formatRouteTitle(mainSection)
      const icon = sectionIcons[mainSectionLower] || <Dashboard />
      return { title, icon }
    }

    // Handle sub-routes
    const subRoute = pathSegments[1]
    const subRouteFormatted = formatRouteTitle(subRoute)

    // Special handling for specific routes
    if (mainSectionLower === "stock") {
      if (subRoute === "AddItem" || subRoute === "Add-Item") return { title: "Add New Item", icon: <AddCircle /> }
      if (subRoute === "EditItem" || subRoute === "Edit-Item") return { title: "Edit Item", icon: <AddCircle /> }
      if (subRoute === "AddPurchase" || subRoute === "Add-Purchase") return { title: "Add Purchase Order", icon: <ShoppingCart /> }
      if (subRoute === "EditPurchase" || subRoute === "Edit-Purchase") return { title: "Edit Purchase Order", icon: <ShoppingCart /> }
      if (subRoute === "AddStockCount" || subRoute === "Add-Stock-Count") return { title: "Add Stock Count", icon: <ListAlt /> }
      if (subRoute === "EditStockCount" || subRoute === "Edit-Stock-Count") return { title: "Edit Stock Count", icon: <ListAlt /> }
      if (subRoute === "AddParLevel" || subRoute === "Add-Par-Level") return { title: "Add Par Level", icon: <TrendingUp /> }
      if (subRoute === "PurchaseOrders" || subRoute === "Purchase-Orders") return { title: "Purchase Orders", icon: <ShoppingCart /> }
      if (subRoute === "StockCounts" || subRoute === "Stock-Counts") return { title: "Stock Counts", icon: <ListAlt /> }
      if (subRoute === "ParLevels" || subRoute === "Par-Levels") return { title: "Par Levels", icon: <TrendingUp /> }
      if (subRoute === "Items") return { title: "Stock Items", icon: <Inventory /> }
      if (subRoute === "Management") {
        const managementSub = pathSegments[2]
        if (managementSub) {
          return { title: `${formatRouteTitle(managementSub)} - Stock Management`, icon: <Inventory /> }
        }
        return { title: "Stock Management", icon: <Inventory /> }
      }
      return { title: `${subRouteFormatted} - Stock`, icon: <Inventory /> }
    }

    if (mainSectionLower === "pos") {
      if (subRoute === "ItemSales" || subRoute === "Item-Sales") return { title: "Item Sales", icon: <PointOfSale /> }
      if (subRoute === "TillScreen" || subRoute === "Till-Screen") {
        const action = pathSegments[2]
        if (action === "Add") return { title: "Add Till Screen", icon: <AddCircle /> }
        if (action === "Edit") return { title: "Edit Till Screen", icon: <AddCircle /> }
        return { title: "Till Screen", icon: <Settings /> }
      }
      if (subRoute === "TillUsage" || subRoute === "Till-Usage") return { title: "Till Usage", icon: <BarChart /> }
      if (subRoute === "TillManagement" || subRoute === "Till-Management") return { title: "Till Management", icon: <Settings /> }
      if (subRoute === "MenuManagement" || subRoute === "Menu-Management") return { title: "Menu Management", icon: <RestaurantMenu /> }
      if (subRoute === "MenuAdd" || subRoute === "Menu/Add") return { title: "Add Menu Item", icon: <AddCircle /> }
      if (subRoute === "MenuEdit" || subRoute === "Menu/Edit") return { title: "Edit Menu Item", icon: <AddCircle /> }
      if (subRoute === "Orders" || subRoute === "OrdersEdit") return { title: "Orders", icon: <Receipt /> }
      if (subRoute === "Management") {
        const managementSub = pathSegments[2]
        if (managementSub) {
          return { title: `${formatRouteTitle(managementSub)} - POS Management`, icon: <PointOfSale /> }
        }
        return { title: "POS Management", icon: <PointOfSale /> }
      }
      return { title: `${subRouteFormatted} - POS`, icon: <PointOfSale /> }
    }

    if (mainSectionLower === "finance") {
      if (subRoute === "ChartOfAccounts" || subRoute === "Chart-Of-Accounts") return { title: "Chart of Accounts", icon: <AccountBalance /> }
      if (subRoute === "Transactions") return { title: "Transactions", icon: <Payment /> }
      if (subRoute === "Invoices") return { title: "Invoices", icon: <Receipt /> }
      if (subRoute === "Bills") return { title: "Bills", icon: <MonetizationOn /> }
      if (subRoute === "Reports") return { title: "Financial Reports", icon: <Assessment /> }
      return { title: `${subRouteFormatted} - Finance`, icon: <AttachMoney /> }
    }

    if (mainSectionLower === "company") {
      if (subRoute === "SiteManagement" || subRoute === "Site-Management") return { title: "Site Management", icon: <Settings /> }
      if (subRoute === "UserAllocation" || subRoute === "User-Allocation") return { title: "User Allocation", icon: <People /> }
      if (subRoute === "ChecklistHistory" || subRoute === "Checklist-History") return { title: "Checklist History", icon: <ListAlt /> }
      if (subRoute === "ChecklistTypes" || subRoute === "Checklist-Types") return { title: "Checklist Types", icon: <ListAlt /> }
      if (subRoute === "MyChecklist" || subRoute === "My-Checklist") return { title: "My Checklists", icon: <ListAlt /> }
      return { title: `${subRouteFormatted} - Company`, icon: <Settings /> }
    }

    if (mainSectionLower === "hr") {
      if (pathSegments.length > 2) {
        const subSubRoute = pathSegments[2]
        if (subRoute === "Management") {
          if (subSubRoute === "ScheduleManager" || subSubRoute === "Schedule-Manager") {
            return { title: "Schedule Manager", icon: <EventNote /> }
          }
          return { title: `${formatRouteTitle(subSubRoute)} - HR Management`, icon: <People /> }
        }
        return { title: `${formatRouteTitle(subSubRoute)} - ${formatRouteTitle(subRoute)}`, icon: <People /> }
      }
      return { title: `${subRouteFormatted} - HR`, icon: <People /> }
    }

    if (mainSectionLower === "bookings") {
      return { title: `${subRouteFormatted} - Bookings`, icon: <EventNote /> }
    }

    if (mainSectionLower === "settings") {
      return { title: `${subRouteFormatted} - Settings`, icon: <Settings /> }
    }

    // Default: format the last segment as title
    const lastSegment = pathSegments[pathSegments.length - 1]
    const title = formatRouteTitle(lastSegment)
    const icon = sectionIcons[mainSectionLower] || <Dashboard />

    return { title, icon }
  }


  // Don't show the full app bar on auth pages
  if (isAuthPage) {
    return (
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          boxShadow: 1,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          borderRadius: 0,
          transition: theme.transitions.create(["margin", "width"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          // Auth pages use full width
          width: '100%',
          marginLeft: 0,
        }}
      >
        <Toolbar>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Inventory
              sx={{
                mr: 1,
                animation: "spin 2s infinite ease-in-out",
              }}
            />
            <Typography variant="h6" component="h1" sx={{ fontWeight: "bold" }}>
              1 Stop
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton color="inherit" onClick={toggleDarkMode}>
            {darkMode ? <LightMode /> : <DarkMode />}
          </IconButton>
        </Toolbar>
      </AppBar>
    )
  }

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        boxShadow: 1,
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        borderRadius: 0,
        transition: theme.transitions.create(["margin", "width"], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        // Adjust width and position based on sidebar state
        width: `calc(100% - ${sidebarWidth || 240}px)`,
        marginLeft: `${sidebarWidth || 240}px`,
        // On mobile, use full width
        '@media (max-width: 960px)': {
          width: '100%',
          marginLeft: 0,
        },
      }}
    >
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              "& > svg": {
                animation:
                  location.pathname === "/"
                    ? "bounce 2s infinite ease-in-out"
                    : location.pathname.includes("/stock")
                      ? "pulse 2s infinite ease-in-out"
                      : location.pathname.includes("/pos")
                        ? "spin 3s infinite linear"
                        : location.pathname.includes("/hr")
                          ? "pulse 2s infinite ease-in-out"
                          : location.pathname.includes("/bookings")
                            ? "bounce 2s infinite ease-in-out"
                            : location.pathname.includes("/finance")
                              ? "pulse 1.5s infinite ease-in-out"
                              : "none",
              },
            }}
          >
            {getPageInfo().icon}
          </Box>
          <Typography variant="h6" component="h1" sx={{ fontWeight: "bold", ml: 1 }}>
            {getPageInfo().title}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {state && coreContextsReady && (
            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
              <LocationSelector />
            </Box>
          )}

          <IconButton color="inherit" onClick={toggleDarkMode}>
            {darkMode ? <LightMode /> : <DarkMode />}
          </IconButton>

          <IconButton color="inherit" onClick={(e) => setNotificationsAnchor(e.currentTarget)}>
            <Badge badgeContent={notificationsState.unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          <Menu
            anchorEl={notificationsAnchor}
            open={Boolean(notificationsAnchor)}
            onClose={() => setNotificationsAnchor(null)}
            PaperProps={{ sx: { width: 320, maxHeight: 400 } }}
          >
            <MenuItem sx={{ justifyContent: "space-between" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Notifications
              </Typography>
              <Button size="small" onClick={markAllAsRead}>Mark all as read</Button>
            </MenuItem>
            <Divider />
            {notificationsState.notifications.length === 0 ? (
              <MenuItem>
                <ListItemText
                  primary="No notifications"
                  secondary="You're all caught up!"
                  secondaryTypographyProps={{ fontSize: "0.75rem" }}
                />
              </MenuItem>
            ) : (
              notificationsState.notifications.slice(0, 5).map((notification) => {
                const getNotificationIcon = () => {
                  switch (notification.category) {
                    case 'warning': return <Warning color="warning" fontSize="small" />
                    case 'error': return <Warning color="error" fontSize="small" />
                    case 'success': return <Inventory color="success" fontSize="small" />
                    case 'alert': return <Warning color="error" fontSize="small" />
                    default: return <Notifications color="info" fontSize="small" />
                  }
                }

                return (
                  <MenuItem 
                    key={notification.id}
                    sx={{ 
                      bgcolor: notification.read ? "transparent" : "action.hover",
                      cursor: "pointer"
                    }}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <ListItemIcon>
                      {getNotificationIcon()}
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.title}
                      secondary={`${notification.message} • ${new Date(notification.timestamp).toLocaleTimeString()}`}
                      secondaryTypographyProps={{ fontSize: "0.75rem" }}
                    />
                  </MenuItem>
                )
              })
            )}
            <Divider />
            <MenuItem 
              sx={{ justifyContent: "center", cursor: "pointer" }}
              onClick={() => {
                setNotificationsAnchor(null)
                navigate('/notifications')
              }}
            >
              <Typography color="primary">View all notifications</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
      {!companyState.companyID && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Alert severity="info">Select a company to get started.</Alert>
        </Box>
      )}
    </AppBar>
  )
}

export default GlobalAppBar
