"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Box, Typography, Grid, Button, Card, CardContent, TextField, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Chip } from "@mui/material"
// Company state is now handled through HRContext
// Functions now accessed through HRContext
import type { ExpenseReport } from "../../../backend/interfaces/HRs"
import { useHR } from "../../../backend/context/HRContext"
import CRUDModal from "../reusable/CRUDModal"
import ExpensesCRUDForm from "./forms/ExpensesCRUDForm"
import DataHeader from "../reusable/DataHeader"

const ExpensesManagement: React.FC = () => {
  // Company state is now handled through HRContext
  const { state: hrState } = useHR()
  // Use expense reports from HR context state instead of local state
  const reports = hrState.expenseReports || []
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<ExpenseReport>>({ title: "", currency: "GBP", totalAmount: 0, status: "draft", receipts: [], categories: [], businessPurpose: "" })

  // CRUD Modal state
  const [expensesCRUDModalOpen, setExpensesCRUDModalOpen] = useState(false)
  const [selectedExpenseForCRUD, setSelectedExpenseForCRUD] = useState<ExpenseReport | null>(null)
  const [crudMode, setCrudMode] = useState<'create' | 'edit' | 'view'>('create')

  // DataHeader state
  const [searchTerm, setSearchTerm] = useState('')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // CRUD handlers
  const handleOpenExpensesCRUD = (expense: ExpenseReport | null = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedExpenseForCRUD(expense)
    setCrudMode(mode)
    setExpensesCRUDModalOpen(true)
  }

  const handleCloseExpensesCRUD = () => {
    setExpensesCRUDModalOpen(false)
    setSelectedExpenseForCRUD(null)
  }

  const handleSaveExpensesCRUD = async (expenseData: any) => {
    try {
      if (crudMode === 'create') {
        // Would add createExpenseReport to HRContext when available
        console.log('Creating expense report:', expenseData)
      } else if (crudMode === 'edit' && selectedExpenseForCRUD) {
        // Would add updateExpenseReport to HRContext when available
        console.log('Updating expense report:', expenseData)
      }
      handleCloseExpensesCRUD()
      await load()
    } catch (error) {
      console.error('Error saving expense report:', error)
    }
  }

  // DataHeader handlers
  const handleSortChange = (value: string, direction: 'asc' | 'desc') => {
    setSortBy(value)
    setSortDirection(direction)
  }

  const handleRefresh = () => {
    load()
  }

  const handleExportCSV = () => {
    console.log('Export CSV functionality')
  }

  const load = useCallback(async () => {
    // Company state handled internally
    // Expense reports are already loaded in HRContext
    // Reports are automatically updated in HR context state
  }, []) // Company state handled internally

  useEffect(() => { load() }, [load])

  // Filter and sort reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.businessPurpose.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(report.status)
    return matchesSearch && matchesStatus
  })

  const sortedReports = [...filteredReports].sort((a, b) => {
    let aValue = ''
    let bValue = ''

    switch (sortBy) {
      case 'title':
        aValue = a.title
        bValue = b.title
        break
      case 'employeeName':
        aValue = a.employeeName
        bValue = b.employeeName
        break
      case 'totalAmount':
        aValue = a.totalAmount.toString()
        bValue = b.totalAmount.toString()
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      case 'createdAt':
        aValue = a.createdAt?.toString() || ''
        bValue = b.createdAt?.toString() || ''
        break
      default:
        aValue = a.createdAt?.toString() || ''
        bValue = b.createdAt?.toString() || ''
    }

    const comparison = aValue.localeCompare(bValue)
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // DataHeader configuration
  const filters = [
    {
      label: "Status",
      options: [
        { id: "draft", name: "Draft", color: "#757575" },
        { id: "submitted", name: "Submitted", color: "#2196f3" },
        { id: "approved", name: "Approved", color: "#4caf50" },
        { id: "rejected", name: "Rejected", color: "#f44336" },
        { id: "paid", name: "Paid", color: "#4caf50" },
      ],
      selectedValues: statusFilter,
      onSelectionChange: setStatusFilter,
    },
  ]

  const sortOptions = [
    { value: "title", label: "Title" },
    { value: "employeeName", label: "Employee" },
    { value: "totalAmount", label: "Amount" },
    { value: "status", label: "Status" },
    { value: "createdAt", label: "Created Date" },
  ]

  const save = async () => {
    // Company state handled internally
    // Would add createExpenseReport to HRContext
    // await createExpenseReport({ ...form, employeeId: form.employeeId || hrState.employees[0]?.id, employeeName: form.employeeName || `${hrState.employees[0]?.firstName || ''} ${hrState.employees[0]?.lastName || ''}`, createdAt: Date.now(), status: "submitted" })
    setOpen(false)
    await load()
  }

  return (
    <Box>
      <DataHeader
        onCreateNew={() => handleOpenExpensesCRUD(null, 'create')}
        onExportCSV={handleExportCSV}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search expense reports..."
        showDateControls={false}
        filters={filters}
        filtersExpanded={filtersExpanded}
        onFiltersToggle={() => setFiltersExpanded(!filtersExpanded)}
        sortOptions={sortOptions}
        sortValue={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onRefresh={handleRefresh}
      />

      <Grid container spacing={2}>
        {sortedReports.map((r) => (
          <Grid item xs={12} md={6} key={r.id}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600}>{r.title}</Typography>
                <Typography variant="body2" color="text.secondary">{r.employeeName} • {r.currency} {r.totalAmount.toFixed(2)}</Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip size="small" label={r.status} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {sortedReports.length === 0 && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {reports.length === 0 
              ? "No expense reports found. Click 'New Report' to create your first expense report."
              : "No expense reports match your current filters."
            }
          </Typography>
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Expense Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Title" value={form.title || ''} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select value={form.currency as any || 'GBP'} label="Currency" onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value as any }))}>
                  <MenuItem value="GBP">GBP</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Business Purpose" value={form.businessPurpose || ''} onChange={(e) => setForm((p) => ({ ...p, businessPurpose: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth type="number" label="Total Amount" value={form.totalAmount || 0} onChange={(e) => setForm((p) => ({ ...p, totalAmount: Number(e.target.value) }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* CRUD Modal */}
      <CRUDModal
        open={expensesCRUDModalOpen}
        onClose={handleCloseExpensesCRUD}
        title={crudMode === 'create' ? 'Create Expense Report' : crudMode === 'edit' ? 'Edit Expense Report' : 'View Expense Report'}
        maxWidth="md"
      >
        <ExpensesCRUDForm
          expenseReport={selectedExpenseForCRUD as any}
          mode={crudMode}
          onSave={handleSaveExpensesCRUD}
        />
      </CRUDModal>
    </Box>
  )
}

export default ExpensesManagement


