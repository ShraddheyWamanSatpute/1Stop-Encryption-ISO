"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  Tooltip
} from "@mui/material"
import CRUDModal from "../reusable/CRUDModal"
import BookingTypeForm from "./forms/BookingTypeForm"
import { SelectChangeEvent } from "@mui/material/Select"
import { Edit as EditIcon, Delete as DeleteIcon, ColorLens as ColorLensIcon, Event as EventIcon, Save as SaveIcon } from "@mui/icons-material"
import { useBookings as useBookingsContext, BookingType } from "../../../backend/context/BookingsContext"
import DataHeader from "../reusable/DataHeader"

/**
 * BookingTypesManagement Component
 * 
 * This component displays and manages booking types for the application.
 * It has been simplified to fix TypeScript errors.
 */

// Color options for booking types
const COLOR_OPTIONS = [
  '#4caf50', // Green
  '#2196f3', // Blue
  '#f44336', // Red
  '#ff9800', // Orange
  '#9c27b0', // Purple
  '#00bcd4', // Cyan
  '#795548', // Brown
  '#607d8b', // Blue Grey
  '#e91e63', // Pink
  '#673ab7'  // Deep Purple
]

const BookingTypesManagement = (): React.ReactNode => {
  const { 
    bookingTypes: contextBookingTypes,
    loading,
    fetchBookingTypes,
    addBookingType,
    updateBookingType,
    deleteBookingType
  } = useBookingsContext()

  // State
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedBookingType, setSelectedBookingType] = useState<BookingType | null>(null)
  const [formData, setFormData] = useState<Partial<BookingType>>({
    name: "",
    description: "",
    color: "#4caf50",
    defaultDuration: 60,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  const [isLoading, setIsLoading] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [typeToDelete, setTypeToDelete] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Booking type form states
  const [typeFormOpen, setTypeFormOpen] = useState(false)
  const [typeFormMode, setTypeFormMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedTypeForForm, setSelectedTypeForForm] = useState<BookingType | null>(null)
  
  // Load booking types on component mount
  useEffect(() => {
    const loadBookingTypes = async () => {
      try {
        await fetchBookingTypes()
      } catch (error) {
        console.error("Error loading booking types:", error)
        setError("Failed to load booking types")
      }
    }
    
    loadBookingTypes()
  }, [fetchBookingTypes])
  
  // Sort options for booking types
  const sortOptions = [
    { value: "name", label: "Name" },
    { value: "createdAt", label: "Created Date" },
  ]

  // Filter and sort booking types
  const sortedBookingTypes = useMemo(() => {
    return [...(contextBookingTypes || [])].sort((a, b) => {
      let aValue: string | number | Date = ""
      let bValue: string | number | Date = ""

      switch (sortBy) {
        case "name":
          aValue = a.name || ""
          bValue = b.name || ""
          break
        case "createdAt":
          aValue = a.createdAt ? new Date(a.createdAt) : new Date(0)
          bValue = b.createdAt ? new Date(b.createdAt) : new Date(0)
          break
        default:
          aValue = a.name || ""
          bValue = b.name || ""
      }

      if (sortBy === "createdAt" && aValue instanceof Date && bValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime()
        return sortDirection === "asc" ? comparison : -comparison
      } else {
        const comparison = aValue.toString().localeCompare(bValue.toString())
        return sortDirection === "asc" ? comparison : -comparison
      }
    })
  }, [contextBookingTypes, sortBy, sortDirection])
  
  // Reset form when selected booking type changes
  useEffect(() => {
    if (selectedBookingType) {
      setFormData({
        ...selectedBookingType,
        updatedAt: new Date().toISOString()
      })
    } else {
      setFormData({
        name: "",
        description: "",
        color: "#4caf50",
        defaultDuration: 60,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
  }, [selectedBookingType])
  
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedBookingType(null)
    setError(null)
  }
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Handle select change
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Handle switch change
  const handleSwitchChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [name]: e.target.checked
    }))
  }
  
  
  // Handle delete confirmation dialog
  const handleDelete = (id: string) => {
    setTypeToDelete(id)
    setDeleteConfirmOpen(true)
  }
  
  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!typeToDelete) return
    
    try {
      setIsLoading(true)
      await deleteBookingType(typeToDelete)
      setSuccess("Booking type deleted successfully")
      setDeleteConfirmOpen(false)
      setTypeToDelete(null)
      // Refresh booking types
      await fetchBookingTypes()
    } catch (error) {
      console.error("Error deleting booking type:", error)
      setError("Failed to delete booking type")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle save
  const handleSave = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (selectedBookingType?.id) {
        // Update existing booking type
        await updateBookingType(selectedBookingType.id, formData)
        setSuccess("Booking type updated successfully")
      } else {
        // Add new booking type
        // Ensure all required fields are present for BookingType
        const newBookingType: Omit<BookingType, "id"> = {
          name: formData.name || "",
          description: formData.description || "",
          color: formData.color || "#4caf50",
          defaultDuration: formData.defaultDuration || 60,
          active: formData.active !== false,
          createdAt: formData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Add required properties from BookingType interface
          minAdvanceHours: formData.minAdvanceHours || 1,
          maxAdvanceDays: formData.maxAdvanceDays || 30,
          depositType: formData.depositType || "none",
          availableDays: formData.availableDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          availableTimeSlots: formData.availableTimeSlots || ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"]
        }
        await addBookingType(newBookingType)
        setSuccess("Booking type created successfully")
      }
      
      setIsDialogOpen(false)
      setSelectedBookingType(null)
      // Refresh booking types
      await fetchBookingTypes()
    } catch (error) {
      console.error("Error saving booking type:", error)
      setError("Failed to save booking type")
    } finally {
      setIsLoading(false)
    }
  }

  // New CRUD form handlers
  const handleOpenTypeForm = (bookingType: BookingType | null = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedTypeForForm(bookingType)
    setTypeFormMode(mode)
    setTypeFormOpen(true)
  }

  const handleCloseTypeForm = () => {
    setTypeFormOpen(false)
    setSelectedTypeForForm(null)
    setTypeFormMode('create')
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

  const handleSaveType = async (typeData: any) => {
    try {
      // Sanitize the data to remove any React internal properties
      const sanitizedData = sanitizeData(typeData)
      
      if (typeFormMode === 'create') {
        await addBookingType(sanitizedData)
        setSuccess("Booking type created successfully")
      } else if (typeFormMode === 'edit') {
        await updateBookingType(selectedTypeForForm!.id, sanitizedData)
        setSuccess("Booking type updated successfully")
      }
      
      handleCloseTypeForm()
      await fetchBookingTypes()
    } catch (error) {
      console.error('Error saving booking type:', error)
      setError("Failed to save booking type")
    }
  }
  
  return (
    <Box >
      <Box sx={{ mb: 2 }}>
        <DataHeader
          showDateControls={false}
          searchTerm=""
          onSearchChange={() => {}}
          searchPlaceholder="Search booking types..."
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
          onCreateNew={() => handleOpenTypeForm(null, 'create')}
          createButtonLabel="Create Booking Type"
        />
      </Box>
      
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : contextBookingTypes.length > 0 ? (
        <Grid container spacing={1}>
          {sortedBookingTypes.map((type) => (
            <Grid item xs={12} sm={6} md={3} lg={2} xl={1.5} key={type.id || type.name}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  minHeight: 90,
                  position: 'relative',
                  borderLeft: `4px solid ${type.color || '#4caf50'}`,
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: 2,
                  },
                }}
                onClick={() => handleOpenTypeForm(type, 'view')}
              >
                <CardContent sx={{ flexGrow: 1, p: 0.75, pr: 4.5, '&:last-child': { pb: 0.75 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.25 }}>
                    <EventIcon color="primary" sx={{ mr: 0.5, fontSize: 14 }} />
                    <Typography variant="subtitle2" component="h3" sx={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.1, wordBreak: 'break-word' }}>
                      {type.name}
                    </Typography>
                  </Box>
                  
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'primary.main', mb: 0.25, display: 'block' }}>
                    {type.defaultDuration || 60} min
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
                  <Tooltip title="Edit Type" placement="left">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenTypeForm(type, 'edit')
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
                  <Tooltip title="Delete Type" placement="left">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(type.id || '')
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
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            No booking types found. Click 'Add Booking Type' to create your first booking type.
          </Typography>
        </Paper>
      )}
      
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {/* Add/Edit Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedBookingType ? 'Edit Booking Type' : 'Add Booking Type'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                required
                size="small"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                multiline
                rows={2}
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="color-label">Color</InputLabel>
                <Select
                  labelId="color-label"
                  name="color"
                  value={formData.color || '#4caf50'}
                  onChange={handleSelectChange}
                  label="Color"
                  startAdornment={
                    <InputAdornment position="start">
                      <ColorLensIcon sx={{ color: formData.color || '#4caf50' }} />
                    </InputAdornment>
                  }
                >
                  {COLOR_OPTIONS.map(color => (
                    <MenuItem key={color} value={color}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: 20, 
                            height: 20, 
                            borderRadius: '50%', 
                            backgroundColor: color,
                            mr: 1
                          }} 
                        />
                        {color}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Default Duration (minutes)"
                name="defaultDuration"
                type="number"
                value={formData.defaultDuration || 60}
                onChange={handleInputChange}
                size="small"
                InputProps={{
                  inputProps: { min: 15, step: 15 }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active !== false}
                    onChange={handleSwitchChange('active')}
                    color="primary"
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={isLoading || !formData.name}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this booking type? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Booking Type Form Modal */}
      <CRUDModal
        open={typeFormOpen}
        onClose={handleCloseTypeForm}
        title={typeFormMode === 'create' ? 'Create Booking Type' : typeFormMode === 'edit' ? 'Edit Booking Type' : 'View Booking Type'}
        mode={typeFormMode}
        onSave={handleSaveType}
        hideDefaultActions={true}
        actions={
          typeFormMode === 'view' ? (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setTypeFormMode('edit')}
            >
              Edit
            </Button>
          ) : typeFormMode === 'edit' ? (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  if (selectedTypeForForm && window.confirm('Are you sure you want to delete this booking type?')) {
                    handleDelete(selectedTypeForForm.id)
                    handleCloseTypeForm()
                  }
                }}
              >
                Delete
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveType}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveType}
            >
              Create Booking Type
            </Button>
          )
        }
      >
        <BookingTypeForm
          bookingType={selectedTypeForForm}
          mode={typeFormMode}
          onSave={handleSaveType}
        />
      </CRUDModal>
    </Box>
  )
}

export default BookingTypesManagement
