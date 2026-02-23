# Finance Module - Complete CRUD Pattern Template

## Overview

All Finance pages now follow a comprehensive CRUD pattern with full **Create, Read, Update, Delete, and View** functionality. This document provides the complete template and pattern to follow for remaining pages.

---

## ✅ COMPLETED PAGES (Full CRUD)

### 1. **Contacts Page** ✅
**File:** `src/frontend/pages/finance/Contacts.tsx`

**Full CRUD Operations:**
- ✅ CREATE - Modal with full contact form
- ✅ READ - Table with all contacts, tabs by type
- ✅ UPDATE - Pre-filled edit modal
- ✅ DELETE - Confirmation dialog
- ✅ VIEW - Detailed contact info dialog

**Special Features:**
- Customer/Supplier/Employee filtering
- Financial summary (outstanding balance)
- Transaction history integration
- Search and filtering

---

### 2. **Sales/Invoices Page** ✅
**File:** `src/frontend/pages/finance/Sales.tsx`

**Full CRUD Operations:**
- ✅ CREATE - Invoice form modal with line items
- ✅ READ - Invoice table with status filtering
- ✅ UPDATE - Edit invoice with all fields
- ✅ DELETE - Confirmation dialog with warning
- ✅ VIEW - Detailed invoice view dialog

**Special Features:**
- Send invoice action
- Mark as paid action
- Date range filtering
- Customer integration
- Status management (draft/sent/paid/overdue)
- Summary cards with statistics

---

### 3. **Expenses Page** ✅
**File:** `src/frontend/pages/finance/Expenses.tsx`

**Full CRUD Operations:**
- ✅ CREATE - Submit expense claim form
- ✅ READ - Expense table with tabs (All/Pending/Approved/Reimbursed)
- ✅ UPDATE - Edit expense details
- ✅ DELETE - Confirmation dialog
- ✅ VIEW - Detailed expense view with approval actions

**Special Features:**
- Approval workflow (Approve/Reject/Reimburse)
- Receipt upload placeholder
- Category and department filtering
- Status-based tabs
- Employee tracking

---

## 🎯 CRUD PATTERN TEMPLATE

### Standard Component Structure

```typescript
const PageName: React.FC = () => {
  // 1. Context & State
  const { 
    state: financeState,
    refreshEntity,
    createEntity,
    updateEntity,
    deleteEntity,
  } = useFinance()

  // 2. Local State
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Date management
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dateType, setDateType] = useState<"day" | "week" | "month" | "custom">("month")

  // 3. Form State
  const [entityForm, setEntityForm] = useState({
    // All entity fields here
    field1: "",
    field2: 0,
    status: "active",
  })

  // 4. Data Loading
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await refreshEntity()
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  // 5. Menu Handlers
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, entityId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedEntity(entityId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const resetForm = () => {
    setEntityForm({
      field1: "",
      field2: 0,
      status: "active",
    })
  }

  // 6. CREATE Handler
  const handleCreate = async () => {
    try {
      await createEntity(entityForm)
      setCreateDialogOpen(false)
      resetForm()
      await refreshEntity()
    } catch (error) {
      console.error("Error creating:", error)
    }
  }

  // 7. EDIT Handlers
  const openEditDialog = (entity: any) => {
    setEntityForm({
      field1: entity.field1 || "",
      field2: entity.field2 || 0,
      status: entity.status || "active",
    })
    setEditDialogOpen(true)
  }

  const handleEdit = async () => {
    if (!selectedEntity) return
    try {
      await updateEntity(selectedEntity, entityForm)
      setEditDialogOpen(false)
      resetForm()
      await refreshEntity()
      handleMenuClose()
    } catch (error) {
      console.error("Error updating:", error)
    }
  }

  // 8. DELETE Handlers
  const openDeleteDialog = () => {
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedEntity) return
    try {
      await deleteEntity(selectedEntity)
      setDeleteDialogOpen(false)
      await refreshEntity()
      handleMenuClose()
    } catch (error) {
      console.error("Error deleting:", error)
    }
  }

  // 9. VIEW Handler
  const openViewDialog = (entityId: string) => {
    setSelectedEntity(entityId)
    setViewDialogOpen(true)
  }

  // 10. Filtering Logic
  const filteredEntities = financeState.entities.filter((entity) => {
    const matchesSearch = entity.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "All" || entity.status === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  // 11. Return JSX with all CRUD components
  return (
    <Box>
      <DataHeader {...headerProps} />
      
      {/* Summary Cards */}
      <Grid container spacing={3}>
        {/* Stats cards with AnimatedCounter */}
      </Grid>

      {/* Main Table */}
      <Card>
        <TableContainer>
          <Table>
            {/* Table with action menu */}
          </Table>
        </TableContainer>
      </Card>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => openViewDialog(selectedEntity!)}>
          <Visibility /> View
        </MenuItem>
        <MenuItem onClick={() => openEditDialog(entity)}>
          <Edit /> Edit
        </MenuItem>
        <MenuItem onClick={openDeleteDialog}>
          <Delete /> Delete
        </MenuItem>
      </Menu>

      {/* CREATE Modal */}
      <CRUDModal
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="Create New"
        mode="create"
        onSave={handleCreate}
      >
        {/* Form fields */}
      </CRUDModal>

      {/* EDIT Modal */}
      <CRUDModal
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title="Edit"
        mode="edit"
        onSave={handleEdit}
      >
        {/* Same form fields, pre-filled */}
      </CRUDModal>

      {/* VIEW Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)}>
        <DialogTitle>Details</DialogTitle>
        <DialogContent>
          {/* Display all entity information */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* DELETE Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete?</DialogTitle>
        <DialogContent>
          <Alert severity="warning">This action cannot be undone.</Alert>
          <Typography>Are you sure?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
```

---

## 🔑 Key CRUD Components

### 1. **CREATE Modal**
```typescript
<CRUDModal
  open={createDialogOpen}
  onClose={() => {
    setCreateDialogOpen(false)
    resetForm()
  }}
  title="Create New [Entity]"
  icon={<Icon />}
  mode="create"
  onSave={handleCreate}
  saveButtonText="Create [Entity]"
  maxWidth="md"
>
  <Grid container spacing={2}>
    {/* All form fields */}
  </Grid>
</CRUDModal>
```

**Requirements:**
- ✅ Form validation
- ✅ All required fields marked
- ✅ Default values set
- ✅ Reset form on close
- ✅ Refresh data after save

---

### 2. **EDIT Modal**
```typescript
const openEditDialog = (entity: any) => {
  // Pre-fill all form fields from entity
  setEntityForm({
    field1: entity.field1 || "",
    field2: entity.field2 || 0,
    // ... all fields
  })
  setEditDialogOpen(true)
}

<CRUDModal
  open={editDialogOpen}
  onClose={() => {
    setEditDialogOpen(false)
    resetForm()
  }}
  title="Edit [Entity]"
  icon={<Edit />}
  mode="edit"
  onSave={handleEdit}
  saveButtonText="Save Changes"
  maxWidth="md"
>
  <Grid container spacing={2}>
    {/* Same form fields as CREATE */}
  </Grid>
</CRUDModal>
```

**Requirements:**
- ✅ Pre-fill ALL fields from selected entity
- ✅ Same validation as CREATE
- ✅ Use existing entity ID for update
- ✅ Refresh data after save
- ✅ Close menu after action

---

### 3. **VIEW Dialog**
```typescript
const viewEntity = selectedEntity 
  ? financeState.entities.find(e => e.id === selectedEntity) 
  : null

<Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
  <DialogTitle>
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Avatar>{/* Icon */}</Avatar>
      <Box>
        <Typography variant="h6">{viewEntity?.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {viewEntity?.subtitle}
        </Typography>
      </Box>
    </Box>
  </DialogTitle>
  <DialogContent>
    <Grid container spacing={3}>
      {/* Display all entity information in Cards */}
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">Section Title</Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Field" secondary={viewEntity?.field} />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
    {/* Optional action buttons */}
  </DialogActions>
</Dialog>
```

**Requirements:**
- ✅ Show ALL entity information
- ✅ Organized in cards by section
- ✅ Use proper formatting (dates, currency, etc.)
- ✅ Optional quick actions in footer
- ✅ Avatar/icon for visual appeal

---

### 4. **DELETE Confirmation**
```typescript
<Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
  <DialogTitle>Delete [Entity]?</DialogTitle>
  <DialogContent>
    <Alert severity="warning" sx={{ mb: 2 }}>
      This action cannot be undone.
    </Alert>
    <Typography>
      Are you sure you want to delete this [entity]? All associated data will be permanently removed.
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
    <Button onClick={handleDelete} color="error" variant="contained">
      Delete
    </Button>
  </DialogActions>
</Dialog>
```

**Requirements:**
- ✅ Warning alert
- ✅ Clear consequences message
- ✅ Cancel button (default action)
- ✅ Destructive action clearly marked (red)
- ✅ Refresh data after delete

---

### 5. **Actions Menu**
```typescript
<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
  <MenuItem onClick={() => {
    if (selectedEntity) openViewDialog(selectedEntity)
    handleMenuClose()
  }}>
    <Visibility sx={{ mr: 1 }} /> View Details
  </MenuItem>
  <MenuItem onClick={() => {
    const entity = financeState.entities.find(e => e.id === selectedEntity)
    if (entity) openEditDialog(entity)
    handleMenuClose()
  }}>
    <Edit sx={{ mr: 1 }} /> Edit
  </MenuItem>
  <Divider />
  <MenuItem onClick={openDeleteDialog} sx={{ color: "error.main" }}>
    <Delete sx={{ mr: 1 }} /> Delete
  </MenuItem>
</Menu>
```

**Requirements:**
- ✅ View as first option
- ✅ Edit as second
- ✅ Delete last (red, after divider)
- ✅ Icons for all actions
- ✅ Close menu after action

---

## 📋 REMAINING PAGES TO BUILD

### Quick Reference:

| Page | Status | CRUD Required |
|------|--------|---------------|
| **Contacts** | ✅ Complete | Full CRUD ✅ |
| **Sales** | ✅ Complete | Full CRUD ✅ |
| **Expenses** | ✅ Complete | Full CRUD ✅ + Approval workflow |
| **Banking** | 🔄 Partial | Needs: CREATE/EDIT/DELETE bank accounts, VIEW transaction details |
| **Purchases** | 🔄 Partial | Needs: EDIT/VIEW bills, CREATE/EDIT/DELETE purchase orders |
| **Accounting** | ⏳ Build | Full CRUD for accounts & journal entries |
| **Reports** | ⏳ Build | CREATE/VIEW/DELETE reports (no EDIT needed) |
| **Currency** | ⏳ Build | Full CRUD for currencies |
| **Budgeting** | ⏳ Build | Full CRUD for budgets |

---

## 🛠️ Implementation Checklist

For each remaining page, ensure:

### CREATE Operation
- [ ] CREATE button in DataHeader
- [ ] CRUDModal with mode="create"
- [ ] Form with all required fields
- [ ] Field validation
- [ ] Default values
- [ ] Call context create method
- [ ] Refresh data after create
- [ ] Reset form on close
- [ ] Success notification (handled by context)

### READ Operation
- [ ] Table with all entities
- [ ] Search functionality
- [ ] Status/category filters
- [ ] Date filtering
- [ ] Sorting options
- [ ] Summary statistics cards
- [ ] Tabs for different views (if applicable)
- [ ] Loading state
- [ ] Error state
- [ ] Empty state

### UPDATE Operation
- [ ] Edit menu item
- [ ] openEditDialog function
- [ ] Pre-fill form with entity data
- [ ] CRUDModal with mode="edit"
- [ ] Call context update method
- [ ] Refresh data after update
- [ ] Close menu after action

### DELETE Operation
- [ ] Delete menu item (red)
- [ ] Confirmation dialog
- [ ] Warning message
- [ ] Call context delete method
- [ ] Refresh data after delete
- [ ] Close menu after action

### VIEW Operation
- [ ] View menu item (first)
- [ ] Detail dialog with all info
- [ ] Organized sections in cards
- [ ] Proper formatting
- [ ] Optional quick actions
- [ ] Avatar/icon

---

## 🎨 UI Consistency

### Colors by Status:
- **Success**: Green (`success`) - paid, approved, completed, active
- **Warning**: Orange (`warning`) - pending, draft, overdue
- **Error**: Red (`error`) - rejected, cancelled, failed
- **Info**: Blue (`info`) - sent, in progress
- **Primary**: Theme color - default, sent
- **Default**: Gray - inactive, archived

### Icons by Action:
- **View**: `<Visibility />`
- **Edit**: `<Edit />`
- **Delete**: `<Delete />`
- **Create**: `<Add />`
- **Save**: `<Save />`
- **Send**: `<Send />`
- **Approve**: `<CheckCircle />`
- **Reject**: `<Cancel />`
- **Download**: `<Download />`
- **Upload**: `<CloudUpload />`

### Card Patterns:
- **Summary Cards**: Use `AnimatedCounter` for numbers
- **Detail Cards**: Use `Card variant="outlined"` with sections
- **Table Cards**: Use `Card` > `CardContent` > `TableContainer`

---

## 💡 Best Practices

1. **Always Close Menus**: Call `handleMenuClose()` after every menu action
2. **Always Refresh**: Call `refreshEntity()` after CREATE/UPDATE/DELETE
3. **Always Reset Forms**: Call `resetForm()` when closing modals
4. **Always Validate**: Mark required fields and validate before submit
5. **Always Confirm Deletes**: Use confirmation dialog, never delete directly
6. **Always Show Details**: Provide VIEW dialog, don't just rely on edit
7. **Always Handle Errors**: Try-catch around all async operations
8. **Always Show Loading**: Display loading state while fetching data
9. **Always Format Data**: Use proper currency, date, number formatting
10. **Always Use Context**: Never bypass context, always use provided methods

---

## 🚀 Quick Start

To create a new Finance page with full CRUD:

1. **Copy template** from this document
2. **Replace entity names** (e.g., "Invoice" → "Budget")
3. **Update form fields** to match entity interface
4. **Update context methods** to use correct entity type
5. **Add custom actions** specific to entity (optional)
6. **Test all CRUD operations**
7. **Add to Finance.tsx** navigation
8. **Update permissions** if needed

---

## 📊 Success Metrics

A complete CRUD page should have:
- ✅ 4+ Dialog/Modal components (CREATE, EDIT, VIEW, DELETE)
- ✅ 1 Actions Menu with 3+ options
- ✅ 1 DataHeader with search and filters
- ✅ 2-4 Summary statistic cards
- ✅ 1 Main table with data
- ✅ All context methods properly called
- ✅ Proper error handling
- ✅ Loading states
- ✅ Empty states
- ✅ Confirmation for destructive actions
- ✅ Form validation
- ✅ Consistent UI/UX

---

## 📝 Example Code References

See these files for complete implementations:
1. `src/frontend/pages/finance/Contacts.tsx` - Master example
2. `src/frontend/pages/finance/Sales.tsx` - Invoices with line items
3. `src/frontend/pages/finance/Expenses.tsx` - Approval workflow example

Follow these patterns exactly for consistency across all Finance pages.

