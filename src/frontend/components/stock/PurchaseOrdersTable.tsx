"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useStock } from "../../../backend/context/StockContext"
import type { Purchase, HeadCell, SortDirection } from "../../../backend/context/StockContext"
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
} from "@mui/material"
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from "@mui/icons-material"
import CRUDModal from "../reusable/CRUDModal"
import PurchaseOrderForm, { PurchaseOrderFormRef } from "./forms/PurchaseOrderForm"
import DataHeader from "../reusable/DataHeader"

const headCells: HeadCell[] = [
  { id: "orderDate", label: "Order Date", numeric: false, sortable: true },
  { id: "supplierName", label: "Supplier", numeric: false, sortable: true },
  { id: "status", label: "Status", numeric: false, sortable: true },
  { id: "totalAmount", label: "Total Amount", numeric: false, sortable: true },
  { id: "deliveryDate", label: "Delivery Date", numeric: false, sortable: true },
  { id: "actions", label: "Actions", numeric: false, sortable: false },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "Approved":
      return "success"
    case "Awaiting Approval":
      return "warning"
    case "Awaiting Submission":
      return "info"
    default:
      return "default"
  }
}

const PurchaseOrdersTable: React.FC = () => {
  const { state, fetchAllPurchases, deletePurchase, savePurchase } = useStock()
  const { dataVersion, loading: contextLoading } = state
  const navigate = useNavigate()

  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [viewPurchase, setViewPurchase] = useState<Purchase | null>(null)
  const [showView, setShowView] = useState(false)
  const [loading, setLoading] = useState(true)
  const [orderBy, setOrderBy] = useState<string>("orderDate")
  const [order, setOrder] = useState<SortDirection>("desc")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [supplierFilter, setSupplierFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("orderDate")
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>("desc")
  const [displayedItems, setDisplayedItems] = useState<Purchase[]>([])
  const [itemsPerBatch] = useState(50)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Purchase form states
  const [purchaseFormOpen, setPurchaseFormOpen] = useState(false)
  const [purchaseFormMode, setPurchaseFormMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedPurchaseForForm, setSelectedPurchaseForForm] = useState<Purchase | null>(null)
  const purchaseFormRef = useRef<PurchaseOrderFormRef>(null)

  // Fetch purchases
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const allPurchases = await fetchAllPurchases()
        setPurchases(allPurchases)
      } catch (error) {
        console.error("Error fetching purchases:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [fetchAllPurchases])

  // Filtered and sorted items
  const filteredPurchases = useMemo(() => {
    let filtered = purchases

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((purchase) =>
        purchase.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.status?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((purchase) => purchase.status === statusFilter)
    }

    // Apply supplier filter
    if (supplierFilter !== "all") {
      filtered = filtered.filter((purchase) => purchase.supplierName === supplierFilter)
    }

    // Apply sorting using new sort state
    const sortKey = sortBy as keyof Purchase
    filtered = [...filtered].sort((a, b) => {
      const aValue = a[sortKey] || ""
      const bValue = b[sortKey] || ""
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      return 0
    })

    return filtered
  }, [purchases, searchQuery, statusFilter, supplierFilter, sortBy, sortDirection, dataVersion])

  // Load more items for infinite scroll
  const loadMoreItems = useCallback(() => {
    if (isLoadingMore || displayedItems.length >= filteredPurchases.length) {
      return
    }

    setIsLoadingMore(true)
    
    setTimeout(() => {
      const currentLength = displayedItems.length
      const nextBatch = filteredPurchases.slice(currentLength, currentLength + itemsPerBatch)
      setDisplayedItems(prev => [...prev, ...nextBatch])
      setIsLoadingMore(false)
    }, 300)
  }, [isLoadingMore, displayedItems.length, filteredPurchases, itemsPerBatch])

  // Initialize displayed items when filtered purchases change
  useEffect(() => {
    setDisplayedItems(filteredPurchases.slice(0, itemsPerBatch))
  }, [filteredPurchases, itemsPerBatch])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreItems()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [loadMoreItems])

  // Get unique statuses and suppliers for filters
  const uniqueStatuses = useMemo(() => {
    return [...new Set(purchases.map(purchase => purchase.status).filter(Boolean))]
  }, [purchases])

  const uniqueSuppliers = useMemo(() => {
    return [...new Set(purchases.map(purchase => purchase.supplierName).filter(Boolean))]
  }, [purchases])

  // DataHeader options
  const filterOptions = useMemo(() => [
    {
      label: 'Status',
      options: [
        { id: 'all', name: 'All Statuses' },
        ...uniqueStatuses.map(status => ({ id: status || '', name: status || '' }))
      ],
      selectedValues: statusFilter ? [statusFilter] : [],
      onSelectionChange: (values: string[]) => setStatusFilter(values[0] || '')
    },
    {
      label: 'Supplier',
      options: [
        { id: 'all', name: 'All Suppliers' },
        ...uniqueSuppliers.map(supplier => ({ id: supplier || '', name: supplier || '' }))
      ],
      selectedValues: supplierFilter ? [supplierFilter] : [],
      onSelectionChange: (values: string[]) => setSupplierFilter(values[0] || '')
    }
  ], [uniqueStatuses, uniqueSuppliers, statusFilter, supplierFilter])

  const sortOptions = useMemo(() => [
    { value: 'orderDate', label: 'Order Date' },
    { value: 'supplierName', label: 'Supplier' },
    { value: 'status', label: 'Status' },
    { value: 'totalAmount', label: 'Total Amount' },
    { value: 'deliveryDate', label: 'Delivery Date' }
  ], [])

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  // DataHeader handlers

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSortBy(field)
    setSortDirection(direction)
    // Update legacy sort state for compatibility
    setOrderBy(field)
    setOrder(direction)
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting purchase orders as ${format}`)
    // Export functionality would be implemented here
    // For now, just log the action
  }


  const handleCloseView = () => {
    setShowView(false)
    setViewPurchase(null)
  }


  const handleDeletePurchase = async (purchase: Purchase) => {
    if (window.confirm("Are you sure you want to delete this purchase order?")) {
      try {
        await deletePurchase(purchase.id!)
        setPurchases(prev => prev.filter(p => p.id !== purchase.id))
      } catch (error) {
        console.error("Failed to delete purchase:", error)
      }
    }
  }



  // New CRUD form handlers
  const handleOpenPurchaseForm = (purchase: Purchase | null = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedPurchaseForForm(purchase)
    setPurchaseFormMode(mode)
    setPurchaseFormOpen(true)
  }

  const handleClosePurchaseForm = () => {
    setPurchaseFormOpen(false)
    setSelectedPurchaseForForm(null)
    setPurchaseFormMode('create')
  }

  const handleSavePurchase = async (purchaseData: any) => {
    try {
      console.log(`PurchaseOrdersTable: Starting save for mode: ${purchaseFormMode}`)
      
      if (purchaseFormMode === 'create') {
        console.log('PurchaseOrdersTable: Creating new purchase order')
        await savePurchase(purchaseData)
        // Refresh the purchases list
        const updatedPurchases = await fetchAllPurchases()
        setPurchases(updatedPurchases)
        console.log('PurchaseOrdersTable: Create completed')
      } else if (purchaseFormMode === 'edit') {
        console.log('PurchaseOrdersTable: Updating existing purchase order')
        await savePurchase(purchaseData)
        // Refresh the purchases list
        const updatedPurchases = await fetchAllPurchases()
        setPurchases(updatedPurchases)
        console.log('PurchaseOrdersTable: Update completed')
      }
      
      handleClosePurchaseForm()
      console.log('PurchaseOrdersTable: Save process completed successfully')
    } catch (error) {
      console.error('Error saving purchase order:', error)
      // Fallback to navigation if CRUD functions fail
      if (purchaseFormMode === 'create') {
        navigate('/Stock/AddPurchase')
      } else if (purchaseFormMode === 'edit') {
        navigate(`/Stock/EditPurchase/${selectedPurchaseForForm!.id}`)
      }
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Loading overlay - doesn't hide content */}
      {contextLoading && (
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

      {/* Header */}
      <DataHeader
        showDateControls={false}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search purchase orders..."
        filters={filterOptions}
        sortOptions={sortOptions}
        sortValue={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onExportCSV={() => handleExport('csv')}
        onExportPDF={() => handleExport('pdf')}
        onCreateNew={() => handleOpenPurchaseForm(null, 'create')}
        createButtonLabel="New Purchase Order"
      />

      {/* Table */}
      <TableContainer component={Paper} sx={{ opacity: contextLoading ? 0.7 : 1, transition: 'opacity 0.3s' }}>
        <Table>
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align="center"
                  sx={{ 
                    textAlign: 'center !important',
                    padding: '16px 16px',
                    cursor: headCell.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                    '&:hover': {
                      backgroundColor: headCell.sortable ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                    }
                  }}
                  onClick={headCell.sortable ? () => handleRequestSort(headCell.id) : undefined}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: 0.5
                  }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {headCell.label}
                    </Typography>
                    {headCell.sortable && orderBy === headCell.id && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {order === 'asc' ? '↑' : '↓'}
                      </Box>
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedItems.map((purchase) => (
              <TableRow 
                key={purchase.id} 
                hover
                onClick={() => handleOpenPurchaseForm(purchase, 'view')}
                sx={{ 
                  cursor: "pointer",
                  '& > td': {
                    paddingTop: 1,
                    paddingBottom: 1,
                  }
                }}
              >
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{purchase.orderDate || purchase.dateUK}</TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{purchase.supplierName || purchase.supplier}</TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                  <Chip
                    label={purchase.status}
                    color={getStatusColor(purchase.status || "")}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                  £{purchase.totalAmount?.toFixed(2) || purchase.totalValue?.toFixed(2) || "0.00"}
                </TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{purchase.deliveryDate || purchase.expectedDeliveryDate}</TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                  <Box display="flex" gap={1} justifyContent="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenPurchaseForm(purchase, 'edit')
                      }}
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePurchase(purchase)
                      }}
                      title="Delete"
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

      {/* Load More Trigger */}
      {displayedItems.length < filteredPurchases.length && (
        <Box ref={loadMoreRef} display="flex" justifyContent="center" py={2}>
          {isLoadingMore ? (
            <CircularProgress size={24} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              Scroll to load more...
            </Typography>
          )}
        </Box>
      )}

      {/* View Dialog */}
      <Dialog open={showView} onClose={handleCloseView} maxWidth="md" fullWidth>
        <DialogTitle>
          Purchase Order Details
          <IconButton
            onClick={handleCloseView}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {viewPurchase && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {viewPurchase.supplierName || viewPurchase.supplier} - {viewPurchase.orderDate || viewPurchase.dateUK}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Status: <Chip label={viewPurchase.status} color={getStatusColor(viewPurchase.status || "")} size="small" />
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Amount: £{viewPurchase.totalAmount?.toFixed(2) || viewPurchase.totalValue?.toFixed(2) || "0.00"}
              </Typography>
              {viewPurchase.invoiceNumber && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Invoice Number: {viewPurchase.invoiceNumber}
                </Typography>
              )}
              {viewPurchase.deliveryDate && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Delivery Date: {viewPurchase.deliveryDate}
                </Typography>
              )}
              
              {viewPurchase.items && viewPurchase.items.length > 0 && (
                <Box mt={2}>
                  <Typography variant="h6" gutterBottom>
                    Items ({viewPurchase.items.length})
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {viewPurchase.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productId}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">£{(item.unitPrice || 0).toFixed(2)}</TableCell>
                          <TableCell align="right">£{((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}

              {viewPurchase.notes && (
                <Box mt={2}>
                  <Typography variant="h6" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body2">
                    {viewPurchase.notes}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseView}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Empty State */}
      {displayedItems.length === 0 && !loading && (
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            {searchQuery ? "No purchase orders found matching your search." : "No purchase orders available."}
          </Typography>
        </Box>
      )}

      {/* Purchase Order Form Modal */}
      <CRUDModal
        open={purchaseFormOpen}
        onClose={handleClosePurchaseForm}
        title={purchaseFormMode === 'create' ? 'Create Purchase Order' : purchaseFormMode === 'edit' ? 'Edit Purchase Order' : 'View Purchase Order'}
        mode={purchaseFormMode}
        onSave={handleSavePurchase}
        formRef={purchaseFormRef}
        maxWidth={false}
        hideDefaultActions={true}
        actions={
          purchaseFormMode === 'view' ? (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setPurchaseFormMode('edit')}
            >
              Edit
            </Button>
          ) : purchaseFormMode === 'edit' ? (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  if (selectedPurchaseForForm && window.confirm('Are you sure you want to delete this purchase order?')) {
                    handleDeletePurchase(selectedPurchaseForForm)
                    handleClosePurchaseForm()
                  }
                }}
              >
                Delete
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSavePurchase}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSavePurchase}
            >
              Create Purchase Order
            </Button>
          )
        }
      >
        <PurchaseOrderForm
          ref={purchaseFormRef}
          purchase={selectedPurchaseForForm}
          mode={purchaseFormMode}
          onSave={handleSavePurchase}
        />
      </CRUDModal>
    </Box>
  )
}

export default PurchaseOrdersTable
