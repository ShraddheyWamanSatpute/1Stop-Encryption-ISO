"use client"

import type React from "react"
import { useState } from "react"
import {
  Box,
  Typography,
  Button,
  Paper,
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
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  ColorLens as ColorLensIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
} from "@mui/icons-material"
// All operations now come from POSContext
import { useStock } from "../../../backend/context/StockContext"
import { useCompany } from "../../../backend/context/CompanyContext"
import DataHeader from "../reusable/DataHeader"

// Enhanced category interface with color field
interface EnhancedCategory {
  id?: string
  name: string
  description?: string
  kind: "SaleDivision" | "Category" | "Subcategory"
  salesDivisionId?: string
  parentCategoryId?: string
  color?: string
  active?: boolean
}

// Color options for categories
const colorOptions = [
  { value: "#f44336", label: "Red" },
  { value: "#e91e63", label: "Pink" },
  { value: "#9c27b0", label: "Purple" },
  { value: "#673ab7", label: "Deep Purple" },
  { value: "#3f51b5", label: "Indigo" },
  { value: "#2196f3", label: "Blue" },
  { value: "#03a9f4", label: "Light Blue" },
  { value: "#00bcd4", label: "Cyan" },
  { value: "#009688", label: "Teal" },
  { value: "#4caf50", label: "Green" },
  { value: "#8bc34a", label: "Light Green" },
  { value: "#cddc39", label: "Lime" },
  { value: "#ffeb3b", label: "Yellow" },
  { value: "#ffc107", label: "Amber" },
  { value: "#ff9800", label: "Orange" },
  { value: "#ff5722", label: "Deep Orange" },
  { value: "#795548", label: "Brown" },
  { value: "#607d8b", label: "Blue Grey" },
]

const CategoryManagement: React.FC = () => {
  // Use Stock context for category management
  const { state: stockState, refreshAll, createCategory, updateCategory, deleteCategory } = useStock()
  const { state: companyState } = useCompany()
  const { salesDivisions, categories, subcategories } = stockState

  // State variables
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedView, setSelectedView] = useState<"all" | "divisions" | "categories" | "subcategories">("all")
  
  // DataHeader state
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>("asc")

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<EnhancedCategory | null>(null)
  const [formData, setFormData] = useState<EnhancedCategory>({
    name: "",
    description: "",
    kind: "SaleDivision",
    color: "#2196f3",
    active: true,
  })

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number
    mouseY: number
    category: EnhancedCategory
  } | null>(null)

  // Transform stock data to enhanced categories
  const getAllCategories = (): EnhancedCategory[] => {
    const allCategories: EnhancedCategory[] = []

    // Add sales divisions
    salesDivisions.forEach((division: any) => {
      allCategories.push({
        id: division.id,
        name: division.name,
        description: division.description || "",
        kind: "SaleDivision",
         color: division.color || "#2196f3",
        active: division.active !== false,
      })
    })

    // Add categories
    categories.forEach((category: any) => {
      allCategories.push({
        id: category.id,
        name: category.name,
        description: category.description || "",
        kind: "Category",
        salesDivisionId: category.salesDivisionId,
         color: category.color || "#4caf50",
        active: category.active !== false,
      })
    })

    // Add subcategories
    subcategories.forEach((subcategory: any) => {
      allCategories.push({
        id: subcategory.id,
        name: subcategory.name,
        description: subcategory.description || "",
        kind: "Subcategory",
        parentCategoryId: subcategory.parentCategoryId,
         color: subcategory.color || "#ff9800",
        active: subcategory.active !== false,
      })
    })

    return allCategories
  }

  // Filter categories based on search and view
  const filteredCategories = getAllCategories().filter((category) => {
    // Filter by search term
    if (searchTerm && !category.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Filter by view
    switch (selectedView) {
      case "divisions":
        return category.kind === "SaleDivision"
      case "categories":
        return category.kind === "Category"
      case "subcategories":
        return category.kind === "Subcategory"
      default:
        return true
    }
  })

  const showNotification = (message: string, type: "success" | "error") => {
    if (type === "success") {
      setSuccess(message)
      setError(null)
    } else {
      setError(message)
      setSuccess(null)
    }

    // Clear notification after 5 seconds
    setTimeout(() => {
      setSuccess(null)
      setError(null)
    }, 5000)
  }

  const handleOpenDialog = (category?: EnhancedCategory) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        description: category.description || "",
        kind: category.kind,
        salesDivisionId: category.salesDivisionId || "",
        parentCategoryId: category.parentCategoryId || "",
        color: category.color || "#2196f3",
        active: category.active !== false,
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: "",
        description: "",
        kind: "SaleDivision",
        salesDivisionId: "",
        parentCategoryId: "",
        color: "#2196f3",
        active: true,
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingCategory(null)
    setError(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!companyState.companyID || !companyState.selectedSiteID) return

    if (!formData.name.trim()) {
      showNotification("Category name is required", "error")
      return
    }

    setLoading(true)
    try {
      // Prepare category data with color field
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || "",
        kind: formData.kind,
        color: formData.color,
        active: formData.active,
        ...(formData.kind === "Category" &&
          formData.salesDivisionId && { salesDivisionId: formData.salesDivisionId }),
        ...(formData.kind === "Subcategory" &&
          formData.parentCategoryId && { parentCategoryId: formData.parentCategoryId }),
      }

      // Use Stock context functions
      if (editingCategory && editingCategory.id) {
        // Update existing category
        if (updateCategory) {
          await updateCategory(editingCategory.id, categoryData)
          showNotification("Category updated successfully", "success")
        } else {
          showNotification("Update function not available", "error")
        }
      } else {
        // Create new category
        if (createCategory) {
          await createCategory(categoryData)
          showNotification("Category created successfully", "success")
        } else {
          showNotification("Create function not available", "error")
        }
      }

      handleCloseDialog()
      // Refresh data without full page reload
      try { await refreshAll() } catch {}
    } catch (err) {
      console.error("Error saving category:", err)
      showNotification("Failed to save category", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!companyState.companyID || !companyState.selectedSiteID) return

    if (!window.confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      return
    }

    setLoading(true)
    try {
      // Delete category using Stock context
      if (deleteCategory) {
        await deleteCategory(categoryId)
        showNotification("Category deleted successfully", "success")
        // Refresh data without full page reload
        try { await refreshAll() } catch {}
      } else {
        showNotification("Delete function not available", "error")
      }
    } catch (err) {
      console.error("Error deleting category:", err)
      showNotification("Failed to delete category", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleContextMenu = (event: React.MouseEvent, category: EnhancedCategory) => {
    event.preventDefault()
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      category,
    })
  }

  const handleContextMenuClose = () => {
    setContextMenu(null)
  }

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case "SaleDivision":
        return <FolderIcon />
      case "Category":
        return <FolderOpenIcon />
      case "Subcategory":
        return <CategoryIcon />
      default:
        return <CategoryIcon />
    }
  }

  const getKindLabel = (kind: string) => {
    switch (kind) {
      case "SaleDivision":
        return "Sales Division"
      case "Category":
        return "Category"
      case "Subcategory":
        return "Subcategory"
      default:
        return kind
    }
  }

  const getParentName = (category: EnhancedCategory) => {
    if (category.kind === "Category" && category.salesDivisionId) {
      const parent = salesDivisions.find((d: any) => d.id === category.salesDivisionId)
      return parent?.name || "Unknown Division"
    }
    if (category.kind === "Subcategory" && category.parentCategoryId) {
      const parent = categories.find((c: any) => c.id === category.parentCategoryId)
      return parent?.name || "Unknown Category"
    }
    return "-"
  }

  // DataHeader sort options
  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'kind', label: 'Type' },
    { value: 'active', label: 'Status' }
  ];

  // DataHeader handlers
  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSortBy(field);
    setSortDirection(direction);
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting categories as ${format}`);
    // Export functionality would be implemented here
    // For now, just log the action
  };

  return (
    <Box sx={{ p: 0 }}>
      <DataHeader
        title="Category Management"
        showDateControls={false}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search categories..."
        sortOptions={sortOptions}
        sortValue={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onExportCSV={() => handleExport('csv')}
        onCreateNew={() => handleOpenDialog()}
        createButtonLabel="Create Category"
        additionalControls={
          <FormControl key="view" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>View</InputLabel>
            <Select value={selectedView} label="View" onChange={(e) => setSelectedView(e.target.value as any)}>
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="divisions">Sales Divisions</MenuItem>
              <MenuItem value="categories">Categories</MenuItem>
              <MenuItem value="subcategories">Subcategories</MenuItem>
            </Select>
          </FormControl>
        }
      />

      {/* Notifications */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Categories Grid */}
      <Grid container spacing={2}>
        {filteredCategories.map((category) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={category.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.2s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 2,
                },
                borderRadius: 2,
                overflow: "hidden",
                border: `2px solid ${category.color}`,
              }}
              elevation={1}
              onContextMenu={(e) => handleContextMenu(e, category)}
            >
              <CardContent sx={{ p: 2, pb: 1, flexGrow: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      bgcolor: category.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 1,
                       color: "primary.contrastText",
                    }}
                  >
                    {getKindIcon(category.kind)}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="medium" noWrap>
                      {category.name}
                    </Typography>
                    <Chip
                      label={getKindLabel(category.kind)}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.7rem",
                        bgcolor: category.color,
                        color: "white",
                      }}
                    />
                  </Box>
                </Box>

                {category.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {category.description}
                  </Typography>
                )}

                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Parent: {getParentName(category)}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={category.active ? "Active" : "Inactive"}
                      size="small"
                      color={category.active ? "success" : "default"}
                      sx={{ height: 20, fontSize: "0.7rem" }}
                    />
                  </Box>
                </Box>
              </CardContent>

              <CardActions sx={{ p: 1, pt: 0, justifyContent: "space-between" }}>
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenDialog(category)}
                  sx={{ color: "text.secondary" }}
                  size="small"
                >
                  Edit
                </Button>
                <Box>
                  <Tooltip title="Color">
                    <IconButton size="small" sx={{ color: category.color }}>
                      <ColorLensIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => category.id && handleDelete(category.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {filteredCategories.length === 0 && !loading && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: "center", borderRadius: 2 }}>
              <Typography variant="body1" color="text.secondary">
                {searchTerm
                  ? "No categories match your search criteria."
                  : "No categories found. Click 'Add Category' to create your first category."}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Category Form Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Category Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
                error={!formData.name.trim()}
                helperText={!formData.name.trim() ? "Category name is required" : ""}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={formData.description || ""}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select name="kind" value={formData.kind} label="Type" onChange={handleSelectChange}>
                  <MenuItem value="SaleDivision">Sales Division</MenuItem>
                  <MenuItem value="Category">Category</MenuItem>
                  <MenuItem value="Subcategory">Subcategory</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Color</InputLabel>
                <Select
                  name="color"
                  value={formData.color || "#2196f3"}
                  label="Color"
                  onChange={handleSelectChange}
                  renderValue={(value) => (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: 1,
                          bgcolor: value,
                          border: "1px solid #ccc",
                        }}
                      />
                      {colorOptions.find((c) => c.value === value)?.label || "Custom"}
                    </Box>
                  )}
                >
                  {colorOptions.map((color) => (
                    <MenuItem key={color.value} value={color.value}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: 1,
                            bgcolor: color.value,
                            border: "1px solid #ccc",
                          }}
                        />
                        {color.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Parent selection based on type */}
            {formData.kind === "Category" && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Parent Sales Division</InputLabel>
                  <Select
                    name="salesDivisionId"
                    value={formData.salesDivisionId || ""}
                    label="Parent Sales Division"
                    onChange={handleSelectChange}
                    required
                  >
                    {salesDivisions.map((division: any) => (
                      <MenuItem key={division.id} value={division.id}>
                        {division.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {formData.kind === "Subcategory" && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Parent Category</InputLabel>
                  <Select
                    name="parentCategoryId"
                    value={formData.parentCategoryId || ""}
                    label="Parent Category"
                    onChange={handleSelectChange}
                    required
                  >
                    {categories.map((category: any) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="active"
                  value={formData.active ? "active" : "inactive"}
                  label="Status"
                  onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.value === "active" }))}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading || !formData.name.trim()}
            sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
          >
            {loading ? <CircularProgress size={20} /> : editingCategory ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
      >
        <MenuItem
          onClick={() => {
            if (contextMenu) {
              handleOpenDialog(contextMenu.category)
              handleContextMenuClose()
            }
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Category</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (contextMenu) {
              handleDelete(contextMenu.category.id!)
              handleContextMenuClose()
            }
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: "error.main" }}>Delete Category</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default CategoryManagement
