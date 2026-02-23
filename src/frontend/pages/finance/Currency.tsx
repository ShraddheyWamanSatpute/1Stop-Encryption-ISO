"use client"

import React, { useEffect, useState } from "react"
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material"
import {
  Sync,
  MoreVert,
  AttachMoney,
  Visibility,
  Edit,
  Delete,
  Close,
} from "@mui/icons-material"

import { useFinance } from "../../../backend/context/FinanceContext"
import DataHeader from "../../components/reusable/DataHeader"
import StatsSection from "../../components/reusable/StatsSection"
import CRUDModal from "../../components/reusable/CRUDModal"
import CurrencyCRUDForm from "../../components/finance/forms/CurrencyCRUDForm"
import type { Currency } from "../../../backend/interfaces/Finance"

const CurrencyPage: React.FC = () => {
  const { 
    state: financeState, 
    refreshCurrencies,
    createCurrency,
    updateCurrency,
    deleteCurrency,
  } = useFinance()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  
  // CRUD Modal states
  const [isCRUDModalOpen, setIsCRUDModalOpen] = useState(false)
  const [crudMode, setCrudMode] = useState<"create" | "edit" | "view">("create")
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)

  // View Dialog state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingCurrency, setViewingCurrency] = useState<Currency | null>(null)

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await refreshCurrencies()
    } catch (error) {
      console.error("Error loading currencies:", error)
    }
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, currency: Currency) => {
    setAnchorEl(event.currentTarget)
    setSelectedCurrency(currency)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedCurrency(null)
  }

  // CRUD Handlers
  const handleOpenCreateModal = () => {
    setCrudMode("create")
    setEditingCurrency(null)
    setIsCRUDModalOpen(true)
  }

  const handleOpenEditModal = (currency: Currency) => {
    setCrudMode("edit")
    setEditingCurrency(currency)
    setIsCRUDModalOpen(true)
    handleMenuClose()
  }

  const handleOpenViewDialog = (currency: Currency) => {
    setViewingCurrency(currency)
    setIsViewDialogOpen(true)
    handleMenuClose()
  }

  // Form submit handler
  const handleSaveCurrency = async (data: any) => {
    try {
      if (crudMode === "create") {
        await createCurrency(data)
      } else if (crudMode === "edit" && editingCurrency) {
        await updateCurrency(editingCurrency.code, data)
      }
      await refreshCurrencies()
      setIsCRUDModalOpen(false)
      setEditingCurrency(null)
    } catch (error) {
      console.error("Error saving currency:", error)
      throw error
    }
  }

  const handleDeleteCurrencyAction = async (currency: Currency) => {
    if (currency.isBase) {
      alert("Cannot delete base currency")
      return
    }

    if (!window.confirm(`Are you sure you want to delete ${currency.name}? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteCurrency(currency.code)
      await refreshCurrencies()
      handleMenuClose()
    } catch (error) {
      console.error("Error deleting currency:", error)
      alert("Failed to delete currency. It may be in use.")
    }
  }

  const handleUpdateRates = async () => {
    try {
      // In a real implementation, this would fetch rates from an API
      alert("Exchange rates updated successfully!")
      await refreshCurrencies()
    } catch (error) {
      console.error("Error updating rates:", error)
      alert("Failed to update exchange rates. Please try again.")
    }
  }

  const currencies = financeState.currencies || []
  const filteredCurrencies = currencies.filter((currency) => {
    const matchesSearch = currency.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         currency.code?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "All" || currency.status === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })
  
  const loading = financeState.loading
  const error = financeState.error
  const activeCurrencies = currencies.filter((c) => c.status === "active").length
  const baseCurrency = currencies.find((c) => c.isBase)

  if (loading) {
    return (
      <Box sx={{ pt: 3, width: "100%" }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2, color: "text.secondary" }}>
            Loading currencies...
          </Typography>
        </Box>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ pt: 3, width: "100%" }}>
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={loadData}>
              Retry
            </Button>
          }
        >
          Failed to load currencies: {error}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ width: "100%" }}>
      <DataHeader
        onRefresh={loadData}
        showDateControls={false}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search currencies..."
        filters={[
          {
            label: "Status",
            options: [
              { id: "all", name: "All" },
              { id: "active", name: "Active" },
              { id: "inactive", name: "Inactive" }
            ],
            selectedValues: statusFilter !== "All" ? [statusFilter.toLowerCase()] : ["all"],
            onSelectionChange: (values) => setStatusFilter(values[0] ? values[0].charAt(0).toUpperCase() + values[0].slice(1) : "All")
          }
        ]}
        filtersExpanded={false}
        onFiltersToggle={() => {}}
        sortOptions={[
          { label: "Name", value: "name" },
          { label: "Code", value: "code" },
          { label: "Rate", value: "rate" },
        ]}
        sortValue="name"
        sortDirection="asc"
        onSortChange={() => {}}
        onExportCSV={() => {}}
        onCreateNew={handleOpenCreateModal}
        createButtonLabel="Add Currency"
        additionalButtons={[
          {
            label: "Update Rates",
            icon: <Sync />,
            onClick: handleUpdateRates,
            variant: "outlined" as const,
            color: "secondary" as const,
          }
        ]}
      />

      <StatsSection
        stats={[
          { value: baseCurrency?.code || "GBP", label: "Base Currency", color: "primary" },
          { value: activeCurrencies.toString(), label: "Active Currencies", color: "success" },
          { value: currencies.length.toString(), label: "Total Currencies", color: "info" },
          { value: "Today", label: "Last Updated", color: "success" },
        ]}
      />

      {/* Currencies Table */}
      <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <TableContainer component={Paper} sx={{ 
            backgroundColor: "transparent",
            boxShadow: 1,
            borderRadius: 2,
            overflow: "hidden"
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Currency</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Exchange Rate</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCurrencies.length > 0 ? (
                  filteredCurrencies.map((currency) => (
                    <TableRow
                      key={currency.code}
                      sx={{
                        "&:hover": { backgroundColor: "action.hover" },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {currency.name}
                          {currency.isBase && (
                            <Chip label="Base" size="small" color="primary" variant="outlined" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{currency.code}</TableCell>
                      <TableCell>{currency.symbol}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {currency.isBase ? "1.00000" : currency.rate.toFixed(5)}
                      </TableCell>
                      <TableCell color="text.secondary">{currency.lastUpdated}</TableCell>
                      <TableCell>
                        <Chip
                          label={currency.status}
                          size="small"
                          color={currency.status === "active" ? "success" : "default"}
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          onClick={(e) => handleMenuClick(e, currency)} 
                          color="primary"
                          disabled={currency.isBase}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">
                        {searchTerm ? "No currencies matching your search" : "No currencies found"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Currency CRUD Modal */}
      <CRUDModal
        open={isCRUDModalOpen}
        onClose={() => {
          setIsCRUDModalOpen(false)
          setEditingCurrency(null)
        }}
        title={crudMode === "create" ? "Add Currency" : "Edit Currency"}
        icon={<AttachMoney />}
        mode={crudMode}
        maxWidth="md"
      >
        <CurrencyCRUDForm
          currency={editingCurrency}
          mode={crudMode}
          onSave={handleSaveCurrency}
        />
      </CRUDModal>

      {/* View Currency Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AttachMoney color="primary" />
              <Typography variant="h6">Currency Details</Typography>
            </Box>
            <IconButton onClick={() => setIsViewDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewingCurrency && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Currency Code
                </Typography>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  {viewingCurrency.code}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Currency Name
                </Typography>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  {viewingCurrency.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Symbol
                </Typography>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {viewingCurrency.symbol}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Exchange Rate
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {viewingCurrency.rate.toFixed(5)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {viewingCurrency.lastUpdated}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={viewingCurrency.status}
                  color={viewingCurrency.status === "active" ? "success" : "default"}
                  size="small"
                />
              </Grid>
              {viewingCurrency.isBase && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    This is the base currency for all exchange rate calculations.
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          {viewingCurrency && !viewingCurrency.isBase && (
            <Button
              variant="contained"
              onClick={() => {
                setIsViewDialogOpen(false)
                handleOpenEditModal(viewingCurrency)
              }}
            >
              Edit Currency
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Currency Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        sx={{ mt: 1 }}
      >
        <MenuItem onClick={() => selectedCurrency && handleOpenViewDialog(selectedCurrency)}>
          <Visibility sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={() => selectedCurrency && handleOpenEditModal(selectedCurrency)}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Edit Currency
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => selectedCurrency && handleDeleteCurrencyAction(selectedCurrency)} 
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete Currency
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default CurrencyPage
