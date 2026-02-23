"use client"

import { useLocation, Link as RouterLink, useNavigate } from "react-router-dom"
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Avatar,
  Typography,
  useTheme,
} from "@mui/material"
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  ShoppingCart as ShoppingCartIcon,
  Message as MessageIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Logout as LogoutIcon,
  AttachMoney as AttachMoneyIcon,
  Business as BusinessIcon,
  Calculate as CalculatorIcon,
  SmartToy as AssistantIcon,
} from "@mui/icons-material"
import { useSettings } from "../../../backend/context/SettingsContext"
import { ViewPermission } from "../company/PermissionFilter"
import { useCompany } from "../../../backend/context/CompanyContext"
import { useState, useEffect } from "react"
import { useCalculator } from "../../../backend/context/CalculatorContext"
import { useAssistant } from "../../../backend/context/AssistantContext"
import { logout } from "../../../backend/functions/Settings"

const navigationItems = [
  { name: "Dashboard", icon: DashboardIcon, path: "/Temp" },
  { name: "Stock", icon: InventoryIcon, path: "/Stock" },
  { name: "HR", icon: PeopleIcon, path: "/HR" },
  { name: "Bookings", icon: CalendarIcon, path: "/Bookings" },
  { name: "POS", icon: ShoppingCartIcon, path: "/POS" },
  { name: "Finance", icon: AttachMoneyIcon, path: "/Finance" },
  { name: "Messenger", icon: MessageIcon, path: "/Messenger" },
  { name: "Company", icon: BusinessIcon, path: "/Company" },
  { name: "Settings", icon: SettingsIcon, path: "/Settings" },
]

const bottomNavigationItems = [
  { name: "Calculator", icon: CalculatorIcon, path: "#", action: "openCalculator" },
  { name: "Assistant", icon: AssistantIcon, path: "#", action: "openAssistant" },
]


interface SidebarProps {
  open: boolean
  toggleSidebar: () => void
}

const Sidebar = ({ open, toggleSidebar }: SidebarProps) => {
  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = useSettings()
  useCompany()
  const { openAssistant } = useAssistant()

  const drawerWidth = open ? 240 : 64
  const { openCalculator } = useCalculator()
 
  const [userProfile, setUserProfile] = useState<{
    firstName: string
    lastName: string
    email?: string
  } | undefined>(undefined)

  const [loadingProfile, setLoadingProfile] = useState(true)


  // Set user profile synchronously (no loading delays)
  useEffect(() => {
    if (!state.auth.uid) {
      setUserProfile(undefined)
      setLoadingProfile(false)
      return
    }

    // Don't update profile during loading to prevent flashing
    if (state.loading) {
      return
    }

    let firstName = "User"
    let lastName = ""
    let email = state.auth.email || ""

    // Priority 1: Personal settings (most reliable)
    if (state.settings?.personal?.firstName && state.settings?.personal?.lastName) {
      firstName = state.settings.personal.firstName
      lastName = state.settings.personal.lastName
      email = state.user?.email || state.auth.email || ""
    }
    // Priority 2: User object properties
    else if (state.user) {
      const userWithNames = state.user as any
      if (userWithNames.firstName && userWithNames.lastName) {
        firstName = userWithNames.firstName
        lastName = userWithNames.lastName
        email = state.user.email || state.auth.email || ""
      }
      // Priority 3: Display name parsing
      else if (state.user.displayName) {
        const nameParts = state.user.displayName.split(' ')
        firstName = nameParts[0] || "User"
        lastName = nameParts.slice(1).join(' ') || ""
        email = state.user.email || state.auth.email || ""
      }
      // Priority 4: Auth display name
      else if (state.auth.displayName) {
        const nameParts = state.auth.displayName.split(' ')
        firstName = nameParts[0] || "User"
        lastName = nameParts.slice(1).join(' ') || ""
      }
      // Priority 5: Email username
      else if (state.user.email) {
        firstName = state.user.email.split('@')[0] || "User"
        email = state.user.email
      }
    }
    // Priority 6: Auth display name fallback
    else if (state.auth.displayName) {
      const nameParts = state.auth.displayName.split(' ')
      firstName = nameParts[0] || "User"
      lastName = nameParts.slice(1).join(' ') || ""
    }

    // Set profile immediately (no async delays)
    setUserProfile({
      firstName,
      lastName,
      email
    })
    setLoadingProfile(false)
  }, [state.auth.uid, state.settings?.personal?.firstName, state.settings?.personal?.lastName, state.user?.displayName, state.auth.displayName, state.user?.email, state.auth.email, state.loading])

  // Don't show sidebar on auth pages (check both PascalCase and lowercase for backward compatibility)
  if (location.pathname === "/Login" || location.pathname === "/Register" || location.pathname === "/Reset-Password" ||
      location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/reset-password") {
    return null
  }

  const handleSignOut = async () => {
    try {
      // Fix nullable type issues by providing empty string fallbacks
      await logout()
      navigate("/Login")
    } catch (error) {
      console.error("Error logging out", error)
    }
  }


  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          borderRadius: 0,
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          overflowX: "hidden",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          justifyContent: open ? "space-between" : "center",
          padding: theme.spacing(2),
        }}
      >
        {open ? (
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            1 Stop
          </Typography>
        ) : (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src="/logo.png"
              alt="1 Stop Logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </Box>
        )}
        <IconButton
          onClick={toggleSidebar}
          sx={{
            color: theme.palette.primary.contrastText,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.2)",
            },
          }}
        >
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>
      <Divider sx={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
      <List sx={{ flexGrow: 1 }}>
        {navigationItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(`${item.path}/`))

          return (
            <ViewPermission
              key={item.name}
              module={item.name.toLowerCase()}
              page={item.name.toLowerCase()}
            >
              <ListItem disablePadding>
                <Tooltip title={open ? "" : item.name} placement="right">
                  <ListItemButton
                    component={RouterLink}
                    to={item.path}
                    selected={isActive}
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? "initial" : "center",
                      px: 2.5,
                      "&.Mui-selected": {
                        backgroundColor: "rgba(255, 255, 255, 0.15)",
                        "&:hover": {
                          backgroundColor: "rgba(255, 255, 255, 0.25)",
                        },
                      },
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 3 : "auto",
                        justifyContent: "center",
                        color: theme.palette.primary.contrastText,
                      }}
                    >
                      <item.icon />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.name}
                      sx={{ opacity: open ? 1 : 0 }}
                    />
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            </ViewPermission>
          )
        })}

      </List>
      
      {/* Bottom Navigation Items */}
      <List>
        {bottomNavigationItems.map((item) => {
          return (
            <ListItem key={item.name} disablePadding>
              <Tooltip title={open ? "" : item.name} placement="right">
                <ListItemButton
                  component={item.action ? 'button' : RouterLink}
                  to={item.action ? undefined : item.path}
                  onClick={item.action === 'openCalculator' ? openCalculator : item.action === 'openAssistant' ? openAssistant : undefined}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? "initial" : "center",
                    px: 2.5,
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : "auto",
                      justifyContent: "center",
                      color: theme.palette.primary.contrastText,
                    }}
                  >
                    <item.icon />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.name}
                    sx={{ opacity: open ? 1 : 0 }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          )
        })}
      </List>
      
      <Divider sx={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar sx={{ width: 36, height: 36, mr: open ? 1.5 : 0 }}>
              {loadingProfile ? "..." : 
                (userProfile && userProfile.firstName) ? 
                  userProfile.firstName.charAt(0) + (userProfile.lastName ? userProfile.lastName.charAt(0) : "") : 
                  "U"}
            </Avatar>
            {open && (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {loadingProfile ? "Loading..." : 
                    (userProfile ? 
                      `${userProfile.firstName}${userProfile.lastName ? " " + userProfile.lastName : ""}` : 
                      "User")}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                  {userProfile?.email || state.user?.email || "user@example.com"}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        <Tooltip title={open ? "" : "Logout"}>
          <ListItemButton
            onClick={handleSignOut}
            sx={{
              borderRadius: 1,
              justifyContent: open ? "initial" : "center",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 2 : "auto",
                justifyContent: "center",
                color: "rgba(255, 255, 255, 0.7)",
              }}
            >
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              sx={{
                opacity: open ? 1 : 0,
                "& .MuiListItemText-primary": {
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "0.875rem",
                },
              }}
            />
          </ListItemButton>
        </Tooltip>
      </Box>
    </Drawer>
  )
}

export default Sidebar
