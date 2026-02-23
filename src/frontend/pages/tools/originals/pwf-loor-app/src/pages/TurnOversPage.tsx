"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ref, get } from "firebase/database"
import { db as database } from "../services/firebase"
import {
  Typography,
  Box,
  CircularProgress,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Chip,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from "@mui/material"
import { Page, PageHeader, Horizontal } from "../styles/StyledComponents"
import {
  ArrowBack,
  ArrowForward,
  Print,
  TableRestaurant,
  ViewModule,
  ViewList,
  Fullscreen,
  Close,
} from "@mui/icons-material"

const getCurrentDate = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

type ViewMode = "cards" | "list" | "fullscreen"

const TurnOversPage: React.FC = () => {
  const [date, setDate] = useState<string>(getCurrentDate())
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [groupedBookings, setGroupedBookings] = useState<Record<string, { tableNumber: string; guests: string }[]>>({})
  const [viewMode, setViewMode] = useState<ViewMode>("cards")
  const [fullscreenOpen, setFullscreenOpen] = useState<boolean>(false)

  useEffect(() => {
    if (date) {
      fetchTurnOverData(date)
    }
  }, [date])

  const fetchTurnOverData = async (selectedDate: string) => {
    setLoading(true)
    setError(null)
    setGroupedBookings({})

    try {
      const dateRef = ref(database, `RunsheetsAndPreorders/${selectedDate}`)
      const snapshot = await get(dateRef)

      if (snapshot.exists()) {
        const runsheetData = (snapshot.val() as Record<string, any>)?.bookings || {}
        const timeGroups: Record<string, { tableNumber: string; guests: string }[]> = {}

        Object.entries(runsheetData).forEach(([_, bookingData]) => {
          const booking = bookingData as { type?: string; tableNumber?: string; guests?: string; time?: string }

          const type = booking.type?.toLowerCase() || ""
          const tableNumber = booking.tableNumber || "N/A"
          const guests = booking.guests || "N/A"
          const time = booking.time || "Unknown Time"

          if (
            (type.includes("dinner") ||
              type.includes("brunch") ||
              type.includes("theatre") ||
              type.includes("buy") ||
              type.includes("dining")) &&
            tableNumber !== "N/A"
          ) {
            if (!timeGroups[time]) {
              timeGroups[time] = []
            }
            timeGroups[time].push({ tableNumber, guests })
          }
        })

        // Sort each time group's bookings by table number
        Object.keys(timeGroups).forEach((time) => {
          timeGroups[time].sort((a, b) => {
            const numA = Number.parseInt(a.tableNumber.match(/\d+/)?.[0] || "9999", 10)
            const numB = Number.parseInt(b.tableNumber.match(/\d+/)?.[0] || "9999", 10)
            return numA - numB
          })
        })

        // Sort time slots
        const sortedTimes = Object.keys(timeGroups).sort((a, b) => a.localeCompare(b))
        const sortedGroups = sortedTimes.reduce((acc, time) => ({ ...acc, [time]: timeGroups[time] }), {})

        setGroupedBookings(sortedGroups)
      } else {
        setError("No data available for the selected date.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleDateNavigation = (direction: "forward" | "backward") => {
    const currentDate = new Date(date)
    if (direction === "forward") {
      currentDate.setDate(currentDate.getDate() + 1)
    } else if (direction === "backward") {
      currentDate.setDate(currentDate.getDate() - 1)
    }

    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, "0")
    const day = String(currentDate.getDate()).padStart(2, "0")
    setDate(`${year}-${month}-${day}`)
  }

  const printPage = () => {
    window.print()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newViewMode: ViewMode | null) => {
    if (newViewMode !== null) {
      if (newViewMode === "fullscreen") {
        setFullscreenOpen(true)
      } else {
        setViewMode(newViewMode)
      }
    }
  }

  const renderTablesList = (compact = false) => {
    return Object.entries(groupedBookings).map(([time, bookings]) => (
      <Paper
        key={time}
        sx={{
          p: compact ? 1.5 : 2,
          mb: 2,
          border: 1,
          borderColor: "divider",
        }}
      >
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <TableRestaurant color="primary" fontSize={compact ? "small" : "medium"} />
          <Typography variant={compact ? "subtitle1" : "h6"} fontWeight="bold">
            {time}
          </Typography>
          <Chip label={`${bookings.length} tables`} size="small" color="primary" variant="outlined" />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          {bookings.map((booking, index) => (
            <Chip
              key={index}
              label={`${booking.tableNumber} (${booking.guests})`}
              variant="outlined"
              size={compact ? "small" : "medium"}
              sx={{
                bgcolor: "background.default",
                "&:hover": { bgcolor: "action.hover" },
              }}
            />
          ))}
        </Box>
      </Paper>
    ))
  }

  const renderCardsView = () => (
    <Grid container spacing={3} id="printable-content">
      {Object.entries(groupedBookings).map(([time, bookings]) => (
        <Grid item xs={12} sm={6} md={4} key={time}>
          <Card
            sx={{
              height: "100%",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: 4,
              },
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <TableRestaurant color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  {time}
                </Typography>
                <Chip label={`${bookings.length} tables`} size="small" color="primary" variant="outlined" />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: bookings.length > 25 ? "repeat(2, 1fr)" : "1fr",
                  gap: 1,
                  maxHeight: 300,
                  overflowY: "auto",
                }}
              >
                {bookings.map((booking, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1.5,
                      bgcolor: "background.default",
                      borderRadius: 1,
                      border: 1,
                      borderColor: "divider",
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="body2" fontWeight="medium">
                      {booking.tableNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {booking.guests} covers
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )

  return (
    <Page>
      <PageHeader>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Set Up Sheet
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {formatDate(date)}
        </Typography>
      </PageHeader>

      <Horizontal sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            onClick={() => handleDateNavigation("backward")}
            sx={{
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <ArrowBack />
          </IconButton>

          <TextField
            label="Select Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 200 }}
          />

          <IconButton
            onClick={() => handleDateNavigation("forward")}
            sx={{
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <ArrowForward />
          </IconButton>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewModeChange} size="small">
            <ToggleButton value="cards">
              <ViewModule />
            </ToggleButton>
            <ToggleButton value="list">
              <ViewList />
            </ToggleButton>
            <ToggleButton value="fullscreen">
              <Fullscreen />
            </ToggleButton>
          </ToggleButtonGroup>

          <Button variant="contained" startIcon={<Print />} onClick={printPage} sx={{ minWidth: 120 }}>
            Print
          </Button>
        </Box>
      </Horizontal>

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Card sx={{ bgcolor: "error.light", color: "error.contrastText", mb: 2 }}>
          <CardContent>
            <Typography>{error}</Typography>
          </CardContent>
        </Card>
      )}

      {!loading && !error && Object.keys(groupedBookings).length > 0 && (
        <>
          {viewMode === "cards" && renderCardsView()}
          {viewMode === "list" && <Box id="printable-content">{renderTablesList()}</Box>}
        </>
      )}

      {!loading && !error && Object.keys(groupedBookings).length === 0 && date && (
        <Card>
          <CardContent>
            <Typography textAlign="center" color="text.secondary">
              No matching bookings found for this date.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Fullscreen Dialog */}
      <Dialog
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        maxWidth={false}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: "background.default",
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Set Up Sheet - {formatDate(date)}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              All Tables View
            </Typography>
          </Box>
          <IconButton onClick={() => setFullscreenOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>{renderTablesList(true)}</DialogContent>

        <DialogActions>
          <Button onClick={printPage} startIcon={<Print />}>
            Print
          </Button>
          <Button onClick={() => setFullscreenOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  )
}

export default TurnOversPage
