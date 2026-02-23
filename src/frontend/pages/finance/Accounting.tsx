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
  AccountBalance,
  Visibility,
  Edit,
  Delete,
  Close,
} from "@mui/icons-material"

import { useFinance } from "../../../backend/context/FinanceContext"
import DataHeader from "../../components/reusable/DataHeader"
import StatsSection from "../../components/reusable/StatsSection"
import CRUDModal from "../../components/reusable/CRUDModal"
import AccountCRUDForm from "../../components/finance/forms/AccountCRUDForm"
import type { Account } from "../../../backend/interfaces/Finance"


const Accounting: React.FC = () => {
  const { 
    state: financeState, 
    refreshAccounts, 
    refreshTransactions,
    createAccount,
    updateAccount,
    deleteAccount,
  } = useFinance()
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [accountTypeFilter, setAccountTypeFilter] = useState("All")
  const [activeTab, setActiveTab] = useState(0)

  // CRUD Modal states
  const [isCRUDModalOpen, setIsCRUDModalOpen] = useState(false)
  const [crudMode, setCrudMode] = useState<"create" | "edit" | "view">("create")
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  // View Dialog state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null)

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await Promise.all([
        refreshAccounts(),
        refreshTransactions(),
      ])
    } catch (error) {
      console.error("Error loading accounting data:", error)
    }
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, account: Account) => {
    setAnchorEl(event.currentTarget)
    setSelectedAccount(account)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedAccount(null)
  }

  // CRUD Handlers
  const handleOpenCreateModal = () => {
    setCrudMode("create")
    setEditingAccount(null)
    setIsCRUDModalOpen(true)
  }

  const handleOpenEditModal = (account: Account) => {
    setCrudMode("edit")
    setEditingAccount(account)
    setIsCRUDModalOpen(true)
    handleMenuClose()
  }

  const handleOpenViewDialog = (account: Account) => {
    setViewingAccount(account)
    setIsViewDialogOpen(true)
    handleMenuClose()
  }

  // Form submit handler
  const handleSaveAccount = async (data: any) => {
    try {
      if (crudMode === "create") {
        await createAccount(data)
      } else if (crudMode === "edit" && editingAccount) {
        await updateAccount(editingAccount.id, data)
      }
      await refreshAccounts()
      setIsCRUDModalOpen(false)
      setEditingAccount(null)
    } catch (error) {
      console.error("Error saving account:", error)
      throw error
    }
  }

  const handleDeleteAccountAction = async (account: Account) => {
    if (!window.confirm(`Are you sure you want to delete account ${account.name}? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteAccount(account.id)
      await refreshAccounts()
      handleMenuClose()
    } catch (error) {
      console.error("Error deleting account:", error)
      alert("Failed to delete account. It may have associated transactions.")
    }
  }

  // Date filtering helper (currently unused but kept for future date-based filtering)
  // const isDateInRange = (date: string) => {
  //   const accountDate = new Date(date)
  //   
  //   switch (dateType) {
  //     case "day":
  //       return accountDate.toDateString() === currentDate.toDateString()
  //     case "week":
  //       const weekStart = new Date(currentDate)
  //       weekStart.setDate(currentDate.getDate() - currentDate.getDay())
  //       const weekEnd = new Date(weekStart)
  //       weekEnd.setDate(weekStart.getDate() + 6)
  //       return accountDate >= weekStart && accountDate <= weekEnd
  //     case "month":
  //       return accountDate.getMonth() === currentDate.getMonth() && 
  //              accountDate.getFullYear() === currentDate.getFullYear()
  //     case "custom":
  //       return true
  //     default:
  //       return true
  //   }
  // }

  // Calculate summary metrics
  const accounts = financeState.accounts || []
  const transactions = financeState.transactions || []
  
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch = acc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         acc.code?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = accountTypeFilter === "All" || acc.type === accountTypeFilter.toLowerCase()
    return matchesSearch && matchesType
  })
  
  const totalAssets = accounts.filter((acc) => acc.type === "asset").reduce((sum, acc) => sum + (acc.balance || 0), 0)
  const totalLiabilities = Math.abs(
    accounts.filter((acc) => acc.type === "liability").reduce((sum, acc) => sum + (acc.balance || 0), 0)
  )
  const totalEquity = accounts.filter((acc) => acc.type === "equity").reduce((sum, acc) => sum + (acc.balance || 0), 0)
  const totalRevenue = accounts.filter((acc) => acc.type === "revenue").reduce((sum, acc) => sum + (acc.balance || 0), 0)

  // Loading state UI
  if (financeState.loading) {
    return (
      <Box sx={{ pt: 3, width: "100%" }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2, color: "text.secondary" }}>
            Loading accounting data...
          </Typography>
        </Box>
      </Box>
    )
  }

  // Error state UI
  if (financeState.error) {
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
          Failed to load accounting data: {financeState.error}
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
        searchPlaceholder="Search accounts..."
        filters={[
          {
            label: "Account Type",
            options: [
              { id: "all", name: "All" },
              { id: "asset", name: "Asset" },
              { id: "liability", name: "Liability" },
              { id: "equity", name: "Equity" },
              { id: "revenue", name: "Revenue" },
              { id: "expense", name: "Expense" }
            ],
            selectedValues: accountTypeFilter !== "All" ? [accountTypeFilter.toLowerCase()] : ["all"],
            onSelectionChange: (values) => setAccountTypeFilter(values[0] ? values[0].charAt(0).toUpperCase() + values[0].slice(1) : "All")
          }
        ]}
        filtersExpanded={false}
        onFiltersToggle={() => {}}
        sortOptions={[
          { label: "Name", value: "name" },
          { label: "Code", value: "code" },
          { label: "Balance", value: "balance" },
          { label: "Type", value: "type" }
        ]}
        sortValue="name"
        sortDirection="asc"
        onSortChange={() => {}}
        onExportCSV={() => {}}
        onCreateNew={handleOpenCreateModal}
        createButtonLabel="Add Account"
        additionalControls={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Button
              variant={activeTab === 0 ? "contained" : "outlined"}
              size="small"
              onClick={() => setActiveTab(0)}
              sx={
                activeTab === 0
                  ? { 
                      bgcolor: "white", 
                      color: "primary.main", 
                      "&:hover": { bgcolor: "grey.100" },
                      whiteSpace: "nowrap"
                    }
                  : { 
                      color: "white", 
                      borderColor: "rgba(255, 255, 255, 0.5)", 
                      "&:hover": { borderColor: "white", bgcolor: "rgba(255, 255, 255, 0.1)" },
                      whiteSpace: "nowrap"
                    }
              }
            >
              Chart of Accounts
            </Button>
            <Button
              variant={activeTab === 1 ? "contained" : "outlined"}
              size="small"
              onClick={() => setActiveTab(1)}
              sx={
                activeTab === 1
                  ? { 
                      bgcolor: "white", 
                      color: "primary.main", 
                      "&:hover": { bgcolor: "grey.100" },
                      whiteSpace: "nowrap"
                    }
                  : { 
                      color: "white", 
                      borderColor: "rgba(255, 255, 255, 0.5)", 
                      "&:hover": { borderColor: "white", bgcolor: "rgba(255, 255, 255, 0.1)" },
                      whiteSpace: "nowrap"
                    }
              }
            >
              Journal Entries
            </Button>
          </Box>
        }
      />

      <StatsSection
        stats={[
          { value: totalAssets, label: "Total Assets", color: "success", prefix: "£" },
          { value: totalLiabilities, label: "Total Liabilities", color: "error", prefix: "£" },
          { value: totalEquity, label: "Total Equity", color: "info", prefix: "£" },
          { value: totalRevenue, label: "Total Revenue", color: "success", prefix: "£" },
        ]}
      />

      {activeTab === 0 && (
        <Box sx={{ pt: 3 }}>
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
                      <TableCell>Code</TableCell>
                      <TableCell>Account Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Balance</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAccounts.length > 0 ? (
                      filteredAccounts.map((account) => (
                        <TableRow
                          key={account.id}
                          sx={{
                            "&:hover": { backgroundColor: "action.hover" },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 500 }}>{account.code}</TableCell>
                          <TableCell>{account.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={account.type}
                              size="small"
                              color={
                                account.type === "asset" ? "success" :
                                account.type === "liability" ? "error" :
                                account.type === "equity" ? "primary" :
                                account.type === "revenue" ? "info" :
                                "warning"
                              }
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell>{account.category}</TableCell>
                          <TableCell sx={{ fontWeight: 500, color: account.balance < 0 ? "error.main" : "inherit" }}>
                            £{Math.abs(account.balance).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <IconButton onClick={(e) => handleMenuClick(e, account)} color="primary">
                              <MoreVert />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">
                            {searchTerm ? "No accounts matching your search" : "No accounts found"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 1 && (
        <Box sx={{ pt: 3 }}>
          <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
              {transactions.length > 0 ? (
                <Box>
                  {transactions.slice(0, 10).map((transaction) => (
                    <Box key={transaction.id} sx={{ mb: 2, p: 2, backgroundColor: "action.hover", borderRadius: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                            {transaction.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {transaction.date} • {transaction.type}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body1"
                          sx={{
                            color: transaction.type === "sale" ? "success.main" : "error.main",
                            fontWeight: "bold",
                          }}
                        >
                          {transaction.type === "sale" ? "+" : "-"}£{(transaction.totalAmount || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography sx={{ color: "text.secondary", mt: 2, p: 2, bgcolor: "action.hover", borderRadius: 1, textAlign: "center" }}>
                  No journal entries found. Transactions will appear here as they're created.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Account CRUD Modal */}
      <CRUDModal
        open={isCRUDModalOpen}
        onClose={() => {
          setIsCRUDModalOpen(false)
          setEditingAccount(null)
        }}
        title={crudMode === "create" ? "Create New Account" : "Edit Account"}
        icon={<AccountBalance />}
        mode={crudMode}
        maxWidth="md"
      >
        <AccountCRUDForm
          account={editingAccount}
          mode={crudMode}
          onSave={handleSaveAccount}
        />
      </CRUDModal>

      {/* View Account Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AccountBalance color="primary" />
              <Typography variant="h6">Account Details</Typography>
            </Box>
            <IconButton onClick={() => setIsViewDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewingAccount && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Account Code
                </Typography>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  {viewingAccount.code}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Account Name
                </Typography>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  {viewingAccount.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Type
                </Typography>
                <Chip
                  label={viewingAccount.type}
                  color={
                    viewingAccount.type === "asset" ? "success" :
                    viewingAccount.type === "liability" ? "error" :
                    viewingAccount.type === "equity" ? "primary" :
                    viewingAccount.type === "revenue" ? "info" :
                    "warning"
                  }
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  {viewingAccount.category}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Current Balance
                </Typography>
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  color={viewingAccount.balance < 0 ? "error.main" : "success.main"}
                >
                  ${viewingAccount.balance.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={viewingAccount.isArchived ? "Archived" : "Active"}
                  color={viewingAccount.isArchived ? "default" : "success"}
                  size="small"
                />
              </Grid>
              {viewingAccount.description && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {viewingAccount.description}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (viewingAccount) {
                setIsViewDialogOpen(false)
                handleOpenEditModal(viewingAccount)
              }
            }}
          >
            Edit Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Account Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        sx={{ mt: 1 }}
      >
        <MenuItem onClick={() => selectedAccount && handleOpenViewDialog(selectedAccount)}>
          <Visibility sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={() => selectedAccount && handleOpenEditModal(selectedAccount)}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Edit Account
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => selectedAccount && handleDeleteAccountAction(selectedAccount)} 
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete Account
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default Accounting
