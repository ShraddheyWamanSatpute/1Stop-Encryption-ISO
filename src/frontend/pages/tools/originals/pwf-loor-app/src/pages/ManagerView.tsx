"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { getDatabase, ref, get, update } from "firebase/database"
import {
  Card,
  CardContent,
  Button,
  Typography,
  Paper,
  Chip,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Badge,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar,
} from "@mui/material"
import { format, differenceInDays, isAfter, isBefore, parseISO } from "date-fns"
import {
  Check,
  Close,
  CalendarMonth,
  Person,
  AccessTime,
  Search,
  Refresh,
  EventBusy,
  EventAvailable,
  Schedule,
  Work,
} from "@mui/icons-material"

interface HolidayRequest {
  id: string
  userName: string
  userId: string
  role: string
  startDate: string
  endDate: string
  reason: string
  status: string
  requestedAt?: string
  reviewedBy?: string
  reviewedAt?: string
}

const ManagerView: React.FC = () => {
  const [requests, setRequests] = useState<HolidayRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState<string>("All")
  const [filterStatus, setFilterStatus] = useState<string>("All")
  const [selectedRequest, setSelectedRequest] = useState<HolidayRequest | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetchRequests()
  }, [refreshKey])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const db = getDatabase()
      const requestsRef = ref(db, "holidays")
      const snapshot = await get(requestsRef)
      if (snapshot.exists()) {
        const data = snapshot.val()
        const requestList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
          // Ensure all requests have a status
          status: data[key].status || "Pending",
        }))

        // Sort by status (Pending first) and then by start date (soonest first)
        requestList.sort((a, b) => {
          if (a.status === "Pending" && b.status !== "Pending") return -1
          if (a.status !== "Pending" && b.status === "Pending") return 1
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        })

        setRequests(requestList)
      } else {
        setRequests([])
      }
    } catch (err) {
      console.error("Error fetching holiday requests:", err)
      setError("Failed to load holiday requests")
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    setLoading(true)
    try {
      const db = getDatabase()
      await update(ref(db, `holidays/${id}`), {
        status,
        reviewedBy: "Manager", // This should be the actual manager name
        reviewedAt: new Date().toISOString(),
      })

      // Update local state
      setRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status } : req)))
      setSuccess(`Request ${status.toLowerCase()} successfully`)

      // Close dialog if open
      if (openDialog) {
        setOpenDialog(false)
        setSelectedRequest(null)
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      console.error("Error updating holiday status:", err)
      setError("Failed to update request status")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleRequestClick = (request: HolidayRequest) => {
    setSelectedRequest(request)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedRequest(null)
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "success"
      case "denied":
        return "error"
      case "pending":
        return "warning"
      default:
        return "default"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <Check />
      case "denied":
        return <Close />
      case "pending":
        return <AccessTime />
      default:
        return <Schedule />
    }
  }

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = differenceInDays(end, start) + 1 // Include both start and end days
    return `${days} day${days !== 1 ? "s" : ""}`
  }

  const isUpcoming = (startDate: string) => {
    return isAfter(new Date(startDate), new Date())
  }

  const isPast = (endDate: string) => {
    return isBefore(new Date(endDate), new Date())
  }

  const getTimeframe = (startDate: string, endDate: string) => {
    if (isPast(endDate)) return "Past"
    if (isUpcoming(startDate)) return "Upcoming"
    return "Current"
  }

  const getRoleIcon = (_: string) => {
    return <Work />
  }

  // Filter requests based on search, role, status, and tab
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = filterRole === "All" || request.role === filterRole
    const matchesStatus = filterStatus === "All" || request.status.toLowerCase() === filterStatus.toLowerCase()

    // Filter based on tab
    if (tabValue === 0) return matchesSearch && matchesRole && matchesStatus // All
    if (tabValue === 1) return request.status.toLowerCase() === "pending" && matchesSearch && matchesRole // Pending
    if (tabValue === 2) return isUpcoming(request.startDate) && matchesSearch && matchesRole && matchesStatus // Upcoming
    if (tabValue === 3) return isPast(request.endDate) && matchesSearch && matchesRole && matchesStatus // Past

    return matchesSearch && matchesRole && matchesStatus
  })

  // Get unique roles for filter dropdown
  const uniqueRoles = Array.from(new Set(requests.map((req) => req.role)))

  return (
    <Card sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight="bold">
            Holiday Requests
          </Typography>

          <Box display="flex" gap={1}>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Filters */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <TextField
            placeholder="Search requests..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Role</InputLabel>
            <Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} label="Role">
              <MenuItem value="All">All Roles</MenuItem>
              {uniqueRoles.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} label="Status">
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Denied">Denied</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Status messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
          <Tab label="All Requests" />
          <Tab
            label={
              <Badge
                badgeContent={requests.filter((req) => req.status.toLowerCase() === "pending").length}
                color="warning"
                showZero={false}
              >
                Pending
              </Badge>
            }
          />
          <Tab label="Upcoming" />
          <Tab label="Past" />
        </Tabs>

        {loading && !requests.length ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : filteredRequests.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No requests found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery || filterRole !== "All" || filterStatus !== "All"
                ? "No requests match your search criteria."
                : "There are no holiday requests to display."}
            </Typography>
          </Paper>
        ) : (
          <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
            <List sx={{ p: 0 }}>
              {filteredRequests.map((req, index) => {
                const formattedStartDate = format(new Date(req.startDate), "dd MMM yyyy")
                const formattedEndDate = format(new Date(req.endDate), "dd MMM yyyy")
                const timeframe = getTimeframe(req.startDate, req.endDate)

                return (
                  <Box key={req.id}>
                    <ListItem
                      component="div"
                      onClick={() => handleRequestClick(req)}
                      sx={{
                        py: 2,
                        px: 3,
                        cursor: "pointer",
                        bgcolor: req.status.toLowerCase() === "pending" ? "warning.50" : "inherit",
                        "&:hover": {
                          bgcolor: req.status.toLowerCase() === "pending" ? "warning.100" : "action.hover",
                        },
                      }}
                    >
                      <Avatar sx={{ mr: 2, bgcolor: getStatusColor(req.status) + ".main" }}>
                        {getStatusIcon(req.status)}
                      </Avatar>

                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={2}>
                            <Typography variant="h6" fontWeight="medium">
                              {req.userName}
                            </Typography>
                            <Chip label={req.role} size="small" icon={getRoleIcon(req.role)} variant="outlined" />
                            <Chip
                              label={req.status}
                              size="small"
                              color={getStatusColor(req.status) as any}
                              icon={getStatusIcon(req.status)}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Box display="flex" alignItems="center" gap={3} mb={1}>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <CalendarMonth fontSize="small" />
                                <Typography variant="body2">
                                  {formattedStartDate} - {formattedEndDate}
                                </Typography>
                              </Box>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <AccessTime fontSize="small" />
                                <Typography variant="body2">{getDuration(req.startDate, req.endDate)}</Typography>
                              </Box>
                              <Chip
                                label={timeframe}
                                size="small"
                                color={
                                  timeframe === "Current" ? "primary" : timeframe === "Upcoming" ? "info" : "default"
                                }
                                variant="outlined"
                              />
                            </Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                maxWidth: 400,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Reason: {req.reason}
                            </Typography>
                          </Box>
                        }
                      />

                      <ListItemSecondaryAction>
                        {req.status.toLowerCase() === "pending" ? (
                          <Box display="flex" gap={1}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateStatus(req.id, "Approved")
                              }}
                              startIcon={<Check />}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateStatus(req.id, "Denied")
                              }}
                              startIcon={<Close />}
                            >
                              Deny
                            </Button>
                          </Box>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRequestClick(req)
                            }}
                          >
                            Details
                          </Button>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredRequests.length - 1 && <Divider />}
                  </Box>
                )
              })}
            </List>
          </Paper>
        )}
      </CardContent>

      {/* Request Detail Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        {selectedRequest && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Holiday Request Details</Typography>
                <Chip
                  label={selectedRequest.status}
                  color={getStatusColor(selectedRequest.status) as any}
                  icon={getStatusIcon(selectedRequest.status)}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Employee
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Person />
                      <Typography variant="body1" fontWeight="medium">
                        {selectedRequest.userName}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Role
                    </Typography>
                    <Typography variant="body1">{selectedRequest.role}</Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Date Range
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarMonth />
                      <Typography variant="body1">
                        {format(new Date(selectedRequest.startDate), "dd MMMM yyyy")} -{" "}
                        {format(new Date(selectedRequest.endDate), "dd MMMM yyyy")}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                      <Chip
                        label={`${getDuration(selectedRequest.startDate, selectedRequest.endDate)}`}
                        size="small"
                        color="primary"
                      />
                      <Chip
                        label={getTimeframe(selectedRequest.startDate, selectedRequest.endDate)}
                        size="small"
                        color={
                          getTimeframe(selectedRequest.startDate, selectedRequest.endDate) === "Current"
                            ? "primary"
                            : getTimeframe(selectedRequest.startDate, selectedRequest.endDate) === "Upcoming"
                              ? "info"
                              : "default"
                        }
                      />
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Reason
                    </Typography>
                    <Typography variant="body1">{selectedRequest.reason}</Typography>
                  </Paper>
                </Grid>

                {selectedRequest.status.toLowerCase() !== "pending" && selectedRequest.reviewedAt && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Review Information
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Person fontSize="small" />
                          <Typography variant="body2">
                            Reviewed by: {selectedRequest.reviewedBy || "Manager"}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <AccessTime fontSize="small" />
                          <Typography variant="body2">
                            Reviewed on:{" "}
                            {selectedRequest.reviewedAt
                              ? format(parseISO(selectedRequest.reviewedAt), "dd MMM yyyy 'at' HH:mm")
                              : "Unknown"}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              {selectedRequest.status.toLowerCase() === "pending" && (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => updateStatus(selectedRequest.id, "Approved")}
                    startIcon={<EventAvailable />}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => updateStatus(selectedRequest.id, "Denied")}
                    startIcon={<EventBusy />}
                  >
                    Deny
                  </Button>
                </>
              )}
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Card>
  )
}

export default ManagerView
