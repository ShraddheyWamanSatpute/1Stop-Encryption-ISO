"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
  Avatar,
  IconButton,
  TextField,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  useMediaQuery,
} from "@mui/material"
import {
  Person,
  Group,
  Assignment,
  CheckCircle,
  Schedule,
  ChevronLeft,
  ChevronRight,
  Today,
  FilterList,
  Clear,
  ExpandMore,
  CheckBox,
  CheckBoxOutlineBlank,
  Update,
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
  assignedWaiter?: string
  status: "unassigned" | "assigned"
  notes?: string
  phone?: string
  email?: string
}

interface Staff {
  id: string
  firstName: string
  lastName: string
  role: string
  department: string
  fullName: string
}

interface WaiterStats {
  waiterId: string
  waiterName: string
  totalGuests: number
  timeBreakdown: { [time: string]: number }
  typeBreakdown: { [type: string]: number }
  tableCount: number
}

type SortOption = "table" | "time" | "guests" | "type" | "customer"
type SortDirection = "asc" | "desc"

const AssignTables: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  // Multi-select states
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set())
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false)
  const [bulkWaiter, setBulkWaiter] = useState<Staff | null>(null)

  // Filtering and Sorting States
  const [sortBy, setSortBy] = useState<SortOption>("table")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [filterStatus, setFilterStatus] = useState<"all" | "assigned" | "unassigned">("all")
  const [filterBookingType, setFilterBookingType] = useState<string>("all")
  const [filterWaiter, setFilterWaiter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")

  // Add hourly grouping functionality to the Assign Tables page by:
  const [groupByHour, setGroupByHour] = useState<boolean>(false)

  const formatDisplayDate = (dateStr: string) => {
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
  }

  const changeDateByDays = (dateStr: string, days: number): string => {
    const date = new Date(dateStr + "T00:00:00")
    date.setDate(date.getDate() + days)
    return date.toISOString().split("T")[0]
  }

  const navigateDate = (direction: "prev" | "next" | "today") => {
    if (direction === "prev") {
      setSelectedDate(changeDateByDays(selectedDate, -1))
    } else if (direction === "next") {
      setSelectedDate(changeDateByDays(selectedDate, 1))
    } else {
      setSelectedDate(new Date().toISOString().split("T")[0])
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
  }

  // Function to check if a value is a valid table number (not ending with PM)
  const isValidTableNumber = (value: any): boolean => {
    if (!value) return false
    const str = value.toString().trim().toUpperCase()
    if (str.endsWith("PM") || str.endsWith("AM")) return false
    return /\d/.test(str)
  }

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
              assignedWaiter: booking.assignedWaiter || "",
              status: booking.assignedWaiter ? "assigned" : "unassigned",
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

    const staffRef = dbRef(db, "users")
    const unsubscribeStaff = onValue(staffRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const staffList = Object.entries(data)
          .map(([id, user]: [string, any]) => ({
            id,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            role: user.role || "",
            department: user.department || "",
            fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          }))
          .filter(
            (user) =>
              user.role === "Waiter" || user.role === "Server" || user.role === "Floor Staff" || user.role === "Staff",
          )
        setStaff(staffList)
      }
    })

    return () => {
      unsubscribeRunsheet()
      unsubscribeStaff()
    }
  }, [selectedDate])

  // Apply filtering and sorting
  useEffect(() => {
    let filtered = [...bookings]

    if (filterStatus !== "all") {
      filtered = filtered.filter((booking) => booking.status === filterStatus)
    }

    if (filterBookingType !== "all") {
      filtered = filtered.filter((booking) => booking.bookingType === filterBookingType)
    }

    if (filterWaiter !== "all") {
      filtered = filtered.filter((booking) => booking.assignedWaiter === filterWaiter)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.tableNumber.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.time.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case "table":
          aValue = a.tableNumber.toString()
          bValue = b.tableNumber.toString()
          break
        case "time":
          aValue = a.time.replace(":", "")
          bValue = b.time.replace(":", "")
          break
        case "guests":
          aValue = a.guests
          bValue = b.guests
          break
        case "type":
          aValue = a.bookingType
          bValue = b.bookingType
          break
        case "customer":
          aValue = a.customerName || ""
          bValue = b.customerName || ""
          break
        default:
          aValue = a.tableNumber.toString()
          bValue = b.tableNumber.toString()
      }

      if (typeof aValue === "string") {
        const comparison = aValue.localeCompare(bValue, undefined, { numeric: true })
        return sortDirection === "asc" ? comparison : -comparison
      } else {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }
    })

    setFilteredBookings(filtered)
  }, [bookings, filterStatus, filterBookingType, filterWaiter, searchTerm, sortBy, sortDirection])

  const handleWaiterChange = async (booking: Booking, newWaiter: Staff | null) => {
    try {
      const bookingRef = dbRef(db, `RunsheetsAndPreorders/${selectedDate}/bookings/${booking.id}`)

      await update(bookingRef, {
        assignedWaiter: newWaiter ? newWaiter.id : "",
        assignedAt: newWaiter ? new Date().toISOString() : "",
      })
    } catch (error) {
      console.error("Error updating waiter assignment:", error)
    }
  }

  // Multi-select functions
  const handleSelectBooking = (bookingId: string) => {
    const newSelected = new Set(selectedBookings)
    if (newSelected.has(bookingId)) {
      newSelected.delete(bookingId)
    } else {
      newSelected.add(bookingId)
    }
    setSelectedBookings(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedBookings.size === filteredBookings.length) {
      setSelectedBookings(new Set())
    } else {
      setSelectedBookings(new Set(filteredBookings.map((b) => b.id)))
    }
  }

  const handleBulkAssign = async () => {
    try {
      const updates: Promise<void>[] = []

      selectedBookings.forEach((bookingId) => {
        const bookingRef = dbRef(db, `RunsheetsAndPreorders/${selectedDate}/bookings/${bookingId}`)
        updates.push(
          update(bookingRef, {
            assignedWaiter: bulkWaiter ? bulkWaiter.id : "",
            assignedAt: bulkWaiter ? new Date().toISOString() : "",
          }),
        )
      })

      await Promise.all(updates)
      setSelectedBookings(new Set())
      setBulkAssignOpen(false)
      setBulkWaiter(null)
    } catch (error) {
      console.error("Error updating waiter assignments:", error)
    }
  }

  const getWaiterName = (waiterId: string) => {
    const waiter = staff.find((s) => s.id === waiterId)
    return waiter ? waiter.fullName : "Unknown"
  }

  const getAssignedWaiter = (waiterId: string) => {
    return staff.find((s) => s.id === waiterId) || null
  }

  const clearAllFilters = () => {
    setFilterStatus("all")
    setFilterBookingType("all")
    setFilterWaiter("all")
    setSearchTerm("")
    setSortBy("table")
    setSortDirection("asc")
  }

  // Group bookings by hour
  const groupBookingsByHour = (bookings: Booking[]) => {
    const groups: { [hour: string]: Booking[] } = {}

    bookings.forEach((booking) => {
      const time = booking.time
      const hour = time.split(":")[0] + ":00"

      if (!groups[hour]) {
        groups[hour] = []
      }
      groups[hour].push(booking)
    })

    const sortedGroups = Object.keys(groups)
      .sort((a, b) => {
        const hourA = Number.parseInt(a.split(":")[0])
        const hourB = Number.parseInt(b.split(":")[0])
        return hourA - hourB
      })
      .map((hour) => ({
        time: hour,
        bookings: groups[hour].sort((a, b) =>
          a.tableNumber.toString().localeCompare(b.tableNumber.toString(), undefined, { numeric: true }),
        ),
      }))

    return sortedGroups
  }

  // Group bookings by time
  const groupBookingsByTime = (bookings: Booking[]) => {
    const groups: { [timeGroup: string]: Booking[] } = {}

    bookings.forEach((booking) => {
      const time = booking.time
      if (!groups[time]) {
        groups[time] = []
      }
      groups[time].push(booking)
    })

    const sortedGroups = Object.keys(groups)
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

    return sortedGroups
  }

  const timeGroups = groupByHour ? groupBookingsByHour(filteredBookings) : groupBookingsByTime(filteredBookings)

  // Calculate waiter statistics
  const getWaiterStats = (): WaiterStats[] => {
    const assignedBookings = bookings.filter((b) => b.assignedWaiter)
    const statsMap = new Map<string, WaiterStats>()

    assignedBookings.forEach((booking) => {
      const waiterId = booking.assignedWaiter!
      const waiterName = getWaiterName(waiterId)

      if (!statsMap.has(waiterId)) {
        statsMap.set(waiterId, {
          waiterId,
          waiterName,
          totalGuests: 0,
          timeBreakdown: {},
          typeBreakdown: {},
          tableCount: 0,
        })
      }

      const stats = statsMap.get(waiterId)!
      stats.totalGuests += booking.guests
      stats.tableCount += 1

      if (stats.timeBreakdown[booking.time]) {
        stats.timeBreakdown[booking.time] += booking.guests
      } else {
        stats.timeBreakdown[booking.time] = booking.guests
      }

      if (stats.typeBreakdown[booking.bookingType]) {
        stats.typeBreakdown[booking.bookingType] += booking.guests
      } else {
        stats.typeBreakdown[booking.bookingType] = booking.guests
      }
    })

    return Array.from(statsMap.values()).sort((a, b) => b.totalGuests - a.totalGuests)
  }

  const unassignedBookings = filteredBookings.filter((b) => b.status === "unassigned")
  const assignedBookings = filteredBookings.filter((b) => b.status === "assigned")
  const waiterStats = getWaiterStats()

  const uniqueBookingTypes = [...new Set(bookings.map((b) => b.bookingType))]
  const assignedWaiters = [...new Set(bookings.filter((b) => b.assignedWaiter).map((b) => b.assignedWaiter!))]

  const getBookingTypeColor = (type: string) => {
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
        return "default"
    }
  }

  return (
    <Box sx={{ p: 3, position: "relative", maxWidth: "100vw", overflow: "hidden" }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Assignment sx={{ fontSize: isMobile ? 36 : 48, color: theme.palette.primary.main, mb: 1 }} />
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700} color="primary" gutterBottom>
            Table Assignments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Assign waiters to tables based on bookings
          </Typography>
        </Box>

        {/* Date Navigator */}
        <Paper elevation={2} sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <IconButton onClick={() => navigateDate("prev")} color="primary">
              <ChevronLeft />
            </IconButton>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "center" }}>
              <TextField
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                size="small"
                sx={{ width: "auto" }}
              />
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h6" fontWeight={600}>
                  {formatDisplayDate(selectedDate)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {bookings.length} total bookings
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1}>
              <IconButton onClick={() => navigateDate("today")} color="primary" title="Today">
                <Today />
              </IconButton>
              <IconButton onClick={() => navigateDate("next")} color="primary">
                <ChevronRight />
              </IconButton>
            </Stack>
          </Stack>
        </Paper>

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
                    onClick={() => setBulkAssignOpen(true)}
                    size="small"
                    fullWidth={isMobile}
                  >
                    Assign Waiter
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
          {/* Filters and Sorting */}
          <Paper elevation={2} sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <FilterList color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Filters & Sorting
                </Typography>
                <Box sx={{ ml: "auto" }}>
                  <Button
                    size="small"
                    startIcon={
                      selectedBookings.size === filteredBookings.length ? <CheckBoxOutlineBlank /> : <CheckBox />
                    }
                    onClick={handleSelectAll}
                    sx={{ mr: 2 }}
                  >
                    {selectedBookings.size === filteredBookings.length ? "Deselect All" : "Select All"}
                  </Button>
                  <Button size="small" startIcon={<Clear />} onClick={clearAllFilters}>
                    Clear Filters
                  </Button>
                  <Button
                    size="small"
                    startIcon={groupByHour ? <Schedule /> : <Assignment />}
                    onClick={() => setGroupByHour(!groupByHour)}
                    variant={groupByHour ? "contained" : "outlined"}
                    sx={{ ml: 1 }}
                  >
                    {groupByHour ? "Time Groups" : "Group by Hour"}
                  </Button>
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ maxWidth: "100%", overflow: "hidden" }}>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Table, customer, time..."
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      label="Status"
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="assigned">Assigned</MenuItem>
                      <MenuItem value="unassigned">Unassigned</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
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

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Waiter</InputLabel>
                    <Select value={filterWaiter} onChange={(e) => setFilterWaiter(e.target.value)} label="Waiter">
                      <MenuItem value="all">All Waiters</MenuItem>
                      {assignedWaiters.map((waiterId) => (
                        <MenuItem key={waiterId} value={waiterId}>
                          {getWaiterName(waiterId)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sort By</InputLabel>
                    <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} label="Sort By">
                      <MenuItem value="table">Table Number</MenuItem>
                      <MenuItem value="time">Time</MenuItem>
                      <MenuItem value="guests">Guest Count</MenuItem>
                      <MenuItem value="type">Booking Type</MenuItem>
                      <MenuItem value="customer">Customer Name</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Direction</InputLabel>
                    <Select
                      value={sortDirection}
                      onChange={(e) => setSortDirection(e.target.value as SortDirection)}
                      label="Direction"
                    >
                      <MenuItem value="asc">Ascending</MenuItem>
                      <MenuItem value="desc">Descending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Typography variant="body2" color="text.secondary">
                Showing {filteredBookings.length} of {bookings.length} bookings
              </Typography>
            </Stack>
          </Paper>

          {/* Summary Cards */}
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: theme.palette.info.main + "15" }}>
                <CardContent sx={{ textAlign: "center", py: 1.5 }}>
                  <Assignment sx={{ fontSize: 20, color: theme.palette.info.main, mb: 0.5 }} />
                  <Typography variant="h6" fontWeight={700} color="info.main">
                    {filteredBookings.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Showing
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: theme.palette.warning.main + "15" }}>
                <CardContent sx={{ textAlign: "center", py: 1.5 }}>
                  <Schedule sx={{ fontSize: 20, color: theme.palette.warning.main, mb: 0.5 }} />
                  <Typography variant="h6" fontWeight={700} color="warning.main">
                    {unassignedBookings.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Unassigned
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: theme.palette.success.main + "15" }}>
                <CardContent sx={{ textAlign: "center", py: 1.5 }}>
                  <CheckCircle sx={{ fontSize: 20, color: theme.palette.success.main, mb: 0.5 }} />
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    {assignedBookings.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Assigned
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: theme.palette.primary.main + "15" }}>
                <CardContent sx={{ textAlign: "center", py: 1.5 }}>
                  <Person sx={{ fontSize: 20, color: theme.palette.primary.main, mb: 0.5 }} />
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    {staff.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Waiters
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Waiter Statistics */}
          {waiterStats.length > 0 && (
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography
                variant="h6"
                fontWeight={600}
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Person color="primary" />
                Waiter Assignments Summary
              </Typography>
              <TableContainer sx={{ overflowX: "auto", maxWidth: "100%" }}>
                <Table size={isMobile ? "small" : "medium"}>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Waiter</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Tables</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Total Guests</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Time Breakdown</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Type Breakdown</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {waiterStats.map((stats) => (
                      <TableRow key={stats.waiterId}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar
                              sx={{
                                width: isMobile ? 20 : 24,
                                height: isMobile ? 20 : 24,
                                fontSize: isMobile ? "0.6rem" : "0.75rem",
                              }}
                            >
                              {stats.waiterName.charAt(0)}
                            </Avatar>
                            {stats.waiterName}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={stats.tableCount} size="small" color="primary" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={stats.totalGuests} size="small" color="success" />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {Object.entries(stats.timeBreakdown).map(([time, guests]) => (
                              <Chip key={time} label={`${time}: ${guests}`} size="small" variant="outlined" />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {Object.entries(stats.typeBreakdown).map(([type, guests]) => (
                              <Chip
                                key={type}
                                label={`${type}: ${guests}`}
                                size="small"
                                color={getBookingTypeColor(type)}
                                variant="outlined"
                              />
                            ))}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {loading ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography>Loading bookings...</Typography>
            </Paper>
          ) : filteredBookings.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Assignment sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                      <Schedule color="primary" />
                      <Typography variant="h6" fontWeight={600}>
                        {groupByHour ? `${group.time} Hour` : group.time}
                      </Typography>
                      <Chip label={`${group.bookings.length} tables`} size="small" color="primary" />
                      <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                        <Chip
                          label={`${group.bookings.filter((b) => b.status === "unassigned").length} unassigned`}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                        <Chip
                          label={`${group.bookings.filter((b) => b.status === "assigned").length} assigned`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: { xs: 1, md: 2 } }}>
                    <Grid container spacing={1}>
                      {group.bookings.map((booking) => (
                        <Grid item xs={6} sm={6} md={4} lg={3} xl={2} key={booking.id}>
                          <Card
                            elevation={2}
                            sx={{
                              border: `2px solid ${
                                booking.status === "assigned" ? theme.palette.success.main : theme.palette.warning.main
                              }`,
                              bgcolor: selectedBookings.has(booking.id)
                                ? theme.palette.primary.main + "10"
                                : "background.paper",
                              "&:hover": {
                                boxShadow: theme.shadows[4],
                              },
                              width: "100%",
                              maxWidth: "100%",
                              minHeight: { xs: 140, md: 160 },
                            }}
                          >
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
                                    sx={{
                                      fontSize: { xs: "0.55rem", md: "0.6rem" },
                                      height: { xs: 18, md: 20 },
                                    }}
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

                                {/* Assignment Status */}
                                {booking.status === "assigned" ? (
                                  <Chip
                                    icon={<CheckCircle sx={{ fontSize: { xs: 12, md: 14 } }} />}
                                    label={getWaiterName(booking.assignedWaiter || "")}
                                    color="success"
                                    size="small"
                                    sx={{
                                      fontSize: { xs: "0.55rem", md: "0.6rem" },
                                      height: { xs: 18, md: 20 },
                                    }}
                                  />
                                ) : (
                                  <Chip
                                    icon={<Schedule sx={{ fontSize: { xs: 12, md: 14 } }} />}
                                    label="Unassigned"
                                    color="warning"
                                    size="small"
                                    sx={{
                                      fontSize: { xs: "0.55rem", md: "0.6rem" },
                                      height: { xs: 18, md: 20 },
                                    }}
                                  />
                                )}

                                {/* Waiter Assignment Dropdown */}
                                <Autocomplete
                                  size="small"
                                  options={staff}
                                  getOptionLabel={(option) => option.fullName}
                                  value={getAssignedWaiter(booking.assignedWaiter || "")}
                                  onChange={(_, newValue) => handleWaiterChange(booking, newValue)}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label={booking.status === "assigned" ? "Reassign" : "Assign"}
                                      variant="outlined"
                                      sx={{
                                        "& .MuiInputLabel-root": { fontSize: { xs: "0.65rem", md: "0.75rem" } },
                                        "& .MuiInputBase-input": { fontSize: { xs: "0.65rem", md: "0.75rem" } },
                                      }}
                                    />
                                  )}
                                  renderOption={(props, option) => (
                                    <Box component="li" {...props}>
                                      <Avatar sx={{ width: 16, height: 16, mr: 1, fontSize: "0.65rem" }}>
                                        {option.firstName.charAt(0)}
                                      </Avatar>
                                      <Typography variant="caption" sx={{ fontSize: { xs: "0.65rem", md: "0.75rem" } }}>
                                        {option.fullName}
                                      </Typography>
                                    </Box>
                                  )}
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
        </Box>
      </Stack>
      {/* Bulk Assignment Dialog */}
      <Dialog open={bulkAssignOpen} onClose={() => setBulkAssignOpen(false)} fullScreen={isMobile}>
        <DialogTitle>Assign Waiter to {selectedBookings.size} Tables</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will assign the selected waiter to all selected tables.
          </Alert>
          <Autocomplete
            fullWidth
            options={staff}
            getOptionLabel={(option) => option.fullName}
            value={bulkWaiter}
            onChange={(_, newValue) => setBulkWaiter(newValue)}
            renderInput={(params) => <TextField {...params} label="Select Waiter" variant="outlined" sx={{ mt: 2 }} />}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: "0.75rem" }}>{option.firstName.charAt(0)}</Avatar>
                <Typography>{option.fullName}</Typography>
              </Box>
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkAssignOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkAssign} variant="contained" disabled={!bulkWaiter}>
            Assign to {selectedBookings.size} Tables
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AssignTables
