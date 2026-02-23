"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Paper,
  Button,
  TextField,
  Grid,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Switch,
  FormControlLabel,
  Zoom,
} from "@mui/material"
import { ref, set, get, push, remove, update } from "firebase/database"
import { db } from "../services/firebase"
import { useLogIn } from "../context/LogInContext"
import { useRole } from "../context/RoleContext"
import { Page, PageHeader } from "../styles/StyledComponents"
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import {
  TableRestaurant,
  CloudUpload,
  Delete,
  Visibility,
  Search,
  Receipt,
  Person,
  CalendarToday,
  Close,
  Refresh,
  ZoomIn,
  CheckCircle,
  PendingActions,
} from "@mui/icons-material"
import { format } from "date-fns"

interface SharedTable {
  id: string
  receiptUrl: string
  sharedWith: string
  sharedFrom: string
  createdAt: string
  createdBy: string
  createdById?: string
  amount?: string
  notes?: string
  addedToPayroll: boolean
}

const SharedTablesPage: React.FC = () => {
  const { state: userState } = useLogIn()
  const { state: roleState } = useRole()
  const [sharedTables, setSharedTables] = useState<SharedTable[]>([])
  const [sharedWith, setSharedWith] = useState("")
  const [sharedFrom, setSharedFrom] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTable, setSelectedTable] = useState<SharedTable | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [filterPeriod, setFilterPeriod] = useState("all")
  const [imageZoom, setImageZoom] = useState(false)
  const storage = getStorage()

  // Fetch shared table records
  useEffect(() => {
    if (roleState.role === "Manager" || userState.uid) {
      fetchSharedTables()
    }
  }, [roleState.role, userState.uid])

  const fetchSharedTables = async () => {
    setLoading(true)
    setError(null)
    try {
      const sharedTablesRef = ref(db, "sharedTables")
      const snapshot = await get(sharedTablesRef)
      if (snapshot.exists()) {
        const data = snapshot.val()
        const sharedTablesArray = Object.entries(data).map(([key, value]: [string, any]) => {
          const {
            receiptUrl = "",
            sharedWith = "",
            sharedFrom = "",
            createdAt = new Date().toISOString(),
            createdBy = "Unknown",
            createdById = "",
            amount = "",
            notes = "",
            addedToPayroll = false,
          } = value || {}
          return {
            id: key,
            receiptUrl,
            sharedWith,
            sharedFrom,
            createdAt,
            createdBy,
            createdById,
            amount,
            notes,
            addedToPayroll: Boolean(addedToPayroll),
          }
        })

        // Sort by date (newest first)
        sharedTablesArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        setSharedTables(sharedTablesArray)
      } else {
        setSharedTables([])
      }
    } catch (err) {
      setError("Failed to fetch shared table records")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0])
    }
  }

  // Submit a new shared table record
  const addSharedTable = async () => {
    if (!sharedWith.trim() || !sharedFrom.trim() || !receiptFile) {
      setError("Please fill in all required fields and upload a receipt")
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Upload the receipt file to Firebase Storage
      const fileRef = storageRef(storage, `receipts/${receiptFile.name}-${Date.now()}`)
      const snapshot = await uploadBytes(fileRef, receiptFile)
      const downloadUrl = await getDownloadURL(snapshot.ref)

      // Create the new shared table record
      const newSharedTable = {
        receiptUrl: downloadUrl,
        sharedWith: sharedWith,
        sharedFrom: sharedFrom,
        createdAt: new Date().toISOString(),
        createdBy: userState.firstName || "Unknown",
        createdById: userState.uid || "",
        amount: amount,
        notes: notes,
        addedToPayroll: false,
      }

      const sharedTablesRef = ref(db, "sharedTables")
      const newSharedTableRef = push(sharedTablesRef)
      await set(newSharedTableRef, newSharedTable)

      // Show success message
      setSuccess("Shared table record added successfully")
      setTimeout(() => setSuccess(null), 3000)

      // Re-fetch the shared table records
      fetchSharedTables()

      // Reset the form
      setSharedWith("")
      setSharedFrom("")
      setAmount("")
      setNotes("")
      setReceiptFile(null)

      // Reset the file input by clearing its value
      const fileInput = document.getElementById("receipt-upload") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    } catch (err) {
      setError("Failed to add shared table record")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Toggle payroll status
  const togglePayrollStatus = async (tableId: string, currentStatus: boolean) => {
    try {
      await update(ref(db, `sharedTables/${tableId}`), {
        addedToPayroll: !currentStatus,
      })

      // Update local state
      setSharedTables((prev) =>
        prev.map((table) => (table.id === tableId ? { ...table, addedToPayroll: !currentStatus } : table)),
      )

      setSuccess(`Record ${!currentStatus ? "added to" : "removed from"} payroll`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Failed to update payroll status")
      console.error(err)
    }
  }

  // Delete a shared table record
  const deleteSharedTable = async (tableId: string, receiptUrl: string) => {
    if (!confirm("Are you sure you want to delete this shared table record?")) return

    setLoading(true)
    try {
      // Delete from database
      await remove(ref(db, `sharedTables/${tableId}`))

      // Delete receipt from storage if URL exists
      if (receiptUrl) {
        try {
          // Extract the path from the URL
          const urlPath = receiptUrl.split("receipts%2F")[1].split("?")[0]
          const decodedPath = decodeURIComponent(urlPath)
          const receiptRef = storageRef(storage, `receipts/${decodedPath}`)
          await deleteObject(receiptRef)
        } catch (storageErr) {
          console.error("Error deleting receipt file:", storageErr)
          // Continue even if file deletion fails
        }
      }

      // Update local state
      setSharedTables((prev) => prev.filter((table) => table.id !== tableId))
      setSuccess("Record deleted successfully")
      setTimeout(() => setSuccess(null), 3000)

      // Close dialog if open
      if (openDialog && selectedTable?.id === tableId) {
        setOpenDialog(false)
        setSelectedTable(null)
      }
    } catch (err) {
      setError("Failed to delete record")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // View receipt details
  const viewReceipt = (table: SharedTable) => {
    setSelectedTable(table)
    setOpenDialog(true)
  }

  // Filter shared tables based on search query and time period
  const filteredTables = sharedTables.filter((table) => {
    const matchesSearch =
      table.sharedWith.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.sharedFrom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.createdBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (table.notes && table.notes.toLowerCase().includes(searchQuery.toLowerCase()))

    if (!matchesSearch) return false

    // Apply time period filter
    if (filterPeriod === "all") return true

    const tableDate = new Date(table.createdAt)
    const now = new Date()

    if (filterPeriod === "today") {
      return tableDate.toDateString() === now.toDateString()
    } else if (filterPeriod === "week") {
      const weekAgo = new Date()
      weekAgo.setDate(now.getDate() - 7)
      return tableDate >= weekAgo
    } else if (filterPeriod === "month") {
      const monthAgo = new Date()
      monthAgo.setMonth(now.getMonth() - 1)
      return tableDate >= monthAgo
    }

    return true
  })

  // Show only user's records if not a manager
  const userTables =
    roleState.role === "Manager"
      ? filteredTables
      : filteredTables.filter((table) => table.createdById === userState.uid)

  return (
    <Page>
      <PageHeader>
        <Box display="flex" alignItems="center" gap={2}>
          <TableRestaurant sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Shared Tables
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Track and manage shared table receipts
            </Typography>
          </Box>
        </Box>
      </PageHeader>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Shared Table Submission Form */}
      <Paper elevation={3} sx={{ padding: 3, marginBottom: 4 }}>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
          <Receipt />
          Submit Shared Table Receipt
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Shared From"
              value={sharedFrom}
              onChange={(e) => setSharedFrom(e.target.value)}
              variant="outlined"
              fullWidth
              required
              placeholder="Your name"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Shared With"
              value={sharedWith}
              onChange={(e) => setSharedWith(e.target.value)}
              variant="outlined"
              fullWidth
              required
              placeholder="Enter name of person/people"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              variant="outlined"
              fullWidth
              placeholder="£0.00"
              InputProps={{
                startAdornment: <InputAdornment position="start">£</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button variant="contained" component="label" startIcon={<CloudUpload />} fullWidth>
              {receiptFile ? "Change Receipt" : "Upload Receipt"}
              <input
                id="receipt-upload"
                type="file"
                hidden
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/jpg, image/*"
              />
            </Button>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              variant="outlined"
              fullWidth
              multiline
              rows={2}
              placeholder="Add any additional details about this shared table"
            />
          </Grid>

          {receiptFile && (
            <Grid item xs={12}>
              <Chip label={receiptFile.name} onDelete={() => setReceiptFile(null)} color="primary" variant="outlined" />
            </Grid>
          )}

          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={addSharedTable}
              disabled={loading || !sharedWith.trim() || !sharedFrom.trim() || !receiptFile}
              fullWidth
              size="large"
            >
              {loading ? <CircularProgress size={24} /> : "Submit Shared Table"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Manager View - List of Shared Tables */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" display="flex" alignItems="center" gap={1}>
            <TableRestaurant />
            {roleState.role === "Manager" ? "All Shared Table Records" : "Your Shared Table Records"}
          </Typography>

          <Box display="flex" gap={2}>
            <TextField
              placeholder="Search records..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Period</InputLabel>
              <Select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} label="Time Period">
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">Past Week</MenuItem>
                <MenuItem value="month">Past Month</MenuItem>
              </Select>
            </FormControl>

            <Tooltip title="Refresh">
              <IconButton onClick={fetchSharedTables} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {loading && !sharedTables.length ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : userTables.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No shared table records found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery || filterPeriod !== "all"
                ? "Try adjusting your search or filters"
                : roleState.role === "Manager"
                  ? "No shared table records have been submitted yet"
                  : "You have not submitted any shared table records yet"}
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {userTables.map((table) => (
              <Grid item xs={12} sm={6} md={4} key={table.id}>
                <Card
                  sx={{
                    height: "100%",
                    transition: "all 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Shared From:
                        </Typography>
                        <Typography variant="h6" fontWeight="medium">
                          {table.sharedFrom}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                          Shared With:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {table.sharedWith}
                        </Typography>
                      </Box>
                      {table.amount && <Chip label={`£${table.amount}`} color="primary" size="small" />}
                    </Box>

                    <Box display="flex" flexDirection="column" gap={1} mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Person fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Submitted by: {table.createdBy}
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(table.createdAt), "dd MMM yyyy, HH:mm")}
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1}>
                        {table.addedToPayroll ? (
                          <CheckCircle fontSize="small" color="success" />
                        ) : (
                          <PendingActions fontSize="small" color="warning" />
                        )}
                        <Typography variant="body2" color="text.secondary">
                          {table.addedToPayroll ? "Added to Payroll" : "Pending Payroll"}
                        </Typography>
                      </Box>
                    </Box>

                    {table.notes && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {table.notes}
                        </Typography>
                      </>
                    )}

                    <Box mt="auto" display="flex" flexDirection="column" gap={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Button startIcon={<Visibility />} onClick={() => viewReceipt(table)} variant="outlined">
                          View Receipt
                        </Button>

                        {(roleState.role === "Manager" || table.createdById === userState.uid) && (
                          <IconButton
                            color="error"
                            onClick={() => deleteSharedTable(table.id, table.receiptUrl)}
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Box>

                      {roleState.role === "Manager" && (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={table.addedToPayroll}
                              onChange={() => togglePayrollStatus(table.id, table.addedToPayroll)}
                              size="small"
                            />
                          }
                          label="Added to Payroll"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Receipt View Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
        {selectedTable && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Shared Table Receipt - {selectedTable.sharedFrom} → {selectedTable.sharedWith}
                </Typography>
                <Box display="flex" gap={1}>
                  <IconButton onClick={() => setImageZoom(!imageZoom)} size="small">
                    <ZoomIn />
                  </IconButton>
                  <IconButton onClick={() => setOpenDialog(false)} size="small">
                    <Close />
                  </IconButton>
                </Box>
              </Box>
            </DialogTitle>

            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  {selectedTable.receiptUrl ? (
                    <Zoom in={imageZoom}>
                      <Box
                        component="img"
                        src={selectedTable.receiptUrl}
                        alt="Receipt"
                        sx={{
                          width: "100%",
                          height: "auto",
                          maxHeight: imageZoom ? "none" : "70vh",
                          objectFit: "contain",
                          borderRadius: 1,
                          boxShadow: 2,
                          cursor: "pointer",
                        }}
                        onClick={() => setImageZoom(!imageZoom)}
                      />
                    </Zoom>
                  ) : (
                    <Paper sx={{ p: 4, textAlign: "center" }}>
                      <Typography>Receipt image not available</Typography>
                    </Paper>
                  )}
                </Grid>

                <Grid item xs={12} md={5}>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Shared From
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedTable.sharedFrom}
                    </Typography>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Shared With
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedTable.sharedWith}
                    </Typography>
                  </Paper>

                  {selectedTable.amount && (
                    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Amount
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        £{selectedTable.amount}
                      </Typography>
                    </Paper>
                  )}

                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Submitted By
                    </Typography>
                    <Typography variant="body1">{selectedTable.createdBy}</Typography>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Date & Time
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(selectedTable.createdAt), "dd MMMM yyyy, HH:mm")}
                    </Typography>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Payroll Status
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {selectedTable.addedToPayroll ? (
                        <CheckCircle color="success" />
                      ) : (
                        <PendingActions color="warning" />
                      )}
                      <Typography variant="body1">
                        {selectedTable.addedToPayroll ? "Added to Payroll" : "Pending Payroll"}
                      </Typography>
                    </Box>
                  </Paper>

                  {selectedTable.notes && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Notes
                      </Typography>
                      <Typography variant="body1">{selectedTable.notes}</Typography>
                    </Paper>
                  )}
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions>
              {roleState.role === "Manager" && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedTable.addedToPayroll}
                      onChange={() => togglePayrollStatus(selectedTable.id, selectedTable.addedToPayroll)}
                    />
                  }
                  label="Added to Payroll"
                />
              )}
              {(roleState.role === "Manager" || selectedTable.createdById === userState.uid) && (
                <Button
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => deleteSharedTable(selectedTable.id, selectedTable.receiptUrl)}
                >
                  Delete Record
                </Button>
              )}
              <Button onClick={() => setOpenDialog(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Page>
  )
}

export default SharedTablesPage
