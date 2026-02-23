"use client"

import React, { useState, useMemo, useCallback } from "react"
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material"
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationOnIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  CalendarMonth as CalendarMonthIcon,
} from "@mui/icons-material"
import { format, parseISO, isPast, startOfDay } from "date-fns"
import { useHRContext } from "../../../backend/context/HRContext"
import type { Schedule } from "../../../backend/interfaces/HRs"
import { themeConfig } from "../../../theme/AppTheme"
import DataHeader from "../reusable/DataHeader"
import { useNavigate, useLocation } from "react-router-dom"

const FinalizeShifts: React.FC = () => {
  const { state: hrState, updateSchedule, refreshSchedules } = useHRContext()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{
    message: string
    type: "success" | "error" | "info"
  } | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  )
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false)
  const [selectedShifts, setSelectedShifts] = useState<Schedule[]>([])
  const [editingShift, setEditingShift] = useState<Schedule | null>(null)
  const [editedShifts, setEditedShifts] = useState<Record<string, Partial<Schedule>>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDepartment, setFilterDepartment] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string[]>([])

  // Navigate to Rota tab
  const handleNavigateToRota = () => {
    const currentPath = location.pathname
    if (currentPath.includes('/finalize-shifts')) {
      navigate(currentPath.replace('/finalize-shifts', '/schedule-manager'))
    } else {
      navigate('/hr/scheduling/schedule-manager')
    }
  }

  // Filter shifts that are scheduled and the date has passed
  const shiftsToFinalize = useMemo(() => {
    const today = startOfDay(new Date())
    return hrState.schedules.filter(
      (schedule) => {
        if (!schedule.date) return false
        const scheduleDate = startOfDay(new Date(schedule.date))
        return schedule.status === "scheduled" && isPast(scheduleDate)
      }
    )
  }, [hrState.schedules])

  // Filter shifts by search and filters
  const filteredShifts = useMemo(() => {
    return shiftsToFinalize.filter((shift) => {
      const employee = hrState.employees.find(emp => emp.id === shift.employeeId)
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : shift.employeeName || ""
      
      const matchesSearch = searchTerm === "" || 
        employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shift.department?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesDepartment = filterDepartment.length === 0 || 
        filterDepartment.includes(shift.department || "")
      
      const matchesStatus = filterStatus.length === 0 || 
        filterStatus.includes(shift.status || "")
      
      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [shiftsToFinalize, searchTerm, filterDepartment, filterStatus, hrState.employees])

  // Group shifts by date in chronological order
  const shiftsByDate = useMemo(() => {
    const grouped: Record<string, Schedule[]> = {}
    filteredShifts.forEach((shift) => {
      const date = shift.date
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(shift)
    })
    // Sort dates chronologically
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime()
    })
    const sortedGrouped: Record<string, Schedule[]> = {}
    sortedDates.forEach(date => {
      sortedGrouped[date] = grouped[date]
    })
    return sortedGrouped
  }, [filteredShifts])

  // Get shifts for selected date
  const selectedDateShifts = useMemo(() => {
    return shiftsByDate[selectedDate] || []
  }, [shiftsByDate, selectedDate])

  // Get all unique dates
  const availableDates = useMemo(() => {
    return Object.keys(shiftsByDate).sort().reverse()
  }, [shiftsByDate])

  const handleSaveShift = useCallback(async (shift: Schedule) => {
    setLoading(true)
    try {
      const editedData = editedShifts[shift.id] || {}
      await updateSchedule(shift.id, {
        ...shift,
        ...editedData,
        updatedAt: new Date().toISOString(),
      })
      await refreshSchedules()
      
      // Remove from edited shifts
      setEditedShifts(prev => {
        const next = { ...prev }
        delete next[shift.id]
        return next
      })
      
      setNotification({
        message: "Shift updated successfully",
        type: "success",
      })
    } catch (error) {
      console.error("Error updating shift:", error)
      setNotification({
        message: "Failed to update shift",
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }, [editedShifts, updateSchedule, refreshSchedules])

  const handleSaveAll = useCallback(async () => {
    setLoading(true)
    try {
      const promises = Object.entries(editedShifts).map(async ([shiftId, editedData]) => {
        const shift = shiftsToFinalize.find(s => s.id === shiftId)
        if (!shift) return
        return await updateSchedule(shiftId, {
          ...shift,
          ...editedData,
          updatedAt: new Date().toISOString(),
        })
      })

      await Promise.all(promises)
      await refreshSchedules()
      
      setEditedShifts({})
      setNotification({
        message: `Successfully updated ${Object.keys(editedShifts).length} shift(s)`,
        type: "success",
      })
    } catch (error) {
      console.error("Error updating shifts:", error)
      setNotification({
        message: "Failed to update shifts",
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }, [editedShifts, shiftsToFinalize, updateSchedule, refreshSchedules])

  const handleFinalize = useCallback(async () => {
    if (selectedShifts.length === 0) return

    setLoading(true)
    try {
      const promises = selectedShifts.map(async (shift) => {
        return await updateSchedule(shift.id, {
          ...shift,
          status: "finalized",
          updatedAt: new Date().toISOString(),
        })
      })

      await Promise.all(promises)
      await refreshSchedules()

      setNotification({
        message: `Successfully finalized ${selectedShifts.length} shift(s)`,
        type: "success",
      })
      setFinalizeDialogOpen(false)
      setSelectedShifts([])
    } catch (error) {
      console.error("Error finalizing shifts:", error)
      setNotification({
        message: "Failed to finalize shifts",
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }, [selectedShifts, updateSchedule, refreshSchedules])

  const handleSelectShift = (shift: Schedule) => {
    setSelectedShifts((prev) => {
      const exists = prev.find((s) => s.id === shift.id)
      if (exists) {
        return prev.filter((s) => s.id !== shift.id)
      } else {
        return [...prev, shift]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedShifts.length === selectedDateShifts.length) {
      setSelectedShifts([])
    } else {
      setSelectedShifts([...selectedDateShifts])
    }
  }

  const formatTime = (timeString?: string): string => {
    if (!timeString) return "--:--"
    try {
      // Handle both ISO string and time-only string
      if (timeString.includes("T")) {
        return format(parseISO(timeString), "HH:mm")
      }
      // If it's just a time string like "09:00", return as is
      if (timeString.match(/^\d{2}:\d{2}$/)) {
        return timeString
      }
      return timeString
    } catch {
      return timeString
    }
  }

  const formatLocation = (location?: string): string => {
    if (!location) return ""
    // If location is a JSON string, try to parse it
    try {
      const parsed = JSON.parse(location)
      if (parsed.latitude && parsed.longitude) {
        return `${parsed.latitude.toFixed(6)}, ${parsed.longitude.toFixed(6)}`
      }
    } catch {
      // If not JSON, return as is
    }
    return location
  }

  const calculateActualHours = (shift: Schedule): number => {
    if (shift.actualHours) return shift.actualHours
    if (shift.clockInTime && shift.clockOutTime) {
      try {
        const clockIn = shift.clockInTime.includes("T")
          ? parseISO(shift.clockInTime)
          : new Date(`${shift.date}T${shift.clockInTime}`)
        const clockOut = shift.clockOutTime.includes("T")
          ? parseISO(shift.clockOutTime)
          : new Date(`${shift.date}T${shift.clockOutTime}`)
        const diffMs = clockOut.getTime() - clockIn.getTime()
        return diffMs / (1000 * 60 * 60) // Convert to hours
      } catch {
        return 0
      }
    }
    return 0
  }

  const handleEditShift = (shift: Schedule, field: string, value: any) => {
    setEditedShifts(prev => ({
      ...prev,
      [shift.id]: {
        ...prev[shift.id],
        [field]: value
      }
    }))
  }

  return (
    <Box sx={{ p: 3 }}>
      <DataHeader
        title="Finalize Shifts"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search employees..."
        filters={[
          {
            label: "Department",
            options: [...new Set(shiftsToFinalize.map(s => s.department).filter(Boolean))].map(dept => ({ id: dept, name: dept })),
            selectedValues: filterDepartment,
            onSelectionChange: setFilterDepartment
          },
          {
            label: "Status",
            options: [
              { id: "scheduled", name: "Scheduled" },
              { id: "completed", name: "Completed" }
            ],
            selectedValues: filterStatus,
            onSelectionChange: setFilterStatus
          }
        ]}
        filtersExpanded={false}
        onFiltersToggle={() => {}}
        onRefresh={() => refreshSchedules()}
        additionalButtons={[
          {
            label: "Rota",
            icon: <CalendarMonthIcon />,
            onClick: handleNavigateToRota,
            variant: "outlined" as const,
            color: "primary" as const
          },
          ...(Object.keys(editedShifts).length > 0 ? [{
            label: `Save All (${Object.keys(editedShifts).length})`,
            icon: <SaveIcon />,
            onClick: handleSaveAll,
            variant: "contained" as const,
            color: "success" as const
          }] : [])
        ]}
      />

      {Object.keys(shiftsByDate).length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No shifts available for finalization. Only scheduled shifts with dates in the past are shown.
        </Alert>
      ) : (
        <>
          {Object.entries(shiftsByDate).map(([date, dateShifts]) => (
            <Box key={date} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {format(new Date(date), "EEEE, MMMM dd, yyyy")}
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Shift Time</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <AccessTimeIcon fontSize="small" />
                          Clock In
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <AccessTimeIcon fontSize="small" />
                          Clock Out
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <LocationOnIcon fontSize="small" />
                          Clock In Location
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <LocationOnIcon fontSize="small" />
                          Clock Out Location
                        </Box>
                      </TableCell>
                      <TableCell>Actual Hours</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dateShifts.map((shift) => {
                      const editedData = editedShifts[shift.id] || {}
                      const displayShift = { ...shift, ...editedData }
                      const actualHours = calculateActualHours(displayShift)

                      return (
                        <TableRow key={shift.id} hover>
                          <TableCell>{displayShift.employeeName}</TableCell>
                          <TableCell>{displayShift.department}</TableCell>
                          <TableCell>
                            {formatTime(displayShift.startTime)} - {formatTime(displayShift.endTime)}
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="time"
                              value={formatTime(displayShift.clockInTime) || ""}
                              onChange={(e) => handleEditShift(shift, "clockInTime", e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              sx={{ minWidth: 120 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="time"
                              value={formatTime(displayShift.clockOutTime) || ""}
                              onChange={(e) => handleEditShift(shift, "clockOutTime", e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              sx={{ minWidth: 120 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={formatLocation(displayShift.clockInLocation) || ""}
                              onChange={(e) => handleEditShift(shift, "clockInLocation", e.target.value)}
                              placeholder="Location"
                              sx={{ minWidth: 150 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={formatLocation(displayShift.clockOutLocation) || ""}
                              onChange={(e) => handleEditShift(shift, "clockOutLocation", e.target.value)}
                              placeholder="Location"
                              sx={{ minWidth: 150 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {actualHours.toFixed(2)}h
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleSaveShift(shift)}
                              disabled={!editedShifts[shift.id]}
                              title="Save changes"
                            >
                              <SaveIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
        </>
      )}

      {/* Finalize Confirmation Dialog */}
      <Dialog
        open={finalizeDialogOpen}
        onClose={() => !loading && setFinalizeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Finalize Shifts</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to finalize {selectedShifts.length} shift(s)?
            This action will mark the shifts as finalized and they will be ready
            for approval.
          </Typography>
          <Box sx={{ mt: 2 }}>
            {selectedShifts.slice(0, 5).map((shift) => (
              <Typography key={shift.id} variant="body2" sx={{ mb: 0.5 }}>
                • {shift.employeeName} - {format(new Date(shift.date), "MMM dd")}
              </Typography>
            ))}
            {selectedShifts.length > 5 && (
              <Typography variant="body2" color="text.secondary">
                ...and {selectedShifts.length - 5} more
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setFinalizeDialogOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleFinalize}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <CheckCircleIcon />}
          >
            {loading ? "Finalizing..." : "Finalize"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setNotification(null)}
          severity={notification?.type || "info"}
          sx={{ width: "100%" }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default FinalizeShifts


