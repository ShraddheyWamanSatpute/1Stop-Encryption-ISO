"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Grid,
  useTheme,
  useMediaQuery,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Backdrop,
} from "@mui/material"
import {
  Restaurant,
  Group,
  Schedule,
  ChevronLeft,
  ChevronRight,
  Today,
  FilterList,
  Clear,
  ExpandMore,
  TableRestaurant,
  LocalDining,
  Payment,
  Cake,
  CheckBox,
  CheckBoxOutlineBlank,
  Update,
  ViewList,
  ViewModule,
} from "@mui/icons-material"
import { ref as dbRef, onValue, update } from "firebase/database"
import { db } from "../services/firebase"

interface Booking {
  id: string
  tableNumber: string | number
  guests: number
  bookingType: string
  time: string
  customerName?: string
  status: "not-sat" | "sat" | "starter" | "mains" | "dessert" | "paid"
  notes?: string
  phone?: string
  email?: string
}

type TableStatus = "not-sat" | "sat" | "starter" | "mains" | "dessert" | "paid"

const TableTracking: React.FC = () => {
  const theme = useTheme()
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<Set<string>>(new Set())

  // Multi-select states
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set())
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<TableStatus>("sat")

  // Filtering States
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterBookingType, setFilterBookingType] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")

  // Grouping state
  const [groupByHour, setGroupByHour] = useState<boolean>(false)

  // Add mobile detection using useMediaQuery
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  // Status progression order
  const statusOrder: TableStatus[] = useMemo(() => ["not-sat", "sat", "starter", "mains", "dessert", "paid"], [])

  const formatDisplayDate = useCallback((dateStr: string) => {
    try {
      const date = new Date(dateStr + "T00:00:00")
      return date.toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateStr
    }
  }, [])

  const changeDateByDays = useCallback((dateStr: string, days: number): string => {
    const date = new Date(dateStr + "T00:00:00")
    date.setDate(date.getDate() + days)
    return date.toISOString().split("T")[0]
  }, [])

  const navigateDate = useCallback(
    (direction: "prev" | "next" | "today") => {
      if (direction === "prev") {
        setSelectedDate((prev) => changeDateByDays(prev, -1))
      } else if (direction === "next") {
        setSelectedDate((prev) => changeDateByDays(prev, 1))
      } else {
        setSelectedDate(new Date().toISOString().split("T")[0])
      }
    },
    [changeDateByDays],
  )

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
  }, [])

  // Function to check if a value is a valid table number (not ending with PM)
  const isValidTableNumber = useCallback((value: any): boolean => {
    if (!value) return false
    const str = value.toString().trim().toUpperCase()
    if (str.endsWith("PM") || str.endsWith("AM")) return false
    return /\d/.test(str)
  }, [])

  // Function to cycle status to next in order
  const cycleStatus = useCallback(
    async (booking: Booking) => {
      const currentIndex = statusOrder.indexOf(booking.status)
      const nextIndex = (currentIndex + 1) % statusOrder.length
      const nextStatus = statusOrder[nextIndex]
      await handleStatusChange(booking, nextStatus)
    },
    [statusOrder],
  )

  useEffect(() => {
    setLoading(true)

    const runsheetRef = dbRef(db, `RunsheetsAndPreorders/${selectedDate}`)
    const unsubscribeRunsheet = onValue(runsheetRef, (snapshot) => {
      const data = snapshot.val()
      const bookingList: Booking[] = []

      if (data && data.bookings) {
        Object.entries(data.bookings).forEach(([id, booking]: [string, any]) => {
          const tableNum =
            booking.tableNumber || booking.table || booking.Table || booking["Table Number"] || booking.tableNo || ""
          const guestCount = booking.guests || booking.pax || booking.Pax || booking.covers || booking.Covers || 0
          const bookingTime = booking.time || booking.Time || ""
          const customerName = booking.customerName || booking.name || booking.Name || booking["Customer Name"] || ""
          const bookingType = booking.bookingType || booking.type || booking.Type || "Standard"

          if (tableNum && isValidTableNumber(tableNum)) {
            bookingList.push({
              id,
              tableNumber: tableNum,
              guests: Number.parseInt(guestCount.toString()) || 0,
              bookingType: bookingType,
              time: bookingTime,
              customerName: customerName,
              status: (booking.tableStatus as TableStatus) || "not-sat",
              notes: booking.notes || booking.Notes || "",
              phone: booking.phone || booking.Phone || "",
              email: booking.email || booking.Email || "",
            })
          }
        })
      }

      setBookings(bookingList)
      setLoading(false)
    })

    return () => {
      unsubscribeRunsheet()
    }
  }, [selectedDate, isValidTableNumber])

  // Memoized filtered bookings
  const filteredBookings = useMemo(() => {
    let filtered = [...bookings]

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((booking) => booking.status === filterStatus)
    }

    // Apply booking type filter
    if (filterBookingType !== "all") {
      filtered = filtered.filter((booking) => booking.bookingType === filterBookingType)
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.tableNumber.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.time.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    return filtered
  }, [bookings, filterStatus, filterBookingType, searchTerm])

  const handleStatusChange = useCallback(
    async (booking: Booking, newStatus: TableStatus) => {
      setUpdating((prev) => new Set(prev).add(booking.id))

      try {
        const bookingRef = dbRef(db, `RunsheetsAndPreorders/${selectedDate}/bookings/${booking.id}`)
        await update(bookingRef, {
          tableStatus: newStatus,
          statusUpdatedAt: new Date().toISOString(),
        })
      } catch (error) {
        console.error("Error updating table status:", error)
      } finally {
        setUpdating((prev) => {
          const newSet = new Set(prev)
          newSet.delete(booking.id)
          return newSet
        })
      }
    },
    [selectedDate],
  )

  // Multi-select functions
  const handleSelectBooking = useCallback((bookingId: string) => {
    setSelectedBookings((prev) => {
      const newSelected = new Set(prev)
      if (newSelected.has(bookingId)) {
        newSelected.delete(bookingId)
      } else {
        newSelected.add(bookingId)
      }
      return newSelected
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedBookings.size === filteredBookings.length) {
      setSelectedBookings(new Set())
    } else {
      setSelectedBookings(new Set(filteredBookings.map((b) => b.id)))
    }
  }, [selectedBookings.size, filteredBookings])

  const handleBulkStatusUpdate = useCallback(async () => {
    try {
      const updates: Promise<void>[] = []

      selectedBookings.forEach((bookingId) => {
        const bookingRef = dbRef(db, `RunsheetsAndPreorders/${selectedDate}/bookings/${bookingId}`)
        updates.push(
          update(bookingRef, {
            tableStatus: bulkStatus,
            statusUpdatedAt: new Date().toISOString(),
          }),
        )
      })

      await Promise.all(updates)
      setSelectedBookings(new Set())
      setBulkUpdateOpen(false)
    } catch (error) {
      console.error("Error updating table statuses:", error)
    }
  }, [selectedBookings, selectedDate, bulkStatus])

  const clearAllFilters = useCallback(() => {
    setFilterStatus("all")
    setFilterBookingType("all")
    setSearchTerm("")
  }, [])

  // Memoized group bookings by time or hour
  const timeGroups = useMemo(() => {
    const groups: { [timeGroup: string]: Booking[] } = {}

    filteredBookings.forEach((booking) => {
      let timeKey = booking.time

      if (groupByHour) {
        // Group by hour (e.g., "18:00", "19:00")
        const hour = booking.time.split(":")[0]
        timeKey = `${hour}:00`
      }

      if (!groups[timeKey]) {
        groups[timeKey] = []
      }
      groups[timeKey].push(booking)
    })

    // Sort groups by time
    return Object.keys(groups)
      .sort((a, b) => {
        const timeA = a.replace(":", "")
        const timeB = b.replace(":", "")
        return timeA.localeCompare(timeB)
      })
      .map((time) => ({
        time,
        bookings: groups[time].sort((a, b) =>
          a.tableNumber.toString().localeCompare(b.tableNumber.toString(), undefined, { numeric: true }),
        ),
      }))
  }, [filteredBookings, groupByHour])

  // Get unique values for filter dropdowns
  const uniqueBookingTypes = useMemo(() => [...new Set(bookings.map((b) => b.bookingType))], [bookings])

  // Fixed color functions to return proper Material-UI palette colors
  const getStatusColor = useCallback(
    (status: TableStatus): "primary" | "secondary" | "info" | "success" | "warning" | "error" => {
      switch (status) {
        case "not-sat":
          return "info"
        case "sat":
          return "primary"
        case "starter":
          return "warning"
        case "mains":
          return "secondary"
        case "dessert":
          return "error"
        case "paid":
          return "success"
        default:
          return "info"
      }
    },
    [],
  )

  const getStatusIcon = useCallback((status: TableStatus) => {
    switch (status) {
      case "not-sat":
        return <TableRestaurant sx={{ fontSize: { xs: 12, md: 16 } }} />
      case "sat":
        return <Group sx={{ fontSize: { xs: 12, md: 16 } }} />
      case "starter":
        return <Restaurant sx={{ fontSize: { xs: 12, md: 16 } }} />
      case "mains":
        return <LocalDining sx={{ fontSize: { xs: 12, md: 16 } }} />
      case "dessert":
        return <Cake sx={{ fontSize: { xs: 12, md: 16 } }} />
      case "paid":
        return <Payment sx={{ fontSize: { xs: 12, md: 16 } }} />
      default:
        return <TableRestaurant sx={{ fontSize: { xs: 12, md: 16 } }} />
    }
  }, [])

  const getBookingTypeColor = useCallback(
    (type: string): "primary" | "secondary" | "info" | "success" | "warning" | "error" => {
      switch (type.toLowerCase()) {
        case "vip":
          return "error"
        case "special":
          return "warning"
        case "group":
          return "info"
        case "large party":
          return "secondary"
        default:
          return "primary"
      }
    },
    [],
  )

  // Calculate status counts
  const statusCounts = useMemo(
    () => ({
      total: filteredBookings.length,
      "not-sat": filteredBookings.filter((b) => b.status === "not-sat").length,
      sat: filteredBookings.filter((b) => b.status === "sat").length,
      starter: filteredBookings.filter((b) => b.status === "starter").length,
      mains: filteredBookings.filter((b) => b.status === "mains").length,
      dessert: filteredBookings.filter((b) => b.status === "dessert").length,
      paid: filteredBookings.filter((b) => b.status === "paid").length,
    }),
    [filteredBookings],
  )

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, textAlign: "center", mb: 2 }}>
        <Restaurant sx={{ fontSize: { xs: 36, md: 48 }, color: theme.palette.primary.main, mb: 1 }} />
        <Typography
          variant="h4"
          fontWeight={700}
          color="primary"
          gutterBottom
          sx={{ fontSize: { xs: "1.5rem", md: "2.125rem" } }}
        >
          Table Tracking
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: "0.875rem", md: "1rem" } }}>
          Track table service progress throughout the evening
        </Typography>
      </Box>

      {/* Sticky Multi-select Controls - Only when tables are selected */}
      {selectedBookings.size > 0 && (
        <Box
          sx={{
            position: "fixed",
            top: { xs: 56, sm: 64 },
            left: 0,
            right: 0,
            zIndex: 1200,
            bgcolor: "background.default",
            borderBottom: 1,
            borderColor: "divider",
            boxShadow: 2,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, md: 2 },
              bgcolor: theme.palette.primary.main + "10",
              mx: { xs: 1, sm: 2, md: 3 },
              borderRadius: 0,
              borderBottom: `2px solid ${theme.palette.primary.main}`,
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" spacing={2}>
              <Typography variant="h6" color="primary" sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}>
                {selectedBookings.size} table{selectedBookings.size !== 1 ? "s" : ""} selected
              </Typography>
              <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
                <Button
                  variant="contained"
                  startIcon={<Update />}
                  onClick={() => setBulkUpdateOpen(true)}
                  size="small"
                  fullWidth={isMobile}
                >
                  Update Status
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setSelectedBookings(new Set())}
                  size="small"
                  fullWidth={isMobile}
                >
                  Clear Selection
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      )}

      {/* Add padding to content when sticky menu is active */}
      <Box sx={{ pt: selectedBookings.size > 0 ? { xs: 12, md: 14 } : 0 }}>
        {/* Regular Controls */}
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <Stack spacing={2}>
            {/* Date Navigator */}
            <Paper elevation={2} sx={{ p: { xs: 1.5, md: 2 } }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, order: { xs: 2, sm: 1 } }}>
                  <IconButton onClick={() => navigateDate("prev")} color="primary" size="small">
                    <ChevronLeft />
                  </IconButton>
                  <IconButton onClick={() => navigateDate("today")} color="primary" title="Today" size="small">
                    <Today />
                  </IconButton>
                  <IconButton onClick={() => navigateDate("next")} color="primary" size="small">
                    <ChevronRight />
                  </IconButton>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: { xs: 1, md: 2 },
                    flex: 1,
                    justifyContent: "center",
                    order: { xs: 1, sm: 2 },
                    flexDirection: { xs: "column", sm: "row" },
                  }}
                >
                  <TextField
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    size="small"
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                  />
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}>
                      {formatDisplayDate(selectedDate)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}
                    >
                      {bookings.length} total bookings
                    </Typography>
                  </Box>
                </Box>

                {/* Time Grouping Toggle */}
                <Box sx={{ order: { xs: 3, sm: 3 } }}>
                  <ToggleButtonGroup
                    value={groupByHour ? "hour" : "time"}
                    exclusive
                    onChange={(_, value) => setGroupByHour(value === "hour")}
                    size="small"
                  >
                    <ToggleButton value="time" aria-label="group by exact time">
                      <ViewList />
                    </ToggleButton>
                    <ToggleButton value="hour" aria-label="group by hour">
                      <ViewModule />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Stack>
            </Paper>

            {/* Filters */}
            <Paper elevation={2} sx={{ p: { xs: 1.5, md: 2 } }}>
              <Stack spacing={2}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
                  <FilterList color="primary" />
                  <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}>
                    Filters
                  </Typography>
                  <Box
                    sx={{
                      ml: "auto",
                      display: "flex",
                      gap: 1,
                      flexDirection: { xs: "column", sm: "row" },
                      width: { xs: "100%", sm: "auto" },
                    }}
                  >
                    <Button
                      size="small"
                      startIcon={
                        selectedBookings.size === filteredBookings.length ? <CheckBoxOutlineBlank /> : <CheckBox />
                      }
                      onClick={handleSelectAll}
                      fullWidth={isMobile}
                    >
                      {selectedBookings.size === filteredBookings.length ? "Deselect All" : "Select All"}
                    </Button>
                    <Button size="small" startIcon={<Clear />} onClick={clearAllFilters} fullWidth={isMobile}>
                      Clear Filters
                    </Button>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Table, customer, time..."
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} label="Status">
                        <MenuItem value="all">All Statuses</MenuItem>
                        <MenuItem value="not-sat">Not Sat</MenuItem>
                        <MenuItem value="sat">Sat</MenuItem>
                        <MenuItem value="starter">Starter</MenuItem>
                        <MenuItem value="mains">Mains</MenuItem>
                        <MenuItem value="dessert">Dessert</MenuItem>
                        <MenuItem value="paid">Paid</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Booking Type</InputLabel>
                      <Select
                        value={filterBookingType}
                        onChange={(e) => setFilterBookingType(e.target.value)}
                        label="Booking Type"
                      >
                        <MenuItem value="all">All Types</MenuItem>
                        {uniqueBookingTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}>
                  Showing {filteredBookings.length} of {bookings.length} bookings
                  {groupByHour ? " (grouped by hour)" : " (grouped by exact time)"}
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </Box>

        {/* Content Area */}
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <Stack spacing={{ xs: 2, md: 3 }}>
            {/* Status Summary Cards */}
            <Grid container spacing={1}>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ bgcolor: theme.palette.info.main + "15" }}>
                  <CardContent sx={{ textAlign: "center", py: { xs: 1, md: 1.5 } }}>
                    <TableRestaurant sx={{ fontSize: { xs: 16, md: 20 }, color: theme.palette.info.main, mb: 0.5 }} />
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="info.main"
                      sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}
                    >
                      {statusCounts.total}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.65rem", md: "0.75rem" } }}
                    >
                      Total
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ bgcolor: theme.palette.info.main + "15" }}>
                  <CardContent sx={{ textAlign: "center", py: { xs: 1, md: 1.5 } }}>
                    <TableRestaurant sx={{ fontSize: { xs: 16, md: 20 }, color: theme.palette.info.main, mb: 0.5 }} />
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="info.main"
                      sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}
                    >
                      {statusCounts["not-sat"]}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.65rem", md: "0.75rem" } }}
                    >
                      Not Sat
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ bgcolor: theme.palette.primary.main + "15" }}>
                  <CardContent sx={{ textAlign: "center", py: { xs: 1, md: 1.5 } }}>
                    <Group sx={{ fontSize: { xs: 16, md: 20 }, color: theme.palette.primary.main, mb: 0.5 }} />
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="primary.main"
                      sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}
                    >
                      {statusCounts.sat}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.65rem", md: "0.75rem" } }}
                    >
                      Sat
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ bgcolor: theme.palette.warning.main + "15" }}>
                  <CardContent sx={{ textAlign: "center", py: { xs: 1, md: 1.5 } }}>
                    <Restaurant sx={{ fontSize: { xs: 16, md: 20 }, color: theme.palette.warning.main, mb: 0.5 }} />
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="warning.main"
                      sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}
                    >
                      {statusCounts.starter}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.65rem", md: "0.75rem" } }}
                    >
                      Starter
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ bgcolor: theme.palette.secondary.main + "15" }}>
                  <CardContent sx={{ textAlign: "center", py: { xs: 1, md: 1.5 } }}>
                    <LocalDining sx={{ fontSize: { xs: 16, md: 20 }, color: theme.palette.secondary.main, mb: 0.5 }} />
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="secondary.main"
                      sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}
                    >
                      {statusCounts.mains}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.65rem", md: "0.75rem" } }}
                    >
                      Mains
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ bgcolor: theme.palette.success.main + "15" }}>
                  <CardContent sx={{ textAlign: "center", py: { xs: 1, md: 1.5 } }}>
                    <Payment sx={{ fontSize: { xs: 16, md: 20 }, color: theme.palette.success.main, mb: 0.5 }} />
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="success.main"
                      sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}
                    >
                      {statusCounts.paid}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.65rem", md: "0.75rem" } }}
                    >
                      Paid
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {loading ? (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Loading bookings...</Typography>
              </Paper>
            ) : filteredBookings.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Restaurant sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  {bookings.length === 0
                    ? `No bookings found for ${formatDisplayDate(selectedDate)}`
                    : "No bookings match your current filters"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {bookings.length === 0
                    ? "Try selecting a different date or check the runsheet data."
                    : "Try adjusting your filters or search terms."}
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={2}>
                {timeGroups.map((group) => (
                  <Accordion key={group.time} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%", flexWrap: "wrap" }}>
                        <Schedule color="primary" />
                        <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}>
                          {group.time} {groupByHour && "(Hour Slot)"}
                        </Typography>
                        <Chip label={`${group.bookings.length} tables`} size="small" color="primary" />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: { xs: 1, md: 2 } }}>
                      <Grid container spacing={1}>
                        {group.bookings.map((booking) => (
                          <Grid item xs={6} sm={6} md={4} lg={3} xl={2} key={booking.id}>
                            <Card
                              elevation={2}
                              sx={{
                                border: `2px solid ${theme.palette[getStatusColor(booking.status)].main}`,
                                bgcolor: selectedBookings.has(booking.id)
                                  ? theme.palette.primary.main + "10"
                                  : "background.paper",
                                "&:hover": {
                                  boxShadow: theme.shadows[4],
                                },
                                width: "100%",
                                maxWidth: "100%",
                                minHeight: { xs: 120, md: 140 },
                                position: "relative",
                              }}
                            >
                              {updating.has(booking.id) && (
                                <Backdrop
                                  sx={{
                                    position: "absolute",
                                    zIndex: 1,
                                    bgcolor: "rgba(255, 255, 255, 0.7)",
                                    borderRadius: 1,
                                  }}
                                  open={true}
                                >
                                  <CircularProgress size={20} />
                                </Backdrop>
                              )}
                              <CardContent sx={{ p: { xs: 0.75, md: 1.5 } }}>
                                <Stack spacing={0.5}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      flexWrap: "wrap",
                                      gap: 0.5,
                                    }}
                                  >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                      <Checkbox
                                        checked={selectedBookings.has(booking.id)}
                                        onChange={() => handleSelectBooking(booking.id)}
                                        size="small"
                                        sx={{ p: 0.25 }}
                                      />
                                      <Typography
                                        variant="subtitle2"
                                        fontWeight={700}
                                        sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}
                                      >
                                        T{booking.tableNumber}
                                      </Typography>
                                    </Box>
                                    <Chip
                                      label={booking.bookingType}
                                      color={getBookingTypeColor(booking.bookingType)}
                                      size="small"
                                      sx={{ fontSize: { xs: "0.55rem", md: "0.6rem" }, height: { xs: 16, md: 18 } }}
                                    />
                                  </Box>

                                  <Stack direction="row" spacing={1} sx={{ fontSize: { xs: "0.65rem", md: "0.7rem" } }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                                      <Group sx={{ fontSize: { xs: 10, md: 12 } }} color="action" />
                                      <Typography variant="caption" sx={{ fontSize: { xs: "0.65rem", md: "0.7rem" } }}>
                                        {booking.guests}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                                      <Schedule sx={{ fontSize: { xs: 10, md: 12 } }} color="action" />
                                      <Typography variant="caption" sx={{ fontSize: { xs: "0.65rem", md: "0.7rem" } }}>
                                        {booking.time}
                                      </Typography>
                                    </Box>
                                  </Stack>

                                  {booking.customerName && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      fontWeight={500}
                                      noWrap
                                      sx={{ fontSize: { xs: "0.65rem", md: "0.7rem" } }}
                                    >
                                      {booking.customerName}
                                    </Typography>
                                  )}

                                  {/* Clickable Status Chip */}
                                  <Chip
                                    icon={getStatusIcon(booking.status)}
                                    label={booking.status.replace("-", " ").toUpperCase()}
                                    color={getStatusColor(booking.status)}
                                    size="small"
                                    onClick={() => cycleStatus(booking)}
                                    disabled={updating.has(booking.id)}
                                    sx={{
                                      fontSize: { xs: "0.55rem", md: "0.6rem" },
                                      height: { xs: 18, md: 20 },
                                      cursor: "pointer",
                                      "&:hover": {
                                        opacity: 0.8,
                                      },
                                    }}
                                  />
                                </Stack>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Stack>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Bulk Update Dialog */}
      <Dialog
        open={bulkUpdateOpen}
        onClose={() => setBulkUpdateOpen(false)}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" } }}>
          Update Status for {selectedBookings.size} Tables
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will update the status for all selected tables.
          </Alert>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as TableStatus)}
              label="New Status"
            >
              <MenuItem value="not-sat">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TableRestaurant sx={{ fontSize: 16 }} />
                  Not Sat
                </Box>
              </MenuItem>
              <MenuItem value="sat">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Group sx={{ fontSize: 16 }} />
                  Sat
                </Box>
              </MenuItem>
              <MenuItem value="starter">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Restaurant sx={{ fontSize: 16 }} />
                  Starter
                </Box>
              </MenuItem>
              <MenuItem value="mains">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <LocalDining sx={{ fontSize: 16 }} />
                  Mains
                </Box>
              </MenuItem>
              <MenuItem value="dessert">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Cake sx={{ fontSize: 16 }} />
                  Dessert
                </Box>
              </MenuItem>
              <MenuItem value="paid">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Payment sx={{ fontSize: 16 }} />
                  Paid
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, md: 1 } }}>
          <Button onClick={() => setBulkUpdateOpen(false)} fullWidth={isMobile}>
            Cancel
          </Button>
          <Button onClick={handleBulkStatusUpdate} variant="contained" fullWidth={isMobile}>
            Update {selectedBookings.size} Tables
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TableTracking
