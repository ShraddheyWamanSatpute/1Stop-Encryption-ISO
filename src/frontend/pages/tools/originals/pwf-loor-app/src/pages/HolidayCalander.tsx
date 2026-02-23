"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { getDatabase, ref, get } from "firebase/database"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay, addDays } from "date-fns"
import {
  Typography,
  CircularProgress,
  Modal,
  Button,
  Box,
  Card,
  CardContent,
  Chip,
  Fab,
  useTheme,
  alpha,
  Paper,
} from "@mui/material"
import { useRole } from "../context/RoleContext"
import { enUS } from "date-fns/locale"
import { Page, PageHeader } from "../styles/StyledComponents"
import RequestHoliday from "./RequestHoliday"
import { Add, CalendarMonth, NavigateNext, Today as TodayIcon, Check, Close, AccessTime } from "@mui/icons-material"

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { "en-US": enUS },
})

interface Holiday {
  id: string
  start: Date
  end: Date
  title: string
  role?: string
  status: string
  userName: string
}

const HolidayCalendar: React.FC = () => {
  const theme = useTheme()
  const { state } = useRole()
  const userRole = state.role || "User"

  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

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
              title: `${holiday.userName} - ${holiday.status}`,
              role: holiday.role,
              status: holiday.status || "pending",
              userName: holiday.userName,
            }
          })
          .filter((holiday) => holiday.role === userRole)

        setHolidays(events)
      }
    } catch (error) {
      console.error("Error fetching holidays:", error)
    } finally {
      setLoading(false)
    }
  }, [userRole])

  useEffect(() => {
    fetchHolidays()
  }, [fetchHolidays])

  const eventStyleGetter = (event: Holiday) => {
    const roleColor = roleColors[event.role || ""] || "#000000"
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
        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
          <Box display="flex" alignItems="center" gap={2}>
            <CalendarMonth color="primary" sx={{ fontSize: { xs: 24, sm: 32 } }} />
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold" sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}>
                Holiday Calendar
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                >
                  Role:
                </Typography>
                <Chip label={userRole} color="primary" size="small" variant="outlined" />
              </Box>
            </Box>
          </Box>
        </Box>
      </PageHeader>

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

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
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
          <Calendar
            localizer={localizer}
            events={holidays}
            startAccessor="start"
            endAccessor="end"
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
                    {event.status}
                  </Typography>
                </Box>
              ),
            }}
            views={["month"]}
            view="month"
            popup
            showMultiDayTimes
            step={60}
            showAllEvents
          />
        </Paper>
      )}

      <Fab
        color="primary"
        aria-label="add holiday"
        onClick={handleOpen}
        sx={{
          position: "fixed",
          bottom: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 1000,
          width: { xs: 48, sm: 56 },
          height: { xs: 48, sm: 56 },
        }}
      >
        <Add />
      </Fab>

      <Modal
        open={open}
        onClose={handleClose}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card
          sx={{
            maxWidth: 600,
            width: { xs: "95%", sm: "90%" },
            maxHeight: "90vh",
            overflow: "auto",
            m: 2,
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                Request Holiday
              </Typography>
              <Button onClick={handleClose} color="inherit" size="small">
                Close
              </Button>
            </Box>
            <RequestHoliday />
          </CardContent>
        </Card>
      </Modal>
    </Page>
  )
}

export default HolidayCalendar
