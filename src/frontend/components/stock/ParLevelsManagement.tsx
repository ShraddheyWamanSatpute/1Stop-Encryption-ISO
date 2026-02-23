"use client"

import React, { useState, useMemo, useEffect } from "react"
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Snackbar,
  Alert,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Autocomplete,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
} from "@mui/material"
import {
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  GroupWork as ParLevelIcon,
  DateRange as DateRangeIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material"
import { useStock } from "../../../backend/context/StockContext"
import DataHeader from "../reusable/DataHeader"
import type { Column, ParLevelRow } from "../../../backend/interfaces/Stock"

// Complete columns array with all available columns
const columns: Column[] = [
  { id: "productName", label: "Product Name", visible: true, sortable: true, filterable: true, minWidth: 200 },
  { id: "subcategory", label: "Subcategory", visible: true, sortable: true, filterable: true, minWidth: 120 },
  { id: "salesDivision", label: "Sales Division", visible: true, sortable: true, filterable: true, minWidth: 120 },
  { id: "type", label: "Type", visible: true, sortable: true, filterable: true, minWidth: 100 },
  { id: "measureName", label: "Measure", visible: true, sortable: true, filterable: true, minWidth: 120 },
  { id: "lowStockValueWithUnit", label: "Low Stock Value", visible: true, sortable: true, filterable: false, minWidth: 130, align: "right" },
  { id: "parLevelWithUnit", label: "Par Level", visible: true, sortable: true, filterable: false, minWidth: 120, align: "right" },
]

// Default visible columns (core par level columns)
const defaultVisibleColumns = [
  "productName",
  "subcategory",
  "salesDivision",
  "type",
  "measureName",
  "lowStockValueWithUnit",
  "parLevelWithUnit",
]

const ParLevelsManagement: React.FC = () => {
  const { 
    state, 
    fetchParProfiles,
    saveParLevelProfile,
    deleteParProfile,
  } = useStock()
  const { products, measures, dataVersion, loading } = state

  // DataHeader state
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string>("productName")
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>("asc")
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(defaultVisibleColumns))
  const [groupBy, setGroupBy] = useState<{ field: string; label: string }>({ field: "none", label: "None" })
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Par level profiles state
  const [profiles, setProfiles] = useState<any[]>([])
  const [selectedProfile, setSelectedProfile] = useState<string>("")
  const [parLevelItems, setParLevelItems] = useState<any[]>([])

  // Inline editing state
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editParLevel, setEditParLevel] = useState<number>(0)
  const [editLowStockValue, setEditLowStockValue] = useState<number>(0)
  const [editMeasureId, setEditMeasureId] = useState<string>("")
  
  // Bulk edit mode state
  const [bulkEditMode, setBulkEditMode] = useState<boolean>(false)
  
  // Profile editing state
  const [editingProfileName, setEditingProfileName] = useState<boolean>(false)
  const [editingProfileDescription, setEditingProfileDescription] = useState<boolean>(false)
  const [tempProfileName, setTempProfileName] = useState<string>("")
  const [tempProfileDescription, setTempProfileDescription] = useState<string>("")
  const [tempParType, setTempParType] = useState<"static" | "per-bookings">("static")
  const [tempPerAmountOfGuests, setTempPerAmountOfGuests] = useState<number>(0)

  // Inline editing state
  const [editingProfile, setEditingProfile] = useState<any>(null)
  const [profileData, setProfileData] = useState({
    name: "",
    description: "",
    parType: "static" as "static" | "per-bookings",
    perAmountOfGuests: 0,
    dateRange: {
      start: "",
      end: ""
    }
  })


  // Dialog states
  const [newProfileDialog, setNewProfileDialog] = useState(false)
  const [editProfileDialog, setEditProfileDialog] = useState(false)
  const [deleteProfileDialog, setDeleteProfileDialog] = useState(false)
  const [newProfileName, setNewProfileName] = useState("")
  const [newProfileDescription, setNewProfileDescription] = useState("")
  const [newProfileIsDefault, setNewProfileIsDefault] = useState(false)
  const [editProfileName, setEditProfileName] = useState("")
  const [editProfileDescription, setEditProfileDescription] = useState("")
  const [editProfileIsDefault, setEditProfileIsDefault] = useState(false)

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info"
  })

  const showSnackbar = (message: string, severity: "success" | "error" | "warning" | "info") => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  // Fetch profiles on component mount and when dataVersion changes
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const fetchedProfiles = await fetchParProfiles()
        setProfiles(fetchedProfiles)
        if (fetchedProfiles.length > 0 && !selectedProfile) {
          setSelectedProfile(fetchedProfiles[0].id!)
        }
      } catch (error) {
        console.error("Error fetching par profiles:", error)
        showSnackbar("Failed to fetch par level profiles", "error")
      }
    }
    fetchProfiles()
  }, [])

  // DataHeader configuration
  const sortOptions = [
    { value: "productName", label: "Product Name" },
    { value: "category", label: "Category" },
    { value: "subcategory", label: "Subcategory" },
    { value: "salesDivision", label: "Sales Division" },
    { value: "type", label: "Type" },
    { value: "parLevel", label: "Par Level" },
    { value: "lowStockValue", label: "Low Stock Value" },
    { value: "measureName", label: "Measure" }
  ]

  const groupByOptions = [
    { value: "none", label: "None" },
    { value: "category", label: "Category" },
    { value: "subcategory", label: "Subcategory" },
    { value: "salesDivision", label: "Sales Division" },
    { value: "type", label: "Type" },
  ]

  // Filter and sort par level items (updates when dataVersion changes)
  const sortedAndFilteredItems = useMemo(() => {
    const filtered = parLevelItems.filter((item) => {
      const product = products.find((p: any) => p.id === item.productId)
      if (!product) return false
      
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.categoryName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.subcategoryName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.salesDivisionName || "").toLowerCase().includes(searchTerm.toLowerCase())

      return matchesSearch
    })

    // Sort the data
    filtered.sort((a, b) => {
      const productA = products.find((p: any) => p.id === a.productId)
      const productB = products.find((p: any) => p.id === b.productId)
      
      let aValue, bValue
      if (sortBy === "productName") {
        aValue = productA?.name || ""
        bValue = productB?.name || ""
      } else if (sortBy === "parLevel") {
        aValue = a.parLevel || 0
        bValue = b.parLevel || 0
      } else if (sortBy === "lowStockValue") {
        aValue = a.lowStockValue || 0
        bValue = b.lowStockValue || 0
      } else {
        aValue = a[sortBy as keyof typeof a] || ""
        bValue = b[sortBy as keyof typeof b] || ""
      }
      
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return sortDirection === "asc" ? ((aValue || 0) < (bValue || 0) ? -1 : 1) : (bValue || 0) < (aValue || 0) ? -1 : 1
    })

    return filtered
  }, [parLevelItems, products, dataVersion, searchTerm, sortBy, sortDirection])

  // Group data by field
  const groupData = (data: any[]) => {
    if (groupBy.field === "none") return { "All Items": data }

    const grouped: { [key: string]: any[] } = {}

    data.forEach((item) => {
      const product = products.find((p: any) => p.id === item.productId)
      if (!product) return
      
      let groupKey = ""
      switch (groupBy.field) {
        case "type":
          groupKey = product.type || "Unknown"
          break
        case "category":
          groupKey = product.categoryName || "Unknown"
          break
        case "subcategory":
          groupKey = product.subcategoryName || "Unknown"
          break
        case "salesDivision":
          groupKey = product.salesDivisionName || "Unknown"
          break
        default:
          groupKey = "All Items"
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = []
      }
      grouped[groupKey].push(item)
    })

    return grouped
  }

  // Handle sorting
  const handleSort = (columnId: string) => {
    const column = columnId as keyof ParLevelRow
    const isAsc = sortBy === column && sortDirection === "asc"
    setSortDirection(isAsc ? "desc" : "asc")
    setSortBy(column)
  }

  // Handle group toggle
  const handleGroupToggle = (groupKey: string) => {
    const newExpandedGroups = new Set(expandedGroups)
    if (newExpandedGroups.has(groupKey)) {
      newExpandedGroups.delete(groupKey)
    } else {
      newExpandedGroups.add(groupKey)
    }
    setExpandedGroups(newExpandedGroups)
  }




  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingItem(null)
    setEditParLevel(0)
    setEditLowStockValue(0)
    setEditMeasureId("")
  }

  // Handle toggle bulk edit mode
  const handleToggleBulkEdit = async () => {
    if (bulkEditMode) {
      // Exiting bulk edit mode, save all changes
      await handleSaveAllChanges()
      setEditingItem(null)
      setEditingProfileName(false)
      setEditingProfileDescription(false)
    } else {
      // Entering bulk edit mode, also enable profile editing
      const currentProfile = profiles.find((p) => p.id === selectedProfile)
      if (currentProfile) {
        setTempProfileName(currentProfile.name || "")
        setTempProfileDescription(currentProfile.description || "")
        setTempParType(currentProfile.parType || "static")
        setTempPerAmountOfGuests(currentProfile.perAmountOfGuests || 0)
        setEditingProfileName(true)
        setEditingProfileDescription(true)
      }
    }
    setBulkEditMode(!bulkEditMode)
  }

  // Handle save all changes when exiting bulk edit mode
  const handleSaveAllChanges = async () => {
    if (!selectedProfile) {
      showSnackbar("Please select a par level profile first", "warning")
      return
    }

    try {
      // Update the profile with all the current items
      const profileToUpdate = profiles.find((p) => p.id === selectedProfile)
      if (profileToUpdate) {
        // Convert items back to parLevels object
        const updatedParLevels = { ...profileToUpdate.parLevels }
        
        parLevelItems.forEach(item => {
          updatedParLevels[item.id] = {
            parLevel: item.parLevel,
            lowStockValue: item.lowStockValue,
            measureId: item.measureId,
          }
        })

        const updatedProfile = {
          ...profileToUpdate,
          parLevels: updatedParLevels,
          name: tempProfileName || profileToUpdate.name,
          description: tempProfileDescription || profileToUpdate.description,
          parType: tempParType,
          perAmountOfGuests: tempPerAmountOfGuests,
          updatedAt: new Date().toISOString(),
        }
        await saveParLevelProfile(updatedProfile)
        showSnackbar("All par levels updated successfully", "success")
        
        // Reset temp values
        setTempProfileName("")
        setTempProfileDescription("")
        setEditingProfileName(false)
        setEditingProfileDescription(false)
      }
    } catch (error) {
      console.error("Error saving all par levels:", error)
      showSnackbar("Failed to save par levels", "error")
    }
  }



  // Handle create new profile
  const handleCreateNew = () => {
    setEditingProfile({ id: null, name: "", description: "", parType: "static" })
    setProfileData({
      name: "",
      description: "",
      parType: "static",
      perAmountOfGuests: 0,
      dateRange: { start: "", end: "" }
    })
    setParLevelItems([])
  }

  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      const profileToSave = {
        ...editingProfile,
        ...profileData,
        items: parLevelItems
      }

      await saveParLevelProfile(profileToSave)
      showSnackbar("Profile saved successfully", "success")
      setEditingProfile(null)
      setProfileData({
        name: "",
        description: "",
        parType: "static",
        perAmountOfGuests: 0,
        dateRange: { start: "", end: "" }
      })
      setParLevelItems([])
      
      // Refresh profiles
      const fetchedProfiles = await fetchParProfiles()
      setProfiles(fetchedProfiles)
    } catch (error) {
      console.error("Error saving profile:", error)
      showSnackbar("Failed to save profile", "error")
    }
  }


  // Handle add item
  const handleAddItem = () => {
    setParLevelItems([...parLevelItems, {
      id: Date.now().toString(),
      productId: "",
      measureId: "",
      parLevel: 0,
      lowStockValue: 0
    }])
  }

  // Handle update item
  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...parLevelItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setParLevelItems(updatedItems)
  }


  // Handle create new profile (dialog)
  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      showSnackbar("Profile name is required", "warning")
      return
    }

    try {
      const newProfile = {
        name: newProfileName.trim(),
        description: newProfileDescription.trim(),
        parType: "static",
        isDefault: newProfileIsDefault,
        items: []
      }

      await saveParLevelProfile(newProfile)
      showSnackbar("Profile created successfully", "success")
      
      // Reset form
      setNewProfileName("")
      setNewProfileDescription("")
      setNewProfileIsDefault(false)
      setNewProfileDialog(false)
      
      // Refresh profiles
      const fetchedProfiles = await fetchParProfiles()
      setProfiles(fetchedProfiles)
    } catch (error) {
      console.error("Error creating profile:", error)
      showSnackbar("Failed to create profile", "error")
    }
  }


  // Handle save profile edit (dialog)
  const handleSaveProfileEdit = async () => {
    if (!editProfileName.trim()) {
      showSnackbar("Profile name is required", "warning")
      return
    }

    try {
      const profileToUpdate = profiles.find(p => p.id === selectedProfile)
      if (!profileToUpdate) {
        showSnackbar("Profile not found", "error")
        return
      }

      const updatedProfile = {
        ...profileToUpdate,
        name: editProfileName.trim(),
        description: editProfileDescription.trim(),
        isDefault: editProfileIsDefault
      }

      await saveParLevelProfile(updatedProfile)
      showSnackbar("Profile updated successfully", "success")
      
      setEditProfileDialog(false)
      
      // Refresh profiles
      const fetchedProfiles = await fetchParProfiles()
      setProfiles(fetchedProfiles)
    } catch (error) {
      console.error("Error updating profile:", error)
      showSnackbar("Failed to update profile", "error")
    }
  }

  // Handle delete profile
  const handleDeleteProfile = async () => {
    if (!selectedProfile) return

    try {
      await deleteParProfile(selectedProfile)
      showSnackbar("Profile deleted successfully", "success")
      
      // Update local state
      const updatedProfiles = profiles.filter(p => p.id !== selectedProfile)
      setProfiles(updatedProfiles)
      setSelectedProfile(updatedProfiles.length > 0 ? updatedProfiles[0].id! : "")
      
      setDeleteProfileDialog(false)
    } catch (error) {
      console.error("Error deleting profile:", error)
      showSnackbar("Failed to delete profile", "error")
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    try {
      const fetchedProfiles = await fetchParProfiles()
      setProfiles(fetchedProfiles)
      
      // Transform products to par level rows
      await transformProductsToParLevelRows()
      
      showSnackbar("Data refreshed successfully", "success")
    } catch (error) {
      console.error("Error refreshing data:", error)
      showSnackbar("Failed to refresh data", "error")
    }
  }

  // Transform products to par level rows
  const transformProductsToParLevelRows = async () => {
    if (!products.length || !measures.length) {
      return
    }

    // setLoading(true)
    try {
      const selectedProfileData = profiles.find((p) => p.id === selectedProfile)
      const parLevelRows: ParLevelRow[] = []

      for (const product of products) {
        if (!product.id) continue

        // Get category and subcategory names
        const categoryName = "Unknown" // TODO: Get from categories
        const subcategoryName = "Unknown" // TODO: Get from subcategories
        const salesDivisionName = "Unknown" // TODO: Get from salesDivisions

        // Get measures
        const purchaseMeasureId = product.purchase?.defaultMeasure
        const salesMeasureId = product.sale?.defaultMeasure
        const purchaseMeasure = measures.find((m: any) => m.id === purchaseMeasureId)
        const salesMeasure = measures.find((m: any) => m.id === salesMeasureId)

        // Get par level for this product from the selected profile
        const parLevelData = selectedProfileData?.parLevels?.[product.id]
        let parLevelValue = 0
        let lowStockValue = 0
        let parLevelMeasureId = ""
        
        if (parLevelData && typeof parLevelData === "object") {
          parLevelValue = parLevelData.parLevel || 0
          lowStockValue = parLevelData.lowStockValue || 0
          parLevelMeasureId = parLevelData.measureId || ""
        }

        // Calculate current stock (simplified)
        const currentStock = product.currentStock || 0
        const predictedStock = product.predictedStock || currentStock

        // Calculate order quantity
        const orderQuantity = Math.max(0, parLevelValue - currentStock)


        // Get the primary measure for display
        const primaryMeasure = purchaseMeasure || salesMeasure
        const primaryMeasureId = purchaseMeasureId || salesMeasureId
        const parLevelMeasure = measures.find((m: any) => m.id === parLevelMeasureId)

        parLevelRows.push({
          productId: product.id,
          productName: product.name || "Unknown Product",
          category: categoryName,
          subcategory: subcategoryName,
          salesDivision: salesDivisionName,
          type: product.type || "Unknown",
          currentStock: currentStock,
          predictedStock: predictedStock.toString(),
          predictedStockValue: predictedStock,
          parLevel: parLevelValue,
          parLevelWithUnit: parLevelValue > 0 ? `${parLevelValue} ${parLevelMeasure?.name || primaryMeasure?.name || "unit"}` : "0",
          orderQuantity: orderQuantity,
          orderQuantityWithUnit: orderQuantity > 0 ? `${orderQuantity.toFixed(2)} ${primaryMeasure?.name || "unit"}` : "0",
          measureId: primaryMeasureId || "",
          measureName: primaryMeasure?.name || "Unknown",
          parLevelMeasureId: parLevelMeasureId || primaryMeasureId || "",
          lowStockValue: lowStockValue,
          lowStockValueWithUnit: lowStockValue > 0 ? `${lowStockValue} ${parLevelMeasure?.name || primaryMeasure?.name || "unit"}` : "0",
          // Additional fields for compatibility
          purchaseBaseQuantity: "0",
          purchaseBaseQuantityValue: 0,
          totalPurchaseQuantity: "0",
          totalPurchaseQuantityValue: 0,
          totalPurchaseCost: 0,
          purchaseSupplier: "",
          purchaseMeasure: purchaseMeasure?.name || "",
          salesBaseQuantity: "0",
          salesBaseQuantityValue: 0,
          totalSoldQuantity: "0",
          totalSoldQuantityValue: 0,
          totalSoldValue: 0,
          salesMeasure: salesMeasure?.name || "",
          profit: 0,
          costPerUnit: 0,
          totalValue: 0,
          defaultMeasure: primaryMeasure?.name || "unit",
        } as ParLevelRow)
      }

      // setRows(parLevelRows)
    } catch (error) {
      console.error("Error transforming products to par level rows:", error)
      showSnackbar("Error loading product data", "error")
    } finally {
      // setLoading(false)
    }
  }

  // Load all products as par level items when selected profile changes
  useEffect(() => {
    if (!selectedProfile || !products.length) {
      setParLevelItems([])
      return
    }

    const selectedProfileData = profiles.find((p) => p.id === selectedProfile)
    const profileParLevels = selectedProfileData?.parLevels || {}

    // Convert all products to par level items
    const items = products.map((product: any) => {
      const parLevelData = profileParLevels[product.id] || {}
      return {
        id: product.id,
        productId: product.id,
        parLevel: parLevelData.parLevel || 0,
        lowStockValue: parLevelData.lowStockValue || 0,
        measureId: parLevelData.measureId || product.purchase?.defaultMeasure || "",
      }
    })

    setParLevelItems(items)
  }, [selectedProfile, profiles, products, dataVersion])

  // Handle export
  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting par levels as ${format}`)
    showSnackbar(`Export as ${format.toUpperCase()} not implemented yet`, "info")
  }

  // Column options for DataHeader
  const columnOptions = useMemo(() => 
    columns.map((col: any) => ({
      key: col.id,
      label: col.label,
      visible: visibleColumns.has(col.id)
    })),
    [columns, visibleColumns]
  )

  // Handle column visibility change
  const handleColumnVisibilityChange = (visibility: Record<string, boolean>) => {
    setVisibleColumns(new Set(Object.entries(visibility).filter(([, visible]) => visible).map(([id]) => id)))
  }

  // Handle sort change
  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSortBy(field)
    setSortDirection(direction)
  }

  // Handle group by change
  const handleGroupByChange = (groupByValue: string) => {
    const groupByOption = groupByOptions.find(option => option.value === groupByValue)
    if (groupByOption) {
      setGroupBy({ field: groupByValue, label: groupByOption.label })
    }
  }

  // Additional controls for DataHeader
  const additionalControls = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 400 }}>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel sx={{ color: "white" }}>Par Level Profile</InputLabel>
        <Select
          value={selectedProfile}
          onChange={(e) => setSelectedProfile(e.target.value)}
          label="Par Level Profile"
          sx={{
            color: "white",
            "& .MuiSvgIcon-root": { color: "white" },
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "white" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
          }}
        >
          {profiles.map((profile) => (
            <MenuItem key={profile.id} value={profile.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{profile.name}</span>
                {profile.isDefault && (
                  <Chip 
                    label="Default" 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ height: 16, fontSize: '0.65rem' }}
                  />
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150, fontSize: '0.75rem' }}>
        {profiles.find(p => p.id === selectedProfile)?.description || ''}
      </Typography>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => setNewProfileDialog(true)}
        size="small"
      >
        New Profile
      </Button>
      </Box>
    )

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Loading overlay - doesn't hide content */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            bgcolor: 'info.light',
            borderRadius: 1,
            boxShadow: 2,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            Refreshing data... (v{dataVersion})
          </Typography>
        </Box>
      )}
      
      <DataHeader
        showDateControls={false}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search items..."
        additionalControls={additionalControls}
        columns={columnOptions}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        sortOptions={sortOptions}
        sortValue={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        groupByOptions={groupByOptions}
        groupByValue={groupBy.field}
        onGroupByChange={handleGroupByChange}
        onExportCSV={() => handleExport('csv')}
        onExportPDF={() => handleExport('pdf')}
        onRefresh={handleRefresh}
        additionalButtons={[
          {
            label: "Create Par Level",
            icon: <AddIcon />,
            onClick: handleCreateNew,
            variant: "contained" as const,
            color: "primary" as const
          }
        ]}
      />

      {/* Profile Info */}
      {selectedProfile && (
        <Box sx={{ mb: 2, p: 3, bgcolor: "background.paper", borderRadius: 2, border: 1, borderColor: "divider" }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              {/* Profile Name and Par Type Row */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 1, flexWrap: 'wrap' }}>
                {/* Profile Name */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {editingProfileName || bulkEditMode ? (
                    <TextField
                      value={tempProfileName}
                      onChange={(e) => setTempProfileName(e.target.value)}
                      size="small"
                      variant="outlined"
                      placeholder="Profile Name"
                      sx={{ minWidth: 250 }}
                    />
                  ) : (
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {profiles.find((p) => p.id === selectedProfile)?.name || "Unknown Profile"}
                    </Typography>
                  )}
                  {profiles.find((p) => p.id === selectedProfile)?.isDefault && (
                    <Chip 
                      label="Default" 
                      size="small" 
                      color="primary" 
                      variant="filled"
                      sx={{ height: 24, fontSize: '0.75rem', fontWeight: 500 }}
                    />
                  )}
                </Box>

                {/* Par Type Field */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, fontWeight: 500 }}>
                    Par Type:
                  </Typography>
                  {bulkEditMode ? (
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <Select
                        value={tempParType}
                        onChange={(e) => setTempParType(e.target.value as "static" | "per-bookings")}
                      >
                        <MenuItem value="static">Static</MenuItem>
                        <MenuItem value="per-bookings">Per Bookings</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {profiles.find((p) => p.id === selectedProfile)?.parType || "Static"}
                    </Typography>
                  )}
                </Box>

                {/* Per Amount of Guests Field - Only show if par type is per-bookings */}
                {tempParType === "per-bookings" && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, fontWeight: 500 }}>
                      Per Guests:
                    </Typography>
                    {bulkEditMode ? (
                      <TextField
                        type="number"
                        value={tempPerAmountOfGuests}
                        onChange={(e) => setTempPerAmountOfGuests(Number(e.target.value))}
                        size="small"
                        variant="outlined"
                        sx={{ width: 120 }}
                        inputProps={{ min: 0 }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {profiles.find((p) => p.id === selectedProfile)?.perAmountOfGuests || 0} guests
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
              
              {/* Profile Description */}
              {editingProfileDescription || bulkEditMode ? (
                <TextField
                  value={tempProfileDescription}
                  onChange={(e) => setTempProfileDescription(e.target.value)}
                  size="small"
                  variant="outlined"
                  multiline
                  rows={2}
                  placeholder="Profile Description"
                  sx={{ minWidth: 600, maxWidth: 800, width: '100%' }}
                />
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  {profiles.find((p) => p.id === selectedProfile)?.description || "No description"}
                </Typography>
              )}

            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={bulkEditMode ? <SaveIcon /> : <EditIcon />}
                onClick={handleToggleBulkEdit}
                color={bulkEditMode ? "success" : "primary"}
              >
                {bulkEditMode ? "Save" : "Edit"}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Inline Editing Form */}
      {editingProfile && (
        <Paper sx={{ p: 3, mb: 3, border: 1, borderColor: "primary.main" }}>
          <Typography variant="h6" gutterBottom>
            {editingProfile.id ? "Edit Par Level Profile" : "Create New Par Level Profile"}
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Profile Name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Description"
                value={profileData.description}
                onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Par Type</InputLabel>
                <Select
                  value={profileData.parType}
                  label="Par Type"
                  onChange={(e) => setProfileData({ ...profileData, parType: e.target.value as "static" | "per-bookings" })}
                >
                  <MenuItem value="static">Static</MenuItem>
                  <MenuItem value="per-bookings">Per Bookings</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {profileData.parType === "per-bookings" && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Per Amount of Guests"
                    type="number"
                    value={profileData.perAmountOfGuests}
                    onChange={(e) => setProfileData({ ...profileData, perAmountOfGuests: Number(e.target.value) })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PeopleIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={profileData.dateRange.start}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      dateRange: { ...profileData.dateRange, start: e.target.value }
                    })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DateRangeIcon />
                        </InputAdornment>
                      ),
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={profileData.dateRange.end}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      dateRange: { ...profileData.dateRange, end: e.target.value }
                    })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DateRangeIcon />
                        </InputAdornment>
                      ),
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
          </Grid>

          {/* Par Level Items Table */}
          <Typography variant="h6" gutterBottom>
            Par Level Items
          </Typography>
          
          <TableContainer component={Paper} sx={{ mb: 2, opacity: loading ? 0.7 : 1, transition: 'opacity 0.3s' }}>
        <Table>
              <TableHead>
            <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Measure</TableCell>
                  <TableCell>Par Level</TableCell>
                  <TableCell>Low Stock Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
                {parLevelItems.map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell>
                      <Autocomplete
                        options={products || []}
                        getOptionLabel={(option) => option.name || ""}
                        value={products?.find(p => p.id === item.productId) || null}
                        onChange={(_, newValue) => handleUpdateItem(index, "productId", newValue?.id || "")}
                        renderInput={(params) => (
                          <TextField {...params} variant="outlined" size="small" />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Autocomplete
                        options={measures || []}
                        getOptionLabel={(option) => option.name || ""}
                        value={measures?.find(m => m.id === item.measureId) || null}
                        onChange={(_, newValue) => handleUpdateItem(index, "measureId", newValue?.id || "")}
                        renderInput={(params) => (
                          <TextField {...params} variant="outlined" size="small" />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.parLevel}
                        onChange={(e) => handleUpdateItem(index, "parLevel", Number(e.target.value))}
                        variant="outlined"
                        size="small"
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.lowStockValue}
                        onChange={(e) => handleUpdateItem(index, "lowStockValue", Number(e.target.value))}
                        variant="outlined"
                        size="small"
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddItem}
            >
              Add Item
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancelEdit}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveProfile}
            >
              {editingProfile.id ? "Update Profile" : "Save Profile"}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Comprehensive Par Levels Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: "divider", opacity: loading ? 0.7 : 1, transition: 'opacity 0.3s' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: "action.hover" }}>
            <TableRow>
              {columns
                .filter((column) => visibleColumns.has(column.id))
                .map((column) => (
                  <TableCell 
                    key={column.id} 
                    align="center"
                sx={{ 
                      textAlign: 'center !important',
                      padding: '16px 16px',
                      cursor: column.sortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      fontWeight: 'bold',
                      '&:hover': {
                        backgroundColor: column.sortable ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                      }
                    }}
                    onClick={column.sortable ? () => handleSort(column.id) : undefined}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: 0.5
                    }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {column.label}
                      </Typography>
                      {column.sortable && sortBy === column.id && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </Box>
                      )}
                    </Box>
                </TableCell>
                ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(groupData(sortedAndFilteredItems)).map(([groupKey, groupItems]) => (
              <React.Fragment key={groupKey}>
                {groupBy.field !== "none" && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.filter((col) => visibleColumns.has(col.id)).length}
                      sx={{ bgcolor: "action.selected", fontWeight: "bold" }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                        onClick={() => handleGroupToggle(groupKey)}
                      >
                        {expandedGroups.has(groupKey) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        <ParLevelIcon sx={{ ml: 1, mr: 1 }} />
                        {groupKey} ({groupItems.length} items)
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
                {groupItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.filter((col) => visibleColumns.has(col.id)).length}
                      align="center"
                      sx={{ py: 3 }}
                    >
                      <Typography variant="body1" color="text.secondary">
                        {!selectedProfile
                          ? "Please select a par level profile to view data"
                          : "No products found matching your search"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  groupItems.map((item, index) => {
                    const product = products.find((p: any) => p.id === item.productId)
                    if (!product) return null
                    
                    return (
                      <TableRow
                        key={`${item.id}-${index}`}
                        sx={{
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        {columns
                          .filter((column) => visibleColumns.has(column.id))
                          .map((column) => {
                            let value
                            if (column.id === "productName") {
                              value = product.name
                            } else if (column.id === "category") {
                              value = product.categoryName || "Unknown"
                            } else if (column.id === "subcategory") {
                              value = product.subcategoryName || "Unknown"
                            } else if (column.id === "salesDivision") {
                              value = product.salesDivisionName || "Unknown"
                            } else if (column.id === "type") {
                              value = product.type
                            } else if (column.id === "parLevelWithUnit") {
                              const measure = measures.find((m: any) => m.id === item.measureId)
                              value = item.parLevel > 0 ? `${item.parLevel} ${measure?.name || "unit"}` : "0"
                            } else if (column.id === "lowStockValueWithUnit") {
                              const measure = measures.find((m: any) => m.id === item.measureId)
                              value = item.lowStockValue > 0 ? `${item.lowStockValue} ${measure?.name || "unit"}` : "0"
                            } else if (column.id === "measureName") {
                              const measure = measures.find((m: any) => m.id === item.measureId)
                              value = measure?.name || "Unknown"
                            } else {
                              value = item[column.id as keyof typeof item] || ""
                            }
                            
                            return (
                              <TableCell key={column.id} align="center" sx={{ verticalAlign: 'middle' }}>
                                {column.id === "parLevelWithUnit" && (editingItem === item.id || bulkEditMode) ? (
                                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", justifyContent: "center" }}>
                                    <TextField
                                      type="number"
                                      value={bulkEditMode ? item.parLevel || 0 : editParLevel}
                                      onChange={(e) => {
                                        if (bulkEditMode) {
                                          // Update the item directly in bulk edit mode
                                          const updatedItems = parLevelItems.map(parItem => 
                                            parItem.id === item.id 
                                              ? { ...parItem, parLevel: Number(e.target.value) }
                                              : parItem
                                          )
                                          setParLevelItems(updatedItems)
                                        } else {
                                          setEditParLevel(Number(e.target.value))
                                        }
                                      }}
                      size="small" 
                                      sx={{ width: 80 }}
                                      inputProps={{ min: 0, step: 0.01 }}
                                    />
                                    <FormControl size="small" sx={{ minWidth: 100 }}>
                                      <Select value={editMeasureId} onChange={(e) => setEditMeasureId(e.target.value)}>
                                        {measures.map((measure: any) => (
                                          <MenuItem key={measure.id} value={measure.id}>
                                            {measure.name}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </Box>
                                ) : column.id === "lowStockValueWithUnit" && (editingItem === item.id || bulkEditMode) ? (
                                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", justifyContent: "center" }}>
                                    <TextField
                                      type="number"
                                      value={bulkEditMode ? item.lowStockValue || 0 : editLowStockValue}
                                      onChange={(e) => {
                                        if (bulkEditMode) {
                                          // Update the item directly in bulk edit mode
                                          const updatedItems = parLevelItems.map(parItem => 
                                            parItem.id === item.id 
                                              ? { ...parItem, lowStockValue: Number(e.target.value) }
                                              : parItem
                                          )
                                          setParLevelItems(updatedItems)
                                        } else {
                                          setEditLowStockValue(Number(e.target.value))
                                        }
                                      }}
                                      size="small"
                                      sx={{ width: 80 }}
                                      inputProps={{ min: 0, step: 0.01 }}
                                    />
                                    <FormControl size="small" sx={{ minWidth: 100 }}>
                                      <Select value={editMeasureId} onChange={(e) => setEditMeasureId(e.target.value)}>
                                        {measures.map((measure: any) => (
                                          <MenuItem key={measure.id} value={measure.id}>
                                            {measure.name}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                  </Box>
                                ) : column.id === "parLevelWithUnit" && editingItem !== item.id ? (
                                  <Typography>{value}</Typography>
                                ) : column.id === "lowStockValueWithUnit" && editingItem !== item.id ? (
                                  <Typography>{value}</Typography>
                                ) : column.format ? (
                                  column.format(value)
                                ) : (
                                  value
                                )}
                </TableCell>
                            )
                          })}
              </TableRow>
                    )
                  })
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {sortedAndFilteredItems.length} of {parLevelItems.length} items
          </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Total Items: {parLevelItems.length}
          </Typography>
        </Box>
      </Box>

      {/* New Profile Dialog */}
      <Dialog open={newProfileDialog} onClose={() => setNewProfileDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Par Level Profile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Profile Name"
            fullWidth
            variant="outlined"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newProfileDescription}
            onChange={(e) => setNewProfileDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newProfileIsDefault}
                onChange={(e) => setNewProfileIsDefault(e.target.checked)}
                color="primary"
              />
            }
            label="Make this the default profile"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewProfileDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateProfile} variant="contained">
            Create Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileDialog} onClose={() => setEditProfileDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Par Level Profile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Profile Name"
            fullWidth
            variant="outlined"
            value={editProfileName}
            onChange={(e) => setEditProfileName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={editProfileDescription}
            onChange={(e) => setEditProfileDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={editProfileIsDefault}
                onChange={(e) => setEditProfileIsDefault(e.target.checked)}
                color="primary"
              />
            }
            label="Make this the default profile"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProfileDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveProfileEdit} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Profile Dialog */}
      <Dialog open={deleteProfileDialog} onClose={() => setDeleteProfileDialog(false)}>
        <DialogTitle>Delete Par Level Profile</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the profile "{profiles.find((p) => p.id === selectedProfile)?.name}"? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteProfileDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteProfile} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ParLevelsManagement
