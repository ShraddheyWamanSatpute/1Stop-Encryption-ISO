"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material"
import { db } from "../services/firebase"
import { ref, get, update, remove } from "firebase/database"
import type { ChecklistItem, Checklist as ChecklistType } from "./ChecklistPage" // Assuming ChecklistItem interface is shared

interface ViewEditChecklistsProps {
  role: string
}

const ViewEditChecklists: React.FC<ViewEditChecklistsProps> = () => {
  const [checklists, setChecklists] = useState<ChecklistType[]>([])
  const [open, setOpen] = useState(false) // For the edit dialog
  const [currentChecklist, setCurrentChecklist] = useState<ChecklistType | null>(null)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedItems, setEditedItems] = useState<ChecklistItem[]>([])
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [checklistToDelete, setChecklistToDelete] = useState<ChecklistType | null>(null)

  // States for adding a new task in the edit dialog
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")

  useEffect(() => {
    fetchChecklists()
  }, [])

  const fetchChecklists = async () => {
    const checklistsRef = ref(db, "checklists")
    const snapshot = await get(checklistsRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      const checklistsArray = Object.entries(data).map(([key, value]) => ({
        id: key,
        ...(typeof value === "object" ? value : {}),
      })) as ChecklistType[]
      setChecklists(checklistsArray)
    }
  }

  const handleEditClick = (checklist: ChecklistType) => {
    setCurrentChecklist(checklist)
    setEditedTitle(checklist.title)
    setEditedItems(checklist.items && Array.isArray(checklist.items) ? checklist.items : [])
    setOpen(true)
  }

  const handleDialogClose = () => {
    setOpen(false)
    setCurrentChecklist(null)
    setEditedTitle("")
    setEditedItems([])
    setNewTaskTitle("")
    setNewTaskDescription("")
  }

  const handleSave = async () => {
    if (currentChecklist) {
      const checklistRef = ref(db, `checklists/${currentChecklist.id}`)
      const updatedChecklist = {
        title: editedTitle,
        items: editedItems,
      }
      await update(checklistRef, updatedChecklist)
      fetchChecklists()
      handleDialogClose()
    }
  }

  const handleItemChange = (index: number, field: string, value: string) => {
    const updatedItems = [...editedItems]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    }
    setEditedItems(updatedItems)
  }

  const handleTaskRemove = (index: number) => {
    const updatedItems = editedItems.filter((_, i) => i !== index)
    setEditedItems(updatedItems)
  }

  const handleAddTask = () => {
    if (newTaskTitle.trim() === "" || newTaskDescription.trim() === "") {
      return // Do not add empty tasks
    }
    const newTask: ChecklistItem = {
      id: Date.now().toString(), // In production you might use Firebase's push() to generate a unique id
      title: newTaskTitle,
      description: newTaskDescription,
      completed: false,
      completedBy: null,
      completedAt: null,
    }
    setEditedItems([...editedItems, newTask])
    setNewTaskTitle("")
    setNewTaskDescription("")
  }

  const handleDeleteClick = (checklist: ChecklistType) => {
    setChecklistToDelete(checklist)
    setOpenDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (checklistToDelete) {
      const checklistRef = ref(db, `checklists/${checklistToDelete.id}`)
      await remove(checklistRef)
      fetchChecklists()
      setOpenDeleteDialog(false)
    }
  }

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false)
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ marginBottom: 2 }}>
        View & Edit Checklists
      </Typography>

      {/* Table layout for checklists */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ border: "none", fontWeight: "bold" }}>Title</TableCell>
              <TableCell sx={{ border: "none", fontWeight: "bold" }} align="center">
                Edit
              </TableCell>
              <TableCell sx={{ border: "none", fontWeight: "bold" }} align="center">
                Delete
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {checklists.map((checklist) => (
              <TableRow key={checklist.id}>
                <TableCell sx={{ border: "none" }}>{checklist.title}</TableCell>
                <TableCell sx={{ border: "none" }} align="center">
                  <Button onClick={() => handleEditClick(checklist)} variant="contained">
                    Edit
                  </Button>
                </TableCell>
                <TableCell sx={{ border: "none" }} align="center">
                  <Button onClick={() => handleDeleteClick(checklist)} variant="contained" color="error">
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Checklist Dialog */}
      <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>Edit Checklist</DialogTitle>
        <DialogContent>
          <TextField
            label="Checklist Title"
            fullWidth
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            sx={{ marginBottom: 2 }}
          />

          <Typography variant="h6" sx={{ marginBottom: 1 }}>
            Checklist Items
          </Typography>
          {editedItems.length > 0 ? (
            editedItems.map((item, index) => (
              <Box
                key={item.id}
                sx={{
                  marginBottom: 2,
                  borderBottom: "1px solid #e0e0e0",
                  paddingBottom: 1,
                }}
              >
                <TextField
                  label="Item Title"
                  value={item.title}
                  onChange={(e) => handleItemChange(index, "title", e.target.value)}
                  fullWidth
                  sx={{ marginBottom: 1 }}
                />
                <TextField
                  label="Item Description"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, "description", e.target.value)}
                  fullWidth
                  sx={{ marginBottom: 1 }}
                />
                <Button variant="outlined" color="error" onClick={() => handleTaskRemove(index)}>
                  Remove Task
                </Button>
              </Box>
            ))
          ) : (
            <Typography>No items in this checklist</Typography>
          )}

          {/* Section to add a new task */}
          <Typography variant="h6" sx={{ marginTop: 2 }}>
            Add New Task
          </Typography>
          <TextField
            label="Task Title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            fullWidth
            sx={{ marginBottom: 1, marginTop: 1 }}
          />
          <TextField
            label="Task Description"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            fullWidth
            sx={{ marginBottom: 2 }}
          />
          <Button variant="contained" onClick={handleAddTask}>
            Add Task
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleDeleteCancel}>
        <DialogTitle>Are you sure?</DialogTitle>
        <DialogContent>
          <Typography>Do you really want to delete this checklist? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ViewEditChecklists
