/**
 * ESS Schedule Page
 * 
 * Shows employee's work schedule:
 * - Weekly/Monthly calendar view
 * - List of upcoming shifts
 * - Shift details
 */

"use client"

import React, { useState, useMemo } from "react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Divider,
  IconButton,
  useTheme,
} from "@mui/material"
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Event as EventIcon,
} from "@mui/icons-material"
import { useESS } from "../context/ESSContext"
import { ESSEmptyState } from "../components"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box>{children}</Box>}</div>
)

const ESSSchedule: React.FC = () => {
  const theme = useTheme()
  const { state } = useESS()
  const [tabValue, setTabValue] = useState(0)
  // Use date-fns startOfWeek to match main app exactly
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date())

  // Generate week days using date-fns (matching main app exactly)
  // Auto-scroll to prioritize days that haven't happened yet
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentWeekDate, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ 
      start: weekStart, 
      end: endOfWeek(currentWeekDate, { weekStartsOn: 1 }) 
    })
    
    // Find today's index
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayIndex = days.findIndex(day => {
      const dayCopy = new Date(day)
      dayCopy.setHours(0, 0, 0, 0)
      return dayCopy.getTime() === today.getTime()
    })
    
    // If today is found and not the first day, reorder to start from today
    if (todayIndex > 0) {
      return [...days.slice(todayIndex), ...days.slice(0, todayIndex)]
    }
    
    return days
  }, [currentWeekDate])

  // Get shifts for a specific date - only confirmed shifts
  const getShiftsForDate = (date: Date) => {
    // Only show confirmed shifts
    return state.upcomingShifts.filter((shift) => {
      if (!shift.date || shift.status !== "confirmed") return false
      
      // Use exact same logic as main app: new Date(s.date)
      const scheduleDate = new Date(shift.date)
      
      // Check if date is valid
      if (isNaN(scheduleDate.getTime())) return false
      
      // Use date-fns format for comparison (matching main app exactly)
      return format(scheduleDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    })
  }

  // Navigate weeks (matching main app logic)
  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeekDate((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7))
      return newDate
    })
  }

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // Format week range (matching main app logic)
  const formatWeekRange = () => {
    const weekStart = startOfWeek(currentWeekDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentWeekDate, { weekStartsOn: 1 })
    
    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'd, yyyy')}`
    } else {
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
    }
  }

  return (
    <Box sx={{ 
      p: { xs: 1.5, sm: 2 },
      pb: { xs: 12, sm: 4 },
      maxWidth: "100%",
      overflowX: "hidden",
    }}>
      {/* View Toggle */}
      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        sx={{ 
          mb: { xs: 1.5, sm: 2 },
          "& .MuiTab-root": {
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
            minHeight: { xs: 48, sm: 48 },
          },
        }}
        variant="fullWidth"
      >
        <Tab label="Week View" />
        <Tab label="List View" />
      </Tabs>

      {/* Week View */}
      <TabPanel value={tabValue} index={0}>
        {/* Week Navigation */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: { xs: 1.5, sm: 2 },
          }}
        >
          <IconButton 
            onClick={() => navigateWeek("prev")} 
            size="small"
            sx={{ minWidth: { xs: 44, sm: 40 }, minHeight: { xs: 44, sm: 40 } }}
          >
            <ChevronLeftIcon sx={{ fontSize: { xs: 24, sm: 20 } }} />
          </IconButton>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: "0.875rem", sm: "1rem" },
              textAlign: "center",
              flex: 1,
            }}
          >
            {formatWeekRange()}
          </Typography>
          <IconButton 
            onClick={() => navigateWeek("next")} 
            size="small"
            sx={{ minWidth: { xs: 44, sm: 40 }, minHeight: { xs: 44, sm: 40 } }}
          >
            <ChevronRightIcon sx={{ fontSize: { xs: 24, sm: 20 } }} />
          </IconButton>
        </Box>

        {/* Week Days Grid - Auto-scroll to today */}
        <Box 
          ref={(el) => {
            if (el) {
              // Auto-scroll to today's card on mount/update
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const todayCard = Array.from(el.children).find((child) => {
                const dayAttr = (child as HTMLElement).getAttribute('data-day')
                if (dayAttr) {
                  const dayDate = new Date(dayAttr)
                  dayDate.setHours(0, 0, 0, 0)
                  return dayDate.getTime() === today.getTime()
                }
                return false
              })
              if (todayCard) {
                todayCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
              }
            }
          }}
          sx={{ 
            display: "flex", 
            gap: { xs: 0.75, sm: 1 }, 
            mb: { xs: 1.5, sm: 2 }, 
            overflowX: "auto", 
            pb: 1,
            WebkitOverflowScrolling: "touch",
            "&::-webkit-scrollbar": {
              height: 4,
            },
          }}
        >
          {weekDays.map((day) => {
            const shifts = getShiftsForDate(day)
            const hasShift = shifts.length > 0
            const today = isToday(day)

            return (
              <Card
                key={day.toISOString()}
                data-day={day.toISOString()}
                sx={{
                  minWidth: { xs: 70, sm: 80 },
                  flex: "1 0 auto",
                  borderRadius: { xs: 1.5, sm: 2 },
                  border: today ? `2px solid ${theme.palette.primary.main}` : "none",
                  bgcolor: hasShift ? theme.palette.primary.light + "20" : "background.paper",
                }}
              >
                <CardContent sx={{ 
                  p: { xs: 1, sm: 1.5 }, 
                  textAlign: "center", 
                  "&:last-child": { pb: { xs: 1, sm: 1.5 } } 
                }}>
                  <Typography
                    variant="caption"
                    color={today ? "primary" : "text.secondary"}
                    sx={{ 
                      fontWeight: today ? 600 : 400,
                      fontSize: { xs: "0.65rem", sm: "0.75rem" },
                    }}
                  >
                    {day.toLocaleDateString("en-GB", { weekday: "short" })}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: today ? "primary.main" : "text.primary",
                      fontSize: { xs: "1rem", sm: "1.25rem" },
                    }}
                  >
                    {day.getDate()}
                  </Typography>
                  {hasShift && (
                    <Chip
                      label={shifts[0].startTime}
                      size="small"
                      color="primary"
                      sx={{ 
                        mt: 0.5, 
                        height: { xs: 18, sm: 20 }, 
                        fontSize: { xs: "0.6rem", sm: "0.65rem" },
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </Box>

        {/* Selected Day Shifts */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              This Week's Shifts
            </Typography>
            {weekDays.some((day) => getShiftsForDate(day).length > 0) ? (
              weekDays.map((day) => {
                const shifts = getShiftsForDate(day)
                if (shifts.length === 0) return null

                return shifts.map((shift, index) => (
                  <Box key={`${day.toISOString()}-${index}`}>
                    <Box sx={{ display: "flex", gap: 1.5, py: 1.5 }}>
                      <Box sx={{ textAlign: "center", minWidth: 50, flexShrink: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                          {day.toLocaleDateString("en-GB", { weekday: "short" })}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1, fontSize: "1rem" }}>
                          {day.getDate()}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                          {shift.startTime} - {shift.endTime}
                        </Typography>
                        {shift.role && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                            {shift.role}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Divider />
                  </Box>
                ))
              })
            ) : (
              <Box sx={{ py: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No shifts scheduled this week
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* List View */}
      <TabPanel value={tabValue} index={1}>
        {state.upcomingShifts.filter(s => s.status === "confirmed").length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {state.upcomingShifts.filter(s => s.status === "confirmed").map((shift, index) => {
              const shiftDate = new Date(shift.date)
              return (
                <Card key={shift.id || index} sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Box sx={{ display: "flex", gap: 1.5, py: 0.5 }}>
                      <Box sx={{ textAlign: "center", minWidth: 50, flexShrink: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                          {shiftDate.toLocaleDateString("en-GB", { weekday: "short" })}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1, fontSize: "1rem" }}>
                          {shiftDate.getDate()}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                          {shift.startTime} - {shift.endTime}
                        </Typography>
                        {shift.role && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                            {shift.role}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        ) : (
          <ESSEmptyState
            icon={<EventIcon sx={{ fontSize: 48 }} />}
            title="No Upcoming Shifts"
            description="You don't have any shifts scheduled yet. Check back later or contact your manager."
          />
        )}
      </TabPanel>
    </Box>
  )
}

export default ESSSchedule