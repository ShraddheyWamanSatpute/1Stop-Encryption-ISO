"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Box, Typography, TextField, CircularProgress, IconButton, Paper, Fade, useTheme } from "@mui/material"
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material"
import { ref, get } from "firebase/database"
import { db as database } from "../services/firebase"
import { Page } from "../styles/StyledComponents"
import EnhancedRunsheetPreorders from "./EnhancedRunsheetPreorders"

// Helper function: format Date object as "YYYY-MM-DD"
const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Helper function: change date by a given number of days
const changeDateByDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr + "T00:00:00") // Ensure consistent parsing
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

// Helper function: validate date format
const isValidDateFormat = (dateStr: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  return regex.test(dateStr) && !isNaN(new Date(dateStr + "T00:00:00").getTime())
}

const CombinedRunsheetPreordersPage: React.FC = () => {
  // Initialize with today's date in YYYY-MM-DD format
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()))
  const [data, setData] = useState<{
    bookings?: Record<string, any>
    preorders?: Record<string, any>
  } | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const theme = useTheme()

  // Persistent filtering/sorting state
  const [globalSearch, setGlobalSearch] = useState<string>("")
  const [preorderFilter, setPreorderFilter] = useState<string>("All")

  // Fetch data for the selected date
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const dateRef = ref(database, `RunsheetsAndPreorders/${selectedDate}`)
        const snapshot = await get(dateRef)
        setData(snapshot.exists() ? snapshot.val() : null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.")
      } finally {
        setLoading(false)
      }
    }

    if (isValidDateFormat(selectedDate)) {
      fetchData()
    }
  }, [selectedDate])

  // Handlers for moving between dates
  const handlePrevDate = () => {
    setSelectedDate(changeDateByDays(selectedDate, -1))
  }

  const handleNextDate = () => {
    setSelectedDate(changeDateByDays(selectedDate, 1))
  }

  // Handle date input change with validation
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    if (isValidDateFormat(newDate)) {
      setSelectedDate(newDate)
    }
  }

  // Format date for display
  const formatDisplayDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr + "T00:00:00")
      return date.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <Page>
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: theme.palette.mode === "dark" ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: "center", gap: 2, mb: 2 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
            Runsheet & Preorders
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 1,
              borderRadius: 2,
              bgcolor: theme.palette.mode === "dark" ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.05)",
            }}
          >
            <IconButton
              onClick={handlePrevDate}
              sx={{
                bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                "&:hover": {
                  bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                },
              }}
            >
              <ArrowBackIos fontSize="small" />
            </IconButton>

            <TextField
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{
                width: { xs: "100%", sm: "auto" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />

            <IconButton
              onClick={handleNextDate}
              sx={{
                bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                "&:hover": {
                  bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                },
              }}
            >
              <ArrowForwardIos fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Typography variant="h6" color="primary" fontWeight="medium" gutterBottom>
          {formatDisplayDate(selectedDate)}
        </Typography>

        <TextField
          placeholder="Search bookings, tables, times, items..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          fullWidth
          size="small"
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
            },
          }}
        />
      </Paper>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Fade in>
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              bgcolor: theme.palette.error.main + "15",
              border: `1px solid ${theme.palette.error.main}`,
            }}
          >
            <Typography color="error">{error}</Typography>
          </Paper>
        </Fade>
      )}

      {!loading && !error && data ? (
        <EnhancedRunsheetPreorders
          bookings={data.bookings || {}}
          preorders={data.preorders || {}}
          globalSearch={globalSearch}
          preorderFilter={preorderFilter}
          setGlobalSearch={setGlobalSearch}
          setPreorderFilter={setPreorderFilter}
        />
      ) : (
        !loading &&
        !error && (
          <Fade in>
            <Paper
              sx={{
                p: 4,
                borderRadius: 2,
                textAlign: "center",
                bgcolor: theme.palette.mode === "dark" ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.9)",
              }}
            >
              <Typography variant="h6" color="text.secondary">
                No runsheets or preorders available for this date.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try selecting a different date or check if data has been uploaded.
              </Typography>
            </Paper>
          </Fade>
        )
      )}
    </Page>
  )
}

export default CombinedRunsheetPreordersPage
