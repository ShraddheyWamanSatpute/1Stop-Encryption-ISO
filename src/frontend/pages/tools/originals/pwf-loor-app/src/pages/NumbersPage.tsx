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
  IconButton,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Chip,
} from "@mui/material"
import { Page, PageHeader, Horizontal } from "../styles/StyledComponents"
import { ArrowBack, ArrowForward, Print, Assessment } from "@mui/icons-material"

interface AggregatedData {
  time: string
  type: string
  totalGuests: number
}

const getCurrentDate = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const NumbersPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(getCurrentDate())
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [groupedData, setGroupedData] = useState<Record<string, AggregatedData[]>>({})
  const [timeOrder, setTimeOrder] = useState<string[]>([])

  useEffect(() => {
    if (selectedDate) {
      fetchBookingsForDate(selectedDate)
    }
  }, [selectedDate])

  const fetchBookingsForDate = async (date: string) => {
    setLoading(true)
    setError(null)
    setGroupedData({})

    try {
      const bookingsRef = ref(database, `RunsheetsAndPreorders/${date}/bookings`)
      const snapshot = await get(bookingsRef)

      if (snapshot.exists()) {
        aggregateBookings(snapshot.val())
      } else {
        setError("No bookings found for this date.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const aggregateBookings = (bookingsData: Record<string, any>) => {
    const aggregated: AggregatedData[] = []

    Object.values(bookingsData).forEach((booking: any) => {
      const time = booking.time
      const type = booking.type
      const guests = Number.parseInt(booking.guests) || 0

      const existingEntry = aggregated.find((entry) => entry.time === time && entry.type === type)
      if (existingEntry) {
        existingEntry.totalGuests += guests
      } else {
        aggregated.push({ time, type, totalGuests: guests })
      }
    })

    const sortedAggregated = aggregated.sort((a, b) => a.time.localeCompare(b.time))

    const validTimes = sortedAggregated.filter((entry) => {
      const time = entry.time
      return (time >= "11:00" && time <= "23:59") || (time >= "00:00" && time <= "06:00")
    })

    const grouped: Record<string, AggregatedData[]> = {}
    validTimes.forEach((entry) => {
      if (!grouped[entry.type]) {
        grouped[entry.type] = []
      }
      grouped[entry.type].push(entry)
    })

    const validTimeOrder = Array.from(new Set(validTimes.map((entry) => entry.time))).sort((a, b) => {
      if (a >= "12:00" && b >= "12:00") return a.localeCompare(b)
      if (a < "12:00" && b < "12:00") return a.localeCompare(b)
      return a >= "12:00" ? -1 : 1
    })

    setGroupedData(grouped)
    setTimeOrder(validTimeOrder)
  }

  const handleDateNavigation = (direction: "forward" | "backward") => {
    const currentDate = new Date(selectedDate)
    if (direction === "forward") {
      currentDate.setDate(currentDate.getDate() + 1)
    } else if (direction === "backward") {
      currentDate.setDate(currentDate.getDate() - 1)
    }

    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, "0")
    const day = String(currentDate.getDate()).padStart(2, "0")
    setSelectedDate(`${year}-${month}-${day}`)
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

  const getTotalForType = (type: string) => {
    return groupedData[type]?.reduce((sum, entry) => sum + entry.totalGuests, 0) || 0
  }

  const getGrandTotal = () => {
    return Object.values(groupedData)
      .flat()
      .reduce((sum, entry) => sum + entry.totalGuests, 0)
  }

  return (
    <Page>
      <PageHeader>
        <Box display="flex" alignItems="center" gap={2}>
          <Assessment color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Numbers Breakdown
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {formatDate(selectedDate)}
            </Typography>
          </Box>
        </Box>
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
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
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

        <Button variant="contained" startIcon={<Print />} onClick={() => window.print()} sx={{ minWidth: 120 }}>
          Print
        </Button>
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

      {!loading && !error && Object.keys(groupedData).length > 0 && (
        <Card id="printable-content">
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Guest Count Summary
              </Typography>
              <Chip label={`Total: ${getGrandTotal()} guests`} color="primary" variant="filled" />
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ color: "primary.contrastText", fontWeight: "bold" }}>Time</TableCell>
                    {Object.keys(groupedData).map((type) => (
                      <TableCell
                        key={type}
                        sx={{ color: "primary.contrastText", fontWeight: "bold", textAlign: "center" }}
                      >
                        {type}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timeOrder.map((time) => (
                    <TableRow
                      key={time}
                      sx={{
                        "&:nth-of-type(odd)": { bgcolor: "action.hover" },
                        "&:hover": { bgcolor: "action.selected" },
                      }}
                    >
                      <TableCell sx={{ fontWeight: "medium" }}>{time}</TableCell>
                      {Object.keys(groupedData).map((type) => {
                        const entry = groupedData[type].find((data) => data.time === time)
                        return (
                          <TableCell key={type} sx={{ textAlign: "center" }}>
                            {entry ? entry.totalGuests : 0}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: "primary.light" }}>
                    <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText" }}>Total</TableCell>
                    {Object.keys(groupedData).map((type) => (
                      <TableCell
                        key={type}
                        sx={{
                          fontWeight: "bold",
                          textAlign: "center",
                          color: "primary.contrastText",
                        }}
                      >
                        {getTotalForType(type)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {!loading && !error && Object.keys(groupedData).length === 0 && selectedDate && (
        <Card>
          <CardContent>
            <Typography textAlign="center" color="text.secondary">
              No matching bookings found for this date.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Page>
  )
}

export default NumbersPage
