"use client";

import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Box, useMediaQuery, useTheme, CircularProgress } from "@mui/material";
import Sidebar from "../components/global/Sidebar";
import MobileSidebar from "../components/global/MobileSidebar";
import GlobalAppBar from "../components/global/GlobalAppBar";
import { useThemeContext } from "../styles/ThemeProvider";
import { useSettings } from "../../backend/context/SettingsContext";
import { useCompany } from "../../backend/context/CompanyContext";
import { isSettingsReady, isCompanyReady } from "../../backend/utils/ContextDependencies";
import AutoSelectSiteOnBoot from "../components/global/AutoSelectSiteOnBoot";


const MainLayout = () => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { darkMode, toggleDarkMode } = useThemeContext();

  const { state: settingsState } = useSettings();
  const { state: companyState } = useCompany();
  
  // Track if core contexts are ready using state (same approach as LazyProviders)
  // This ensures we wait for contexts to be fully initialized, not just checked during render
  const [coreContextsReady, setCoreContextsReady] = useState(false);
  
  // Check if Settings and Company are ready (using useEffect to avoid race conditions)
  useEffect(() => {
    const settingsReady = isSettingsReady(settingsState);
    const companyReady = isCompanyReady(companyState, settingsState);
    const ready = settingsReady && companyReady;
    
    if (ready && !coreContextsReady) {
      setCoreContextsReady(true);
    } else if (!ready && coreContextsReady) {
      // Reset if contexts become unready (shouldn't happen, but handle gracefully)
      setCoreContextsReady(false);
    }
  }, [settingsState, companyState, coreContextsReady]);

  // Calculate sidebar width for animations
  const sidebarWidth = sidebarOpen ? 240 : 64;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Check if we're on an auth page (check both PascalCase and lowercase for backward compatibility)
  const isAuthPage =
    location.pathname === "/Login" || location.pathname === "/Register" || location.pathname === "/Reset-Password" ||
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/reset-password";

  // Close sidebar by default on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  if (isAuthPage) {
    return (
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: "auto",
        }}
      >
        <GlobalAppBar
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          sidebarWidth={sidebarWidth}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflow: "auto",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: theme.palette.background.default }}>
      {isMobile ? (
        <MobileSidebar open={sidebarOpen} toggleSidebar={toggleSidebar} />
      ) : (
        <Sidebar open={sidebarOpen} toggleSidebar={toggleSidebar} />
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: "auto",
          backgroundColor: theme.palette.background.default,
          transition: theme.transitions.create(["margin", "width"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: isMobile ? 0 : 0,
          width: isMobile ? "100%" : `calc(100% - ${sidebarWidth}px)`,
        }}
      >
        <GlobalAppBar
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          sidebarWidth={sidebarWidth}
        />
          <AutoSelectSiteOnBoot />
        <Box
          sx={{
            padding: theme.spacing(3),
            paddingTop: theme.spacing(11), // Add space for fixed AppBar
            transition: theme.transitions.create("padding", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          {!coreContextsReady ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "50vh",
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Outlet />
            </>
          )}
        </Box>
      </Box>
      
    </Box>
  );
};

export default MainLayout;
