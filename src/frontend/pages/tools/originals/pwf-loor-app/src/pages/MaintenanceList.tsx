"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Card,
  CardContent,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Tabs,
  Tab,
  Badge,
} from "@mui/material"
import { ref, set, get, update, push, remove } from "firebase/database"
import { db } from "../services/firebase"
import { useLogIn } from "../context/LogInContext"
import { useRole } from "../context/RoleContext"
import { Page, PageHeader } from "../styles/StyledComponents"
import { Build, Add, CheckCircle, Schedule, Person, Delete, Refresh, History } from "@mui/icons-material"

interface Task {
  id: string
  name: string
  description?: string
  completed: boolean
  createdAt: string
  completedAt: string | null
  createdBy: string
  completedBy: string | null
  priority?: "low" | "medium" | "high"
}

const MaintenanceListPage: React.FC = () => {
  const { state: userState } = useLogIn()
  const { state: roleState } = useRole()
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskName, setTaskName] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const isManager = roleState.role === "Manager"

  useEffect(() => {
    fetchTasks()
  }, [tabValue, refreshKey])

  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const tasksRef = ref(db, "maintenanceTasks")
      const snapshot = await get(tasksRef)

      if (snapshot.exists()) {
        const data = snapshot.val()
        const tasksArray = Object.entries(data).map(([key, value]: [string, any]) => {
          const {
            name = "Unnamed Task",
            description = "",
            completed = false,
            createdAt = new Date().toISOString(),
            completedAt = null,
            createdBy = "Unknown",
            completedBy = null,
            priority = "medium",
          } = value || {}
          return { id: key, name, description, completed, createdAt, completedAt, createdBy, completedBy, priority }
        })

        // Sort tasks: incomplete first, then by priority, then by creation date
        tasksArray.sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1

          const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
          const aPriority = a.priority || "medium"
          const bPriority = b.priority || "medium"
          const priorityDiff = priorityOrder[aPriority] - priorityOrder[bPriority]
          if (priorityDiff !== 0) return priorityDiff

          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })

        // Filter based on tab
        const filteredTasks = tasksArray.filter((task) => {
          if (tabValue === 0) return true // All tasks
          if (tabValue === 1) return !task.completed // Pending
          if (tabValue === 2) return task.completed // Completed
          return true
        })

        setTasks(filteredTasks)
      } else {
        setTasks([])
      }
    } catch (err) {
      setError("Failed to fetch tasks")
    } finally {
      setLoading(false)
    }
  }

  const addTask = async () => {
    if (!taskName.trim()) return
    setLoading(true)
    setError(null)

    const newTask = {
      name: taskName,
      description: taskDescription,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      createdBy: userState.firstName || "Unknown",
      completedBy: null,
      priority: taskPriority,
    }

    try {
      const tasksRef = ref(db, "maintenanceTasks")
      const newTaskRef = push(tasksRef)
      await set(newTaskRef, newTask)
      fetchTasks()
      setTaskName("")
      setTaskDescription("")
      setTaskPriority("medium")
      setSuccess("Task added successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Failed to add task")
    } finally {
      setLoading(false)
    }
  }

  const markAsComplete = async (taskId: string) => {
    setLoading(true)
    setError(null)

    try {
      const taskRef = ref(db, `maintenanceTasks/${taskId}`)
      const task = (await get(taskRef)).val()

      const updatedTask = {
        ...task,
        completed: true,
        completedAt: new Date().toISOString(),
        completedBy: userState.firstName || "Unknown",
      }

      await update(taskRef, updatedTask)
      fetchTasks()
      setSuccess("Task marked as complete!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Failed to update task")
    } finally {
      setLoading(false)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return

    try {
      const taskRef = ref(db, `maintenanceTasks/${taskId}`)
      await remove(taskRef)
      fetchTasks()
      setSuccess("Task deleted successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Failed to delete task")
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedTask(null)
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "error"
      case "medium":
        return "warning"
      case "low":
        return "success"
      default:
        return "default"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTaskCounts = () => {
    const allTasks = tasks // This should be all tasks, not filtered
    return {
      total: allTasks.length,
      pending: allTasks.filter((task) => !task.completed).length,
      completed: allTasks.filter((task) => task.completed).length,
    }
  }

  return (
    <Page>
      <PageHeader>
        <Box display="flex" alignItems="center" gap={2}>
          <Build color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Maintenance Tasks
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage and track maintenance tasks
            </Typography>
          </Box>
        </Box>
      </PageHeader>

      {/* Add Task Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
            <Add />
            Add New Task
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Task Name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                variant="outlined"
                fullWidth
                placeholder="Enter task name..."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Priority"
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as "low" | "medium" | "high")}
                variant="outlined"
                fullWidth
                SelectProps={{ native: true }}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="contained"
                onClick={addTask}
                disabled={loading || !taskName.trim()}
                fullWidth
                sx={{ height: "56px" }}
                startIcon={<Add />}
              >
                Add Task
              </Button>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description (Optional)"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                variant="outlined"
                fullWidth
                multiline
                rows={2}
                placeholder="Enter task description..."
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Controls */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab
            label={
              <Badge badgeContent={getTaskCounts().total} color="primary" showZero={false}>
                All Tasks
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={getTaskCounts().pending} color="warning" showZero={false}>
                Pending
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={getTaskCounts().completed} color="success" showZero={false}>
                Completed
              </Badge>
            }
          />
        </Tabs>

        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tasks List */}
      {loading && !tasks.length ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : tasks.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tasks found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tabValue === 1 ? "No pending tasks." : tabValue === 2 ? "No completed tasks." : "No tasks created yet."}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {tasks.map((task) => (
            <Grid item xs={12} sm={6} md={4} key={task.id}>
              <Card
                sx={{
                  height: "100%",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  borderLeft: `4px solid ${task.completed ? "#4caf50" : getPriorityColor(task.priority || "medium")}`,
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 3,
                  },
                }}
                onClick={() => handleTaskClick(task)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="h6" fontWeight="medium" sx={{ flex: 1 }}>
                      {task.name}
                    </Typography>
                    <Chip
                      label={task.priority}
                      color={getPriorityColor(task.priority || "medium") as any}
                      size="small"
                    />
                  </Box>

                  {task.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {task.description}
                    </Typography>
                  )}

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Person fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      Created by {task.createdBy}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Schedule fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(task.createdAt)}
                    </Typography>
                  </Box>

                  {task.completed ? (
                    <Box>
                      <Chip label="Completed" color="success" size="small" icon={<CheckCircle />} sx={{ mb: 1 }} />
                      <Typography variant="caption" color="text.secondary" display="block">
                        Completed by {task.completedBy} on {formatDate(task.completedAt || "")}
                      </Typography>
                    </Box>
                  ) : (
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsComplete(task.id)
                        }}
                        startIcon={<CheckCircle />}
                      >
                        Complete
                      </Button>
                      {isManager && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteTask(task.id)
                          }}
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Task Detail Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        {selectedTask && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Task Details</Typography>
                <Chip
                  label={selectedTask.priority}
                  color={getPriorityColor(selectedTask.priority || "medium") as any}
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="h6" gutterBottom>
                {selectedTask.name}
              </Typography>

              {selectedTask.description && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "background.default" }}>
                  <Typography variant="body1">{selectedTask.description}</Typography>
                </Paper>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Person fontSize="small" />
                    <Typography variant="body2">
                      <strong>Created by:</strong> {selectedTask.createdBy}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Schedule fontSize="small" />
                    <Typography variant="body2">
                      <strong>Created:</strong> {formatDate(selectedTask.createdAt)}
                    </Typography>
                  </Box>
                </Grid>

                {selectedTask.completed && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CheckCircle fontSize="small" color="success" />
                        <Typography variant="body2">
                          <strong>Completed by:</strong> {selectedTask.completedBy}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <History fontSize="small" />
                        <Typography variant="body2">
                          <strong>Completed:</strong> {formatDate(selectedTask.completedAt || "")}
                        </Typography>
                      </Box>
                    </Grid>
                  </>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              {!selectedTask.completed && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => {
                    markAsComplete(selectedTask.id)
                    handleCloseDialog()
                  }}
                  startIcon={<CheckCircle />}
                >
                  Mark Complete
                </Button>
              )}
              {isManager && (
                <Button
                  color="error"
                  onClick={() => {
                    deleteTask(selectedTask.id)
                    handleCloseDialog()
                  }}
                  startIcon={<Delete />}
                >
                  Delete
                </Button>
              )}
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Page>
  )
}

export default MaintenanceListPage
