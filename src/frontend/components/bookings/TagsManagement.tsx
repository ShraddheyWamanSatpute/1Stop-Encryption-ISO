"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import {
  Box,
  Paper,
  Grid,
  Chip,
  Alert,
  Typography,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material"
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Label as LabelIcon,
  Save as SaveIcon,
} from "@mui/icons-material"
import { useBookings as useBookingsContext, BookingTag } from "../../../backend/context/BookingsContext"
import CRUDModal from "../reusable/CRUDModal"
import TagForm from "./forms/TagForm"
import DataHeader from "../reusable/DataHeader"

const TagsManagement: React.FC = () => {
  const { 
    bookingTags, 
    fetchBookingTags, 
    addBookingTag, 
    updateBookingTag,
    deleteBookingTag 
  } = useBookingsContext()

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // CRUD form states
  const [tagFormOpen, setTagFormOpen] = useState(false)
  const [tagFormMode, setTagFormMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedTagForForm, setSelectedTagForForm] = useState<BookingTag | null>(null)
  const [sortBy, setSortBy] = useState("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  
  // New UI states
  const [searchTerm, setSearchTerm] = useState("")
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedTagForMenu, setSelectedTagForMenu] = useState<BookingTag | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<BookingTag | null>(null)

  const loadTags = async () => {
    setLoading(true)
    try {
      await fetchBookingTags()
      setError(null)
    } catch (e) {
      console.error(e)
      setError("Failed to load tags")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTags()
  }, [])

  // Sort options for tags
  const sortOptions = [
    { value: "name", label: "Name" },
    { value: "createdAt", label: "Created Date" },
  ]


  // Filter and sort tags
  const filteredAndSortedTags = useMemo(() => {
    const filtered = bookingTags.filter(tag => {
      // Search filter
      const searchMatch = !searchTerm || 
        tag.name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return searchMatch
    })

    // Sort
    return filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case "name":
          aValue = a.name || ""
          bValue = b.name || ""
          break
        case "createdAt":
          aValue = new Date(a.createdAt || 0)
          bValue = new Date(b.createdAt || 0)
          break
        default:
          aValue = a.name || ""
          bValue = b.name || ""
      }
      
      if (sortBy === "createdAt") {
        const comparison = aValue.getTime() - bValue.getTime()
        return sortDirection === "asc" ? comparison : -comparison
      } else {
        const comparison = aValue.toString().localeCompare(bValue.toString())
        return sortDirection === "asc" ? comparison : -comparison
      }
    })
  }, [bookingTags, searchTerm, sortBy, sortDirection])



  const handleDeleteTag = async (tag: BookingTag) => {
    if (!tag.id || tag.isDefault) return
    setLoading(true)
    try {
      await deleteBookingTag(tag.id)
      setError(null)
    } catch (e) {
      console.error(e)
      setError("Failed to delete tag")
    } finally {
      setLoading(false)
    }
  }

  // CRUD form handlers
  const handleOpenTagForm = (tag: BookingTag | null = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedTagForForm(tag)
    setTagFormMode(mode)
    setTagFormOpen(true)
  }

  const handleCloseTagForm = () => {
    setTagFormOpen(false)
    setSelectedTagForForm(null)
  }

  // Helper function to sanitize data by removing React internal properties
  const sanitizeData = (data: any): any => {
    if (data === null || data === undefined) return data
    if (typeof data !== 'object') return data
    if (data instanceof Date) return data
    if (Array.isArray(data)) return data.map(sanitizeData)
    
    const sanitized: any = {}
    for (const key in data) {
      // Skip React internal properties and event properties
      if (key.startsWith('__react') || key === 'target' || key === 'currentTarget' || key === 'nativeEvent') {
        continue
      }
      const value = data[key]
      // Skip functions and React elements
      if (typeof value === 'function' || (value && typeof value === 'object' && value.$$typeof)) {
        continue
      }
      sanitized[key] = sanitizeData(value)
    }
    return sanitized
  }

  const handleSaveTag = async (tagData: any) => {
    try {
      // Sanitize the data to remove any React internal properties
      const sanitizedData = sanitizeData(tagData)
      
      if (tagFormMode === 'create') {
        await addBookingTag(sanitizedData)
      } else if (tagFormMode === 'edit' && selectedTagForForm?.id) {
        await updateBookingTag(selectedTagForForm.id, sanitizedData)
      }
      handleCloseTagForm()
      await loadTags()
    } catch (error) {
      console.error('Error saving tag:', error)
      setError('Failed to save tag')
    }
  }


  const handleMenuClose = () => {
    setMenuAnchorEl(null)
    setSelectedTagForMenu(null)
  }

  const handleMenuAction = (action: 'view' | 'edit' | 'delete') => {
    if (!selectedTagForMenu) return
    
    switch (action) {
      case 'view':
        handleOpenTagForm(selectedTagForMenu, 'view')
        break
      case 'edit':
        handleOpenTagForm(selectedTagForMenu, 'edit')
        break
      case 'delete':
        setTagToDelete(selectedTagForMenu)
        setDeleteDialogOpen(true)
        break
    }
    
    handleMenuClose()
  }

  const handleConfirmDelete = async () => {
    if (tagToDelete) {
      await handleDeleteTag(tagToDelete)
      setDeleteDialogOpen(false)
      setTagToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false)
    setTagToDelete(null)
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", padding: 0 }}>
      {/* Header */}
      <DataHeader
        showDateControls={false}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search tags by name..."
        filters={[]}
        filtersExpanded={false}
        onFiltersToggle={() => {}}
        sortOptions={sortOptions}
        sortValue={sortBy}
        sortDirection={sortDirection}
        onSortChange={(value, direction) => {
          setSortBy(value)
          setSortDirection(direction)
        }}
        onCreateNew={() => handleOpenTagForm(null, 'create')}
        createButtonLabel="Create Tag"
        additionalButtons={[]}
      />


      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, mx: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Tags Content */}
      {!loading && (
        <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
          {filteredAndSortedTags.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <LabelIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No tags found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm 
                  ? "Try adjusting your search criteria."
                  : "Create your first tag to get started."
                }
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenTagForm(null, 'create')}
              >
                Create First Tag
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={1}>
              {filteredAndSortedTags.map((tag: BookingTag) => (
                <Grid item xs={12} sm={6} md={3} lg={2} xl={1.5} key={tag.id || tag.name}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease',
                      minHeight: 90,
                      position: 'relative',
                      borderLeft: `4px solid ${tag.color || '#4caf50'}`,
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: 2,
                      },
                    }}
                    onClick={() => handleOpenTagForm(tag, 'view')}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 0.75, pr: 4.5, '&:last-child': { pb: 0.75 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.25 }}>
                        <LabelIcon color="primary" sx={{ mr: 0.5, fontSize: 14 }} />
                        <Typography variant="subtitle2" component="h3" sx={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.1, wordBreak: 'break-word' }}>
                          {tag.name}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, mb: 0.25 }}>
                        {tag.isDefault && (
                          <Chip
                            label="Priority"
                            size="small"
                            color="primary"
                            variant="filled"
                            sx={{ fontSize: '0.6rem', height: 16 }}
                          />
                        )}
                      </Box>
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
                      <Tooltip title="Edit Tag" placement="left">
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenTagForm(tag, 'edit')
                            }}
                            disabled={tag.isDefault}
                            sx={{ 
                              width: 28, 
                              height: 28, 
                              fontSize: '0.8rem',
                              '&:hover': { backgroundColor: 'primary.light', color: 'white' }
                            }}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete Tag" placement="left">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation()
                              setTagToDelete(tag)
                              setDeleteDialogOpen(true)
                            }}
                            disabled={tag.isDefault}
                            sx={{ 
                              width: 28, 
                              height: 28, 
                              fontSize: '0.8rem',
                              '&:hover': { backgroundColor: 'error.light', color: 'white' }
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleMenuAction('view')}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('edit')} disabled={selectedTagForMenu?.isDefault}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Tag</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => handleMenuAction('delete')} 
          disabled={selectedTagForMenu?.isDefault}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Delete Tag</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete Tag</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the tag "{tagToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* CRUD Modal */}
      <CRUDModal
        open={tagFormOpen}
        onClose={handleCloseTagForm}
        title={tagFormMode === 'create' ? 'Create Tag' : tagFormMode === 'edit' ? 'Edit Tag' : 'View Tag'}
        mode={tagFormMode}
        onSave={handleSaveTag}
        hideDefaultActions={true}
        actions={
          tagFormMode === 'view' ? (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setTagFormMode('edit')}
            >
              Edit
            </Button>
          ) : tagFormMode === 'edit' ? (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  if (selectedTagForForm && window.confirm('Are you sure you want to delete this tag?')) {
                    handleDeleteTag(selectedTagForForm)
                    handleCloseTagForm()
                  }
                }}
              >
                Delete
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveTag}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveTag}
            >
              Create Tag
            </Button>
          )
        }
      >
        <TagForm
          tag={selectedTagForForm}
          mode={tagFormMode}
          onSave={handleSaveTag}
        />
      </CRUDModal>
    </Box>
  )
}

export default TagsManagement


