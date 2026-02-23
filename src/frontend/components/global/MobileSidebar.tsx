"use client"

import { useState } from "react"
import { useLocation, Link as RouterLink, useNavigate } from "react-router-dom"
import { useSettings } from "../../../backend/context/SettingsContext"
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
  Avatar,
  Typography,
  useTheme,
  AppBar,
  Toolbar,
  Collapse,
} from "@mui/material"
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  ShoppingCart as ShoppingCartIcon,
  Message as MessageIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Logout as LogoutIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  AttachMoney as AttachMoneyIcon,
  Build as BuildIcon,
  ExpandLess,
  ExpandMore,
  Map as MapIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Transform as TransformIcon,
} from "@mui/icons-material"
import { useThemeContext } from "../../styles/ThemeProvider"
import { logout } from "../../../backend/functions/Settings"
import { getCurrentUser } from "../../../backend/functions/Settings"
import { useEffect } from "react"
import CompanyDropdown from "./CompanyDropdown"
import SiteDropdown from "./SiteDropdown"

const navigationItems = [
  { name: "Dashboard", icon: DashboardIcon, path: "/" },
  { name: "Stock", icon: InventoryIcon, path: "/Stock" },
  { name: "HR", icon: PeopleIcon, path: "/HR" },
  { name: "Bookings", icon: CalendarIcon, path: "/Bookings" },
  { name: "POS", icon: ShoppingCartIcon, path: "/POS" },
  { name: "Finance", icon: AttachMoneyIcon, path: "/Finance" },
  { name: "Messenger", icon: MessageIcon, path: "/Messenger" },
  { name: "Company", icon: BusinessIcon, path: "/Company" },
  { name: "Settings", icon: SettingsIcon, path: "/Settings" },
]

const toolsItems = [
  { name: "FloorFriend", icon: MapIcon, path: "/Tools/Floor-Friend" },
  { name: "PDF to Excel", icon: PdfIcon, path: "/Tools/Pdf-To-Excel" },
  { name: "Excel to PDF", icon: ExcelIcon, path: "/Tools/Excel-To-Pdf" },
  { name: "Excel Reformat", icon: TransformIcon, path: "/Tools/Excel-Reformat" },
]

interface MobileSidebarProps {
  open: boolean
  toggleSidebar: () => void
}

const MobileSidebar = ({ open, toggleSidebar }: MobileSidebarProps) => {
  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { darkMode, toggleDarkMode } = useThemeContext()
  const { state } = useSettings()

  const [userProfile, setUserProfile] = useState<{
    firstName: string
    lastName: string
  } | null>(null)

  const [toolsOpen, setToolsOpen] = useState(false)

  useEffect(() => {
    const getUserProfile = async () => {
      if (state.auth.uid) {
        const profile = await getCurrentUser()
        if (profile) {
          setUserProfile({
            firstName: (profile as any).firstName || profile.displayName?.split(' ')[0] || '',
            lastName: (profile as any).lastName || profile.displayName?.split(' ')[1] || '',
          })
        }
      }
    }

    getUserProfile()
  }, [state.auth.uid])

  const handleSignOut = async () => {
    try {
      await logout()
      navigate("/Login")
    } catch (error) {
      console.error("Error logging out", error)
    }
  }

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: theme.palette.primary.main,
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={toggleSidebar} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            1 Stop
          </Typography>
          <IconButton color="inherit" onClick={toggleDarkMode}>
            {darkMode === false ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
          <Avatar sx={{ ml: 1, width: 32, height: 32 }}>
            {userProfile ? `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}` : "U"}
          </Avatar>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* This is to offset the content below the AppBar */}
      <Drawer
        anchor="left"
        open={open}
        onClose={toggleSidebar}
        sx={{
          "& .MuiDrawer-paper": {
            width: 280,
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <img
              src="/logo.png"
              alt="1 Stop Logo"
              style={{
                width: 32,
                height: 32,
                marginRight: 12,
                objectFit: "contain",
              }}
            />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              1 Stop
            </Typography>
          </Box>
          <IconButton
            onClick={toggleSidebar}
            sx={{
              color: theme.palette.primary.contrastText,
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }} />

        {/* Company and Site Dropdowns at the top */}
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: "rgba(255, 255, 255, 0.7)" }}>
            Company & Location
          </Typography>

          <Box
            sx={{
              borderRadius: 1,
              mb: 1,
              p: 1,
              display: "flex",
              alignItems: "center",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <BusinessIcon
              fontSize="small"
              sx={{
                mr: 2,
                color: "rgba(255, 255, 255, 0.7)",
              }}
            />
            <Box sx={{ flexGrow: 1 }}>
              <CompanyDropdown />
            </Box>
          </Box>

          <Box
            sx={{
              borderRadius: 1,
              mb: 1,
              p: 1,
              display: "flex",
              alignItems: "center",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <LocationOnIcon
              fontSize="small"
              sx={{
                mr: 2,
                color: "rgba(255, 255, 255, 0.7)",
              }}
            />
            <Box sx={{ flexGrow: 1 }}>
              <SiteDropdown />
            </Box>
          </Box>
        </Box>
        <Divider sx={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }} />

        <List sx={{ flexGrow: 1 }}>
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
            return (
              <ListItem key={item.name} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={item.path}
                  selected={isActive}
                  onClick={toggleSidebar}
                  sx={{
                    minHeight: 48,
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
                      mr: 2,
                      justifyContent: "center",
                      color: theme.palette.primary.contrastText,
                    }}
                  >
                    <item.icon />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.name}
                    sx={{
                      "& .MuiListItemText-primary": {
                        fontWeight: isActive ? 600 : 400,
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )
          })}

          {/* Tools Section */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => setToolsOpen(!toolsOpen)}
              selected={location.pathname.startsWith("/tools")}
              sx={{
                minHeight: 48,
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
                  mr: 2,
                  justifyContent: "center",
                  color: theme.palette.primary.contrastText,
                }}
              >
                <BuildIcon />
              </ListItemIcon>
              <ListItemText
                primary="Tools"
                sx={{
                  "& .MuiListItemText-primary": {
                    fontWeight: location.pathname.startsWith("/tools") ? 600 : 400,
                  },
                }}
              />
              {toolsOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={toolsOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {toolsItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <ListItem key={item.name} disablePadding>
                    <ListItemButton
                      component={RouterLink}
                      to={item.path}
                      selected={isActive}
                      onClick={toggleSidebar}
                      sx={{
                        pl: 4,
                        minHeight: 40,
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
                          mr: 2,
                          justifyContent: "center",
                          color: theme.palette.primary.contrastText,
                        }}
                      >
                        <item.icon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.name}
                        sx={{
                          "& .MuiListItemText-primary": {
                            fontSize: "0.875rem",
                            fontWeight: isActive ? 600 : 400,
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                )
              })}
            </List>
          </Collapse>
        </List>
        <Divider sx={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
              {userProfile ? `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}` : "U"}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : "User"}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                {state.auth.email || "user@example.com"}
              </Typography>
            </Box>
          </Box>

          <ListItemButton
            onClick={handleSignOut}
            sx={{
              borderRadius: 1,
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: 2,
                justifyContent: "center",
                color: "rgba(255, 255, 255, 0.7)",
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              sx={{
                "& .MuiListItemText-primary": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
              }}
            />
          </ListItemButton>
        </Box>
      </Drawer>
    </>
  )
}

export default MobileSidebar
