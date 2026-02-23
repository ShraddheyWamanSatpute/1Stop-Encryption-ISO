"use client"
import type React from "react"
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Alert,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material"
import {
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material"
import { useState, useEffect, useCallback } from "react"
import { useCompany, CompanyChecklist, ChecklistCompletion } from "../../../backend/context/CompanyContext"
import { useSettings } from "../../../backend/context/SettingsContext"
import ChecklistCompletionDialog from "../../components/company/ChecklistCompletion"
import DataHeader from "../../components/reusable/DataHeader"
import RequireCompanyContext from "../../components/global/RequireCompanyContext"

// Define filter types for checklists
type SortOption = "dueDate" | "priority" | "title" | "category"
type StatusFilter = "all" | "overdue" | "due" | "upcoming" | "completed" | "late" | "expired"

// Utility helpers
const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const parseTime = (time?: string) => {
  if (!time) return { h: 23, m: 59 }
  const [h, m] = time.split(":").map((n) => Number(n) || 0)
  return { h, m }
}

const getDueDate = (checklist: CompanyChecklist, now = new Date()): Date => {
  const due = new Date(now)
  const schedule = checklist.schedule || ({} as any)
  switch (schedule.type) {
    case "daily": {
      const { h, m } = parseTime(schedule.closingTime)
      due.setHours(h, m, 0, 0)
      return due
    }
    case "weekly": {
      const openingDay = (schedule.openingDay || "monday") as any
      const dayMap: Record<string, number> = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
      }
      const target = dayMap[openingDay] ?? 1
      const current = due.getDay()
      const diff = ((target - current + 7) % 7)
      due.setDate(due.getDate() + diff)
      const { h, m } = parseTime(schedule.closingTime)
      due.setHours(h, m, 0, 0)
      return due
    }
    case "monthly": {
      const openingDate = schedule.openingDate || 1
      due.setDate(openingDate)
      const { h, m } = parseTime(schedule.closingTime)
      due.setHours(h, m, 0, 0)
      if (due < now) {
        // move to next month if passed
        due.setMonth(due.getMonth() + 1)
      }
      return due
    }
    case "4week": {
      // Narrow schedule for 4-week type to access optional startDate safely
      const s = schedule as { type: '4week'; startDate?: number; closingTime?: string }
      const start = s.startDate ? new Date(s.startDate) : now
      const msInDay = 24 * 60 * 60 * 1000
      const daysSince = Math.floor((now.getTime() - start.getTime()) / msInDay)
      const daysToNext = 28 - (daysSince % 28)
      due.setDate(due.getDate() + (daysToNext % 28))
      const { h, m } = parseTime(s.closingTime)
      due.setHours(h, m, 0, 0)
      return due
    }
    default: {
      // once/continuous/yearly fallback: today at closingTime if present
      const { h, m } = parseTime(schedule.closingTime)
      due.setHours(h, m, 0, 0)
      return due
    }
  }
}

const getNextDueDate = (checklist: CompanyChecklist) => getDueDate(checklist)

const getChecklistStatus = (
  checklist: CompanyChecklist,
  completions: ChecklistCompletion[],
  userId: string,
): string => {
  const now = new Date()
  const due = getDueDate(checklist, now)
  const expireHours = checklist.schedule?.expireTime
  const expireAt = expireHours ? new Date(due.getTime() + expireHours * 60 * 60 * 1000) : null

  const userCompletions = completions
    .filter((c) => c.checklistId === checklist.id && c.completedBy === userId)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))

  const latest = userCompletions[0]
  if (latest && latest.status === "completed" && latest.completedAt) {
    const compDate = new Date(latest.completedAt)
    if (isSameDay(compDate, due)) return "completed"
  }

  if (expireAt && now.getTime() > expireAt.getTime()) return "expired"
  if (isSameDay(now, due)) {
    // Due today
    if (now.getTime() >= due.getTime()) return "overdue"
    return "due"
  }
  if (now.getTime() > due.getTime()) return "overdue"
  return "upcoming"
}

const filterChecklistsByStatus = (
  checklists: CompanyChecklist[],
  completions: ChecklistCompletion[],
  status: string,
  userId: string,
) => {
  return checklists.filter((c) => {
    const s = getChecklistStatus(c, completions, userId)
    return status === "all" || s === status
  })
}

const formatDate = (timestamp: number | Date) => {
  return new Date(timestamp).toLocaleDateString()
}

const formatDateTime = (timestamp: number | Date | undefined) => {
  if (!timestamp) return "N/A"
  return new Date(timestamp).toLocaleString()
}

const getStreakCount = (completions: ChecklistCompletion[]) => {
  return completions?.length || 0
}

const MyChecklistPage: React.FC = () => {
  const { state: companyState, fetchChecklists, getChecklistCompletions } = useCompany()
  const { state: settingsState } = useSettings()

  const userId = settingsState.auth?.uid || ""

  // State management
  const [checklists, setChecklists] = useState<CompanyChecklist[]>([])
  const [completions, setCompletions] = useState<ChecklistCompletion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false)
  const [selectedChecklist, setSelectedChecklist] = useState<CompanyChecklist | null>(null)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [selectedChecklistHistory, setSelectedChecklistHistory] = useState<ChecklistCompletion[]>([])

  // Search, filter and sort state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<SortOption>("dueDate")
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  
  // Date range state
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [dateType, setDateType] = useState<"day" | "week" | "month" | "custom">("week")

  const loadData = useCallback(async () => {
    if (!companyState.companyID || !userId) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [checklistsData, completionsData] = await Promise.all([fetchChecklists(), getChecklistCompletions()])

      setChecklists(checklistsData || [])
      setCompletions(completionsData || [])
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Failed to load checklists. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID, userId, fetchChecklists, getChecklistCompletions])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getAssignedChecklists = useCallback((): CompanyChecklist[] => {
    if (!userId) {
      return []
    }

    return checklists.filter((checklist) => {
      // If global access is enabled, include all checklists
      if (checklist.isGlobalAccess) {
        return true
      }

      const assignments = checklist.assignedTo || []
      // const teamAssignments = checklist.assignedToTeams || []

      // Check if user is directly assigned
      if (assignments.includes(userId)) {
        return true
      }

      // Check if checklist is assigned to current site/subsite
      if (checklist.siteId && companyState.selectedSiteID && checklist.siteId === companyState.selectedSiteID) {
        return true
      }

      if (
        checklist.subsiteId &&
        companyState.selectedSubsiteID &&
        checklist.subsiteId === companyState.selectedSubsiteID
      ) {
        return true
      }

      return false
    })
  }, [checklists, userId, companyState.selectedSiteID, companyState.selectedSubsiteID])

  const assignedChecklists = getAssignedChecklists()
  const overdueChecklists = filterChecklistsByStatus(assignedChecklists, completions, "overdue", userId)
  const dueChecklists = filterChecklistsByStatus(assignedChecklists, completions, "due", userId)
  const upcomingChecklists = filterChecklistsByStatus(assignedChecklists, completions, "upcoming", userId)
  const completedChecklists = filterChecklistsByStatus(assignedChecklists, completions, "completed", userId)
  const lateChecklists = filterChecklistsByStatus(assignedChecklists, completions, "late", userId)
  const expiredChecklists = filterChecklistsByStatus(assignedChecklists, completions, "expired", userId)

  const handleStartChecklist = (checklist: CompanyChecklist) => {
    setSelectedChecklist(checklist)
    setCompletionDialogOpen(true)
  }

  const handleChecklistComplete = (completion: ChecklistCompletion) => {
    // Update the completions list with the new completion
    setCompletions((prev) => {
      const filtered = prev.filter((c) => c.checklistId !== completion.checklistId)
      return [...filtered, completion]
    })

    setCompletionDialogOpen(false)
    setSelectedChecklist(null)
  }

  const handleViewHistory = (checklist: CompanyChecklist) => {
    const history = completions.filter((c) => c.checklistId === checklist.id && c.completedBy === userId)
    setSelectedChecklistHistory(history)
    setHistoryDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "overdue":
        return "error"
      case "due":
        return "warning"
      case "upcoming":
        return "info"
      case "completed":
        return "success"
      case "late":
        return "warning"
      case "expired":
        return "error"
      default:
        return "default"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "overdue":
        return <WarningIcon />
      case "due":
        return <ScheduleIcon />
      case "upcoming":
        return <AssignmentIcon />
      case "completed":
        return <CheckCircleIcon />
      case "late":
        return <AccessTimeIcon />
      case "expired":
        return <CloseIcon />
      default:
        return <AssignmentIcon />
    }
  }

  const renderChecklistCard = (checklist: CompanyChecklist) => {
    const status = getChecklistStatus(checklist, completions, userId)
    const nextDue = getNextDueDate(checklist)
    const checklistCompletions = completions.filter((c) => c.checklistId === checklist.id && c.completedBy === userId)
    const streak = getStreakCount(checklistCompletions)

    return (
      <Card key={checklist.id} variant="outlined" sx={{ mb: 1 }}>
        <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 0.5, fontSize: "1.1rem" }}>
                {checklist.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: "0.875rem" }}>
                {checklist.description}
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1 }}>
                <Chip
                  icon={getStatusIcon(status)}
                  label={status.toUpperCase()}
                  color={getStatusColor(status) as any}
                  size="small"
                  sx={{ fontSize: "0.75rem", height: 24 }}
                />
                <Chip
                  label={checklist.category || "General"}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.75rem", height: 24 }}
                />
                <Chip
                  label={checklist.schedule?.type || "One-time"}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.75rem", height: 24 }}
                />
                {streak > 0 && (
                  <Chip
                    label={`${streak} streak`}
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ fontSize: "0.75rem", height: 24 }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          <Grid container spacing={1} sx={{ mb: 1.5 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem" }}>
                  {status === "completed" ? "Completed" : "Due"}: {formatDate(nextDue)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <HistoryIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem" }}>
                  Completed {checklistCompletions.length} times
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            {status !== "completed" && (
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                size="small"
                onClick={() => handleStartChecklist(checklist)}
                sx={{ fontSize: "0.75rem" }}
              >
                Start
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              size="small"
              onClick={() => handleViewHistory(checklist)}
              sx={{ fontSize: "0.75rem" }}
            >
              History
            </Button>
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
          Loading your checklists...
        </Typography>
      </Box>
    )
  }

  return (
    <RequireCompanyContext requireSite>
    <Box sx={{ p: 0 }}>
      <DataHeader
        onRefresh={loadData}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        dateType={dateType}
        onDateTypeChange={setDateType}
        showDateControls={true}
        showDateTypeSelector={true}
        availableDateTypes={["day", "week", "month", "custom"]}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search checklists..."
        filters={[
          {
            label: "Status",
            options: [
              { id: "all", name: "All" },
              { id: "overdue", name: "Overdue" },
              { id: "due", name: "Due Today" },
              { id: "upcoming", name: "Upcoming" },
              { id: "completed", name: "Completed" },
              { id: "late", name: "Late" },
              { id: "expired", name: "Expired" }
            ],
            selectedValues: statusFilter !== "all" ? [statusFilter] : [],
            onSelectionChange: (values) => setStatusFilter(values[0] as StatusFilter || "all")
          },
          {
            label: "Category",
            options: [...new Set(assignedChecklists.map((c) => c.category || "General"))].map(cat => ({ id: cat, name: cat })),
            selectedValues: categoryFilter !== "all" ? [categoryFilter] : [],
            onSelectionChange: (values) => setCategoryFilter(values[0] || "all")
          }
        ]}
        filtersExpanded={filtersExpanded}
        onFiltersToggle={() => setFiltersExpanded(!filtersExpanded)}
        sortOptions={[
          { value: "dueDate", label: "Due Date" },
          { value: "priority", label: "Priority" },
          { value: "title", label: "Title" },
          { value: "category", label: "Category" }
        ]}
        sortValue={sortBy}
        sortDirection="asc"
        onSortChange={(value) => setSortBy(value as SortOption)}
        onExportCSV={() => {
          setError("CSV export feature coming soon!")
        }}
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!companyState.companyID || !companyState.selectedSiteID ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Please select a company and site to view your checklists.
        </Alert>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ textAlign: "center" }}>
                <CardContent sx={{ py: 2 }}>
                  <WarningIcon sx={{ fontSize: 32, color: "error.main", mb: 0.5 }} />
                  <Typography variant="h6" sx={{ fontSize: "1.25rem" }}>
                    {overdueChecklists.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                    Overdue
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ textAlign: "center" }}>
                <CardContent sx={{ py: 2 }}>
                  <ScheduleIcon sx={{ fontSize: 32, color: "warning.main", mb: 0.5 }} />
                  <Typography variant="h6" sx={{ fontSize: "1.25rem" }}>
                    {dueChecklists.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                    Due Today
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ textAlign: "center" }}>
                <CardContent sx={{ py: 2 }}>
                  <AssignmentIcon sx={{ fontSize: 32, color: "info.main", mb: 0.5 }} />
                  <Typography variant="h6" sx={{ fontSize: "1.25rem" }}>
                    {upcomingChecklists.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                    Upcoming
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ textAlign: "center" }}>
                <CardContent sx={{ py: 2 }}>
                  <CheckCircleIcon sx={{ fontSize: 32, color: "success.main", mb: 0.5 }} />
                  <Typography variant="h6" sx={{ fontSize: "1.25rem" }}>
                    {completedChecklists.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                    Completed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ textAlign: "center" }}>
                <CardContent sx={{ py: 2 }}>
                  <AccessTimeIcon sx={{ fontSize: 32, color: "orange", mb: 0.5 }} />
                  <Typography variant="h6" sx={{ fontSize: "1.25rem" }}>
                    {lateChecklists.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                    Late
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ textAlign: "center" }}>
                <CardContent sx={{ py: 2 }}>
                  <CloseIcon sx={{ fontSize: 32, color: "error.main", mb: 0.5 }} />
                  <Typography variant="h6" sx={{ fontSize: "1.25rem" }}>
                    {expiredChecklists.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                    Expired
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>


          {/* Filtered and Sorted Checklists */}
          <Box>
            {(() => {
              // Filter checklists based on search, status, category, and date range
              const filteredChecklists = assignedChecklists.filter((checklist) => {
                const matchesSearch =
                  searchQuery === "" ||
                  checklist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (checklist.description && checklist.description.toLowerCase().includes(searchQuery.toLowerCase()))

                const checklistStatus = getChecklistStatus(checklist, completions, userId)
                const matchesStatus = statusFilter === "all" || checklistStatus === statusFilter

                const matchesCategory = categoryFilter === "all" || (checklist.category || "General") === categoryFilter

                // Filter by date range - for now, we'll show all checklists since dueDate is calculated dynamically
                // TODO: Implement proper date filtering based on schedule calculation
                const matchesDateRange = true

                return matchesSearch && matchesStatus && matchesCategory && matchesDateRange
              })

              // Sort checklists
              if (sortBy === "title") {
                filteredChecklists.sort((a, b) => a.title.localeCompare(b.title))
              } else if (sortBy === "category") {
                filteredChecklists.sort((a, b) => (a.category || "General").localeCompare(b.category || "General"))
              }

              if (filteredChecklists.length === 0) {
                return (
                  <Card>
                    <CardContent sx={{ textAlign: "center", py: 4 }}>
                      <AssignmentIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
                      <Typography variant="h6" sx={{ mb: 0.5 }}>
                        No checklists found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Try adjusting your filters or search query
                      </Typography>
                    </CardContent>
                  </Card>
                )
              }

              return filteredChecklists.map((checklist) => renderChecklistCard(checklist))
            })()}
          </Box>

          {/* Completion Dialog */}
          {selectedChecklist && (
            <ChecklistCompletionDialog
              open={completionDialogOpen}
              onClose={() => {
                setCompletionDialogOpen(false)
                setSelectedChecklist(null)
              }}
              checklist={selectedChecklist}
              onComplete={handleChecklistComplete}
            />
          )}

          {/* History Dialog */}
          <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">Completion History</Typography>
                <IconButton onClick={() => setHistoryDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedChecklistHistory.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <HistoryIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    No completion history
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Complete this checklist to see your history here
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Completed On</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Completed By</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedChecklistHistory
                        .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
                        .map((completion) => (
                          <TableRow key={completion.id}>
                            <TableCell>{formatDateTime(completion.completedAt)}</TableCell>
                            <TableCell>
                              <Chip
                                label={completion.status}
                                color={completion.status === "completed" ? "success" : "default"}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{completion.completedBy || "Unknown"}</TableCell>
                            <TableCell>
                              {completion.overallNotes
                                ? completion.overallNotes.substring(0, 50) + "..."
                                : "No notes"}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
    </RequireCompanyContext>
  )
}

export default MyChecklistPage
