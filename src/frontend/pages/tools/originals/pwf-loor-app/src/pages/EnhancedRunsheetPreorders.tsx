"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import {
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Select,
  InputLabel,
  FormControl,
  OutlinedInput,
  ListItemText,
  Paper,
  Chip,
  IconButton,
  Collapse,
  useTheme,
  Tabs,
  Tab,
  Card,
  CardContent,
  Switch,
  FormGroup,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CardActionArea,
  useMediaQuery,
  Stack,
} from "@mui/material"
import {
  ExpandMore,
  RestaurantMenu,
  AccessTime,
  Group,
  TableBar,
  LocationOn,
  Business,
  Phone,
  Notes,
  AttachMoney,
  ViewColumn,
  FilterAlt,
  Print,
  Refresh,
  Info,
  Warning,
  Person,
  Close,
  Email,
  Event,
} from "@mui/icons-material"
import { ref as dbRef, onValue } from "firebase/database"
import { db } from "../services/firebase"

interface EnhancedRunsheetPreordersProps {
  bookings?: Record<string, any>
  preorders?: Record<string, any>
  globalSearch?: string
  preorderFilter?: string
  statusFilter?: string[]
  assignedFilter?: string[]
  setGlobalSearch?: React.Dispatch<React.SetStateAction<string>>
  setPreorderFilter?: React.Dispatch<React.SetStateAction<string>>
  setStatusFilter?: React.Dispatch<React.SetStateAction<string[]>>
  setAssignedFilter?: React.Dispatch<React.SetStateAction<string[]>>
}

interface ColumnConfig {
  id: string
  label: string
  icon: React.ReactNode
  visible: boolean
}

const EnhancedRunsheetPreorders: React.FC<EnhancedRunsheetPreordersProps> = ({
  bookings = {},
  preorders = {},
  globalSearch = "",
  preorderFilter = "All",
  assignedFilter = [],
  setGlobalSearch = () => {},
  setPreorderFilter = () => {},
  setStatusFilter = () => {},
  setAssignedFilter = () => {},
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"))

  // State for UI controls
  const [activeTab, setActiveTab] = useState<number>(0)
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [showColumnSelector, setShowColumnSelector] = useState<boolean>(false)
  const [startTime, setStartTime] = useState<string>("12:00")
  const [endTime, setEndTime] = useState<string>("06:00")
  const [selectedBookingTypes, setSelectedBookingTypes] = useState<string[]>([])
  const [sortOption, setSortOption] = useState<string>("time-asc")
  const [showPreorders, setShowPreorders] = useState<boolean>(true)
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<{
    name: string
    data: any
    preorderData?: any
  } | null>(null)
  const [selectedDate, ] = useState<string>(new Date().toISOString().split("T")[0])

  // State for table assignments from database
  const [tableAssignments, setTableAssignments] = useState<Record<string, any>>({})
  const [staffData, setStaffData] = useState<Record<string, any>>({})

  // Column visibility configuration - Added "assigned" column
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: "name", label: "Name", icon: <RestaurantMenu fontSize="small" />, visible: true },
    { id: "tableNumber", label: "Table", icon: <TableBar fontSize="small" />, visible: true },
    { id: "guests", label: "Guests", icon: <Group fontSize="small" />, visible: true },
    { id: "time", label: "Time", icon: <AccessTime fontSize="small" />, visible: true },
    { id: "area", label: "Area", icon: <LocationOn fontSize="small" />, visible: !isMobile },
    { id: "type", label: "Type", icon: <Info fontSize="small" />, visible: !isMobile },
    { id: "assigned", label: "Assigned", icon: <Person fontSize="small" />, visible: true },
    { id: "ref", label: "Reference", icon: <Info fontSize="small" />, visible: false },
    { id: "phone", label: "Phone", icon: <Phone fontSize="small" />, visible: false },
    { id: "company", label: "Company", icon: <Business fontSize="small" />, visible: false },
    { id: "notes", label: "Notes", icon: <Notes fontSize="small" />, visible: !isSmallMobile },
    { id: "deposits", label: "Deposits", icon: <AttachMoney fontSize="small" />, visible: false },
  ])

  // Listen to table assignments from database
  useEffect(() => {
    const runsheetRef = dbRef(db, `RunsheetsAndPreorders/${selectedDate}`)
    const unsubscribeRunsheet = onValue(runsheetRef, (snapshot) => {
      const data = snapshot.val()
      if (data && data.bookings) {
        const assignments: Record<string, any> = {}
        Object.entries(data.bookings).forEach(([_id, booking]: [string, any]) => {
          if (booking.assignedWaiter) {
            // Map by table number for easy lookup
            const tableNum =
              booking.tableNumber || booking.table || booking.Table || booking["Table Number"] || booking.tableNo
            if (tableNum) {
              assignments[tableNum] = {
                waiterId: booking.assignedWaiter,
                assignedAt: booking.assignedAt,
              }
            }
          }
        })
        setTableAssignments(assignments)
      }
    })

    // Fetch staff data
    const staffRef = dbRef(db, "users")
    const unsubscribeStaff = onValue(staffRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setStaffData(data)
      }
    })

    return () => {
      unsubscribeRunsheet()
      unsubscribeStaff()
    }
  }, [selectedDate])

  // Get waiter name from staff data
  const getWaiterName = (waiterId: string): string => {
    if (!waiterId || !staffData[waiterId]) return ""
    const staff = staffData[waiterId]
    return `${staff.firstName || ""} ${staff.lastName || ""}`.trim() || waiterId
  }

  // Define getFieldValue as a function declaration (hoisted)
  function getFieldValue(obj: Record<string, any>, field: string): any {
    if (!obj || typeof obj !== "object") return undefined
    const lowerField = field.toLowerCase()
    const key = Object.keys(obj).find((k) => k.toLowerCase() === lowerField)
    return key ? obj[key] : undefined
  }

  // Get assigned waiter for a table
  const getAssignedWaiter = (tableNumber: string): string => {
    const assignment = tableAssignments[tableNumber]
    return assignment ? getWaiterName(assignment.waiterId) : ""
  }

  // Compute unique booking types from bookings
  const bookingTypes = useMemo(() => {
    if (!bookings || typeof bookings !== "object") return []

    const typesSet = new Set<string>()
    Object.entries(bookings).forEach(([_, bookingData]) => {
      if (bookingData && typeof bookingData === "object") {
        const type = getFieldValue(bookingData, "type")
        if (type) typesSet.add(String(type).trim())
      }
    })
    return Array.from(typesSet)
  }, [bookings])

  // Helper to extract the numeric portion from a table number string

  // Group preorders by type
  const groupPreordersByType = (items: any[]): Record<string, any[]> => {
    if (!items || !Array.isArray(items)) return { Starters: [], Mains: [], Desserts: [], Drinks: [], Other: [] }

    const grouped: Record<string, any[]> = {
      Starters: [],
      Mains: [],
      Desserts: [],
      Drinks: [],
      Other: [],
    }

    const temperatureOrder = ["B", "R", "M/R", "M", "M/W", "W"]

    items.forEach((item) => {
      if (!item || typeof item !== "object") return

      const normalizedType = item.type?.toLowerCase()
      if (normalizedType === "starter") grouped.Starters.push(item)
      else if (normalizedType === "main") grouped.Mains.push(item)
      else if (normalizedType === "dessert") grouped.Desserts.push(item)
      else if (normalizedType === "drink") grouped.Drinks.push(item)
      else grouped.Other.push(item)
    })

    grouped.Mains = grouped.Mains.sort((a, b) => {
      const tempA = extractTemperature(a?.item || "")
      const tempB = extractTemperature(b?.item || "")
      return temperatureOrder.indexOf(tempA) - temperatureOrder.indexOf(tempB)
    })

    return grouped
  }

  const extractTemperature = (itemName: string): string => {
    const match = itemName.match(/\$\$(B|R|M\/R|M|M\/W|W)\$\$/i)
    return match ? match[1].toUpperCase() : ""
  }

  // Utility to parse time (expects "HH:MM" format)
  const parseTime = (timeStr: string): number => {
    if (!timeStr) return Number.POSITIVE_INFINITY
    const [hours, minutes] = timeStr.split(":").map(Number)
    const timeValue = hours * 60 + minutes
    // For venue operating overnight, adjust times between 00:00 and 06:00 to next day
    if (hours >= 0 && hours < 6) return timeValue + 1440
    return timeValue
  }

  // Check if a booking's time is within the selected range
  const isWithinTimeRange = (bookingTime: number, start: string, end: string): boolean => {
    const startMinutes = parseTime(start)
    const endMinutes = parseTime(end)
    if (startMinutes <= endMinutes) {
      return bookingTime >= startMinutes && bookingTime <= endMinutes
    } else {
      // Wrap-around (e.g., start: 18:00, end: 06:00 next day)
      return bookingTime >= startMinutes || bookingTime <= endMinutes
    }
  }

  // Toggle column visibility
  const toggleColumnVisibility = (columnId: string) => {
    setColumns(columns.map((col) => (col.id === columnId ? { ...col, visible: !col.visible } : col)))
  }

  // Reset column visibility to defaults
  const resetColumnVisibility = () => {
    setColumns(
      columns.map((col) => ({
        ...col,
        visible: ["name", "tableNumber", "guests", "time", "assigned"].includes(col.id),
      })),
    )
  }

  // Handle booking expansion
  const toggleBookingExpansion = (bookingName: string) => {
    setExpandedBooking(expandedBooking === bookingName ? null : bookingName)
  }

  // Handle booking detail view
  const handleBookingClick = (bookingName: string, bookingData: any) => {
    setSelectedBookingDetail({
      name: bookingName,
      data: bookingData,
      preorderData: preorders[bookingName],
    })
  }

  // Close booking detail modal
  const handleCloseBookingDetail = () => {
    setSelectedBookingDetail(null)
  }

  // Get total items count for a preorder group
  const getGroupItemCount = (items: any[]): number => {
    return items.reduce((sum, item) => sum + (Number.parseInt(item.quantity, 10) || 0), 0)
  }

  // Filter bookings based on all criteria
  const filteredBookings = useMemo(() => {
    if (!bookings || typeof bookings !== "object") return []

    return Object.entries(bookings).filter(([bookingName, bookingData]) => {
      if (!bookingData || typeof bookingData !== "object") return false

      const lowerSearch = (globalSearch || "").toLowerCase()
      const nameMatch = (bookingName || "").toLowerCase().includes(lowerSearch)
      const tableNumber = String(getFieldValue(bookingData, "tableNumber") || "").toLowerCase()
      const timeStr = String(getFieldValue(bookingData, "Time") || getFieldValue(bookingData, "time") || "")
      const bookingType = String(getFieldValue(bookingData, "type") || "").trim()
      const notes = String(getFieldValue(bookingData, "run sheet notes") || "").toLowerCase()
      const customerRequests = String(getFieldValue(bookingData, "customer requests") || "").toLowerCase()
      const area = String(getFieldValue(bookingData, "Area") || "").toLowerCase()
      const guests = String(getFieldValue(bookingData, "Guests") || "").toLowerCase()

      // Get assigned waiter for this table
      const assignedWaiter = getAssignedWaiter(String(getFieldValue(bookingData, "tableNumber") || ""))

      // Check if any field matches the search
      const searchMatch =
        nameMatch ||
        tableNumber.includes(lowerSearch) ||
        timeStr.toLowerCase().includes(lowerSearch) ||
        notes.includes(lowerSearch) ||
        customerRequests.includes(lowerSearch) ||
        area.includes(lowerSearch) ||
        guests.includes(lowerSearch) ||
        (assignedWaiter || "").toLowerCase().includes(lowerSearch)

      const bookingTime = parseTime(timeStr)
      const timeMatch = isWithinTimeRange(bookingTime, startTime, endTime)
      const typeMatch = (selectedBookingTypes || []).length === 0 || (selectedBookingTypes || []).includes(bookingType)

      // Filter by assigned waiter
      const assignedMatch = (assignedFilter || []).length === 0 || (assignedFilter || []).includes(assignedWaiter || "")

      return searchMatch && timeMatch && typeMatch && assignedMatch
    })
  }, [bookings, globalSearch, startTime, endTime, selectedBookingTypes, sortOption, tableAssignments, assignedFilter])

  // Count preorders for each booking
  const preorderCounts = useMemo(() => {
    if (!preorders || typeof preorders !== "object") return {}

    const counts: Record<string, number> = {}
    Object.entries(preorders).forEach(([name, preorderData]) => {
      if (preorderData && typeof preorderData === "object") {
        counts[name] = preorderData.items?.length || 0
      }
    })
    return counts
  }, [preorders])

  // Get unique assigned waiters for filter
  const availableWaiters = useMemo(() => {
    const waiters = new Set<string>()
    Object.values(tableAssignments).forEach((assignment) => {
      if (assignment.waiterId) {
        waiters.add(getWaiterName(assignment.waiterId))
      }
    })
    return Array.from(waiters).filter(Boolean)
  }, [tableAssignments, staffData])

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  // Print the current view
  const handlePrint = () => {
    window.print()
  }

  // Reset all filters
  const resetFilters = () => {
    setGlobalSearch("")
    setStartTime("12:00")
    setEndTime("06:00")
    setSelectedBookingTypes([])
    setSortOption("time-asc")
    setShowPreorders(true)
    setStatusFilter([])
    setAssignedFilter([])
  }

  return (
    <Box
      sx={{
        px: isMobile ? 1 : 2,
        py: isMobile ? 1 : 2,
        maxWidth: "100vw",
        overflow: "hidden",
      }}
    >
      {/* Tabs for different views */}
      <Paper sx={{ mb: 2, borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? "fullWidth" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              fontSize: isMobile ? "0.75rem" : "0.875rem",
              minHeight: isMobile ? 48 : 64,
              padding: isMobile ? "6px 8px" : "12px 16px",
            },
          }}
        >
          <Tab
            label={isMobile ? "All" : "Combined View"}
            icon={<RestaurantMenu fontSize={isMobile ? "small" : "medium"} />}
            iconPosition="start"
          />
          <Tab
            label={isMobile ? "Bookings" : "Runsheet Only"}
            icon={<TableBar fontSize={isMobile ? "small" : "medium"} />}
            iconPosition="start"
          />
          <Tab
            label={isMobile ? "Preorders" : "Preorders Only"}
            icon={<Notes fontSize={isMobile ? "small" : "medium"} />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Action Buttons */}
      <Stack direction={isMobile ? "column" : "row"} spacing={1} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterAlt fontSize="small" />}
            onClick={() => setShowFilters(!showFilters)}
            color={showFilters ? "primary" : "inherit"}
            sx={{
              fontSize: isMobile ? "0.75rem" : "0.875rem",
              minWidth: isMobile ? "auto" : "64px",
              px: isMobile ? 1 : 2,
            }}
          >
            {isMobile ? "Filter" : "Filters"}
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<ViewColumn fontSize="small" />}
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            color={showColumnSelector ? "primary" : "inherit"}
            sx={{
              fontSize: isMobile ? "0.75rem" : "0.875rem",
              minWidth: isMobile ? "auto" : "64px",
              px: isMobile ? 1 : 2,
            }}
          >
            {isMobile ? "Cols" : "Columns"}
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Print fontSize="small" />}
            onClick={handlePrint}
            sx={{
              fontSize: isMobile ? "0.75rem" : "0.875rem",
              minWidth: isMobile ? "auto" : "64px",
              px: isMobile ? 1 : 2,
            }}
          >
            Print
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh fontSize="small" />}
            onClick={resetFilters}
            sx={{
              fontSize: isMobile ? "0.75rem" : "0.875rem",
              minWidth: isMobile ? "auto" : "64px",
              px: isMobile ? 1 : 2,
            }}
          >
            Reset
          </Button>
        </Stack>
      </Stack>

      {/* Filters Panel */}
      <Collapse in={showFilters}>
        <Paper sx={{ p: isMobile ? 1.5 : 2, mb: 2, borderRadius: 2 }}>
          <Typography
            variant={isMobile ? "subtitle2" : "subtitle1"}
            fontWeight="bold"
            gutterBottom
            sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
          >
            Filter Options
          </Typography>

          <Grid container spacing={isMobile ? 1.5 : 2}>
            <Grid item xs={6} sm={6} md={3}>
              <TextField
                label="Start Time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                sx={{
                  "& .MuiInputLabel-root": {
                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                  },
                  "& .MuiInputBase-input": {
                    fontSize: isMobile ? "0.875rem" : "1rem",
                  },
                }}
              />
            </Grid>

            <Grid item xs={6} sm={6} md={3}>
              <TextField
                label="End Time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                sx={{
                  "& .MuiInputLabel-root": {
                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                  },
                  "& .MuiInputBase-input": {
                    fontSize: isMobile ? "0.875rem" : "1rem",
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>Sort By</InputLabel>
                <Select
                  value={sortOption}
                  label="Sort By"
                  onChange={(e) => setSortOption(e.target.value)}
                  sx={{
                    "& .MuiSelect-select": {
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    },
                  }}
                >
                  <MenuItem value="time-asc" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                    Time (Early)
                  </MenuItem>
                  <MenuItem value="time-desc" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                    Time (Late)
                  </MenuItem>
                  <MenuItem value="name-asc" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                    Name (A-Z)
                  </MenuItem>
                  <MenuItem value="name-desc" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                    Name (Z-A)
                  </MenuItem>
                  <MenuItem value="table-asc" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                    Table (Low)
                  </MenuItem>
                  <MenuItem value="table-desc" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                    Table (High)
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>Booking Type</InputLabel>
                <Select
                  multiple
                  value={selectedBookingTypes}
                  onChange={(e) =>
                    setSelectedBookingTypes(
                      typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value,
                    )
                  }
                  input={<OutlinedInput label="Booking Type" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={value}
                          size="small"
                          sx={{
                            fontSize: isMobile ? "0.6rem" : "0.75rem",
                            height: isMobile ? 18 : 20,
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  sx={{
                    "& .MuiSelect-select": {
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    },
                  }}
                >
                  {bookingTypes.map((type) => (
                    <MenuItem key={type} value={type} sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                      <Checkbox checked={selectedBookingTypes.indexOf(type) > -1} />
                      <ListItemText
                        primary={type}
                        primaryTypographyProps={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>Assigned Waiter</InputLabel>
                <Select
                  multiple
                  value={assignedFilter}
                  onChange={(e) =>
                    setAssignedFilter(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value)
                  }
                  input={<OutlinedInput label="Assigned Waiter" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={value}
                          size="small"
                          sx={{
                            fontSize: isMobile ? "0.6rem" : "0.75rem",
                            height: isMobile ? 18 : 20,
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  sx={{
                    "& .MuiSelect-select": {
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    },
                  }}
                >
                  {availableWaiters.map((waiter) => (
                    <MenuItem key={waiter} value={waiter} sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                      <Checkbox checked={assignedFilter.indexOf(waiter) > -1} />
                      <ListItemText
                        primary={waiter}
                        primaryTypographyProps={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch checked={showPreorders} onChange={(e) => setShowPreorders(e.target.checked)} size="small" />
                  }
                  label={<Typography sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>Show Preorders</Typography>}
                />
              </FormGroup>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* Column Selector - Now available on mobile too */}
      <Collapse in={showColumnSelector}>
        <Paper sx={{ p: isMobile ? 1.5 : 2, mb: 2, borderRadius: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography
              variant={isMobile ? "subtitle2" : "subtitle1"}
              fontWeight="bold"
              sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
            >
              Visible Columns
            </Typography>
            <Button size="small" onClick={resetColumnVisibility} sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
              Reset
            </Button>
          </Box>

          <Grid container spacing={isMobile ? 0.5 : 1}>
            {columns.map((column) => (
              <Grid item xs={6} sm={4} md={3} key={column.id}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={column.visible}
                      onChange={() => toggleColumnVisibility(column.id)}
                      size="small"
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      {column.icon}
                      <Typography variant="body2" sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
                        {column.label}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    "& .MuiFormControlLabel-label": {
                      fontSize: isMobile ? "0.75rem" : "0.875rem",
                    },
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Collapse>

      {/* Booking Cards */}
      {activeTab !== 2 && (
        <Box>
          {filteredBookings.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center", borderRadius: 2 }}>
              <Typography
                variant={isMobile ? "body1" : "h6"}
                color="text.secondary"
                sx={{ fontSize: isMobile ? "1rem" : "1.25rem" }}
              >
                No bookings match your filters
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, fontSize: isMobile ? "0.875rem" : "1rem" }}
              >
                Try adjusting your search criteria or filters
              </Typography>
            </Paper>
          ) : (
            filteredBookings.map(([bookingName, bookingData]) => {
              const guests = getFieldValue(bookingData, "Guests") || "N/A"
              const area = getFieldValue(bookingData, "Area") || "N/A"
              const tableNumber = getFieldValue(bookingData, "tableNumber") || "N/A"
              const time = getFieldValue(bookingData, "Time") || getFieldValue(bookingData, "time") || "N/A"
              const phone = getFieldValue(bookingData, "Phone")
              const refVal = getFieldValue(bookingData, "Ref")
              const company = getFieldValue(bookingData, "Company")
              const actionLabel = getFieldValue(bookingData, "action label") || ""
              const type = getFieldValue(bookingData, "Type") || getFieldValue(bookingData, "type") || "N/A"
              const notes = getFieldValue(bookingData, "run sheet notes")
              const customerRequests = getFieldValue(bookingData, "customer requests") || ""
              const deposits = getFieldValue(bookingData, "Deposits")

              // Get assigned waiter for this table
              const assignedWaiter = getAssignedWaiter(String(tableNumber))

              // Get preorder data for the booking (if any)
              const preorderData = preorders[bookingName]
              const hasPreorders = !!preorderData && preorderData.items?.length > 0
              const preorderCount = preorderCounts[bookingName] || 0

              return (
                <Card
                  key={bookingName}
                  sx={{
                    mb: isMobile ? 1.5 : 2,
                    borderRadius: 2,
                    position: "relative",
                    overflow: "visible",
                    boxShadow: hasPreorders ? `0 0 0 2px ${theme.palette.primary.main}` : undefined,
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: isMobile ? "none" : "translateY(-2px)",
                      boxShadow: isMobile ? theme.shadows[2] : theme.shadows[4],
                    },
                    "&:active": {
                      transform: isMobile ? "scale(0.98)" : "translateY(-2px)",
                    },
                  }}
                >
                  {/* Preorder Badge */}
                  {hasPreorders && showPreorders && (
                    <Chip
                      label={`${preorderCount} Preorder${preorderCount !== 1 ? "s" : ""}`}
                      color="primary"
                      size="small"
                      sx={{
                        position: "absolute",
                        top: -8,
                        right: isMobile ? 8 : 16,
                        zIndex: 1,
                        fontSize: isMobile ? "0.6rem" : "0.75rem",
                        height: isMobile ? 20 : 24,
                      }}
                    />
                  )}

                  <CardActionArea onClick={() => handleBookingClick(bookingName, bookingData)}>
                    <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                      {/* Mobile Layout */}
                      {isMobile ? (
                        <Box>
                          {/* Header Row */}
                          <Box
                            sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}
                          >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="h6"
                                fontWeight="bold"
                                sx={{
                                  fontSize: "1rem",
                                  lineHeight: 1.2,
                                  wordWrap: "break-word",
                                  overflowWrap: "break-word",
                                  hyphens: "auto",
                                }}
                              >
                                {bookingName}
                              </Typography>
                              <Typography
                                variant="body1"
                                fontWeight="medium"
                                color="primary"
                                sx={{
                                  fontSize: "0.875rem",
                                  wordWrap: "break-word",
                                  overflowWrap: "break-word",
                                }}
                              >
                                {tableNumber}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: "right", ml: 1 }}>
                              <Typography variant="body2" sx={{ fontSize: "0.875rem", fontWeight: "medium" }}>
                                {time}
                              </Typography>
                              <Typography variant="body2" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                                {guests} {Number.parseInt(guests) === 1 ? "Guest" : "Guests"}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Assigned Waiter */}
                          {assignedWaiter && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                              <Person fontSize="small" color="action" />
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: "0.875rem",
                                  fontWeight: "medium",
                                  color: theme.palette.primary.main,
                                }}
                              >
                                {assignedWaiter}
                              </Typography>
                            </Box>
                          )}

                          {/* Notes - Mobile */}
                          {(notes || customerRequests) && (
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                              <Notes fontSize="small" color="action" sx={{ mt: 0.1 }} />
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: "0.75rem",
                                  color: "text.secondary",
                                  lineHeight: 1.3,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {notes} {customerRequests && <span>{customerRequests}</span>}
                              </Typography>
                            </Box>
                          )}

                          {/* Action Labels - Mobile */}
                          {actionLabel && (
                            <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                              {actionLabel
                                .split(",")
                                .filter((label: string) => label.trim() !== "")
                                .slice(0, 3) // Limit to 3 on mobile
                                .map((label: string, idx: number) => (
                                  <Chip
                                    key={idx}
                                    label={label.trim()}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      fontSize: "0.6rem",
                                      height: 20,
                                    }}
                                  />
                                ))}
                            </Box>
                          )}
                        </Box>
                      ) : (
                        /* Desktop Layout */
                        <Grid container spacing={2} alignItems="center">
                          {/* Name & Table */}
                          {(columns.find((c) => c.id === "name")?.visible ||
                            columns.find((c) => c.id === "tableNumber")?.visible) && (
                            <Grid item xs={12} sm={3}>
                              <Box>
                                {columns.find((c) => c.id === "name")?.visible && (
                                  <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    sx={{
                                      wordWrap: "break-word",
                                      overflowWrap: "break-word",
                                      hyphens: "auto",
                                    }}
                                  >
                                    {bookingName}
                                  </Typography>
                                )}
                                {columns.find((c) => c.id === "tableNumber")?.visible && (
                                  <Typography
                                    variant="body1"
                                    fontWeight="medium"
                                    color="primary"
                                    sx={{
                                      wordWrap: "break-word",
                                      overflowWrap: "break-word",
                                    }}
                                  >
                                    {tableNumber}
                                  </Typography>
                                )}
                              </Box>
                            </Grid>
                          )}

                          {/* Guests & Time */}
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                              {columns.find((c) => c.id === "guests")?.visible && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                                  <Group fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    {guests} {Number.parseInt(guests) === 1 ? "Guest" : "Guests"}
                                  </Typography>
                                </Box>
                              )}

                              {columns.find((c) => c.id === "time")?.visible && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                  <AccessTime fontSize="small" color="action" />
                                  <Typography variant="body2">{time}</Typography>
                                </Box>
                              )}
                            </Box>
                          </Grid>

                          {/* Area & Type */}
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                              {columns.find((c) => c.id === "area")?.visible && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                                  <LocationOn fontSize="small" color="action" />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      maxWidth: "100%",
                                    }}
                                  >
                                    {area}
                                  </Typography>
                                </Box>
                              )}

                              {columns.find((c) => c.id === "type")?.visible && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                  <Info fontSize="small" color="action" />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      wordWrap: "break-word",
                                      overflowWrap: "break-word",
                                    }}
                                  >
                                    {type}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Grid>

                          {/* Contact Info & Assigned */}
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                              {columns.find((c) => c.id === "assigned")?.visible && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                                  <Person fontSize="small" color="action" />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      wordWrap: "break-word",
                                      overflowWrap: "break-word",
                                      fontWeight: assignedWaiter ? "medium" : "normal",
                                      color: assignedWaiter ? theme.palette.primary.main : theme.palette.text.secondary,
                                    }}
                                  >
                                    {assignedWaiter || "Unassigned"}
                                  </Typography>
                                </Box>
                              )}

                              {columns.find((c) => c.id === "phone")?.visible && phone && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                                  <Phone fontSize="small" color="action" />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      wordWrap: "break-word",
                                      overflowWrap: "break-word",
                                    }}
                                  >
                                    {phone}
                                  </Typography>
                                </Box>
                              )}

                              {columns.find((c) => c.id === "company")?.visible && company && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                                  <Business fontSize="small" color="action" />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      wordWrap: "break-word",
                                      overflowWrap: "break-word",
                                    }}
                                  >
                                    {company}
                                  </Typography>
                                </Box>
                              )}

                              {columns.find((c) => c.id === "ref")?.visible && refVal && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                  <Info fontSize="small" color="action" />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      wordWrap: "break-word",
                                      overflowWrap: "break-word",
                                    }}
                                  >
                                    {refVal}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Grid>

                          {/* Action Labels - Desktop */}
                          {actionLabel && (
                            <Grid item xs={12}>
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                {actionLabel
                                  .split(",")
                                  .filter((label: string) => label.trim() !== "")
                                  .map((label: string, idx: number) => (
                                    <Chip key={idx} label={label.trim()} size="small" variant="outlined" />
                                  ))}
                              </Box>
                            </Grid>
                          )}

                          {/* Notes & Deposits - Desktop */}
                          {(columns.find((c) => c.id === "notes")?.visible ||
                            columns.find((c) => c.id === "deposits")?.visible) && (
                            <Grid item xs={12}>
                              <Box>
                                {columns.find((c) => c.id === "notes")?.visible && (notes || customerRequests) && (
                                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, mb: 0.5 }}>
                                    <Notes fontSize="small" color="action" sx={{ mt: 0.3 }} />
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "100%",
                                      }}
                                    >
                                      {notes} {customerRequests && <span>{customerRequests}</span>}
                                    </Typography>
                                  </Box>
                                )}

                                {columns.find((c) => c.id === "deposits")?.visible && deposits && (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <AttachMoney fontSize="small" color="action" />
                                    <Typography variant="body2">{deposits}</Typography>
                                  </Box>
                                )}
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      )}
                    </CardContent>
                  </CardActionArea>

                  {/* Preorders Section */}
                  {showPreorders && hasPreorders && activeTab !== 1 && (
                    <>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          px: isMobile ? 1.5 : 2,
                          pb: 1,
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleBookingExpansion(bookingName)
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          color="primary"
                          sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
                        >
                          Preorders
                        </Typography>
                        <IconButton size="small">
                          <ExpandMore
                            sx={{
                              transform: expandedBooking === bookingName ? "rotate(180deg)" : "rotate(0)",
                              transition: "transform 0.3s",
                            }}
                          />
                        </IconButton>
                      </Box>

                      <Collapse in={expandedBooking === bookingName}>
                        <Box sx={{ px: isMobile ? 1.5 : 2, pb: isMobile ? 1.5 : 2 }}>
                          {Object.entries(groupPreordersByType(preorderData.items)).map(([groupType, items]) => {
                            if (items.length === 0) return null
                            if (preorderFilter !== "All" && preorderFilter !== groupType) return null

                            const totalItems = getGroupItemCount(items)

                            return (
                              <Box key={groupType} sx={{ mb: isMobile ? 1.5 : 2 }}>
                                <Box
                                  sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}
                                >
                                  <Typography
                                    variant="subtitle2"
                                    fontWeight="bold"
                                    sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
                                  >
                                    {groupType}
                                  </Typography>
                                  <Chip
                                    label={`${totalItems} items`}
                                    size="small"
                                    color={
                                      groupType === "Starters"
                                        ? "primary"
                                        : groupType === "Mains"
                                          ? "secondary"
                                          : groupType === "Desserts"
                                            ? "success"
                                            : groupType === "Drinks"
                                              ? "info"
                                              : "default"
                                    }
                                    variant="outlined"
                                    sx={{
                                      fontSize: isMobile ? "0.6rem" : "0.75rem",
                                      height: isMobile ? 20 : 24,
                                    }}
                                  />
                                </Box>

                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: isMobile ? 0.5 : 1 }}>
                                  {items.map((item, index) => (
                                    <Chip
                                      key={index}
                                      label={`${item.item} (x${item.quantity})`}
                                      size="small"
                                      variant="outlined"
                                      color={
                                        groupType === "Starters"
                                          ? "primary"
                                          : groupType === "Mains"
                                            ? "secondary"
                                            : groupType === "Desserts"
                                              ? "success"
                                              : groupType === "Drinks"
                                                ? "info"
                                                : "default"
                                      }
                                      sx={{
                                        fontSize: isMobile ? "0.6rem" : "0.75rem",
                                        height: isMobile ? 20 : 24,
                                      }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )
                          })}
                        </Box>
                      </Collapse>
                    </>
                  )}
                </Card>
              )
            })
          )}
        </Box>
      )}

      {/* Preorders Only View */}
      {activeTab === 2 && (
        <Box>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>Filter by Type</InputLabel>
            <Select
              value={preorderFilter}
              onChange={(e) => setPreorderFilter(e.target.value)}
              label="Filter by Type"
              size={isMobile ? "small" : "medium"}
              sx={{
                "& .MuiSelect-select": {
                  fontSize: isMobile ? "0.875rem" : "1rem",
                },
              }}
            >
              <MenuItem value="All" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                All Types
              </MenuItem>
              <MenuItem value="Starters" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                Starters
              </MenuItem>
              <MenuItem value="Mains" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                Mains
              </MenuItem>
              <MenuItem value="Desserts" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                Desserts
              </MenuItem>
              <MenuItem value="Drinks" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                Drinks
              </MenuItem>
              <MenuItem value="Other" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                Other
              </MenuItem>
            </Select>
          </FormControl>

          {Object.entries(preorders).length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center", borderRadius: 2 }}>
              <Typography
                variant={isMobile ? "body1" : "h6"}
                color="text.secondary"
                sx={{ fontSize: isMobile ? "1rem" : "1.25rem" }}
              >
                No preorders available
              </Typography>
            </Paper>
          ) : (
            filteredBookings
              .filter(([bookingName]) => preorders[bookingName])
              .map(([bookingName, bookingData]) => {
                const preorderData = preorders[bookingName]
                if (!preorderData || !preorderData.items || preorderData.items.length === 0) {
                  return null
                }

                const tableNumber = getFieldValue(bookingData, "tableNumber") || "N/A"
                const time = getFieldValue(bookingData, "Time") || getFieldValue(bookingData, "time") || "N/A"
                const guests = getFieldValue(bookingData, "Guests") || "N/A"
                const notes = getFieldValue(bookingData, "run sheet notes")
                const customerRequests = getFieldValue(bookingData, "customer requests") || ""

                const groupedItems = groupPreordersByType(preorderData.items)
                const filteredGroups = Object.entries(groupedItems).filter(
                  ([type, items]) => (preorderFilter === "All" || type === preorderFilter) && items.length > 0,
                )

                if (filteredGroups.length === 0) {
                  return null
                }

                return (
                  <Card
                    key={bookingName}
                    sx={{
                      mb: isMobile ? 1.5 : 2,
                      borderRadius: 2,
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        transform: isMobile ? "none" : "translateY(-2px)",
                        boxShadow: isMobile ? theme.shadows[2] : theme.shadows[4],
                      },
                      "&:active": {
                        transform: isMobile ? "scale(0.98)" : "translateY(-2px)",
                      },
                    }}
                  >
                    <CardActionArea onClick={() => handleBookingClick(bookingName, bookingData)}>
                      <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                          <Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: isMobile ? "1rem" : "1.25rem" }}>
                              {bookingName}
                            </Typography>
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
                              >
                                {tableNumber} • {time} • {guests} {Number.parseInt(guests) === 1 ? "Guest" : "Guests"}
                              </Typography>
                              {(notes || customerRequests) && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    mt: 0.5,
                                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                                    display: "-webkit-box",
                                    WebkitLineClamp: isMobile ? 2 : 1,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  <Notes fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} />
                                  {notes} {customerRequests && <span>{customerRequests}</span>}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>

                        {filteredGroups.map(([type, items]) => {
                          const totalItems = getGroupItemCount(items)

                          return (
                            <Box key={type} sx={{ mb: isMobile ? 1.5 : 2 }}>
                              <Box
                                sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="bold"
                                  sx={{
                                    fontSize: isMobile ? "0.875rem" : "1rem",
                                    borderBottom: `2px solid ${
                                      type === "Starters"
                                        ? theme.palette.primary.main
                                        : type === "Mains"
                                          ? theme.palette.secondary.main
                                          : type === "Desserts"
                                            ? theme.palette.success.main
                                            : type === "Drinks"
                                              ? theme.palette.info.main
                                              : theme.palette.divider
                                    }`,
                                    pb: 0.5,
                                  }}
                                >
                                  {type}
                                </Typography>
                                <Chip
                                  label={`${totalItems} items`}
                                  size="small"
                                  color={
                                    type === "Starters"
                                      ? "primary"
                                      : type === "Mains"
                                        ? "secondary"
                                        : type === "Desserts"
                                          ? "success"
                                          : type === "Drinks"
                                            ? "info"
                                            : "default"
                                  }
                                  variant="outlined"
                                  sx={{
                                    fontSize: isMobile ? "0.6rem" : "0.75rem",
                                    height: isMobile ? 20 : 24,
                                  }}
                                />
                              </Box>

                              <Grid container spacing={isMobile ? 1 : 1}>
                                {items.map((item, index) => (
                                  <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Paper
                                      variant="outlined"
                                      sx={{
                                        p: isMobile ? 1 : 1.5,
                                        borderRadius: 2,
                                        borderColor:
                                          type === "Starters"
                                            ? theme.palette.primary.main
                                            : type === "Mains"
                                              ? theme.palette.secondary.main
                                              : type === "Desserts"
                                                ? theme.palette.success.main
                                                : type === "Drinks"
                                                  ? theme.palette.info.main
                                                  : theme.palette.divider,
                                      }}
                                    >
                                      <Typography
                                        variant="body1"
                                        fontWeight="medium"
                                        sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
                                      >
                                        {item.item}{" "}
                                        <Chip
                                          label={`x${item.quantity}`}
                                          size="small"
                                          sx={{
                                            fontSize: isMobile ? "0.6rem" : "0.75rem",
                                            height: isMobile ? 18 : 20,
                                          }}
                                        />
                                      </Typography>

                                      {item.dietary && (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                                          <Warning fontSize="small" color="warning" />
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}
                                          >
                                            {item.dietary}
                                          </Typography>
                                        </Box>
                                      )}

                                      {item.for && (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                                          <Person fontSize="small" color="action" />
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}
                                          >
                                            For: {item.for}
                                          </Typography>
                                        </Box>
                                      )}
                                    </Paper>
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          )
                        })}
                      </CardContent>
                    </CardActionArea>
                  </Card>
                )
              })
              .filter(Boolean)
          )}
        </Box>
      )}

      {/* Summary Stats */}
      <Paper sx={{ p: isMobile ? 1.5 : 2, mt: 3, borderRadius: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
          Summary
        </Typography>

        <Grid container spacing={isMobile ? 1 : 2}>
          <Grid item xs={4}>
            <Typography variant="body2" sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
              Total Bookings: <strong>{filteredBookings.length}</strong>
            </Typography>
          </Grid>

          <Grid item xs={4}>
            <Typography variant="body2" sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
              Total Guests:{" "}
              <strong>
                {filteredBookings.reduce((sum, [_, data]) => {
                  const guests = Number.parseInt(String(getFieldValue(data, "Guests") || "0"), 10)
                  return sum + (isNaN(guests) ? 0 : guests)
                }, 0)}
              </strong>
            </Typography>
          </Grid>

          <Grid item xs={4}>
            <Typography variant="body2" sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
              With Preorders:{" "}
              <strong>{filteredBookings.filter(([name]) => preorders[name]?.items?.length > 0).length}</strong>
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Booking Detail Modal */}
      <Dialog
        open={!!selectedBookingDetail}
        onClose={handleCloseBookingDetail}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            maxHeight: isMobile ? "100vh" : "90vh",
            margin: isMobile ? 0 : 2,
          },
        }}
      >
        {selectedBookingDetail && (
          <>
            <DialogTitle
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: isMobile ? 2 : 3,
              }}
            >
              <Typography variant="h5" fontWeight="bold" sx={{ fontSize: isMobile ? "1.25rem" : "1.5rem" }}>
                {selectedBookingDetail.name}
              </Typography>
              <IconButton onClick={handleCloseBookingDetail} size="small">
                <Close />
              </IconButton>
            </DialogTitle>

            <DialogContent
              dividers
              sx={{
                p: isMobile ? 2 : 3,
                fontSize: isMobile ? "0.875rem" : "1rem",
              }}
            >
              <Grid container spacing={isMobile ? 2 : 3}>
                {/* Basic Information */}
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    color="primary"
                    sx={{ fontSize: isMobile ? "1rem" : "1.25rem" }}
                  >
                    Booking Details
                  </Typography>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 1.5 : 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TableBar color="action" fontSize={isMobile ? "small" : "medium"} />
                      <Typography variant="body1" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                        <strong>Table:</strong> {getFieldValue(selectedBookingDetail.data, "tableNumber") || "N/A"}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AccessTime color="action" fontSize={isMobile ? "small" : "medium"} />
                      <Typography variant="body1" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                        <strong>Time:</strong>{" "}
                        {getFieldValue(selectedBookingDetail.data, "Time") ||
                          getFieldValue(selectedBookingDetail.data, "time") ||
                          "N/A"}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Group color="action" fontSize={isMobile ? "small" : "medium"} />
                      <Typography variant="body1" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                        <strong>Guests:</strong> {getFieldValue(selectedBookingDetail.data, "Guests") || "N/A"}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Person color="action" fontSize={isMobile ? "small" : "medium"} />
                      <Typography variant="body1" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                        <strong>Assigned:</strong>{" "}
                        {getAssignedWaiter(String(getFieldValue(selectedBookingDetail.data, "tableNumber") || "")) ||
                          "Unassigned"}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocationOn color="action" fontSize={isMobile ? "small" : "medium"} />
                      <Typography variant="body1" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                        <strong>Area:</strong> {getFieldValue(selectedBookingDetail.data, "Area") || "N/A"}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Info color="action" fontSize={isMobile ? "small" : "medium"} />
                      <Typography variant="body1" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                        <strong>Type:</strong>{" "}
                        {getFieldValue(selectedBookingDetail.data, "Type") ||
                          getFieldValue(selectedBookingDetail.data, "type") ||
                          "N/A"}
                      </Typography>
                    </Box>

                    {getFieldValue(selectedBookingDetail.data, "Phone") && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Phone color="action" fontSize={isMobile ? "small" : "medium"} />
                        <Typography variant="body1" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                          <strong>Phone:</strong> {getFieldValue(selectedBookingDetail.data, "Phone")}
                        </Typography>
                      </Box>
                    )}

                    {getFieldValue(selectedBookingDetail.data, "Email") && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Email color="action" fontSize={isMobile ? "small" : "medium"} />
                        <Typography variant="body1" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                          <strong>Email:</strong> {getFieldValue(selectedBookingDetail.data, "Email")}
                        </Typography>
                      </Box>
                    )}

                    {getFieldValue(selectedBookingDetail.data, "Company") && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Business color="action" fontSize={isMobile ? "small" : "medium"} />
                        <Typography variant="body1" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                          <strong>Company:</strong> {getFieldValue(selectedBookingDetail.data, "Company")}
                        </Typography>
                      </Box>
                    )}

                    {getFieldValue(selectedBookingDetail.data, "Ref") && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Event color="action" fontSize={isMobile ? "small" : "medium"} />
                        <Typography variant="body1" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                          <strong>Reference:</strong> {getFieldValue(selectedBookingDetail.data, "Ref")}
                        </Typography>
                      </Box>
                    )}

                    {getFieldValue(selectedBookingDetail.data, "Deposits") && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <AttachMoney color="action" fontSize={isMobile ? "small" : "medium"} />
                        <Typography variant="body1" sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                          <strong>Deposits:</strong> {getFieldValue(selectedBookingDetail.data, "Deposits")}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>

                {/* Notes and Requests */}
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    color="primary"
                    sx={{ fontSize: isMobile ? "1rem" : "1.25rem" }}
                  >
                    Notes & Requests
                  </Typography>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 1.5 : 2 }}>
                    {getFieldValue(selectedBookingDetail.data, "run sheet notes") && (
                      <Box>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          gutterBottom
                          sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
                        >
                          Run Sheet Notes:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            p: isMobile ? 1 : 1.5,
                            bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                            borderRadius: 1,
                            wordWrap: "break-word",
                            overflowWrap: "break-word",
                            hyphens: "auto",
                            fontSize: isMobile ? "0.75rem" : "0.875rem",
                            lineHeight: isMobile ? 1.4 : 1.5,
                          }}
                        >
                          {getFieldValue(selectedBookingDetail.data, "run sheet notes")}
                        </Typography>
                      </Box>
                    )}

                    {getFieldValue(selectedBookingDetail.data, "customer requests") && (
                      <Box>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          gutterBottom
                          sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
                        >
                          Customer Requests:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            p: isMobile ? 1 : 1.5,
                            bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                            borderRadius: 1,
                            wordWrap: "break-word",
                            overflowWrap: "break-word",
                            hyphens: "auto",
                            fontSize: isMobile ? "0.75rem" : "0.875rem",
                            lineHeight: isMobile ? 1.4 : 1.5,
                          }}
                        >
                          {getFieldValue(selectedBookingDetail.data, "customer requests")}
                        </Typography>
                      </Box>
                    )}

                    {getFieldValue(selectedBookingDetail.data, "action label") && (
                      <Box>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          gutterBottom
                          sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
                        >
                          Action Labels:
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {getFieldValue(selectedBookingDetail.data, "action label")
                            .split(",")
                            .filter((label: string) => label.trim() !== "")
                            .map((label: string, idx: number) => (
                              <Chip
                                key={idx}
                                label={label.trim()}
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontSize: isMobile ? "0.6rem" : "0.75rem",
                                  height: isMobile ? 20 : 24,
                                }}
                              />
                            ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Grid>

                {/* Preorders */}
                {selectedBookingDetail.preorderData && selectedBookingDetail.preorderData.items && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: isMobile ? 1.5 : 2 }} />
                    <Typography
                      variant="h6"
                      gutterBottom
                      color="primary"
                      sx={{ fontSize: isMobile ? "1rem" : "1.25rem" }}
                    >
                      Preorders
                    </Typography>

                    {Object.entries(groupPreordersByType(selectedBookingDetail.preorderData.items)).map(
                      ([groupType, items]) => {
                        if (items.length === 0) return null

                        const totalItems = getGroupItemCount(items)

                        return (
                          <Box key={groupType} sx={{ mb: isMobile ? 2 : 3 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                mb: isMobile ? 1.5 : 2,
                              }}
                            >
                              <Typography
                                variant="subtitle1"
                                fontWeight="bold"
                                sx={{
                                  fontSize: isMobile ? "0.875rem" : "1rem",
                                  borderBottom: `2px solid ${
                                    groupType === "Starters"
                                      ? theme.palette.primary.main
                                      : groupType === "Mains"
                                        ? theme.palette.secondary.main
                                        : groupType === "Desserts"
                                          ? theme.palette.success.main
                                          : groupType === "Drinks"
                                            ? theme.palette.info.main
                                            : theme.palette.divider
                                  }`,
                                  pb: 0.5,
                                }}
                              >
                                {groupType}
                              </Typography>
                              <Chip
                                label={`${totalItems} items`}
                                size="small"
                                color={
                                  groupType === "Starters"
                                    ? "primary"
                                    : groupType === "Mains"
                                      ? "secondary"
                                      : groupType === "Desserts"
                                        ? "success"
                                        : groupType === "Drinks"
                                          ? "info"
                                          : "default"
                                }
                                variant="outlined"
                                sx={{
                                  fontSize: isMobile ? "0.6rem" : "0.75rem",
                                  height: isMobile ? 20 : 24,
                                }}
                              />
                            </Box>

                            <Grid container spacing={isMobile ? 1.5 : 2}>
                              {items.map((item, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                  <Paper
                                    variant="outlined"
                                    sx={{
                                      p: isMobile ? 1.5 : 2,
                                      borderRadius: 2,
                                      borderColor:
                                        groupType === "Starters"
                                          ? theme.palette.primary.main
                                          : groupType === "Mains"
                                            ? theme.palette.secondary.main
                                            : groupType === "Desserts"
                                              ? theme.palette.success.main
                                              : groupType === "Drinks"
                                                ? theme.palette.info.main
                                                : theme.palette.divider,
                                    }}
                                  >
                                    <Typography
                                      variant="body1"
                                      fontWeight="medium"
                                      gutterBottom
                                      sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
                                    >
                                      {item.item}
                                    </Typography>

                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                      <Chip
                                        label={`Quantity: ${item.quantity}`}
                                        size="small"
                                        color="primary"
                                        sx={{
                                          fontSize: isMobile ? "0.6rem" : "0.75rem",
                                          height: isMobile ? 20 : 24,
                                        }}
                                      />
                                    </Box>

                                    {item.dietary && (
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                                        <Warning fontSize="small" color="warning" />
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                          sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}
                                        >
                                          <strong>Dietary:</strong> {item.dietary}
                                        </Typography>
                                      </Box>
                                    )}

                                    {item.for && (
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                        <Person fontSize="small" color="action" />
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                          sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}
                                        >
                                          <strong>For:</strong> {item.for}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Paper>
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        )
                      },
                    )}
                  </Grid>
                )}
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: isMobile ? 2 : 3 }}>
              <Button
                onClick={handleCloseBookingDetail}
                variant="outlined"
                fullWidth={isMobile}
                sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Print Styles - Hidden in normal view */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #root, #root * {
            visibility: visible;
          }
          button, .MuiTabs-root, .MuiFormControl-root {
            display: none !important;
          }
        }
      `}</style>
    </Box>
  )
}

export default EnhancedRunsheetPreorders
