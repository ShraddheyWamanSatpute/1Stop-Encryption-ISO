"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Chip,
  Grid,
} from "@mui/material"
import { CloudUpload, Delete, Edit, PictureAsPdf, Restaurant, Add } from "@mui/icons-material"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { ref as dbRef, push, set, onValue, remove } from "firebase/database"
import { db } from "../services/firebase"
import { getStorage } from "firebase/storage"

interface Menu {
  id: string
  name: string
  fileName: string
  downloadUrl: string
  uploadDate: string
  fileSize: number
}

const MenuManagement: React.FC = () => {
  const storage = getStorage()
  const [menus, setMenus] = useState<Menu[]>([])
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [menuName, setMenuName] = useState("")
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" })

  useEffect(() => {
    const menusRef = dbRef(db, "menus")
    const unsubscribe = onValue(menusRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const menuList = Object.entries(data).map(([id, menu]: [string, any]) => ({
          id,
          ...menu,
        }))
        setMenus(menuList)
      } else {
        setMenus([])
      }
    })

    return () => unsubscribe()
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
    } else {
      showSnackbar("Please select a PDF file", "error")
    }
  }

  const uploadMenu = async () => {
    if (!selectedFile || !menuName.trim()) {
      showSnackbar("Please provide a menu name and select a PDF file", "error")
      return
    }

    setLoading(true)
    try {
      const fileName = `${Date.now()}_${selectedFile.name}`
      const storageRef = ref(storage, `menus/${fileName}`)

      await uploadBytes(storageRef, selectedFile)
      const downloadUrl = await getDownloadURL(storageRef)

      const menuData = {
        name: menuName.trim(),
        fileName: selectedFile.name,
        downloadUrl,
        uploadDate: new Date().toISOString(),
        fileSize: selectedFile.size,
      }

      const menusRef = dbRef(db, "menus")
      await push(menusRef, menuData)

      showSnackbar("Menu uploaded successfully!", "success")
      setUploadDialogOpen(false)
      setSelectedFile(null)
      setMenuName("")
    } catch (error) {
      console.error("Error uploading menu:", error)
      showSnackbar("Failed to upload menu", "error")
    } finally {
      setLoading(false)
    }
  }

  const deleteMenu = async (menu: Menu) => {
    if (!window.confirm(`Are you sure you want to delete "${menu.name}"?`)) {
      return
    }

    setLoading(true)
    try {
      // Delete from storage
      const storageRef = ref(storage, `menus/${menu.fileName}`)
      await deleteObject(storageRef)

      // Delete from database
      const menuRef = dbRef(db, `menus/${menu.id}`)
      await remove(menuRef)

      showSnackbar("Menu deleted successfully!", "success")
    } catch (error) {
      console.error("Error deleting menu:", error)
      showSnackbar("Failed to delete menu", "error")
    } finally {
      setLoading(false)
    }
  }

  const editMenu = async () => {
    if (!editingMenu || !menuName.trim()) {
      showSnackbar("Please provide a menu name", "error")
      return
    }

    setLoading(true)
    try {
      const menuRef = dbRef(db, `menus/${editingMenu.id}`)
      await set(menuRef, {
        ...editingMenu,
        name: menuName.trim(),
      })

      showSnackbar("Menu updated successfully!", "success")
      setEditDialogOpen(false)
      setEditingMenu(null)
      setMenuName("")
    } catch (error) {
      console.error("Error updating menu:", error)
      showSnackbar("Failed to update menu", "error")
    } finally {
      setLoading(false)
    }
  }

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
              Menu Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Upload and manage restaurant menus
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => setUploadDialogOpen(true)} size="large">
            Upload Menu
          </Button>
        </Box>

        {/* Menus Grid */}
        {menus.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <Restaurant sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No menus uploaded yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Upload your first menu to get started
            </Typography>
            <Button variant="contained" startIcon={<CloudUpload />} onClick={() => setUploadDialogOpen(true)}>
              Upload Menu
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {menus.map((menu) => (
              <Grid item xs={12} sm={6} md={4} key={menu.id}>
                <Card elevation={2}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PictureAsPdf color="error" />
                        <Typography variant="h6" fontWeight={600} noWrap>
                          {menu.name}
                        </Typography>
                      </Box>

                      <Stack spacing={1}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {menu.fileName}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          <Chip label={formatFileSize(menu.fileSize)} size="small" variant="outlined" />
                          <Chip
                            label={new Date(menu.uploadDate).toLocaleDateString()}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Stack>
                    </Stack>
                  </CardContent>

                  <CardActions>
                    <Button size="small" href={menu.downloadUrl} target="_blank" rel="noopener noreferrer">
                      View
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingMenu(menu)
                        setMenuName(menu.name)
                        setEditDialogOpen(true)
                      }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => deleteMenu(menu)}>
                      <Delete />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload New Menu</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Menu Name"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              placeholder="e.g., Dinner Menu, Lunch Specials"
            />

            <Box>
              <input
                accept="application/pdf"
                style={{ display: "none" }}
                id="menu-file-upload"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="menu-file-upload">
                <Button variant="outlined" component="span" startIcon={<CloudUpload />} fullWidth sx={{ py: 2 }}>
                  {selectedFile ? selectedFile.name : "Select PDF File"}
                </Button>
              </label>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button onClick={uploadMenu} variant="contained" disabled={loading || !selectedFile || !menuName.trim()}>
            {loading ? "Uploading..." : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Menu</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Menu Name"
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={editMenu} variant="contained" disabled={loading || !menuName.trim()}>
            {loading ? "Updating..." : "Update"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default MenuManagement
