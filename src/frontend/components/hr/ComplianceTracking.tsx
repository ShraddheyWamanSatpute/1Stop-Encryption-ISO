"use client"

import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Snackbar,
  CircularProgress,
} from "@mui/material"
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Close as CloseIcon,
} from "@mui/icons-material"
import { useHR } from "../../../backend/context/HRContext"
import CRUDModal from "../reusable/CRUDModal"
import ComplianceCRUDForm from "./forms/ComplianceCRUDForm"
import DataHeader from "../reusable/DataHeader"
import { useSettings } from "../../../backend/context/SettingsContext"
import { themeConfig } from "../../../theme/AppTheme"
import type { ComplianceTask } from "../../../backend/interfaces/HRs"


const ComplianceTracking: React.FC = () => {
  const { 
    state: hrState, 
    refreshComplianceTasks,
    addComplianceTask,
    updateComplianceTask,
    deleteComplianceTask
  } = useHR()
  
  const { state: settingsState } = useSettings()

  const [tabValue, setTabValue] = useState(0)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogType] = useState<"task" | "document" | "audit" | "renewal">("task")
  const [selectedTask, setSelectedTask] = useState<ComplianceTask | null>(null)

  // State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)

  // CRUD Modal state
  const [complianceCRUDModalOpen, setComplianceCRUDModalOpen] = useState(false)
  const [selectedComplianceForCRUD, setSelectedComplianceForCRUD] = useState<ComplianceTask | null>(null)
  const [crudMode, setCrudMode] = useState<'create' | 'edit' | 'view'>('create')

  // DataHeader state
  const [searchTerm, setSearchTerm] = useState("")
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>("dueDate")
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>("asc")

  // DataHeader configuration
  const filters = [
    {
      label: "Status",
      options: [
        { id: "pending", name: "Pending", color: "#ff9800" },
        { id: "completed", name: "Completed", color: "#4caf50" },
        { id: "overdue", name: "Overdue", color: "#f44336" },
      ],
      selectedValues: statusFilter,
      onSelectionChange: setStatusFilter,
    },
    {
      label: "Priority",
      options: [
        { id: "low", name: "Low", color: "#4caf50" },
        { id: "medium", name: "Medium", color: "#ff9800" },
        { id: "high", name: "High", color: "#f44336" },
        { id: "critical", name: "Critical", color: "#d32f2f" },
      ],
      selectedValues: priorityFilter,
      onSelectionChange: setPriorityFilter,
    },
  ]

  const sortOptions = [
    { value: "dueDate", label: "Due Date" },
    { value: "title", label: "Title" },
    { value: "priority", label: "Priority" },
    { value: "status", label: "Status" },
  ]

  // DataHeader handlers
  const handleSortChange = (value: string, direction: "asc" | "desc") => {
    setSortBy(value)
    setSortDirection(direction)
  }

  const handleCreateNew = () => {
    setSelectedComplianceForCRUD(null)
    setCrudMode('create')
    setComplianceCRUDModalOpen(true)
  }

  const handleRefresh = () => {
    // Refresh compliance data
    console.log("Refreshing compliance data")
  }

  // Filter and sort compliance tasks
  const filteredTasks = React.useMemo(() => {
    const filtered = hrState.complianceTasks.filter((task) => {
      const matchesSearch = 
        searchTerm === "" ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.assignedTo && task.assignedTo.some(assignee => assignee.toLowerCase().includes(searchTerm.toLowerCase())))

      const matchesStatus = 
        statusFilter.length === 0 || 
        statusFilter.includes(task.status?.toLowerCase() || "")

      const matchesPriority = 
        priorityFilter.length === 0 || 
        priorityFilter.includes(task.priority?.toLowerCase() || "")

      return matchesSearch && matchesStatus && matchesPriority
    })

    // Sort the filtered tasks
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case "title":
          aValue = a.title?.toLowerCase() || ""
          bValue = b.title?.toLowerCase() || ""
          break
        case "priority":
          aValue = a.priority?.toLowerCase() || ""
          bValue = b.priority?.toLowerCase() || ""
          break
        case "status":
          aValue = a.status?.toLowerCase() || ""
          bValue = b.status?.toLowerCase() || ""
          break
        case "dueDate":
        default:
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0
          break
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return sortDirection === "asc" 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number)
      }
    })

    return filtered
  }, [hrState.complianceTasks, searchTerm, statusFilter, priorityFilter, sortBy, sortDirection])

  const handleExportCSV = () => {
    const headers = [
      "Title",
      "Description",
      "Due Date",
      "Priority",
      "Status",
      "Assigned To",
      "Category",
      "Created Date",
      "Completed Date",
    ]
    const csvContent = [
      headers.join(","),
      ...filteredTasks.map((task) =>
        [
          `"${task.title}"`,
          `"${task.description.replace(/"/g, '""')}"`,
          task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
          task.priority || "",
          task.status || "",
          `"${task.assignedTo || ""}"`,
          task.category || "",
          task.createdAt ? new Date(task.createdAt).toISOString().split('T')[0] : "",
          task.completedAt ? new Date(task.completedAt).toISOString().split('T')[0] : "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `compliance_tasks_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // CRUD handlers
  const handleOpenComplianceCRUD = (compliance: ComplianceTask | null = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedComplianceForCRUD(compliance)
    setCrudMode(mode)
    setComplianceCRUDModalOpen(true)
  }

  const handleCloseComplianceCRUD = () => {
    setComplianceCRUDModalOpen(false)
    setSelectedComplianceForCRUD(null)
  }

  const handleSaveComplianceCRUD = async (complianceData: any) => {
    try {
      if (crudMode === 'create') {
        await addComplianceTask(complianceData)
        setNotification({ message: "Compliance task created successfully", type: "success" })
      } else if (crudMode === 'edit' && selectedComplianceForCRUD) {
        await updateComplianceTask(selectedComplianceForCRUD.id, complianceData)
        setNotification({ message: "Compliance task updated successfully", type: "success" })
      }
      handleCloseComplianceCRUD()
    } catch (error) {
      console.error('Error saving compliance task:', error)
      setNotification({ message: "Error saving compliance task", type: "error" })
    }
  }

  // Form state
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    type: "training" as "training" | "certification" | "document" | "review" | "other",
    assignedTo: [] as string[],
    dueDate: new Date().toISOString().split("T")[0],
    priority: "medium" as "low" | "medium" | "high" | "critical",
    notes: "",
  })

  useEffect(() => {
    loadComplianceTasks()
  }, [hrState.initialized])

  const loadComplianceTasks = async () => {
    setLoading(true)
    try {
      // Use HRContext to refresh compliance tasks
      await refreshComplianceTasks()
      
      // Tasks are already in HR state
      setError(null)
    } catch (error: any) {
      console.error("Error loading compliance tasks:", error)
      setError(error.message || "Failed to load compliance tasks")
      // Error handling
    } finally {
      setLoading(false)
    }
  }



  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedTask(null)
  }

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Basic validation
      if (!taskForm.title) {
        setNotification({ message: "Title is required", type: "error" })
        return
      }
      
      // Ensure required fields have values
      const safeTaskForm = {
        ...taskForm,
        title: taskForm.title || "",
        description: taskForm.description || "",
        dueDate: taskForm.dueDate || "",
        notes: taskForm.notes || ""
      }

      // Create task data matching the interface in HRContext
      const taskData = {
        title: safeTaskForm.title,
        description: safeTaskForm.description,
        type: safeTaskForm.type as "training" | "certification" | "document" | "review" | "other",
        assignedTo: safeTaskForm.assignedTo,
        dueDate: safeTaskForm.dueDate, // Keep as string to match interface
        priority: safeTaskForm.priority as "low" | "medium" | "high" | "critical",
        status: "pending" as const,
        documents: [], // Required by the interface
        notes: safeTaskForm.notes,
        createdBy: settingsState.auth?.displayName || "System User",
        createdAt: Date.now() // Current timestamp as number
      }

      if (selectedTask) {
        // Update existing task using HRContext
        const updatedTask = await updateComplianceTask(selectedTask.id, taskData)
        if (updatedTask) {
          setNotification({ message: "Task updated successfully", type: "success" })
        } else {
          throw new Error("Failed to update task")
        }
      } else {
        // Create new task using HRContext
        const newTask = await addComplianceTask(taskData)
        if (newTask) {
          setNotification({ message: "Task created successfully", type: "success" })
        } else {
          throw new Error("Failed to create task")
        }
      }

      handleCloseDialog()
      await loadComplianceTasks()
      setError(null)
    } catch (error: any) {
      console.error("Error saving task:", error)
      setError(error.message || "Failed to save task")
    } finally {
      setLoading(false)
    }
  }

  const handleCloseNotification = () => {
    setNotification(null);
  }

  const handleDeleteTask = async (taskId: string) => {
    setLoading(true)
    try {
      // Use HRContext method to delete compliance task
      const success = await deleteComplianceTask(taskId)
      if (success) {
        setNotification({ message: "Task deleted successfully", type: "success" })
        await loadComplianceTasks()
        setError(null)
      } else {
        throw new Error("Failed to delete task")
      }
    } catch (error: any) {
      console.error("Error deleting task:", error)
      setError(error.message || "Failed to delete task")
    } finally {
      setLoading(false)
    }
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "training":
        return <SchoolIcon />
      case "certification":
        return <AssignmentIcon />
      case "document":
        return <FileDownloadIcon />
      case "review":
        return <RefreshIcon />
      default:
        return <CheckCircleIcon />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success"
      case "in_progress":
        return "primary"
      case "overdue":
        return "error"
      default:
        return "warning"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "error"
      case "high":
        return "warning"
      case "medium":
        return "primary"
      default:
        return "info"
    }
  }

  if (loading && hrState.complianceTasks.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 0, fontFamily: themeConfig.typography.fontFamily }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* DataHeader */}
      <DataHeader
        showDateControls={false}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search compliance tasks..."
        filters={filters}
        filtersExpanded={filtersExpanded}
        onFiltersToggle={() => setFiltersExpanded(!filtersExpanded)}
        sortOptions={sortOptions}
        sortValue={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onRefresh={handleRefresh}
        onCreateNew={handleCreateNew}
        createButtonLabel="Add Compliance Task"
        onExportCSV={handleExportCSV}
        additionalControls={
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            flexWrap: 'nowrap',
            minWidth: 0
          }}>
            <Button
              variant={tabValue === 0 ? "contained" : "outlined"}
              size="small"
              onClick={() => setTabValue(0)}
              sx={
                tabValue === 0
                  ? { 
                      bgcolor: "white", 
                      color: "primary.main", 
                      "&:hover": { bgcolor: "grey.100" },
                      whiteSpace: "nowrap"
                    }
                  : { 
                      color: "white", 
                      borderColor: "rgba(255, 255, 255, 0.5)", 
                      "&:hover": { borderColor: "white", bgcolor: "rgba(255, 255, 255, 0.1)" },
                      whiteSpace: "nowrap"
                    }
              }
            >
              Tasks
            </Button>
            <Button
              variant={tabValue === 1 ? "contained" : "outlined"}
              size="small"
              onClick={() => setTabValue(1)}
              sx={
                tabValue === 1
                  ? { 
                      bgcolor: "white", 
                      color: "primary.main", 
                      "&:hover": { bgcolor: "grey.100" },
                      whiteSpace: "nowrap"
                    }
                  : { 
                      color: "white", 
                      borderColor: "rgba(255, 255, 255, 0.5)", 
                      "&:hover": { borderColor: "white", bgcolor: "rgba(255, 255, 255, 0.1)" },
                      whiteSpace: "nowrap"
                    }
              }
            >
              Documents
            </Button>
            <Button
              variant={tabValue === 2 ? "contained" : "outlined"}
              size="small"
              onClick={() => setTabValue(2)}
              sx={
                tabValue === 2
                  ? { 
                      bgcolor: "white", 
                      color: "primary.main", 
                      "&:hover": { bgcolor: "grey.100" },
                      whiteSpace: "nowrap"
                    }
                  : { 
                      color: "white", 
                      borderColor: "rgba(255, 255, 255, 0.5)", 
                      "&:hover": { borderColor: "white", bgcolor: "rgba(255, 255, 255, 0.1)" },
                      whiteSpace: "nowrap"
                    }
              }
            >
              Audits
            </Button>
            <Button
              variant={tabValue === 3 ? "contained" : "outlined"}
              size="small"
              onClick={() => setTabValue(3)}
              sx={
                tabValue === 3
                  ? { 
                      bgcolor: "white", 
                      color: "primary.main", 
                      "&:hover": { bgcolor: "grey.100" },
                      whiteSpace: "nowrap"
                    }
                  : { 
                      color: "white", 
                      borderColor: "rgba(255, 255, 255, 0.5)", 
                      "&:hover": { borderColor: "white", bgcolor: "rgba(255, 255, 255, 0.1)" },
                      whiteSpace: "nowrap"
                    }
              }
            >
              Reports
            </Button>
          </Box>
        }
      />

      {/* Tasks Tab */}
      {tabValue === 0 && (
        <>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenComplianceCRUD(null, 'create')}>
            Add Task
          </Button>
        </Box>

        {filteredTasks.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center", borderRadius: themeConfig.borderRadius }}>
            <AssignmentIcon sx={{ fontSize: 48, color: themeConfig.colors.text.secondary, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {hrState.complianceTasks.length === 0 ? "No Compliance Tasks Yet" : "No Tasks Match Your Filters"}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {hrState.complianceTasks.length === 0 
                ? "Create your first compliance task to track certifications and requirements."
                : "Try adjusting your search or filter criteria."
              }
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenComplianceCRUD(null, 'create')}>
              {hrState.complianceTasks.length === 0 ? "Create First Task" : "Create New Task"}
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredTasks.map((task: ComplianceTask) => (
              <Grid item xs={12} md={6} key={task.id}>
                <Card sx={{ borderRadius: themeConfig.borderRadius }}>
                  <CardHeader
                    avatar={getTaskIcon(task.type)}
                    title={task.title}
                    subheader={
                      task.dueDate ? (
                        `Due: ${new Date(task.dueDate).toLocaleDateString()}`
                      ) : (
                        "No due date"
                      )
                    }
                    action={
                      <Box>
                        <Chip
                          label={task.status}
                          size="small"
                          color={getStatusColor(task.status) as any}
                          sx={{ mr: 1 }}
                        />
                        <Chip label={task.priority} size="small" color={getPriorityColor(task.priority) as any} />
                      </Box>
                    }
                  />
                  <CardContent>
                    <Typography variant="body2" paragraph>
                      {task.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Assigned to: {task.assignedTo.length} employee(s)
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Type: {task.type}
                    </Typography>
                    <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                      <IconButton size="small" onClick={() => handleOpenComplianceCRUD(task, 'edit')}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteTask(task.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        </>
      )}

      {/* Documents Tab */}
      {tabValue === 1 && (
        <>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Risk Documents
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Manage compliance-related documents and policies.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />}>
            Add Document
          </Button>
        </Paper>
        </>
      )}

      {/* Audits Tab */}
      {tabValue === 2 && (
        <>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Risk Audits
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Schedule and track compliance audits and inspections.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />}>
            Schedule Audit
          </Button>
        </Paper>
        </>
      )}

      {/* Reports Tab */}
      {tabValue === 3 && (
        <>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Risk Reports
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Generate compliance reports and analytics.
          </Typography>
          <Button variant="contained" startIcon={<FileDownloadIcon />}>
            Generate Report
          </Button>
        </Paper>
        </>
      )}

      {/* Task Dialog */}
      <Dialog open={openDialog && dialogType === "task"} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ style: { borderRadius: themeConfig.borderRadius } }}>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{selectedTask ? "Edit Task" : "Add New Task"}</Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Task Title"
                value={taskForm.title}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={taskForm.description}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Task Type</InputLabel>
                <Select
                  value={taskForm.type}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, type: e.target.value as any }))}
                  label="Task Type"
                >
                  <MenuItem value="training">Training</MenuItem>
                  <MenuItem value="certification">Certification</MenuItem>
                  <MenuItem value="document">Document</MenuItem>
                  <MenuItem value="review">Review</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, priority: e.target.value as any }))}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Assigned To</InputLabel>
                <Select
                  multiple
                  value={taskForm.assignedTo}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, assignedTo: e.target.value as string[] }))}
                  label="Assigned To"
                >
                  {hrState.employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={taskForm.notes}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTask}>
            {selectedTask ? "Update Task" : "Add Task"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setNotification(null)} severity={notification?.type} sx={{ width: "100%", fontFamily: themeConfig.typography.fontFamily }}>
          {notification?.message}
        </Alert>
      </Snackbar>

      {/* CRUD Modal */}
      <CRUDModal
        open={complianceCRUDModalOpen}
        onClose={handleCloseComplianceCRUD}
        title={crudMode === 'create' ? 'Add Compliance Task' : crudMode === 'edit' ? 'Edit Compliance Task' : 'View Compliance Task'}
        maxWidth="md"
      >
        <ComplianceCRUDForm
          complianceRecord={selectedComplianceForCRUD as any}
          mode={crudMode}
          onSave={handleSaveComplianceCRUD}
        />
      </CRUDModal>
    </Box>
  )
}

export default ComplianceTracking
