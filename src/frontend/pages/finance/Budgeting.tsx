"use client"

import React, { useState, useEffect } from "react"
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
  LinearProgress,
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
  MoreVert,
  Visibility,
  Edit,
  Delete,
  Close,
  AccountBalanceWallet,
} from "@mui/icons-material"

import { useFinance } from "../../../backend/context/FinanceContext"
import DataHeader from "../../components/reusable/DataHeader"
import StatsSection from "../../components/reusable/StatsSection"
import CRUDModal from "../../components/reusable/CRUDModal"
import BudgetCRUDForm from "../../components/finance/forms/BudgetCRUDForm"
import type { Budget } from "../../../backend/interfaces/Finance"

const Budgeting: React.FC = () => {
  const { 
    state: financeState, 
    refreshBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
  } = useFinance()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  
  // CRUD Modal states
  const [isCRUDModalOpen, setIsCRUDModalOpen] = useState(false)
  const [crudMode, setCrudMode] = useState<"create" | "edit" | "view">("create")
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

  // View Dialog state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingBudget, setViewingBudget] = useState<Budget | null>(null)

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await refreshBudgets()
    } catch (error) {
      console.error("Error loading budgets:", error)
    }
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, budget: Budget) => {
    setAnchorEl(event.currentTarget)
    setSelectedBudget(budget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedBudget(null)
  }

  // CRUD Handlers
  const handleOpenCreateModal = () => {
    setCrudMode("create")
    setEditingBudget(null)
    setIsCRUDModalOpen(true)
  }

  const handleOpenEditModal = (budget: Budget) => {
    setCrudMode("edit")
    setEditingBudget(budget)
    setIsCRUDModalOpen(true)
    handleMenuClose()
  }

  const handleOpenViewDialog = (budget: Budget) => {
    setViewingBudget(budget)
    setIsViewDialogOpen(true)
    handleMenuClose()
  }

  // Form submit handler
  const handleSaveBudget = async (data: any) => {
    try {
      if (crudMode === "create") {
        await createBudget(data)
      } else if (crudMode === "edit" && editingBudget) {
        await updateBudget(editingBudget.id, data)
      }
      await refreshBudgets()
      setIsCRUDModalOpen(false)
      setEditingBudget(null)
    } catch (error) {
      console.error("Error saving budget:", error)
      throw error
    }
  }

  const handleDeleteBudgetAction = async (budget: Budget) => {
    if (!window.confirm(`Are you sure you want to delete budget for ${budget.category}? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteBudget(budget.id)
      await refreshBudgets()
      handleMenuClose()
    } catch (error) {
      console.error("Error deleting budget:", error)
      alert("Failed to delete budget. Please try again.")
    }
  }

  const budgets = financeState.budgets || []
  const filteredBudgets = budgets.filter((budget) => {
    const matchesSearch = budget.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         budget.period?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "All" || budget.status === statusFilter.toLowerCase().replace(" ", "-")
    return matchesSearch && matchesStatus
  })
  
  const loading = financeState.loading
  const error = financeState.error

  const totalBudgeted = filteredBudgets.reduce((sum, budget) => sum + (budget.budgeted || 0), 0)
  const totalActual = filteredBudgets.reduce((sum, budget) => sum + (budget.actual || 0), 0)
  const totalVariance = totalBudgeted - totalActual
  const overBudgetCount = filteredBudgets.filter((b) => b.status === "over-budget").length

  if (loading) {
    return (
      <Box sx={{ pt: 3, width: "100%" }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2, color: "text.secondary" }}>
            Loading budgets...
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
          Failed to load budgets: {error}
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
        searchPlaceholder="Search budgets..."
        filters={[
          {
            label: "Status",
            options: [
              { id: "all", name: "All" },
              { id: "on-track", name: "On Track" },
              { id: "over-budget", name: "Over Budget" },
              { id: "under-budget", name: "Under Budget" }
            ],
            selectedValues: statusFilter !== "All" ? [statusFilter.toLowerCase().replace(" ", "-")] : ["all"],
            onSelectionChange: (values) => setStatusFilter(values[0] ? values[0].split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "All")
          }
        ]}
        filtersExpanded={false}
        onFiltersToggle={() => {}}
        sortOptions={[
          { label: "Category", value: "category" },
          { label: "Budgeted Amount", value: "budgeted" },
          { label: "Actual Amount", value: "actual" },
          { label: "Variance", value: "remaining" },
        ]}
        sortValue="category"
        sortDirection="asc"
        onSortChange={() => {}}
        onExportCSV={() => {}}
        onCreateNew={handleOpenCreateModal}
        createButtonLabel="Create Budget"
      />

      <StatsSection
        stats={[
          { value: `£${totalBudgeted.toLocaleString('en-GB')}`, label: "Total Budgeted", color: "primary" },
          { value: `£${totalActual.toLocaleString('en-GB')}`, label: "Total Actual", color: totalActual > totalBudgeted ? "error" : "success" },
          { value: `£${Math.abs(totalVariance).toLocaleString('en-GB')}`, label: totalVariance >= 0 ? "Under Budget" : "Over Budget", color: totalVariance < 0 ? "error" : "success" },
          { value: overBudgetCount.toString(), label: "Over Budget", color: "error" },
        ]}
      />

      {/* Budget Table */}
      <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
          <CardContent>
          <TableContainer component={Paper} sx={{
                backgroundColor: "transparent",
                boxShadow: 1,
                borderRadius: 2,
                overflow: "hidden",
          }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Budgeted</TableCell>
                    <TableCell>Actual</TableCell>
                  <TableCell>Variance</TableCell>
                  <TableCell>% Used</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                {filteredBudgets.length > 0 ? (
                  filteredBudgets.map((budget) => (
                      <TableRow
                        key={budget.id}
                        sx={{
                          "&:hover": { backgroundColor: "action.hover" },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 500 }}>{budget.category}</TableCell>
                        <TableCell>{budget.period}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>£{budget.budgeted.toLocaleString()}</TableCell>
                        <TableCell>£{budget.actual.toLocaleString()}</TableCell>
                        <TableCell
                        sx={{ 
                          color: budget.remaining < 0 ? "error.main" : "success.main", 
                          fontWeight: 500 
                        }}
                      >
                        {budget.remaining >= 0 ? "+" : ""}£{budget.remaining.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color={budget.percentage > 100 ? "error.main" : "text.primary"}
                        >
                          {budget.percentage.toFixed(1)}%
                        </Typography>
                        </TableCell>
                        <TableCell>
                        <Box sx={{ width: 100, position: "relative" }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(budget.percentage, 100)}
                              sx={{
                                height: 8,
                                borderRadius: 2,
                              backgroundColor: "action.hover",
                              "& .MuiLinearProgress-bar": {
                                backgroundColor: budget.percentage > 100 ? "error.main" : 
                                              budget.percentage >= 80 ? "warning.main" : 
                                              "primary.main",
                              }
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                          label={budget.status.replace("-", " ")}
                            size="small"
                            color={
                            budget.status === "over-budget" ? "error" :
                            budget.status === "on-track" ? "warning" :
                            "success"
                          }
                          variant="filled"
                          />
                        </TableCell>
                      <TableCell>
                        <IconButton onClick={(e) => handleMenuClick(e, budget)} color="primary">
                          <MoreVert />
                        </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">
                        {searchTerm ? "No budgets matching your search" : "No budgets found. Create your first budget to start tracking."}
                      </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

      {/* Budget CRUD Modal */}
      <CRUDModal
        open={isCRUDModalOpen}
        onClose={() => {
          setIsCRUDModalOpen(false)
          setEditingBudget(null)
        }}
        title={crudMode === "create" ? "Create Budget" : "Edit Budget"}
        icon={<AccountBalanceWallet />}
        mode={crudMode}
        maxWidth="md"
      >
        <BudgetCRUDForm
          budget={editingBudget}
          mode={crudMode}
          onSave={handleSaveBudget}
        />
      </CRUDModal>

      {/* View Budget Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AccountBalanceWallet color="primary" />
              <Typography variant="h6">Budget Details</Typography>
            </Box>
            <IconButton onClick={() => setIsViewDialogOpen(false)}>
              <Close />
            </IconButton>
      </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewingBudget && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  {viewingBudget.category}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Period
                </Typography>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  {viewingBudget.period}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Budgeted Amount
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  £{viewingBudget.budgeted.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Actual Spend
                </Typography>
                <Typography variant="h6" fontWeight="bold" color={viewingBudget.actual > viewingBudget.budgeted ? "error.main" : "success.main"}>
                  £{viewingBudget.actual.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Variance
                </Typography>
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  color={viewingBudget.remaining < 0 ? "error.main" : "success.main"}
                >
                  {viewingBudget.remaining >= 0 ? "+" : ""}£{viewingBudget.remaining.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Percentage Used
                </Typography>
                <Typography 
                  variant="h6" 
                  fontWeight="bold"
                  color={viewingBudget.percentage > 100 ? "error.main" : "text.primary"}
                >
                  {viewingBudget.percentage.toFixed(1)}%
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={viewingBudget.status.replace("-", " ")}
                  color={
                    viewingBudget.status === "over-budget" ? "error" :
                    viewingBudget.status === "near-limit" ? "warning" :
                    "success"
                  }
                  size="medium"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (viewingBudget) {
                setIsViewDialogOpen(false)
                handleOpenEditModal(viewingBudget)
              }
            }}
          >
            Edit Budget
          </Button>
        </DialogActions>
      </Dialog>

      {/* Budget Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        sx={{ mt: 1 }}
      >
        <MenuItem onClick={() => selectedBudget && handleOpenViewDialog(selectedBudget)}>
          <Visibility sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={() => selectedBudget && handleOpenEditModal(selectedBudget)}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Edit Budget
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => selectedBudget && handleDeleteBudgetAction(selectedBudget)} 
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete Budget
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default Budgeting
