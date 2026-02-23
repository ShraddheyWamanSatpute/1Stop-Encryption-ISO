"use client"

import React, { useState, useMemo } from "react"
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Tooltip,
  Button,
} from "@mui/material"
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from "@mui/icons-material"
import { useStock } from "../../../backend/context/StockContext"
import CRUDModal from "../reusable/CRUDModal"
import CategoryForm from "./forms/CategoryForm"
import DataHeader from "../reusable/DataHeader"

const CategoriesManagement: React.FC = () => {
  const { state, createCategory, updateCategory, deleteCategory } = useStock()
  const { categories, subcategories, salesDivisions, dataVersion, loading } = state

  // DataHeader state
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>("asc")

  // CRUD Modal state
  const [categoryFormOpen, setCategoryFormOpen] = useState(false)
  const [selectedCategoryForForm, setSelectedCategoryForForm] = useState<any>(null)
  const [crudMode, setCrudMode] = useState<'create' | 'edit' | 'view'>('create')
  const [currentFormData, setCurrentFormData] = useState<any>(null)

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

  // DataHeader configuration
  const sortOptions = [
    { value: "name", label: "Name" },
    { value: "description", label: "Description" },
    { value: "kind", label: "Type" },
  ]

  // Normalize hex color values and provide a sensible default
  const getDisplayColor = (raw?: string, isActive: boolean = true): string => {
    if (typeof raw === "string" && raw.trim().length > 0) {
      const value = raw.trim().startsWith("#") ? raw.trim() : `#${raw.trim()}`
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) return value
    }
    return isActive !== false ? "#4caf50" : "#9e9e9e"
  }

  // Combine all category types (sales divisions, categories, subcategories)
  const allCategoryTypes = useMemo(() => {
    const combined = [
      ...(salesDivisions || []).map(item => ({ ...item, kind: 'SaleDivision' as const })),
      ...(categories || []).map(item => ({ ...item, kind: 'Category' as const })),
      ...(subcategories || []).map(item => ({ ...item, kind: 'Subcategory' as const }))
    ]
    return combined
  }, [salesDivisions, categories, subcategories, dataVersion])

  // Filter and sort all category types
  const filteredAndSortedCategories = useMemo(() => {
    if (!allCategoryTypes || !Array.isArray(allCategoryTypes)) {
      return []
    }
    
    const filtered = allCategoryTypes.filter((category) =>
      category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.kind?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a] || ""
      const bValue = b[sortBy as keyof typeof b] || ""
      
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return 0
    })
  }, [allCategoryTypes, searchTerm, sortBy, sortDirection, dataVersion])

  // DataHeader handlers
  const handleSortChange = (value: string, direction: "asc" | "desc") => {
    setSortBy(value)
    setSortDirection(direction)
  }

  const handleCreateNew = () => {
    setSelectedCategoryForForm(null)
    setCrudMode('create')
    setCategoryFormOpen(true)
  }

  const handleRefresh = async () => {
    // Categories are automatically refreshed through context
  }

  // CRUD handlers
  const handleOpenCategoryForm = (category: any = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedCategoryForForm(category)
    setCrudMode(mode)
    setCategoryFormOpen(true)
  }

  const handleCloseCategoryForm = () => {
    setCategoryFormOpen(false)
    setSelectedCategoryForForm(null)
    setCrudMode('create')
  }

  const handleSaveCategoryForm = async () => {
    try {
      // Debug: Log the category data being saved
      console.log('Saving category data:', currentFormData)
      
      if (crudMode === 'create') {
        await createCategory?.(currentFormData)
        setNotification({
          open: true,
          message: "Category created successfully",
          severity: "success"
        })
      } else if (crudMode === 'edit' && selectedCategoryForForm) {
        await updateCategory?.(selectedCategoryForForm.id, currentFormData)
        setNotification({
          open: true,
          message: "Category updated successfully",
          severity: "success"
        })
      }
      handleCloseCategoryForm()
    } catch (error) {
      setNotification({
        open: true,
        message: "Failed to save category",
        severity: "error"
      })
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return

    try {
      await deleteCategory?.(categoryId)
      setNotification({
        open: true,
        message: "Category deleted successfully",
        severity: "success"
      })
    } catch (error) {
      setNotification({
        open: true,
        message: "Failed to delete category",
        severity: "error"
      })
    }
  }

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false })
  }

  if (state.loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Loading overlay - doesn't hide content */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            bgcolor: 'info.light',
            borderRadius: 1,
            boxShadow: 2,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            Refreshing data... (v{dataVersion})
          </Typography>
        </Box>
      )}

      {/* DataHeader */}
      <DataHeader
        showDateControls={false}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search categories..."
        sortOptions={sortOptions}
        sortValue={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onRefresh={handleRefresh}
        onCreateNew={handleCreateNew}
        createButtonLabel="Create Category"
      />

      {/* Categories Grid */}
      <Grid container spacing={1} sx={{ opacity: loading ? 0.7 : 1, transition: 'opacity 0.3s' }}>
        {filteredAndSortedCategories.map((category) => {
          // Debug: Log category color information
          console.log(`Category: ${category.name}, Color: ${category.color}, Active: ${category.active}`)
          
          return (
          <Grid item xs={12} sm={6} md={3} lg={2} xl={1.5} key={category.id}>
            <Card
              onClick={() => handleOpenCategoryForm(category, 'view')}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease',
                minHeight: 90,
                position: 'relative',
                cursor: 'pointer',
                borderLeft: `4px solid ${getDisplayColor(category.color, category.active)}`,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: 2,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 0.75, pr: 4.5, '&:last-child': { pb: 0.75 } }}>
                <Typography variant="subtitle2" component="h3" sx={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.1, wordBreak: 'break-word', mb: 0.25 }}>
                  {category.name}
                </Typography>
                
                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'primary.main', mb: 0.25, display: 'block' }}>
                  {category.kind || 'Category'}
                </Typography>
                
              </CardContent>

              {/* Action Icons positioned on the right */}
              <Box sx={{ 
                position: 'absolute', 
                top: 6, 
                right: 6, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 0.02 
              }}>
                <Tooltip title="Edit Category" placement="left">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenCategoryForm(category, 'edit')
                    }}
                    sx={{ 
                      width: 28, 
                      height: 28, 
                      fontSize: '0.8rem',
                      '&:hover': { backgroundColor: 'primary.light', color: 'white' }
                    }}
                  >
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Category" placement="left">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteCategory(category.id)
                    }}
                    sx={{ 
                      width: 28, 
                      height: 28, 
                      fontSize: '0.8rem',
                      '&:hover': { backgroundColor: 'error.light', color: 'white' }
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Card>
          </Grid>
          )
        })}
      </Grid>

      {filteredAndSortedCategories.length === 0 && (
        <Paper sx={{ p: 2, textAlign: "center" }}>
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
                    handleDeleteCategory(selectedCategoryForForm.id)
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
              >
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveCategoryForm}
            >
              Create Category
            </Button>
          )
        }
      >
        <CategoryForm
          category={selectedCategoryForForm}
          mode={crudMode}
          onSave={handleSaveCategoryForm}
          onFormDataChange={setCurrentFormData}
        />
      </CRUDModal>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: "100%" }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default CategoriesManagement
