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
  LocalShipping as SupplierIcon,
  Save as SaveIcon,
} from "@mui/icons-material"
import { useStock } from "../../../backend/context/StockContext"
import CRUDModal from "../reusable/CRUDModal"
import SupplierForm from "./forms/SupplierForm"
import DataHeader from "../reusable/DataHeader"

const SuppliersManagement: React.FC = () => {
  const { state, createSupplier, updateSupplier, deleteSupplier, fetchSuppliers } = useStock()
  const { dataVersion, loading } = state
  
  // Local state for suppliers since they're not stored in context state
  const [suppliers, setSuppliers] = useState<any[]>([])

  // DataHeader state
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>("asc")

  // CRUD Modal state
  const [supplierFormOpen, setSupplierFormOpen] = useState(false)
  const [selectedSupplierForForm, setSelectedSupplierForForm] = useState<any>(null)
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
    { value: "ref", label: "Reference" },
    { value: "address", label: "Address" },
    { value: "contact", label: "Contact" },
    { value: "orderUrl", label: "Order URL" },
  ]

  // Filter and sort suppliers
  const filteredAndSortedSuppliers = useMemo(() => {
    if (!suppliers || !Array.isArray(suppliers)) {
      return []
    }
    
    const filtered = suppliers.filter((supplier) =>
      supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.orderUrl?.toLowerCase().includes(searchTerm.toLowerCase())
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
  }, [suppliers, searchTerm, sortBy, sortDirection, dataVersion])

  // DataHeader handlers
  const handleSortChange = (value: string, direction: "asc" | "desc") => {
    setSortBy(value)
    setSortDirection(direction)
  }

  const handleCreateNew = () => {
    setSelectedSupplierForForm(null)
    setCrudMode('create')
    setSupplierFormOpen(true)
  }

  const handleRefresh = async () => {
    try {
      const fetchedSuppliers = await fetchSuppliers()
      setSuppliers(fetchedSuppliers || [])
    } catch (error) {
      console.error("Error refreshing suppliers:", error)
      setNotification({
        open: true,
        message: "Failed to refresh suppliers",
        severity: "error"
      })
    }
  }

  // CRUD handlers
  const handleOpenSupplierForm = (supplier: any = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedSupplierForForm(supplier)
    setCrudMode(mode)
    setSupplierFormOpen(true)
  }

  const handleCloseSupplierForm = () => {
    setSupplierFormOpen(false)
    setSelectedSupplierForForm(null)
    setCrudMode('create')
  }

  const handleSaveSupplierForm = async (supplierData: any) => {
    try {
      if (crudMode === 'create') {
        await createSupplier?.(supplierData)
        setNotification({
          open: true,
          message: "Supplier created successfully",
          severity: "success"
        })
      } else if (crudMode === 'edit' && selectedSupplierForForm) {
        await updateSupplier?.(selectedSupplierForForm.id, supplierData)
        setNotification({
          open: true,
          message: "Supplier updated successfully",
          severity: "success"
        })
      }
      handleCloseSupplierForm()
      // Refresh the local suppliers list
      await handleRefresh()
    } catch (error) {
      setNotification({
        open: true,
        message: "Failed to save supplier",
        severity: "error"
      })
    }
  }

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return

    try {
      await deleteSupplier?.(supplierId)
      setNotification({
        open: true,
        message: "Supplier deleted successfully",
        severity: "success"
      })
      // Refresh the local suppliers list
      await handleRefresh()
    } catch (error) {
      setNotification({
        open: true,
        message: "Failed to delete supplier",
        severity: "error"
      })
    }
  }

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false })
  }

  // Load suppliers on component mount and when data changes
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
        searchPlaceholder="Search suppliers..."
        sortOptions={sortOptions}
        sortValue={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onRefresh={handleRefresh}
        onCreateNew={handleCreateNew}
        createButtonLabel="Create Supplier"
      />

      {/* Suppliers Table */}
      <TableContainer component={Paper} elevation={1} sx={{ mt: 2, opacity: loading ? 0.7 : 1, transition: 'opacity 0.3s' }}>
        <Table>
          <TableHead sx={{ bgcolor: "action.hover" }}>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Name</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Reference</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Address</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Contact</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Order URL</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedSuppliers.map((supplier) => (
              <TableRow 
                key={supplier.id} 
                hover
                onClick={() => handleOpenSupplierForm(supplier, 'view')}
                sx={{ 
                  cursor: "pointer",
                  '& > td': {
                    paddingTop: 1,
                    paddingBottom: 1,
                  }
                }}
              >
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{supplier.name || "No name"}</TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{supplier.ref || "No reference"}</TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{supplier.address || "No address"}</TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{supplier.contact || "No contact"}</TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                  {supplier.orderUrl ? (
                    <a 
                      href={supplier.orderUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ 
                        color: 'inherit', 
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }}
                    >
                      {supplier.orderUrl.length > 30 ? `${supplier.orderUrl.substring(0, 30)}...` : supplier.orderUrl}
                    </a>
                  ) : (
                    "No URL"
                  )}
                </TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                  <Box display="flex" gap={1} justifyContent="center">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenSupplierForm(supplier, 'edit')
                      }}
                      title="Edit Supplier"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSupplier(supplier.id)
                      }}
                      title="Delete Supplier"
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

      {filteredAndSortedSuppliers.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SupplierIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Suppliers Found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchTerm ? "No suppliers match your search criteria." : "Get started by creating your first supplier."}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
          >
            Create Supplier
          </Button>
        </Box>
      )}

      {/* CRUD Modal */}
      <CRUDModal
        open={supplierFormOpen}
        onClose={handleCloseSupplierForm}
        title={crudMode === 'create' ? 'Create Supplier' : crudMode === 'edit' ? 'Edit Supplier' : 'View Supplier'}
        mode={crudMode}
        onSave={handleSaveSupplierForm}
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
                  if (selectedSupplierForForm && window.confirm('Are you sure you want to delete this supplier?')) {
                    handleDeleteSupplier(selectedSupplierForForm.id)
                    handleCloseSupplierForm()
                  }
                }}
              >
                Delete
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveSupplierForm}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveSupplierForm}
            >
              Create Supplier
            </Button>
          )
        }
      >
        <SupplierForm
          supplier={selectedSupplierForForm}
          mode={crudMode}
          onSave={handleSaveSupplierForm}
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

export default SuppliersManagement
