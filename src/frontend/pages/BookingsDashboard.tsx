"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  useTheme,
  IconButton,
  MenuItem,
  Drawer,
  useMediaQuery,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material"
import {
  Event,
  TableRestaurant,
  Map as MapIcon,
  Schedule,
  Dashboard,
  Close,
  BarChart,
  Business,
  Dashboard as DashboardIcon,
  TableChart as TableChartIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Restaurant as RestaurantIcon,
  AccessTime,
} from "@mui/icons-material"
import AnimatedCounter from "../components/reusable/AnimatedCounter"
import { useBookings } from "../../backend/context/BookingsContext"
import { useCompany } from "../../backend/context/CompanyContext"
import { useAnalytics } from "../../backend/context/AnalyticsContext"
import { WidgetType, DataType } from "../types/WidgetTypes"

// Import all Bookings components
import {
  BookingsList,
  FloorPlanEditor,
  TableManagement,
  BookingTypesManagement,
  WaitlistManager,
  BookingCalendar,
  BookingReports,
  BookingSettings,
  BookingDiary,
  StatusManagement,
  PreorderProfiles,
  TagsManagement,
} from "../components/bookings"

// Import date-fns
import { format, subDays, startOfMonth, startOfYear } from "date-fns"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"

// Import Rnd for resizable and draggable components
import { Rnd } from "react-rnd"

// Import custom hooks and components for widget management
import useWidgetManager from "../hooks/useWidgetManager"
import WidgetContextMenu from "../components/reusable/WidgetContextMenu"
import WidgetSettingsDialog from "../components/reusable/WidgetSettingsDialog"
import DynamicWidget from "../components/reusable/DynamicWidget"
import DashboardHeader from "../components/reusable/DashboardHeader"

// Define the GRID_CELL_SIZE constant
const GRID_CELL_SIZE = 20

const BookingsDashboard = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const bookingsState = useBookings()
  const { state: companyState, hasPermission } = useCompany()
  const { getBookingsWidgets } = useAnalytics()

  // All hooks must be called before any conditional returns
  const [activeTab, setActiveTab] = useState(0)
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Dashboard widget state
  const [isEditing, setIsEditing] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [addWidgetOpen, setAddWidgetOpen] = useState(false)
  const [newWidgetType, setNewWidgetType] = useState<string>("stat")
  const [newWidgetDataType, setNewWidgetDataType] = useState<DataType>(DataType.TOTAL_BOOKINGS)
  const [selectedDateRange, setSelectedDateRange] = useState<string>("last7days")
  const [customDateDialogOpen, setCustomDateDialogOpen] = useState(false)
  const [clearWidgetsDialogOpen, setClearWidgetsDialogOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number
    mouseY: number
    widgetId: string
  } | null>(null)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState<boolean>(false)
  const [currentWidgetSettings, setCurrentWidgetSettings] = useState<any>(null)

  // Date range state
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date }>({
    startDate: subDays(new Date(), 6),
    endDate: new Date(),
  })
  const [frequency, setFrequency] = useState<string>("daily")

  // Analytics data state

  // Widget management
  const {
    dashboardState,
    selectedWidgetId,
    setSelectedWidgetId,
    updateWidgetPosition,
    updateWidgetSize,
    updateWidgetSettings,
    removeWidget,
    addWidget,
    getWidgetSettings,
    calculateContainerHeight,
    clearAllWidgets,
    revertDashboard,
  } = useWidgetManager('bookings')

  // Calculate container height based on widget positions
  const containerHeight = calculateContainerHeight()

  // Default dashboard setup is now handled by useWidgetManager with section-specific layouts

  // Define main navigation categories with permission checks
  const mainCategories = [
    {
      id: 0,
      label: "Dashboard",
      icon: <Dashboard />,
      component: null, // Dashboard is handled separately
      permission: hasPermission("bookings", "dashboard", "view"),
    },
    {
      id: 1,
      label: "Bookings",
      icon: <Event />,
      permission: hasPermission("bookings", "list", "view"),
      subTabs: [
        {
          id: "bookings-list",
          label: "Bookings List",
          component: <BookingsList />,
          permission: hasPermission("bookings", "list", "view"),
        },
        {
          id: "calendar",
          label: "Calendar",
          component: <BookingCalendar />,
          permission: hasPermission("bookings", "calendar", "view"),
        },
        {
          id: "diary",
          label: "Diary",
          component: <BookingDiary />,
          permission: hasPermission("bookings", "diary", "view"),
        },
        {
          id: "waitlist",
          label: "Waitlist",
          component: <WaitlistManager />,
          permission: hasPermission("bookings", "waitlist", "view"),
        },
      ],
    },
    {
      id: 2,
      label: "Floor Plan",
      icon: <MapIcon />,
      permission: hasPermission("bookings", "floorplan", "edit"),
      subTabs: [
        {
          id: "floor-plan",
          label: "Floor Plan Editor",
          component: <FloorPlanEditor />,
          permission: hasPermission("bookings", "floorplan", "edit"),
        },
        {
          id: "tables",
          label: "Table Management",
          component: <TableManagement />,
          permission: hasPermission("bookings", "tables", "edit"),
        },
      ],
    },
    {
      id: 3,
      label: "Management",
      icon: <Schedule />,
      permission: hasPermission("bookings", "types", "edit") || hasPermission("bookings", "status", "edit"),
      subTabs: [
        {
          id: "booking-types",
          label: "Booking Types",
          component: <BookingTypesManagement />,
          permission: hasPermission("bookings", "types", "edit"),
        },
        {
          id: "status",
          label: "Status",
          component: <StatusManagement />,
          permission: hasPermission("bookings", "status", "edit"),
        },
        {
          id: "tags",
          label: "Tags",
          component: <TagsManagement />,
          permission: hasPermission("bookings", "tags", "edit"),
        },
        {
          id: "preorder-profiles",
          label: "Preorder Profiles",
          component: <PreorderProfiles />,
          permission: hasPermission("bookings", "preorders", "edit"),
        },
      ],
    },
    {
      id: 4,
      label: "Reports",
      icon: <BarChart />,
      component: <BookingReports />,
      permission: hasPermission("bookings", "reports", "view"),
    },
    {
      id: 5,
      label: "Settings",
      icon: <Business />,
      component: <BookingSettings />,
      permission: hasPermission("bookings", "settings", "edit"),
    },
  ]

  // Memoize visibleCategories to prevent unnecessary re-renders
  const memoizedVisibleCategories = React.useMemo(() => {
    return mainCategories
      .filter((category) => category.permission)
      .map((category) => ({
        ...category,
        subTabs: category.subTabs?.filter((subTab) => subTab.permission),
      }))
  }, [mainCategories])

  // Use memoized visible categories
  const visibleCategories = memoizedVisibleCategories

  // Initialize activeSubTab when component mounts or when activeTab changes
  const initializeActiveSubTab = () => {
    const currentTab = visibleCategories[activeTab]
    if (currentTab && currentTab.subTabs && currentTab.subTabs.length > 0) {
      const availableSubTabs = currentTab.subTabs.map((tab) => tab.id)
      if (!activeSubTab || !availableSubTabs.includes(activeSubTab)) {
        setActiveSubTab(availableSubTabs[0])
      }
    } else {
      setActiveSubTab(null)
    }
  }

  // Initialize activeSubTab when component mounts or when activeTab changes
  useEffect(() => {
    initializeActiveSubTab()
  }, [activeTab])

  // Load analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!companyState.companyID || !companyState.selectedSiteID) return

      try {
        const dateRangeFormatted = {
          startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
          endDate: format(dateRange.endDate, 'yyyy-MM-dd')
        }
        
        await getBookingsWidgets(dateRangeFormatted)
        // Analytics data is now handled by the analytics context
      } catch (error) {
        console.error('Error loading bookings analytics data:', error)
      }
    }

    if (companyState.companyID && companyState.selectedSiteID) {
      loadAnalyticsData()
    }
  }, [dateRange, getBookingsWidgets, companyState.companyID, companyState.selectedSiteID])

  // Show message if no company/site selected
  if (!companyState.companyID) {
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
          Bookings Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Please select a company to access bookings data.
        </Typography>
      </Box>
    )
  }

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
          You don't have permission to access any bookings features. Please contact your administrator.
        </Typography>
      </Box>
    )
  }

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen)
  }

  const handleTabChange = (newTab: number) => {
    setActiveTab(newTab)
    if (visibleCategories[newTab].subTabs && visibleCategories[newTab].subTabs!.length > 0) {
      setActiveSubTab(visibleCategories[newTab].subTabs![0].id)
    } else {
      setActiveSubTab(null)
    }
    if (isMobile) {
      setDrawerOpen(false)
    }
  }

  const handleSubTabChange = (_event: React.SyntheticEvent, newSubTab: string) => {
    setActiveSubTab(newSubTab)
  }

  // Dashboard cards data - using Bookings context data
  const dashboardCards = [
    {
      id: 1,
      title: "Total Bookings",
      icon: <Event color="primary" />,
      value: bookingsState.bookings?.length || 0,
      change: "+15.2%",
      changeType: "positive",
      subtitle: `This ${frequency}`,
      suffix: "",
      decimals: 0,
    },
    {
      id: 2,
      title: "Active Tables",
      icon: <TableRestaurant color="primary" />,
      value: bookingsState.tables?.filter((t) => t.status === "active")?.length || 0,
      change: "+8.5%",
      changeType: "positive",
      subtitle: `Out of ${bookingsState.tables?.length || 0} total tables`,
      suffix: "",
      decimals: 0,
    },
    {
      id: 3,
      title: "Waitlist",
      icon: <AccessTime color="primary" />,
      value: bookingsState.waitlistEntries?.length || 0,
      change: "-12.3%",
      changeType: "negative",
      subtitle: "People waiting",
      suffix: "",
      decimals: 0,
    },
    {
      id: 4,
      title: "Occupancy Rate",
      icon: <RestaurantIcon color="primary" />,
      value: bookingsState.bookingStats?.occupancyRate || 0,
      change: "+5.7%",
      changeType: "positive",
      subtitle: "Average occupancy",
      suffix: "%",
      decimals: 1,
    },
  ]

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing)
  }

  // Handle revert - reload saved layout and exit edit mode without saving
  const handleRevert = async () => {
    console.log('Bookings Dashboard: Reverting changes and exiting edit mode')
    await revertDashboard()
    setIsEditing(false)
  }

  // Date range handling
  const getDateRangeLabel = () => {
    switch (selectedDateRange) {
      case "today":
        return "Today"
      case "yesterday":
        return "Yesterday"
      case "last7days":
        return "Last 7 Days"
      case "last30days":
        return "Last 30 Days"
      case "thisMonth":
        return "This Month"
      case "lastMonth":
        return "Last Month"
      case "thisYear":
        return "This Year"
      case "lastYear":
        return "Last Year"
      case "custom":
        return `${format(dateRange.startDate, "MMM d, yyyy")} - ${format(dateRange.endDate, "MMM d, yyyy")}`
      default:
        return "Last 7 Days"
    }
  }

  const handleDateRangeChange = (range: string) => {
    setSelectedDateRange(range)
    // Date range anchor functionality removed

    if (range === "custom") {
      setCustomDateDialogOpen(true)
      return
    }

    const today = new Date()
    let start = new Date()
    let end = new Date()

    switch (range) {
      case "today":
        start = new Date(today)
        end = new Date(today)
        break
      case "yesterday":
        start = subDays(today, 1)
        end = subDays(today, 1)
        break
      case "last7days":
        start = subDays(today, 6)
        end = today
        break
      case "last30days":
        start = subDays(today, 29)
        end = today
        break
      case "thisMonth":
        start = startOfMonth(today)
        end = today
        break
      case "lastMonth":
        const lastMonthEnd = subDays(startOfMonth(today), 1)
        start = startOfMonth(lastMonthEnd)
        end = lastMonthEnd
        break
      case "thisYear":
        start = startOfYear(today)
        end = today
        break
      case "lastYear":
        const lastYearEnd = subDays(startOfYear(today), 1)
        start = startOfYear(lastYearEnd)
        end = lastYearEnd
        break
      default:
        break
    }

    setDateRange({ startDate: start, endDate: end })
  }

  const handleFrequencyChange = (newFrequency: string) => {
    setFrequency(newFrequency)
  }

  const handleCustomDateApply = () => {
    setCustomDateDialogOpen(false)
  }

  // Widget handling
  const handleWidgetContextMenu = (event: React.MouseEvent, widgetId: string) => {
    if (!isEditing) return

    event.preventDefault()
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      widgetId,
    })
  }

  const handleOpenWidgetSettings = (widgetId: string) => {
    const settings = getWidgetSettings(widgetId)
    if (settings) {
      setCurrentWidgetSettings(settings)
      setSettingsDialogOpen(true)
    }
  }

  const handleSaveWidgetSettings = (settings: any) => {
    updateWidgetSettings(settings)
    setSettingsDialogOpen(false)
  }

  const handleAddWidget = (type: string, dataType: DataType) => {
    let widgetType: "stat" | "barChart" | "lineChart" | "pieChart" | "chart" | "table" | "dashboardCard" = "stat"

    switch (type) {
      case "stat":
      case "barChart":
      case "lineChart":
      case "pieChart":
      case "chart":
      case "table":
      case "dashboardCard":
        widgetType = type
        break
    }

    const newWidgetId = addWidget(widgetType, dataType)
    setSelectedWidgetId(newWidgetId)
  }

  const handleClearWidgets = () => {
    setClearWidgetsDialogOpen(true)
  }

  const confirmClearWidgets = () => {
    clearAllWidgets()
    setClearWidgetsDialogOpen(false)
  }

  // Available data types for widgets
  const availableDataTypes = [
    { value: DataType.TOTAL_BOOKINGS, label: "Total Bookings" },
    { value: DataType.BOOKINGS_BY_STATUS, label: "Bookings by Status" },
    { value: DataType.BOOKINGS_BY_TYPE, label: "Bookings by Type" },
    { value: DataType.TABLE_OCCUPANCY, label: "Table Occupancy" },
    { value: DataType.WAITLIST_ANALYTICS, label: "Waitlist Analytics" },
    { value: DataType.BOOKING_TRENDS, label: "Booking Trends" },
    { value: DataType.CUSTOMER_ANALYTICS, label: "Customer Analytics" },
  ]

  // Get data for widget based on its type - using Bookings context data
  const getWidgetData = useCallback((widget: any) => {
    if (!widget || !widget.dataType) return { history: [] }

    const dataType = widget.dataType
    console.log('Bookings Dashboard: Getting data for:', dataType, 'Date range:', dateRange, 'Frequency:', frequency)

    // Calculate metrics from Bookings context data
    const totalBookings = bookingsState.bookings?.length || 0
    const activeTables = bookingsState.tables?.filter((t) => t.status === "active")?.length || 0
    const waitlistCount = bookingsState.waitlistEntries?.length || 0
    const occupancyRate = bookingsState.bookingStats?.occupancyRate || 0

    // Generate historical data based on date range and frequency
    const generateHistoricalData = (baseValue: number, _variance = 0.1) => {
      const startDate = dateRange.startDate
      const endDate = dateRange.endDate
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Determine data points based on frequency
      let dataPoints = daysDiff
      let dateIncrement = 1 // days
      
      switch (frequency) {
        case 'hourly':
          dataPoints = daysDiff * 24
          dateIncrement = 1 / 24 // hours
          break
        case 'daily':
          dataPoints = daysDiff
          dateIncrement = 1 // days
          break
        case 'weekly':
          dataPoints = Math.ceil(daysDiff / 7)
          dateIncrement = 7 // days
          break
        case 'monthly':
          dataPoints = Math.ceil(daysDiff / 30)
          dateIncrement = 30 // days
          break
        case 'yearly':
          dataPoints = Math.ceil(daysDiff / 365)
          dateIncrement = 365 // days
          break
        default:
          dataPoints = Math.min(daysDiff, 30) // Default to 30 days max
      }
      
      return Array.from({ length: dataPoints }).map((_, i) => {
        const currentDate = new Date(startDate.getTime() + (i * dateIncrement * 24 * 60 * 60 * 1000))
        const date = format(currentDate, "yyyy-MM-dd")
        const variation = 0.9 + Math.random() * 0.2 // ±10% variation for more realistic data
        return {
          date,
          value: Math.max(0, Math.round(baseValue * variation)),
        }
      })
    }

    // For dashboard cards and stats, provide the specific value
    if (widget.type === WidgetType.DASHBOARD_CARD || widget.type === WidgetType.STAT) {
      switch (dataType) {
        case DataType.TOTAL_BOOKINGS:
          return {
            totalBookings: totalBookings,
            history: generateHistoricalData(totalBookings).map((item) => ({
              date: item.date,
              bookings: item.value,
            })),
          }
        case DataType.BOOKINGS_BY_STATUS:
          const statusBreakdown = bookingsState.bookingStatuses?.map(status => ({
            status: status.name,
            count: bookingsState.bookings?.filter(b => b.status === status.id)?.length || 0
          })) || []
          return {
            statusBreakdown: statusBreakdown,
            history: generateHistoricalData(totalBookings).map((item) => ({
              date: item.date,
              confirmed: Math.round(item.value * 0.7),
              pending: Math.round(item.value * 0.2),
              cancelled: Math.round(item.value * 0.1),
            })),
          }
        case DataType.TABLE_OCCUPANCY:
          return {
            occupancyRate: occupancyRate,
            activeTables: activeTables,
            history: generateHistoricalData(occupancyRate, 0.05).map((item) => ({
              date: item.date,
              occupancy: item.value,
            })),
          }
        case DataType.WAITLIST_ANALYTICS:
          return {
            waitlistCount: waitlistCount,
            history: generateHistoricalData(waitlistCount, 0.2).map((item) => ({
              date: item.date,
              waitlist: item.value,
            })),
          }
        default:
          return {
            value: 0,
            history: generateHistoricalData(1),
          }
      }
    }

    // For charts, provide the history data
    switch (dataType) {
      case DataType.TOTAL_BOOKINGS:
        return {
          history: generateHistoricalData(totalBookings).map((item) => ({
            date: item.date,
            bookings: { count: item.value },
          })),
        }
      case DataType.BOOKINGS_BY_STATUS:
        return {
          history: generateHistoricalData(totalBookings).map((item) => ({
            date: item.date,
            statusBreakdown: {
              confirmed: Math.round(item.value * 0.7),
              pending: Math.round(item.value * 0.2),
              cancelled: Math.round(item.value * 0.1),
            },
          })),
        }
      case DataType.TABLE_OCCUPANCY:
        return {
          history: generateHistoricalData(occupancyRate, 0.05).map((item) => ({
            date: item.date,
            occupancy: { rate: item.value },
          })),
        }
      case DataType.WAITLIST_ANALYTICS:
        return {
          history: generateHistoricalData(waitlistCount, 0.2).map((item) => ({
            date: item.date,
            waitlist: { count: item.value },
          })),
        }
      default:
        return { history: generateHistoricalData(totalBookings) }
    }
  }, [dateRange, frequency, bookingsState.bookings, bookingsState.tables, bookingsState.waitlistEntries, bookingsState.bookingStats])

  // Render the navigation drawer/sidebar
  const renderNavigation = () => {
    const navigationContent = (
      <List sx={{ width: "100%" }}>
        {visibleCategories.map((category, index) => (
          <ListItem
            button
            key={category.id}
            selected={activeTab === index}
            onClick={() => handleTabChange(index)}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              "&.Mui-selected": {
                backgroundColor: theme.palette.primary.main + "20",
                color: theme.palette.primary.main,
                "&:hover": {
                  backgroundColor: theme.palette.primary.main + "30",
                },
              },
            }}
          >
            <ListItemAvatar sx={{ minWidth: 40 }}>
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  backgroundColor: activeTab === index ? theme.palette.primary.main + "40" : "transparent",
                  color: activeTab === index ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
              >
                {category.icon}
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={category.label} />
          </ListItem>
        ))}
      </List>
    )

    return isMobile ? (
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer} sx={{ zIndex: theme.zIndex.appBar + 100 }}>
        <Box sx={{ width: 200, p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" component="div">
              Bookings Management
            </Typography>
            <IconButton onClick={toggleDrawer}>
              <Close />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {navigationContent}
        </Box>
      </Drawer>
    ) : (
      <Box
        sx={{
          width: 200,
          flexShrink: 0,
          borderRight: `1px solid ${theme.palette.divider}`,
          height: "100%",
          overflow: "auto",
          p: 2,
        }}
      >
        {navigationContent}
      </Box>
    )
  }

  // Render the dashboard content
  const renderDashboard = () => {
    return (
      <Box sx={{ p: 3, maxWidth: "2000px", mx: "auto", width: "100%" }}>
        {/* Dashboard Header */}
        <DashboardHeader
          title="Bookings Dashboard"
          subtitle="Bookings Overview"
          canEdit={hasPermission("bookings", "dashboard", "edit")}
          isEditing={isEditing}
          onToggleEdit={toggleEditMode}
          onClearWidgets={handleClearWidgets}
          onRevert={handleRevert}
          showGrid={showGrid}
          onToggleGrid={setShowGrid}
          menuItems={[
            {
              label: "Add Widget",
              onClick: () => setAddWidgetOpen(true),
              permission: hasPermission("bookings", "dashboard", "edit"),
            },
            {
              label: "New Booking",
              onClick: () => handleTabChange(1),
              permission: hasPermission("bookings", "list", "edit"),
            },
            {
              label: "Manage Tables",
              onClick: () => handleTabChange(2),
              permission: hasPermission("bookings", "tables", "edit"),
            },
            {
              label: "View Reports",
              onClick: () => handleTabChange(4),
              permission: hasPermission("bookings", "reports", "view"),
            },
          ]}
          dateRange={{
            value: selectedDateRange,
            label: getDateRangeLabel(),
            onChange: handleDateRangeChange,
          }}
          frequency={{
            value: frequency,
            options: ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"],
            onChange: handleFrequencyChange,
          }}
        />

        {/* Widgets Container */}
        <Box
          sx={{
            position: "relative",
            minHeight: `${containerHeight}px`,
            mb: 4,
            border: isEditing ? "1px dashed" : "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            p: 2,
            backgroundColor: theme.palette.background.default,
            backgroundImage: showGrid
              ? `linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), 
               linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)`
              : "none",
            backgroundSize: `${GRID_CELL_SIZE}px ${GRID_CELL_SIZE}px`,
            backgroundPosition: "0 0",
          }}
        >
          {dashboardState.widgets.map((widget) => (
            <Rnd
              key={widget.id}
              default={{
                x: widget.x,
                y: widget.y,
                width: widget.width,
                height: widget.height,
              }}
              size={{ width: widget.width, height: widget.height }}
              position={{ x: widget.x, y: widget.y }}
              minWidth={widget.minW * GRID_CELL_SIZE}
              minHeight={widget.minH * GRID_CELL_SIZE}
              disableDragging={!isEditing}
              enableResizing={isEditing}
              bounds="parent"
              onDragStop={(_e, d) => {
                updateWidgetPosition(widget.id, { x: d.x, y: d.y })
              }}
              onResizeStop={(_e, _direction, ref, _delta, position) => {
                updateWidgetSize(widget.id, {
                  width: ref.offsetWidth,
                  height: ref.offsetHeight,
                })
                updateWidgetPosition(widget.id, {
                  x: position.x,
                  y: position.y,
                })
              }}
              style={{
                border: selectedWidgetId === widget.id ? `2px solid ${theme.palette.primary.main}` : "none",
                borderRadius: "8px",
                overflow: "hidden",
              }}
              onMouseDown={() => isEditing && setSelectedWidgetId(widget.id)}
              onContextMenu={(e: React.MouseEvent<Element, MouseEvent>) => handleWidgetContextMenu(e, widget.id)}
              dragGrid={[GRID_CELL_SIZE, GRID_CELL_SIZE]}
              resizeGrid={[GRID_CELL_SIZE, GRID_CELL_SIZE]}
            >
              <Box sx={{ height: "100%", width: "100%", overflow: "hidden" }}>
                <DynamicWidget
                  widget={widget}
                  data={getWidgetData(widget)}
                  onSettingsOpen={handleOpenWidgetSettings}
                  isEditing={isEditing}
                />
              </Box>
            </Rnd>
          ))}
        </Box>

        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {dashboardCards.map((card) => (
            <Grid item xs={12} sm={6} lg={3} key={card.id}>
              <Card
                elevation={2}
                sx={{
                  height: "100%",
                  transition: "all 0.3s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 8,
                  },
                  animation: `fadeIn 0.5s ease-out forwards`,
                  animationDelay: `${card.id * 100}ms`,
                  opacity: 0,
                }}
              >
                <CardHeader
                  title={card.title}
                  titleTypographyProps={{
                    variant: "subtitle2",
                    color: "text.secondary",
                  }}
                  action={card.icon}
                  sx={{ pb: 0 }}
                />
                <CardContent>
                  <Typography variant="h4" component="div" sx={{ fontWeight: "bold", mb: 1 }}>
                    <AnimatedCounter
                      value={card.value}
                      duration={1500}
                      suffix={card.suffix || ""}
                      decimals={card.decimals || 0}
                    />
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      variant="body2"
                      color={card.changeType === "positive" ? "success.main" : "error.main"}
                      sx={{ fontWeight: "medium" }}
                    >
                      {card.change}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.subtitle}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Widget Context Menu */}
        <WidgetContextMenu
          open={contextMenu !== null}
          position={contextMenu ? { x: contextMenu.mouseX, y: contextMenu.mouseY } : { x: 0, y: 0 }}
          onClose={() => setContextMenu(null)}
          widgetId={contextMenu?.widgetId || ""}
          onSettingsOpen={handleOpenWidgetSettings}
          onRemove={() => {
            if (contextMenu) {
              removeWidget(contextMenu.widgetId)
              setContextMenu(null)
            }
          }}
        />

        {/* Widget Settings Dialog */}
        <WidgetSettingsDialog
          open={settingsDialogOpen}
          onClose={() => setSettingsDialogOpen(false)}
          widget={currentWidgetSettings}
          onSave={handleSaveWidgetSettings}
          availableDataTypes={availableDataTypes}
        />

        {/* Add Widget Dialog */}
        <Dialog open={addWidgetOpen} onClose={() => setAddWidgetOpen(false)}>
          <DialogTitle>Add New Widget</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
              <InputLabel>Widget Type</InputLabel>
              <Select value={newWidgetType} label="Widget Type" onChange={(e) => setNewWidgetType(e.target.value)}>
                <MenuItem value="stat">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <DashboardIcon fontSize="small" />
                    Stat Card
                  </Box>
                </MenuItem>
                <MenuItem value="barChart">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <BarChartIcon fontSize="small" />
                    Bar Chart
                  </Box>
                </MenuItem>
                <MenuItem value="lineChart">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <BarChartIcon fontSize="small" />
                    Line Chart
                  </Box>
                </MenuItem>
                <MenuItem value="pieChart">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PieChartIcon fontSize="small" />
                    Pie Chart
                  </Box>
                </MenuItem>
                <MenuItem value="table">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TableChartIcon fontSize="small" />
                    Table
                  </Box>
                </MenuItem>
                <MenuItem value="dashboardCard">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <DashboardIcon fontSize="small" />
                    Dashboard Card
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Data Type</InputLabel>
              <Select
                value={newWidgetDataType}
                label="Data Type"
                onChange={(e) => setNewWidgetDataType(e.target.value as DataType)}
              >
                {availableDataTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddWidgetOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                handleAddWidget(newWidgetType, newWidgetDataType)
                setAddWidgetOpen(false)
              }}
              variant="contained"
              color="primary"
            >
              Add Widget
            </Button>
          </DialogActions>
        </Dialog>

        {/* Custom Date Range Dialog */}
        <Dialog open={customDateDialogOpen} onClose={() => setCustomDateDialogOpen(false)}>
          <DialogTitle>Select Custom Date Range</DialogTitle>
          <DialogContent>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2, minWidth: 300 }}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.startDate}
                  onChange={(newValue) => {
                    if (newValue) {
                      setDateRange((prev) => ({ ...prev, startDate: newValue }))
                    }
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <DatePicker
                  label="End Date"
                  value={dateRange.endDate}
                  onChange={(newValue) => {
                    if (newValue) {
                      setDateRange((prev) => ({ ...prev, endDate: newValue }))
                    }
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Box>
            </LocalizationProvider>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCustomDateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCustomDateApply} variant="contained" color="primary">
              Apply
            </Button>
          </DialogActions>
        </Dialog>

        {/* Clear Widgets Confirmation Dialog */}
        <Dialog open={clearWidgetsDialogOpen} onClose={() => setClearWidgetsDialogOpen(false)}>
          <DialogTitle>Clear All Widgets</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to remove all widgets from the dashboard? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setClearWidgetsDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmClearWidgets} variant="contained" color="error">
              Clear All Widgets
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    )
  }

  // Main layout
  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {!isMobile && renderNavigation()}

      <Box sx={{ flexGrow: 1, overflow: "auto", height: "100%" }}>
        {activeTab === 0 ? (
          renderDashboard()
        ) : (
          <Box sx={{ p: 3 }}>
            {/* Horizontal tabs for categories with sub-tabs */}
            {visibleCategories[activeTab].subTabs && visibleCategories[activeTab].subTabs!.length > 0 && (
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                <Tabs
                  value={activeSubTab}
                  onChange={handleSubTabChange}
                  aria-label="horizontal tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  {visibleCategories[activeTab].subTabs!.map((subTab) => (
                    <Tab key={subTab.id} label={subTab.label} value={subTab.id} />
                  ))}
                </Tabs>
              </Box>
            )}

            {/* Render the appropriate component based on active tab and sub-tab */}
            {visibleCategories[activeTab].subTabs && visibleCategories[activeTab].subTabs!.length > 0
              ? // If there are sub-tabs, find and render the active sub-tab component
                visibleCategories[activeTab].subTabs!.find((subTab) => subTab.id === activeSubTab)?.component
              : // If no sub-tabs, render the main category component
                visibleCategories[activeTab].component}
          </Box>
        )}
      </Box>

      {isMobile && renderNavigation()}
    </Box>
  )
}

export default BookingsDashboard
