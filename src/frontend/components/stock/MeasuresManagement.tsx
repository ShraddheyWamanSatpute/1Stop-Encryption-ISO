"use client"

import React, { useState, useMemo } from "react"
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
  Straighten as MeasureIcon,
  Save as SaveIcon,
} from "@mui/icons-material"
import { useStock } from "../../../backend/context/StockContext"
import CRUDModal from "../reusable/CRUDModal"
import MeasureForm from "./forms/MeasureForm"
import DataHeader from "../reusable/DataHeader"

const MeasuresManagement: React.FC = () => {
  const { state, saveMeasure, updateMeasure, deleteMeasure } = useStock()
  const { measures, dataVersion, loading } = state

  // DataHeader state
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>("asc")

  // CRUD Modal state
  const [measureFormOpen, setMeasureFormOpen] = useState(false)
  const [selectedMeasureForForm, setSelectedMeasureForForm] = useState<any>(null)
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
    { value: "quantity", label: "Quantity" },
    { value: "baseUnit", label: "Base Unit" },
  ]

  // Filter and sort measures
  const filteredAndSortedMeasures = useMemo(() => {
    if (!measures || !Array.isArray(measures)) {
      return []
    }
    
    let filtered = measures.filter((measure) =>
      measure.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      measure.quantity?.toString().includes(searchTerm.toLowerCase()) ||
      measure.baseUnit?.toLowerCase().includes(searchTerm.toLowerCase())
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
  }, [measures, searchTerm, sortBy, sortDirection, dataVersion])

  // DataHeader handlers
  const handleSortChange = (value: string, direction: "asc" | "desc") => {
    setSortBy(value)
    setSortDirection(direction)
  }

  const handleCreateNew = () => {
    setSelectedMeasureForForm(null)
    setCrudMode('create')
    setMeasureFormOpen(true)
  }

  const handleRefresh = async () => {
  }

  // CRUD handlers
  const handleOpenMeasureForm = (measure: any = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedMeasureForForm(measure)
    setCrudMode(mode)
    setMeasureFormOpen(true)
  }

  const handleCloseMeasureForm = () => {
    setMeasureFormOpen(false)
    setSelectedMeasureForForm(null)
    setCrudMode('create')
  }

  const handleSaveMeasureForm = async (measureData: any) => {
    try {
      if (crudMode === 'create') {
        await saveMeasure?.(measureData)
        setNotification({
          open: true,
          message: "Measure created successfully",
          severity: "success"
        })
      } else if (crudMode === 'edit' && selectedMeasureForForm) {
        await updateMeasure?.(selectedMeasureForForm.id, measureData)
        setNotification({
          open: true,
          message: "Measure updated successfully",
          severity: "success"
        })
      }
      handleCloseMeasureForm()
    } catch (error) {
      setNotification({
        open: true,
        message: "Failed to save measure",
        severity: "error"
      })
    }
  }

  const handleDeleteMeasure = async (measureId: string) => {
    if (!window.confirm("Are you sure you want to delete this measure?")) return

    try {
      await deleteMeasure?.(measureId)
      setNotification({
        open: true,
        message: "Measure deleted successfully",
        severity: "success"
      })
    } catch (error) {
      setNotification({
        open: true,
        message: "Failed to delete measure",
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
        searchPlaceholder="Search measures..."
        sortOptions={sortOptions}
        sortValue={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onRefresh={handleRefresh}
        onCreateNew={handleCreateNew}
        createButtonLabel="Create Measure"
      />

      {/* Measures Table */}
      <TableContainer component={Paper} elevation={1} sx={{ mt: 2, opacity: loading ? 0.7 : 1, transition: 'opacity 0.3s' }}>
        <Table>
          <TableHead sx={{ bgcolor: "action.hover" }}>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Name</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Quantity</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Base Unit</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedMeasures.map((measure) => (
              <TableRow 
                key={measure.id} 
                hover
                onClick={() => handleOpenMeasureForm(measure, 'view')}
                sx={{ 
                  cursor: "pointer",
                  '& > td': {
                    paddingTop: 1,
                    paddingBottom: 1,
                  }
                }}
              >
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{measure.name}</TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{measure.quantity || measure.baseQuantity || "1"}</TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{measure.baseUnit || measure.unit || "N/A"}</TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                  <Box display="flex" gap={1} justifyContent="center">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenMeasureForm(measure, 'edit')
                      }}
                      title="Edit Measure"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteMeasure(measure.id)
                      }}
                      title="Delete Measure"
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

      {filteredAndSortedMeasures.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <MeasureIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Measures Found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchTerm ? "No measures match your search criteria." : "Get started by creating your first measure."}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
          >
            Create Measure
          </Button>
        </Box>
      )}

      {/* CRUD Modal */}
      <CRUDModal
        open={measureFormOpen}
        onClose={handleCloseMeasureForm}
        title={crudMode === 'create' ? 'Create Measure' : crudMode === 'edit' ? 'Edit Measure' : 'View Measure'}
        mode={crudMode}
        onSave={handleSaveMeasureForm}
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
                  if (selectedMeasureForForm && window.confirm('Are you sure you want to delete this measure?')) {
                    handleDeleteMeasure(selectedMeasureForForm.id)
                    handleCloseMeasureForm()
                  }
                }}
              >
                Delete
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveMeasureForm}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveMeasureForm}
            >
              Create Measure
            </Button>
          )
        }
      >
        <MeasureForm
          measure={selectedMeasureForForm}
          mode={crudMode}
          onSave={handleSaveMeasureForm}
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

export default MeasuresManagement
