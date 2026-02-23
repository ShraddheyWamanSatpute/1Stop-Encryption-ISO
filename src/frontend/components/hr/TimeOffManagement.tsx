"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Card,
  CardContent,
  Alert,
  Snackbar,
  CircularProgress,
  TablePagination,
  Avatar,
} from "@mui/material"
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  NavigateNext as NavigateNextIcon,
  Event as EventIcon,
  CalendarMonth as CalendarIcon,
  ViewList as ListIcon,
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, differenceInDays } from "date-fns"
import { useHR } from "../../../backend/context/HRContext"
// Company state is now handled through HRContext

import type { TimeOff } from "../../../backend/interfaces/HRs"
// Functions now accessed through HRContext

import CRUDModal from "../reusable/CRUDModal"
import TimeOffCRUDForm from "./forms/TimeOffCRUDForm"
import DataHeader from "../reusable/DataHeader"
import { calculateHolidayBalance } from "../../../mobile/utils/essDataFilters"


const TimeOffManagement = () => {
  const { state: hrState, refreshEmployees, refreshTimeOffs, handleHRAction } = useHR()
  // Company state is now handled through HRContext

  // Use time off requests from HR context state
  const timeOffRequests = hrState.timeOffs || []
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    message: string
    type: "success" | "error" | "info" | "warning"
  } | null>(null)

  // UI state
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null)
  const [approveRejectDialogOpen, setApproveRejectDialogOpen] = useState(false)
  const [requestToApproveReject, setRequestToApproveReject] = useState<TimeOff | null>(null)
  const [approveRejectAction, setApproveRejectAction] = useState<"approve" | "reject" | null>(null)
  const [approveRejectNote, setApproveRejectNote] = useState("")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortBy, setSortBy] = useState<string>("startDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  // Employee Balance Tracking
  const [employeeBalances, setEmployeeBalances] = useState<{ [employeeId: string]: number }>({})
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [balanceChange, setBalanceChange] = useState<number>(0)

  // New CRUD Modal state
  const [timeOffCRUDModalOpen, setTimeOffCRUDModalOpen] = useState(false)
  const [selectedTimeOffForCRUD, setSelectedTimeOffForCRUD] = useState<TimeOff | null>(null)
  const [crudMode, setCrudMode] = useState<'create' | 'edit' | 'view'>('create')


  // Derived data
  const timeOffTypes = ["vacation", "sick", "personal", "bereavement", "jury_duty", "other"]
  const statuses = ["pending", "approved", "denied", "cancelled"]

  // Date range filtering state
  const [dateRangeStart, setDateRangeStart] = useState<Date | null>(null)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | null>(null)

  const filteredRequests = useMemo(() => {
    if (!timeOffRequests || timeOffRequests.length === 0) {
      return []
    }
    
    return timeOffRequests.filter((request) => {
      const employee = hrState.employees.find((emp) => emp.id === request.employeeId)
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee ${request.employeeId}`

      const matchesSearch =
        searchQuery === "" ||
        employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (request.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)

      const matchesType = selectedType === "" || request.type === selectedType
      const matchesStatus = selectedStatus === "" || request.status === selectedStatus

      // Date range filtering - check if request overlaps with date range
      let matchesDateRange = true
      if (dateRangeStart && dateRangeEnd) {
        try {
          const requestStartDate = new Date(request.startDate)
          const requestEndDate = new Date(request.endDate)
          
          // Check if dates are valid
          if (isNaN(requestStartDate.getTime()) || isNaN(requestEndDate.getTime())) {
            matchesDateRange = true // Include invalid dates if no date range filter
          } else {
            // Request overlaps with date range if:
            // - Request starts within range, OR
            // - Request ends within range, OR
            // - Request completely contains the range
            matchesDateRange = 
              (requestStartDate >= dateRangeStart && requestStartDate <= dateRangeEnd) ||
              (requestEndDate >= dateRangeStart && requestEndDate <= dateRangeEnd) ||
              (requestStartDate <= dateRangeStart && requestEndDate >= dateRangeEnd)
          }
        } catch (e) {
          console.warn("Error parsing date in time off request:", request, e)
          matchesDateRange = true // Include on error
        }
      }

      return matchesSearch && matchesType && matchesStatus && matchesDateRange
    })
  }, [timeOffRequests, searchQuery, selectedType, selectedStatus, hrState.employees, dateRangeStart, dateRangeEnd])

  // Sort filtered requests
  const sortedRequests = useMemo(() => {
    const getEmployeeName = (employeeId: string) => {
      const emp = hrState.employees.find((e) => e.id === employeeId)
      if (!emp) {
        console.warn(`Employee not found for ID: ${employeeId}. Available employees:`, hrState.employees.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}` })))
        return `Employee ${employeeId}`
      }
      return `${emp.firstName} ${emp.lastName}`
    }

    const getValue = (r: TimeOff, key: string) => {
      switch (key) {
        case "employeeName":
        case "employee":
          return getEmployeeName(r.employeeId)
        case "type":
          return r.type || ""
        case "startDate":
          return r.startDate
        case "endDate":
          return r.endDate
        case "dates":
          return r.startDate
        case "totalDays":
        case "days":
          return (r as any).totalDays ?? 0
        case "reason":
          return r.reason || ""
        case "status":
          return r.status || ""
        case "balance":
          return employeeBalances[r.employeeId] ?? 0
        default:
          return (r as any)[key]
      }
    }

    const copy = [...filteredRequests]
    copy.sort((a, b) => {
      const av = getValue(a, sortBy)
      const bv = getValue(b, sortBy)

      let cmp = 0
      const isDate = sortBy === "startDate" || sortBy === "endDate" || sortBy === "dates"
      if (isDate) {
        const ad = av ? Date.parse(av as string) : 0
        const bd = bv ? Date.parse(bv as string) : 0
        cmp = ad - bd
      } else if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv
      } else {
        const as = (av ?? "").toString().toLowerCase()
        const bs = (bv ?? "").toString().toLowerCase()
        cmp = as.localeCompare(bs)
      }

      return sortOrder === "asc" ? cmp : -cmp
    })
    return copy
  }, [filteredRequests, sortBy, sortOrder, hrState.employees, employeeBalances])

  // Pagination
  const paginatedRequests = useMemo(() => {
    return sortedRequests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  }, [sortedRequests, page, rowsPerPage])

  // Calendar data
  const calendarDays = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    })
  }, [currentMonth])

  const timeOffByDate = useMemo(() => {
    const result = new Map<string, TimeOff[]>()

    timeOffRequests.forEach((request) => {
      if (request.status === "approved" || request.status === "pending") {
        const start = new Date(request.startDate)
        const end = new Date(request.endDate)

        const daysInInterval = eachDayOfInterval({ start, end })

        daysInInterval.forEach((day) => {
          const dateKey = format(day, "yyyy-MM-dd")
          if (!result.has(dateKey)) {
            result.set(dateKey, [])
          }
          result.get(dateKey)?.push(request)
        })
      }
    })

    return result
  }, [timeOffRequests])

  // Load time off requests when component mounts
  useEffect(() => {
    // Ensure data is loaded - wait for HR context to initialize
    const loadData = async () => {
      try {
        // Wait a bit for HR context to initialize if needed
        if (!hrState.initialized && hrState.isLoading) {
          // Wait for initialization
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        await refreshTimeOffs()
        await refreshEmployees() // Ensure employees are loaded
        if (hrState.employees.length > 0) {
          loadEmployeeBalances()
        }
      } catch (error) {
        console.error("Error loading time off data:", error)
      }
    }
    loadData()
  }, [hrState.initialized])

  // Update balances when employees or time offs change
  useEffect(() => {
    if (hrState.employees.length > 0 && timeOffRequests.length >= 0) {
      loadEmployeeBalances()
    }
  }, [hrState.employees, timeOffRequests])

  // Note: Data is now loaded automatically by HRContext
  // No need to manually refresh - context handles loading and caching
  // Only refresh if explicitly needed (e.g., after creating/updating)

  // Debug logging for employee and time off data
  useEffect(() => {
    console.log("TimeOffManagement - Employees loaded:", hrState.employees?.length || 0, hrState.employees?.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}` })))
    console.log("TimeOffManagement - Time off requests loaded:", timeOffRequests.length, timeOffRequests.map(r => ({ id: r.id, employeeId: r.employeeId, type: r.type })))
    
    // Check for missing employees in time off requests
    if (timeOffRequests.length > 0 && hrState.employees?.length > 0) {
      const timeOffEmployeeIds = new Set(timeOffRequests.map(r => r.employeeId))
      const availableEmployeeIds = new Set(hrState.employees.map(e => e.id))
      const missingEmployeeIds = Array.from(timeOffEmployeeIds).filter(id => !availableEmployeeIds.has(id))
      
      if (missingEmployeeIds.length > 0) {
        console.warn("TimeOffManagement - Missing employees for time off requests:", missingEmployeeIds)
      }
    }
    
    // Note: Automatic refresh removed to prevent interference with other data loading
  }, [hrState.employees, timeOffRequests, refreshEmployees])


  const loadEmployeeBalances = async () => {
    try {
      // Use the same calculateHolidayBalance function from mobile/ess
      const balances: { [employeeId: string]: number } = {}

      hrState.employees.forEach((employee) => {
        // Use calculateHolidayBalance from mobile/ess which matches the employee form logic
        const balance = calculateHolidayBalance(
          employee,
          timeOffRequests,
          hrState.attendances?.filter(att => att.employeeId === employee.id) || []
        )
        
        // Store remaining balance for display
        balances[employee.id] = balance.remaining
      })

      setEmployeeBalances(balances)
    } catch (err) {
      console.error("Error calculating employee balances:", err)
    }
  }




  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1))
  }

  const handleCurrentMonth = () => {
    setCurrentMonth(new Date())
  }

  const handleDeleteClick = (id: string) => {
    setRequestToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!requestToDelete) return

    setLoading(true)
    try {
      await handleHRAction({
        companyId: hrState.companyID || "",
        siteId: hrState.selectedSiteID || "",
        action: "delete",
        entity: "timeOffs",
        id: requestToDelete,
      })

      // Force refresh to ensure data is updated - wait a bit for database to update
      await new Promise(resolve => setTimeout(resolve, 300))
      await refreshTimeOffs()
      await refreshEmployees() // Refresh employees to ensure data is in sync
      await loadEmployeeBalances()
      
      // Clear any cached data
      setNotification({ message: "Time off request deleted successfully", type: "success" })
    } catch (err) {
      console.error("Error deleting time off request:", err)
      setError("Failed to delete time off request. Please try again.")
      setNotification({ message: "Failed to delete time off request", type: "error" })
    } finally {
      setLoading(false)
      setDeleteConfirmOpen(false)
      setRequestToDelete(null)
    }
  }

  const handleApproveRejectClick = (request: TimeOff, action: "approve" | "reject") => {
    setRequestToApproveReject(request)
    setApproveRejectAction(action)
    setApproveRejectNote("")
    setApproveRejectDialogOpen(true)
  }

  const handleConfirmApproveReject = async () => {
    if (!requestToApproveReject || !approveRejectAction) return

    try {
      // const updatedRequest: TimeOff = {
      //   ...requestToApproveReject,
      //   status: (approveRejectAction === "approve" ? "approved" : "denied") as "approved" | "denied",
      //   approvedBy: "Current User", // In a real app, get from auth context
      //   approvedAt: Date.now(),
      //   notes: approveRejectNote || requestToApproveReject.notes,
      // }

      await handleHRAction({
        companyId: hrState.companyID || "",
        siteId: hrState.selectedSiteID || "",
        action: "edit",
        entity: "timeOffs",
        id: requestToApproveReject.id,
        data: {
          ...requestToApproveReject,
          status: (approveRejectAction === "approve" ? "approved" : "denied") as "approved" | "denied",
          approvedBy: "Current User", // In a real app, get from auth context
          approvedAt: Date.now(),
          notes: approveRejectNote || requestToApproveReject.notes,
        },
      })

      // Data will be updated automatically by HRContext

      // Update employee balance if approved
      if (approveRejectAction === "approve" && requestToApproveReject.type === "vacation") {
        const days = calculateDays(requestToApproveReject.startDate, requestToApproveReject.endDate)
        setEmployeeBalances((prev) => ({
          ...prev,
          [requestToApproveReject.employeeId]: (prev[requestToApproveReject.employeeId] || 0) - days,
        }))
      }

      setNotification({
        message: `Time off request ${approveRejectAction}d successfully`,
        type: "success",
      })
    } catch (err) {
      console.error(`Error ${approveRejectAction}ing time off request:`, err)
      setNotification({ message: `Failed to ${approveRejectAction} time off request`, type: "error" })
    } finally {
      setApproveRejectDialogOpen(false)
      setRequestToApproveReject(null)
      setApproveRejectAction(null)
      setApproveRejectNote("")
    }
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleViewRequest = (request: TimeOff) => {
    handleOpenTimeOffCRUD(request, 'view')
  }

  // Employee Balance Management
  const handleOpenBalanceDialog = (employeeId: string) => {
    setSelectedEmployeeId(employeeId)
    setBalanceChange(0)
    setBalanceDialogOpen(true)
  }

  const handleCloseBalanceDialog = () => {
    setSelectedEmployeeId(null)
    setBalanceDialogOpen(false)
  }

  const handleBalanceChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBalanceChange(Number(event.target.value))
  }

  const handleUpdateBalance = async () => {
    if (selectedEmployeeId) {
      try {
        // In a real app, update the database
        setEmployeeBalances((prev) => ({
          ...prev,
          [selectedEmployeeId]: (prev[selectedEmployeeId] || 0) + balanceChange,
        }))

        setNotification({ message: "Employee balance updated", type: "success" })
        handleCloseBalanceDialog()
      } catch (err) {
        console.error("Error updating balance:", err)
        setNotification({ message: "Failed to update balance", type: "error" })
      }
    }
  }

  // New CRUD Modal handlers
  const handleOpenTimeOffCRUD = (timeOff: TimeOff | null = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedTimeOffForCRUD(timeOff)
    setCrudMode(mode)
    setTimeOffCRUDModalOpen(true)
  }

  const handleCloseTimeOffCRUD = () => {
    setTimeOffCRUDModalOpen(false)
    setSelectedTimeOffForCRUD(null)
    setCrudMode('create')
  }

  const handleSaveTimeOffCRUD = async (timeOffData: any) => {
    try {
      // Calculate totalDays if not provided
      if (!timeOffData.totalDays && timeOffData.startDate && timeOffData.endDate) {
        timeOffData.totalDays = calculateDays(timeOffData.startDate, timeOffData.endDate)
      }

      if (crudMode === 'create') {
        await handleHRAction({
          companyId: hrState.companyID || "",
          siteId: hrState.selectedSiteID || "",
          action: "create",
          entity: "timeOffs",
          data: timeOffData,
        })
        setNotification({ message: "Time off request created successfully", type: "success" })
      } else if (crudMode === 'edit' && selectedTimeOffForCRUD) {
        await handleHRAction({
          companyId: hrState.companyID || "",
          siteId: hrState.selectedSiteID || "",
          action: "edit",
          entity: "timeOffs",
          id: selectedTimeOffForCRUD.id,
          data: timeOffData,
        })
        setNotification({ message: "Time off request updated successfully", type: "success" })
      }
      handleCloseTimeOffCRUD()
      // Force refresh to ensure new data appears - wait a bit for database to update
      await new Promise(resolve => setTimeout(resolve, 300))
      await refreshTimeOffs()
      await refreshEmployees() // Refresh employees to ensure data is in sync
      await loadEmployeeBalances()
    } catch (error) {
      console.error("Error saving time off request:", error)
      setNotification({ message: `Failed to ${crudMode === 'create' ? 'create' : 'update'} time off request`, type: "error" })
    }
  }

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "success"
      case "pending":
        return "warning"
      case "denied":
        return "error"
      case "cancelled":
        return "default"
      default:
        return "default"
    }
  }

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircleIcon fontSize="small" />
      case "pending":
        return <PendingIcon fontSize="small" />
      case "denied":
        return <CancelIcon fontSize="small" />
      case "cancelled":
        return <CancelIcon fontSize="small" />
      default:
        return <EventIcon fontSize="small" />
    }
  }

  // Helper function to calculate days
  const calculateDays = (startDate: Date | number, endDate: Date | number) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // Safety check for invalid dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0
    }
    
    const days = differenceInDays(end, start) + 1
    return days > 0 ? days : 0
  }

  // Helper function to format type
  const formatType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  // Render calendar view
  const renderCalendarView = () => {
    return (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Button startIcon={<NavigateNextIcon sx={{ transform: "rotate(180deg)" }} />} onClick={handlePreviousMonth}>
            Previous Month
          </Button>
          <Typography variant="h6">{format(currentMonth, "MMMM yyyy")}</Typography>
          <Box>
            <Button sx={{ mr: 1 }} onClick={handleCurrentMonth}>
              Current Month
            </Button>
            <Button startIcon={<NavigateNextIcon />} onClick={handleNextMonth}>
              Next Month
            </Button>
          </Box>
        </Box>

        <Grid container spacing={1}>
          {/* Calendar header */}
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <Grid item xs key={day}>
              <Box sx={{ p: 1, textAlign: "center", fontWeight: "bold" }}>
                <Typography variant="subtitle2">{day}</Typography>
              </Box>
            </Grid>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd")
            const dayRequests = timeOffByDate.get(dateKey) || []

            return (
              <Grid item xs key={day.toISOString()}>
                <Card
                  variant="outlined"
                  sx={{
                    height: 120,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {format(day, "d")}
                    </Typography>
                    {dayRequests.slice(0, 2).map((request) => {
                      const employee = hrState.employees.find((emp) => emp.id === request.employeeId)
                      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee ${request.employeeId}`

                      return (
                        <Box
                          key={request.id}
                          sx={{
                            p: 0.5,
                            mb: 0.5,
                            borderRadius: 1,
                            bgcolor: request.status === "approved" ? "success.light" : "warning.light",
                            color: request.status === "approved" ? "success.contrastText" : "warning.contrastText",
                          }}
                          onClick={() => handleViewRequest(request)}
                        >
                          <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                            {employeeName.split(" ")[0]} - {formatType(request.type)}
                          </Typography>
                        </Box>
                      )
                    })}
                    {dayRequests.length > 2 && (
                      <Typography variant="caption" color="text.secondary">
                        +{dayRequests.length - 2} more
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </Box>
    )
  }

  // Render list view
  const renderListView = () => {
    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                align="center"
                sx={{ 
                  textAlign: 'center !important',
                  padding: '16px 16px',
                  cursor: "pointer",
                  userSelect: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
                onClick={() => {
                  if (sortBy === "employeeName") setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  else { setSortBy("employeeName"); setSortOrder("asc") }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Employee</Typography>
                  {sortBy === "employeeName" && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell
                align="center"
                sx={{ 
                  textAlign: 'center !important',
                  padding: '16px 16px',
                  cursor: "pointer",
                  userSelect: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
                onClick={() => {
                  if (sortBy === "type") setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  else { setSortBy("type"); setSortOrder("asc") }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Type</Typography>
                  {sortBy === "type" && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell
                align="center"
                sx={{ 
                  textAlign: 'center !important',
                  padding: '16px 16px',
                  cursor: "pointer",
                  userSelect: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
                onClick={() => {
                  if (sortBy === "startDate") setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  else { setSortBy("startDate"); setSortOrder("asc") }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Dates</Typography>
                  {sortBy === "startDate" && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell
                align="center"
                sx={{ 
                  textAlign: 'center !important',
                  padding: '16px 16px',
                  cursor: "pointer",
                  userSelect: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
                onClick={() => {
                  if (sortBy === "totalDays") setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  else { setSortBy("totalDays"); setSortOrder("asc") }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Days</Typography>
                  {sortBy === "totalDays" && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell
                align="center"
                sx={{ 
                  textAlign: 'center !important',
                  padding: '16px 16px',
                  cursor: "pointer",
                  userSelect: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
                onClick={() => {
                  if (sortBy === "reason") setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  else { setSortBy("reason"); setSortOrder("asc") }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Reason</Typography>
                  {sortBy === "reason" && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell
                align="center"
                sx={{ 
                  textAlign: 'center !important',
                  padding: '16px 16px',
                  cursor: "pointer",
                  userSelect: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
                onClick={() => {
                  if (sortBy === "status") setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  else { setSortBy("status"); setSortOrder("asc") }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Status</Typography>
                  {sortBy === "status" && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell
                align="center"
                sx={{ 
                  textAlign: 'center !important',
                  padding: '16px 16px',
                  cursor: "pointer",
                  userSelect: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
                onClick={() => {
                  if (sortBy === "balance") setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  else { setSortBy("balance"); setSortOrder("asc") }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Balance</Typography>
                  {sortBy === "balance" && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell align="center" sx={{ textAlign: 'center !important', padding: '16px 16px', userSelect: 'none' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Actions</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRequests.length > 0 ? (
              paginatedRequests.map((request) => {
                const employee = hrState.employees.find((emp) => emp.id === request.employeeId)
                const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee ${request.employeeId} (Not Found)`

                return (
                  <TableRow 
                    key={request.id} 
                    hover
                    onClick={() => handleViewRequest(request)}
                    sx={{ 
                      cursor: "pointer",
                      '& > td': {
                        paddingTop: 1,
                        paddingBottom: 1,
                      }
                    }}
                  >
                    <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Avatar sx={{ mr: 1, width: 32, height: 32 }}>{employee?.firstName?.charAt(0) || "?"}</Avatar>
                        {employeeName}
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{formatType(request.type)}</TableCell>
                    <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                      {format(new Date(request.startDate), "dd MMM")} -{" "}
                      {format(new Date(request.endDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{request.totalDays} days</TableCell>
                    <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{request.reason}</TableCell>
                    <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                      <Chip
                        icon={getStatusIcon(request.status)}
                        label={formatType(request.status)}
                        color={getStatusColor(request.status) as "success" | "warning" | "error" | "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {employeeBalances[request.employeeId] !== undefined
                          ? `${employeeBalances[request.employeeId]} days`
                          : "N/A"}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenBalanceDialog(request.employeeId)
                          }}
                          sx={{ ml: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                      <Box display="flex" gap={1} justifyContent="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenTimeOffCRUD(request, 'edit')
                          }}
                          title="Edit"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(request.id)
                          }}
                          title="Delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    No time off requests found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Stats Cards */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ height: '80px' }}>
                <CardContent 
                  sx={{ 
                    py: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    '&:last-child': { pb: 2 } 
                  }}
                >
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'baseline', 
                      gap: 1,
                      color: 'warning.main'
                    }}
                  >
                    <span style={{ fontWeight: 'bold' }}>
                      {filteredRequests.filter((request) => request.status === "pending").length}
                    </span>
                    <span style={{ fontSize: '0.7em', color: 'text.secondary' }}>
                      Pending Requests
                    </span>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ height: '80px' }}>
                <CardContent 
                  sx={{ 
                    py: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    '&:last-child': { pb: 2 } 
                  }}
                >
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'baseline', 
                      gap: 1,
                      color: 'success.main'
                    }}
                  >
                    <span style={{ fontWeight: 'bold' }}>
                      {(() => {
                        const currentMonthStart = startOfMonth(new Date())
                        const currentMonthEnd = endOfMonth(new Date())
                        return filteredRequests.filter((request) => {
                          if (!request.startDate) return false
                          try {
                            const requestDate = new Date(request.startDate)
                            if (isNaN(requestDate.getTime())) return false
                            return (
                              request.status === "approved" &&
                              requestDate >= currentMonthStart &&
                              requestDate <= currentMonthEnd
                            )
                          } catch {
                            return false
                          }
                        }).length
                      })()}
                    </span>
                    <span style={{ fontSize: '0.7em', color: 'text.secondary' }}>
                      Approved This Month
                    </span>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ height: '80px' }}>
                <CardContent 
                  sx={{ 
                    py: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    '&:last-child': { pb: 2 } 
                  }}
                >
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'baseline', 
                      gap: 1,
                      color: 'info.main'
                    }}
                  >
                    <span style={{ fontWeight: 'bold' }}>
                      {filteredRequests
                        .filter((request) => request.status === "approved")
                        .reduce((total, request) => {
                          const days = request.totalDays || calculateDays(request.startDate, request.endDate)
                          return total + days
                        }, 0)}
                    </span>
                    <span style={{ fontSize: '0.7em', color: 'text.secondary' }}>
                      Total Days Requested
                    </span>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Reusable Data Header */}
        <DataHeader
          currentDate={currentMonth}
          onDateChange={setCurrentMonth}
          dateType="month"
          showDateControls={true}
          showDateTypeSelector={true}
          availableDateTypes={["day", "week", "month", "custom"]}
          customStartDate={dateRangeStart || undefined}
          customEndDate={dateRangeEnd || undefined}
          onCustomDateRangeChange={(start, end) => {
            setDateRangeStart(start)
            setDateRangeEnd(end)
          }}
          searchTerm={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search time off requests..."
          filters={[
            {
              label: "Type",
              options: timeOffTypes.map(type => ({ id: type, name: type.charAt(0).toUpperCase() + type.slice(1) })),
              selectedValues: selectedType ? [selectedType] : [],
              onSelectionChange: (values) => setSelectedType(values[0] || "")
            },
            {
              label: "Status",
              options: statuses.map(status => ({ id: status, name: status.charAt(0).toUpperCase() + status.slice(1) })),
              selectedValues: selectedStatus ? [selectedStatus] : [],
              onSelectionChange: (values) => setSelectedStatus(values[0] || "")
            }
          ]}
          filtersExpanded={filtersExpanded}
          onFiltersToggle={() => setFiltersExpanded(!filtersExpanded)}
          sortOptions={[
            { value: "startDate", label: "Start Date" },
            { value: "endDate", label: "End Date" },
            { value: "employeeName", label: "Employee Name" },
            { value: "type", label: "Type" },
            { value: "status", label: "Status" },
            { value: "totalDays", label: "Days" }
          ]}
          sortValue={sortBy}
          sortDirection={sortOrder}
          onSortChange={(value, direction) => {
            setSortBy(value)
            setSortOrder(direction)
          }}
          onExportCSV={() => {
            // Export CSV functionality
            const csvData = sortedRequests.map(req => {
              const employee = hrState.employees.find(emp => emp.id === req.employeeId)
              const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : `Employee ${req.employeeId}`
              return {
                Employee: employeeName,
                Type: req.type,
                'Start Date': format(new Date(req.startDate), 'yyyy-MM-dd'),
                'End Date': format(new Date(req.endDate), 'yyyy-MM-dd'),
                Days: req.totalDays || calculateDays(req.startDate, req.endDate),
                Status: req.status,
                Reason: req.reason || ''
              }
            })
            
            const headers = Object.keys(csvData[0] || {})
            const csvContent = [
              headers.join(','),
              ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(','))
            ].join('\n')
            
            const blob = new Blob([csvContent], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `time-off-requests-${format(new Date(), 'yyyy-MM-dd')}.csv`
            link.click()
            URL.revokeObjectURL(url)
            
            setNotification({ message: "CSV exported successfully!", type: "success" })
          }}
          onRefresh={async () => {
            await refreshTimeOffs()
            await loadEmployeeBalances()
          }}
          onCreateNew={() => handleOpenTimeOffCRUD(null, 'create')}
          createButtonLabel="New Request"
          additionalButtons={[
            {
              label: viewMode === "list" ? "Calendar View" : "List View",
              icon: viewMode === "list" ? <CalendarIcon /> : <ListIcon />,
              onClick: () => setViewMode(viewMode === "list" ? "calendar" : "list"),
              variant: "outlined"
            }
          ]}
        />





        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Time Off Requests View */}
            {viewMode === "calendar" ? renderCalendarView() : renderListView()}

            {/* Pagination (only for list view) */}
            {viewMode === "list" && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredRequests.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            )}
          </>
        )}


        {/* Approve/Reject Dialog */}
        <Dialog
          open={approveRejectDialogOpen}
          onClose={() => setApproveRejectDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{approveRejectAction === "approve" ? "Approve" : "Reject"} Time Off Request</DialogTitle>
          <DialogContent>
            {requestToApproveReject && (
              <>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Are you sure you want to {approveRejectAction} the time off request for{" "}
                  <strong>
                    {(() => {
                      const employee = hrState.employees.find((emp) => emp.id === requestToApproveReject.employeeId)
                      return employee ? `${employee.firstName} ${employee.lastName}` : `Employee ${requestToApproveReject.employeeId} (Not Found)`
                    })()}
                  </strong>
                  ?
                </Typography>
                <TextField
                  fullWidth
                  label={`${approveRejectAction === "approve" ? "Approval" : "Rejection"} Notes (Optional)`}
                  value={approveRejectNote}
                  onChange={(e) => setApproveRejectNote(e.target.value)}
                  multiline
                  rows={3}
                  sx={{ mt: 2 }}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApproveRejectDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color={approveRejectAction === "approve" ? "success" : "error"}
              onClick={handleConfirmApproveReject}
            >
              {approveRejectAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this time off request? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Employee Balance Dialog */}
        <Dialog open={balanceDialogOpen} onClose={handleCloseBalanceDialog}>
          <DialogTitle>Update Employee Balance</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Enter the number of days to add to or subtract from the employee's balance.
            </Typography>
            <TextField
              label="Balance Change"
              type="number"
              value={balanceChange}
              onChange={handleBalanceChangeInput}
              fullWidth
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseBalanceDialog}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdateBalance}>
              Update Balance
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notification */}
        <Snackbar
          open={!!notification}
          autoHideDuration={6000}
          onClose={() => setNotification(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert onClose={() => setNotification(null)} severity={notification?.type} sx={{ width: "100%" }}>
            {notification?.message}
          </Alert>
        </Snackbar>

        {/* New CRUD Modal */}
        <CRUDModal
          open={timeOffCRUDModalOpen}
          onClose={handleCloseTimeOffCRUD}
          title={
            crudMode === 'create' ? 'Create Time Off Request' : 
            crudMode === 'edit' ? 'Edit Time Off Request' : 
            'View Time Off Request'
          }
          mode={crudMode}
          maxWidth="lg"
          onSave={crudMode !== 'view' ? handleSaveTimeOffCRUD : undefined}
          actions={
            crudMode === 'view' && selectedTimeOffForCRUD?.status === 'pending' ? (
              <>
                <Button
                  startIcon={<CheckIcon />}
                  color="success"
                  variant="contained"
                  onClick={() => {
                    handleApproveRejectClick(selectedTimeOffForCRUD, "approve")
                    handleCloseTimeOffCRUD()
                  }}
                >
                  Approve
                </Button>
                <Button
                  startIcon={<CloseIcon />}
                  color="error"
                  variant="contained"
                  onClick={() => {
                    handleApproveRejectClick(selectedTimeOffForCRUD, "reject")
                    handleCloseTimeOffCRUD()
                  }}
                >
                  Reject
                </Button>
              </>
            ) : undefined
          }
        >
          {(() => {
            console.log('TimeOffManagement - Passing employees to form:', {
              count: hrState.employees?.length || 0,
              employees: hrState.employees?.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, department: e.department }))
            })
            return (
              <TimeOffCRUDForm
                timeOffRequest={selectedTimeOffForCRUD as any}
                mode={crudMode}
                onSave={handleSaveTimeOffCRUD}
                employees={hrState.employees}
              />
            )
          })()}
        </CRUDModal>
      </Box>
    </LocalizationProvider>
  )
}

export default TimeOffManagement
