"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Paper,
  Alert,
  Grid,
  Tabs,
  Tab,
} from "@mui/material"
import { ref, get, push } from "firebase/database"
import { db } from "../services/firebase"
import { useRole } from "../context/RoleContext"
import { useLogIn } from "../context/LogInContext"
import { Page, PageHeader } from "../styles/StyledComponents"
import { CheckCircle, Assignment, History, AccessTime, CheckCircleOutline, CalendarToday } from "@mui/icons-material"

interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
}

interface Checklist {
  id: string
  assignedRole: string
  items: ChecklistItem[]
  title: string
}

interface CompletedChecklist {
  id: string
  title: string
  completedBy: string
  completedDate: string
  completedTime: string
  completedAt: number
}

const MyChecklistPage: React.FC = () => {
  const { state: roleState } = useRole()
  const { state: userState } = useLogIn()
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [completedChecklists, setCompletedChecklists] = useState<CompletedChecklist[]>([])
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    fetchChecklists()
    fetchCompletedChecklists()
  }, [roleState])

  // Fetch checklists from Firebase
  const fetchChecklists = async () => {
    setLoading(true)
    setError(null)

    try {
      const checklistsRef = ref(db, "checklists")
      const snapshot = await get(checklistsRef)

      if (snapshot.exists()) {
        const data = snapshot.val()
        const checklistsArray = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...(typeof value === "object" ? value : {}),
        })) as Checklist[]

        // Filter checklists based on the user's role
        const filteredChecklists = checklistsArray.filter((checklist) => checklist.assignedRole === roleState.role)

        // Check if any checklists were completed today
        const completedRef = ref(db, "completechecks")
        const completedSnapshot = await get(completedRef)

        if (completedSnapshot.exists()) {
          const completedData = completedSnapshot.val()
          const today = new Date()
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()

          // Filter out checklists that were completed today
          const availableChecklists = filteredChecklists.filter((checklist) => {
            // Check if this checklist was completed today
            const wasCompletedToday = Object.values(completedData).some((completed: any) => {
              return (
                completed.title === checklist.title &&
                completed.completedAt >= startOfDay &&
                completed.completedBy === userState.firstName
              )
            })

            // If it was completed today, don't show it again
            return !wasCompletedToday
          })

          setChecklists(availableChecklists)
        } else {
          setChecklists(filteredChecklists)
        }
      } else {
        setChecklists([])
      }
    } catch (err) {
      console.error("Error fetching checklists:", err)
      setError("Failed to fetch checklists")
    } finally {
      setLoading(false)
    }
  }

  // Fetch completed checklists
  const fetchCompletedChecklists = async () => {
    try {
      const completedRef = ref(db, "completechecks")
      const snapshot = await get(completedRef)

      if (snapshot.exists()) {
        const data = snapshot.val()
        const completedArray = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...(typeof value === "object" ? value : {}),
        })) as CompletedChecklist[]

        // Sort by completion date (newest first)
        completedArray.sort((a, b) => b.completedAt - a.completedAt)

        // Filter to only show the current user's completed checklists
        const userCompletedChecklists = completedArray.filter(
          (checklist) => checklist.completedBy === userState.firstName,
        )

        setCompletedChecklists(userCompletedChecklists)
      } else {
        setCompletedChecklists([])
      }
    } catch (err) {
      console.error("Error fetching completed checklists:", err)
    }
  }

  // Handle checklist selection
  const handleChecklistSelect = (checklist: Checklist) => {
    // Initialize all items as uncompleted when selecting a checklist
    const initializedChecklist = {
      ...checklist,
      items: checklist.items.map((item) => ({
        ...item,
        completed: false,
      })),
    }
    setSelectedChecklist(initializedChecklist)
    setSubmitSuccess(false)
  }

  // Handle checkbox state change
  const handleCheckboxChange = (itemId: string) => {
    if (!selectedChecklist) return

    setSelectedChecklist((prevChecklist) => {
      if (!prevChecklist) return null
      const updatedItems = prevChecklist.items.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item,
      )
      return { ...prevChecklist, items: updatedItems }
    })
  }

  // Submit the checklist
  const submitChecklist = async () => {
    if (!selectedChecklist) return
    setSubmitting(true)

    const allCompleted =
      Array.isArray(selectedChecklist.items) && selectedChecklist.items.every((item) => item.completed)

    if (allCompleted) {
      try {
        // Convert timestamp to UK date and time
        const timestamp = Date.now()
        const ukDate = new Date(timestamp).toLocaleDateString("en-GB")
        const ukTime = new Date(timestamp).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })

        // Save the user's name in the completedBy field
        const completedByName = userState.firstName || "Unknown"

        // Add an entry to the /completechecks node in Firebase
        const completedChecklistRef = ref(db, "completechecks")
        const completedCheckData = {
          title: selectedChecklist.title,
          completedBy: completedByName,
          completedDate: ukDate,
          completedTime: ukTime,
          completedAt: timestamp,
        }

        await push(completedChecklistRef, completedCheckData)

        // Refresh completed checklists
        fetchCompletedChecklists()

        // Show success message
        setSubmitSuccess(true)

        // Reset items locally
        setSelectedChecklist((prevChecklist) => {
          if (!prevChecklist) return null
          const resetItems = prevChecklist.items.map((item) => ({
            ...item,
            completed: false,
          }))
          return { ...prevChecklist, items: resetItems }
        })
      } catch (err) {
        console.error("Error submitting checklist:", err)
        setError("Failed to submit checklist")
      }
    } else {
      setError("Please complete all items before submitting.")
    }
    setSubmitting(false)
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const getCompletionPercentage = (checklist: Checklist): number => {
    if (!checklist.items || checklist.items.length === 0) return 0
    const completedCount = checklist.items.filter((item) => item.completed).length
    return Math.round((completedCount / checklist.items.length) * 100)
  }

  return (
    <Page>
      <PageHeader>
        <Box display="flex" alignItems="center" gap={2}>
          <Assignment color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              My Checklists
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              View and complete your assigned checklists
            </Typography>
          </Box>
        </Box>
      </PageHeader>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
        variant="fullWidth"
      >
        <Tab icon={<Assignment />} label="Available Checklists" iconPosition="start" />
        <Tab
          icon={<History />}
          label="Completed History"
          iconPosition="start"
          disabled={completedChecklists.length === 0}
        />
      </Tabs>

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Checklist submitted successfully!
        </Alert>
      )}

      {/* Available Checklists Tab */}
      {tabValue === 0 && (
        <>
          {!selectedChecklist ? (
            // Display available checklists
            <Box>
              {checklists.length > 0 ? (
                <Grid container spacing={3}>
                  {checklists.map((checklist) => (
                    <Grid item xs={12} sm={6} md={4} key={checklist.id}>
                      <Card
                        sx={{
                          height: "100%",
                          cursor: "pointer",
                          transition: "transform 0.2s",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: 3,
                          },
                        }}
                        onClick={() => handleChecklistSelect(checklist)}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                            <Typography variant="h6" fontWeight="medium">
                              {checklist.title}
                            </Typography>
                            <Chip label={checklist.assignedRole} size="small" color="primary" variant="outlined" />
                          </Box>
                          <Divider sx={{ my: 1 }} />
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <CheckCircleOutline fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {checklist.items?.length || 0} tasks to complete
                            </Typography>
                          </Box>
                          <Button variant="contained" fullWidth sx={{ mt: 2 }} startIcon={<Assignment />}>
                            Start Checklist
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No checklists available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    There are no checklists assigned to your role at this time.
                  </Typography>
                </Paper>
              )}
            </Box>
          ) : (
            // Display selected checklist details
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {selectedChecklist.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedChecklist.assignedRole} Role • {selectedChecklist.items.length} Tasks
                    </Typography>
                  </Box>
                  <Button variant="outlined" onClick={() => setSelectedChecklist(null)}>
                    Back to List
                  </Button>
                </Box>

                <Box mb={2}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="body2" fontWeight="medium">
                      Completion:
                    </Typography>
                    <Chip
                      label={`${getCompletionPercentage(selectedChecklist)}%`}
                      color={getCompletionPercentage(selectedChecklist) === 100 ? "success" : "primary"}
                      size="small"
                    />
                  </Box>
                  <LinearProgressWithLabel value={getCompletionPercentage(selectedChecklist)} />
                </Box>

                <Divider sx={{ my: 2 }} />

                {Array.isArray(selectedChecklist.items) && selectedChecklist.items.length > 0 ? (
                  <List>
                    {selectedChecklist.items.map((item) => (
                      <Paper
                        key={item.id}
                        variant="outlined"
                        sx={{
                          mb: 2,
                          borderRadius: 2,
                          bgcolor: item.completed ? "success.light" : "background.paper",
                          transition: "background-color 0.3s",
                        }}
                      >
                        <ListItem>
                          <ListItemIcon>
                            <Checkbox
                              edge="start"
                              checked={item.completed}
                              onChange={() => handleCheckboxChange(item.id)}
                              icon={<CheckCircleOutline />}
                              checkedIcon={<CheckCircle color="success" />}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  textDecoration: item.completed ? "line-through" : "none",
                                  fontWeight: item.completed ? "normal" : "medium",
                                }}
                              >
                                {item.title}
                              </Typography>
                            }
                            secondary={item.description}
                          />
                        </ListItem>
                      </Paper>
                    ))}
                  </List>
                ) : (
                  <Typography>No items available in this checklist.</Typography>
                )}

                <Button
                  variant="contained"
                  onClick={submitChecklist}
                  disabled={submitting || getCompletionPercentage(selectedChecklist) !== 100}
                  fullWidth
                  size="large"
                  sx={{ mt: 2 }}
                  startIcon={<CheckCircle />}
                >
                  {submitting ? "Submitting..." : "Submit Completed Checklist"}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Completed History Tab */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Completed Checklists
            </Typography>

            {completedChecklists.length > 0 ? (
              <List>
                {completedChecklists.map((checklist) => (
                  <Paper key={checklist.id} variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={checklist.title}
                        secondary={
                          <Box component="span" display="flex" flexDirection="column">
                            <Box display="flex" alignItems="center" gap={1}>
                              <CalendarToday fontSize="small" />
                              <Typography variant="body2">{checklist.completedDate}</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <AccessTime fontSize="small" />
                              <Typography variant="body2">{checklist.completedTime}</Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <Chip label="Completed" color="success" size="small" icon={<CheckCircle />} />
                    </ListItem>
                  </Paper>
                ))}
              </List>
            ) : (
              <Typography textAlign="center" color="text.secondary" py={3}>
                You haven't completed any checklists yet.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Page>
  )
}

// Custom linear progress with label
const LinearProgressWithLabel: React.FC<{ value: number }> = ({ value }) => {
  return (
    <Box display="flex" alignItems="center" width="100%">
      <Box width="100%" mr={1}>
        <Box
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: "background.paper",
            boxShadow: "inset 0 0 5px rgba(0,0,0,0.1)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${value}%`,
              bgcolor: value === 100 ? "success.main" : "primary.main",
              transition: "width 0.4s ease-in-out",
              borderRadius: 5,
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default MyChecklistPage
