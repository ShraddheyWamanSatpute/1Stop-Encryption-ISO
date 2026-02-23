"use client"

import type React from "react"
import { useEffect, useState, useMemo, useCallback, useRef } from "react"
// All company state is now handled through StockContext
// SiteContext has been merged into CompanyContext
import { useStock } from "../../../backend/context/StockContext"
import type { Site, StockCount, HeadCell, SortDirection } from "../../../backend/context/StockContext"
// All database operations are now handled through StockContext
import {
  Box,
  Typography,
  Button,
  TextField,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material"
import {
  Edit as EditIcon,
  Close as CloseIcon,
  SwapHoriz as SwapHorizIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material"
import CRUDModal from "../reusable/CRUDModal"
import StockCountForm, { StockCountFormRef } from "./forms/StockCountForm"
import DataHeader from "../reusable/DataHeader"

// SortDirection and HeadCell interfaces moved to backend

const headCells: HeadCell[] = [
  { id: "dateUK", label: "Date", numeric: false, sortable: true },
  { id: "timeUK", label: "Time", numeric: false, sortable: true },
  { id: "status", label: "Status", numeric: false, sortable: true },
  { id: "presetName", label: "Preset", numeric: false, sortable: true },
  { id: "itemCount", label: "Items Count", numeric: false, sortable: true },
  { id: "totalValue", label: "Total Value", numeric: false, sortable: true },
  { id: "actions", label: "Actions", numeric: false, sortable: false },
]

// Add helper function to determine chip color based on status
const getStatusColor = (status: string) => {
  if (status === "Approved") return "success"
  if (status === "Awaiting Approval" || status === "Awaiting Submission") return "warning"
  return "default"
}

const StockCountTable: React.FC = () => {
  const { 
    state,
    fetchAllStockCounts: contextFetchAllStockCounts,
    saveStockCount: contextSaveStockCount,
    deleteStockCount: contextDeleteStockCount,
  } = useStock()
  const { dataVersion, loading: contextLoading } = state
  const [stockCounts, setStockCounts] = useState<StockCount[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [viewStock, setViewStock] = useState<StockCount | null>(null)
  const [showView, setShowView] = useState(false)
  const [loading, setLoading] = useState(true)
  const [orderBy, setOrderBy] = useState<string>("dateUK")
  const [order, setOrder] = useState<SortDirection>("desc")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [presetFilter, setPresetFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("dateUK")
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>("desc")
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [selectedStockForTransfer, setSelectedStockForTransfer] = useState<StockCount | null>(null)
  const [availableSites] = useState<Site[]>([])
  const [targetSiteId, setTargetSiteId] = useState<string>("") 
  const [transferItems, setTransferItems] = useState<{id: string, name: string, countedQuantity: number}[]>([])
  const [transferNote, setTransferNote] = useState("")
  const [displayedItems, setDisplayedItems] = useState<StockCount[]>([])
  const [itemsPerBatch] = useState(50)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Stock count form states
  const [countFormOpen, setCountFormOpen] = useState(false)
  const [countFormMode, setCountFormMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedCountForForm, setSelectedCountForForm] = useState<StockCount | null>(null)
  const countFormRef = useRef<StockCountFormRef>(null)

  // Fetch stock counts using the external service function
  useEffect(() => {
    async function fetchData() {
      // All data operations are now handled through StockContext
      setLoading(true)
      try {
        const allStockCounts = await contextFetchAllStockCounts()
        setStockCounts(allStockCounts)
      } catch (error) {
        console.error("Error fetching stock counts:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filtered and sorted items
  const filteredCounts = useMemo(() => {
    let filtered = stockCounts

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((count) =>
        count.presetName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        count.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        count.dateUK?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((count) => count.status === statusFilter)
    }

    // Apply preset filter
    if (presetFilter !== "all") {
      filtered = filtered.filter((count) => count.presetName === presetFilter)
    }

    // Apply sorting using new sort state
    const sortKey = sortBy as keyof StockCount
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
  }, [stockCounts, searchQuery, statusFilter, presetFilter, sortBy, sortDirection, dataVersion])

  // Load more items for infinite scroll
  const loadMoreItems = useCallback(() => {
    if (isLoadingMore || displayedItems.length >= filteredCounts.length) {
      return
    }

    setIsLoadingMore(true)
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      const currentLength = displayedItems.length
      const nextBatch = filteredCounts.slice(currentLength, currentLength + itemsPerBatch)
      setDisplayedItems(prev => [...prev, ...nextBatch])
      setIsLoadingMore(false)
    }, 300)
  }, [isLoadingMore, displayedItems.length, filteredCounts, itemsPerBatch])

  // Initialize displayed items when filtered counts change
  useEffect(() => {
    setDisplayedItems(filteredCounts.slice(0, itemsPerBatch))
  }, [filteredCounts, itemsPerBatch])

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

  // Get unique statuses and presets for filters
  const uniqueStatuses = useMemo(() => {
    return [...new Set(stockCounts.map(count => count.status).filter(Boolean))]
  }, [stockCounts])

  const uniquePresets = useMemo(() => {
    return [...new Set(stockCounts.map(count => count.presetName).filter(Boolean))]
  }, [stockCounts])

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
      label: 'Preset',
      options: [
        { id: 'all', name: 'All Presets' },
        ...uniquePresets.map(preset => ({ id: preset || '', name: preset || '' }))
      ],
      selectedValues: presetFilter ? [presetFilter] : [],
      onSelectionChange: (values: string[]) => setPresetFilter(values[0] || '')
    }
  ], [uniqueStatuses, uniquePresets, statusFilter, presetFilter])

  const sortOptions = useMemo(() => [
    { value: 'dateUK', label: 'Date' },
    { value: 'timeUK', label: 'Time' },
    { value: 'status', label: 'Status' },
    { value: 'presetName', label: 'Preset' },
    { value: 'itemCount', label: 'Items Count' },
    { value: 'totalValue', label: 'Total Value' }
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
    console.log(`Exporting stock counts as ${format}`)
    // Export functionality would be implemented here
    // For now, just log the action
  }


  // New CRUD form handlers
  const handleOpenCountForm = (count: StockCount | null = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedCountForForm(count)
    setCountFormMode(mode)
    setCountFormOpen(true)
  }

  const handleCloseCountForm = () => {
    setCountFormOpen(false)
    setSelectedCountForForm(null)
    setCountFormMode('create')
  }

  const handleSaveCount = async (countData: any) => {
    try {
      if (countFormMode === 'create') {
        // Create new stock count
        await contextSaveStockCount(countData)
        console.log('Stock count created successfully')
      } else if (countFormMode === 'edit') {
        // Update existing stock count
        await contextSaveStockCount(countData)
        console.log('Stock count updated successfully')
      }
      
      // Refresh the stock counts list
      const updatedStockCounts = await contextFetchAllStockCounts()
      setStockCounts(updatedStockCounts)
      
      handleCloseCountForm()
    } catch (error) {
      console.error('Error saving stock count:', error)
    }
  }

  const handleDeleteCount = async (countId: string) => {
    if (!window.confirm('Are you sure you want to delete this stock count?')) return

    try {
      await contextDeleteStockCount(countId)
      console.log('Stock count deleted successfully')
      
      // Refresh the stock counts list
      const updatedStockCounts = await contextFetchAllStockCounts()
      setStockCounts(updatedStockCounts)
    } catch (error) {
      console.error('Error deleting stock count:', error)
    }
  }

  const handleSaveAsPreset = () => {
    if (countFormRef.current) {
      countFormRef.current.saveAsPreset()
    }
  }

  const handleCloseView = () => {
    setShowView(false)
    setViewStock(null)
  }




  const handleTransferStock = (stock: StockCount) => {
    setSelectedStockForTransfer(stock)
    setShowTransferDialog(true)
    
    // Initialize transfer items from stock count items
    const items = stock.items?.map(item => ({
      id: item.id,
      name: item.name,
      countedQuantity: item.countedQuantity
    })) || []
    setTransferItems(items)
  }

  const handleCloseTransfer = () => {
    setShowTransferDialog(false)
    setSelectedStockForTransfer(null)
    setTransferItems([])
    setTargetSiteId("")
    setTransferNote("")
  }

  const handleTransferItemChange = (itemId: string, countedQuantity: number) => {
    setTransferItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, countedQuantity } : item
      )
    )
  }

  const handleSubmitTransfer = () => {
    // In a real app, this would send the transfer to the backend
    console.log("Transfer submitted:", {
      fromStock: selectedStockForTransfer?.id,
      toSite: targetSiteId,
      items: transferItems,
      note: transferNote
    })
    
    // Close dialog and reset state
    handleCloseTransfer()
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

      <DataHeader
        showDateControls={false}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search stock counts..."
        filters={filterOptions}
        sortOptions={sortOptions}
        sortValue={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onExportCSV={() => handleExport('csv')}
        onExportPDF={() => handleExport('pdf')}
        onCreateNew={() => handleOpenCountForm(null, 'create')}
        createButtonLabel="New Stock Count"
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
            {displayedItems.map((stock) => (
              <TableRow 
                key={stock.id} 
                hover
                onClick={() => handleOpenCountForm(stock, 'view')}
                sx={{ 
                  cursor: "pointer",
                  '& > td': {
                    paddingTop: 1,
                    paddingBottom: 1,
                  }
                }}
              >
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{stock.dateUK}</TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{stock.timeUK}</TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                  <Chip
                    label={stock.status}
                    color={getStatusColor(stock.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{stock.presetName}</TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{stock.itemCount}</TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                  £{stock.totalValue?.toFixed(2) || "0.00"}
                </TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                  <Box display="flex" gap={1} justifyContent="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenCountForm(stock, 'edit')
                      }}
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTransferStock(stock)
                      }}
                      title="Transfer Stock"
                    >
                      <SwapHorizIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCount(stock.id || '')
                      }}
                      title="Delete"
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
      {displayedItems.length < filteredCounts.length && (
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
          Stock Count Details
          <IconButton
            onClick={handleCloseView}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {viewStock && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {viewStock.presetName} - {viewStock.dateUK}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Status: <Chip label={viewStock.status} color={getStatusColor(viewStock.status)} size="small" />
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Value: £{viewStock.totalValue?.toFixed(2) || "0.00"}
              </Typography>
              
              {viewStock.items && viewStock.items.length > 0 && (
                <Box mt={2}>
                  <Typography variant="h6" gutterBottom>
                    Items ({viewStock.items.length})
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {viewStock.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell align="right">{item.countedQuantity}</TableCell>
                          <TableCell align="right">£{(item.countedTotal / item.countedQuantity)?.toFixed(2) || "0.00"}</TableCell>
                          <TableCell align="right">£{item.countedTotal?.toFixed(2) || "0.00"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseView}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onClose={handleCloseTransfer} maxWidth="sm" fullWidth>
        <DialogTitle>
          Transfer Stock
          <IconButton
            onClick={handleCloseTransfer}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedStockForTransfer && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Transfer from: {selectedStockForTransfer.presetName}
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Target Site</InputLabel>
                <Select
                  value={targetSiteId}
                  onChange={(e) => setTargetSiteId(e.target.value)}
                  label="Target Site"
                >
                  {availableSites.map((site) => (
                    <MenuItem key={site.id} value={site.id}>
                      {site.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {transferItems.length > 0 && (
                <Box mt={2}>
                  <Typography variant="h6" gutterBottom>
                    Items to Transfer
                  </Typography>
                  {transferItems.map((item) => (
                    <Box key={item.id} display="flex" alignItems="center" gap={2} mb={1}>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {item.name}
                      </Typography>
                      <TextField
                        type="number"
                        size="small"
                        value={item.countedQuantity}
                        onChange={(e) => handleTransferItemChange(item.id, parseInt(e.target.value) || 0)}
                        inputProps={{ min: 0, max: item.countedQuantity }}
                        sx={{ width: 100 }}
                      />
                    </Box>
                  ))}
                </Box>
              )}

              <TextField
                label="Transfer Note"
                multiline
                rows={3}
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                fullWidth
                margin="normal"
                placeholder="Add any notes about this transfer..."
              />
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  This transfer will require approval from both the source and target sites before stock is adjusted.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTransfer}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmitTransfer}
            disabled={!targetSiteId || transferItems.every(item => item.countedQuantity <= 0)}
          >
            Submit Transfer Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stock Count Form Modal */}
      <CRUDModal
        open={countFormOpen}
        onClose={handleCloseCountForm}
        title={countFormMode === 'create' ? 'Create Stock Count' : countFormMode === 'edit' ? 'Edit Stock Count' : 'View Stock Count'}
        mode={countFormMode}
        onSave={handleSaveCount}
        formRef={countFormRef}
        maxWidth={false}
        hideDefaultActions={true}
        actions={
          countFormMode === 'view' ? (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setCountFormMode('edit')}
            >
              Edit
            </Button>
          ) : countFormMode === 'edit' ? (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  if (selectedCountForForm && window.confirm('Are you sure you want to delete this stock count?')) {
                    handleDeleteCount(selectedCountForForm.id || '')
                    handleCloseCountForm()
                  }
                }}
              >
                Delete
              </Button>
              <Button
                variant="outlined"
                onClick={handleSaveAsPreset}
              >
                Save as Preset
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveCount}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={handleSaveAsPreset}
              >
                Save as Preset
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveCount}
              >
                Create Stock Count
              </Button>
            </>
          )
        }
      >
        <StockCountForm
          ref={countFormRef}
          stockCount={selectedCountForForm}
          mode={countFormMode}
          onSave={handleSaveCount}
        />
      </CRUDModal>
    </Box>
  )
}

export default StockCountTable
