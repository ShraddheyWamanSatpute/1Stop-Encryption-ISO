"use client"

import type React from "react"
import { useState, useMemo } from "react"
import {
  Box,
  Typography,
  Grid,
  Divider,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from "@mui/material"

interface RunsheetProps {
  bookings: Record<string, any>
  globalSearch: string
  runsheetSort: string
  setRunsheetSort: (sort: string) => void
}

// Utility to access object fields case-insensitively
const getFieldValue = (obj: Record<string, any>, field: string): any => {
  const lowerCaseField = field.toLowerCase()
  const matchingKey = Object.keys(obj).find((key) => key.toLowerCase() === lowerCaseField)
  return matchingKey ? obj[matchingKey] : undefined
}

const Runsheet: React.FC<RunsheetProps> = ({ bookings, globalSearch, runsheetSort, setRunsheetSort }) => {
  const normalizedSearch = globalSearch.toLowerCase()

  const [selectedWaiters, setSelectedWaiters] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  const assignedWaiters = useMemo(() => {
    const waitersSet = new Set<string>()
    Object.entries(bookings).forEach(([_, bookingData]) => {
      const assignedTo =
        getFieldValue(bookingData, "assignedTo") ||
        getFieldValue(bookingData, "assigned to") ||
        getFieldValue(bookingData, "waiter")
      if (assignedTo) waitersSet.add(String(assignedTo).trim())
    })
    return Array.from(waitersSet)
  }, [bookings])

  const bookingStatuses = useMemo(() => {
    const statusesSet = new Set<string>()
    Object.entries(bookings).forEach(([_, bookingData]) => {
      const status = getFieldValue(bookingData, "status") || getFieldValue(bookingData, "Status")
      if (status) statusesSet.add(String(status).trim())
    })
    return Array.from(statusesSet)
  }, [bookings])

  const filteredBookings = Object.entries(bookings)
    .filter(([key, value]) => {
      const tableNumber = getFieldValue(value, "tableNumber") || ""
      const time = getFieldValue(value, "Time") || ""
      const assignedTo = String(
        getFieldValue(value, "assignedTo") ||
          getFieldValue(value, "assigned to") ||
          getFieldValue(value, "waiter") ||
          "",
      ).trim()
      const status = String(getFieldValue(value, "status") || getFieldValue(value, "Status") || "").trim()

      const searchMatch =
        key.toLowerCase().includes(normalizedSearch) ||
        tableNumber.toLowerCase().includes(normalizedSearch) ||
        time.toLowerCase().includes(normalizedSearch)

      const waiterMatch = selectedWaiters.length === 0 || selectedWaiters.includes(assignedTo)
      const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(status)

      return searchMatch && waiterMatch && statusMatch
    })
    .sort(([keyA, valueA], [keyB, valueB]) => {
      const timeA = getFieldValue(valueA, "Time") || ""
      const timeB = getFieldValue(valueB, "Time") || ""
      const tableA = getFieldValue(valueA, "tableNumber") || ""
      const tableB = getFieldValue(valueB, "tableNumber") || ""

      if (runsheetSort === "time") return timeA.toLowerCase().localeCompare(timeB.toLowerCase())
      if (runsheetSort === "name") return keyA.toLowerCase().localeCompare(keyB.toLowerCase())
      if (runsheetSort === "tableNumber") return tableA.toLowerCase().localeCompare(tableB.toLowerCase())
      return 0
    })

  const renderActionLabels = (labels: string) =>
    labels
      .split(",")
      .filter((label) => label.trim() !== "") // Avoid empty labels
      .map((label, index) => (
        <Chip key={index} label={label.trim()} sx={{ margin: "2px", border: "1px solid gray", borderRadius: "4px" }} />
      ))

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Assigned Waiter</InputLabel>
          <Select
            multiple
            value={selectedWaiters}
            onChange={(e) =>
              setSelectedWaiters(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value)
            }
            input={<OutlinedInput label="Filter by Assigned Waiter" />}
            renderValue={(selected) => (selected as string[]).join(", ")}
          >
            {assignedWaiters.map((waiter: string) => (
              <MenuItem key={waiter} value={waiter}>
                <Checkbox checked={selectedWaiters.indexOf(waiter) > -1} />
                <ListItemText primary={waiter} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            multiple
            value={selectedStatuses}
            onChange={(e) =>
              setSelectedStatuses(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value)
            }
            input={<OutlinedInput label="Filter by Status" />}
            renderValue={(selected) => (selected as string[]).join(", ")}
          >
            {bookingStatuses.map((status: string) => (
              <MenuItem key={status} value={status}>
                <Checkbox checked={selectedStatuses.indexOf(status) > -1} />
                <ListItemText primary={status} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TextField
        select
        label="Sort Runsheet By"
        value={runsheetSort}
        onChange={(e) => setRunsheetSort(e.target.value)}
        fullWidth
        margin="normal"
      >
        <MenuItem value="time">Time</MenuItem>
        <MenuItem value="name">Name</MenuItem>
        <MenuItem value="tableNumber">Table Number</MenuItem>
      </TextField>

      <Typography variant="h5" gutterBottom>
        Runsheet Details
      </Typography>
      {filteredBookings.map(([bookingName, bookingData]) => {
        const guests = getFieldValue(bookingData, "Guests") || "N/A"
        const area = getFieldValue(bookingData, "Area") || "N/A"
        const tableNumber = getFieldValue(bookingData, "tableNumber") || "N/A"
        const time = getFieldValue(bookingData, "Time") || "N/A"
        const phone = getFieldValue(bookingData, "Phone")
        const ref = getFieldValue(bookingData, "Ref")
        const company = getFieldValue(bookingData, "Company")
        const actionLabel = getFieldValue(bookingData, "action label") || ""
        const type = getFieldValue(bookingData, "Type") || "N/A"
        const notes = getFieldValue(bookingData, "run sheet notes")
        const customerRequests = getFieldValue(bookingData, "customer requests") || ""
        const deposits = getFieldValue(bookingData, "Deposits")

        return (
          <Box
            key={bookingName}
            sx={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              marginBottom: "16px",
              padding: "16px",
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={2}>
                <Typography variant="body1" fontWeight="bold">
                  {bookingName}
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {tableNumber}
                </Typography>
                {getFieldValue(bookingData, "assignedTo") ||
                getFieldValue(bookingData, "assigned to") ||
                getFieldValue(bookingData, "waiter") ? (
                  <Chip
                    label={`Waiter: ${getFieldValue(bookingData, "assignedTo") || getFieldValue(bookingData, "assigned to") || getFieldValue(bookingData, "waiter")}`}
                    size="small"
                    color="primary"
                    sx={{ mt: 0.5, fontSize: "0.75rem" }}
                  />
                ) : null}
                {getFieldValue(bookingData, "status") || getFieldValue(bookingData, "Status") ? (
                  <Chip
                    label={`Status: ${getFieldValue(bookingData, "status") || getFieldValue(bookingData, "Status")}`}
                    size="small"
                    color="secondary"
                    sx={{ mt: 0.5, ml: 0.5, fontSize: "0.75rem" }}
                  />
                ) : null}
              </Grid>
              <Grid item xs={1.5}>
                <Typography variant="body1" fontWeight="bold">
                  {guests} Covers
                </Typography>
              </Grid>
              <Grid item xs={1}>
                <Typography variant="body1" fontWeight="bold">
                  {time}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body1">{area}</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body1">{type}</Typography>
                <Typography variant="body1">{ref}</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography>{phone}</Typography>
                <Typography>{company}</Typography>
              </Grid>
            </Grid>

            <Divider sx={{ marginY: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box display="flex" flexWrap="wrap">
                  {renderActionLabels(actionLabel)}
                </Box>
              </Grid>
              <Grid item xs={5}>
                <Typography variant="body1" fontWeight="bold">
                  Notes:
                </Typography>
                <Typography>
                  {notes} {customerRequests && <span>{customerRequests}</span>}
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body1" fontWeight="bold">
                  Deposits:
                </Typography>
                <Typography>{deposits}</Typography>
              </Grid>
            </Grid>
          </Box>
        )
      })}
    </Box>
  )
}

export default Runsheet
