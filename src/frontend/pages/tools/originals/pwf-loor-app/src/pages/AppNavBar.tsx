"use client"

import type React from "react"
import { useState } from "react"
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Switch,
  Badge,
  useMediaQuery,
  useTheme,
  Collapse,
  Avatar,
  Stack,
  Divider,
} from "@mui/material"
import {
  Menu as MenuIcon,
  Dashboard,
  Event,
  Logout,
  People,
  DarkMode,
  LightMode,
  TableBar,
  Fastfood,
  NoteAdd,
  TableRestaurant,
  CloudUpload,
  LibraryAddCheck,
  Engineering,
  Check,
  ExpandLess,
  ExpandMore,
  Restaurant,
  Person,
  TrackChanges,
  Inventory,
} from "@mui/icons-material"
import { useNavigate, useLocation } from "react-router-dom"
import { useLogIn } from "../context/LogInContext"
import { useRole } from "../context/RoleContext"
import { useThemeContext } from "../context/AppTheme"
import { logout } from "../components/AuthFunctions"

const AppNavbar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const { dispatch, state: userState } = useLogIn()
  const { state: roleState } = useRole()
  const { darkMode, toggleTheme } = useThemeContext()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [managementOpen, setManagementOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await logout(dispatch)
      navigate("/LogIn")
    } catch (error) {
      console.error("Error logging out", error)
    }
  }

  const holidaysPath = roleState.role === "Manager" ? "/Holiday" : "/Holidays"

  // Core menu items for all users
  const coreMenuItems = [
    { text: "Runsheet & Pre Orders", path: "/", icon: <Dashboard />, badge: 0 },
    { text: "Table Tracking", path: "/TableTracking", icon: <TrackChanges />, badge: 0 },
    { text: "Turn Over", path: "/Turnovers", icon: <TableBar />, badge: 0 },
    { text: "Numbers", path: "/Numbers", icon: <People />, badge: 0 },
    { text: "Item Summary", path: "/Summary", icon: <Fastfood />, badge: 0 },
    { text: "Brunch Shares", path: "/BrunchShares", icon: <Restaurant />, badge: 0 },
    { text: "Holidays", path: holidaysPath, icon: <Event />, badge: 0 },
    { text: "My Checklist", path: "/MyChecklist", icon: <Check />, badge: 0 },
    { text: "Notes", path: "/Notes", icon: <NoteAdd />, badge: 0 },
    { text: "Invite Staff", path: "/Invite", icon: <Person />, badge: 0 },
    { text: "Menus", path: "/Menus", icon: <Restaurant />, badge: 0 },
  ]

  // Management items (only for managers and specific roles)
  const managementItems = [
    ...(roleState.role === "Manager"
      ? [
          { text: "Staff", path: "/Staff", icon: <People />, badge: 0 },
          { text: "Upload", path: "/Upload", icon: <CloudUpload />, badge: 0 },
          { text: "Checklist", path: "/Checklist", icon: <LibraryAddCheck />, badge: 0 },
          { text: "Menu Management", path: "/MenuManagement", icon: <Restaurant />, badge: 0 },
          { text: "Assign Tables", path: "/AssignTables", icon: <TableRestaurant />, badge: 0 },
          { text: "Consumables", path: "/Consumables", icon: <Inventory />, badge: 0 },
        ]
      : []),
    ...(["Manager", "Maintenance"].includes(roleState.role || "Guest")
      ? [{ text: "Maintenance", path: "/Maintenance", icon: <Engineering />, badge: 0 }]
      : []),
    ...(["Manager", "Waiter"].includes(roleState.role || "Guest")
      ? [{ text: "Shared Tables", path: "/Shared", icon: <TableRestaurant />, badge: 0 }]
      : []),
  ]

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen)
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    setDrawerOpen(false) // Always close drawer on navigation
  }

  const isActivePath = (path: string) => location.pathname === path

  const renderMenuItem = (item: any, isNested = false) => (
    <ListItem
      key={item.text}
      onClick={() => handleNavigation(item.path)}
      sx={{
        borderRadius: 2,
        mb: 0.5,
        mx: isNested ? 2 : 1,
        cursor: "pointer",
        backgroundColor: isActivePath(item.path) ? theme.palette.primary.main + "15" : "transparent",
        "&:hover": {
          backgroundColor: theme.palette.primary.main + "10",
        },
        transition: "all 0.2s ease-in-out",
        maxWidth: "100%", // Ensure item doesn't exceed container width
        width: "auto", // Let item size naturally
        overflow: "hidden", // Hide overflow
      }}
    >
      <ListItemIcon
        sx={{
          color: isActivePath(item.path) ? theme.palette.primary.main : theme.palette.text.secondary,
          minWidth: 40,
        }}
      >
        <Badge badgeContent={item.badge > 0 ? item.badge : null} color="error">
          {item.icon}
        </Badge>
      </ListItemIcon>
      <ListItemText
        primary={item.text}
        sx={{
          "& .MuiTypography-root": {
            fontWeight: isActivePath(item.path) ? 600 : 400,
            color: isActivePath(item.path) ? theme.palette.primary.main : theme.palette.text.primary,
            fontSize: "0.9rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
        }}
      />
    </ListItem>
  )

  const drawerContent = (
    <Box
      sx={{
        width: "100%", // Use 100% instead of fixed width to match parent exactly
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden !important", // Force hide horizontal overflow
        overflowY: "auto",
        "&::-webkit-scrollbar": {
          display: "none !important", // Force hide scrollbar
          width: "0 !important",
          height: "0 !important",
        },
        "&::-webkit-scrollbar-track": {
          display: "none !important",
        },
        "&::-webkit-scrollbar-thumb": {
          display: "none !important",
        },
        msOverflowStyle: "none !important", // IE and Edge
        scrollbarWidth: "none !important", // Firefox
      }}
    >
      {/* Navigation */}
      <Box
        sx={{
          flex: 1,
          py: 2,
          overflowX: "hidden !important", // Also hide overflow on inner box
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            display: "none !important",
            width: "0 !important",
            height: "0 !important",
          },
          "&::-webkit-scrollbar-track": {
            display: "none !important",
          },
          "&::-webkit-scrollbar-thumb": {
            display: "none !important",
          },
          msOverflowStyle: "none !important",
          scrollbarWidth: "none !important",
          "& .MuiList-root": {
            width: "100%", // Ensure list takes full width
            padding: 0, // Remove default padding
          },
          "& .MuiListItem-root": {
            width: "auto", // Let items size naturally
            maxWidth: "100%", // But don't exceed container
          },
        }}
      >
        <List>
          {coreMenuItems.map((item) => renderMenuItem(item))}

          {managementItems.length > 0 && (
            <>
              <Divider sx={{ my: 2, mx: 2 }} />
              <ListItem
                onClick={() => setManagementOpen(!managementOpen)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  mx: 1,
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: theme.palette.primary.main + "10",
                  },
                }}
              >
                <ListItemIcon sx={{ color: theme.palette.text.secondary, minWidth: 40 }}>
                  <Engineering />
                </ListItemIcon>
                <ListItemText
                  primary="Management"
                  sx={{
                    "& .MuiTypography-root": {
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    },
                  }}
                />
                {managementOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItem>

              <Collapse in={managementOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {managementItems.map((item) => renderMenuItem(item, true))}
                </List>
              </Collapse>
            </>
          )}
        </List>
      </Box>

      {/* Footer with Account Info */}
      <Box sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
        {/* Theme Toggle */}
        <Box sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              {darkMode ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
              <Typography variant="body2" fontSize="0.85rem">
                {darkMode ? "Dark" : "Light"} Mode
              </Typography>
            </Stack>
            <Switch checked={darkMode} onChange={toggleTheme} size="small" />
          </Stack>
        </Box>

        <Divider />

        {/* Account Info */}
        <Box sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 40,
                height: 40,
              }}
            >
              <Person />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {userState.firstName || "User"}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {roleState.role || "Staff"}
              </Typography>
            </Box>
          </Stack>

          <ListItem
            onClick={handleSignOut}
            sx={{
              borderRadius: 2,
              cursor: "pointer",
              "&:hover": {
                backgroundColor: theme.palette.error.main + "10",
              },
              px: 1,
              py: 1,
            }}
          >
            <ListItemIcon sx={{ color: theme.palette.error.main, minWidth: 40 }}>
              <Logout />
            </ListItemIcon>
            <ListItemText
              primary="Sign Out"
              sx={{
                "& .MuiTypography-root": {
                  color: theme.palette.error.main,
                  fontWeight: 500,
                  fontSize: "0.9rem",
                },
              }}
            />
          </ListItem>
        </Box>
      </Box>
    </Box>
  )

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backdropFilter: "blur(8px)",
          borderRadius: 0, // Ensure no border radius
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              "&:hover": {
                backgroundColor: theme.palette.primary.main + "10",
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexGrow: 1 }}>
            <Restaurant color="primary" />
            <Typography variant="h6" fontWeight={700} color="primary">
              PW Tools
            </Typography>
          </Stack>

          {!isMobile && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton
                onClick={toggleTheme}
                color="inherit"
                sx={{
                  "&:hover": {
                    backgroundColor: theme.palette.primary.main + "10",
                  },
                }}
              >
                {darkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
              <IconButton
                onClick={handleSignOut}
                sx={{
                  color: theme.palette.error.main,
                  "&:hover": {
                    backgroundColor: theme.palette.error.main + "10",
                  },
                }}
              >
                <Logout />
              </IconButton>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 280,
            border: "none",
            boxShadow: theme.shadows[16],
            top: { xs: 56, sm: 64 }, // Start below the AppBar
            height: { xs: "calc(100% - 56px)", sm: "calc(100% - 64px)" },
            borderRadius: 0, // Ensure no border radius
            overflowX: "hidden !important", // Force hide horizontal overflow
            "&::-webkit-scrollbar": {
              display: "none !important", // Force hide scrollbar
              width: "0 !important",
            },
            msOverflowStyle: "none !important", // IE and Edge
            scrollbarWidth: "none !important", // Firefox
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  )
}

export default AppNavbar
