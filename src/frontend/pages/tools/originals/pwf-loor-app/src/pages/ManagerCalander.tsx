"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { getDatabase, ref, get, update } from "firebase/database"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay, addDays } from "date-fns"
import {
  Typography,
  CircularProgress,
  Modal,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  type SelectChangeEvent,
  Paper,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Badge,
  useTheme,
  alpha,
} from "@mui/material"
import { enUS } from "date-fns/locale"
import { Page, PageHeader } from "../styles/StyledComponents"
import RequestHoliday from "./RequestHoliday"
import ManagerView from "./ManagerView"
import {
  CalendarMonth,
  Add,
  ViewList,
  FilterList,
  Refresh,
  Person,
  Event,
  Check,
  Close,
  AccessTime,
  NavigateNext,
  Today as TodayIcon,
} from "@mui/icons-material"

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { "en-US": enUS } })

interface Holiday {
  id: string
  start: Date
  end: Date
  title: string
  role: string
  status: string
  userName: string
  reason: string
}

const ManagerCalendar: React.FC = () => {
  const theme = useTheme()
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [openViewAll, setOpenViewAll] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([
    "Manager",
    "Waiter",
    "Host",
    "Maintenance",
    "Bar Back",
    "Bartender",
    "Kitchen",
    "Food Runner",
  ])
  const [selectedEvent, setSelectedEvent] = useState<Holiday | null>(null)
  const [eventDialog, setEventDialog] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["Approved", "Pending", "Denied"])

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const handleOpenViewAll = () => setOpenViewAll(true)
  const handleCloseViewAll = () => setOpenViewAll(false)

  const handleRoleChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedRoles(Array.isArray(event.target.value) ? event.target.value : [event.target.value])
  }

  const handleStatusChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedStatuses(Array.isArray(event.target.value) ? event.target.value : [event.target.value])
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
    fetchHolidays()
  }

  const handlePreviousMonth = () => {
    setCurrentDate(addDays(currentDate, -30))
  }

  const handleNextMonth = () => {
    setCurrentDate(addDays(currentDate, 30))
  }

  const handleCurrentMonth = () => {
    setCurrentDate(new Date())
  }

  // Define role-color mapping with better colors
  const roleColors: { [key: string]: string } = {
    Manager: "#FF5722",
    Waiter: "#4CAF50",
    Host: "#2196F3",
    Maintenance: "#E91E63",
    "Bar Back": "#FF9800",
    Bartender: "#9C27B0",
    Kitchen: "#F44336",
    "Food Runner": "#8BC34A",
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "#4CAF50"
      case "denied":
        return "#F44336"
      case "pending":
        return "#FF9800"
      default:
        return "#9E9E9E"
    }
  }

  const getStatusIcon = (status: string): React.ReactElement | undefined => {
    switch (status.toLowerCase()) {
      case "approved":
        return <Check fontSize="small" />
      case "denied":
        return <Close fontSize="small" />
      case "pending":
        return <AccessTime fontSize="small" />
      default:
        return undefined
    }
  }

  // Update holiday status
  const updateHolidayStatus = async (id: string, status: string) => {
    try {
      const db = getDatabase()
      await update(ref(db, `holidays/${id}`), {
        status,
        reviewedBy: "Manager",
        reviewedAt: new Date().toISOString(),
      })

      setSuccess(`Holiday request ${status.toLowerCase()} successfully`)
      setTimeout(() => setSuccess(null), 3000)

      // Refresh holidays
      fetchHolidays()

      // Close dialog
      setEventDialog(false)
      setSelectedEvent(null)
    } catch (err) {
      setError("Failed to update holiday status")
      console.error(err)
    }
  }

  const fetchHolidays = useCallback(async () => {
    const db = getDatabase()
    const holidaysRef = ref(db, "holidays")

    try {
      const snapshot = await get(holidaysRef)
      if (snapshot.exists()) {
        const data = snapshot.val()
        const events: Holiday[] = Object.keys(data)
          .map((key) => {
            const holiday = data[key]
            return {
              id: key,
              start: new Date(holiday.startDate),
              end: new Date(holiday.endDate),
              title: `${holiday.userName} - ${holiday.role}`,
              role: holiday.role,
              status: holiday.status || "pending",
              userName: holiday.userName,
              reason: holiday.reason || "",
            }
          })
          // For managers, show all holidays but allow filtering
          .filter(
            (holiday) =>
              (selectedRoles.length === 0 || selectedRoles.includes(holiday.role)) &&
              (selectedStatuses.length === 0 || selectedStatuses.includes(holiday.status)),
          )

        setHolidays(events)
      } else {
        setHolidays([])
      }
    } catch (error) {
      console.error("Error fetching holidays:", error)
      setError("Failed to load holidays")
    } finally {
      setLoading(false)
    }
  }, [selectedRoles, selectedStatuses])

  useEffect(() => {
    fetchHolidays()
  }, [fetchHolidays, refreshKey])

  const handleEventClick = (event: Holiday) => {
    setSelectedEvent(event)
    setEventDialog(true)
  }

  const pendingCount = holidays.filter((h) => h.status.toLowerCase() === "pending").length
  const approvedCount = holidays.filter((h) => h.status.toLowerCase() === "approved").length
  const deniedCount = holidays.filter((h) => h.status.toLowerCase() === "denied").length

  const eventStyleGetter = (event: Holiday) => {
    const roleColor = roleColors[event.role] || "#000000"
    const statusColor = getStatusColor(event.status)

    return {
      style: {
        backgroundColor: alpha(roleColor, 0.8),
        borderLeft: `4px solid ${statusColor}`,
        color: "white",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: "600",
        padding: "1px 4px",
        border: "none",
        margin: "1px 0",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        position: "relative" as const,
        zIndex: 1,
      },
    }
  }

  return (
    <Page>
      <PageHeader>
        <Box display="flex" alignItems="center" gap={2}>
          <CalendarMonth sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Manager Calendar
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage staff holiday requests and schedules
            </Typography>
          </Box>
        </Box>
      </PageHeader>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ textAlign: "center", bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
            <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
              <Badge badgeContent={pendingCount} color="warning" showZero>
                <AccessTime sx={{ fontSize: { xs: 24, sm: 40 }, color: "warning.main" }} />
              </Badge>
              <Typography variant="h6" fontWeight="bold" sx={{ mt: 1, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                Pending
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                Awaiting Review
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ textAlign: "center", bgcolor: alpha(theme.palette.success.main, 0.1) }}>
            <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
              <Badge badgeContent={approvedCount} color="success" showZero>
                <Check sx={{ fontSize: { xs: 24, sm: 40 }, color: "success.main" }} />
              </Badge>
              <Typography variant="h6" fontWeight="bold" sx={{ mt: 1, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                Approved
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                Confirmed Holidays
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ textAlign: "center", bgcolor: alpha(theme.palette.error.main, 0.1) }}>
            <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
              <Badge badgeContent={deniedCount} color="error" showZero>
                <Close sx={{ fontSize: { xs: 24, sm: 40 }, color: "error.main" }} />
              </Badge>
              <Typography variant="h6" fontWeight="bold" sx={{ mt: 1, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                Denied
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                Rejected Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ textAlign: "center", bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
            <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
              <Badge badgeContent={holidays.length} color="primary" showZero>
                <Event sx={{ fontSize: { xs: 24, sm: 40 }, color: "primary.main" }} />
              </Badge>
              <Typography variant="h6" fontWeight="bold" sx={{ mt: 1, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                Total
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                All Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls */}
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography
            variant="h6"
            display="flex"
            alignItems="center"
            gap={1}
            sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
          >
            <FilterList />
            Calendar Controls
          </Typography>

          <Box display="flex" gap={1}>
            <Tooltip title="Refresh Calendar">
              <IconButton onClick={handleRefresh} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Filter by Role</InputLabel>
              <Select
                multiple
                value={selectedRoles}
                onChange={handleRoleChange}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        size="small"
                        sx={{
                          bgcolor: alpha(roleColors[value] || "#000", 0.1),
                          color: roleColors[value] || "#000",
                          fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        }}
                      />
                    ))}
                  </Box>
                )}
              >
                {["Manager", "Waiter", "Host", "Maintenance", "Bar Back", "Bartender", "Kitchen", "Food Runner"].map(
                  (role) => (
                    <MenuItem key={role} value={role}>
                      <Checkbox checked={selectedRoles.indexOf(role) > -1} />
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            bgcolor: roleColors[role],
                          }}
                        />
                        {role}
                      </Box>
                    </MenuItem>
                  ),
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                multiple
                value={selectedStatuses}
                onChange={handleStatusChange}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        size="small"
                        sx={{
                          bgcolor: alpha(getStatusColor(value), 0.1),
                          color: getStatusColor(value),
                          fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        }}
                      />
                    ))}
                  </Box>
                )}
              >
                {["Approved", "Pending", "Denied"].map((status) => (
                  <MenuItem key={status} value={status}>
                    <Checkbox checked={selectedStatuses.indexOf(status) > -1} />
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: getStatusColor(status),
                        }}
                      />
                      {status}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpen}
                fullWidth
                size={window.innerWidth < 600 ? "small" : "medium"}
              >
                Add Holiday
              </Button>
              <Button
                variant="outlined"
                startIcon={<ViewList />}
                onClick={handleOpenViewAll}
                fullWidth
                size={window.innerWidth < 600 ? "small" : "medium"}
              >
                View All
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Calendar Navigation */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Button
          startIcon={<NavigateNext sx={{ transform: "rotate(180deg)" }} />}
          onClick={handlePreviousMonth}
          variant="outlined"
          size={window.innerWidth < 600 ? "small" : "medium"}
        >
          Previous Month
        </Button>
        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
          {format(currentDate, "MMMM yyyy")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            sx={{ mr: 1 }}
            onClick={handleCurrentMonth}
            startIcon={<TodayIcon />}
            size={window.innerWidth < 600 ? "small" : "medium"}
          >
            Current Month
          </Button>
          <Button
            startIcon={<NavigateNext />}
            onClick={handleNextMonth}
            variant="outlined"
            size={window.innerWidth < 600 ? "small" : "medium"}
          >
            Next Month
          </Button>
        </Box>
      </Box>

      {/* Enhanced Calendar */}
      <Paper
        elevation={3}
        sx={{
          p: { xs: 1, sm: 3 },
          borderRadius: 2,
          minHeight: { xs: "500px", sm: "700px" },
          overflow: "auto",
          "& .rbc-calendar": {
            fontFamily: theme.typography.fontFamily,
          },
          "& .rbc-header": {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            fontWeight: "bold",
            padding: { xs: "8px 4px", sm: "12px 8px" },
            borderBottom: `2px solid ${theme.palette.primary.main}`,
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          },
          "& .rbc-today": {
            backgroundColor: alpha(theme.palette.secondary.main, 0.1),
          },
          "& .rbc-off-range-bg": {
            backgroundColor: alpha(theme.palette.grey[300], 0.3),
          },
          "& .rbc-event": {
            borderRadius: "4px",
            fontSize: { xs: "10px", sm: "11px" },
            fontWeight: "600",
            padding: { xs: "1px 2px", sm: "1px 4px" },
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
            margin: "1px 0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            position: "relative",
            zIndex: 1,
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: "0 4px 8px rgba(0,0,0,0.25)",
            },
          },
          "& .rbc-month-view": {
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            borderRadius: "8px",
            overflow: "hidden",
          },
          "& .rbc-date-cell": {
            padding: { xs: "4px", sm: "8px" },
            minHeight: { xs: "80px", sm: "120px" },
            position: "relative",
          },
          "& .rbc-day-bg": {
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          },
          "& .rbc-toolbar": {
            display: "none", // Hide default toolbar since we have custom navigation
          },
          "& .rbc-events-container": {
            position: "relative",
            zIndex: 1,
          },
          "& .rbc-event-content": {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={{ xs: "500px", sm: "700px" }}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          <Calendar
            localizer={localizer}
            events={holidays}
            startAccessor="start"
            endAccessor="end"
            onSelectEvent={handleEventClick}
            date={currentDate}
            onNavigate={setCurrentDate}
            style={{
              height: window.innerWidth < 600 ? "500px" : "700px",
              width: "100%",
            }}
            eventPropGetter={eventStyleGetter}
            components={{
              event: ({ event }) => (
                <Box sx={{ fontSize: { xs: "10px", sm: "11px" }, fontWeight: "medium", overflow: "hidden" }}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {getStatusIcon(event.status)}
                    <Typography
                      variant="caption"
                      sx={{
                        color: "inherit",
                        fontWeight: "bold",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: { xs: "9px", sm: "11px" },
                      }}
                    >
                      {event.userName}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "inherit",
                      opacity: 0.9,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: { xs: "8px", sm: "10px" },
                    }}
                  >
                    {event.role}
                  </Typography>
                </Box>
              ),
            }}
            views={["month"]}
            view="month"
          />
        )}
      </Paper>

      {/* Role Legend */}
      <Paper elevation={1} sx={{ p: 2, mt: 2, borderRadius: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
          Role Colors:
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {Object.entries(roleColors).map(([role, color]) => (
            <Chip
              key={role}
              label={role}
              size="small"
              sx={{
                bgcolor: alpha(color, 0.1),
                color: color,
                border: `1px solid ${alpha(color, 0.3)}`,
                fontSize: { xs: "0.7rem", sm: "0.8rem" },
              }}
            />
          ))}
        </Box>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
          Status Indicators:
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 12, height: 12, bgcolor: "#4CAF50", borderRadius: 1 }} />
            <Typography variant="caption" sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>
              Approved
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 12, height: 12, bgcolor: "#FF9800", borderRadius: 1 }} />
            <Typography variant="caption" sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>
              Pending
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 12, height: 12, bgcolor: "#F44336", borderRadius: 1 }} />
            <Typography variant="caption" sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>
              Denied
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Modal for adding a holiday */}
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "95%", sm: "80%", md: "60%" },
            maxWidth: 600,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: { xs: 2, sm: 4 },
            maxHeight: "90vh",
            overflow: "auto",
          }}
        >
          <RequestHoliday />
        </Box>
      </Modal>

      {/* Modal for viewing all holidays */}
      <Modal open={openViewAll} onClose={handleCloseViewAll}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "98%", sm: "90%", md: "85%" },
            maxWidth: 1200,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: { xs: 2, sm: 4 },
            maxHeight: "90vh",
            overflow: "auto",
          }}
        >
          <ManagerView />
        </Box>
      </Modal>

      {/* Event Detail Dialog */}
      <Dialog open={eventDialog} onClose={() => setEventDialog(false)} maxWidth="sm" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                  Holiday Request Details
                </Typography>
                <Chip
                  label={selectedEvent.status}
                  color={
                    selectedEvent.status.toLowerCase() === "approved"
                      ? "success"
                      : selectedEvent.status.toLowerCase() === "denied"
                        ? "error"
                        : "warning"
                  }
                  icon={getStatusIcon(selectedEvent.status)}
                  size="small"
                />
              </Box>
            </DialogTitle>

            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Employee
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Person />
                      <Typography variant="body1" fontWeight="medium">
                        {selectedEvent.userName}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Role
                    </Typography>
                    <Chip
                      label={selectedEvent.role}
                      sx={{
                        bgcolor: alpha(roleColors[selectedEvent.role] || "#000", 0.1),
                        color: roleColors[selectedEvent.role] || "#000",
                      }}
                    />
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Date Range
                    </Typography>
                    <Typography variant="body1">
                      {format(selectedEvent.start, "dd MMMM yyyy")} - {format(selectedEvent.end, "dd MMMM yyyy")}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Reason
                    </Typography>
                    <Typography variant="body1">{selectedEvent.reason}</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions>
              {selectedEvent.status.toLowerCase() === "pending" && (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => updateHolidayStatus(selectedEvent.id, "Approved")}
                    startIcon={<Check />}
                    size="small"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => updateHolidayStatus(selectedEvent.id, "Denied")}
                    startIcon={<Close />}
                    size="small"
                  >
                    Deny
                  </Button>
                </>
              )}
              <Button onClick={() => setEventDialog(false)} size="small">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Page>
  )
}

export default ManagerCalendar
