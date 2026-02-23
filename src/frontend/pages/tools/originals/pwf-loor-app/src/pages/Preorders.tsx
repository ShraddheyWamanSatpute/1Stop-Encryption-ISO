"use client"

import type React from "react"
import { useState, useMemo } from "react"
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Chip,
} from "@mui/material"

interface PreordersProps {
  preorders: Record<string, any>
  runsheet: Record<string, any>
  globalSearch: string
  preorderFilter: string
  setPreorderFilter: (filter: string) => void
}

// Utility functions (getTimeValue, getFieldValue, etc.) remain similar.
const getTimeValue = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number)
  return hours < 6 ? hours + 24 + minutes / 60 : hours + minutes / 60
}

const getFieldValue = (obj: Record<string, any>, field: string): any => {
  const lowerCaseField = field.toLowerCase()
  const matchingKey = Object.keys(obj).find((key) => key.toLowerCase() === lowerCaseField)
  return matchingKey ? obj[matchingKey] : undefined
}

const groupPreordersByType = (items: any[]) => {
  const grouped: Record<string, any[]> = {
    Starters: [],
    Mains: [],
    Desserts: [],
    Drinks: [],
    Other: [],
  }
  items.forEach((item) => {
    const normalizedType = item.type?.toLowerCase()
    if (normalizedType === "starter") grouped.Starters.push(item)
    else if (normalizedType === "main") grouped.Mains.push(item)
    else if (normalizedType === "dessert") grouped.Desserts.push(item)
    else if (normalizedType === "drink") grouped.Drinks.push(item)
    else grouped.Other.push(item)
  })
  return grouped
}

const Preorders: React.FC<PreordersProps> = ({
  preorders,
  runsheet,
  globalSearch,
  preorderFilter,
  setPreorderFilter,
}) => {
  const [selectedWaiters, setSelectedWaiters] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  const assignedWaiters = useMemo(() => {
    const waitersSet = new Set<string>()
    Object.entries(runsheet).forEach(([_, runsheetData]) => {
      const assignedTo =
        getFieldValue(runsheetData, "assignedTo") ||
        getFieldValue(runsheetData, "assigned to") ||
        getFieldValue(runsheetData, "waiter")
      if (assignedTo) waitersSet.add(String(assignedTo).trim())
    })
    return Array.from(waitersSet)
  }, [runsheet])

  const bookingStatuses = useMemo(() => {
    const statusesSet = new Set<string>()
    Object.entries(runsheet).forEach(([_, runsheetData]) => {
      const status = getFieldValue(runsheetData, "status") || getFieldValue(runsheetData, "Status")
      if (status) statusesSet.add(String(status).trim())
    })
    return Array.from(statusesSet)
  }, [runsheet])

  const filteredPreorders = Object.entries(preorders)
    .map(([name, preorderData]) => {
      const groupedItems = groupPreordersByType(preorderData.items)
      const runsheetEntry = runsheet[name] || {}
      const time = getFieldValue(runsheetEntry, "time") || "Unknown Time"
      const assignedTo = String(
        getFieldValue(runsheetEntry, "assignedTo") ||
          getFieldValue(runsheetEntry, "assigned to") ||
          getFieldValue(runsheetEntry, "waiter") ||
          "",
      ).trim()
      const status = String(
        getFieldValue(runsheetEntry, "status") || getFieldValue(runsheetEntry, "Status") || "",
      ).trim()

      const filteredGroupedItems = Object.entries(groupedItems).reduce(
        (acc, [type, items]) => {
          if (preorderFilter === "All" || preorderFilter === type) {
            const filteredItems = items.filter((item) => item.item.toLowerCase().includes(globalSearch.toLowerCase()))
            if (filteredItems.length > 0) acc[type] = filteredItems
          }
          return acc
        },
        {} as Record<string, any[]>,
      )

      return { name, groupedItems: filteredGroupedItems, runsheetEntry, time, assignedTo, status }
    })
    .filter(({ groupedItems, assignedTo, status }) => {
      const hasItems = Object.keys(groupedItems).length > 0
      const waiterMatch = selectedWaiters.length === 0 || selectedWaiters.includes(assignedTo)
      const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(status)
      return hasItems && waiterMatch && statusMatch
    })
    .sort((a, b) => getTimeValue(a.time) - getTimeValue(b.time))

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <TextField
          select
          label="Filter Preorders By Type"
          value={preorderFilter}
          onChange={(e) => setPreorderFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="Starters">Starters</MenuItem>
          <MenuItem value="Mains">Mains</MenuItem>
          <MenuItem value="Desserts">Desserts</MenuItem>
          <MenuItem value="Drinks">Drinks</MenuItem>
          <MenuItem value="Other">Other</MenuItem>
        </TextField>

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

      <Box>
        {filteredPreorders.map(({ name, groupedItems, runsheetEntry, time, assignedTo, status }) => {
          const tableNumber = getFieldValue(runsheetEntry, "tableNumber")
          const guests = getFieldValue(runsheetEntry, "Guests")

          return (
            <Box
              key={name}
              mb={4}
              sx={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <Typography variant="h6" fontWeight="bold">
                {name}
                {tableNumber && `, ${tableNumber}`}
                {guests && `, ${guests} Covers`}
                {time && `, ${time}`}
              </Typography>

              <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                {assignedTo && <Chip label={`Waiter: ${assignedTo}`} size="small" color="primary" />}
                {status && <Chip label={`Status: ${status}`} size="small" color="secondary" />}
              </Box>

              {Object.entries(groupedItems).map(([type, items]) => (
                <Box key={type} mt={2}>
                  <Typography variant="body1" fontWeight="bold">
                    {type}
                  </Typography>
                  <Box display="flex" flexWrap="wrap">
                    {items.map((item, index) => (
                      <Box
                        key={index}
                        sx={{
                          border: "1px solid #ccc",
                          borderRadius: "8px",
                          padding: "8px",
                          margin: "4px",
                          minWidth: "200px",
                        }}
                      >
                        <Typography variant="body1">
                          {item.item} x{item.quantity}
                        </Typography>
                        {item.dietary && (
                          <Typography variant="body1" color="textSecondary">
                            <strong>Dietary:</strong> {item.dietary}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default Preorders
