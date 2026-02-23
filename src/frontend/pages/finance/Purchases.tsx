"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
  Chip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material"
import {
  MoreVert,
  ShoppingCart,
  CheckCircle,
  Edit,
  Delete,
  Visibility,
  Receipt,
  Close,
  Add,
} from "@mui/icons-material"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
} from "@mui/material"

import { useFinance } from "../../../backend/context/FinanceContext"
import DataHeader from "../../components/reusable/DataHeader"
import StatsSection from "../../components/reusable/StatsSection"
import CRUDModal from "../../components/reusable/CRUDModal"
import BillCRUDForm from "../../components/finance/forms/BillCRUDForm"
import type { Bill } from "../../../backend/interfaces/Finance"

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

const Purchases: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  
  const [] = useState(new Date())
  
  // CRUD Modal states
  const [isCRUDModalOpen, setIsCRUDModalOpen] = useState(false)
  const [crudMode, setCrudMode] = useState<"create" | "edit" | "view">("create")
  const [editingBill, setEditingBill] = useState<Bill | null>(null)

  // View Dialog state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingBill, setViewingBill] = useState<Bill | null>(null)
  
  const { 
    state: financeState, 
    refreshBills, 
    deleteBill, 
    createBill, 
    updateBill,
    approveBill,
    markBillPaid,
  } = useFinance()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await refreshBills()
    } catch (error) {
      console.error("Error loading purchases data:", error)
    }
  }

  const bills = financeState.bills || []
  // Suppliers are now accessed from financeState.contacts (type: supplier)
  const loading = financeState.loading
  const error = financeState.error

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, bill: Bill) => {
    setAnchorEl(event.currentTarget)
    setSelectedBill(bill)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedBill(null)
  }
  
  // CRUD Handlers
  const handleOpenCreateModal = () => {
    setCrudMode("create")
    setEditingBill(null)
    setIsCRUDModalOpen(true)
  }

  const handleOpenEditModal = (bill: Bill) => {
    setCrudMode("edit")
    setEditingBill(bill)
    setIsCRUDModalOpen(true)
    handleMenuClose()
  }

  const handleOpenViewDialog = (bill: Bill) => {
    setViewingBill(bill)
    setIsViewDialogOpen(true)
    handleMenuClose()
  }

  // Form submit handler
  const handleSaveBill = async (data: any) => {
    try {
      if (crudMode === "create") {
        await createBill(data)
      } else if (crudMode === "edit" && editingBill) {
        await updateBill(editingBill.id, data)
      }
      await refreshBills()
      setIsCRUDModalOpen(false)
      setEditingBill(null)
    } catch (error) {
      console.error("Error saving bill:", error)
      throw error
    }
  }

  const handleDeleteBillAction = async (bill: Bill) => {
    if (!window.confirm(`Are you sure you want to delete bill ${bill.reference}? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteBill(bill.id)
      await refreshBills()
      handleMenuClose()
    } catch (error) {
      console.error("Error deleting bill:", error)
      alert("Failed to delete bill. Please try again.")
    }
  }

  const handleApproveBillAction = async (bill: Bill) => {
    try {
      await approveBill(bill.id)
      await refreshBills()
      handleMenuClose()
    } catch (error) {
      console.error("Error approving bill:", error)
      alert("Failed to approve bill. Please try again.")
    }
  }

  const handleMarkAsPaidAction = async (bill: Bill) => {
    try {
      await markBillPaid(bill.id, bill.totalAmount)
      await refreshBills()
      handleMenuClose()
    } catch (error) {
      console.error("Error marking bill as paid:", error)
      alert("Failed to mark bill as paid. Please try again.")
    }
  }

  // Date filtering helper (currently disabled - no date controls)
  const isDateInRange = (_date: string) => {
    return true // No date filtering when date controls are disabled
  }

  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      (bill.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (bill.description?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    const matchesStatus = statusFilter === "All" || bill.status === statusFilter.toLowerCase()
    const matchesDate = isDateInRange(bill.receiveDate || bill.dueDate)
    return matchesSearch && matchesStatus && matchesDate
  })

  const totalPending = bills
    .filter((bill) => bill.status === "pending" || bill.status === "approved")
    .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0)

  const overdueBills = bills.filter((bill) => {
    const today = new Date().toISOString().split("T")[0]
    return bill.status !== "paid" && bill.dueDate < today
  })

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 0 }}>
      <DataHeader
        onRefresh={refreshBills}
        showDateControls={false}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search bills..."
        filters={[
          {
            label: "Status",
            options: [
              { id: "all", name: "All" },
              { id: "pending", name: "Pending" },
              { id: "approved", name: "Approved" },
              { id: "paid", name: "Paid" },
              { id: "overdue", name: "Overdue" }
            ],
            selectedValues: statusFilter !== "All" ? [statusFilter.toLowerCase()] : ["all"],
            onSelectionChange: (values) => setStatusFilter(values[0] ? values[0].charAt(0).toUpperCase() + values[0].slice(1) : "All")
          }
        ]}
        filtersExpanded={false}
        onFiltersToggle={() => {}}
        sortOptions={[
          { value: "receiveDate", label: "Receive Date" },
          { value: "dueDate", label: "Due Date" },
          { value: "amount", label: "Amount" },
          { value: "supplier", label: "Supplier" },
          { value: "status", label: "Status" }
        ]}
        sortValue="receiveDate"
        sortDirection="desc"
        onSortChange={() => {}}
        onExportCSV={() => {}}
        onCreateNew={handleOpenCreateModal}
        createButtonLabel="Add Bill"
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
              Bills
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
              Purchase Orders
            </Button>
          </Box>
        }
      />

      <StatsSection
        stats={[
          { value: `£${totalPending.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, label: "Total Pending", color: "warning" },
          { value: bills.length.toString(), label: "Total Bills", color: "primary" },
          { value: overdueBills.length.toString(), label: "Overdue", color: "error" },
          { value: `£${bills.filter(bill => bill.status === "paid").reduce((sum, bill) => sum + (bill.totalAmount || 0), 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, label: "Paid This Month", color: "success" },
        ]}
      />


      <TabPanel value={activeTab} index={0}>
        <Box sx={{ px: 3 }}>
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell color="text.secondary">Bill #</TableCell>
                    <TableCell color="text.secondary">Supplier</TableCell>
                    <TableCell color="text.secondary">Description</TableCell>
                    <TableCell color="text.secondary">Amount</TableCell>
                    <TableCell color="text.secondary">Receive Date</TableCell>
                    <TableCell color="text.secondary">Due Date</TableCell>
                    <TableCell color="text.secondary">Status</TableCell>
                    <TableCell color="text.secondary"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBills.map((bill) => (
                    <TableRow
                      key={bill.id}
                      hover
                    >
                      <TableCell sx={{ fontWeight: 500 }}>{bill.id}</TableCell>
                      <TableCell>{bill.supplierName}</TableCell>
                      <TableCell color="text.secondary">{bill.description}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>${(bill.totalAmount || 0).toLocaleString()}</TableCell>
                      <TableCell color="text.secondary">{bill.receiveDate}</TableCell>
                      <TableCell color="text.secondary">{bill.dueDate}</TableCell>
                      <TableCell>
                        <Chip
                          label={bill.status}
                          size="small"
                          color={
                            bill.status === "paid"
                              ? "success"
                              : bill.status === "pending"
                              ? "primary"
                              : "error"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={(e) => handleMenuClick(e, bill)}>
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Box sx={{ px: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ textAlign: "center", py: 8 }}>
                <ShoppingCart sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                <Typography variant="h6" fontWeight="medium" gutterBottom>
                  No Purchase Orders Yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create purchase orders to track inventory purchases
                </Typography>
                <Button variant="contained" startIcon={<Add />} color="primary">
                  Create Purchase Order
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Bill CRUD Modal */}
      <CRUDModal
        open={isCRUDModalOpen}
        onClose={() => {
          setIsCRUDModalOpen(false)
          setEditingBill(null)
        }}
        title={crudMode === "create" ? "Create Bill" : "Edit Bill"}
        icon={<Receipt />}
        mode={crudMode}
        maxWidth="md"
      >
        <BillCRUDForm
          bill={editingBill}
          mode={crudMode}
          onSave={handleSaveBill}
        />
      </CRUDModal>

      {/* View Bill Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Receipt color="primary" />
              <Typography variant="h6">Bill Details</Typography>
            </Box>
            <IconButton onClick={() => setIsViewDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewingBill && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Bill Reference
                </Typography>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  {viewingBill.reference}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Supplier
                </Typography>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  {viewingBill.supplierName}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {viewingBill.description}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  ${viewingBill.subtotal.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Tax Amount
                </Typography>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  ${viewingBill.taxAmount.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="error.main">
                  ${viewingBill.totalAmount.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Currency
                </Typography>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  {viewingBill.currency}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Receive Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {viewingBill.receiveDate}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Due Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {viewingBill.dueDate}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={viewingBill.status}
                  color={
                    viewingBill.status === "paid" ? "success" :
                    viewingBill.status === "approved" ? "primary" :
                    viewingBill.status === "pending" ? "warning" :
                    "error"
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
              if (viewingBill) {
                setIsViewDialogOpen(false)
                handleOpenEditModal(viewingBill)
              }
            }}
          >
            Edit Bill
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bill Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => selectedBill && handleOpenViewDialog(selectedBill)}>
          <Visibility sx={{ mr: 1 }} fontSize="small" /> View Details
        </MenuItem>
        <MenuItem onClick={() => selectedBill && handleOpenEditModal(selectedBill)}>
          <Edit sx={{ mr: 1 }} fontSize="small" /> Edit
        </MenuItem>
        {selectedBill?.status === "pending" && (
          <MenuItem onClick={() => selectedBill && handleApproveBillAction(selectedBill)}>
            <CheckCircle sx={{ mr: 1 }} fontSize="small" /> Approve
        </MenuItem>
        )}
        {(selectedBill?.status === "pending" || selectedBill?.status === "approved") && (
          <MenuItem onClick={() => selectedBill && handleMarkAsPaidAction(selectedBill)}>
            <CheckCircle sx={{ mr: 1 }} fontSize="small" /> Mark as Paid
        </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => selectedBill && handleDeleteBillAction(selectedBill)} sx={{ color: "error.main" }}>
          <Delete sx={{ mr: 1 }} fontSize="small" /> Delete
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default Purchases
