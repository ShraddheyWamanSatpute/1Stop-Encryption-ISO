"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material"
import {
  Restaurant,
  TableRestaurant,
  Schedule,
  CheckCircle,
  Cancel,
  NavigateBefore,
  NavigateNext,
  Today,
  Print,
  Refresh,
  Kitchen,
  LocalDining,
} from "@mui/icons-material"
import { ref, onValue, update } from "firebase/database"
import { db } from "../services/firebase"
import { format, addDays, subDays } from "date-fns"

interface Booking {
  id: string
  name: string
  covers: number
  tableNumber: string
  time: string
  type?: string
  status?: "not_arrived" | "ready" | "served"
  brunchSharesStatus?: "not_arrived" | "ready" | "served"
}

interface ShareRequirement {
  pizzaSlices: number
  halloumiPortions: number
  olivePortions: number
  breadPortions: number
  houmousPortions: number
  wingsPortions: number
}

interface ServingItemDetail {
  small: number
  medium: number
  large: number
  tables: string[]
}

interface ServingItems {
  pizzaBoards: ServingItemDetail
  olivePlates: ServingItemDetail
  houmousTrays: ServingItemDetail
  wingsBowls: { small: number; large: number; tables: string[] }
}

const BrunchSharesPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | "not_arrived" | "ready" | "served">("all")

  // Table capacity mapping
  const getTableCapacity = (tableNumber: string): number => {
    const tables = tableNumber.split(/[,-]/).map((t) => Number.parseInt(t.trim().replace(/[^\d]/g, "")))
    let totalCapacity = 0

    for (const table of tables) {
      if (table >= 1 && table <= 3) {
        // Tables 1-3: normally 3 each, but can be 14 (table 1) and 8 (table 3) for large bookings
        if (table === 1) totalCapacity += 14
        else if (table === 3) totalCapacity += 8
        else totalCapacity += 3
      } else if (table === 4 || table === 5) {
        totalCapacity += 8
      } else if (table >= 6 && table <= 23) {
        // Lower area: evens=8, odds=4, except 9/15/21=2
        if ([9, 15, 21].includes(table)) totalCapacity += 2
        else if (table % 2 === 0) totalCapacity += 8
        else totalCapacity += 4
      } else if (table >= 30 && table <= 39) {
        totalCapacity += 10
      } else if (table >= 40 && table <= 47) {
        totalCapacity += 3
      } else if (table === 48 || table === 49) {
        totalCapacity += 6
      } else if (table >= 50 && table <= 52) {
        totalCapacity += 2
      } else if (table >= 53 && table <= 56) {
        totalCapacity += 4
      } else if (table >= 57 && table <= 60) {
        totalCapacity += 6
      }
    }

    return totalCapacity || 1
  }

  // Check if booking is at 13:00 (1 PM) only
  const is1PMBooking = (booking: any): boolean => {
    const time = booking.time || ""

    // Check for various 1 PM formats
    return (
      time.includes("13:00") ||
      time.includes("1:00") ||
      time.includes("1 PM") ||
      time.includes("1pm") ||
      time === "13" ||
      time === "1"
    )
  }

  // Calculate sharing requirements for a booking
  const calculateShareRequirements = (covers: number): ShareRequirement => {
    return {
      pizzaSlices: covers * 2,
      halloumiPortions: covers * 2,
      olivePortions: Math.ceil(covers / 4), // 1 portion per 4 people (minimum 1)
      breadPortions: covers * 2,
      houmousPortions: Math.ceil(covers / 4), // 1 portion per 4 people (minimum 1)
      wingsPortions: covers,
    }
  }

  // Calculate serving items needed with table assignments and proper sizing
  const calculateServingItems = (covers: number, tableNumber: string): ServingItems => {
    const getPlateRequirements = (people: number) => {
      if (people <= 2) return { small: 1, medium: 0, large: 0 }
      if (people <= 6) return { small: 0, medium: 1, large: 0 }
      if (people <= 8) return { small: 0, medium: 0, large: 1 }

      // More than 8 people - need multiple plates
      const largePlates = Math.floor(people / 8)
      const remaining = people % 8
      let mediumPlates = 0
      let smallPlates = 0

      if (remaining > 6) {
        // 7-8 remaining, use another large
        return { small: 0, medium: 0, large: largePlates + 1 }
      } else if (remaining > 2) {
        // 3-6 remaining, use medium
        mediumPlates = 1
      } else if (remaining > 0) {
        // 1-2 remaining, use small
        smallPlates = 1
      }

      return { small: smallPlates, medium: mediumPlates, large: largePlates }
    }

    const getBowlRequirements = (people: number) => {
      if (people <= 4) return { small: 1, large: 0 }
      if (people <= 8) return { small: 0, large: 1 }

      // More than 8 people
      const largeBowls = Math.floor(people / 8)
      const remaining = people % 8

      if (remaining > 4) {
        return { small: 0, large: largeBowls + 1 }
      } else if (remaining > 0) {
        return { small: 1, large: largeBowls }
      }

      return { small: 0, large: largeBowls }
    }

    const plateReqs = getPlateRequirements(covers)
    const bowlReqs = getBowlRequirements(covers)

    return {
      pizzaBoards: {
        small: plateReqs.small,
        medium: plateReqs.medium,
        large: plateReqs.large,
        tables: plateReqs.small > 0 || plateReqs.medium > 0 || plateReqs.large > 0 ? [tableNumber] : [],
      },
      olivePlates: {
        small: plateReqs.small,
        medium: plateReqs.medium,
        large: plateReqs.large,
        tables: plateReqs.small > 0 || plateReqs.medium > 0 || plateReqs.large > 0 ? [tableNumber] : [],
      },
      houmousTrays: {
        small: plateReqs.small,
        medium: plateReqs.medium,
        large: plateReqs.large,
        tables: plateReqs.small > 0 || plateReqs.medium > 0 || plateReqs.large > 0 ? [tableNumber] : [],
      },
      wingsBowls: {
        small: bowlReqs.small,
        large: bowlReqs.large,
        tables: bowlReqs.small > 0 || bowlReqs.large > 0 ? [tableNumber] : [],
      },
    }
  }

  // Fetch bookings for selected date
  useEffect(() => {
    setLoading(true)
    setError(null)

    const sanitizedDate = selectedDate.replace(/[.#$/[\]]/g, "_")
    const bookingsRef = ref(db, `RunsheetsAndPreorders/${sanitizedDate}/bookings`)

    const unsubscribe = onValue(
      bookingsRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const data = snapshot.val()
            const bookingList: Booking[] = Object.entries(data)
              .map(([key, booking]: [string, any]) => ({
                id: key,
                name: booking.name || key,
                covers: Number.parseInt(booking.covers) || getTableCapacity(booking.tableNumber || ""),
                tableNumber: booking.tableNumber || "",
                time: booking.time || "",
                type: booking.type || "",
                status: booking.brunchSharesStatus || "not_arrived",
                brunchSharesStatus: booking.brunchSharesStatus || "not_arrived",
              }))
              .filter(is1PMBooking) // Only show 1 PM bookings
              .sort((a, b) => {
                // Extract the first number from table number for sorting
                const getFirstTableNumber = (tableStr: string): number => {
                  const match = tableStr.match(/\d+/)
                  return match ? Number.parseInt(match[0]) : 999
                }

                const aTable = getFirstTableNumber(a.tableNumber)
                const bTable = getFirstTableNumber(b.tableNumber)
                return aTable - bTable
              })

            setBookings(bookingList)
          } else {
            setBookings([])
          }
        } catch (err) {
          console.error("Error processing bookings:", err)
          setError("Failed to process booking data")
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        console.error("Error fetching bookings:", err)
        setError("Failed to load bookings")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [selectedDate])

  // Update booking status
  const updateBookingStatus = async (bookingId: string, status: "not_arrived" | "ready" | "served") => {
    try {
      const sanitizedDate = selectedDate.replace(/[.#$/[\]]/g, "_")
      const bookingRef = ref(db, `RunsheetsAndPreorders/${sanitizedDate}/bookings/${bookingId}`)

      await update(bookingRef, {
        brunchSharesStatus: status,
      })
    } catch (err) {
      console.error("Error updating booking status:", err)
      setError("Failed to update booking status")
    }
  }

  // Calculate totals with table assignments
  const totals = bookings.reduce(
    (acc, booking) => {
      const req = calculateShareRequirements(booking.covers)
      const items = calculateServingItems(booking.covers, booking.tableNumber)

      acc.requirements.pizzaSlices += req.pizzaSlices
      acc.requirements.halloumiPortions += req.halloumiPortions
      acc.requirements.olivePortions += req.olivePortions
      acc.requirements.breadPortions += req.breadPortions
      acc.requirements.houmousPortions += req.houmousPortions
      acc.requirements.wingsPortions += req.wingsPortions

      acc.servingItems.pizzaBoards.small += items.pizzaBoards.small
      acc.servingItems.pizzaBoards.medium += items.pizzaBoards.medium
      acc.servingItems.pizzaBoards.large += items.pizzaBoards.large
      acc.servingItems.pizzaBoards.tables.push(...items.pizzaBoards.tables)

      acc.servingItems.olivePlates.small += items.olivePlates.small
      acc.servingItems.olivePlates.medium += items.olivePlates.medium
      acc.servingItems.olivePlates.large += items.olivePlates.large
      acc.servingItems.olivePlates.tables.push(...items.olivePlates.tables)

      acc.servingItems.houmousTrays.small += items.houmousTrays.small
      acc.servingItems.houmousTrays.medium += items.houmousTrays.medium
      acc.servingItems.houmousTrays.large += items.houmousTrays.large
      acc.servingItems.houmousTrays.tables.push(...items.houmousTrays.tables)

      acc.servingItems.wingsBowls.small += items.wingsBowls.small
      acc.servingItems.wingsBowls.large += items.wingsBowls.large
      acc.servingItems.wingsBowls.tables.push(...items.wingsBowls.tables)

      return acc
    },
    {
      requirements: {
        pizzaSlices: 0,
        halloumiPortions: 0,
        olivePortions: 0,
        breadPortions: 0,
        houmousPortions: 0,
        wingsPortions: 0,
      },
      servingItems: {
        pizzaBoards: { small: 0, medium: 0, large: 0, tables: [] as string[] },
        olivePlates: { small: 0, medium: 0, large: 0, tables: [] as string[] },
        houmousTrays: { small: 0, medium: 0, large: 0, tables: [] as string[] },
        wingsBowls: { small: 0, large: 0, tables: [] as string[] },
      },
    },
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "warning"
      case "served":
        return "success"
      default:
        return "error"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <Schedule />
      case "served":
        return <CheckCircle />
      default:
        return <Cancel />
    }
  }

  const handleDateChange = (days: number) => {
    const newDate = days > 0 ? addDays(new Date(selectedDate), days) : subDays(new Date(selectedDate), Math.abs(days))
    setSelectedDate(format(newDate, "yyyy-MM-dd"))
  }

  const filteredBookings = bookings.filter((booking) => {
    if (statusFilter === "all") return true
    return booking.status === statusFilter
  })

  const printTableData = () => {
    const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Brunch Shares - Table Data - ${format(new Date(selectedDate), "EEE, dd MMM yyyy")}</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            line-height: 1.2;
            margin: 0;
            padding: 0;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .header h1 {
            margin: 0;
            font-size: 16px;
            color: #333;
          }
          .header h2 {
            margin: 5px 0 0 0;
            font-size: 12px;
            color: #666;
          }
          .booking-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 10px;
          }
          .booking-card {
            border: 2px solid #ddd;
            padding: 8px;
            border-radius: 4px;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .booking-card.ready {
            border-color: #ff9800;
            background-color: #fff3e0;
          }
          .booking-card.served {
            border-color: #4caf50;
            background-color: #e8f5e9;
          }
          .booking-card.not_arrived {
            border-color: #f44336;
            background-color: #ffebee;
          }
          .booking-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 6px;
          }
          .booking-name {
            font-weight: bold;
            font-size: 11px;
            margin: 0;
          }
          .table-info {
            font-size: 9px;
            color: #666;
            margin: 2px 0;
          }
          .status-badge {
            font-size: 8px;
            padding: 2px 6px;
            border-radius: 10px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-badge.ready {
            background-color: #ff9800;
            color: white;
          }
          .status-badge.served {
            background-color: #4caf50;
            color: white;
          }
          .status-badge.not_arrived {
            background-color: #f44336;
            color: white;
          }
          .food-section {
            margin-top: 6px;
          }
          .food-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3px;
            font-size: 9px;
          }
          .food-label {
            color: #333;
          }
          .crockery-chips {
            display: flex;
            gap: 3px;
            flex-wrap: wrap;
          }
          .chip {
            background-color: #e0e0e0;
            padding: 1px 4px;
            border-radius: 8px;
            font-size: 7px;
            font-weight: bold;
          }
          .chip.primary { background-color: #2196f3; color: white; }
          .chip.warning { background-color: #ff9800; color: white; }
          .chip.secondary { background-color: #9c27b0; color: white; }
          .chip.info { background-color: #00bcd4; color: white; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🍽️ Brunch Shares - 1 PM Only</h1>
        <h2>${format(new Date(selectedDate), "EEEE, dd MMMM yyyy")} - Table Data (${filteredBookings.length} bookings)</h2>
      </div>
      <div class="booking-grid">
        ${filteredBookings
          .map((booking) => {
            const requirements = calculateShareRequirements(booking.covers)
            const servingItems = calculateServingItems(booking.covers, booking.tableNumber)
            const status = booking.status || "not_arrived"

            return `
            <div class="booking-card ${status}">
              <div class="booking-header">
                <div>
                  <h3 class="booking-name">${booking.name}</h3>
                  <div class="table-info">📍 ${booking.tableNumber} • ${booking.covers} covers</div>
                </div>
                <span class="status-badge ${status}">${status.replace("_", " ")}</span>
              </div>
              <div class="food-section">
                <div class="food-item">
                  <span class="food-label">🍕 Pizza: ${requirements.pizzaSlices} portions</span>
                  <div class="crockery-chips">
                    ${servingItems.pizzaBoards.small > 0 ? `<span class="chip primary">${servingItems.pizzaBoards.small} Small</span>` : ""}
                    ${servingItems.pizzaBoards.medium > 0 ? `<span class="chip primary">${servingItems.pizzaBoards.medium} Medium</span>` : ""}
                    ${servingItems.pizzaBoards.large > 0 ? `<span class="chip primary">${servingItems.pizzaBoards.large} Large</span>` : ""}
                  </div>
                </div>
                <div class="food-item">
                  <span class="food-label">🍗 Wings: ${requirements.wingsPortions} portions</span>
                  <div class="crockery-chips">
                    ${servingItems.wingsBowls.small > 0 ? `<span class="chip warning">${servingItems.wingsBowls.small} Small</span>` : ""}
                    ${servingItems.wingsBowls.large > 0 ? `<span class="chip warning">${servingItems.wingsBowls.large} Large</span>` : ""}
                  </div>
                </div>
                <div class="food-item">
                  <span class="food-label">🧀🫒 Halloumi & Olives: ${requirements.halloumiPortions + requirements.olivePortions} portions</span>
                  <div class="crockery-chips">
                    ${servingItems.olivePlates.small > 0 ? `<span class="chip secondary">${servingItems.olivePlates.small} Small</span>` : ""}
                    ${servingItems.olivePlates.medium > 0 ? `<span class="chip secondary">${servingItems.olivePlates.medium} Medium</span>` : ""}
                    ${servingItems.olivePlates.large > 0 ? `<span class="chip secondary">${servingItems.olivePlates.large} Large</span>` : ""}
                  </div>
                </div>
                <div class="food-item">
                  <span class="food-label">🥣🍞 Houmous & Bread: ${requirements.houmousPortions + requirements.breadPortions} portions</span>
                  <div class="crockery-chips">
                    ${servingItems.houmousTrays.small > 0 ? `<span class="chip info">${servingItems.houmousTrays.small} Small</span>` : ""}
                    ${servingItems.houmousTrays.medium > 0 ? `<span class="chip info">${servingItems.houmousTrays.medium} Medium</span>` : ""}
                    ${servingItems.houmousTrays.large > 0 ? `<span class="chip info">${servingItems.houmousTrays.large} Large</span>` : ""}
                  </div>
                </div>
              </div>
            </div>
          `
          })
          .join("")}
      </div>
    </body>
    </html>
  `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  const formatServingItemSummary = (item: ServingItemDetail) => {
    const parts = []
    if (item.small > 0) parts.push(`Small:${item.small}`)
    if (item.medium > 0) parts.push(`Medium:${item.medium}`)
    if (item.large > 0) parts.push(`Large:${item.large}`)
    return parts.join(" ")
  }

  // Calculate total crockery needed
  const totalCrockery = {
    pizzaBoards:
      totals.servingItems.pizzaBoards.small +
      totals.servingItems.pizzaBoards.medium +
      totals.servingItems.pizzaBoards.large,
    olivePlates:
      totals.servingItems.olivePlates.small +
      totals.servingItems.olivePlates.medium +
      totals.servingItems.olivePlates.large,
    houmousTrays:
      totals.servingItems.houmousTrays.small +
      totals.servingItems.houmousTrays.medium +
      totals.servingItems.houmousTrays.large,
    wingsBowls: totals.servingItems.wingsBowls.small + totals.servingItems.wingsBowls.large,
  }

  return (
    <Box sx={{ p: 2, maxWidth: "100vw" }}>
      {/* Compact Header */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Restaurant color="primary" />
            <Typography variant="h5" fontWeight="bold" color="primary">
              Brunch Shares - 1 PM Only
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <IconButton size="small" onClick={printTableData} title="Print Table Data Only">
              <Print />
            </IconButton>
            <IconButton size="small" onClick={() => window.print()} title="Print Full Page">
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {/* Status Filter Buttons */}
        <Box display="flex" justifyContent="center" gap={1} mb={2}>
          <Button
            size="small"
            variant={statusFilter === "all" ? "contained" : "outlined"}
            onClick={() => setStatusFilter("all")}
            sx={{ minWidth: 80 }}
          >
            All ({bookings.length})
          </Button>
          <Button
            size="small"
            variant={statusFilter === "not_arrived" ? "contained" : "outlined"}
            color="error"
            onClick={() => setStatusFilter("not_arrived")}
            sx={{ minWidth: 100 }}
          >
            Not Arrived ({bookings.filter((b) => (b.status || "not_arrived") === "not_arrived").length})
          </Button>
          <Button
            size="small"
            variant={statusFilter === "ready" ? "contained" : "outlined"}
            color="warning"
            onClick={() => setStatusFilter("ready")}
            sx={{ minWidth: 80 }}
          >
            Ready ({bookings.filter((b) => b.status === "ready").length})
          </Button>
          <Button
            size="small"
            variant={statusFilter === "served" ? "contained" : "outlined"}
            color="success"
            onClick={() => setStatusFilter("served")}
            sx={{ minWidth: 80 }}
          >
            Served ({bookings.filter((b) => b.status === "served").length})
          </Button>
        </Box>

        {/* Compact Date Navigation */}
        <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
          <IconButton size="small" onClick={() => handleDateChange(-1)}>
            <NavigateBefore />
          </IconButton>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Today />}
            onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
            sx={{ minWidth: 80 }}
          >
            Today
          </Button>
          <Typography variant="subtitle1" fontWeight="medium" sx={{ minWidth: 180, textAlign: "center" }}>
            {format(new Date(selectedDate), "EEE, dd MMM yyyy")}
          </Typography>
          <IconButton size="small" onClick={() => handleDateChange(1)}>
            <NavigateNext />
          </IconButton>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Compact Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Card elevation={1} sx={{ height: "100%" }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center" gap={1}>
                    <Kitchen color="primary" fontSize="small" />
                    Food Portions & Boards/Plates/Trays/Bowls
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Pizza Slices & Boards
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {totals.requirements.pizzaSlices} portions
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {totalCrockery.pizzaBoards} boards ({formatServingItemSummary(totals.servingItems.pizzaBoards)})
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Wings & Bowls
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {totals.requirements.wingsPortions} portions
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {totalCrockery.wingsBowls} bowls (Small:{totals.servingItems.wingsBowls.small} Large:
                        {totals.servingItems.wingsBowls.large})
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Halloumi & Olives & Plates
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {totals.requirements.halloumiPortions + totals.requirements.olivePortions} portions
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {totalCrockery.olivePlates} plates ({formatServingItemSummary(totals.servingItems.olivePlates)})
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Houmous & Bread & Trays
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {totals.requirements.houmousPortions + totals.requirements.breadPortions} portions
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {totalCrockery.houmousTrays} trays ({formatServingItemSummary(totals.servingItems.houmousTrays)}
                        )
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={1} sx={{ height: "100%" }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center" gap={1}>
                    <LocalDining color="primary" fontSize="small" />
                    Total Crockery Summary
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        {totalCrockery.pizzaBoards} Pizza Boards
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatServingItemSummary(totals.servingItems.pizzaBoards)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="secondary.main">
                        {totalCrockery.olivePlates} Olive & Halloumi Plates
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatServingItemSummary(totals.servingItems.olivePlates)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="info.main">
                        {totalCrockery.houmousTrays} Houmous & Bread Trays
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatServingItemSummary(totals.servingItems.houmousTrays)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="warning.main">
                        {totalCrockery.wingsBowls} Wings Bowls
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Small:{totals.servingItems.wingsBowls.small} Large:{totals.servingItems.wingsBowls.large}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Compact Bookings Grid - 3 Columns */}
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center" gap={1}>
              <TableRestaurant fontSize="small" />1 PM Bookings ({filteredBookings.length}
              {statusFilter !== "all" ? ` - ${statusFilter.replace("_", " ")}` : ""})
            </Typography>

            {filteredBookings.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Restaurant sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {statusFilter === "all"
                    ? "No 1 PM brunch bookings found for this date"
                    : `No ${statusFilter.replace("_", " ")} bookings found for this date`}
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={1}>
                {filteredBookings.map((booking) => {
                  const requirements = calculateShareRequirements(booking.covers)
                  const servingItems = calculateServingItems(booking.covers, booking.tableNumber)
                  return (
                    <Grid item xs={12} sm={6} md={4} key={booking.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderColor:
                            booking.status === "served"
                              ? "success.main"
                              : booking.status === "ready"
                                ? "warning.main"
                                : "error.main",
                          borderWidth: 2,
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {booking.name}
                            </Typography>
                            <Box display="flex" gap={1} alignItems="center">
                              <Chip
                                label={booking.tableNumber}
                                size="small"
                                variant="outlined"
                                color="primary"
                                icon={<TableRestaurant />}
                              />
                              <Typography variant="body2" fontWeight="medium">
                                {booking.covers} covers
                              </Typography>
                            </Box>
                          </Box>
                          <Chip
                            label={booking.status?.replace("_", " ").toUpperCase() || "NOT ARRIVED"}
                            color={getStatusColor(booking.status || "not_arrived") as any}
                            icon={getStatusIcon(booking.status || "not_arrived")}
                            size="small"
                          />
                        </Box>

                        {/* Combined Food & Crockery */}
                        <Box mb={1}>
                          <Stack spacing={0.5}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary">
                                🍕 Pizza: {requirements.pizzaSlices} portions
                              </Typography>
                              <Box display="flex" gap={0.5}>
                                {servingItems.pizzaBoards.small > 0 && (
                                  <Chip
                                    label={`${servingItems.pizzaBoards.small} Small`}
                                    size="small"
                                    color="primary"
                                  />
                                )}
                                {servingItems.pizzaBoards.medium > 0 && (
                                  <Chip
                                    label={`${servingItems.pizzaBoards.medium} Medium`}
                                    size="small"
                                    color="primary"
                                  />
                                )}
                                {servingItems.pizzaBoards.large > 0 && (
                                  <Chip
                                    label={`${servingItems.pizzaBoards.large} Large`}
                                    size="small"
                                    color="primary"
                                  />
                                )}
                              </Box>
                            </Box>

                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary">
                                🍗 Wings: {requirements.wingsPortions} portions
                              </Typography>
                              <Box display="flex" gap={0.5}>
                                {servingItems.wingsBowls.small > 0 && (
                                  <Chip label={`${servingItems.wingsBowls.small} Small`} size="small" color="warning" />
                                )}
                                {servingItems.wingsBowls.large > 0 && (
                                  <Chip label={`${servingItems.wingsBowls.large} Large`} size="small" color="warning" />
                                )}
                              </Box>
                            </Box>

                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary">
                                🧀🫒 Halloumi & Olives: {requirements.halloumiPortions + requirements.olivePortions}{" "}
                                portions
                              </Typography>
                              <Box display="flex" gap={0.5}>
                                {servingItems.olivePlates.small > 0 && (
                                  <Chip
                                    label={`${servingItems.olivePlates.small} Small`}
                                    size="small"
                                    color="secondary"
                                  />
                                )}
                                {servingItems.olivePlates.medium > 0 && (
                                  <Chip
                                    label={`${servingItems.olivePlates.medium} Medium`}
                                    size="small"
                                    color="secondary"
                                  />
                                )}
                                {servingItems.olivePlates.large > 0 && (
                                  <Chip
                                    label={`${servingItems.olivePlates.large} Large`}
                                    size="small"
                                    color="secondary"
                                  />
                                )}
                              </Box>
                            </Box>

                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary">
                                🥣🍞 Houmous & Bread: {requirements.houmousPortions + requirements.breadPortions}{" "}
                                portions
                              </Typography>
                              <Box display="flex" gap={0.5}>
                                {servingItems.houmousTrays.small > 0 && (
                                  <Chip label={`${servingItems.houmousTrays.small} Small`} size="small" color="info" />
                                )}
                                {servingItems.houmousTrays.medium > 0 && (
                                  <Chip
                                    label={`${servingItems.houmousTrays.medium} Medium`}
                                    size="small"
                                    color="info"
                                  />
                                )}
                                {servingItems.houmousTrays.large > 0 && (
                                  <Chip label={`${servingItems.houmousTrays.large} Large`} size="small" color="info" />
                                )}
                              </Box>
                            </Box>
                          </Stack>
                        </Box>

                        <Box display="flex" gap={0.5}>
                          <Button
                            size="small"
                            variant={booking.status === "ready" ? "contained" : "outlined"}
                            color="warning"
                            onClick={() => updateBookingStatus(booking.id, "ready")}
                            sx={{ fontSize: "0.7rem", minWidth: 60 }}
                          >
                            Ready
                          </Button>
                          <Button
                            size="small"
                            variant={booking.status === "served" ? "contained" : "outlined"}
                            color="success"
                            onClick={() => updateBookingStatus(booking.id, "served")}
                            sx={{ fontSize: "0.7rem", minWidth: 60 }}
                          >
                            Served
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
            )}
          </Paper>
        </>
      )}
    </Box>
  )
}

export default BrunchSharesPage
