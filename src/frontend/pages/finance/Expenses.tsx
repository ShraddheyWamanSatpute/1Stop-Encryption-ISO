"use client"

import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
} from "@mui/material"
import {
  MoreVert,
  Receipt,
  CheckCircle,
  Cancel,
  Edit,
  Delete,
  Visibility,
  CloudUpload,
  AccountBalance,
} from "@mui/icons-material"

import { useFinance } from "../../../backend/context/FinanceContext"
import DataHeader from "../../components/reusable/DataHeader"
import StatsSection from "../../components/reusable/StatsSection"
import CRUDModal from "../../components/reusable/CRUDModal"

const Expenses: React.FC = () => {
  const {
    state: financeState,
    refreshExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    approveExpense,
    rejectExpense,
    reimburseExpense,
  } = useFinance()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Date management
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dateType, setDateType] = useState<"day" | "week" | "month" | "custom">("month")

  const [expenseForm, setExpenseForm] = useState({
    employee: "",
    description: "",
    amount: 0,
    category: "",
    department: "",
    submitDate: new Date().toISOString().split("T")[0],
    receiptAttached: false,
    status: "pending" as "pending" | "approved" | "reimbursed" | "rejected",
  })

  // Expense categories
  const categories = [
    "Food & Beverage Supplies",
    "Utilities",
    "Fuel",
    "Maintenance",
    "Marketing",
    "Travel",
    "Office Supplies",
    "Equipment",
    "Professional Services",
    "Other",
  ]

  const departments = ["Rooms", "Restaurant", "Bar", "Kitchen", "Housekeeping", "Front Desk", "Management", "Other"]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await refreshExpenses()
    } catch (error) {
      console.error("Error loading expenses:", error)
    }
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, expenseId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedExpense(expenseId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const resetForm = () => {
    setExpenseForm({
      employee: "",
      description: "",
      amount: 0,
      category: "",
      department: "",
      submitDate: new Date().toISOString().split("T")[0],
      receiptAttached: false,
      status: "pending",
    })
  }

  // CREATE
  const handleCreateExpense = async () => {
    try {
      await createExpense(expenseForm)
      setCreateDialogOpen(false)
      resetForm()
      await refreshExpenses()
    } catch (error) {
      console.error("Error creating expense:", error)
    }
  }

  // EDIT
  const openEditDialog = (expense: any) => {
    setExpenseForm({
      employee: expense.employee || "",
      description: expense.description || "",
      amount: expense.amount || 0,
      category: expense.category || "",
      department: expense.department || "",
      submitDate: expense.submitDate || "",
      receiptAttached: expense.receiptAttached || false,
      status: expense.status || "pending",
    })
    setEditDialogOpen(true)
  }

  const handleEditExpense = async () => {
    if (!selectedExpense) return

    try {
      await updateExpense(selectedExpense, expenseForm)
      setEditDialogOpen(false)
      resetForm()
      await refreshExpenses()
      handleMenuClose()
    } catch (error) {
      console.error("Error updating expense:", error)
    }
  }

  // DELETE
  const openDeleteDialog = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return

    try {
      await deleteExpense(selectedExpense)
      setDeleteDialogOpen(false)
      await refreshExpenses()
      handleMenuClose()
    } catch (error) {
      console.error("Error deleting expense:", error)
    }
  }

  // VIEW
  const openViewDialog = (expenseId: string) => {
    setSelectedExpense(expenseId)
    setViewDialogOpen(true)
  }

  // Approval actions
  const handleApproveExpense = async (expenseId: string) => {
    try {
      await approveExpense(expenseId)
      await refreshExpenses()
      handleMenuClose()
    } catch (error) {
      console.error("Error approving expense:", error)
    }
  }

  const handleRejectExpense = async (expenseId: string) => {
    try {
      await rejectExpense(expenseId)
      await refreshExpenses()
      handleMenuClose()
    } catch (error) {
      console.error("Error rejecting expense:", error)
    }
  }

  const handleReimburseExpense = async (expenseId: string) => {
    try {
      await reimburseExpense(expenseId)
      await refreshExpenses()
      handleMenuClose()
    } catch (error) {
      console.error("Error reimbursing expense:", error)
    }
  }

  // Date filtering helper
  const isDateInRange = (date: string) => {
    const expenseDate = new Date(date)

    switch (dateType) {
      case "day":
        return expenseDate.toDateString() === currentDate.toDateString()
      case "week":
        const weekStart = new Date(currentDate)
        weekStart.setDate(currentDate.getDate() - currentDate.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return expenseDate >= weekStart && expenseDate <= weekEnd
      case "month":
        return (
          expenseDate.getMonth() === currentDate.getMonth() && expenseDate.getFullYear() === currentDate.getFullYear()
        )
      case "custom":
        return true
      default:
        return true
    }
  }

  const filteredExpenses = financeState.expenses.filter((expense) => {
    const matchesSearch =
      expense.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "All" || expense.status === statusFilter.toLowerCase()
    const matchesCategory = categoryFilter === "All" || expense.category === categoryFilter
    const matchesDate = isDateInRange(expense.submitDate)
    return matchesSearch && matchesStatus && matchesCategory && matchesDate
  })

  const pendingExpenses = filteredExpenses.filter((e) => e.status === "pending")
  const approvedExpenses = filteredExpenses.filter((e) => e.status === "approved")
  const reimbursedExpenses = filteredExpenses.filter((e) => e.status === "reimbursed")
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const pendingAmount = pendingExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)

  if (financeState.loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (financeState.error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{financeState.error}</Alert>
      </Box>
    )
  }

  const viewExpense = selectedExpense ? financeState.expenses.find((e) => e.id === selectedExpense) : null

  return (
    <Box sx={{ p: 0 }}>
      <DataHeader
        onRefresh={loadData}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        dateType={dateType}
        onDateTypeChange={setDateType}
        showDateControls={true}
        showDateTypeSelector={true}
        availableDateTypes={["day", "week", "month", "custom"]}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search expenses..."
        filters={[
          {
            label: "Status",
            options: [
              { id: "all", name: "All" },
              { id: "pending", name: "Pending" },
              { id: "approved", name: "Approved" },
              { id: "reimbursed", name: "Reimbursed" },
              { id: "rejected", name: "Rejected" },
            ],
            selectedValues: statusFilter !== "All" ? [statusFilter.toLowerCase()] : ["all"],
            onSelectionChange: (values) =>
              setStatusFilter(values[0] ? values[0].charAt(0).toUpperCase() + values[0].slice(1) : "All"),
          },
          {
            label: "Category",
            options: [{ id: "all", name: "All" }, ...categories.map((c) => ({ id: c, name: c }))],
            selectedValues: categoryFilter !== "All" ? [categoryFilter] : ["all"],
            onSelectionChange: (values) => setCategoryFilter(values[0] || "All"),
          },
        ]}
        filtersExpanded={false}
        onFiltersToggle={() => {}}
        sortOptions={[
          { value: "submitDate", label: "Submit Date" },
          { value: "amount", label: "Amount" },
          { value: "employee", label: "Employee" },
          { value: "category", label: "Category" },
        ]}
        sortValue="submitDate"
        sortDirection="desc"
        onSortChange={() => {}}
        onExportCSV={() => {}}
        onCreateNew={() => setCreateDialogOpen(true)}
        createButtonLabel="Submit Expense"
      />

      <StatsSection
        stats={[
          { value: `£${totalExpenses.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, label: "Total Expenses", color: "primary" },
          { value: `${pendingExpenses.length} (£${pendingAmount.toLocaleString('en-GB')})`, label: "Pending Approval", color: "warning" },
          { value: approvedExpenses.length.toString(), label: "Approved", color: "success" },
          { value: reimbursedExpenses.length.toString(), label: "Reimbursed", color: "info" },
        ]}
      />

        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Submit Date</TableCell>
                    <TableCell>Receipt</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                            {expense.employee?.charAt(0) || "?"}
                          </Avatar>
                          {expense.employee}
                        </Box>
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>
                        <Chip label={expense.category} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>£{expense.amount.toLocaleString()}</TableCell>
                      <TableCell>{expense.submitDate}</TableCell>
                      <TableCell>
                        {expense.receiptAttached ? (
                          <Chip label="Yes" size="small" color="success" />
                        ) : (
                          <Chip label="No" size="small" color="default" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={expense.status}
                          size="small"
                          color={
                            expense.status === "approved"
                              ? "success"
                              : expense.status === "pending"
                              ? "warning"
                              : expense.status === "reimbursed"
                              ? "info"
                              : "error"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={(e) => handleMenuClick(e, expense.id)}>
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No expenses found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            if (selectedExpense) openViewDialog(selectedExpense)
            handleMenuClose()
          }}
        >
          <Visibility sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            const expense = financeState.expenses.find((e) => e.id === selectedExpense)
            if (expense) openEditDialog(expense)
            handleMenuClose()
          }}
        >
          <Edit sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            if (selectedExpense) handleApproveExpense(selectedExpense)
          }}
        >
          <CheckCircle sx={{ mr: 1 }} color="success" /> Approve
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedExpense) handleReimburseExpense(selectedExpense)
          }}
        >
          <AccountBalance sx={{ mr: 1 }} color="info" /> Reimburse
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedExpense) handleRejectExpense(selectedExpense)
          }}
          sx={{ color: "error.main" }}
        >
          <Cancel sx={{ mr: 1 }} /> Reject
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            openDeleteDialog()
          }}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* CREATE Modal */}
      <CRUDModal
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false)
          resetForm()
        }}
        title="Submit New Expense"
        icon={<Receipt />}
        mode="create"
        onSave={handleCreateExpense}
        saveButtonText="Submit Expense"
        maxWidth="md"
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Employee Name"
              value={expenseForm.employee}
              onChange={(e) => setExpenseForm({ ...expenseForm, employee: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              multiline
              rows={3}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Submit Date"
              type="date"
              value={expenseForm.submitDate}
              onChange={(e) => setExpenseForm({ ...expenseForm, submitDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Department</InputLabel>
              <Select
                value={expenseForm.department}
                onChange={(e) => setExpenseForm({ ...expenseForm, department: e.target.value })}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Button variant="outlined" startIcon={<CloudUpload />} component="label">
                Upload Receipt
                <input type="file" hidden />
              </Button>
              <Typography variant="body2" color="text.secondary">
                {expenseForm.receiptAttached ? "Receipt attached" : "No receipt attached"}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CRUDModal>

      {/* EDIT Modal */}
      <CRUDModal
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
          resetForm()
        }}
        title="Edit Expense"
        icon={<Edit />}
        mode="edit"
        onSave={handleEditExpense}
        saveButtonText="Save Changes"
        maxWidth="md"
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Employee Name"
              value={expenseForm.employee}
              onChange={(e) => setExpenseForm({ ...expenseForm, employee: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              multiline
              rows={3}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Submit Date"
              type="date"
              value={expenseForm.submitDate}
              onChange={(e) => setExpenseForm({ ...expenseForm, submitDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Department</InputLabel>
              <Select
                value={expenseForm.department}
                onChange={(e) => setExpenseForm({ ...expenseForm, department: e.target.value })}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={expenseForm.status}
                onChange={(e) => setExpenseForm({ ...expenseForm, status: e.target.value as any })}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="reimbursed">Reimbursed</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CRUDModal>

      {/* VIEW Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: "primary.main" }}>
                <Receipt />
              </Avatar>
              <Box>
                <Typography variant="h6">Expense Details</Typography>
                <Typography variant="body2" color="text.secondary">
                  {viewExpense?.employee}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={viewExpense?.status}
              color={
                viewExpense?.status === "approved"
                  ? "success"
                  : viewExpense?.status === "pending"
                  ? "warning"
                  : viewExpense?.status === "reimbursed"
                  ? "info"
                  : "error"
              }
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Expense Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Employee" secondary={viewExpense?.employee} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Description" secondary={viewExpense?.description} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Category" secondary={viewExpense?.category} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Department" secondary={viewExpense?.department} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Submit Date" secondary={viewExpense?.submitDate} />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Receipt Attached"
                        secondary={viewExpense?.receiptAttached ? "Yes" : "No"}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Amount
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    £{viewExpense?.amount?.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {viewExpense?.status === "pending" && (
            <>
              <Button
                variant="outlined"
                color="success"
                onClick={() => {
                  if (selectedExpense) handleApproveExpense(selectedExpense)
                  setViewDialogOpen(false)
                }}
              >
                Approve
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  if (selectedExpense) handleRejectExpense(selectedExpense)
                  setViewDialogOpen(false)
                }}
              >
                Reject
              </Button>
            </>
          )}
          {viewExpense?.status === "approved" && (
            <Button
              variant="contained"
              onClick={() => {
                if (selectedExpense) handleReimburseExpense(selectedExpense)
                setViewDialogOpen(false)
              }}
            >
              Mark as Reimbursed
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* DELETE Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Expense?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone.
          </Alert>
          <Typography>Are you sure you want to delete this expense claim?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteExpense} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Expenses
