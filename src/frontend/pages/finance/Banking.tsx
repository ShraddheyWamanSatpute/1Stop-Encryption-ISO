"use client"

import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  TextField,
  Checkbox,
  FormControlLabel,
  Stack,
} from "@mui/material"
import {
  MoreVert,
  Visibility,
  VisibilityOff,
  Sync,
  Edit,
  Delete,
  AccountBalance,
  Close,
  CheckCircle,
  Download,
} from "@mui/icons-material"

import { useFinance } from "../../../backend/context/FinanceContext"
import DataHeader from "../../components/reusable/DataHeader"
import StatsSection from "../../components/reusable/StatsSection"
import CRUDModal from "../../components/reusable/CRUDModal"
import BankAccountCRUDForm from "../../components/finance/forms/BankAccountCRUDForm"
import type { BankAccount } from "../../../backend/interfaces/Finance"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

const Banking = () => {
  const [showBalances, setShowBalances] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState(0)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
  
  const { 
    state: financeState, 
    refreshBankAccounts, 
    refreshTransactions,
    refreshBankReconciliations,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    fetchBankAccountDetail,
    startReconciliation,
    reconcileTransaction,
  } = useFinance()
  
  const [] = useState(new Date())

  // CRUD Modal states
  const [isCRUDModalOpen, setIsCRUDModalOpen] = useState(false)
  const [crudMode, setCrudMode] = useState<"create" | "edit" | "view">("create")
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)

  // View Dialog state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingAccount, setViewingAccount] = useState<BankAccount | null>(null)

  // Reconciliation Dialog state
  const [isReconcileDialogOpen, setIsReconcileDialogOpen] = useState(false)
  const [reconcilingAccount, setReconcilingAccount] = useState<BankAccount | null>(null)
  const [statementBalance, setStatementBalance] = useState("")
  const [statementDate, setStatementDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      await Promise.all([
        refreshBankAccounts(),
        refreshTransactions(),
        refreshBankReconciliations(),
      ])
    } catch (error) {
      console.error("Error loading banking data:", error)
    }
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, account: BankAccount) => {
    setAnchorEl(event.currentTarget)
    setSelectedAccount(account)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedAccount(null)
  }

  // Date filtering helper for transactions (currently disabled - no date controls)
  const isDateInRange = (_date: string) => {
    return true // No date filtering when date controls are disabled
  }

  // CRUD Handlers
  const handleOpenCreateModal = () => {
    setCrudMode("create")
    setEditingAccount(null)
    setIsCRUDModalOpen(true)
  }

  const handleOpenEditModal = async (account: BankAccount) => {
    setCrudMode("edit")
    // Fetch full account (decrypted) for edit - list returns non-sensitive only
    const full = await fetchBankAccountDetail(account.id)
    setEditingAccount((full ?? account) as BankAccount)
    setIsCRUDModalOpen(true)
    handleMenuClose()
  }

  const handleOpenViewDialog = async (account: BankAccount) => {
    const full = await fetchBankAccountDetail(account.id)
    setViewingAccount((full ?? account) as BankAccount)
    setIsViewDialogOpen(true)
    handleMenuClose()
  }

  // Form submit handler
  const handleSaveBankAccount = async (data: any) => {
    try {
      if (crudMode === "create") {
        await createBankAccount(data)
      } else if (crudMode === "edit" && editingAccount) {
        await updateBankAccount(editingAccount.id, data)
      }
      await refreshBankAccounts()
      setIsCRUDModalOpen(false)
      setEditingAccount(null)
    } catch (error) {
      console.error("Error saving bank account:", error)
      throw error
    }
  }

  const handleDeleteAccount = async (account: BankAccount) => {
    if (!window.confirm(`Are you sure you want to delete ${account.name}? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteBankAccount(account.id)
      await refreshBankAccounts()
      handleMenuClose()
    } catch (error) {
      console.error("Error deleting bank account:", error)
      alert("Failed to delete account. It may have associated transactions.")
    }
  }

  // Reconciliation Handlers
  const handleOpenReconciliation = (account: BankAccount) => {
    setReconcilingAccount(account)
    setStatementBalance("")
    setStatementDate(new Date().toISOString().split('T')[0])
    setSelectedTransactions(new Set())
    setIsReconcileDialogOpen(true)
    handleMenuClose()
  }

  const handleToggleTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions)
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId)
    } else {
      newSelected.add(transactionId)
    }
    setSelectedTransactions(newSelected)
  }

  const handleStartReconciliation = async () => {
    if (!reconcilingAccount) return

    try {
      await startReconciliation(
        reconcilingAccount.id,
        new Date(statementDate),
        parseFloat(statementBalance),
        "Current User" // In production, use actual user name
      )
      
      // Mark selected transactions as reconciled
      for (const transactionId of selectedTransactions) {
        await reconcileTransaction(transactionId, `STMT-${Date.now()}`)
      }
      
      await Promise.all([
        refreshBankAccounts(),
        refreshTransactions(),
        refreshBankReconciliations(),
      ])
      
      setIsReconcileDialogOpen(false)
      alert("Reconciliation completed successfully!")
    } catch (error) {
      console.error("Error during reconciliation:", error)
      alert("Failed to complete reconciliation. Please try again.")
    }
  }

  const filteredAccounts = financeState.bankAccounts.filter(
    (account) =>
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.bank.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredTransactions = financeState.transactions.filter(
    (transaction) => isDateInRange(transaction.date)
  )

  const totalBalance = financeState.bankAccounts.reduce((sum, account) => sum + (account.balance || 0), 0)

  // Loading state UI
  if (financeState.loading) {
    return (
      <Box sx={{ pt: 3, width: "100%" }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2, color: "text.secondary" }}>
            Loading banking data...
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
           Failed to load banking data: {financeState.error}
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
        onCreateNew={handleOpenCreateModal}
        createButtonLabel="Add Account"
        additionalButtons={[
          {
            label: showBalances ? "Hide Balances" : "Show Balances",
            icon: showBalances ? <VisibilityOff /> : <Visibility />,
            onClick: () => setShowBalances(!showBalances),
            variant: "outlined" as const,
            color: "secondary" as const
          }
        ]}
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
              Accounts
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
              Transactions
            </Button>
            <Button
              variant={activeTab === 2 ? "contained" : "outlined"}
              size="small"
              onClick={() => setActiveTab(2)}
              sx={
                activeTab === 2
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
              Reconciliation
            </Button>
          </Box>
        }
      />
        {/* All summary cards and TabPanels below are inside this parent Box */}


      <StatsSection
        stats={[
          { value: financeState.bankAccounts.length.toString(), label: "Total Accounts", color: "primary" },
          { value: showBalances ? `£${totalBalance.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "••••••", label: "Total Balance", color: "success" },
          { value: financeState.bankAccounts.filter(acc => acc.status === "active").length.toString(), label: "Active Accounts", color: "success" },
          { value: new Set(financeState.bankAccounts.map(acc => acc.bank)).size.toString(), label: "Banks", color: "info" },
        ]}
      />

      <TabPanel value={activeTab} index={0}>
        <Box>
          <Card>
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
                      <TableCell>Bank</TableCell>
                      <TableCell>Account Name</TableCell>
                      <TableCell>Account Number</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Balance</TableCell>
                      <TableCell>Status</TableCell>
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
                          <TableCell sx={{ fontWeight: 500 }}>{account.bank}</TableCell>
                          <TableCell>{account.name}</TableCell>
                          <TableCell>
                            {showBalances ? account.accountNumber : "••••" + account.accountNumber.slice(-4)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={account.type}
                              size="small"
                              color={
                                account.type === "checking" ? "primary" :
                                account.type === "savings" ? "success" :
                                account.type === "credit" ? "error" :
                                "secondary"
                              }
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 500, color: account.balance < 0 ? "error.main" : "inherit" }}>
                            {showBalances ? `£${account.balance.toLocaleString()}` : "••••••"}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={account.status}
                              size="small"
                              variant="outlined"
                              color={
                                account.status === "active" ? "success" :
                                account.status === "inactive" ? "default" :
                                "warning"
                              }
                            />
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
                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">
                            {searchTerm ? "No accounts matching your search" : "No bank accounts found"}
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
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Box>
          <Card sx={{ 
            boxShadow: 3,
            borderRadius: 2
          }}>
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
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((transaction) => (
                        <TableRow
                          key={transaction.id}
                          sx={{
                            "&:hover": { backgroundColor: "action.hover" },
                          }}
                        >
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{transaction.description}</TableCell>
                          <TableCell>-</TableCell>
                          
                          <TableCell>
                            <Chip
                              label={transaction.type === "sale" ? "Income" : transaction.type === "purchase" ? "Expense" : transaction.type}
                              size="small"
                              variant="outlined"
                              color={transaction.type === "sale" ? "success" : transaction.type === "purchase" ? "error" : "default"}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 500, color: transaction.type === "sale" ? "success.main" : "error.main" }}>
                            ${Math.abs(transaction.totalAmount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={transaction.status}
                              size="small"
                              color={transaction.status === "completed" ? "success" : "warning"}
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton color="primary">
                              <MoreVert />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">No transactions found</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Box>
          <Card sx={{ 
            boxShadow: 3,
            borderRadius: 2
          }}>
            <CardContent>
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Sync sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                <Typography variant="h6" fontWeight="medium" gutterBottom>
                  Start Reconciliation
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Compare your records with bank statements to ensure accuracy
                </Typography>
                <Button variant="contained" startIcon={<Sync />} color="primary">
                  Begin Reconciliation
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>
      
      {/* Bank Account CRUD Modal */}
      <CRUDModal
        open={isCRUDModalOpen}
        onClose={() => {
          setIsCRUDModalOpen(false)
          setEditingAccount(null)
        }}
        title={crudMode === "create" ? "Add Bank Account" : "Edit Bank Account"}
        icon={<AccountBalance />}
        mode={crudMode}
        maxWidth="md"
      >
        <BankAccountCRUDForm
          bankAccount={editingAccount}
          mode={crudMode}
          onSave={handleSaveBankAccount}
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
                  Bank Name
                </Typography>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  {viewingAccount.bank}
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
                  Account Number
                </Typography>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  {viewingAccount.accountNumber}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Account Type
                </Typography>
                <Chip
                  label={viewingAccount.type}
                  color={
                    viewingAccount.type === "checking" ? "primary" :
                    viewingAccount.type === "savings" ? "success" :
                    viewingAccount.type === "credit" ? "error" :
                    "secondary"
                  }
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Currency
                </Typography>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  {viewingAccount.currency}
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
                  label={viewingAccount.status}
                  color={
                    viewingAccount.status === "active" ? "success" :
                    viewingAccount.status === "inactive" ? "default" :
                    "warning"
                  }
                  size="small"
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

      {/* Reconciliation Dialog */}
      <Dialog
        open={isReconcileDialogOpen}
        onClose={() => setIsReconcileDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Sync color="primary" />
              <Typography variant="h6">Bank Reconciliation</Typography>
            </Box>
            <IconButton onClick={() => setIsReconcileDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {reconcilingAccount && (
            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Account: {reconcilingAccount.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Current Balance: ${reconcilingAccount.balance.toLocaleString()}
              </Typography>

              <Stack spacing={3}>
                <TextField
                  label="Statement Date"
                  type="date"
                  value={statementDate}
                  onChange={(e) => setStatementDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Statement Balance"
                  type="number"
                  value={statementBalance}
                  onChange={(e) => setStatementBalance(e.target.value)}
                  fullWidth
                  helperText="Enter the closing balance from your bank statement"
                />

                <Divider />

                <Typography variant="subtitle2" fontWeight="medium">
                  Select Transactions to Reconcile
                </Typography>

                <Box sx={{ maxHeight: 300, overflow: "auto" }}>
                  {filteredTransactions
                    .filter(t => !t.reconciledAt)
                    .map((transaction) => (
                      <FormControlLabel
                        key={transaction.id}
                        control={
                          <Checkbox
                            checked={selectedTransactions.has(transaction.id)}
                            onChange={() => handleToggleTransaction(transaction.id)}
                          />
                        }
                        label={
                          <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                            <Box>
                              <Typography variant="body2">{transaction.description}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {transaction.date}
                              </Typography>
                            </Box>
                            <Typography 
                              variant="body2" 
                              fontWeight="medium"
                              color={transaction.type === "sale" ? "success.main" : "error.main"}
                            >
                              ${Math.abs(transaction.totalAmount || 0).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                        sx={{ width: "100%", mb: 1 }}
                      />
                    ))}
                </Box>

                <Box sx={{ bgcolor: "background.default", p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Selected Transactions: {selectedTransactions.size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Statement Balance: ${parseFloat(statementBalance || "0").toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsReconcileDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleStartReconciliation}
            disabled={!statementBalance || selectedTransactions.size === 0}
            startIcon={<CheckCircle />}
          >
            Complete Reconciliation
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Account actions menu */}
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
        <MenuItem onClick={() => selectedAccount && handleOpenReconciliation(selectedAccount)}>
          <Sync sx={{ mr: 1 }} fontSize="small" />
          Reconcile
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Download sx={{ mr: 1 }} fontSize="small" />
          Download Statements
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => selectedAccount && handleDeleteAccount(selectedAccount)} 
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete Account
        </MenuItem>
      </Menu>
    </Box>
  )
}
export default Banking
