/**
 * ESS Dashboard
 * 
 * Main landing page for staff:
 * - Quick clock in/out
 * - Today's shift info
 * - Holiday balance overview
 * - Recent activity
 * - Quick links to other sections
 */

"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Button,
  Grid,
  Chip,
  Avatar,
  Divider,
  useTheme,
} from "@mui/material"
import {
  AccessTime as ClockIcon,
  Receipt as PayslipIcon,
  EventNote as TimeOffIcon,
  ChevronRight as ChevronRightIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  BeachAccess as HolidayIcon,
  Star as PerformanceIcon,
} from "@mui/icons-material"
import { useESS } from "../context/ESSContext"

const ESSDashboard: React.FC = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { state, clockIn, clockOut } = useESS()
  const [currentHour, setCurrentHour] = useState(new Date().getHours())

  // Update current hour periodically to ensure greeting updates throughout the day
  useEffect(() => {
    const updateHour = () => {
      setCurrentHour(new Date().getHours())
    }
    
    // Update immediately
    updateHour()
    
    // Update every hour to ensure greeting changes at 12pm and 5pm
    const interval = setInterval(updateHour, 60 * 60 * 1000) // Every hour
    
    return () => clearInterval(interval)
  }, [])

  // Also update when employee data loads
  useEffect(() => {
    if (state.currentEmployee) {
      // Force a re-render when employee data is available
      setCurrentHour(new Date().getHours())
    }
  }, [state.currentEmployee])

  // Format time helper
  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return "--:--"
    return new Date(timestamp).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Calculate worked hours
  const getWorkedHours = (): string => {
    if (!state.clockInTime) return "0h 0m"
    const diff = Date.now() - state.clockInTime
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  // Get today's shift - matching EmployeeSelfService logic
  const getTodayShift = () => {
    const today = new Date()
    
    return state.upcomingShifts.find((s) => {
      if (!s.date) return false
      
      // Use exact same logic as main app: new Date(s.date)
      const scheduleDate = new Date(s.date)
      
      if (isNaN(scheduleDate.getTime())) return false
      
      // Use date-fns format for comparison (matching main app exactly)
      return format(scheduleDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    })
  }

  const todayShift = getTodayShift()

  // Get greeting based on time of day - responsive to time changes
  const greeting = useMemo((): string => {
    const hour = currentHour
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }, [currentHour])

  // Get user's first name, fallback to "there" if not available
  const userFirstName = useMemo((): string => {
    return state.currentEmployee?.firstName?.trim() || "there"
  }, [state.currentEmployee?.firstName])

  // Handle clock action
  const handleClockAction = async () => {
    if (state.isClockedIn) {
      await clockOut()
    } else {
      await clockIn()
    }
  }

  return (
    <Box sx={{ 
      p: { xs: 1.5, sm: 2 }, 
      pb: { xs: 12, sm: 4 },
      maxWidth: "100%",
      overflowX: "hidden",
    }}>
      {/* Welcome Section */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 600, 
            mb: 0.5,
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
          }}
        >
          {greeting}, {userFirstName}!
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
        >
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Typography>
      </Box>

      {/* Clock In/Out Card */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          background: state.isClockedIn
            ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: "white",
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: { xs: 1.5, sm: 2 } }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="overline" 
                sx={{ 
                  opacity: 0.9,
                  fontSize: { xs: "0.65rem", sm: "0.75rem" },
                  display: "block",
                  mb: 0.5,
                }}
              >
                {state.isClockedIn ? "Currently Working" : "Ready to Start?"}
              </Typography>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: "1.5rem", sm: "2rem" },
                  wordBreak: "break-word",
                }}
              >
                {state.isClockedIn ? getWorkedHours() : "Clock In"}
              </Typography>
            </Box>
            <Avatar
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                width: { xs: 48, sm: 56 },
                height: { xs: 48, sm: 56 },
                ml: 1,
                flexShrink: 0,
              }}
            >
              <ClockIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
            </Avatar>
          </Box>

          {state.isClockedIn && (
            <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.9,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
              >
                Clocked in at {formatTime(state.clockInTime)}
              </Typography>
            </Box>
          )}

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleClockAction}
            disabled={state.isLoading}
            sx={{
              bgcolor: "rgba(255,255,255,0.95)",
              color: state.isClockedIn ? theme.palette.success.dark : theme.palette.primary.dark,
              fontWeight: 600,
              py: { xs: 1.75, sm: 1.5 },
              minHeight: { xs: 48, sm: 44 }, // Touch-friendly: min 44px
              borderRadius: 2,
              fontSize: { xs: "1rem", sm: "0.9375rem" },
              "&:hover": {
                bgcolor: "white",
              },
              "&:active": {
                transform: "scale(0.98)",
              },
            }}
          >
            {state.isClockedIn ? "Clock Out" : "Clock In"}
          </Button>
        </CardContent>
      </Card>

      {/* Today's Shift Card */}
      {todayShift && (
        <Card sx={{ mb: { xs: 2, sm: 3 }, borderRadius: { xs: 2, sm: 3 } }}>
          <CardActionArea onClick={() => navigate("/ess/schedule")}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 } }}>
                <Avatar sx={{ 
                  bgcolor: theme.palette.primary.light,
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                }}>
                  <ScheduleIcon 
                    color="primary" 
                    sx={{ fontSize: { xs: 20, sm: 24 } }}
                  />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="subtitle2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
                  >
                    Today's Shift
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: "0.9375rem", sm: "1.25rem" },
                      wordBreak: "break-word",
                    }}
                  >
                    {todayShift.startTime} - {todayShift.endTime}
                  </Typography>
                </Box>
                <ChevronRightIcon 
                  color="action" 
                  sx={{ fontSize: { xs: 20, sm: 24 }, flexShrink: 0 }}
                />
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>
      )}

      {/* Quick Stats Grid */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        {/* Holidays */}
        <Grid item xs={6}>
          <Card
            sx={{ 
              borderRadius: { xs: 2, sm: 3 }, 
              height: "100%",
              minHeight: { xs: 120, sm: "auto" },
            }}
            onClick={() => navigate("/ess/holidays")}
          >
            <CardActionArea sx={{ height: "100%", minHeight: { xs: 120, sm: "auto" } }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
                  <HolidayIcon color="primary" sx={{ fontSize: { xs: 18, sm: 20 } }} />
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                  >
                    Holidays
                  </Typography>
                </Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: { xs: 0.75, sm: 1 },
                    fontSize: { xs: "1.5rem", sm: "2rem" },
                  }}
                >
                  {state.holidayBalance.remaining}
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    mt: 0.5, 
                    display: "block",
                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                  }}
                >
                  {state.holidayBalance.remaining > 0 ? "Days remaining" : "No days remaining"}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Pending Requests */}
        <Grid item xs={6}>
          <Card
            sx={{ 
              borderRadius: { xs: 2, sm: 3 }, 
              height: "100%",
              minHeight: { xs: 120, sm: "auto" },
            }}
            onClick={() => navigate("/ess/time-off")}
          >
            <CardActionArea sx={{ height: "100%", minHeight: { xs: 120, sm: "auto" } }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
                  <TimeOffIcon color="warning" sx={{ fontSize: { xs: 18, sm: 20 } }} />
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                  >
                    Pending Requests
                  </Typography>
                </Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: { xs: 0.75, sm: 1 },
                    fontSize: { xs: "1.5rem", sm: "2rem" },
                  }}
                >
                  {state.pendingTimeOff.length}
                </Typography>
                {state.pendingTimeOff.length > 0 ? (
                  <Chip
                    label="View requests"
                    size="small"
                    color="warning"
                    variant="outlined"
                    sx={{ 
                      mt: 1,
                      fontSize: { xs: "0.65rem", sm: "0.75rem" },
                      height: { xs: 20, sm: 24 },
                    }}
                  />
                ) : (
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                  >
                    No pending requests
                  </Typography>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      {/* Upcoming Shifts */}
      <Card sx={{ mb: { xs: 2, sm: 3 }, borderRadius: { xs: 2, sm: 3 } }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: { xs: 1.5, sm: 2 }, pb: { xs: 0.75, sm: 1 } }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: "0.9375rem", sm: "1rem" },
              }}
            >
              Upcoming Shifts
            </Typography>
          </Box>
          <Divider />
          {state.upcomingShifts.length > 0 ? (
            <Box>
              {state.upcomingShifts.slice(0, 3).map((shift, index) => (
                <Box key={shift.id || index}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: { xs: 1.5, sm: 2 },
                      p: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <Box
                      sx={{
                        textAlign: "center",
                        minWidth: { xs: 40, sm: 45 },
                        flexShrink: 0,
                      }}
                    >
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                      >
                        {new Date(shift.date).toLocaleDateString("en-GB", { weekday: "short" })}
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          lineHeight: 1,
                          fontSize: { xs: "1rem", sm: "1.25rem" },
                        }}
                      >
                        {new Date(shift.date).getDate()}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500,
                          fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                          wordBreak: "break-word",
                        }}
                      >
                        {shift.startTime} - {shift.endTime}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                      >
                        {shift.role || shift.department || ""}
                      </Typography>
                    </Box>
                  </Box>
                  {index < state.upcomingShifts.slice(0, 3).length - 1 && <Divider />}
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                No upcoming shifts scheduled
              </Typography>
            </Box>
          )}
          {state.upcomingShifts.length > 3 && (
            <>
              <Divider />
              <Box sx={{ p: { xs: 1, sm: 1.5 }, textAlign: "center" }}>
                <Button
                  size="small"
                  onClick={() => {
                    navigate("/ess/schedule")
                    // Scroll to top will be handled by ESSLayout useEffect
                  }}
                  endIcon={<ChevronRightIcon />}
                  sx={{
                    minHeight: { xs: 40, sm: 36 },
                    fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                  }}
                >
                  View All Shifts
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Typography 
        variant="subtitle2" 
        color="text.secondary" 
        sx={{ 
          mb: { xs: 1, sm: 1.5 }, 
          px: 0.5,
          fontSize: { xs: "0.75rem", sm: "0.875rem" },
        }}
      >
        Quick Links
      </Typography>
      <Grid container spacing={{ xs: 1, sm: 1.5 }}>
        {/* Payslips */}
        <Grid item xs={6}>
          <Card sx={{ borderRadius: { xs: 1.5, sm: 2 } }}>
            <CardActionArea 
              onClick={() => navigate("/ess/payslips")}
              sx={{ minHeight: { xs: 64, sm: "auto" } }}
            >
              <CardContent sx={{ 
                p: { xs: 1.5, sm: 2 }, 
                display: "flex", 
                alignItems: "center", 
                gap: { xs: 1, sm: 1.5 },
              }}>
                <Avatar sx={{ 
                  bgcolor: theme.palette.grey[100], 
                  width: { xs: 32, sm: 36 }, 
                  height: { xs: 32, sm: 36 },
                }}>
                  <PayslipIcon sx={{ fontSize: { xs: 18, sm: 20 } }} color="primary" />
                </Avatar>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                >
                  Payslips
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        {/* Time Off */}
        <Grid item xs={6}>
            <Card sx={{ borderRadius: { xs: 1.5, sm: 2 } }}>
              <CardActionArea 
              onClick={() => navigate("/ess/time-off?request=true")}
                sx={{ minHeight: { xs: 64, sm: "auto" } }}
              >
                <CardContent sx={{ 
                  p: { xs: 1.5, sm: 2 }, 
                  display: "flex", 
                  alignItems: "center", 
                  gap: { xs: 1, sm: 1.5 },
                }}>
                  <Avatar sx={{ 
                    bgcolor: theme.palette.grey[100], 
                    width: { xs: 32, sm: 36 }, 
                    height: { xs: 32, sm: 36 },
                  }}>
                  <TimeOffIcon sx={{ fontSize: { xs: 18, sm: 20 } }} color="primary" />
                </Avatar>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                >
                  Request Time Off
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        {/* Performance - Full Width (2 columns) */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: { xs: 1.5, sm: 2 } }}>
            <CardActionArea 
              onClick={() => navigate("/ess/performance")}
              sx={{ minHeight: { xs: 64, sm: "auto" } }}
            >
              <CardContent sx={{ 
                p: { xs: 1.5, sm: 2 }, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                gap: { xs: 1, sm: 1.5 },
              }}>
                <Avatar sx={{ 
                  bgcolor: theme.palette.grey[100], 
                  width: { xs: 32, sm: 36 }, 
                  height: { xs: 32, sm: 36 },
                }}>
                  <PerformanceIcon sx={{ fontSize: { xs: 18, sm: 20 } }} color="primary" />
                  </Avatar>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500,
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                  >
                  Performance
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
      </Grid>
    </Box>
  )
}

export default ESSDashboard