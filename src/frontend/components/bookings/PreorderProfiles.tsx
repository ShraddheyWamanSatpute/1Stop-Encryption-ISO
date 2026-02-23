"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import { Box, Typography, Grid, Card, CardContent, IconButton, Alert, CircularProgress, Tooltip } from "@mui/material"
import { Delete as DeleteIcon, Edit as EditIcon, Visibility as VisibilityIcon, Restaurant as RestaurantIcon } from "@mui/icons-material"
import { useBookings as useBookingsContext } from "../../../backend/context/BookingsContext"
import CRUDModal from "../reusable/CRUDModal"
import PreorderProfileForm from "./forms/PreorderProfileForm"
import DataHeader from "../reusable/DataHeader"


interface PreorderCourseItem { itemId: string; required?: boolean; perPerson?: boolean; quantityPerPerson?: number }
interface PreorderCourse { id?: string; name: string; courseId?: string; minPerPerson?: number; maxPerPerson?: number; items: PreorderCourseItem[] }
interface PreorderProfile { id?: string; name: string; description?: string; courses: PreorderCourse[]; createdAt?: string; updatedAt?: string }

const PreorderProfiles: React.FC = () => {
  const { 
    basePath, 
    fetchPreorderProfiles, 
    savePreorderProfile, 
    deletePreorderProfile
  } = useBookingsContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [profiles, setProfiles] = useState<PreorderProfile[]>([])
  
  // CRUD form states
  const [profileFormOpen, setProfileFormOpen] = useState(false)
  const [profileFormMode, setProfileFormMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedProfileForForm, setSelectedProfileForForm] = useState<PreorderProfile | null>(null)
  const [sortBy, setSortBy] = useState("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    const load = async () => {
      if (!basePath) return
      setLoading(true)
      setError(null)
      try {
        console.log("Loading preorder profiles from basePath:", basePath)
        
        // Load preorder profiles
        const profilesData = await fetchPreorderProfiles()
        console.log("Loaded preorder profiles:", profilesData)
        setProfiles(profilesData || [])


      } catch (e) {
        console.error("Error loading preorder profiles data:", e)
        setError("Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [basePath, fetchPreorderProfiles])

  // Sort options for preorder profiles
  const sortOptions = [
    { value: "name", label: "Name" },
    { value: "description", label: "Description" },
  ]

  // Filter and sort preorder profiles
  const sortedProfiles = useMemo(() => {
    return [...profiles].sort((a, b) => {
      let aValue = ""
      let bValue = ""

      switch (sortBy) {
        case "name":
          aValue = a.name || ""
          bValue = b.name || ""
          break
        case "description":
          aValue = a.description || ""
          bValue = b.description || ""
          break
        default:
          aValue = a.name || ""
          bValue = b.name || ""
      }

      const comparison = aValue.localeCompare(bValue)
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [profiles, sortBy, sortDirection])

  // No category/subcategory filters anymore; keep full list available



  const handleDelete = async (id?: string) => {
    if (!id || !basePath) return
    setLoading(true)
    setError(null)
    try {
      console.log('Deleting preorder profile:', id)
      
      await deletePreorderProfile(id)
      console.log('Deleted preorder profile:', id)
      
      // Refresh the profiles list
      const updatedProfiles = await fetchPreorderProfiles()
      setProfiles(updatedProfiles || [])
    } catch (e) {
      console.error("Error deleting preorder profile:", e)
      setError("Failed to delete profile")
    } finally {
      setLoading(false)
    }
  }

  // CRUD form handlers
  const handleOpenProfileForm = (profile: PreorderProfile | null = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedProfileForForm(profile)
    setProfileFormMode(mode)
    setProfileFormOpen(true)
  }

  const handleCloseProfileForm = () => {
    setProfileFormOpen(false)
    setSelectedProfileForForm(null)
  }

  const handleSaveProfile = async (profileData: any) => {
    try {
      if (profileFormMode === 'create') {
        await savePreorderProfile(profileData)
        setError(null)
      } else if (profileFormMode === 'edit' && selectedProfileForForm?.id) {
        await savePreorderProfile({ ...profileData, id: selectedProfileForForm.id })
        setError(null)
      }
      handleCloseProfileForm()
      
      // Refresh the profiles list
      const updatedProfiles = await fetchPreorderProfiles()
      setProfiles(updatedProfiles || [])
    } catch (error) {
      console.error('Error saving preorder profile:', error)
      setError('Failed to save profile')
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <DataHeader
          showDateControls={false}
          searchTerm=""
          onSearchChange={() => {}}
          searchPlaceholder="Search preorder profiles..."
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
          onCreateNew={() => handleOpenProfileForm(null, 'create')}
          createButtonLabel="Create Profile"
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && profiles.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={1}>
          {sortedProfiles.map((p) => (
            <Grid item xs={12} sm={6} md={3} lg={2} xl={1.5} key={p.id}>
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
                onClick={() => handleOpenProfileForm(p, 'view')}
              >
                <CardContent sx={{ flexGrow: 1, p: 0.75, pr: 4.5, '&:last-child': { pb: 0.75 } }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <RestaurantIcon color="primary" sx={{ mr: 0.5, fontSize: 14 }} />
                    <Typography variant="subtitle2" component="h3" sx={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.1, wordBreak: 'break-word' }}>
                      {p.name}
                    </Typography>
                  </Box>
                </CardContent>

                {/* Action Icons positioned on the right */}
                <Box sx={{ 
                  position: "absolute", 
                  top: 6, 
                  right: 6, 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: 0.02 
                }}>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenProfileForm(p, 'edit')
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
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(p.id)
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
      )}


      {/* CRUD Modal */}
      <CRUDModal
        open={profileFormOpen}
        onClose={handleCloseProfileForm}
        title={profileFormMode === 'create' ? 'Create Preorder Profile' : profileFormMode === 'edit' ? 'Edit Preorder Profile' : 'View Preorder Profile'}
        mode={profileFormMode}
        onSave={handleSaveProfile}
      >
        <PreorderProfileForm
          profile={selectedProfileForForm}
          mode={profileFormMode}
          onSave={handleSaveProfile}
        />
      </CRUDModal>
    </Box>
  )
}

export default PreorderProfiles


