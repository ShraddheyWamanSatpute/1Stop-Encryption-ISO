"use client"

import React, { useState, useEffect } from "react"
import { Box, useMediaQuery, useTheme, Drawer, IconButton, AppBar, Toolbar, Typography, CircularProgress } from "@mui/material"
import { Menu as MenuIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material"
import { useMessenger } from "../../backend/context/MessengerContext"
import { useCompany } from "../../backend/context/CompanyContext"
import ChatSidebar from "../components/messenger/ChatSidebar"
import ChatArea from "../components/messenger/ChatArea"
import NewChatDialog from "../components/messenger/NewChatDialog"
import ContactsManager from "../components/messenger/ContactsManager"

const SIDEBAR_WIDTH = 320
const COLLAPSED_SIDEBAR_WIDTH = 72

const Messenger: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  
  let messengerState, setActiveChat, refreshChats, companyState, hasPermission
  
  try {
    const messenger = useMessenger()
    messengerState = messenger?.state || null
    setActiveChat = messenger?.setActiveChat || (() => {})
    refreshChats = messenger?.refreshChats || (async () => {})
  } catch (error) {
    console.error('Error in useMessenger:', error)
    // Return error UI immediately
    return (
      <Box sx={{ p: 3, textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="h6" color="error">
          Error: Messenger context failed to load
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          {error instanceof Error ? error.message : String(error)}
        </Typography>
      </Box>
    )
  }
  
  try {
    const company = useCompany()
    companyState = company?.state || null
    hasPermission = company?.hasPermission || (() => false)
  } catch (error) {
    console.error('Error in useCompany:', error)
    return (
      <Box sx={{ p: 3, textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="h6" color="error">
          Error: Company context failed to load
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          {error instanceof Error ? error.message : String(error)}
        </Typography>
      </Box>
    )
  }
  
  // Show loading state if contexts aren't ready yet
  if (!companyState || !messengerState) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading Messenger...
        </Typography>
      </Box>
    )
  }

  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [showContactsManager, setShowContactsManager] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const [sidebarCollapsed] = useState(false)

  const sidebarWidth = sidebarCollapsed ? COLLAPSED_SIDEBAR_WIDTH : SIDEBAR_WIDTH

  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleNewChat = () => {
    setShowNewChatDialog(true)
  }

  const handleShowContacts = () => {
    setShowContactsManager(true)
  }

  const handleChatCreated = async (chatId: string) => {
    // Refresh chats to ensure the new chat appears in the sidebar
    await refreshChats()
    
    // Set the newly created chat as active
    setActiveChat(chatId)
    setShowNewChatDialog(false)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleStartChatFromContacts = () => {
    // This would create a direct chat with the selected user
    // For now, we'll just close the contacts manager
    setShowContactsManager(false)
  }

  const handleBackToChats = () => {
    setActiveChat(null)
    setSidebarOpen(true)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Sidebar collapse toggle removed from header actions; keep state for future use if needed

  // Show message if no company/site selected (this check comes first)
  // Note: companyState might be an object but companyID might be null/undefined
  const hasCompany = companyState?.companyID
  const hasSite = companyState?.selectedSiteID
  
  if (!hasCompany || !hasSite) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          p: 3,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Messenger
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Please select a company and site to access messaging.
        </Typography>
      </Box>
    )
  }

  // Note: MessengerProvider might be lazy loaded, so messengerState might be fallback initially
  // That's okay - the component will work once the provider loads

  // Check if user has permission to access messenger
  const hasViewPermission = hasPermission("messenger", "chat", "view")
  if (!hasViewPermission) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          p: 3,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Access Restricted
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          You don't have permission to access the messenger. Please contact your administrator.
        </Typography>
      </Box>
    )
  }

  const sidebarContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <ChatSidebar
        onChatSelect={handleChatSelect}
        onNewChat={hasPermission("messenger", "chat", "edit") ? handleNewChat : () => {}}
        onShowContacts={hasPermission("messenger", "contacts", "view") ? handleShowContacts : () => {}}
        selectedChatId={messengerState.activeChat?.id || undefined}
      />
    </Box>
  )

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prevBodyOverflow
      document.documentElement.style.overflow = prevHtmlOverflow
    }
  }, [])

  // Use the same structure as Settings page - work within MainLayout padding
  return (
    <Box sx={{ 
      flexGrow: 1,
      display: "flex",
      flexDirection: "column",
      height: "calc(100vh - 64px)", // Account for AppBar only, work within MainLayout padding
      overflow: "hidden",
      m: 0,
      p: 0,
      backgroundColor: theme.palette.background.default,
    }}>
      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar position="sticky" elevation={0} sx={{ top: 0, zIndex: (theme) => theme.zIndex.appBar, borderBottom: 1, borderColor: "divider" }}>
          <Toolbar>
            {messengerState.activeChat ? (
              <>
                <IconButton edge="start" onClick={handleBackToChats} sx={{ mr: 2 }}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" sx={{ flex: 1 }}>
                  {messengerState.activeChat?.name || "Chat"}
                </Typography>
              </>
            ) : (
              <>
                <IconButton edge="start" onClick={toggleSidebar} sx={{ mr: 2 }}>
                  <MenuIcon />
                </IconButton>
                <Typography variant="h6" sx={{ flex: 1 }}>
                  Messages
                </Typography>
              </>
            )}
          </Toolbar>
        </AppBar>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {/* Sidebar */}
        {!isMobile ? (
          <Box
            sx={{
              width: sidebarWidth,
              flexShrink: 0,
              borderRight: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              height: "100%",
              transition: (theme) => theme.transitions.create("width", { duration: theme.transitions.duration.shortest }),
              overflow: "hidden",
            }}
          >
            {sidebarContent}
          </Box>
        ) : (
          <Drawer
            variant="temporary"
            anchor="left"
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile
            }}
            sx={{
              "& .MuiDrawer-paper": {
                width: SIDEBAR_WIDTH,
                boxSizing: "border-box",
                height: "100%",
              },
            }}
          >
            {sidebarContent}
          </Drawer>
        )}

        {/* Chat Area */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {messengerState.activeChat ? (
            <ChatArea
              chat={messengerState.activeChat}
              onBack={isMobile ? handleBackToChats : undefined}
              showBackButton={isMobile}
            />
          ) : (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: 3,
                textAlign: "center",
                bgcolor: "background.default",
              }}
            >
              <Typography variant="h5" color="text.secondary" gutterBottom>
                Welcome to Messenger
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                Select a conversation from the sidebar to start messaging, or create a new chat to get started.
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                {hasPermission("messenger", "chat", "edit") && (
                  <button
                    onClick={handleNewChat}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    Start New Chat
                  </button>
                )}
                {hasPermission("messenger", "contacts", "view") && (
                  <button
                    onClick={handleShowContacts}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "transparent",
                      color: theme.palette.text.primary,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    View Contacts
                  </button>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Dialogs */}
      {hasPermission("messenger", "chat", "edit") && (
        <NewChatDialog
          open={showNewChatDialog}
          onClose={() => setShowNewChatDialog(false)}
          onChatCreated={handleChatCreated}
        />
      )}

      {hasPermission("messenger", "contacts", "view") && (
        <ContactsManager
          open={showContactsManager}
          onClose={() => setShowContactsManager(false)}
          onStartChat={handleStartChatFromContacts}
        />
      )}
    </Box>
  )
}

export default Messenger
