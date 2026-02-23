"use client"

import React, { useState, useMemo, useEffect } from "react"
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Button,
} from "@mui/material"
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Save as SaveIcon,
} from "@mui/icons-material"
import { useStock } from "../../../backend/context/StockContext"
import CRUDModal from "../reusable/CRUDModal"
import LocationForm from "./forms/LocationForm"
import DataHeader from "../reusable/DataHeader"

const LocationsManagement: React.FC = () => {
  const { state, createStockLocation, updateStockLocation, deleteStockLocation, fetchLocations } = useStock()
  const { dataVersion, loading } = state
  
  // Local state for locations since they're not stored in context state
  const [locations, setLocations] = useState<any[]>([])

  // DataHeader state
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>("asc")

  // CRUD Modal state
  const [locationFormOpen, setLocationFormOpen] = useState(false)
  const [selectedLocationForForm, setSelectedLocationForForm] = useState<any>(null)
  const [crudMode, setCrudMode] = useState<'create' | 'edit' | 'view'>('create')

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
  ]

  // Filter and sort locations
  const filteredAndSortedLocations = useMemo(() => {
    if (!locations || !Array.isArray(locations)) {
      return []
    }
    
    let filtered = locations.filter((location) =>
      location.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
  }, [locations, searchTerm, sortBy, sortDirection, dataVersion])

  // DataHeader handlers
  const handleSortChange = (value: string, direction: "asc" | "desc") => {
    setSortBy(value)
    setSortDirection(direction)
  }

  const handleCreateNew = () => {
    setSelectedLocationForForm(null)
    setCrudMode('create')
    setLocationFormOpen(true)
  }

  const handleRefresh = async () => {
    try {
      const fetchedLocations = await fetchLocations()
      setLocations(fetchedLocations || [])
    } catch (error) {
      console.error("Error refreshing locations:", error)
      setNotification({
        open: true,
        message: "Failed to refresh locations",
        severity: "error"
      })
    }
  }

  // CRUD handlers
  const handleOpenLocationForm = (location: any = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedLocationForForm(location)
    setCrudMode(mode)
    setLocationFormOpen(true)
  }

  const handleCloseLocationForm = () => {
    setLocationFormOpen(false)
    setSelectedLocationForForm(null)
    setCrudMode('create')
  }

  const handleSaveLocationForm = async (locationData: any) => {
    try {
      if (crudMode === 'create') {
        await createStockLocation?.(locationData)
        setNotification({
          open: true,
          message: "Location created successfully",
          severity: "success"
        })
      } else if (crudMode === 'edit' && selectedLocationForForm) {
        await updateStockLocation?.(selectedLocationForForm.id, locationData)
        setNotification({
          open: true,
          message: "Location updated successfully",
          severity: "success"
        })
      }
      handleCloseLocationForm()
      // Refresh the local locations list
      await handleRefresh()
    } catch (error) {
      setNotification({
        open: true,
        message: "Failed to save location",
        severity: "error"
      })
    }
  }

  const handleDeleteLocation = async (locationId: string) => {
    if (!window.confirm("Are you sure you want to delete this location?")) return

    try {
      await deleteStockLocation?.(locationId)
      setNotification({
        open: true,
        message: "Location deleted successfully",
        severity: "success"
      })
      // Refresh the local locations list
      await handleRefresh()
    } catch (error) {
      setNotification({
        open: true,
        message: "Failed to delete location",
        severity: "error"
      })
    }
  }

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false })
  }

  // Load locations on component mount and when data changes
  useEffect(() => {
    handleRefresh()
  }, [dataVersion]) // eslint-disable-line react-hooks/exhaustive-deps

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
        searchPlaceholder="Search locations..."
        sortOptions={sortOptions}
        sortValue={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onRefresh={handleRefresh}
        onCreateNew={handleCreateNew}
        createButtonLabel="Create Location"
      />

      {/* Locations Table */}
      <TableContainer component={Paper} elevation={1} sx={{ mt: 2, opacity: loading ? 0.7 : 1, transition: 'opacity 0.3s' }}>
        <Table>
          <TableHead sx={{ bgcolor: "action.hover" }}>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Name</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Description</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedLocations.map((location) => (
              <TableRow 
                key={location.id} 
                hover
                onClick={() => handleOpenLocationForm(location, 'view')}
                sx={{ 
                  cursor: "pointer",
                  '& > td': {
                    paddingTop: 1,
                    paddingBottom: 1,
                  }
                }}
              >
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{location.name}</TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{location.description || "No description"}</TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                  <Box display="flex" gap={1} justifyContent="center">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenLocationForm(location, 'edit')
                      }}
                      title="Edit Location"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteLocation(location.id)
                      }}
                      title="Delete Location"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredAndSortedLocations.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <LocationIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Locations Found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchTerm ? "No locations match your search criteria." : "Get started by creating your first location."}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
          >
            Create Location
          </Button>
        </Box>
      )}

      {/* CRUD Modal */}
      <CRUDModal
        open={locationFormOpen}
        onClose={handleCloseLocationForm}
        title={crudMode === 'create' ? 'Create Location' : crudMode === 'edit' ? 'Edit Location' : 'View Location'}
        mode={crudMode}
        onSave={handleSaveLocationForm}
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
                  if (selectedLocationForForm && window.confirm('Are you sure you want to delete this location?')) {
                    handleDeleteLocation(selectedLocationForForm.id)
                    handleCloseLocationForm()
                  }
                }}
              >
                Delete
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveLocationForm}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveLocationForm}
            >
              Create Location
            </Button>
          )
        }
      >
        <LocationForm
          location={selectedLocationForForm}
          mode={crudMode}
          onSave={handleSaveLocationForm}
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

export default LocationsManagement
