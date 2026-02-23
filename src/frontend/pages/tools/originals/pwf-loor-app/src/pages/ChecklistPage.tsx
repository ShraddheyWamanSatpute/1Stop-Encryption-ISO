"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Box, Typography, Button, TextField, Select, MenuItem, FormControl, InputLabel } from "@mui/material"
import { ref, set, push, get } from "firebase/database"
import { db } from "../services/firebase"
import { useLogIn } from "../context/LogInContext"
import { useRole } from "../context/RoleContext"
import ViewEditChecklists from "./ViewEditChecklists" // Import the View/Edit Checklists component
import SignOffTracking from "./SignOffTracking" // Import the SignOffTracking component
import { Page } from "../styles/StyledComponents"

export interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  completedBy: string | null
  completedAt: string | null
}

export interface Checklist {
  id: string
  title: string
  assignedRole: string
  items: ChecklistItem[]
  createdBy: string
}

const ChecklistPage: React.FC = () => {
  const { state: userState } = useLogIn()
  const { state: roleState } = useRole()

  const [currentPage, setCurrentPage] = useState<"create" | "view" | "signOff">("create") // Page switching state
  const [newTitle, setNewTitle] = useState("")
  const [assignedRole, setAssignedRole] = useState("")
  const [newItemTitle, setNewItemTitle] = useState("")
  const [newItemDescription, setNewItemDescription] = useState("")
  const [newChecklistItems, setNewChecklistItems] = useState<ChecklistItem[]>([])
  const [, setChecklists] = useState<Checklist[]>([]) // Declare checklists state
  const [, setLoading] = useState(false)
  const [, setError] = useState<string | null>(null)

  // Fetch existing checklists from Firebase
  useEffect(() => {
    fetchChecklists()
  }, [])

  const fetchChecklists = async () => {
    setLoading(true)
    setError(null)
    try {
      const checklistsRef = ref(db, "checklists")
      const snapshot = await get(checklistsRef)

      if (snapshot.exists()) {
        const data = snapshot.val()
        const checklistsArray = Object.entries(data).map(([key, value]) => {
          if (typeof value === "object" && value !== null && "items" in value) {
            return {
              id: key,
              ...value,
              items: Array.isArray(value.items) ? value.items : [],
            }
          }
          return {
            id: key,
            items: [],
          }
        }) as Checklist[]

        // Filter checklists based on role (for Managers only)
        setChecklists(
          roleState.role === "Manager"
            ? checklistsArray
            : checklistsArray.filter((item) => item.assignedRole === roleState.role),
        )
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

  // Create a new checklist
  const createChecklist = async () => {
    if (!newTitle || !assignedRole || newChecklistItems.length === 0) {
      setError("Please provide a title, assign a role, and add at least one item.")
      return
    }

    const newChecklist: Checklist = {
      id: push(ref(db, "checklists")).key || "",
      title: newTitle,
      assignedRole: assignedRole,
      items: newChecklistItems,
      createdBy: userState.firstName || "Unknown",
    }

    try {
      await set(ref(db, `checklists/${newChecklist.id}`), newChecklist)
      fetchChecklists() // Refresh the checklist list
      setNewTitle("")
      setAssignedRole("")
      setNewChecklistItems([])
    } catch (err) {
      console.error("Error creating checklist:", err)
      setError("Failed to create checklist")
    }
  }

  // Update a new checklist item (for creation)
  const handleNewItemChange = (index: number, field: keyof ChecklistItem, value: string) => {
    const updatedItems = [...newChecklistItems]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    }
    setNewChecklistItems(updatedItems)
  }

  // Add a checklist item
  const handleAddItem = () => {
    if (newItemTitle && newItemDescription) {
      const newItem: ChecklistItem = {
        id: push(ref(db, "checklists")).key || "",
        title: newItemTitle,
        description: newItemDescription,
        completed: false,
        completedBy: null,
        completedAt: null,
      }
      setNewChecklistItems([...newChecklistItems, newItem])
      setNewItemTitle("")
      setNewItemDescription("")
    }
  }

  // Remove an item from the new checklist items array
  const handleRemoveNewItem = (itemId: string) => {
    setNewChecklistItems(newChecklistItems.filter((item) => item.id !== itemId))
  }

  return (
    <Page>
      <Box sx={{ marginBottom: 2 }}>
        <Button variant="outlined" onClick={() => setCurrentPage("create")}>
          Create Checklist
        </Button>
        <Button variant="outlined" onClick={() => setCurrentPage("view")}>
          View & Edit Checklists
        </Button>
        <Button variant="outlined" onClick={() => setCurrentPage("signOff")}>
          Track Sign-offs
        </Button>
      </Box>

      {/* Conditional rendering of pages based on currentPage */}
      {currentPage === "create" && (
        <Box sx={{ marginBottom: 2 }}>
          {/* Form to create a checklist */}
          <Typography variant="h6">Create New Checklist</Typography>
          <TextField
            label="Checklist Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            fullWidth
            sx={{ marginBottom: 2 }}
          />
          <FormControl fullWidth sx={{ marginBottom: 2 }}>
            <InputLabel>Assign Role</InputLabel>
            <Select value={assignedRole} onChange={(e) => setAssignedRole(e.target.value)} label="Assign Role">
              <MenuItem value="Manager">Manager</MenuItem>
              <MenuItem value="Waiter">Waiter</MenuItem>
              <MenuItem value="Host">Host</MenuItem>
              <MenuItem value="Maintenance">Maintenance</MenuItem>
              <MenuItem value="Bar Back">Bar Back</MenuItem>
            </Select>
          </FormControl>
          {/* Form to add checklist items */}
          <Typography variant="h6">Add Checklist Items</Typography>
          {newChecklistItems.map((item, index) => (
            <Box key={item.id} sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
              <TextField
                label="Item Title"
                value={item.title}
                onChange={(e) => handleNewItemChange(index, "title", e.target.value)}
                sx={{ marginRight: 2 }}
              />
              <TextField
                label="Item Description"
                value={item.description}
                onChange={(e) => handleNewItemChange(index, "description", e.target.value)}
                sx={{ marginRight: 2 }}
              />
              <Button variant="outlined" color="error" onClick={() => handleRemoveNewItem(item.id)}>
                Remove
              </Button>
            </Box>
          ))}
          <Button variant="outlined" onClick={handleAddItem}>
            Add Item
          </Button>
          <Button variant="contained" onClick={createChecklist}>
            Create Checklist
          </Button>
        </Box>
      )}

      {currentPage === "view" && <ViewEditChecklists role={roleState.role || "Unknown"} />}
      {currentPage === "signOff" && <SignOffTracking />}
    </Page>
  )
}

export default ChecklistPage
