"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Paper,
  Button,
  TextField,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Badge,
  Tooltip,
  Alert,
  InputAdornment,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import { ref, set, get, push, update } from "firebase/database"
import { db } from "../services/firebase"
import { useLogIn } from "../context/LogInContext"
import { useRole } from "../context/RoleContext"
import { Page, PageHeader } from "../styles/StyledComponents"
import { Send, Message, MarkEmailRead, Refresh, Search, CheckCircle, Person, AccessTime } from "@mui/icons-material"

interface Note {
  id: string
  content: string
  createdAt: string
  createdBy: string
  read?: boolean
  readAt?: string | null
  readBy?: string | null
  priority?: "low" | "medium" | "high"
}

const NotesToManagersPage: React.FC = () => {
  const { state: userState } = useLogIn()
  const { state: roleState } = useRole()
  const [notes, setNotes] = useState<Note[]>([])
  const [noteContent, setNoteContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [openNoteDialog, setOpenNoteDialog] = useState(false)
  const [notePriority, setNotePriority] = useState<"low" | "medium" | "high">("medium")
  const [tabValue, setTabValue] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  // Only fetch notes if the user is a Manager
  useEffect(() => {
    if (roleState.role === "Manager") {
      fetchNotes()
    }
  }, [roleState, refreshKey])

  const fetchNotes = async () => {
    setLoading(true)
    setError(null)
    try {
      const notesRef = ref(db, "notesToManagers")
      const snapshot = await get(notesRef)
      if (snapshot.exists()) {
        const data = snapshot.val()
        const notesArray = Object.entries(data).map(([key, value]: [string, any]) => {
          const {
            content = "No Content",
            createdAt = new Date().toISOString(),
            createdBy = "Unknown",
            read = false,
            readAt = null,
            readBy = null,
            priority = "medium",
          } = value || {}
          return { id: key, content, createdAt, createdBy, read, readAt, readBy, priority }
        })

        // Sort notes: unread first, then by date (newest first)
        notesArray.sort((a, b) => {
          if (a.read !== b.read) return a.read ? 1 : -1
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })

        setNotes(notesArray)
      } else {
        setNotes([])
      }
    } catch (err) {
      setError("Failed to fetch notes")
    } finally {
      setLoading(false)
    }
  }

  const addNote = async () => {
    if (!noteContent.trim()) return
    setLoading(true)
    setError(null)
    const newNote = {
      content: noteContent,
      read: false,
      createdAt: new Date().toISOString(),
      readAt: null,
      createdBy: userState.firstName || "Unknown",
      readBy: null,
      priority: notePriority,
    }
    try {
      const notesRef = ref(db, "notesToManagers")
      const newNoteRef = push(notesRef)
      await set(newNoteRef, newNote)

      // If the user is a Manager, re-fetch the notes to update the list.
      if (roleState.role === "Manager") {
        fetchNotes()
      }
      setNoteContent("")
      setNotePriority("medium")
      setSuccess("Note sent successfully!")

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      setError("Failed to add note")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (note: Note) => {
    if (note.read) return

    try {
      const noteRef = ref(db, `notesToManagers/${note.id}`)
      await update(noteRef, {
        read: true,
        readAt: new Date().toISOString(),
        readBy: userState.firstName || "Unknown",
      })

      // Update local state
      setNotes((prevNotes) =>
        prevNotes.map((n) =>
          n.id === note.id
            ? {
                ...n,
                read: true,
                readAt: new Date().toISOString(),
                readBy: userState.firstName || "Unknown",
              }
            : n,
        ),
      )
    } catch (err) {
      console.error("Error marking note as read:", err)
    }
  }

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note)
    setOpenNoteDialog(true)

    // If the note is unread, mark it as read
    if (!note.read && roleState.role === "Manager") {
      markAsRead(note)
    }
  }

  const handleCloseDialog = () => {
    setOpenNoteDialog(false)
    setSelectedNote(null)
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.createdBy.toLowerCase().includes(searchQuery.toLowerCase())

    if (tabValue === 0) return matchesSearch // All notes
    if (tabValue === 1) return !note.read && matchesSearch // Unread notes
    if (tabValue === 2) return note.read && matchesSearch // Read notes

    return matchesSearch
  })

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Page>
      <PageHeader>
        <Box display="flex" alignItems="center" gap={2}>
          <Message color="primary" sx={{ fontSize: isMobile ? 24 : 32 }} />
          <Box>
            <Typography variant="h5" component="h1" fontWeight="bold" sx={{ fontSize: isMobile ? "1.25rem" : "h4" }}>
              Notes to Managers
            </Typography>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ fontSize: isMobile ? "0.875rem" : "subtitle1" }}
            >
              {roleState.role === "Manager" ? "View and manage staff notes" : "Send notes to management team"}
            </Typography>
          </Box>
        </Box>
      </PageHeader>

      {/* Add Note Section - Only for non-managers */}
      {roleState.role !== "Manager" && (
        <Paper elevation={3} sx={{ padding: isMobile ? 2 : 3, marginBottom: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? "1.125rem" : "h6" }}>
            Send a Note to Managers
          </Typography>

          <TextField
            label="Your Note"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            variant="outlined"
            fullWidth
            multiline
            rows={isMobile ? 2 : 3}
            sx={{ mb: 2 }}
            placeholder="Type your message here..."
            inputProps={{ style: { fontSize: isMobile ? "0.875rem" : "1rem" } }}
          />

          <Box
            display="flex"
            flexDirection={isMobile ? "column" : "row"}
            justifyContent="space-between"
            alignItems="center"
            gap={isMobile ? 2 : 0}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" sx={{ fontSize: isMobile ? "0.875rem" : "body2" }}>
                Priority:
              </Typography>
              <Chip
                label="Low"
                color={notePriority === "low" ? "success" : "default"}
                onClick={() => setNotePriority("low")}
                variant={notePriority === "low" ? "filled" : "outlined"}
                size={isMobile ? "small" : "medium"}
                sx={{ cursor: "pointer", fontSize: isMobile ? "0.75rem" : "0.875rem" }}
              />
              <Chip
                label="Medium"
                color={notePriority === "medium" ? "warning" : "default"}
                onClick={() => setNotePriority("medium")}
                variant={notePriority === "medium" ? "filled" : "outlined"}
                size={isMobile ? "small" : "medium"}
                sx={{ cursor: "pointer", fontSize: isMobile ? "0.75rem" : "0.875rem" }}
              />
              <Chip
                label="High"
                color={notePriority === "high" ? "error" : "default"}
                onClick={() => setNotePriority("high")}
                variant={notePriority === "high" ? "filled" : "outlined"}
                size={isMobile ? "small" : "medium"}
                sx={{ cursor: "pointer", fontSize: isMobile ? "0.75rem" : "0.875rem" }}
              />
            </Box>

            <Button
              variant="contained"
              onClick={addNote}
              disabled={loading || !noteContent.trim()}
              startIcon={<Send />}
              size={isMobile ? "small" : "medium"}
              sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}
            >
              Send Note
            </Button>
          </Box>

          {success && (
            <Alert severity="success" sx={{ mt: 2, fontSize: isMobile ? "0.875rem" : "1rem" }}>
              {success}
            </Alert>
          )}
        </Paper>
      )}

      {loading && !notes.length && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, fontSize: isMobile ? "0.875rem" : "1rem" }}>
          {error}
        </Alert>
      )}

      {roleState.role === "Manager" ? (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ padding: isMobile ? 2 : 3 }}>
              <Box
                display="flex"
                flexDirection={isMobile ? "column" : "row"}
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                gap={1}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6" sx={{ fontSize: isMobile ? "1rem" : "h6" }}>
                    Notes
                  </Typography>
                  <Badge badgeContent={notes.filter((note) => !note.read).length} color="error" showZero={false}>
                    <MarkEmailRead />
                  </Badge>
                </Box>

                <Box display="flex" gap={1}>
                  <TextField
                    placeholder="Search notes..."
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" />
                        </InputAdornment>
                      ),
                      style: { fontSize: isMobile ? "0.75rem" : "0.875rem" },
                    }}
                    sx={{ width: isMobile ? "100%" : "auto" }}
                  />
                  <Tooltip title="Refresh">
                    <IconButton onClick={handleRefresh} size={isMobile ? "small" : "medium"}>
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="All Notes" sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }} />
                <Tab
                  label={
                    <Badge badgeContent={notes.filter((note) => !note.read).length} color="error" showZero={false}>
                      Unread
                    </Badge>
                  }
                  sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}
                />
                <Tab label="Read" sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }} />
              </Tabs>
            </CardContent>
          </Card>

          {!loading && filteredNotes.length === 0 && (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: isMobile ? "1rem" : "h6" }}>
                No notes found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: isMobile ? "0.875rem" : "body2" }}>
                {searchQuery
                  ? "No notes match your search criteria."
                  : tabValue === 1
                    ? "No unread notes."
                    : tabValue === 2
                      ? "No read notes."
                      : "There are no notes to display."}
              </Typography>
            </Paper>
          )}

          <Grid container spacing={isMobile ? 1 : 2}>
            {filteredNotes.map((note) => (
              <Grid item xs={12} sm={6} md={4} key={note.id}>
                <Card
                  sx={{
                    height: "100%",
                    cursor: "pointer",
                    transition: "transform 0.2s",
                    position: "relative",
                    borderLeft: `4px solid ${note.read ? "transparent" : "#1976d2"}`,
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 3,
                    },
                  }}
                  onClick={() => handleNoteClick(note)}
                >
                  {!note.read && (
                    <Badge
                      color="primary"
                      variant="dot"
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        "& .MuiBadge-badge": {
                          height: 12,
                          width: 12,
                          borderRadius: "50%",
                        },
                      }}
                    />
                  )}

                  <CardContent sx={{ padding: isMobile ? 2 : 3 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Avatar
                        sx={{
                          bgcolor: note.read ? "grey.400" : "primary.main",
                          width: isMobile ? 32 : 40,
                          height: isMobile ? 32 : 40,
                          fontSize: isMobile ? "0.875rem" : "1rem",
                        }}
                      >
                        {getInitials(note.createdBy)}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          fontWeight="medium"
                          sx={{ fontSize: isMobile ? "0.875rem" : "subtitle1" }}
                        >
                          {note.createdBy}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: isMobile ? "0.75rem" : "caption" }}
                        >
                          {formatDate(note.createdAt)} at {formatTime(note.createdAt)}
                        </Typography>
                      </Box>
                      <Chip
                        label={note.priority}
                        size="small"
                        color={getPriorityColor(note.priority || "medium") as any}
                        sx={{ ml: "auto", fontSize: isMobile ? "0.75rem" : "0.875rem" }}
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        mb: 2,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        height: isMobile ? 40 : 60,
                        fontSize: isMobile ? "0.875rem" : "body2",
                      }}
                    >
                      {note.content}
                    </Typography>

                    <Divider sx={{ my: 1 }} />

                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: isMobile ? "0.75rem" : "caption" }}
                      >
                        {note.read ? `Read by ${note.readBy} on ${formatDate(note.readAt || "")}` : "Not yet read"}
                      </Typography>
                      {note.read ? (
                        <CheckCircle fontSize="small" color="success" />
                      ) : (
                        <MarkEmailRead fontSize="small" color="action" />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? "1rem" : "h6" }}>
              Your Note Has Been Sent
            </Typography>
            <Typography variant="body1" sx={{ fontSize: isMobile ? "0.875rem" : "body1" }}>
              Thank you for your message. Managers will be able to see your note and respond accordingly.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Note Detail Dialog */}
      <Dialog open={openNoteDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth={isMobile}>
        {selectedNote && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" sx={{ fontSize: isMobile ? "1rem" : "h6" }}>
                  Note Details
                </Typography>
                <Chip
                  label={selectedNote.priority || "medium"}
                  color={getPriorityColor(selectedNote.priority || "medium") as any}
                  size="small"
                  sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    width: isMobile ? 40 : 48,
                    height: isMobile ? 40 : 48,
                    fontSize: isMobile ? "1rem" : "1.125rem",
                  }}
                >
                  {getInitials(selectedNote.createdBy)}
                </Avatar>
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{ fontSize: isMobile ? "0.875rem" : "subtitle1" }}
                  >
                    {selectedNote.createdBy}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AccessTime fontSize="small" color="action" />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: isMobile ? "0.75rem" : "body2" }}
                    >
                      {formatDate(selectedNote.createdAt)} at {formatTime(selectedNote.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: "background.default" }}>
                <Typography variant="body1" whiteSpace="pre-wrap" sx={{ fontSize: isMobile ? "0.875rem" : "body1" }}>
                  {selectedNote.content}
                </Typography>
              </Paper>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" alignItems="center" gap={1}>
                <Person fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: isMobile ? "0.75rem" : "body2" }}>
                  {selectedNote.read
                    ? `Read by ${selectedNote.readBy} on ${formatDate(selectedNote.readAt || "")} at ${formatTime(selectedNote.readAt || "")}`
                    : "Not yet read"}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Page>
  )
}

export default NotesToManagersPage
