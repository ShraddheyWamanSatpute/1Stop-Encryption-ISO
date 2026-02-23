"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  CircularProgress,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  Card,
  CardContent,
  Chip,
  FormGroup,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material"
import { ref, get } from "firebase/database"
import { db as database } from "../services/firebase"
import { Page, PageHeader, Horizontal } from "../styles/StyledComponents"
import { Restaurant, Schedule, FilterList, ExpandMore } from "@mui/icons-material"

const timeRanges = [
  { label: "12:00", start: "12:00", end: "14:29" },
  { label: "14:30", start: "14:30", end: "16:59" },
  { label: "17:00", start: "17:00", end: "19:29" },
  { label: "19:30", start: "19:30", end: "21:29" },
  { label: "21:30", start: "21:30", end: "05:00" },
]

interface AggregatedData {
  name: string
  quantity: number
  type: string
  variations?: Record<string, number> // For grouped items like aged sirloin steak
}

// Helper function to normalize item names for comparison
const normalizeItemName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim()
}

// Helper function to check if two item names are similar
const areSimilarNames = (name1: string, name2: string): boolean => {
  const normalized1 = normalizeItemName(name1)
  const normalized2 = normalizeItemName(name2)

  // Check if names are identical after normalization
  if (normalized1 === normalized2) return true

  // Check if one is a substring of the other with very small difference
  if (Math.abs(normalized1.length - normalized2.length) <= 2) {
    const longer = normalized1.length >= normalized2.length ? normalized1 : normalized2
    const shorter = normalized1.length < normalized2.length ? normalized1 : normalized2

    // Check if shorter is contained in longer
    if (longer.includes(shorter)) return true

    // Check for small differences (1-2 characters)
    let differences = 0
    for (let i = 0, j = 0; i < longer.length && j < shorter.length; ) {
      if (longer[i] === shorter[j]) {
        i++
        j++
      } else {
        differences++
        if (differences > 2) return false
        i++
      }
    }
    return true
  }

  return false
}

const ItemSummaryPage: React.FC = () => {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [itemSummaries, setItemSummaries] = useState<Record<string, AggregatedData[]>>({})
  const [selectedRanges, setSelectedRanges] = useState<string[]>([])
  const [filterType, setFilterType] = useState<string>("All")

  useEffect(() => {
    if (startDate && endDate) {
      fetchDataInRange()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, selectedRanges])

  const fetchDataInRange = async () => {
    setLoading(true)
    setError(null)

    try {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const dataInRange: Record<string, any> = {}

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0]
        const dateRef = ref(database, `RunsheetsAndPreorders/${dateStr}`)
        const snapshot = await get(dateRef)
        if (snapshot.exists()) {
          dataInRange[dateStr] = snapshot.val()
        }
      }

      calculateSummaries(dataInRange)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const calculateSummaries = (data: Record<string, any>) => {
    const itemMap: Record<
      string,
      { name: string; quantity: number; type: string; variations?: Record<string, number> }
    > = {}

    // Define standard cooking temperatures in order
    const cookingTemps = ["B", "R", "M/R", "M", "M/W", "W"]

    // First pass: collect all items
    Object.values(data).forEach((dayData: any) => {
      const preorders = dayData.preorders || {}
      const runsheetTime = dayData.bookings ? (Object.values(dayData.bookings)[0] as { time: string })?.time || "" : ""
      Object.entries(preorders).forEach(([_, preorder]: [string, any]) => {
        preorder.items.forEach((item: any) => {
          if (!item.item || !item.quantity || Number.parseInt(item.quantity, 10) === 0) return
          if (selectedRanges.length === 0 || isTimeInRange(runsheetTime, selectedRanges)) {
            const quantity = Number.parseInt(item.quantity, 10) || 0

            // Check if this is an aged sirloin steak item
            if (item.item.toLowerCase().includes("aged sirloin steak")) {
              const baseKey = `${item.type}_aged_sirloin_steak`

              // Extract variation from brackets
              const bracketMatch = item.item.match(/$$([^)]+)$$/)
              const variation = bracketMatch ? bracketMatch[1].trim() : "Medium" // Default to Medium if not specified

              if (!itemMap[baseKey]) {
                itemMap[baseKey] = {
                  name: "Aged Sirloin Steak",
                  quantity: 0,
                  type: item.type || "Other",
                  variations: {},
                }
              }

              itemMap[baseKey].quantity += quantity
              if (!itemMap[baseKey].variations) itemMap[baseKey].variations = {}
              itemMap[baseKey].variations[variation] = (itemMap[baseKey].variations[variation] || 0) + quantity
            } else {
              // Regular item handling
              const key = `${item.type}_${item.item}`
              if (!itemMap[key]) {
                itemMap[key] = { name: item.item, quantity: 0, type: item.type || "Other" }
              }
              itemMap[key].quantity += quantity
            }
          }
        })
      })
    })

    // Second pass: combine similar items
    const combinedItems: Record<string, AggregatedData> = {}

    Object.values(itemMap).forEach((item) => {
      // Create a normalized key for comparison
      const normalizedName = normalizeItemName(item.name)
      const key = `${item.type}_${normalizedName}`

      // Check if we already have a similar item
      let foundSimilar = false
      for (const existingKey in combinedItems) {
        const existingItem = combinedItems[existingKey]
        if (existingItem.type === item.type && areSimilarNames(existingItem.name, item.name)) {
          // Combine quantities
          existingItem.quantity += item.quantity

          // Combine variations if they exist
          if (item.variations) {
            if (!existingItem.variations) existingItem.variations = {}

            Object.entries(item.variations).forEach(([variation, count]) => {
              existingItem.variations![variation] = (existingItem.variations![variation] || 0) + count
            })
          }

          foundSimilar = true
          break
        }
      }

      if (!foundSimilar) {
        combinedItems[key] = { ...item }
      }
    })

    // Sort the steak variations by cooking temperature
    Object.values(combinedItems).forEach((item) => {
      if (item.variations) {
        const sortedVariations: Record<string, number> = {}

        // First add standard cooking temps in order
        cookingTemps.forEach((temp) => {
          if (item.variations && item.variations[temp]) {
            sortedVariations[temp] = item.variations[temp]
          }
        })

        // Then add any other variations that don't match standard temps
        Object.entries(item.variations).forEach(([variation, count]) => {
          if (!cookingTemps.includes(variation)) {
            sortedVariations[variation] = count
          }
        })

        item.variations = sortedVariations
      }
    })

    // Group and sort items alphabetically by name
    const groupedItems = groupItemsByType(Object.values(combinedItems))

    // Sort each category alphabetically by name
    Object.keys(groupedItems).forEach((type) => {
      groupedItems[type].sort((a, b) => a.name.localeCompare(b.name))
    })

    setItemSummaries(groupedItems)
  }

  const isTimeInRange = (time: string, ranges: string[]): boolean => {
    if (!time) return false
    const [hours, minutes] = time.split(":").map(Number)
    const timeValue = hours * 60 + minutes
    return ranges.some((rangeLabel) => {
      const range = timeRanges.find((r) => r.label === rangeLabel)
      if (!range) return false
      const [startH, startM] = range.start.split(":").map(Number)
      const [endH, endM] = range.end.split(":").map(Number)
      const startValue = startH * 60 + startM
      const endValue = endH < startH ? 24 * 60 + endH * 60 + endM : endH * 60 + endM
      return timeValue >= startValue && timeValue <= endValue
    })
  }

  const groupItemsByType = (items: any[]): Record<string, any[]> => {
    const grouped: Record<string, any[]> = {
      Starters: [],
      Mains: [],
      Desserts: [],
      Drinks: [],
      Other: [],
    }

    items.forEach((item) => {
      const type = item.type?.toLowerCase() || "other"
      if (type === "starter") grouped.Starters.push(item)
      else if (type === "main") grouped.Mains.push(item)
      else if (type === "dessert") grouped.Desserts.push(item)
      else if (type === "drink") grouped.Drinks.push(item)
      else grouped.Other.push(item)
    })

    return grouped
  }

  const toggleRange = (label: string) => {
    setSelectedRanges((prev) => (prev.includes(label) ? prev.filter((r) => r !== label) : [...prev, label]))
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Starters: "success",
      Mains: "primary",
      Desserts: "secondary",
      Drinks: "info",
      Other: "default",
    }
    return colors[type] || "default"
  }

  const getTotalItems = (type: string) => {
    return itemSummaries[type]?.reduce((sum, item) => sum + item.quantity, 0) || 0
  }

  const renderSummaries = () => {
    const typesToRender = filterType === "All" ? Object.keys(itemSummaries) : [filterType]

    return (
      <Grid container spacing={3}>
        {typesToRender.map((type) => {
          const items = Array.isArray(itemSummaries[type]) ? itemSummaries[type] : []
          if (items.length === 0) return null

          return (
            <Grid item xs={12} sm={6} md={4} key={type}>
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
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Restaurant color="primary" />
                      <Typography variant="h6" fontWeight="bold">
                        {type}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${getTotalItems(type)} total`}
                      color={getTypeColor(type) as any}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                    {items.map((item, index) => (
                      <Box key={`${type}-${index}`}>
                        {item.variations ? (
                          // Render grouped item (aged sirloin steak)
                          <Accordion sx={{ mb: 1, boxShadow: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                <Typography variant="body2" fontWeight="medium">
                                  {item.name}
                                </Typography>
                                <Chip
                                  label={`×${item.quantity}`}
                                  size="small"
                                  color={getTypeColor(type) as any}
                                  variant="filled"
                                  sx={{ mr: 1 }}
                                />
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                {Object.entries(item.variations).map(([variation, qty]) => (
                                  <Box
                                    key={variation}
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      p: 1,
                                      bgcolor: "background.default",
                                      borderRadius: 1,
                                    }}
                                  >
                                    <Typography variant="caption" color="text.secondary">
                                      {variation}
                                    </Typography>
                                    <Chip label={`×${qty}`} size="small" variant="outlined" />
                                  </Box>
                                ))}
                              </Box>
                            </AccordionDetails>
                          </Accordion>
                        ) : (
                          // Render regular item
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              mb: 1,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              bgcolor: "background.default",
                              "&:hover": { bgcolor: "action.hover" },
                            }}
                          >
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              {item.name}
                            </Typography>
                            <Chip
                              label={`×${item.quantity}`}
                              size="small"
                              color={getTypeColor(type) as any}
                              variant="filled"
                            />
                          </Paper>
                        )}
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    )
  }

  return (
    <Page>
      <PageHeader>
        <Box display="flex" alignItems="center" gap={2}>
          <Restaurant color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Item Summary
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Aggregated preorder quantities by category
            </Typography>
          </Box>
        </Box>
      </PageHeader>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
            <FilterList />
            Filters
          </Typography>

          <Horizontal sx={{ mb: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              select
              label="Filter by Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              fullWidth
            >
              <MenuItem value="All">All Categories</MenuItem>
              {Object.keys(itemSummaries).map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
          </Horizontal>

          <Box>
            <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
              <Schedule />
              Time Ranges
            </Typography>
            <FormGroup row>
              {timeRanges.map((range) => (
                <FormControlLabel
                  key={range.label}
                  control={
                    <Checkbox
                      checked={selectedRanges.includes(range.label)}
                      onChange={() => toggleRange(range.label)}
                      size="small"
                    />
                  }
                  label={range.label}
                />
              ))}
            </FormGroup>
          </Box>
        </CardContent>
      </Card>

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

      {!loading && !error && renderSummaries()}

      {!loading && !error && Object.keys(itemSummaries).length === 0 && startDate && endDate && (
        <Card>
          <CardContent>
            <Typography textAlign="center" color="text.secondary">
              No items found for the selected date range and filters.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Page>
  )
}

export default ItemSummaryPage
