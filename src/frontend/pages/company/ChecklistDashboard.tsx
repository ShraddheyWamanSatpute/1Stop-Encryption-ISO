"use client"
import type React from "react"
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Tooltip,
  LinearProgress,
} from "@mui/material"
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from "@mui/icons-material"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useCompany, CompanyChecklist, ChecklistCompletion } from "../../../backend/context/CompanyContext"
import LocationPlaceholder from "../../components/common/LocationPlaceholder"
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachMonthOfInterval,
  isToday,
} from "date-fns"
import DataHeader from "../../components/reusable/DataHeader"
import StatsSection from "../../components/reusable/StatsSection"

type TimeRange = "daily" | "weekly" | "monthly" | "yearly"

interface DayScore {
  date: Date
  score: number
  totalTasks: number
  completedOnTime: number
  completedLate: number
  notCompleted: number
  color: string
}

interface PeriodStats {
  averageScore: number
  totalTasks: number
  completedOnTime: number
  completedLate: number
  notCompleted: number
  completionRate: number
  onTimeRate: number
}

const ChecklistDashboard: React.FC = () => {
  const { state: companyState, fetchChecklists, getChecklistCompletions } = useCompany()

  // Show location placeholder if no company is selected
  if (!companyState.companyID) {
    return <LocationPlaceholder />
  }

  // State management
  const [checklists, setChecklists] = useState<CompanyChecklist[]>([])
  const [completions, setCompletions] = useState<ChecklistCompletion[]>([])
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>("daily")
  const [currentDate, setCurrentDate] = useState(new Date())

  const loadData = useCallback(async () => {
    if (!companyState.companyID) return

    try {
      setLoading(true)
      const [checklistsData, completionsData] = await Promise.all([fetchChecklists(), getChecklistCompletions()])

      setChecklists(checklistsData || [])
      setCompletions(completionsData || [])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }, [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID, fetchChecklists, getChecklistCompletions])

  // Load data when company, site, subsite, date, or time range changes
  useEffect(() => {
    loadData()
  }, [loadData, currentDate, timeRange])

  // Calculate score based on completion status
  const calculateScore = (completedOnTime: number, completedLate: number, notCompleted: number): number => {
    const total = completedOnTime + completedLate + notCompleted
    if (total === 0) return 100 // No tasks = perfect score

    const onTimeWeight = 1.0
    const lateWeight = 0.6
    const notCompletedWeight = 0.0

    const weightedScore =
      (completedOnTime * onTimeWeight + completedLate * lateWeight + notCompleted * notCompletedWeight) / total

    return Math.round(weightedScore * 100)
  }

  // Get color based on score (traffic light system)
  const getScoreColor = (score: number): string => {
    if (score >= 90) return "#2e7d32"
    if (score >= 80) return "#66bb6a"
    if (score >= 70) return "#cddc39"
    if (score >= 60) return "#ffeb3b"
    if (score >= 50) return "#ffc107"
    if (score >= 40) return "#ff9800"
    if (score >= 30) return "#ff7043"
    return "#d32f2f"
  }

  // Get period boundaries
  const getPeriodBounds = (date: Date, range: TimeRange) => {
    switch (range) {
      case "daily":
        return { start: startOfDay(date), end: endOfDay(date) }
      case "weekly":
        return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) }
      case "monthly":
        return { start: startOfMonth(date), end: endOfMonth(date) }
      case "yearly":
        return { start: startOfYear(date), end: endOfYear(date) }
    }
  }

  // Calculate scores for the current period
  const periodScores = useMemo(() => {
    const { start, end } = getPeriodBounds(currentDate, timeRange)
    const scores: DayScore[] = []

    let intervals: Date[] = []
    switch (timeRange) {
      case "daily":
        intervals = eachDayOfInterval({ start, end })
        break
      case "weekly":
        intervals = eachDayOfInterval({ start, end })
        break
      case "monthly":
        intervals = eachDayOfInterval({ start, end })
        break
      case "yearly":
        intervals = eachMonthOfInterval({ start, end }).map((date) => startOfMonth(date))
        break
    }

    intervals.forEach((intervalDate: Date) => {
      let periodStart: Date, periodEnd: Date

      if (timeRange === "yearly") {
        periodStart = startOfMonth(intervalDate)
        periodEnd = endOfMonth(intervalDate)
      } else {
        periodStart = startOfDay(intervalDate)
        periodEnd = endOfDay(intervalDate)
      }

      // Get all tasks that were due in this period
      const dueTasks: Array<{ checklist: CompanyChecklist; dueDate: Date }> = []

      checklists.forEach((checklist) => {
        if (!checklist.schedule || checklist.status !== "active") return

        // Calculate if this checklist was due in the current period
        const schedule = checklist.schedule
        let isDue = false
        let actualDueDate = periodStart

        switch (schedule.type) {
          case "daily":
            // Check if this day matches the repeat pattern
            const dayName = format(periodStart, "EEEE").toLowerCase()
            const dayKey = dayName as keyof typeof schedule.repeatDays
            if (schedule.repeatDays?.[dayKey]) {
              isDue = true
              // Set due time based on closing time
              if (schedule.closingTime) {
                const [hours, minutes] = schedule.closingTime.split(":").map(Number)
                actualDueDate = new Date(periodStart)
                actualDueDate.setHours(hours, minutes, 0, 0)
              }
            }
            break

          case "weekly":
            // Check if this week includes the opening day
            const weekStart = startOfWeek(periodStart, { weekStartsOn: 1 })
            const openingDay = schedule.openingDay || "monday"
            const dayMap = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 }

            // Calculate the actual opening day in this week
            const targetDayOfWeek = dayMap[openingDay as keyof typeof dayMap]
            const openingDate = new Date(weekStart)
            openingDate.setDate(weekStart.getDate() + targetDayOfWeek - 1)

            if (openingDate >= periodStart && openingDate <= periodEnd) {
              isDue = true
              actualDueDate = openingDate
              if (schedule.closingTime) {
                const [hours, minutes] = schedule.closingTime.split(":").map(Number)
                actualDueDate.setHours(hours, minutes, 0, 0)
              }
            }
            break

          case "monthly":
            // Check if this month includes the opening date
            const monthStart = startOfMonth(periodStart)
            const openingDateInMonth = new Date(monthStart)
            openingDateInMonth.setDate(schedule.openingDate || 1)

            if (openingDateInMonth >= periodStart && openingDateInMonth <= periodEnd) {
              isDue = true
              actualDueDate = openingDateInMonth
              if (schedule.closingTime) {
                const [hours, minutes] = schedule.closingTime.split(":").map(Number)
                actualDueDate.setHours(hours, minutes, 0, 0)
              }
            }
            break

          case "once":
            // For one-time checklists, check if they were created in this period
            if (
              checklist.createdAt &&
              checklist.createdAt >= periodStart.getTime() &&
              checklist.createdAt <= periodEnd.getTime()
            ) {
              isDue = true
              actualDueDate = new Date(checklist.createdAt)
            }
            break
        }

        if (isDue) {
          dueTasks.push({ checklist, dueDate: actualDueDate })
        }
      })

      // Get completions for this period
      const periodCompletions = completions.filter((completion: ChecklistCompletion) => {
        const completionDate = new Date(completion.completedAt || 0)
        return completionDate >= periodStart && completionDate <= periodEnd
      })

      // Calculate metrics with proper due date matching
      let completedOnTime = 0
      let completedLate = 0
      let notCompleted = 0

      dueTasks.forEach(({ checklist, dueDate }: { checklist: CompanyChecklist; dueDate: Date }) => {
        const taskCompletions = periodCompletions.filter((c: ChecklistCompletion) => c.checklistId === checklist.id)
        if (taskCompletions.length > 0) {
          // Find the completion closest to the due date
          const relevantCompletion = taskCompletions.reduce((closest: ChecklistCompletion, current: ChecklistCompletion) => {
            const closestDiff = Math.abs(new Date(closest.completedAt || 0).getTime() - dueDate.getTime())
            const currentDiff = Math.abs(new Date(current.completedAt || 0).getTime() - dueDate.getTime())
            return currentDiff < closestDiff ? current : closest
          })

          // Check if it was completed on time
          if (new Date(relevantCompletion.completedAt || 0) <= dueDate) {
            completedOnTime++
          } else {
            completedLate++
          }
        } else {
          // Only count as not completed if the due date has passed
          if (dueDate < new Date()) {
            notCompleted++
          }
        }
      })

      const totalTasks = completedOnTime + completedLate + notCompleted
      const score = calculateScore(completedOnTime, completedLate, notCompleted)

      scores.push({
        date: intervalDate,
        score,
        totalTasks,
        completedOnTime,
        completedLate,
        notCompleted,
        color: getScoreColor(score),
      })
    })

    return scores
  }, [checklists, completions, currentDate, timeRange])

  // Calculate period statistics
  const periodStats: PeriodStats = useMemo(() => {
    const totalTasks = periodScores.reduce((sum: number, day: DayScore) => sum + day.totalTasks, 0)
    const completedOnTime = periodScores.reduce((sum: number, day: DayScore) => sum + day.completedOnTime, 0)
    const completedLate = periodScores.reduce((sum: number, day: DayScore) => sum + day.completedLate, 0)
    const notCompleted = periodScores.reduce((sum: number, day: DayScore) => sum + day.notCompleted, 0)

    const averageScore =
      totalTasks > 0 ? periodScores.reduce((sum, day) => sum + day.score, 0) / periodScores.length : 100
    const completionRate = totalTasks > 0 ? ((completedOnTime + completedLate) / totalTasks) * 100 : 100
    const onTimeRate = totalTasks > 0 ? (completedOnTime / totalTasks) * 100 : 100

    return {
      averageScore: Math.round(averageScore),
      totalTasks,
      completedOnTime,
      completedLate,
      notCompleted,
      completionRate: Math.round(completionRate),
      onTimeRate: Math.round(onTimeRate),
    }
  }, [periodScores])


  // Render calendar grid
  const renderCalendarGrid = () => {
    if (timeRange === "daily") {
      const dayScore = periodScores[0]
      if (!dayScore) return null

      return (
        <Card sx={{ p: 4, textAlign: "center", backgroundColor: dayScore.color, color: "white" }}>
          <Typography variant="h1" sx={{ fontSize: "4rem", fontWeight: "bold", mb: 2 }}>
            {dayScore.score}
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Daily Score
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Typography variant="body2">
                <CheckCircleIcon sx={{ mr: 0.5, verticalAlign: "middle" }} />
                On Time: {dayScore.completedOnTime}
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="body2">
                <WarningIcon sx={{ mr: 0.5, verticalAlign: "middle" }} />
                Late: {dayScore.completedLate}
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="body2">
                <ErrorIcon sx={{ mr: 0.5, verticalAlign: "middle" }} />
                Not Done: {dayScore.notCompleted}
              </Typography>
            </Grid>
          </Grid>
        </Card>
      )
    }

    // Grid layout for weekly, monthly, yearly
    const gridCols = timeRange === "weekly" ? 7 : timeRange === "monthly" ? 7 : 4
    const cellSize = timeRange === "yearly" ? 120 : 80

    return (
      <Grid container spacing={1}>
        {periodScores.map((dayScore: DayScore, index: number) => (
          <Grid item xs={12 / gridCols} key={index}>
            <Tooltip
              title={
                <Box>
                  <Typography variant="subtitle2">
                    {timeRange === "yearly" ? format(dayScore.date, "MMMM yyyy") : format(dayScore.date, "MMM d")}
                  </Typography>
                  <Typography variant="body2">Score: {dayScore.score}</Typography>
                  <Typography variant="body2">Total Tasks: {dayScore.totalTasks}</Typography>
                  <Typography variant="body2">On Time: {dayScore.completedOnTime}</Typography>
                  <Typography variant="body2">Late: {dayScore.completedLate}</Typography>
                  <Typography variant="body2">Not Done: {dayScore.notCompleted}</Typography>
                </Box>
              }
            >
              <Paper
                sx={{
                  height: cellSize,
                  backgroundColor: dayScore.color,
                  color: "white",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  border: isToday(dayScore.date) ? "3px solid #fff" : "none",
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
                onClick={() => setCurrentDate(dayScore.date)}
              >
                <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                  {timeRange === "yearly" ? format(dayScore.date, "MMM") : format(dayScore.date, "d")}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                  {dayScore.score}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
                  {dayScore.totalTasks} tasks
                </Typography>
              </Paper>
            </Tooltip>
          </Grid>
        ))}
      </Grid>
    )
  }

  return (
    <Box sx={{ p: 0 }}>
      {/* Data Header with Date Navigation */}
      <DataHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        dateType={timeRange === "daily" ? "day" : timeRange === "weekly" ? "week" : timeRange === "monthly" ? "month" : "custom"}
        onDateTypeChange={(type) => {
          const newTimeRange = type === "day" ? "daily" : type === "week" ? "weekly" : type === "month" ? "monthly" : "yearly"
          setTimeRange(newTimeRange as TimeRange)
        }}
        showDateControls={true}
        showDateTypeSelector={true}
        availableDateTypes={["day", "week", "month", "custom"]}
        onRefresh={loadData}
      />

      {/* Statistics Cards */}
      <StatsSection
        stats={[
          {
            value: periodStats.averageScore,
            label: "Average Score",
            color: periodStats.averageScore >= 90 ? "success" : periodStats.averageScore >= 70 ? "warning" : "error"
          },
          {
            value: periodStats.totalTasks,
            label: "Total Tasks",
            color: "primary"
          },
          {
            value: periodStats.completionRate,
            label: "Completion Rate",
            color: "success",
            suffix: "%"
          },
          {
            value: periodStats.onTimeRate,
            label: "On-Time Rate",
            color: "info",
            suffix: "%"
          }
        ]}
      />

      {/* Task Status Cards */}
      <StatsSection
        stats={[
          {
            value: periodStats.completedOnTime,
            label: "Completed On Time",
            color: "success"
          },
          {
            value: periodStats.completedLate,
            label: "Completed Late",
            color: "warning"
          },
          {
            value: periodStats.notCompleted,
            label: "Not Completed",
            color: "error"
          }
        ]}
        columns={3}
      />

      {/* Calendar Grid */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <LinearProgress sx={{ width: "50%" }} />
            </Box>
          ) : (
            renderCalendarGrid()
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default ChecklistDashboard
