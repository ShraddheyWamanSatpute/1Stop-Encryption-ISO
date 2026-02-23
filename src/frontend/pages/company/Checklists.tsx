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
  IconButton,
  Menu,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
  ListItemIcon,
  Divider,
  Alert,
  LinearProgress,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
} from "@mui/material"
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Drafts as DraftIcon,
  CheckCircle as CheckCircleIcon,
  Archive as ArchiveIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material"
import { useState, useEffect, useCallback } from "react"
import { useCompany } from "../../../backend/context/CompanyContext"
import { useSettings } from "../../../backend/context/SettingsContext"
import { useHR } from "../../../backend/context/HRContext"
import { TimePicker } from "@mui/x-date-pickers"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { format } from "date-fns"
import DataHeader from "../../components/reusable/DataHeader"
import CRUDModal from "../../components/reusable/CRUDModal"
import RequireCompanyContext from "../../components/global/RequireCompanyContext"

// TODO: Move these types to appropriate context files
interface ChecklistItem {
  id: string
  title: string
  description?: string
  text?: string
  completed: boolean
  completedAt?: number
  completedBy?: string
  dueDate?: number
  priority: 'low' | 'medium' | 'high'
  assigneeId?: string
  assigneeName?: string
  type?: string
  validation?: any
  required?: boolean
  order?: number
  createdAt: number
  updatedAt: number
}

interface ChecklistSection {
  id: string
  title: string
  description?: string
  items: ChecklistItem[]
  order: number
  sectionType?: string
  createdAt: number
  updatedAt: number
}

interface ChecklistSchedule {
  id: string
  title: string
  description?: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  dayOfWeek?: number
  dayOfMonth?: number
  time: string
  isActive: boolean
  type?: string
  repeatDays?: any
  openingDay?: any
  closingDay?: any
  openingDate?: any
  closingDate?: any
  openingTime?: any
  closingTime?: any
  timezone?: any
  expireTime?: any
  startDate?: any
  createdAt: number
  updatedAt: number
}

interface CompanyChecklist {
  id: string
  title: string
  description?: string
  sections: ChecklistSection[]
  schedule?: ChecklistSchedule
  isActive: boolean
  companyId: string
  createdBy: string
  category?: string
  status?: 'active' | 'draft' | 'archived'
  isGlobalAccess?: boolean
  siteId?: string
  subsiteId?: string
  assignedTo?: string[]
  assignedToTeams?: any
  tracking?: any
  createdAt: number
  updatedAt: number
}

// Define types for form data
interface ChecklistFormData {
  title: string
  description: string
  sections: ChecklistSection[]
  isGlobalAccess: boolean
  siteId: string
  subsiteId?: string
  assignedSites: string[]
  assignedSubsites: string[]
  assignedTo: string[]
  assignedToTeams: string[]
  schedule: ChecklistSchedule
  status: "active" | "draft" | "archived"
  category: string
  tracking: {
    requireSignature: boolean
    requirePhotos: boolean
    requireNotes: boolean
    requireLocation: boolean
  }
}

interface FilterState {
  search: string
  category: string
  status: string
  sortBy: string
  sortOrder: "asc" | "desc"
}

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"

const ChecklistsPage: React.FC = () => {
  const {
    state: companyState,
    fetchChecklists,
    createChecklistItem: createChecklist,
    updateChecklistItem: updateChecklist,
    deleteChecklistItem: deleteChecklist,
    getChecklistCompletions,
  } = useCompany()
  const { state: settingsState } = useSettings()
  const { state: hrState } = useHR()

  const userId = settingsState.auth?.uid || ""

  // State management
  const [checklists, setChecklists] = useState<CompanyChecklist[]>([])
  const [filteredChecklists, setFilteredChecklists] = useState<CompanyChecklist[]>([])
  const [completions, setCompletions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingChecklist, setEditingChecklist] = useState<CompanyChecklist | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedChecklistId, setSelectedChecklistId] = useState<string>("")

  // Filter and search state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "",
    status: "",
    sortBy: "title",
    sortOrder: "asc",
  })
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  // Form data
  const [formData, setFormData] = useState<ChecklistFormData>({
    title: "",
    description: "",
    sections: [],
    isGlobalAccess: false,
    siteId: "",
    subsiteId: undefined,
    assignedSites: [],
    assignedSubsites: [],
    assignedTo: [],
    assignedToTeams: [],
    schedule: {
      id: `schedule_${Date.now()}`,
      title: "Default Schedule",
      description: "Default schedule for checklist",
      frequency: "daily" as const,
      time: "09:00",
      isActive: true,
      type: "once",
      repeatDays: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      },
      openingDay: "monday",
      closingDay: "friday",
      openingDate: 1,
      closingDate: undefined,
      openingTime: "09:00",
      closingTime: "17:00",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      startDate: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    status: "draft",
    category: "",
    tracking: {
      requireSignature: false,
      requirePhotos: false,
      requireNotes: false,
      requireLocation: false,
    },
  })

  // Mock data for dropdowns
  const categories = ["Safety", "Maintenance", "Quality", "Operations", "Compliance", "Training"]

  // Load data when company, site, or subsite changes
  useEffect(() => {
    loadData()
  }, [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID])

  // Filter and sort checklists when filters change
  useEffect(() => {
    filterAndSortChecklists()
  }, [checklists, filters])

  const loadData = async () => {
    if (!companyState.companyID) return

    try {
      setLoading(true)
      const [checklistsData, completionsData] = await Promise.all([fetchChecklists(), getChecklistCompletions()])

      setChecklists(checklistsData || [])
      setCompletions(completionsData || [])
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Failed to load checklists")
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortChecklists = useCallback(() => {
    let filtered = [...checklists]

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (checklist) =>
          checklist.title.toLowerCase().includes(searchLower) ||
          checklist.description?.toLowerCase().includes(searchLower) ||
          checklist.category?.toLowerCase().includes(searchLower),
      )
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter((checklist) => checklist.category === filters.category)
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter((checklist) => checklist.status === filters.status)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (filters.sortBy) {
        case "title":
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case "created":
          aValue = a.createdAt || 0
          bValue = b.createdAt || 0
          break
        case "updated":
          aValue = a.updatedAt || 0
          bValue = b.updatedAt || 0
          break
        case "category":
          aValue = a.category?.toLowerCase() || ""
          bValue = b.category?.toLowerCase() || ""
          break
        case "section":
          aValue = a.sections?.length || 0
          bValue = b.sections?.length || 0
          break
        default:
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
      }

      if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1
      return 0
    })

    setFilteredChecklists(filtered)
  }, [checklists, filters])

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      sections: [],
      isGlobalAccess: false,
      siteId: "",
      subsiteId: undefined,
      assignedSites: [],
      assignedSubsites: [],
      schedule: {
        id: `schedule_${Date.now()}`,
        title: "Default Schedule",
        description: "Default schedule for checklist",
        frequency: "daily" as const,
        time: "09:00",
        isActive: true,
        type: "once",
        repeatDays: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false,
        },
        openingDay: "monday",
        closingDay: "friday",
        openingDate: 1,
        closingDate: undefined,
        openingTime: "09:00",
        closingTime: "17:00",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        startDate: undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      status: "draft",
      assignedTo: [],
      assignedToTeams: [],
      category: "",
      tracking: {
        requireSignature: false,
        requirePhotos: false,
        requireNotes: false,
        requireLocation: false,
      },
    })
    setEditingChecklist(null)
  }

  const handleOpenDialog = (checklist?: CompanyChecklist) => {
    if (checklist) {
      setEditingChecklist(checklist)
      loadChecklist(checklist)
    } else {
      resetForm()
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    resetForm()
  }

  const loadChecklist = (checklist: CompanyChecklist) => {
    let sections = checklist.sections || []
    if (!checklist.sections && (checklist as any).items) {
      sections = [
        {
          id: "default-section",
          title: "Default Section",
          description: "",
          items: (checklist as any).items || [],
          order: 0,
          sectionType: "standard",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]
    }

    setFormData({
      title: checklist.title || "",
      description: checklist.description || "",
      sections: sections,
      isGlobalAccess: checklist.isGlobalAccess || false,
      siteId: checklist.siteId || companyState.selectedSiteID || "",
      subsiteId: checklist.subsiteId || companyState.selectedSubsiteID || undefined,
      assignedSites: (checklist as any).assignedSites || [],
      assignedSubsites: (checklist as any).assignedSubsites || [],
      assignedTo: checklist.assignedTo || [],
      assignedToTeams: checklist.assignedToTeams || [],
      schedule: {
        id: checklist.schedule?.id || `schedule_${Date.now()}`,
        title: checklist.schedule?.title || "Default Schedule",
        description: checklist.schedule?.description || "Default schedule for checklist",
        frequency: checklist.schedule?.frequency || "daily" as const,
        time: checklist.schedule?.time || "09:00",
        isActive: checklist.schedule?.isActive ?? true,
        type: checklist.schedule?.type || "once",
        repeatDays: checklist.schedule?.repeatDays || {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false,
        },
        openingDay: checklist.schedule?.openingDay || "monday",
        closingDay: checklist.schedule?.closingDay || "friday",
        openingDate: checklist.schedule?.openingDate || 1,
        closingDate: checklist.schedule?.closingDate,
        openingTime: checklist.schedule?.openingTime || "09:00",
        closingTime: checklist.schedule?.closingTime || "17:00",
        timezone: checklist.schedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        expireTime: checklist.schedule?.expireTime || 24,
        startDate: checklist.schedule?.startDate,
        createdAt: checklist.schedule?.createdAt || Date.now(),
        updatedAt: checklist.schedule?.updatedAt || Date.now(),
      },
      status: checklist.status || "draft",
      category: checklist.category || "",
      tracking: checklist.tracking || {
        requireSignature: false,
        requirePhotos: false,
        requireNotes: false,
        requireLocation: false,
      },
    })
  }

  const handleSaveChecklist = async () => {
    if (!companyState.companyID) return

    try {
      setLoading(true)

      const items = formData.sections.flatMap((section) => section.items || [])

      // Use current site/subsite from companyState for creation/update
      // The CompanyContext will handle the path based on current selection
      const checklistData = {
        title: formData.title,
        description: formData.description,
        items: items,
        sections: formData.sections,
        siteId: companyState.selectedSiteID || formData.siteId || "",
        subsiteId: companyState.selectedSubsiteID || formData.subsiteId || undefined,
        assignedTo: formData.isGlobalAccess ? [] : [...formData.assignedTo],
        assignedToTeams: formData.isGlobalAccess ? [] : [...formData.assignedToTeams],
        assignedSites: formData.isGlobalAccess ? [] : [...formData.assignedSites],
        assignedSubsites: formData.isGlobalAccess ? [] : [...formData.assignedSubsites],
        category: formData.category || "",
        isGlobalAccess: formData.isGlobalAccess,
        schedule: formData.schedule,
        tracking: formData.tracking,
        status: formData.status,
        updatedAt: Date.now(),
      }

      if (editingChecklist) {
        await updateChecklist(editingChecklist.id, checklistData)
      } else {
        const newChecklistData = {
          ...checklistData,
          createdBy: userId,
        }
        await createChecklist(newChecklistData)
      }

      await loadData()
      handleCloseDialog()
    } catch (error) {
      console.error("Error saving checklist:", error)
      setError("Failed to save checklist")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChecklist = async (checklistId: string) => {
    if (!companyState.companyID) return

    try {
      await deleteChecklist(checklistId)
      await loadData()
    } catch (err) {
      console.error("Error deleting checklist:", err)
      setError("Failed to delete checklist")
    }
  }

  const handleStatusChange = async (checklistId: string, newStatus: "active" | "draft" | "archived") => {
    if (!companyState.companyID || !companyState.selectedSiteID) return

    try {
      setLoading(true)
      await updateChecklist(checklistId, {
        status: newStatus,
        updatedAt: Date.now(),
      })
      await loadData()
    } catch (error) {
      console.error("Error updating checklist status:", error)
      setError("Failed to update checklist status")
    } finally {
      setLoading(false)
    }
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, checklistId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedChecklistId(checklistId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedChecklistId("")
  }


  const getCompletionStats = (checklistId: string) => {
    const checklistCompletions = completions.filter((c) => c.checklistId === checklistId)
    const totalCompletions = checklistCompletions.length
    const completedToday = checklistCompletions.filter((c) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return c.completedAt >= today.getTime() && c.status === "complete"
    }).length

    return { totalCompletions, completedToday }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success"
      case "draft":
        return "warning"
      case "archived":
        return "default"
      default:
        return "default"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircleIcon />
      case "draft":
        return <DraftIcon />
      case "archived":
        return <ArchiveIcon />
      default:
        return <AssignmentIcon />
    }
  }

  const renderChecklistCard = (checklist: CompanyChecklist) => {
    const stats = getCompletionStats(checklist.id)

    const assignedRoles = hrState.roles?.filter((role) => checklist.assignedTo?.includes(role.id)) || []
    const assignedDepartments =
      hrState.departments?.filter((dept) => checklist.assignedToTeams?.includes(dept.id)) || []

    return (
      <Card key={checklist.id} variant="outlined" sx={{ mb: 1.5 }}>
        <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 0.5, fontSize: "1.1rem" }}>
                {checklist.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: "0.85rem" }}>
                {checklist.description}
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1.5 }}>
                <Chip
                  icon={getStatusIcon(checklist.status || "draft")}
                  label={(checklist.status || "draft").toUpperCase()}
                  color={getStatusColor(checklist.status || "draft") as any}
                  size="small"
                />
                {checklist.category && <Chip label={checklist.category} size="small" variant="outlined" />}
                <Chip
                  label={`${checklist.sections && Array.isArray(checklist.sections) ? checklist.sections.length : 0} sections`}
                  size="small"
                  variant="outlined"
                />
                {checklist.isGlobalAccess && (
                  <Chip label="Global Access" size="small" color="info" variant="outlined" />
                )}
                {checklist.schedule?.type && (
                  <Chip
                    icon={<ScheduleIcon />}
                    label={checklist.schedule.type.toUpperCase()}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
            <IconButton onClick={(e) => handleMenuClick(e, checklist.id)}>
              <MoreVertIcon />
            </IconButton>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="primary">
                  {stats.totalCompletions}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Completions
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="success.main">
                  {stats.completedToday}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Completed Today
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="info.main">
                  {(assignedRoles.length || 0) + (assignedDepartments.length || 0) + (checklist.assignedTo?.length || 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Assignments
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {!checklist.isGlobalAccess && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Assigned to:
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {assignedRoles.map((role) => (
                  <Chip key={role.id} icon={<PersonIcon />} label={`Role: ${role.label || role.name}`} size="small" variant="outlined" color="primary" />
                ))}
                {assignedDepartments.map((dept) => (
                  <Chip key={dept.id} icon={<BusinessIcon />} label={`Dept: ${dept.name}`} size="small" variant="outlined" color="secondary" />
                ))}
                {checklist.assignedTo?.filter((id: any) => !assignedRoles.some(r => r.id===id)).map((assigneeId: any) => (
                  <Chip key={assigneeId} icon={<GroupIcon />} label={`User: ${assigneeId}`} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}

          {checklist.isGlobalAccess && (
            <Box sx={{ mt: 2 }}>
              <Chip icon={<GroupIcon />} label="Available to all users" size="small" color="info" variant="filled" />
            </Box>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderScheduleSection = () => {
    const weekDays: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

    return (
      <>
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            Schedule
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Schedule Type</InputLabel>
            <Select
              value={formData.schedule.type}
              onChange={(e) => {
                const type = e.target.value as "once" | "daily" | "weekly" | "monthly" | "continuous" | "4week"
                setFormData((prev) => ({
                  ...prev,
                  schedule: {
                    ...prev.schedule,
                    type,
                    startDate: type === "4week" ? Date.now() : undefined,
                  },
                }))
              }}
              label="Schedule Type"
            >
              <MenuItem value="once">One-time</MenuItem>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="continuous">Continuous</MenuItem>
              <MenuItem value="4week">4-Week Cycle</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {(formData.schedule.type === "daily" ||
          formData.schedule.type === "weekly" ||
          formData.schedule.type === "monthly" ||
          formData.schedule.type === "continuous") && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Repeat on Days
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {weekDays.map((day) => (
                <FormControlLabel
                  key={day}
                  control={
                    <Checkbox
                      checked={
                        formData.schedule.repeatDays?.[day as keyof typeof formData.schedule.repeatDays] || false
                      }
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          schedule: {
                            ...prev.schedule,
                            repeatDays: {
                              ...prev.schedule.repeatDays,
                              [day]: e.target.checked,
                            } as {
                              monday: boolean
                              tuesday: boolean
                              wednesday: boolean
                              thursday: boolean
                              friday: boolean
                              saturday: boolean
                              sunday: boolean
                            },
                          },
                        }))
                      }}
                    />
                  }
                  label={day.charAt(0).toUpperCase() + day.slice(1)}
                />
              ))}
            </Box>
          </Grid>
        )}

        {formData.schedule.type === "4week" && (
          <>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                4-Week Schedule Configuration
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                This checklist will be available every 4 weeks starting from the selected date.
              </Alert>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={formData.schedule.startDate ? new Date(formData.schedule.startDate) : new Date()}
                  onChange={(newValue) => {
                    if (newValue) {
                      setFormData((prev) => ({
                        ...prev,
                        schedule: {
                          ...prev.schedule,
                          startDate: newValue.getTime(),
                        },
                      }))
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </>
        )}

        {formData.schedule.type !== "once" && (
          <>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                  label="Opening Time"
                  value={
                    formData.schedule.openingTime
                      ? new Date(`2000-01-01T${formData.schedule.openingTime}:00`)
                      : new Date(`2000-01-01T09:00:00`)
                  }
                  onChange={(newValue) => {
                    if (newValue) {
                      setFormData((prev) => ({
                        ...prev,
                        schedule: {
                          ...prev.schedule,
                          openingTime: format(newValue, "HH:mm"),
                        },
                      }))
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                  label="Closing Time"
                  value={
                    formData.schedule.closingTime
                      ? new Date(`2000-01-01T${formData.schedule.closingTime}:00`)
                      : new Date(`2000-01-01T17:00:00`)
                  }
                  onChange={(newValue) => {
                    if (newValue) {
                      setFormData((prev) => ({
                        ...prev,
                        schedule: {
                          ...prev.schedule,
                          closingTime: format(newValue, "HH:mm"),
                        },
                      }))
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </>
        )}

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Expiration Time (hours)"
            type="number"
            value={formData.schedule.expireTime || 24}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                schedule: {
                  ...prev.schedule,
                  expireTime: Number.parseInt(e.target.value) || 24,
                },
              }))
            }
            helperText="Hours after due date when checklist expires"
            inputProps={{ min: 1 }}
          />
        </Grid>
      </>
    )
  }

  const renderSectionsAndItems = () => (
    <>
      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" sx={{ mb: 2 }}>
          Checklist Sections
        </Typography>
      </Grid>
      {formData.sections.map((section, sectionIndex) => (
        <Grid item xs={12} key={section.id}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography variant="h6">Section {sectionIndex + 1}</Typography>
                  {(section.sectionType || "normal") === "logs" && (
                    <Chip label="Logs Section" size="small" color="secondary" sx={{ ml: 1 }} />
                  )}
                </Box>
                <IconButton
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      sections: prev.sections.filter((_: any, index: number) => index !== sectionIndex),
                    }))
                  }}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Section Title"
                    value={section.title}
                    onChange={(e) => {
                      const newSections = [...formData.sections]
                      newSections[sectionIndex] = {
                        ...newSections[sectionIndex],
                        title: e.target.value,
                      }
                      setFormData((prev) => ({ ...prev, sections: newSections }))
                    }}
                  />
                </Grid>
                {(section.sectionType || "normal") !== "logs" && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Section Description"
                      value={section.description}
                      onChange={(e) => {
                        const newSections = [...formData.sections]
                        newSections[sectionIndex] = {
                          ...newSections[sectionIndex],
                          description: e.target.value,
                        }
                        setFormData((prev) => ({ ...prev, sections: newSections }))
                      }}
                    />
                  </Grid>
                )}
              </Grid>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Items
              </Typography>
              {section.items?.map((item: ChecklistItem, itemIndex: number) => (
                <Card key={item.id} variant="outlined" sx={{ mb: 2, p: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="subtitle2">Item {itemIndex + 1}</Typography>
                    <IconButton
                      onClick={() => {
                        const newSections = [...formData.sections]
                        newSections[sectionIndex] = {
                          ...newSections[sectionIndex],
                          items: newSections[sectionIndex].items?.filter((_, index) => index !== itemIndex) || [],
                        }
                        setFormData((prev) => ({ ...prev, sections: newSections }))
                      }}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Item Title"
                        value={item.title || item.text}
                        onChange={(e) => {
                          const newSections = [...formData.sections]
                          if (newSections[sectionIndex].items) {
                            newSections[sectionIndex].items![itemIndex] = {
                              ...newSections[sectionIndex].items![itemIndex],
                              title: e.target.value,
                              text: e.target.value,
                            }
                            setFormData((prev) => ({ ...prev, sections: newSections }))
                          }
                        }}
                      />
                    </Grid>
                    {(section.sectionType || "normal") !== "logs" && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Item Description"
                          value={item.description}
                          onChange={(e) => {
                            const newSections = [...formData.sections]
                            if (newSections[sectionIndex].items) {
                              newSections[sectionIndex].items![itemIndex] = {
                                ...newSections[sectionIndex].items![itemIndex],
                                description: e.target.value,
                              }
                              setFormData((prev) => ({ ...prev, sections: newSections }))
                            }
                          }}
                        />
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Response Type</InputLabel>
                        <Select
                          value={item.type || "text"}
                          onChange={(e) => {
                            const newSections = [...formData.sections]
                            if (newSections[sectionIndex].items) {
                              const type = e.target.value as "text" | "number" | "checkbox" | "file" | "signature"
                              newSections[sectionIndex].items![itemIndex] = {
                                ...newSections[sectionIndex].items![itemIndex],
                                type,
                                validation: type === "number" ? { min: 0, max: 100 } : undefined,
                              }
                              setFormData((prev) => ({ ...prev, sections: newSections }))
                            }
                          }}
                          label="Response Type"
                        >
                          <MenuItem value="text">Text</MenuItem>
                          <MenuItem value="number">Number</MenuItem>
                          <MenuItem value="checkbox">Yes/No</MenuItem>
                          <MenuItem value="file">Photo</MenuItem>
                          <MenuItem value="signature">Signature</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Number validation options */}
                    {item.type === "number" && (
                      <>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Min Value"
                            type="number"
                            value={item.validation?.min || ""}
                            onChange={(e) => {
                              const newSections = [...formData.sections]
                              if (newSections[sectionIndex].items) {
                                newSections[sectionIndex].items![itemIndex] = {
                                  ...newSections[sectionIndex].items![itemIndex],
                                  validation: {
                                    ...newSections[sectionIndex].items![itemIndex].validation,
                                    min: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                                  },
                                }
                                setFormData((prev) => ({ ...prev, sections: newSections }))
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Max Value"
                            type="number"
                            value={item.validation?.max || ""}
                            onChange={(e) => {
                              const newSections = [...formData.sections]
                              if (newSections[sectionIndex].items) {
                                newSections[sectionIndex].items![itemIndex] = {
                                  ...newSections[sectionIndex].items![itemIndex],
                                  validation: {
                                    ...newSections[sectionIndex].items![itemIndex].validation,
                                    max: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                                  },
                                }
                                setFormData((prev) => ({ ...prev, sections: newSections }))
                              }
                            }}
                          />
                        </Grid>
                      </>
                    )}

                    <Grid item xs={12}>
                      <FormControlLabel
                        key={`required-${item.id}`}
                        control={
                          <Checkbox
                            checked={item.required || false}
                            onChange={(e) => {
                              const newSections = [...formData.sections]
                              if (newSections[sectionIndex].items) {
                                newSections[sectionIndex].items![itemIndex] = {
                                  ...newSections[sectionIndex].items![itemIndex],
                                  required: e.target.checked,
                                }
                                setFormData((prev) => ({ ...prev, sections: newSections }))
                              }
                            }}
                          />
                        }
                        label="Required"
                      />
                    </Grid>
                  </Grid>
                </Card>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => {
                  const newItem: ChecklistItem = {
                    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    text: "",
                    title: "",
                    description: "",
                    type: "text",
                    required: false,
                    order: (section.items?.length || 0) + 1,
                    completed: false,
                    priority: "medium",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  }
                  const newSections = [...formData.sections]
                  if (!newSections[sectionIndex].items) {
                    newSections[sectionIndex].items = []
                  }
                  newSections[sectionIndex].items!.push(newItem)
                  setFormData((prev) => ({ ...prev, sections: newSections }))
                }}
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
              >
                Add Item
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
      <Grid item xs={12}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            startIcon={<AddIcon />}
            onClick={() => {
              const newSection: ChecklistSection = {
                id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: "",
                description: "",
                items: [],
                order: formData.sections.length + 1,
                sectionType: "normal",
                createdAt: Date.now(),
                updatedAt: Date.now(),
              }
              setFormData((prev) => ({
                ...prev,
                sections: [...prev.sections, newSection],
              }))
            }}
            variant="contained"
            color="primary"
          >
            Add Section
          </Button>
          <Button
            startIcon={<AddIcon />}
            onClick={() => {
              const newSection: ChecklistSection = {
                id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: "",
                description: "",
                items: [],
                order: formData.sections.length + 1,
                sectionType: "logs",
                createdAt: Date.now(),
                updatedAt: Date.now(),
              }
              setFormData((prev) => ({
                ...prev,
                sections: [...prev.sections, newSection],
              }))
            }}
            variant="contained"
            color="secondary"
          >
            Add Logs Section
          </Button>
        </Box>
      </Grid>
    </>
  )

  const renderSiteAssignmentSection = () => (
    <>
      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" sx={{ mb: 2 }}>
          Site & Subsite Assignments
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Assign by Sites</Typography>
            {formData.assignedSites.length > 0 && (
              <Chip label={`${formData.assignedSites.length} selected`} size="small" color="primary" sx={{ ml: 2 }} />
            )}
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {companyState.sites && companyState.sites.length > 0 ? (
                companyState.sites.map((site: any) => (
                  <FormControlLabel
                    key={site.siteID}
                    control={
                      <Checkbox
                        checked={formData.assignedSites.includes(site.siteID)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev) => ({
                              ...prev,
                              assignedSites: [...prev.assignedSites, site.siteID],
                            }))
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              assignedSites: prev.assignedSites.filter((s) => s !== site.siteID),
                            }))
                          }
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {site.name}
                        </Typography>
                        {site.address && (
                          <Typography variant="caption" color="text.secondary">
                            {typeof site.address === "string"
                              ? site.address
                              : `${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zipCode}`}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No sites available.
                </Typography>
              )}
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      </Grid>

      <Grid item xs={12}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Assign by Subsites</Typography>
            {formData.assignedSubsites.length > 0 && (
              <Chip label={`${formData.assignedSubsites.length} selected`} size="small" color="primary" sx={{ ml: 2 }} />
            )}
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {companyState.sites && companyState.sites.length > 0 ? (
                companyState.sites.map((site: any) => (
                  <Box key={site.siteID}>
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: "bold" }}>
                      {site.name}
                    </Typography>
                    {site.subsites && Object.values(site.subsites).length > 0 ? (
                      Object.values(site.subsites).map((subsite: any) => (
                        <FormControlLabel
                          key={subsite.subsiteID}
                          control={
                            <Checkbox
                              checked={formData.assignedSubsites.includes(subsite.subsiteID)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    assignedSubsites: [...prev.assignedSubsites, subsite.subsiteID],
                                  }))
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    assignedSubsites: prev.assignedSubsites.filter((s) => s !== subsite.subsiteID),
                                  }))
                                }
                              }}
                            />
                          }
                          label={
                            <Box sx={{ ml: 2 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {subsite.name}
                              </Typography>
                              {subsite.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {subsite.description}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      ))
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                        No subsites available for this site
                      </Typography>
                    )}
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No sites available.
                </Typography>
              )}
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      </Grid>
    </>
  )

  const renderAssignmentsSection = () => (
    <>
      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" sx={{ mb: 2 }}>
          Role & Department Assignments
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Assign by Roles</Typography>
            {formData.assignedTo.length > 0 && (
              <Chip label={`${formData.assignedTo.length} selected`} size="small" color="primary" sx={{ ml: 2 }} />
            )}
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {hrState.roles && hrState.roles.length > 0 ? (
                hrState.roles.map((role) => (
                  <FormControlLabel
                    key={role.id}
                    control={
                      <Checkbox
                        checked={formData.assignedTo.includes(role.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev) => ({ ...prev, assignedTo: [...prev.assignedTo, role.id] }))
                          } else {
                            setFormData((prev) => ({ ...prev, assignedTo: prev.assignedTo.filter((r) => r !== role.id) }))
                          }
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {role.label || role.name}
                        </Typography>
                        {role.description && (
                          <Typography variant="caption" color="text.secondary">
                            {role.description}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No roles available. Create roles in HR management first.
                </Typography>
              )}
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      </Grid>

      <Grid item xs={12}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Assign by Departments</Typography>
            {formData.assignedToTeams.length > 0 && (
              <Chip label={`${formData.assignedToTeams.length} selected`} size="small" color="primary" sx={{ ml: 2 }} />
            )}
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {hrState.departments && hrState.departments.length > 0 ? (
                hrState.departments.map((dept) => (
                  <FormControlLabel
                    key={dept.id}
                    control={
                      <Checkbox
                        checked={formData.assignedToTeams.includes(dept.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev) => ({
                              ...prev,
                              assignedToTeams: [...prev.assignedToTeams, dept.id],
                            }))
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              assignedToTeams: prev.assignedToTeams.filter((d) => d !== dept.id),
                            }))
                          }
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {dept.name}
                        </Typography>
                        {dept.description && (
                          <Typography variant="caption" color="text.secondary">
                            {dept.description}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No departments available. Create departments in HR management first.
                </Typography>
              )}
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      </Grid>
    </>
  )

  const hasActiveFilters = filters.search || filters.category || filters.status

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <RequireCompanyContext requireSite>
      <Box sx={{ p: 0 }}>
        <DataHeader
          onRefresh={loadData}
          searchTerm={filters.search}
          onSearchChange={(search) => setFilters((prev) => ({ ...prev, search }))}
          searchPlaceholder="Search checklists..."
          showDateControls={false}
          filters={[
            {
              label: "Category",
              options: categories.map(cat => ({ id: cat, name: cat })),
              selectedValues: filters.category ? [filters.category] : [],
              onSelectionChange: (values) => setFilters((prev) => ({ ...prev, category: values[0] || "" }))
            },
            {
              label: "Status",
              options: [
                { id: "active", name: "Active" },
                { id: "draft", name: "Draft" },
                { id: "archived", name: "Archived" }
              ],
              selectedValues: filters.status ? [filters.status] : [],
              onSelectionChange: (values) => setFilters((prev) => ({ ...prev, status: values[0] || "" }))
            }
          ]}
          filtersExpanded={filtersExpanded}
          onFiltersToggle={() => setFiltersExpanded(!filtersExpanded)}
          sortOptions={[
            { value: "title", label: "Title" },
            { value: "created", label: "Created Date" },
            { value: "updated", label: "Updated Date" },
            { value: "category", label: "Category" },
            { value: "section", label: "Sections" }
          ]}
          sortValue={filters.sortBy}
          sortDirection={filters.sortOrder}
          onSortChange={(value, direction) => setFilters((prev) => ({ ...prev, sortBy: value, sortOrder: direction }))}
          onExportCSV={() => {
            setError("CSV export feature coming soon!")
          }}
          onCreateNew={() => handleOpenDialog()}
          createButtonLabel="Create Checklist"
        />


        {/* Loading */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Checklists List */}
        <Box>
          {filteredChecklists.length === 0 ? (
            <Alert severity="info">
              {hasActiveFilters
                ? "No checklists match your current filters."
                : "No checklists found. Create your first checklist to get started."}
            </Alert>
          ) : (
            filteredChecklists.map(renderChecklistCard)
          )}
        </Box>

        {/* Context Menu */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem
            onClick={() => {
              const checklist = checklists.find((c) => c.id === selectedChecklistId)
              if (checklist) {
                handleOpenDialog(checklist)
              }
              handleMenuClose()
            }}
          >
            <ListItemIcon>
              <EditIcon />
            </ListItemIcon>
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (selectedChecklistId) {
                handleStatusChange(selectedChecklistId, "active")
              }
              handleMenuClose()
            }}
          >
            <ListItemIcon>
              <CheckCircleIcon />
            </ListItemIcon>
            Mark Active
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (selectedChecklistId) {
                handleStatusChange(selectedChecklistId, "archived")
              }
              handleMenuClose()
            }}
          >
            <ListItemIcon>
              <ArchiveIcon />
            </ListItemIcon>
            Archive
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              if (selectedChecklistId && window.confirm("Are you sure you want to delete this checklist?")) {
                handleDeleteChecklist(selectedChecklistId)
              }
              handleMenuClose()
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon>
              <DeleteIcon color="error" />
            </ListItemIcon>
            Delete
          </MenuItem>
        </Menu>

        {/* Create/Edit Modal */}
        <CRUDModal
          open={dialogOpen}
          onClose={handleCloseDialog}
          title={editingChecklist ? "Edit Checklist" : "Create New Checklist"}
          icon={<AssignmentIcon />}
          mode={editingChecklist ? "edit" : "create"}
          onSave={handleSaveChecklist}
          saveButtonText={editingChecklist ? "Update" : "Create"}
          maxWidth="lg"
          loading={loading}
          cancelButtonText={undefined}
        >
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              {/* Basic Information */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    label="Category"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Description"
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value as "active" | "draft" | "archived",
                      }))
                    }
                    label="Status"
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="archived">Archived</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={formData.isGlobalAccess}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isGlobalAccess: e.target.checked }))}
                    />
                  }
                  label="Global Access (Available to all users)"
                  sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.875rem" } }}
                />
              </Grid>

              {/* Tracking Options */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ mb: 1, fontSize: "0.875rem" }}>
                  Tracking Options
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.tracking.requireSignature}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tracking: { ...prev.tracking, requireSignature: e.target.checked },
                        }))
                      }
                    />
                  }
                  label="Require Signature"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.tracking.requirePhotos}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tracking: { ...prev.tracking, requirePhotos: e.target.checked },
                        }))
                      }
                    />
                  }
                  label="Require Photos"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.tracking.requireNotes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tracking: { ...prev.tracking, requireNotes: e.target.checked },
                        }))
                      }
                    />
                  }
                  label="Require Notes"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.tracking.requireLocation}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tracking: { ...prev.tracking, requireLocation: e.target.checked },
                        }))
                      }
                    />
                  }
                  label="Require Location"
                />
              </Grid>

              {/* Schedule Section */}
              {renderScheduleSection()}

              {/* Site & Subsite Assignments */}
              {!formData.isGlobalAccess && renderSiteAssignmentSection()}

              {/* Role & Department Assignments */}
              {!formData.isGlobalAccess && renderAssignmentsSection()}

              {/* Sections and Items */}
              {renderSectionsAndItems()}
            </Grid>
        </CRUDModal>
      </Box>
      </RequireCompanyContext>
    </LocalizationProvider>
  )
}

export default ChecklistsPage
