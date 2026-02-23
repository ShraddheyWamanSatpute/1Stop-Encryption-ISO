"use client"

import type React from "react"
import { useEffect, useMemo, useState, useCallback } from "react"
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Divider,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material"
import {
  ExpandMore as ExpandMoreIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material"
import { useCompany } from "../../../backend/context/CompanyContext"
import type { CompanyChecklist, ChecklistCompletion, ItemResponse, UserProfile } from "../../../backend/interfaces/Company"
import { fetchUserProfile } from "../../../backend/functions/Company"
import { formatDateTime } from "../../../backend/utils/checklistUtils"
import DataHeader from "../../components/reusable/DataHeader"
import RequireCompanyContext from "../../components/global/RequireCompanyContext"

type StatusFilter = "all" | "completed" | "in_progress" | "overdue" | "late" | "expired"
type SortOption = "completedAt" | "title" | "status" | "score"

// Simple in-memory cache for user profiles to avoid refetching
const userProfileCache: Record<string, UserProfile> = {}

const ChecklistHistoryPage: React.FC = () => {
  const { state: companyState, fetchChecklists, getChecklistCompletions } = useCompany()

  const [checklists, setChecklists] = useState<CompanyChecklist[]>([])
  const [completions, setCompletions] = useState<ChecklistCompletion[]>([])
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({})
  const [loading, setLoading] = useState(false)
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [userFilter, setUserFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<SortOption>("completedAt")
  const [selectedCompletion, setSelectedCompletion] = useState<ChecklistCompletion | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)


  const checklistsById = useMemo(() => {
    const map: Record<string, CompanyChecklist> = {}
    checklists.forEach((cl) => {
      map[cl.id] = cl
    })
    return map
  }, [checklists])

  const getUserDisplayName = (userId: string): string => {
    const profile = userProfiles[userId]
    if (!profile) return userId || "Unknown"
    if (profile.firstName || profile.lastName) {
      return `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
    }
    if (profile.displayName) {
      return profile.displayName
    }
    return profile.email || userId || "Unknown"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success"
      case "late":
        return "warning"
      case "overdue":
      case "expired":
        return "error"
      case "in_progress":
        return "info"
      default:
        return "default"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon />
      case "late":
      case "in_progress":
        return <AccessTimeIcon />
      case "overdue":
        return <WarningIcon />
      case "expired":
        return <CloseIcon />
      default:
        return <AssignmentIcon />
    }
  }

  const renderResponseCard = (checklistId: string, itemId: string, response: ItemResponse) => {
    const checklist = checklistsById[checklistId]
    if (!checklist) {
      return (
        <Card variant="outlined" sx={{ mb: 1 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="body2">{String(response.value ?? "")}</Typography>
          </CardContent>
        </Card>
      )
    }

    // Find the matching item by ID (taking into account sanitised IDs in responses)
    const sections = checklist.sections || []
    const allItems = sections.flatMap((s) => s.items || [])
    const item = allItems.find((i) => {
      if (!i.id) return false
      const sanitisedId = i.id.replace(/[.#$\[\]/]/g, "_")
      return i.id === itemId || sanitisedId === itemId
    })

    const label = item?.title || itemId
    const description = item?.description || ""

    let valueDisplay: React.ReactNode = ""
    let hasWarning = false
    let warningMessage = ""

    switch (response.type) {
      case "checkbox":
      case "yesno":
        valueDisplay = response.value === true ? "Yes" : response.value === false ? "No" : "Not answered"
        if (response.value === false && response.explanation) {
          warningMessage = `Explanation: ${response.explanation}`
        }
        break
      case "number":
        valueDisplay = response.value ?? ""
        if (response.isOutOfRange) {
          hasWarning = true
          warningMessage = `Value is out of acceptable range`
          if (response.explanation) {
            warningMessage += ` - ${response.explanation}`
          }
        } else if (response.warningLevel === "critical") {
          hasWarning = true
          warningMessage = "Critical threshold reached"
        } else if (response.warningLevel === "warning") {
          hasWarning = true
          warningMessage = "Warning threshold reached"
        }
        break
      case "text":
        valueDisplay = response.value ?? ""
        break
      case "file":
      case "photo":
        valueDisplay = (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {response.photos?.length || 0} photo(s)
            </Typography>
            {response.photos && response.photos.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                {response.photos.map((photo, idx) => (
                  <Link
                    key={idx}
                    href={photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: "block" }}
                  >
                    <Box
                      component="img"
                      src={photo}
                      alt={`Photo ${idx + 1}`}
                      sx={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 1,
                        border: 1,
                        borderColor: "divider",
                        cursor: "pointer",
                        "&:hover": { opacity: 0.8 },
                      }}
                    />
                  </Link>
                ))}
              </Box>
            )}
          </Box>
        )
        break
      case "multiple_entry": {
        const entries = Array.isArray(response.value) ? response.value : []
        valueDisplay = (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {entries.length} log entr{entries.length === 1 ? "y" : "ies"}
            </Typography>
            {entries.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {entries.map((entry: any, idx: number) => (
                  <Card key={idx} variant="outlined" sx={{ mb: 1, p: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                      {entry.timestamp ? formatDateTime(entry.timestamp) : `Entry ${idx + 1}`}
                    </Typography>
                    {entry.fields && (
                      <Stack spacing={0.5}>
                        {Object.entries(entry.fields).map(([fieldKey, fieldValue]) => (
                          <Typography key={fieldKey} variant="body2">
                            <strong>{fieldKey}:</strong> {String(fieldValue ?? "")}
                          </Typography>
                        ))}
                      </Stack>
                    )}
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )
        break
      }
      default:
        valueDisplay = String(response.value ?? "")
    }

    return (
      <Card variant="outlined" sx={{ mb: 1.5 }}>
        <CardContent sx={{ py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: "medium" }}>
            {label}
          </Typography>
          {description && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              {description}
            </Typography>
          )}
          <Typography variant="body2" sx={{ mb: hasWarning || response.explanation ? 1 : 0 }}>
            <strong>Answer:</strong> {valueDisplay}
          </Typography>
          {hasWarning && (
            <Alert severity={response.warningLevel === "critical" ? "error" : "warning"} sx={{ mt: 1, mb: 1 }}>
              {warningMessage}
            </Alert>
          )}
          {response.explanation && !hasWarning && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: "italic" }}>
              <strong>Explanation:</strong> {response.explanation}
            </Typography>
          )}
        </CardContent>
      </Card>
    )
  }

  const filteredAndSortedCompletions = useMemo(() => {
    let list = [...completions]

    // Attach checklist metadata for filtering/sorting
    list = list.filter((completion) => !!checklistsById[completion.checklistId])

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((completion) => {
        const checklist = checklistsById[completion.checklistId]
        const title = checklist?.title?.toLowerCase() || ""
        const description = checklist?.description?.toLowerCase() || ""
        const category = checklist?.category?.toLowerCase() || ""
        const completedByName = getUserDisplayName(completion.completedBy).toLowerCase()
        return (
          title.includes(q) ||
          description.includes(q) ||
          category.includes(q) ||
          completedByName.includes(q) ||
          completion.completedBy?.toLowerCase().includes(q)
        )
      })
    }

    if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter)
    }

    if (categoryFilter !== "all") {
      list = list.filter((c) => {
        const checklist = checklistsById[c.checklistId]
        return checklist?.category === categoryFilter
      })
    }

    if (userFilter !== "all") {
      list = list.filter((c) => c.completedBy === userFilter)
    }

    list.sort((a, b) => {
      const checklistA = checklistsById[a.checklistId]
      const checklistB = checklistsById[b.checklistId]

      switch (sortBy) {
        case "title":
          return (checklistA?.title || "").localeCompare(checklistB?.title || "")
        case "status":
          return (a.status || "").localeCompare(b.status || "")
        case "score":
          return (b.completionScore || 0) - (a.completionScore || 0)
        case "completedAt":
        default:
          return b.completedAt - a.completedAt
      }
    })

    return list
  }, [completions, checklistsById, searchQuery, statusFilter, categoryFilter, userFilter, sortBy, userProfiles])

  if (!companyState.companyID || !companyState.selectedSiteID) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Please select a company and site to view checklist history.</Alert>
      </Box>
    )
  }

  const loadData = useCallback(async () => {
    if (!companyState.companyID) return

    try {
      setLoading(true)
      setError(null)

      // First, load checklists and completions (show these immediately)
      // Use CompanyContext functions which handle site/subsite selection automatically
      const [checklistsData, completionsData] = await Promise.all([
        fetchChecklists(),
        getChecklistCompletions(),
      ])

      setChecklists(checklistsData || [])
      setCompletions(completionsData || [])
      setLoading(false) // Show data immediately, even without user profiles

      // Then load user profiles in the background (progressive loading)
      const uniqueUserIds = [...new Set((completionsData || []).map((c) => c.completedBy).filter(Boolean))]
      
      if (uniqueUserIds.length > 0) {
        setLoadingProfiles(true)
        
        // First, load cached profiles immediately
        const cachedProfiles: Record<string, UserProfile> = {}
        const uncachedUserIds: string[] = []
        
        uniqueUserIds.forEach((userId) => {
          if (userProfileCache[userId]) {
            cachedProfiles[userId] = userProfileCache[userId]
          } else {
            uncachedUserIds.push(userId)
          }
        })
        
        // Set cached profiles immediately
        if (Object.keys(cachedProfiles).length > 0) {
          setUserProfiles((prev) => ({ ...prev, ...cachedProfiles }))
        }
        
        // Then fetch uncached profiles in batches
        if (uncachedUserIds.length > 0) {
          const BATCH_SIZE = 10
          
          // Process in batches to avoid overwhelming the database
          for (let i = 0; i < uncachedUserIds.length; i += BATCH_SIZE) {
            const batch = uncachedUserIds.slice(i, i + BATCH_SIZE)
            await Promise.all(
              batch.map(async (userId) => {
                try {
                  const profile = await fetchUserProfile(userId)
                  if (profile) {
                    // Cache the profile
                    userProfileCache[userId] = profile
                    // Update state incrementally for better UX
                    setUserProfiles((prev) => ({ ...prev, [userId]: profile }))
                  }
                } catch (err) {
                  console.error(`Error fetching profile for user ${userId}:`, err)
                }
              }),
            )
          }
        }
        
        setLoadingProfiles(false)
      }
    } catch (err) {
      console.error("Error loading checklist history:", err)
      setError("Failed to load checklist history")
      setLoading(false)
      setLoadingProfiles(false)
    }
  }, [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID, fetchChecklists, getChecklistCompletions])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <RequireCompanyContext>
    <Box sx={{ p: 0 }}>
      <DataHeader
        onRefresh={loadData}
        showDateControls={false}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by checklist, category, description or user..."
        filters={[
          {
            label: "Status",
            options: [
              { id: "all", name: "All Statuses" },
              { id: "completed", name: "Completed" },
              { id: "late", name: "Late" },
              { id: "overdue", name: "Overdue" },
              { id: "expired", name: "Expired" },
              { id: "in_progress", name: "In Progress" }
            ],
            selectedValues: statusFilter !== "all" ? [statusFilter] : [],
            onSelectionChange: (values) => setStatusFilter(values[0] as StatusFilter || "all")
          },
          {
            label: "Category",
            options: [
              { id: "all", name: "All Categories" },
              ...Array.from(new Set(checklists.map(c => c.category).filter(Boolean))).map(cat => ({
                id: cat,
                name: cat
              }))
            ],
            selectedValues: categoryFilter !== "all" ? [categoryFilter] : [],
            onSelectionChange: (values) => setCategoryFilter(values[0] || "all")
          },
          {
            label: "User",
            options: [
              { id: "all", name: "All Users" },
              ...Array.from(new Set(completions.map(c => c.completedBy).filter(Boolean))).map(uid => ({
                id: uid,
                name: getUserDisplayName(uid)
              }))
            ],
            selectedValues: userFilter !== "all" ? [userFilter] : [],
            onSelectionChange: (values) => setUserFilter(values[0] || "all")
          }
        ]}
        sortOptions={[
          { value: "completedAt", label: "Completed Date" },
          { value: "title", label: "Checklist Title" },
          { value: "status", label: "Status" },
          { value: "score", label: "Score" }
        ]}
        sortValue={sortBy}
        sortDirection="asc"
        onSortChange={(value) => setSortBy(value as SortOption)}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, mx: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ mb: 2, mx: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: "center" }}>
            Loading checklist history...
          </Typography>
        </Box>
      )}
      
      {loadingProfiles && !loading && (
        <Alert severity="info" sx={{ mb: 2, mx: 2 }}>
          Loading user information...
        </Alert>
      )}

      {filteredAndSortedCompletions.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <AssignmentIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              No checklist completions found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filters.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {filteredAndSortedCompletions.map((completion) => {
            const checklist = checklistsById[completion.checklistId]
            if (!checklist) return null

            return (
              <Accordion key={completion.id} sx={{ mb: 1 }}>
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon />}
                  onClick={(e) => {
                    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.MuiAccordionSummary-content')) {
                      // Click on summary area - open details dialog
                      setSelectedCompletion(completion)
                      setDetailsDialogOpen(true)
                    }
                  }}
                  sx={{ cursor: 'pointer' }}
                >
                  <Box sx={{ display: "flex", flexDirection: "column", width: "100%", gap: 0.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedCompletion(completion)
                            setDetailsDialogOpen(true)
                          }}
                          sx={{ p: 0.5 }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                          {checklist.title}
                        </Typography>
                      </Box>
                      <Chip
                        icon={getStatusIcon(completion.status)}
                        label={completion.status.toUpperCase()}
                        color={getStatusColor(completion.status) as any}
                        size="small"
                        sx={{ height: 24, fontSize: "0.65rem" }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                        {checklist.category && <Chip label={checklist.category} size="small" variant="outlined" />}
                        <Chip
                          icon={<AccessTimeIcon />}
                          label={formatDateTime(completion.completedAt)}
                          size="small"
                          variant="outlined"
                        />
                        {typeof completion.completionScore === "number" && (
                          <Chip
                            label={`Score: ${completion.completionScore}%`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Completed by: {getUserDisplayName(completion.completedBy)}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Checklist Details
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {checklist.description}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Scheduled For:</strong>{" "}
                        {completion.scheduledFor ? formatDateTime(completion.scheduledFor) : "Not set"}
                      </Typography>
                      {completion.overallNotes && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Notes:</strong> {completion.overallNotes}
                        </Typography>
                      )}
                      {completion.signature && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Signature:</strong> {completion.signature}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: "medium" }}>
                        All Responses
                      </Typography>
                      {Object.keys(completion.responses || {}).length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No responses recorded.
                        </Typography>
                      ) : (
                        <Stack spacing={1}>
                          {Object.entries(completion.responses).map(([itemId, response]) =>
                            renderResponseCard(completion.checklistId, itemId, response as ItemResponse),
                          )}
                        </Stack>
                      )}
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            )
          })}
        </Stack>
      )}

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">
              {selectedCompletion && checklistsById[selectedCompletion.checklistId]?.title}
            </Typography>
            <IconButton onClick={() => setDetailsDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedCompletion && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Chip
                    icon={getStatusIcon(selectedCompletion.status)}
                    label={selectedCompletion.status.toUpperCase()}
                    color={getStatusColor(selectedCompletion.status) as any}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Completed By</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {getUserDisplayName(selectedCompletion.completedBy)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Completed At</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {formatDateTime(selectedCompletion.completedAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Score</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {selectedCompletion.completionScore || 0}%
                  </Typography>
                </Grid>
                {selectedCompletion.overallNotes && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Notes</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {selectedCompletion.overallNotes}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Responses</Typography>
              {selectedCompletion.responses && Object.entries(selectedCompletion.responses).map(([itemId, response]) => (
                <Box key={itemId} sx={{ mb: 1 }}>
                  {renderResponseCard(selectedCompletion.checklistId, itemId, response as ItemResponse)}
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
    </RequireCompanyContext>
  )
}

export default ChecklistHistoryPage

