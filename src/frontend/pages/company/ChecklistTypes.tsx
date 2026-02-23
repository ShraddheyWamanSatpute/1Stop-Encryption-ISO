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
  TextField,
  Alert,
  LinearProgress,
  Paper,
  Tooltip,
  CircularProgress,
  Snackbar,
} from "@mui/material"
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material"
import { useState, useEffect, useMemo } from "react"
import { useCompany } from "../../../backend/context/CompanyContext"
import {
  fetchChecklistTypes,
  saveChecklistType,
  deleteChecklistType,
} from "../../../backend/functions/Company"
import CRUDModal from "../../components/reusable/CRUDModal"
import DataHeader from "../../components/reusable/DataHeader"
import RequireCompanyContext from "../../components/global/RequireCompanyContext"

const ChecklistTypesPage: React.FC = () => {
  const { state: companyState } = useCompany()
  const [checklistCategories, setChecklistCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>("asc")

  // CRUD Modal state
  const [categoryFormOpen, setCategoryFormOpen] = useState(false)
  const [selectedCategoryForForm, setSelectedCategoryForForm] = useState<string | null>(null)
  const [crudMode, setCrudMode] = useState<'create' | 'edit' | 'view'>('create')
  const [categoryName, setCategoryName] = useState("")

  // Notification state
  const [notification, setNotification] = useState<{
    open: boolean
    message: string
    severity: "success" | "error" | "warning" | "info"
  }>({
    open: false,
    message: "",
    severity: "success"
  })

  const defaultCategories = ["Safety", "Maintenance", "Quality", "Operations", "Compliance", "Training"]

  useEffect(() => {
    loadChecklistCategories()
  }, [companyState.companyID])

  const loadChecklistCategories = async () => {
    if (!companyState.companyID) return
    try {
      setLoading(true)
      const categories = await fetchChecklistTypes(companyState.companyID)
      setChecklistCategories(categories)
    } catch (err) {
      console.error("Error loading checklist categories:", err)
      setError("Failed to load checklist categories")
      setChecklistCategories(defaultCategories)
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort categories
  const filteredAndSortedCategories = useMemo(() => {
    let categories = [...checklistCategories]
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      categories = categories.filter(cat => cat.toLowerCase().includes(search))
    }
    
    // Sort
    categories.sort((a, b) => {
      const comparison = a.localeCompare(b)
      return sortDirection === "asc" ? comparison : -comparison
    })
    
    return categories
  }, [checklistCategories, searchTerm, sortBy, sortDirection])

  // CRUD handlers
  const handleOpenCategoryForm = (category: string | null = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedCategoryForForm(category)
    setCrudMode(mode)
    setCategoryName(category || "")
    setCategoryFormOpen(true)
  }

  const handleCloseCategoryForm = () => {
    setCategoryFormOpen(false)
    setSelectedCategoryForForm(null)
    setCrudMode('create')
    setCategoryName("")
  }

  const handleSaveCategoryForm = async () => {
    if (!companyState.companyID || !categoryName.trim()) {
      setNotification({
        open: true,
        message: "Category name is required",
        severity: "error"
      })
      return
    }

    const trimmedCategory = categoryName.trim()
    if (checklistCategories.includes(trimmedCategory) && crudMode === 'create') {
      setNotification({
        open: true,
        message: "This category already exists",
        severity: "error"
      })
      return
    }

    try {
      setLoading(true)
      await saveChecklistType(companyState.companyID, trimmedCategory)
      await loadChecklistCategories()
      handleCloseCategoryForm()
      setNotification({
        open: true,
        message: crudMode === 'create' ? "Category created successfully" : "Category updated successfully",
        severity: "success"
      })
    } catch (err) {
      console.error("Error saving checklist category:", err)
      setNotification({
        open: true,
        message: "Failed to save checklist category",
        severity: "error"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (category: string) => {
    if (!companyState.companyID || !category) return
    if (defaultCategories.includes(category)) {
      setNotification({
        open: true,
        message: "Default categories cannot be deleted",
        severity: "warning"
      })
      return
    }

    if (!window.confirm(`Are you sure you want to delete the category "${category}"?`)) return

    try {
      setLoading(true)
      await deleteChecklistType(companyState.companyID, category)
      await loadChecklistCategories()
      setNotification({
        open: true,
        message: "Category deleted successfully",
        severity: "success"
      })
    } catch (err: any) {
      console.error("Error deleting checklist category:", err)
      setNotification({
        open: true,
        message: err.message || "Failed to delete checklist category",
        severity: "error"
      })
    } finally {
      setLoading(false)
    }
  }

  const customCategories = checklistCategories.filter((category) => !defaultCategories.includes(category))
  const allCategories = [...defaultCategories, ...customCategories]

  const sortOptions = [
    { value: "name", label: "Name" },
  ]

  return (
    <RequireCompanyContext>
    <Box sx={{ p: 0 }}>
      <DataHeader
        onRefresh={loadChecklistCategories}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search categories..."
        showDateControls={false}
        sortOptions={sortOptions}
        sortValue={sortBy}
        sortDirection={sortDirection}
        onSortChange={(value, direction) => {
          setSortBy(value)
          setSortDirection(direction)
        }}
        onCreateNew={() => handleOpenCategoryForm(null, 'create')}
        createButtonLabel="Create Category"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, mx: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && allCategories.length === 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      <Grid container spacing={2} sx={{ p: 2 }}>
        {filteredAndSortedCategories.map((category) => {
          const isDefault = defaultCategories.includes(category)
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={category}>
              <Card 
                variant="outlined" 
                sx={{ 
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.2s",
                  "&:hover": {
                    boxShadow: 2,
                    transform: "translateY(-2px)"
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      {category}
                    </Typography>
                    {isDefault && (
                      <Chip label="Default" size="small" color="primary" sx={{ height: 20, fontSize: "0.65rem" }} />
                    )}
                  </Box>
                </CardContent>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5, p: 1, pt: 0 }}>
                  <Tooltip title="View">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenCategoryForm(category, 'view')}
                      sx={{ p: 0.5 }}
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {!isDefault && (
                    <>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenCategoryForm(category, 'edit')}
                          sx={{ p: 0.5 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteCategory(category)}
                          color="error"
                          sx={{ p: 0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Box>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {filteredAndSortedCategories.length === 0 && (
        <Paper sx={{ p: 2, textAlign: "center", mx: 2 }}>
          <Typography variant="body1" color="text.secondary">
            No categories found. Click 'Create Category' to create your first category.
          </Typography>
        </Paper>
      )}

      {/* CRUD Modal */}
      <CRUDModal
        open={categoryFormOpen}
        onClose={handleCloseCategoryForm}
        title={crudMode === 'create' ? 'Create Category' : crudMode === 'edit' ? 'Edit Category' : 'View Category'}
        mode={crudMode}
        onSave={handleSaveCategoryForm}
        hideDefaultActions={true}
        actions={
          crudMode === 'view' ? (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setCrudMode('edit')}
            >
              Edit
            </Button>
          ) : crudMode === 'edit' ? (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  if (selectedCategoryForForm && window.confirm('Are you sure you want to delete this category?')) {
                    handleDeleteCategory(selectedCategoryForForm)
                    handleCloseCategoryForm()
                  }
                }}
              >
                Delete
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveCategoryForm}
                disabled={loading}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveCategoryForm}
              disabled={loading}
            >
              Create Category
            </Button>
          )
        }
      >
        <TextField
          autoFocus
          fullWidth
          size="small"
          label="Category Name"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          disabled={crudMode === 'view'}
          required
          placeholder="e.g., Safety, Maintenance, Quality"
        />
        {crudMode === 'view' && selectedCategoryForForm && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {defaultCategories.includes(selectedCategoryForForm) 
              ? "This is a default category and cannot be modified or deleted."
              : "This is a custom category that can be edited or deleted."}
          </Alert>
        )}
      </CRUDModal>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity} 
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
    </RequireCompanyContext>
  )
}

export default ChecklistTypesPage

