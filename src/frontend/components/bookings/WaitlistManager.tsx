"use client"

import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Paper,
  useTheme,
  Tooltip,
  CircularProgress,
  InputAdornment,
  type SelectChangeEvent,
} from "@mui/material"
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  AccessTime as AccessTimeIcon,
  Group as GroupIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  NotificationsActive as NotificationsActiveIcon,
} from "@mui/icons-material"
import { useBookings as useBookingsContext, WaitlistEntry } from "../../../backend/context/BookingsContext"
import DataHeader from "../reusable/DataHeader"

// All waitlist operations now come from BookingsContext
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"

const WaitlistManager: React.FC = () => {
  const theme = useTheme()
  const { 
    basePath: bookingsBasePath
  } = useBookingsContext()

  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [, setError] = useState<string | null>(null)
  const [, setSuccess] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Form state
  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [email, setEmail] = useState("")
  const [partySize, setPartySize] = useState(2)
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("waiting")
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(30)
  const [submitted, setSubmitted] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    email?: string
    phone?: string
  }>({})

  // Add state for date filtering with range options
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "custom">("today")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Validation functions
  const validateEmail = (email: string): boolean => {
    if (!email) return true // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true // Phone is optional
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  }

  const validateForm = (): boolean => {
    const errors: { email?: string; phone?: string } = {}
    
    // Email and phone are both optional - only validate format if provided
    if (email && !validateEmail(email)) {
      errors.email = "Please enter a valid email address"
    }
    
    if (contact && !validatePhone(contact)) {
      errors.phone = "Please enter a valid phone number"
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  useEffect(() => {
    fetchWaitlistData()
  }, [dateRange, selectedDate, bookingsBasePath])

  // Update the fetchWaitlistData function to filter by date range
  const fetchWaitlistData = async () => {
    setIsLoading(true)
    try {
      // Would implement waitlist fetching when BookingsContext supports it
      const waitlistData: WaitlistEntry[] = []
      
      // Ensure waitlistData is an array
      const waitlistArray = Array.isArray(waitlistData) ? waitlistData : Object.values(waitlistData || {})

      // Filter by date range
      let filteredData = waitlistArray

      if (dateRange === "today") {
        const today = format(new Date(), "yyyy-MM-dd")
        filteredData = waitlistArray.filter((entry: any) => {
          const entryDate = format(new Date(entry.timeAdded), "yyyy-MM-dd")
          return entryDate === today
        })
      } else if (dateRange === "week") {
        const start = startOfWeek(new Date())
        const end = endOfWeek(new Date())
        filteredData = waitlistArray.filter((entry: any) => {
          const entryDate = new Date(entry.timeAdded)
          return isWithinInterval(entryDate, { start, end })
        })
      } else if (dateRange === "month") {
        const start = startOfMonth(new Date())
        const end = endOfMonth(new Date())
        filteredData = waitlistArray.filter((entry: any) => {
          const entryDate = new Date(entry.timeAdded)
          return isWithinInterval(entryDate, { start, end })
        })
      } else if (dateRange === "custom") {
        // For custom date range, filter by the selected date
        const dateStr = format(selectedDate, "yyyy-MM-dd")
        filteredData = waitlistArray.filter((entry: any) => {
          const entryDate = format(new Date(entry.timeAdded), "yyyy-MM-dd")
          return entryDate === dateStr
        })
      }

      setWaitlist(filteredData as WaitlistEntry[])
    } catch (error) {
      console.error("Error fetching waitlist:", error)
      setError("Failed to load waitlist. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!bookingsBasePath) return

    // Validate form
    if (!validateForm()) {
      return
    }

    if (!name || (!contact && !email)) {
      setError("Name and either contact number or email are required")
      return
    }

    setIsLoading(true)
    try {
      const entryData: Omit<WaitlistEntry, "id" | "timeAdded" | "status"> = {
        name,
        contact,
        email,
        partySize,
        notes,
        estimatedWaitTime,
      }

      if (selectedEntry?.id) {
        // Update existing entry
        // Would implement updateWaitlistEntry when BookingsContext supports it
        console.log("Would update waitlist entry:", selectedEntry.id, { ...entryData, status })
        setSuccess("Waitlist entry updated successfully")
      } else {
        // Create new entry
        // Would implement addToWaitlist when BookingsContext supports it
        console.log("Would add to waitlist:", entryData)
        setSuccess("Guest added to waitlist successfully")
      }

      // Reset form and refresh waitlist
      resetForm()
      fetchWaitlistData()
    } catch (error) {
      console.error("Error saving waitlist entry:", error)
      setError("Failed to save waitlist entry. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!id) return

    if (!window.confirm("Are you sure you want to remove this guest from the waitlist?")) {
      return
    }

    setIsLoading(true)
    try {
      // Would implement removeFromWaitlist when BookingsContext supports it
      console.log("Would remove from waitlist:", id)
      setSuccess("Guest removed from waitlist successfully")
      fetchWaitlistData()
    } catch (error) {
      console.error("Error deleting waitlist entry:", error)
      setError("Failed to delete waitlist entry. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (entry: WaitlistEntry) => {
    setSelectedEntry(entry)
    setName(entry.name)
    setContact(entry.contact || "")
    setEmail(entry.email || "")
    setPartySize(entry.partySize)
    setNotes(entry.notes || "")
    setStatus(entry.status)
    setEstimatedWaitTime(entry.estimatedWaitTime || 30)
  }

  const resetForm = () => {
    setSelectedEntry(null)
    setName("")
    setContact("")
    setEmail("")
    setPartySize(2)
    setNotes("")
    setStatus("waiting")
    setEstimatedWaitTime(30)
    setValidationErrors({})
    setSubmitted(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "warning"
      case "seated":
        return "success"
      case "cancelled":
        return "error"
      case "no-show":
        return "error"
      default:
        return "default"
    }
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Filter waitlist entries based on search query
  const filteredWaitlist = waitlist.filter(
    (entry) =>
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.contact.includes(searchQuery) ||
      (entry.email && entry.email.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Sort waitlist entries by status and time added
  const sortedWaitlist = [...filteredWaitlist].sort((a, b) => {
    // First sort by status (waiting first)
    if (a.status === "waiting" && b.status !== "waiting") return -1
    if (a.status !== "waiting" && b.status === "waiting") return 1

    // Then sort by time added (oldest first)
    return new Date(a.timeAdded).getTime() - new Date(b.timeAdded).getTime()
  })


  return (
    <Box>
      <Grid container spacing={3}>
        {/* Waitlist Form */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: "100%" }}>
      
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Guest Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      fullWidth
                      required
                      error={submitted && !name}
                      helperText={submitted && !name ? "Guest name is required" : ""}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Phone Number"
                      value={contact}
                      onChange={(e) => {
                        setContact(e.target.value)
                        // Clear validation error when user starts typing
                        if (validationErrors.phone) {
                          setValidationErrors(prev => ({ ...prev, phone: undefined }))
                        }
                      }}
                      fullWidth
                      error={!!validationErrors.phone}
                      helperText={validationErrors.phone || ""}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        // Clear validation error when user starts typing
                        if (validationErrors.email) {
                          setValidationErrors(prev => ({ ...prev, email: undefined }))
                        }
                      }}
                      fullWidth
                      error={!!validationErrors.email}
                      helperText={validationErrors.email || ""}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Party Size"
                      type="number"
                      value={partySize}
                      onChange={(e) => setPartySize(Number.parseInt(e.target.value))}
                      fullWidth
                      inputProps={{ min: 1 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <GroupIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Est. Wait (min)"
                      type="number"
                      value={estimatedWaitTime}
                      onChange={(e) => setEstimatedWaitTime(Number.parseInt(e.target.value))}
                      fullWidth
                      inputProps={{ min: 0 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccessTimeIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={status}
                        label="Status"
                        onChange={(e: SelectChangeEvent) => setStatus(e.target.value)}
                      >
                        <MenuItem value="waiting">Waiting</MenuItem>
                        <MenuItem value="seated">Seated</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                        <MenuItem value="no-show">No Show</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Any special requests or additional information"
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ display: "flex", gap: 1 }}>
                    <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={isLoading} fullWidth>
                      {selectedEntry ? "Update" : "Add to Waitlist"}
                    </Button>
                    {selectedEntry && (
                      <Button type="button" variant="outlined" startIcon={<CancelIcon />} onClick={resetForm} fullWidth>
                        Cancel
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Waitlist */}
        <Grid item xs={12} md={8}>
          <Card elevation={3} sx={{ height: "100%" }}>
            <Box sx={{ p: 0, borderBottom: `1px solid ${theme.palette.divider}` }}>
   
              <DataHeader
                currentDate={selectedDate}
                onDateChange={(date) => {
                  setSelectedDate(date)
                  if (dateRange === "custom") {
                    setDateRange("custom")
                  }
                }}
                dateType={dateRange === "today" ? "day" : dateRange === "week" ? "week" : dateRange === "month" ? "month" : "custom"}
                onDateTypeChange={(type) => {
                  if (type === "day") {
                    setDateRange("today")
                    setSelectedDate(new Date())
                  } else if (type === "week") {
                    setDateRange("week")
                    setSelectedDate(new Date())
                  } else if (type === "month") {
                    setDateRange("month")
                    setSelectedDate(new Date())
                  } else if (type === "custom") {
                    setDateRange("custom")
                  }
                }}
                searchTerm={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search waitlist..."
                filters={[]}
                filtersExpanded={false}
                onFiltersToggle={() => {}}
                backgroundColor="transparent"
                textColor="inherit"
              />
            </Box>
            <CardContent sx={{ p: 0, height: "calc(100% - 120px)", overflow: "auto" }}>

              {isLoading ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 3,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : sortedWaitlist.length === 0 ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 3,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <Paper elevation={0} sx={{ p: 3, maxWidth: 400, bgcolor: theme.palette.background.default }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No guests currently on the waitlist
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                      Add guests to the waitlist using the form on the left
                    </Typography>
                    <Button variant="contained" startIcon={<PersonIcon />} onClick={resetForm}>
                      Add Guest
                    </Button>
                  </Paper>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {sortedWaitlist.map((entry) => (
                    <React.Fragment key={entry.id}>
                      <ListItem
                        sx={{
                          bgcolor: selectedEntry?.id === entry.id ? theme.palette.action.selected : "transparent",
                          borderRadius: 1,
                          px: 3,
                          py: 2,
                          transition: "all 0.2s ease",
                          "&:hover": {
                            bgcolor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              <Typography variant="subtitle1" fontWeight="medium">
                                {entry.name}
                              </Typography>
                              <Chip
                                label={entry.status}
                                color={getStatusColor(entry.status) as "success" | "warning" | "error" | "default"}
                                size="small"
                              />
                              {entry.notified && (
                                <Tooltip title="Guest has been notified">
                                  <NotificationsActiveIcon fontSize="small" color="success" />
                                </Tooltip>
                              )}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Grid container spacing={1}>
                                <Grid item xs={12} sm={6}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <PhoneIcon fontSize="small" color="action" />
                                    <Typography variant="body2">{entry.contact || "No phone provided"}</Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <EmailIcon fontSize="small" color="action" />
                                    <Typography variant="body2">{entry.email || "No email provided"}</Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <GroupIcon fontSize="small" color="action" />
                                    <Typography variant="body2">{entry.partySize}</Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <AccessTimeIcon fontSize="small" color="action" />
                                    <Typography variant="body2">{formatTime(entry.timeAdded)}</Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton onClick={() => handleSelect(entry)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(entry.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default WaitlistManager
