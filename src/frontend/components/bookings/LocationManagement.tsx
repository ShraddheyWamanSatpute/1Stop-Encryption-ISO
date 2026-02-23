"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import {
  Box,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  Typography,
  Alert,
  Snackbar,
  Chip,
  Tooltip,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import LocationOnIcon from "@mui/icons-material/LocationOn"
import { useCompany } from "../../../backend/context/CompanyContext"
import { usePOS } from "../../../backend/context/POSContext"
import { LocationFormContent } from "../pos/forms/LocationForm"
import CRUDModal from "../reusable/CRUDModal"
import type { Location } from "../../../backend/interfaces/POS"
import DataHeader from "../reusable/DataHeader"

const LocationManagement: React.FC = () => {
  const { state: companyState } = useCompany()
  const { locations: posLocations, createLocation, updateLocation, deleteLocation, fetchLocations } = usePOS()
  
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
  
  // Add search state
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // CRUD form states
  const [locationFormOpen, setLocationFormOpen] = useState(false)
  const [locationFormMode, setLocationFormMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedLocationForForm, setSelectedLocationForForm] = useState<Location | null>(null)

  // Sort options for locations
  const sortOptions = [
    { value: "name", label: "Name" },
    { value: "address", label: "Address" },
    { value: "status", label: "Status" },
  ]

  // Filter and sort locations
  const filteredAndSortedLocations = useMemo(() => {
    const filtered = locations.filter(
      (location) =>
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (location.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (location.address || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    return filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "address":
          aValue = (a.address || '').toLowerCase()
          bValue = (b.address || '').toLowerCase()
          break
        case "status":
          aValue = a.isActive ? "isActive" : "inisActive"
          bValue = b.isActive ? "isActive" : "inisActive"
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }, [locations, searchTerm, sortBy, sortDirection])

  // Load locations from POS context
  useEffect(() => {
    const loadLocations = async () => {
      setLoading(true)
      try {
        if (fetchLocations) {
          await fetchLocations()
        }
        // Update local state from POS context
        if (posLocations && Array.isArray(posLocations)) {
          setLocations(posLocations)
        }
      } catch (err) {
        setError("Failed to load locations")
        console.error("Error loading locations:", err)
      } finally {
        setLoading(false)
      }
    }

    if (companyState.companyID && companyState.selectedSiteID) {
      loadLocations()
    }
  }, [companyState.companyID, companyState.selectedSiteID, posLocations, fetchLocations])

  // CRUD handlers


  const handleDeleteLocation = async (locationId: string) => {
    try {
      if (deleteLocation) {
        await deleteLocation(locationId)
        setNotification({ message: "Location deleted successfully", type: "success" })
        // Refresh locations
        if (fetchLocations) {
          await fetchLocations()
        }
      }
    } catch (err) {
      setNotification({ message: "Failed to delete location", type: "error" })
      console.error("Error deleting location:", err)
    }
  }

  const handleOpenLocationForm = (location: Location | null = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedLocationForForm(location)
    setLocationFormMode(mode)
    setLocationFormOpen(true)
  }

  const handleCloseLocationForm = () => {
    setLocationFormOpen(false)
    setSelectedLocationForForm(null)
  }


  // DataHeader handlers
  const handleSortChange = (value: string, direction: "asc" | "desc") => {
    setSortBy(value)
    setSortDirection(direction)
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      if (fetchLocations) {
        await fetchLocations()
      }
      if (posLocations && Array.isArray(posLocations)) {
        setLocations(posLocations)
      }
    } catch (err) {
      setError("Failed to refresh locations")
      console.error("Error refreshing locations:", err)
    } finally {
      setLoading(false)
    }
  }


  if (loading && locations.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
        <Typography>Loading locations...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 0 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <DataHeader
        onCreateNew={() => handleOpenLocationForm(null, 'create')}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search locations..."
        showDateControls={false}
        sortOptions={sortOptions}
        sortValue={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onRefresh={handleRefresh}
      />

      {filteredAndSortedLocations.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {locations.length === 0 ? "No Locations Found" : "No Locations Match Your Search"}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {locations.length === 0 
              ? "Create your first location to get started with bookings."
              : "Try adjusting your search criteria."
            }
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenLocationForm(null, 'create')}>
            {locations.length === 0 ? "Create First Location" : "Create New Location"}
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={1}>
          {filteredAndSortedLocations.map((location) => (
            <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={location.id}>
              <Card 
                sx={{ 
                  minHeight: 90,
                  position: 'relative',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: 2,
                  },
                }}
                onClick={() => handleOpenLocationForm(location, 'view')}
              >
                <CardContent sx={{ p: 0.75, pr: 4.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontSize: '0.75rem',
                        lineHeight: 1.1,
                        wordBreak: 'break-word'
                      }}
                    >
                      {location.name}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`${location.capacity} people`}
                      size="small"
                      sx={{ 
                        fontSize: '0.6rem',
                        height: 16,
                        '& .MuiChip-label': { px: 0.5 }
                      }}
                    />
                  </Box>
                </CardContent>
                
                {/* Action Icons */}
                <Box 
                  sx={{ 
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.02
                  }}
                >
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenLocationForm(location, 'edit')
                      }}
                      sx={{ 
                        width: 28, 
                        height: 28,
                        fontSize: '0.8rem',
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteLocation(location.id)
                      }}
                      sx={{ 
                        width: 28, 
                        height: 28,
                        fontSize: '0.8rem',
                        color: 'error.main',
                        '&:hover': { backgroundColor: 'error.light', color: 'error.contrastText' }
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
      )}

      {/* CRUD Modal */}
      <CRUDModal
        open={locationFormOpen}
        onClose={handleCloseLocationForm}
        title={
          locationFormMode === 'create' ? 'Create Location' : 
          locationFormMode === 'edit' ? 'Edit Location' : 
          'View Location'
        }
        maxWidth="md"
        hideDefaultActions={true}
        actions={
          locationFormMode === 'view' ? (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setLocationFormMode('edit')}
            >
              Edit
            </Button>
          ) : locationFormMode === 'edit' ? (
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
                startIcon={<EditIcon />}
                onClick={async () => {
                  const locationData = (window as any).currentLocationFormData
                  if (locationData && selectedLocationForForm?.id && updateLocation) {
                    try {
                      await updateLocation(selectedLocationForForm.id, {
                        name: locationData.name,
                        description: locationData.description,
                        capacity: locationData.capacity,
                        type: 'other',
                        isActive: locationData.active !== false
                      })
                      setNotification({ message: "Location updated successfully", type: "success" })
                      handleCloseLocationForm()
                      await handleRefresh()
                    } catch (err) {
                      setNotification({ message: "Failed to update location", type: "error" })
                      console.error("Error updating location:", err)
                    }
                  }
                }}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={async () => {
                const locationData = (window as any).currentLocationFormData
                if (locationData && createLocation) {
                  try {
                    if (!locationData.name?.trim()) {
                      setNotification({ message: "Location name is required", type: "error" })
                      return
                    }
                    await createLocation({
                      name: locationData.name,
                      description: locationData.description || '',
                      capacity: locationData.capacity,
                      type: 'other',
                      isActive: locationData.active !== false
                    })
                    setNotification({ message: "Location created successfully", type: "success" })
                    handleCloseLocationForm()
                    await handleRefresh()
                  } catch (err) {
                    setNotification({ message: "Failed to create location", type: "error" })
                    console.error("Error creating location:", err)
                  }
                }
              }}
            >
              Create Location
            </Button>
          )
        }
      >
        <LocationFormContent
          location={selectedLocationForForm}
          mode={locationFormMode}
        />
      </CRUDModal>

      {/* Notification Snackbar */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setNotification(null)} severity={notification?.type} sx={{ width: "100%" }}>
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default LocationManagement
