"use client"

import type React from "react"
import { useState, useMemo } from "react"
import {
  Box,
  Typography,
  Divider,
  Grid,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Select,
  InputLabel,
  FormControl,
  OutlinedInput,
  ListItemText,
  Chip,
} from "@mui/material"

interface CombinedProps {
  bookings: Record<string, any>
  preorders: Record<string, any>
  globalSearch: string
  preorderFilter: string
  setGlobalSearch: React.Dispatch<React.SetStateAction<string>>
  setPreorderFilter: React.Dispatch<React.SetStateAction<string>>
}

const CombinedRunsheetPreorders: React.FC<CombinedProps> = ({
  bookings,
  preorders,
  globalSearch,
  preorderFilter,
  setGlobalSearch,
}) => {
  // Local states for additional filtering and sorting
  const [startTime, setStartTime] = useState<string>("12:00") // Default: noon
  const [endTime, setEndTime] = useState<string>("06:00") // Default: 6:00am (next day)
  const [selectedBookingTypes, setSelectedBookingTypes] = useState<string[]>([])
  const [selectedWaiters, setSelectedWaiters] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [sortOption, setSortOption] = useState<string>("name-asc") // Options: name-asc, name-desc, table-asc, table-desc, time-asc, time-desc
  const [showPreorders, setShowPreorders] = useState<boolean>(true)

  // Define getFieldValue as a function declaration (hoisted)
  function getFieldValue(obj: Record<string, any>, field: string): any {
    const lowerField = field.toLowerCase()
    const key = Object.keys(obj).find((k) => k.toLowerCase() === lowerField)
    return key ? obj[key] : undefined
  }

  // Compute unique booking types from bookings using ONLY the bookingType field.
  const bookingTypes = useMemo(() => {
    const typesSet = new Set<string>()
    Object.entries(bookings).forEach(([_, bookingData]) => {
      const type = getFieldValue(bookingData, "type")
      if (type) typesSet.add(String(type).trim())
    })
    return Array.from(typesSet)
  }, [bookings])

  // Compute unique assigned waiters from bookings
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

  // Compute unique statuses from bookings
  const bookingStatuses = useMemo(() => {
    const statusesSet = new Set<string>()
    Object.entries(bookings).forEach(([_, bookingData]) => {
      const status = getFieldValue(bookingData, "status") || getFieldValue(bookingData, "Status")
      if (status) statusesSet.add(String(status).trim())
    })
    return Array.from(statusesSet)
  }, [bookings])

  // Helper to extract the numeric portion from a table number string (e.g. "T12 - T15" returns 12)
  const parseTableNumber = (tableStr: string): number => {
    const match = tableStr.match(/T(\d+)/i)
    return match ? Number.parseInt(match[1], 10) : 0
  }

  // Group preorders by type (unchanged)
  const groupPreordersByType = (items: any[]): Record<string, any[]> => {
    const grouped: Record<string, any[]> = {
      Starters: [],
      Mains: [],
      Desserts: [],
      Drinks: [],
      Other: [],
    }

    const temperatureOrder = ["B", "R", "M/R", "M", "M/W", "W"]

    items.forEach((item) => {
      const normalizedType = item.type?.toLowerCase()
      if (normalizedType === "starter") grouped.Starters.push(item)
      else if (normalizedType === "main") grouped.Mains.push(item)
      else if (normalizedType === "dessert") grouped.Desserts.push(item)
      else if (normalizedType === "drink") grouped.Drinks.push(item)
      else grouped.Other.push(item)
    })

    grouped.Mains = grouped.Mains.sort((a, b) => {
      const tempA = extractTemperature(a.item)
      const tempB = extractTemperature(b.item)
      return temperatureOrder.indexOf(tempA) - temperatureOrder.indexOf(tempB)
    })

    return grouped
  }

  const extractTemperature = (itemName: string): string => {
    const match = itemName.match(/$$(B|R|M\/R|M|M\/W|W)$$/i)
    return match ? match[1].toUpperCase() : ""
  }

  // Utility to parse time (expects "HH:MM" format)
  const parseTime = (timeStr: string): number => {
    if (!timeStr) return Number.POSITIVE_INFINITY
    const [hours, minutes] = timeStr.split(":").map(Number)
    const timeValue = hours * 60 + minutes
    // For venue operating overnight, adjust times between 00:00 and 06:00 to next day
    if (hours >= 0 && hours < 6) return timeValue + 1440
    return timeValue
  }

  // Check if a booking's time is within the selected range.
  const isWithinTimeRange = (bookingTime: number, start: string, end: string): boolean => {
    const startMinutes = parseTime(start)
    const endMinutes = parseTime(end)
    if (startMinutes <= endMinutes) {
      return bookingTime >= startMinutes && bookingTime <= endMinutes
    } else {
      // Wrap-around (e.g., start: 18:00, end: 06:00 next day)
      return bookingTime >= startMinutes || bookingTime <= endMinutes
    }
  }

  // Filter bookings based on globalSearch, time range, selected booking types, and assigned waiters
  let filteredBookings = Object.entries(bookings).filter(([bookingName, bookingData]) => {
    const lowerSearch = globalSearch.toLowerCase()
    const nameMatch = bookingName.toLowerCase().includes(lowerSearch)
    const tableNumber = String(getFieldValue(bookingData, "tableNumber") || "").toLowerCase()
    const timeStr = String(getFieldValue(bookingData, "Time") || getFieldValue(bookingData, "time") || "")
    const bookingType = String(getFieldValue(bookingData, "type") || "").trim()
    const assignedTo = String(
      getFieldValue(bookingData, "assignedTo") ||
        getFieldValue(bookingData, "assigned to") ||
        getFieldValue(bookingData, "waiter") ||
        "",
    ).trim()

    const status = String(getFieldValue(bookingData, "status") || getFieldValue(bookingData, "Status") || "").trim()

    const bookingTime = parseTime(timeStr)
    const timeMatch = isWithinTimeRange(bookingTime, startTime, endTime)
    const typeMatch = selectedBookingTypes.length === 0 || selectedBookingTypes.includes(bookingType)
    const waiterMatch = selectedWaiters.length === 0 || selectedWaiters.includes(assignedTo)
    const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(status)

    return (
      (nameMatch || tableNumber.includes(lowerSearch) || timeStr.toLowerCase().includes(lowerSearch)) &&
      timeMatch &&
      typeMatch &&
      waiterMatch &&
      statusMatch
    )
  })

  // Sort filtered bookings based on sortOption.
  filteredBookings = filteredBookings.sort(([nameA, aData], [nameB, bData]) => {
    if (sortOption === "name-asc") {
      return nameA.toLowerCase().localeCompare(nameB.toLowerCase())
    } else if (sortOption === "name-desc") {
      return nameB.toLowerCase().localeCompare(nameA.toLowerCase())
    } else if (sortOption === "table-asc") {
      const aTableStr = String(getFieldValue(aData, "tableNumber") || "")
      const bTableStr = String(getFieldValue(bData, "tableNumber") || "")
      return parseTableNumber(aTableStr) - parseTableNumber(bTableStr)
    } else if (sortOption === "table-desc") {
      const aTableStr = String(getFieldValue(aData, "tableNumber") || "")
      const bTableStr = String(getFieldValue(bData, "tableNumber") || "")
      return parseTableNumber(bTableStr) - parseTableNumber(aTableStr)
    } else if (sortOption === "time-asc") {
      const aTimeStr = String(getFieldValue(aData, "Time") || getFieldValue(aData, "time") || "")
      const bTimeStr = String(getFieldValue(bData, "Time") || getFieldValue(bData, "time") || "")
      return parseTime(aTimeStr) - parseTime(bTimeStr)
    } else if (sortOption === "time-desc") {
      const aTimeStr = String(getFieldValue(aData, "Time") || getFieldValue(aData, "time") || "")
      const bTimeStr = String(getFieldValue(bData, "Time") || getFieldValue(bData, "time") || "")
      return parseTime(bTimeStr) - parseTime(aTimeStr)
    }
    return 0
  })

  return (
    <Box>
      {/* Persistent header controls */}
      <Box sx={{ borderBottom: "1px solid #ccc", paddingBottom: 2, marginBottom: 2 }}>
        <TextField
          label="Search Bookings"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          variant="outlined"
          fullWidth
          sx={{ mb: 1, fontSize: { xs: "0.75rem", sm: "1rem" } }}
        />
        <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
          <TextField
            label="Start Time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }}
            fullWidth
            sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}
          />
          <TextField
            label="End Time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }}
            fullWidth
            sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}
          />
        </Box>
        <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}>Filter by Booking Type</InputLabel>
            <Select
              multiple
              value={selectedBookingTypes}
              onChange={(e) =>
                setSelectedBookingTypes(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value)
              }
              input={<OutlinedInput label="Filter by Booking Type" />}
              renderValue={(selected) => (selected as string[]).join(", ")}
              sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}
            >
              {bookingTypes.map((type: string) => (
                <MenuItem key={type} value={type}>
                  <Checkbox checked={selectedBookingTypes.indexOf(type) > -1} />
                  <ListItemText primary={type} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}>Filter by Assigned Waiter</InputLabel>
            <Select
              multiple
              value={selectedWaiters}
              onChange={(e) =>
                setSelectedWaiters(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value)
              }
              input={<OutlinedInput label="Filter by Assigned Waiter" />}
              renderValue={(selected) => (selected as string[]).join(", ")}
              sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}
            >
              {assignedWaiters.map((waiter: string) => (
                <MenuItem key={waiter} value={waiter}>
                  <Checkbox checked={selectedWaiters.indexOf(waiter) > -1} />
                  <ListItemText primary={waiter} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}>Filter by Status</InputLabel>
            <Select
              multiple
              value={selectedStatuses}
              onChange={(e) =>
                setSelectedStatuses(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value)
              }
              input={<OutlinedInput label="Filter by Status" />}
              renderValue={(selected) => (selected as string[]).join(", ")}
              sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}
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
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 1 }}>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}>Sort By</InputLabel>
            <Select
              value={sortOption}
              label="Sort By"
              onChange={(e) => setSortOption(e.target.value)}
              sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}
            >
              <MenuItem value="name-asc">Name Ascending</MenuItem>
              <MenuItem value="name-desc">Name Descending</MenuItem>
              <MenuItem value="table-asc">Table Number Ascending</MenuItem>
              <MenuItem value="table-desc">Table Number Descending</MenuItem>
              <MenuItem value="time-asc">Time Ascending</MenuItem>
              <MenuItem value="time-desc">Time Descending</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={showPreorders}
                onChange={(e) => setShowPreorders(e.target.checked)}
                sx={{ "& .MuiSvgIcon-root": { fontSize: { xs: "1rem", sm: "inherit" } } }}
              />
            }
            label="Show Preorders"
            sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}
          />
        </Box>
      </Box>

      {/* Render each booking with runsheet layout */}
      {filteredBookings.map(([bookingName, bookingData]) => {
        const guests = getFieldValue(bookingData, "Guests") || "N/A"
        const area = getFieldValue(bookingData, "Area") || "N/A"
        const tableNumber = getFieldValue(bookingData, "tableNumber") || "N/A"
        const time = getFieldValue(bookingData, "Time") || "N/A"
        const phone = getFieldValue(bookingData, "Phone")
        const refVal = getFieldValue(bookingData, "Ref")
        const company = getFieldValue(bookingData, "Company")
        const actionLabel = getFieldValue(bookingData, "action label") || ""
        const type = getFieldValue(bookingData, "Type") || "N/A"
        const notes = getFieldValue(bookingData, "run sheet notes")
        const customerRequests = getFieldValue(bookingData, "customer requests") || ""
        const deposits = getFieldValue(bookingData, "Deposits")
        const assignedTo =
          getFieldValue(bookingData, "assignedTo") ||
          getFieldValue(bookingData, "assigned to") ||
          getFieldValue(bookingData, "waiter")

        const status = getFieldValue(bookingData, "status") || getFieldValue(bookingData, "Status")

        // Get preorder data for the booking (if any)
        const preorderData = preorders[bookingName]
        const groupedItems = preorderData ? groupPreordersByType(preorderData.items) : {}
        const filteredGroupedItems = Object.entries(groupedItems).reduce(
          (acc, [groupType, items]) => {
            if (preorderFilter === "All" || preorderFilter === groupType) {
              const filteredItems = items.filter((item: any) =>
                item.item.toLowerCase().includes(globalSearch.toLowerCase()),
              )
              if (filteredItems.length > 0) acc[groupType] = filteredItems
            }
            return acc
          },
          {} as Record<string, any[]>,
        )

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
              <Grid item xs={2.5}>
                <Typography variant="body1" fontWeight="bold" sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}>
                  {bookingName}
                </Typography>
                <Typography variant="body1" fontWeight="bold" sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}>
                  {tableNumber}
                </Typography>
              </Grid>
              <Grid item xs={1.5}>
                <Typography variant="body1" fontWeight="bold" sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}>
                  {guests} Covers
                </Typography>
              </Grid>
              <Grid item xs={1.5}>
                <Typography variant="body1" fontWeight="bold" sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}>
                  {time}
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body1" sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}>
                  {area}
                </Typography>
                {assignedTo && (
                  <Chip
                    label={`Waiter: ${assignedTo}`}
                    size="small"
                    color="primary"
                    sx={{ mt: 0.5, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                  />
                )}
                {status && (
                  <Chip
                    label={`Status: ${status}`}
                    size="small"
                    color="secondary"
                    sx={{ mt: 0.5, ml: 0.5, fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                  />
                )}
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body1" sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}>
                  {type}
                </Typography>
                <Typography variant="body1" sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}>
                  {refVal}
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body1" sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}>
                  {phone}
                </Typography>
                <Typography variant="body1" sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}>
                  {company}
                </Typography>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box display="flex" flexWrap="wrap">
                  {actionLabel
                    .split(",")
                    .filter((label: string) => label.trim() !== "")
                    .map((label: string, idx: React.Key | null | undefined) => (
                      <Typography
                        key={idx}
                        variant="body2"
                        sx={{
                          margin: "2px",
                          border: "1px solid gray",
                          borderRadius: "4px",
                          padding: "2px 4px",
                          fontSize: { xs: "0.65rem", sm: "0.875rem" },
                        }}
                      >
                        {label.trim()}
                      </Typography>
                    ))}
                </Box>
              </Grid>
              <Grid item xs={5}>
                <Typography variant="body1" fontWeight="bold" sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}>
                  Notes:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: { xs: "0.65rem", sm: "0.875rem" } }}>
                  {notes} {customerRequests && <span>{customerRequests}</span>}
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body1" fontWeight="bold" sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}>
                  Deposits:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: { xs: "0.65rem", sm: "0.875rem" } }}>
                  {deposits}
                </Typography>
              </Grid>
            </Grid>

            {showPreorders && Object.keys(filteredGroupedItems).length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body1" fontWeight="bold" sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}>
                  Preorders:
                </Typography>
                {Object.entries(filteredGroupedItems).map(([groupType, items]) => (
                  <Box key={groupType} mt={2}>
                    <Typography variant="body1" fontWeight="bold" sx={{ fontSize: { xs: "0.75rem", sm: "1rem" } }}>
                      {groupType}
                    </Typography>
                    <Box display="flex" flexWrap="wrap">
                      {items.map((item, index) => (
                        <Box
                          key={index}
                          sx={{
                            border: "1px solid #ccc",
                            borderRadius: "20px",
                            padding: "8px",
                            margin: "4px",
                            minWidth: "150px",
                          }}
                        >
                          <Typography variant="body1" sx={{ fontSize: { xs: "0.65rem", sm: "0.875rem" } }}>
                            <strong>{item.item}</strong> (x{item.quantity})
                          </Typography>
                          <Typography variant="body1" sx={{ fontSize: { xs: "0.65rem", sm: "0.875rem" } }}>
                            {item.dietary}
                          </Typography>
                          {item.for && (
                            <Box sx={{ paddingLeft: "8px", marginTop: "4px" }}>
                              <details>
                                <summary style={{ fontSize: "inherit" }}></summary>
                                <Typography variant="body2" sx={{ fontSize: { xs: "0.65rem", sm: "0.875rem" } }}>
                                  {item.for}
                                </Typography>
                              </details>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </>
            )}
          </Box>
        )
      })}
    </Box>
  )
}

export default CombinedRunsheetPreorders
