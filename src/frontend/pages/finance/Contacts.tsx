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
  Avatar,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material"
import {
  MoreVert,
  Person,
  Edit,
  Delete,
  Visibility,
  Email,
  Phone,
  LocationOn,
  TrendingUp,
  TrendingDown,
} from "@mui/icons-material"

import { useFinance } from "../../../backend/context/FinanceContext"
import DataHeader from "../../components/reusable/DataHeader"
import StatsSection from "../../components/reusable/StatsSection"
import CRUDModal from "../../components/reusable/CRUDModal"

const Contacts: React.FC = () => {
  const {
    state: financeState,
    refreshContacts,
    refreshInvoices,
    refreshBills,
    createContact,
    updateContact,
    deleteContact,
  } = useFinance()

  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("All")
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  const [newContact, setNewContact] = useState({
    name: "",
    type: "customer" as "customer" | "supplier" | "employee" | "other",
    companyName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    taxNumber: "",
    creditLimit: 0,
    paymentTerms: 30,
    currency: "GBP",
    isActive: true,
    notes: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await Promise.all([refreshContacts(), refreshInvoices(), refreshBills()])
    } catch (error) {
      console.error("Error loading contact data:", error)
    }
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, contactId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedContact(contactId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedContact(null)
  }

  const handleCreateContact = async () => {
    try {
      await createContact({
        ...newContact,
        address: {
          street: newContact.address,
          city: newContact.city,
          state: newContact.state,
          postalCode: newContact.postalCode,
          country: newContact.country,
        },
      } as any)

      setCreateDialogOpen(false)
      resetForm()
      await refreshContacts()
    } catch (error) {
      console.error("Error creating contact:", error)
    }
  }

  const handleEditContact = async () => {
    if (!selectedContact) return

    try {
      await updateContact(selectedContact, {
        ...newContact,
        address: {
          street: newContact.address,
          city: newContact.city,
          state: newContact.state,
          postalCode: newContact.postalCode,
          country: newContact.country,
        },
      } as any)

      setEditDialogOpen(false)
      resetForm()
      await refreshContacts()
      handleMenuClose()
    } catch (error) {
      console.error("Error updating contact:", error)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    try {
      await deleteContact(contactId)
      await refreshContacts()
      handleMenuClose()
    } catch (error) {
      console.error("Error deleting contact:", error)
    }
  }

  const openEditDialog = (contact: any) => {
    setNewContact({
      name: contact.name || "",
      type: contact.type || "customer",
      companyName: contact.companyName || "",
      email: contact.email || "",
      phone: contact.phone || "",
      address: contact.address?.street || "",
      city: contact.address?.city || "",
      state: contact.address?.state || "",
      postalCode: contact.address?.postalCode || "",
      country: contact.address?.country || "",
      taxNumber: contact.taxNumber || "",
      creditLimit: contact.creditLimit || 0,
      paymentTerms: contact.paymentTerms || 30,
      currency: contact.currency || "GBP",
      isActive: contact.isActive !== false,
      notes: contact.notes || "",
    })
    setEditDialogOpen(true)
  }

  const openViewDialog = (contactId: string) => {
    setSelectedContact(contactId)
    setViewDialogOpen(true)
  }

  const resetForm = () => {
    setNewContact({
      name: "",
      type: "customer",
      companyName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      taxNumber: "",
      creditLimit: 0,
      paymentTerms: 30,
      currency: "GBP",
      isActive: true,
      notes: "",
    })
  }

  const filteredContacts = financeState.contacts.filter((contact) => {
    const matchesSearch =
      contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = 
      typeFilter === "All" ? true :
      typeFilter === "Customers" ? contact.type === "customer" :
      typeFilter === "Suppliers" ? contact.type === "supplier" :
      contact.type === typeFilter.toLowerCase()
    return matchesSearch && matchesType
  })

  // Calculate contact statistics
  const getContactInvoiceTotal = (contactId: string) => {
    return financeState.invoices
      .filter((inv) => inv.customerId === contactId)
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
  }

  const getContactBillTotal = (contactId: string) => {
    return financeState.bills
      .filter((bill) => bill.supplierId === contactId)
      .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0)
  }

  const getContactOutstanding = (contact: any) => {
    if (contact.type === "customer") {
      return financeState.invoices
        .filter((inv) => inv.customerId === contact.id && inv.status !== "paid")
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
    } else if (contact.type === "supplier") {
      return financeState.bills
        .filter((bill) => bill.supplierId === contact.id && bill.status !== "paid")
        .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0)
    }
    return 0
  }

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

  const viewContact = selectedContact ? financeState.contacts.find((c) => c.id === selectedContact) : null

  return (
    <Box sx={{ p: 0 }}>
      <DataHeader
        onRefresh={loadData}
        showDateControls={false}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search contacts..."
        filters={[
          {
            label: "Type",
            options: [
              { id: "all", name: "All" },
              { id: "customer", name: "Customer" },
              { id: "supplier", name: "Supplier" },
              { id: "employee", name: "Employee" },
              { id: "other", name: "Other" },
            ],
            selectedValues: typeFilter !== "All" ? [typeFilter.toLowerCase()] : ["all"],
            onSelectionChange: (values) =>
              setTypeFilter(values[0] ? values[0].charAt(0).toUpperCase() + values[0].slice(1) : "All"),
          },
        ]}
        filtersExpanded={false}
        onFiltersToggle={() => {}}
        sortOptions={[
          { value: "name", label: "Name" },
          { value: "type", label: "Type" },
          { value: "createdAt", label: "Date Created" },
        ]}
        sortValue="name"
        sortDirection="asc"
        onSortChange={() => {}}
        onExportCSV={() => {}}
        onCreateNew={() => setCreateDialogOpen(true)}
        createButtonLabel="Add Contact"
      />

      <StatsSection
        stats={[
          { value: financeState.contacts.length.toString(), label: "Total Contacts", color: "primary" },
          { value: financeState.contacts.filter(c => c.type === "customer").length.toString(), label: "Customers", color: "success" },
          { value: financeState.contacts.filter(c => c.type === "supplier").length.toString(), label: "Suppliers", color: "warning" },
          { value: financeState.contacts.filter(c => c.isActive !== false).length.toString(), label: "Active", color: "info" },
        ]}
      />


      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Outstanding</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                          {contact.name?.charAt(0) || "?"}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {contact.name}
                          </Typography>
                          {contact.companyName && (
                            <Typography variant="caption" color="text.secondary">
                              {contact.companyName}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={contact.type}
                        size="small"
                        color={
                          contact.type === "customer"
                            ? "success"
                            : contact.type === "supplier"
                            ? "warning"
                            : "default"
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>{contact.phone}</TableCell>
                    <TableCell sx={{ fontWeight: 500, color: getContactOutstanding(contact) > 0 ? "warning.main" : "inherit" }}>
                      £{getContactOutstanding(contact).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={contact.isActive !== false ? "Active" : "Inactive"}
                        size="small"
                        color={contact.isActive !== false ? "success" : "default"}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={(e) => handleMenuClick(e, contact.id)}>
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


      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            if (selectedContact) openViewDialog(selectedContact)
            handleMenuClose()
          }}
        >
          <Visibility sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            const contact = financeState.contacts.find((c) => c.id === selectedContact)
            if (contact) openEditDialog(contact)
            handleMenuClose()
          }}
        >
          <Edit sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedContact) handleDeleteContact(selectedContact)
          }}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Create Contact Modal */}
      <CRUDModal
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false)
          resetForm()
        }}
        title="Add New Contact"
        icon={<Person />}
        mode="create"
        onSave={handleCreateContact}
        saveButtonText="Create Contact"
        maxWidth="md"
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Name"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={newContact.type}
                onChange={(e) =>
                  setNewContact({ ...newContact, type: e.target.value as "customer" | "supplier" | "employee" | "other" })
                }
              >
                <MenuItem value="customer">Customer</MenuItem>
                <MenuItem value="supplier">Supplier</MenuItem>
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Company Name"
              value={newContact.companyName}
              onChange={(e) => setNewContact({ ...newContact, companyName: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={newContact.email}
              onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              value={newContact.address}
              onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="City"
              value={newContact.city}
              onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="State/Province"
              value={newContact.state}
              onChange={(e) => setNewContact({ ...newContact, state: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Postal Code"
              value={newContact.postalCode}
              onChange={(e) => setNewContact({ ...newContact, postalCode: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Country"
              value={newContact.country}
              onChange={(e) => setNewContact({ ...newContact, country: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tax Number"
              value={newContact.taxNumber}
              onChange={(e) => setNewContact({ ...newContact, taxNumber: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select
                value={newContact.currency}
                onChange={(e) => setNewContact({ ...newContact, currency: e.target.value })}
              >
                <MenuItem value="GBP">GBP (£)</MenuItem>
                <MenuItem value="USD">USD ($)</MenuItem>
                <MenuItem value="EUR">EUR (€)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Credit Limit"
              type="number"
              value={newContact.creditLimit}
              onChange={(e) => setNewContact({ ...newContact, creditLimit: parseFloat(e.target.value) || 0 })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Payment Terms (days)"
              type="number"
              value={newContact.paymentTerms}
              onChange={(e) => setNewContact({ ...newContact, paymentTerms: parseInt(e.target.value) || 0 })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={newContact.notes}
              onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
            />
          </Grid>
        </Grid>
      </CRUDModal>

      {/* Edit Contact Modal */}
      <CRUDModal
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
          resetForm()
        }}
        title="Edit Contact"
        icon={<Edit />}
        mode="edit"
        onSave={handleEditContact}
        saveButtonText="Save Changes"
        maxWidth="md"
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Name"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={newContact.type}
                onChange={(e) =>
                  setNewContact({ ...newContact, type: e.target.value as "customer" | "supplier" | "employee" | "other" })
                }
              >
                <MenuItem value="customer">Customer</MenuItem>
                <MenuItem value="supplier">Supplier</MenuItem>
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Company Name"
              value={newContact.companyName}
              onChange={(e) => setNewContact({ ...newContact, companyName: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={newContact.email}
              onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              value={newContact.address}
              onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="City"
              value={newContact.city}
              onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="State/Province"
              value={newContact.state}
              onChange={(e) => setNewContact({ ...newContact, state: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Postal Code"
              value={newContact.postalCode}
              onChange={(e) => setNewContact({ ...newContact, postalCode: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Country"
              value={newContact.country}
              onChange={(e) => setNewContact({ ...newContact, country: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tax Number"
              value={newContact.taxNumber}
              onChange={(e) => setNewContact({ ...newContact, taxNumber: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select
                value={newContact.currency}
                onChange={(e) => setNewContact({ ...newContact, currency: e.target.value })}
              >
                <MenuItem value="GBP">GBP (£)</MenuItem>
                <MenuItem value="USD">USD ($)</MenuItem>
                <MenuItem value="EUR">EUR (€)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Credit Limit"
              type="number"
              value={newContact.creditLimit}
              onChange={(e) => setNewContact({ ...newContact, creditLimit: parseFloat(e.target.value) || 0 })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Payment Terms (days)"
              type="number"
              value={newContact.paymentTerms}
              onChange={(e) => setNewContact({ ...newContact, paymentTerms: parseInt(e.target.value) || 0 })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={newContact.notes}
              onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
            />
          </Grid>
        </Grid>
      </CRUDModal>

      {/* View Contact Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: "primary.main" }}>
              {viewContact?.name?.charAt(0) || "?"}
            </Avatar>
            <Box>
              <Typography variant="h6">{viewContact?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {viewContact?.companyName}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Contact Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <Email sx={{ mr: 2, color: "text.secondary" }} />
                      <ListItemText primary="Email" secondary={viewContact?.email || "N/A"} />
                    </ListItem>
                    <ListItem>
                      <Phone sx={{ mr: 2, color: "text.secondary" }} />
                      <ListItemText primary="Phone" secondary={viewContact?.phone || "N/A"} />
                    </ListItem>
                    <ListItem>
                      <LocationOn sx={{ mr: 2, color: "text.secondary" }} />
                      <ListItemText
                        primary="Address"
                        secondary={
                          viewContact?.address
                            ? `${viewContact.address.street}, ${viewContact.address.city}, ${viewContact.address.state} ${viewContact.address.postalCode}`
                            : "N/A"
                        }
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Financial Summary
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    {viewContact?.type === "customer" ? (
                      <TrendingUp color="success" sx={{ mr: 1 }} />
                    ) : (
                      <TrendingDown color="error" sx={{ mr: 1 }} />
                    )}
                    <Typography variant="body2">
                      {viewContact?.type === "customer" ? "Total Sales" : "Total Purchases"}
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    £
                    {viewContact?.type === "customer"
                      ? getContactInvoiceTotal(viewContact?.id || "")
                      : getContactBillTotal(viewContact?.id || "")}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Outstanding Balance
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="warning.main">
                    £{getContactOutstanding(viewContact || {})}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Account Details
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Type" secondary={viewContact?.type} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Credit Limit" secondary={`£${viewContact?.creditLimit || 0}`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Payment Terms" secondary={`${viewContact?.paymentTerms || 0} days`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Currency" secondary={viewContact?.currency || "GBP"} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            {viewContact?.notes && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Notes
                    </Typography>
                    <Typography variant="body2">{viewContact.notes}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Contacts
