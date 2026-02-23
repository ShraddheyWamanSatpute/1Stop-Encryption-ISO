"use client"

import React, { useState, useCallback, useMemo } from "react"
import {
  Box,
  Typography,
  Button,
  useTheme,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  type SelectChangeEvent,
} from "@mui/material"
import { WidgetType, DataType } from "../types/WidgetTypes"
import DynamicWidget from "../components/reusable/DynamicWidget"
import useWidgetManager from "../hooks/useWidgetManager"
import WidgetContextMenu from "../components/reusable/WidgetContextMenu"
import WidgetSettingsDialog from "../components/reusable/WidgetSettingsDialog"
import DashboardHeader from "../components/reusable/DashboardHeader"
import { Rnd } from "react-rnd"
import { useBookings } from "../../backend/context/BookingsContext"
import { useCompany } from "../../backend/context/CompanyContext"

// Import date-fns
import { format, subDays, addDays, startOfMonth, startOfYear } from "date-fns"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"

// Define the GRID_CELL_SIZE constant
const GRID_CELL_SIZE = 20

const BookingsDashboardNew = () => {
  const theme = useTheme()
  const bookingsState = useBookings()
  const { hasPermission } = useCompany()
  
  // All hooks must be called before any conditional returns
  
  // Dashboard widget state - moved from renderDashboard to top level
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
    startDate: subDays(new Date(), 30), // Last 30 days for broader view
    endDate: addDays(new Date(), 30), // Next 30 days for broader view
  })
  const [frequency, setFrequency] = useState<string>("daily")

  // Widget management - MUST be called before any conditional returns
  const {
    dashboardState,
    addWidget,
    removeWidget,
    updateWidgetSettings,
    updateWidgetPosition,
    updateWidgetSize,
    clearAllWidgets,
    selectedWidgetId,
    setSelectedWidgetId,
    revertDashboard,
  } = useWidgetManager("bookings")

  // Memoized booking metrics for performance
  const bookingMetrics = useMemo(() => {
    const totalBookings = bookingsState.bookings.length
    const confirmedBookings = bookingsState.bookings.filter((b: any) => b.status === "confirmed").length
    const cancelledBookings = bookingsState.bookings.filter((b: any) => b.status === "cancelled").length
    const noShowBookings = bookingsState.bookings.filter((b: any) => b.status === "no-show").length
    const waitlistCount = bookingsState.waitlistEntries.length
    const activeTables = bookingsState.tables.filter((t: any) => t.status === "active").length
    const occupancyRate = bookingsState.bookingStats?.occupancyRate || 0
    const averagePartySize = bookingsState.bookings.length > 0 
      ? Math.round(bookingsState.bookings.reduce((sum: number, b: any) => sum + (b.partySize || 1), 0) / bookingsState.bookings.length)
      : 0

    // Calculate revenue metrics
    const totalRevenue = bookingsState.bookings.reduce((total: number, booking: any) => {
      return total + (booking.estimatedValue || booking.totalValue || 0)
    }, 0)


    // Get unique booking types and sources
    const bookingTypes = [...new Set(bookingsState.bookings.map((b: any) => 
      b.bookingType || b.type || 'Standard'
    ).filter(Boolean))]
    
    const bookingSources = [...new Set(bookingsState.bookings.map((b: any) => 
      b.source || b.bookingSource || 'Direct'
    ).filter(Boolean))]

    return {
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      noShowBookings,
      waitlistCount,
      activeTables,
      occupancyRate,
      averagePartySize,
      totalRevenue,
      bookingTypes,
      bookingSources
    }
  }, [bookingsState.bookings, bookingsState.waitlistEntries, bookingsState.tables, bookingsState.bookingStats])

  // Get widget data function
  const getWidgetData = useCallback((widget: any) => {
    if (!widget || !widget.dataType) return { history: [] }

    const dataType = widget.dataType
    console.log('Bookings Dashboard: Getting data for:', dataType, 'Date range:', dateRange, 'Frequency:', frequency)

    // Use memoized metrics
    const { 
      totalBookings, confirmedBookings, cancelledBookings, noShowBookings, 
      waitlistCount, activeTables, occupancyRate, averagePartySize,
      bookingTypes, bookingSources 
    } = bookingMetrics

    // Generate historical data based on date range and frequency
    const generateHistoricalData = (baseValue: number, _variationFactor: number = 0.1) => {
      // Safely parse dates and validate them
      const startDate = dateRange?.startDate instanceof Date && !isNaN(dateRange.startDate.getTime())
        ? dateRange.startDate
        : dateRange?.startDate
        ? new Date(dateRange.startDate)
        : subDays(new Date(), 30)
      
      const endDate = dateRange?.endDate instanceof Date && !isNaN(dateRange.endDate.getTime())
        ? dateRange.endDate
        : dateRange?.endDate
        ? new Date(dateRange.endDate)
        : new Date()
      
      // Validate dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn('Invalid date range, using default dates')
        const defaultStart = subDays(new Date(), 30)
        const defaultEnd = new Date()
        const daysDiff = Math.ceil((defaultEnd.getTime() - defaultStart.getTime()) / (1000 * 60 * 60 * 24))
        return Array.from({ length: Math.min(daysDiff, 30) }).map((_, i) => {
          const currentDate = new Date(defaultStart.getTime() + (i * 24 * 60 * 60 * 1000))
          return {
            date: format(currentDate, "yyyy-MM-dd"),
            value: Math.max(0, Math.round(baseValue * (0.9 + Math.random() * 0.2))),
          }
        })
      }
      
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Ensure daysDiff is positive and reasonable (allow up to 5 years for yearly frequency)
      const maxDays = frequency === 'yearly' ? 1825 : (frequency === 'quarterly' ? 730 : 365) // 5 years, 2 years, or 1 year
      if (daysDiff <= 0 || daysDiff > maxDays) {
        console.warn('Invalid date range difference, using default')
        const defaultStart = subDays(new Date(), 30)
        const defaultEnd = new Date()
        const validDaysDiff = Math.ceil((defaultEnd.getTime() - defaultStart.getTime()) / (1000 * 60 * 60 * 24))
        return Array.from({ length: Math.min(validDaysDiff, 30) }).map((_, i) => {
          const currentDate = new Date(defaultStart.getTime() + (i * 24 * 60 * 60 * 1000))
          return {
            date: format(currentDate, "yyyy-MM-dd"),
            value: Math.max(0, Math.round(baseValue * (0.9 + Math.random() * 0.2))),
          }
        })
      }
      
      let dataPoints: number
      let dateIncrement: number
      
      switch (frequency) {
        case "hourly":
          dataPoints = Math.min(daysDiff * 24, 168) // Max 1 week of hourly data
          dateIncrement = 1 / 24
          break
        case "daily":
          dataPoints = Math.min(daysDiff, 90) // Max 90 days
          dateIncrement = 1
          break
        case "weekly":
          dataPoints = Math.min(Math.ceil(daysDiff / 7), 52) // Max 52 weeks
          dateIncrement = 7
          break
        case "monthly":
          dataPoints = Math.min(Math.ceil(daysDiff / 30), 24) // Max 24 months
          dateIncrement = 30
          break
        case "quarterly":
          dataPoints = Math.min(Math.ceil(daysDiff / 90), 8) // Max 8 quarters (2 years)
          dateIncrement = 90
          break
        case "yearly":
          dataPoints = Math.min(Math.ceil(daysDiff / 365), 5) // Max 5 years
          dateIncrement = 365
          break
        default:
          dataPoints = Math.min(daysDiff, 30) // Default to 30 days max
          dateIncrement = 1
      }
      
      return Array.from({ length: Math.max(1, dataPoints) }).map((_, i) => {
        const currentDate = new Date(startDate.getTime() + (i * dateIncrement * 24 * 60 * 60 * 1000))
        // Validate the date before formatting
        if (isNaN(currentDate.getTime())) {
          console.warn('Invalid date generated, using fallback')
          return {
            date: format(new Date(), "yyyy-MM-dd"),
            value: Math.max(0, Math.round(baseValue * (0.9 + Math.random() * 0.2))),
          }
        }
        const date = format(currentDate, "yyyy-MM-dd")
        const variation = 0.9 + Math.random() * 0.2 // ±10% variation for more realistic data
        return {
          date,
          value: Math.max(0, Math.round(baseValue * variation)),
        }
      })
    }

    // Handle stat and dashboard card widgets
    if (widget.type === WidgetType.DASHBOARD_CARD || widget.type === WidgetType.STAT) {
      switch (dataType) {
        case DataType.TOTAL_BOOKINGS:
          return {
            totalBookings: totalBookings,
            history: generateHistoricalData(totalBookings).map((item) => ({
              date: item.date,
              totalBookings: { count: item.value },
            })),
          }
        case DataType.OCCUPANCY_RATE:
          return {
            occupancyRate: occupancyRate,
            history: generateHistoricalData(occupancyRate, 0.05).map((item) => ({
              date: item.date,
              occupancyRate: { rate: item.value },
            })),
          }
        case DataType.BOOKINGS_BY_STATUS:
          return {
            confirmedBookings: confirmedBookings,
            cancelledBookings: cancelledBookings,
            noShowBookings: noShowBookings,
            history: generateHistoricalData(totalBookings, 0.1).map((item) => ({
              date: item.date,
              bookingsByStatus: { 
                confirmed: Math.round(item.value * 0.7),
                cancelled: Math.round(item.value * 0.15),
                noShow: Math.round(item.value * 0.15)
              },
            })),
          }
        case DataType.BOOKINGS_BY_TYPE:
          return {
            bookingTypes: bookingTypes,
            history: generateHistoricalData(totalBookings, 0.1).map((item) => ({
              date: item.date,
              bookingsByType: { count: item.value },
            })),
          }
        case DataType.TABLE_UTILIZATION:
          return {
            activeTables: activeTables,
            history: generateHistoricalData(activeTables, 0.05).map((item) => ({
              date: item.date,
              tableUtilization: { utilization: item.value },
            })),
          }
        case DataType.WAITLIST_ANALYTICS:
          return {
            waitlistCount: waitlistCount,
            history: generateHistoricalData(waitlistCount, 0.2).map((item) => ({
              date: item.date,
              waitlistAnalytics: { count: item.value },
            })),
          }
        case DataType.BOOKING_TRENDS:
          return {
            totalBookings: totalBookings,
            history: generateHistoricalData(totalBookings, 0.1).map((item) => ({
              date: item.date,
              bookingTrends: { count: item.value },
            })),
          }
        case DataType.CUSTOMER_SEGMENTS:
          return {
            averagePartySize: averagePartySize,
            history: generateHistoricalData(averagePartySize, 0.1).map((item) => ({
              date: item.date,
              customerSegments: { partySize: item.value },
            })),
          }
        case DataType.CANCELLATION_ANALYSIS:
          return {
            cancellationRate: totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0,
            history: generateHistoricalData(cancelledBookings, 0.2).map((item) => ({
              date: item.date,
              cancellationAnalysis: { count: item.value },
            })),
          }
        case DataType.SEASONAL_TRENDS:
          return {
            totalBookings: totalBookings,
            history: generateHistoricalData(totalBookings, 0.15).map((item) => ({
              date: item.date,
              seasonalTrends: { count: item.value },
            })),
          }
      }
    }

    // For charts, provide the history data
    switch (dataType) {
      case DataType.TOTAL_BOOKINGS:
        return {
          history: generateHistoricalData(totalBookings).map((item) => ({
            date: item.date,
            totalBookings: { count: item.value },
          })),
        }
      case DataType.BOOKINGS_BY_DAY:
        return {
          history: generateHistoricalData(totalBookings, 0.1).map((item) => ({
            date: item.date,
            bookingsByDay: { count: item.value },
          })),
        }
      case DataType.BOOKINGS_BY_HOUR:
        return {
          history: generateHistoricalData(24, 0.3).map((item) => ({
            date: item.date,
            bookingsByHour: { 
              hour: Math.floor(Math.random() * 24),
              count: item.value 
            },
          })),
        }
      case DataType.BOOKINGS_BY_SOURCE:
        return {
          data: bookingSources.map((source) => ({
            source,
            count: Math.floor(Math.random() * 50) + 10,
            value: Math.floor(Math.random() * 50) + 10
          })),
          history: generateHistoricalData(totalBookings, 0.1).map((item) => ({
            date: item.date,
            bookingsBySource: { count: item.value },
          })),
        }
      case DataType.BOOKINGS_BY_PARTY_SIZE:
        return {
          data: [1, 2, 3, 4, 5, 6, 7, 8].map((size) => ({
            partySize: size,
            count: Math.floor(Math.random() * 30) + 5,
            value: Math.floor(Math.random() * 30) + 5
          })),
          history: generateHistoricalData(averagePartySize, 0.1).map((item) => ({
            date: item.date,
            bookingsByPartySize: { size: item.value },
          })),
        }
      case DataType.BOOKINGS_BY_TYPE:
        return {
          data: bookingTypes.map((type) => ({
            type,
            count: Math.floor(Math.random() * 40) + 10,
            value: Math.floor(Math.random() * 40) + 10
          })),
          history: generateHistoricalData(totalBookings, 0.1).map((item) => ({
            date: item.date,
            bookingsByType: { count: item.value },
          })),
        }
      case DataType.TABLE_UTILIZATION:
        return {
          data: bookingsState.tables.slice(0, 10).map((table: any) => ({
            table: table.name || `Table ${table.id}`,
            utilization: Math.floor(Math.random() * 100),
            value: Math.floor(Math.random() * 100),
            count: Math.floor(Math.random() * 20) + 5
          })),
          history: generateHistoricalData(activeTables, 0.05).map((item) => ({
            date: item.date,
            tableUtilization: { utilization: item.value },
          })),
        }
      default:
        return { history: generateHistoricalData(totalBookings) }
    }
  }, [dateRange, frequency, bookingMetrics, bookingsState.tables])

  // Date range handlers
  const handleDateRangeChange = (newRange: string) => {
    setSelectedDateRange(newRange)
    const now = new Date()
    let start: Date, end: Date

    switch (newRange) {
      case "today":
        start = end = now
        break
      case "yesterday":
        start = end = subDays(now, 1)
        break
      case "last7days":
        start = subDays(now, 7)
        end = now
        break
      case "last30days":
        start = subDays(now, 30)
        end = now
        break
      case "thismonth":
        start = startOfMonth(now)
        end = now
        break
      case "lastmonth":
        start = startOfMonth(subDays(now, 30))
        end = startOfMonth(now)
        break
      case "thisyear":
        start = startOfYear(now)
        end = now
        break
      case "custom":
        setCustomDateDialogOpen(true)
        return
      default:
        start = subDays(now, 7)
        end = now
    }

    setDateRange({ startDate: start, endDate: end })
  }

  const handleFrequencyChange = (newFrequency: string) => {
    setFrequency(newFrequency.toLowerCase())
  }

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
      case "thismonth":
        return "This Month"
      case "lastmonth":
        return "Last Month"
      case "thisyear":
        return "This Year"
      case "custom":
        // Safely validate dates before formatting
        const startDate = dateRange?.startDate instanceof Date && !isNaN(dateRange.startDate.getTime())
          ? dateRange.startDate
          : dateRange?.startDate
          ? new Date(dateRange.startDate)
          : subDays(new Date(), 30)
        const endDate = dateRange?.endDate instanceof Date && !isNaN(dateRange.endDate.getTime())
          ? dateRange.endDate
          : dateRange?.endDate
          ? new Date(dateRange.endDate)
          : new Date()
        
        // Validate dates before formatting
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return "Invalid date range"
        }
        
        return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`
      default:
        return "Last 7 Days"
    }
  }

  // Widget management functions
  const toggleEditMode = () => {
    setIsEditing(!isEditing)
    if (isEditing) {
      setSelectedWidgetId(null)
    }
  }

  // Handle revert - reload saved layout and exit edit mode without saving
  const handleRevert = async () => {
    console.log('Bookings Dashboard: Reverting changes and exiting edit mode')
    await revertDashboard()
    setIsEditing(false)
    setSelectedWidgetId(null)
  }

  const handleAddWidget = () => {
    const dataType = newWidgetDataType

    const newWidgetId = addWidget(newWidgetType as any, dataType)
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
    { value: DataType.OCCUPANCY_RATE, label: "Occupancy Rate" },
    { value: DataType.BOOKINGS_BY_STATUS, label: "Bookings by Status" },
    { value: DataType.BOOKINGS_BY_TYPE, label: "Bookings by Type" },
    { value: DataType.TABLE_UTILIZATION, label: "Table Utilization" },
    { value: DataType.WAITLIST_ANALYTICS, label: "Waitlist Analytics" },
    { value: DataType.BOOKING_TRENDS, label: "Booking Trends" },
    { value: DataType.CUSTOMER_SEGMENTS, label: "Customer Segments" },
    { value: DataType.CANCELLATION_ANALYSIS, label: "Cancellation Analysis" },
    { value: DataType.SEASONAL_TRENDS, label: "Seasonal Trends" },
    { value: DataType.BOOKINGS_BY_DAY, label: "Bookings by Day" },
    { value: DataType.BOOKINGS_BY_HOUR, label: "Bookings by Hour" },
    { value: DataType.BOOKINGS_BY_SOURCE, label: "Bookings by Source" },
    { value: DataType.BOOKINGS_BY_PARTY_SIZE, label: "Bookings by Party Size" },
  ]

  // Render the dashboard content
  const renderDashboard = () => {
    return (
      <Box sx={{ width: "100%" }}>
        {/* Dashboard Header */}
        <DashboardHeader
          title="Bookings Dashboard"
          subtitle="Bookings Dashboard"
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
              onClick: () => console.log("Navigate to new booking"),
              permission: hasPermission("bookings", "bookings", "edit"),
            },
            {
              label: "Manage Tables",
              onClick: () => console.log("Navigate to table management"),
              permission: hasPermission("bookings", "tables", "edit"),
            },
            {
              label: "View Calendar",
              onClick: () => console.log("Navigate to calendar"),
              permission: hasPermission("bookings", "calendar", "view"),
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
            minHeight: "400px",
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
              onContextMenu={(e: React.MouseEvent<Element, MouseEvent>) => {
                e.preventDefault()
                setContextMenu({
                  mouseX: e.clientX + 2,
                  mouseY: e.clientY - 6,
                  widgetId: widget.id,
                })
              }}
              dragGrid={[GRID_CELL_SIZE, GRID_CELL_SIZE]}
              resizeGrid={[GRID_CELL_SIZE, GRID_CELL_SIZE]}
            >
              <Box sx={{ height: "100%", width: "100%", overflow: "hidden" }}>
                <DynamicWidget
                  widget={widget}
                  data={getWidgetData(widget)}
                  onSettingsOpen={() => setSettingsDialogOpen(true)}
                  isEditing={isEditing}
                />
              </Box>
            </Rnd>
          ))}
        </Box>

      </Box>
    )
  }

  // Context menu handlers

  const handleCloseContextMenu = () => {
    setContextMenu(null)
  }

  const handleOpenWidgetSettings = (widgetId: string) => {
    const widget = dashboardState.widgets.find((w: any) => w.id === widgetId)
    if (widget) {
      setCurrentWidgetSettings(widget)
      setSettingsDialogOpen(true)
    }
    setContextMenu(null)
  }

  const handleDeleteWidget = (widgetId: string) => {
    removeWidget(widgetId)
    setContextMenu(null)
  }

  return (
    <Box sx={{ width: "100%" }}>
      {renderDashboard()}

      {/* Add Widget Dialog */}
      <Dialog open={addWidgetOpen} onClose={() => setAddWidgetOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Widget</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Widget Type</InputLabel>
            <Select
              value={newWidgetType}
              onChange={(e: SelectChangeEvent) => setNewWidgetType(e.target.value)}
            >
              <MenuItem value="stat">Stat</MenuItem>
              <MenuItem value="dashboardCard">Dashboard Card</MenuItem>
              <MenuItem value="barChart">Bar Chart</MenuItem>
              <MenuItem value="lineChart">Line Chart</MenuItem>
              <MenuItem value="pieChart">Pie Chart</MenuItem>
              <MenuItem value="table">Table</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Data Type</InputLabel>
            <Select
              value={newWidgetDataType}
              onChange={(e: SelectChangeEvent) => setNewWidgetDataType(e.target.value as DataType)}
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
          <Button onClick={handleAddWidget} variant="contained">
            Add Widget
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Widgets Dialog */}
      <Dialog open={clearWidgetsDialogOpen} onClose={() => setClearWidgetsDialogOpen(false)}>
        <DialogTitle>Clear All Widgets</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to clear all widgets? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearWidgetsDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmClearWidgets} color="error" variant="contained">
            Clear All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Date Range Dialog */}
      <Dialog open={customDateDialogOpen} onClose={() => setCustomDateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Custom Date Range</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <DatePicker
                label="Start Date"
                value={dateRange.startDate}
                onChange={(newValue) => {
                  if (newValue) {
                    setDateRange((prev) => ({ ...prev, startDate: newValue }))
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal'
                  }
                }}
              />
              <DatePicker
                label="End Date"
                value={dateRange.endDate}
                onChange={(newValue) => {
                  if (newValue) {
                    setDateRange((prev) => ({ ...prev, endDate: newValue }))
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal'
                  }
                }}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomDateDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => setCustomDateDialogOpen(false)} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Widget Context Menu */}
      <WidgetContextMenu
        open={contextMenu !== null}
        position={contextMenu ? { x: contextMenu.mouseX, y: contextMenu.mouseY } : { x: 0, y: 0 }}
        onClose={handleCloseContextMenu}
        widgetId={contextMenu?.widgetId || ""}
        onSettingsOpen={handleOpenWidgetSettings}
        onRemove={() => handleDeleteWidget(contextMenu?.widgetId || "")}
      />

      {/* Widget Settings Dialog */}
      <WidgetSettingsDialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        widget={currentWidgetSettings}
        onSave={(updatedWidget) => {
          updateWidgetSettings(updatedWidget)
          setSettingsDialogOpen(false)
        }}
        availableDataTypes={availableDataTypes}
      />
    </Box>
  )
}

export default BookingsDashboardNew
