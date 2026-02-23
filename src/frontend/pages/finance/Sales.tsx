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
  Send,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  Email,
  Print,
  Download,
} from "@mui/icons-material"

import { useFinance } from "../../../backend/context/FinanceContext"
import DataHeader from "../../components/reusable/DataHeader"
import StatsSection from "../../components/reusable/StatsSection"
import CRUDModal from "../../components/reusable/CRUDModal"
const Sales: React.FC = () => {
  const {
    state: financeState,
    refreshInvoices,
    refreshContacts,
    createInvoice: addInvoice,
    updateInvoice,
    deleteInvoice,
    sendInvoice,
  } = useFinance()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [] = useState(new Date())

  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: "",
    customerId: "",
    customerName: "",
    description: "",
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
    dueDate: "",
    issueDate: new Date().toISOString().split("T")[0],
    paymentTerms: 30,
    notes: "",
    status: "draft" as "draft" | "sent" | "paid" | "overdue" | "cancelled",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await Promise.all([refreshInvoices(), refreshContacts()])
    } catch (error) {
      console.error("Error loading sales data:", error)
    }
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, invoiceId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedInvoice(invoiceId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const resetForm = () => {
    setInvoiceForm({
      invoiceNumber: "",
      customerId: "",
      customerName: "",
      description: "",
      subtotal: 0,
      taxAmount: 0,
      totalAmount: 0,
      dueDate: "",
      issueDate: new Date().toISOString().split("T")[0],
      paymentTerms: 30,
      notes: "",
      status: "draft",
    })
  }

  // CREATE
  const handleCreateInvoice = async () => {
    try {
      const customer = financeState.contacts.find((c) => c.id === invoiceForm.customerId)
      await addInvoice({
        invoiceNumber: invoiceForm.invoiceNumber || `INV-${Date.now()}`,
        customerId: invoiceForm.customerId,
        customerName: customer?.name || invoiceForm.customerName,
        customerEmail: customer?.email,
        description: invoiceForm.description,
        subtotal: invoiceForm.subtotal,
        taxAmount: invoiceForm.taxAmount,
        totalAmount: invoiceForm.subtotal + invoiceForm.taxAmount,
        currency: "GBP",
        lineItems: [],
        issueDate: invoiceForm.issueDate,
        dueDate: invoiceForm.dueDate,
        status: invoiceForm.status,
        paymentTerms: invoiceForm.paymentTerms,
        remindersSent: 0,
        notes: invoiceForm.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any)

      setCreateDialogOpen(false)
      resetForm()
      await refreshInvoices()
    } catch (error) {
      console.error("Error creating invoice:", error)
    }
  }

  // EDIT
  const openEditDialog = (invoice: any) => {
    setInvoiceForm({
      invoiceNumber: invoice.invoiceNumber || "",
      customerId: invoice.customerId || "",
      customerName: invoice.customerName || "",
      description: invoice.description || "",
      subtotal: invoice.subtotal || 0,
      taxAmount: invoice.taxAmount || 0,
      totalAmount: invoice.totalAmount || 0,
      dueDate: invoice.dueDate || "",
      issueDate: invoice.issueDate || "",
      paymentTerms: invoice.paymentTerms || 30,
      notes: invoice.notes || "",
      status: invoice.status || "draft",
    })
    setEditDialogOpen(true)
  }

  const handleEditInvoice = async () => {
    if (!selectedInvoice) return

    try {
      await updateInvoice(selectedInvoice, {
        ...invoiceForm,
        totalAmount: invoiceForm.subtotal + invoiceForm.taxAmount,
        updatedAt: new Date().toISOString(),
      })

      setEditDialogOpen(false)
      resetForm()
      await refreshInvoices()
      handleMenuClose()
    } catch (error) {
      console.error("Error updating invoice:", error)
    }
  }

  // DELETE
  const openDeleteDialog = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return

    try {
      await deleteInvoice(selectedInvoice)
      setDeleteDialogOpen(false)
      await refreshInvoices()
      handleMenuClose()
    } catch (error) {
      console.error("Error deleting invoice:", error)
    }
  }

  // VIEW
  const openViewDialog = (invoiceId: string) => {
    setSelectedInvoice(invoiceId)
    setViewDialogOpen(true)
  }

  // Other actions
  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await sendInvoice(invoiceId)
      await refreshInvoices()
      handleMenuClose()
    } catch (error) {
      console.error("Error sending invoice:", error)
    }
  }

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      await updateInvoice(invoiceId, {
        status: "paid",
        paidDate: new Date().toISOString().split("T")[0],
      })
      await refreshInvoices()
      handleMenuClose()
    } catch (error) {
      console.error("Error marking invoice as paid:", error)
    }
  }

  // Date filtering helper (currently disabled - no date controls)
  const isDateInRange = (_date: string) => {
    return true // No date filtering when date controls are disabled
  }

  const filteredInvoices = financeState.invoices
    .filter((invoice) => {
      if (statusFilter !== "All" && invoice.status !== statusFilter.toLowerCase()) {
        return false
      }
      if (
        searchTerm &&
        !invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(invoice.description || "").toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(invoice.invoiceNumber || "").toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false
      }
      if (!isDateInRange(invoice.issueDate)) {
        return false
      }
      return true
    })
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())

  const overdueInvoices = filteredInvoices.filter((invoice) => invoice.status === "overdue").length
  const paidInvoices = filteredInvoices.filter((invoice) => invoice.status === "paid")
  const totalPaid = paidInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0)
  const outstandingAmount = filteredInvoices
    .filter((inv) => inv.status !== "paid" && inv.status !== "cancelled")
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)

  if (financeState.loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading invoices...
        </Typography>
      </Box>
    )
  }

  if (financeState.error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" variant="filled">
          <Typography variant="subtitle1">{financeState.error}</Typography>
          <Typography variant="body2">Please try refreshing the page or contact support if the issue persists.</Typography>
        </Alert>
      </Box>
    )
  }

  const viewInvoice = selectedInvoice ? financeState.invoices.find((inv) => inv.id === selectedInvoice) : null

  return (
    <Box sx={{ p: 0 }}>
      <DataHeader
        onRefresh={loadData}
        showDateControls={false}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search invoices..."
        filters={[
          {
            label: "Status",
            options: [
              { id: "all", name: "All" },
              { id: "draft", name: "Draft" },
              { id: "sent", name: "Sent" },
              { id: "paid", name: "Paid" },
              { id: "overdue", name: "Overdue" },
            ],
            selectedValues: statusFilter !== "All" ? [statusFilter.toLowerCase()] : ["all"],
            onSelectionChange: (values) =>
              setStatusFilter(values[0] ? values[0].charAt(0).toUpperCase() + values[0].slice(1) : "All"),
          },
        ]}
        filtersExpanded={false}
        onFiltersToggle={() => {}}
        sortOptions={[
          { value: "issueDate", label: "Issue Date" },
          { value: "dueDate", label: "Due Date" },
          { value: "amount", label: "Amount" },
          { value: "customer", label: "Customer" },
          { value: "status", label: "Status" },
        ]}
        sortValue="issueDate"
        sortDirection="desc"
        onSortChange={() => {}}
        onExportCSV={() => {}}
        onCreateNew={() => setCreateDialogOpen(true)}
        createButtonLabel="Create Invoice"
      />

      <StatsSection
        stats={[
          { value: financeState.invoices.length.toString(), label: "Total Invoices", color: "primary" },
          { value: overdueInvoices.toString(), label: "Overdue", color: "error" },
          { value: `£${totalPaid.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, label: "Total Paid", color: "success" },
          { value: `£${outstandingAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, label: "Outstanding", color: "warning" },
        ]}
      />

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Issue Date</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{invoice.invoiceNumber || invoice.id.substring(0, 8)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                            {invoice.customerName?.charAt(0) || "?"}
                          </Avatar>
                          {invoice.customerName}
                        </Box>
                      </TableCell>
                      <TableCell>{invoice.description ?? "No description"}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>£{Number(invoice.totalAmount || 0).toFixed(2)}</TableCell>
                      <TableCell>{invoice.issueDate}</TableCell>
                      <TableCell>{invoice.dueDate}</TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.status}
                          size="small"
                          color={
                            invoice.status === "paid"
                              ? "success"
                              : invoice.status === "sent"
                              ? "primary"
                              : invoice.status === "overdue"
                              ? "error"
                              : "warning"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={(e) => handleMenuClick(e, invoice.id)}>
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No invoices found</Typography>
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
            if (selectedInvoice) openViewDialog(selectedInvoice)
            handleMenuClose()
          }}
        >
          <Visibility sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            const invoice = financeState.invoices.find((inv) => inv.id === selectedInvoice)
            if (invoice) openEditDialog(invoice)
            handleMenuClose()
          }}
        >
          <Edit sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedInvoice) handleSendInvoice(selectedInvoice)
          }}
        >
          <Send sx={{ mr: 1 }} /> Send Invoice
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedInvoice) handleMarkAsPaid(selectedInvoice)
          }}
        >
          <CheckCircle sx={{ mr: 1 }} /> Mark as Paid
        </MenuItem>
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
        title="Create New Invoice"
        icon={<Receipt />}
        mode="create"
        onSave={handleCreateInvoice}
        saveButtonText="Create Invoice"
        maxWidth="md"
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Invoice Number"
              value={invoiceForm.invoiceNumber}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
              placeholder="Auto-generated if empty"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Customer</InputLabel>
              <Select
                value={invoiceForm.customerId}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, customerId: e.target.value })}
              >
                {financeState.contacts
                  .filter((c) => c.type === "customer")
                  .map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name || customer.id}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={invoiceForm.description}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Subtotal"
              type="number"
              value={invoiceForm.subtotal}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, subtotal: parseFloat(e.target.value) || 0 })}
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Tax Amount"
              type="number"
              value={invoiceForm.taxAmount}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, taxAmount: parseFloat(e.target.value) || 0 })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Total"
              type="number"
              value={invoiceForm.subtotal + invoiceForm.taxAmount}
              disabled
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Issue Date"
              type="date"
              value={invoiceForm.issueDate}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              value={invoiceForm.dueDate}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Payment Terms (days)"
              type="number"
              value={invoiceForm.paymentTerms}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentTerms: parseInt(e.target.value) || 0 })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={invoiceForm.status}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, status: e.target.value as any })
                }
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              value={invoiceForm.notes}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
              multiline
              rows={3}
            />
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
        title="Edit Invoice"
        icon={<Edit />}
        mode="edit"
        onSave={handleEditInvoice}
        saveButtonText="Save Changes"
        maxWidth="md"
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Invoice Number"
              value={invoiceForm.invoiceNumber}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Customer</InputLabel>
              <Select
                value={invoiceForm.customerId}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, customerId: e.target.value })}
              >
                {financeState.contacts
                  .filter((c) => c.type === "customer")
                  .map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name || customer.id}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={invoiceForm.description}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Subtotal"
              type="number"
              value={invoiceForm.subtotal}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, subtotal: parseFloat(e.target.value) || 0 })}
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Tax Amount"
              type="number"
              value={invoiceForm.taxAmount}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, taxAmount: parseFloat(e.target.value) || 0 })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Total"
              type="number"
              value={invoiceForm.subtotal + invoiceForm.taxAmount}
              disabled
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Issue Date"
              type="date"
              value={invoiceForm.issueDate}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              value={invoiceForm.dueDate}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Payment Terms (days)"
              type="number"
              value={invoiceForm.paymentTerms}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentTerms: parseInt(e.target.value) || 0 })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={invoiceForm.status}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, status: e.target.value as any })
                }
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              value={invoiceForm.notes}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
              multiline
              rows={3}
            />
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
                <Typography variant="h6">Invoice {viewInvoice?.invoiceNumber || viewInvoice?.id?.substring(0, 8)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {viewInvoice?.customerName}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={viewInvoice?.status}
              color={
                viewInvoice?.status === "paid"
                  ? "success"
                  : viewInvoice?.status === "sent"
                  ? "primary"
                  : viewInvoice?.status === "overdue"
                  ? "error"
                  : "warning"
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
                    Invoice Details
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Issue Date" secondary={viewInvoice?.issueDate} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Due Date" secondary={viewInvoice?.dueDate} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Payment Terms" secondary={`${viewInvoice?.paymentTerms || 0} days`} />
                    </ListItem>
                    {viewInvoice?.description && (
                      <ListItem>
                        <ListItemText primary="Description" secondary={viewInvoice.description} />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Customer
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {viewInvoice?.customerName}
                  </Typography>
                  {viewInvoice?.customerEmail && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                      <Email fontSize="small" color="action" />
                      <Typography variant="body2">{viewInvoice.customerEmail}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Amount
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Subtotal: £{viewInvoice?.subtotal?.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tax: £{viewInvoice?.taxAmount?.toFixed(2)}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h5" fontWeight="bold" color="primary.main">
                    Total: £{viewInvoice?.totalAmount?.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {viewInvoice?.notes && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Notes
                    </Typography>
                    <Typography variant="body2">{viewInvoice.notes}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button
            variant="outlined"
            startIcon={<Email />}
            onClick={() => {
              if (selectedInvoice) handleSendInvoice(selectedInvoice)
              setViewDialogOpen(false)
            }}
          >
            Send
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => {
              // Print functionality
            }}
          >
            Print
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => {
              // Download PDF functionality
            }}
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Invoice?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone.
          </Alert>
          <Typography>
            Are you sure you want to delete this invoice? All associated data will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteInvoice} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Sales
