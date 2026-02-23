"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Stack,
  Grid,
  useTheme,
  useMediaQuery,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  LinearProgress,
} from "@mui/material"
import {
  Inventory,
  Add,
  Edit,
  Delete,
  ShoppingCart,
  Assessment,
  Warning,
  CheckCircle,
  Error,
  Category as CategoryIcon,
  Analytics,
  TrendingUp,
  TrendingDown,
  DateRange,
} from "@mui/icons-material"
import { ref as dbRef, onValue, push, update, remove } from "firebase/database"
import { db } from "../services/firebase"

interface ConsumableItem {
  id: string
  name: string
  category: string
  unit: string
  packSize: number
  packUnit: string
  currentStock: number
  parLevel: number
  cost: number
  supplier?: string
  lastUpdated: string
  countHistory: Array<{
    date: string
    count: number
    countedBy: string
    method: "pack" | "unit" | "partial"
    previousCount?: number
  }>
}

interface ConsumableCategory {
  id: string
  name: string
  description?: string
  color?: string
  createdAt: string
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const ConsumablesManagement: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  const [tabValue, setTabValue] = useState(0)
  const [items, setItems] = useState<ConsumableItem[]>([])
  const [categories, setCategories] = useState<ConsumableCategory[]>([])
  const [, setLoading] = useState(true)

  // Dialog states
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [editItemOpen, setEditItemOpen] = useState(false)
  const [countItemOpen, setCountItemOpen] = useState(false)
  const [] = useState(false)
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [editCategoryOpen, setEditCategoryOpen] = useState(false)

  // Form states
  const [selectedItem, setSelectedItem] = useState<ConsumableItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ConsumableCategory | null>(null)
  const [newItem, setNewItem] = useState<Partial<ConsumableItem>>({
    name: "",
    category: "",
    unit: "",
    packSize: 1,
    packUnit: "",
    currentStock: 0,
    parLevel: 0,
    cost: 0,
    supplier: "",
  })
  const [newCategory, setNewCategory] = useState<Partial<ConsumableCategory>>({
    name: "",
    description: "",
    color: "#1976d2",
  })

  // Count states
  const [countValue, setCountValue] = useState<number>(0)
  const [countMethod, setCountMethod] = useState<"pack" | "unit" | "partial">("unit")

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<string>("all")

  // Reports states
  const [reportDateFrom, setReportDateFrom] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  )
  const [reportDateTo, setReportDateTo] = useState<string>(new Date().toISOString().split("T")[0])
  const [reportCategoryFilter, setReportCategoryFilter] = useState<string>("all")

  useEffect(() => {
    setLoading(true)

    // Load items
    const itemsRef = dbRef(db, "consumables")
    const unsubscribeItems = onValue(itemsRef, (snapshot) => {
      const data = snapshot.val()
      const itemsList: ConsumableItem[] = []

      if (data) {
        Object.entries(data).forEach(([id, item]: [string, any]) => {
          itemsList.push({
            id,
            ...item,
            countHistory: item.countHistory || [],
          })
        })
      }

      setItems(itemsList)
    })

    // Load categories
    const categoriesRef = dbRef(db, "consumableCategories")
    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val()
      const categoriesList: ConsumableCategory[] = []

      if (data) {
        Object.entries(data).forEach(([id, category]: [string, any]) => {
          categoriesList.push({
            id,
            ...category,
          })
        })
      } else {
        // Create default categories if none exist
        const defaultCategories = [
          { name: "Beverages", description: "Drinks and beverages", color: "#2196f3" },
          { name: "Food", description: "Food items and ingredients", color: "#4caf50" },
          { name: "Cleaning", description: "Cleaning supplies", color: "#ff9800" },
          { name: "Paper Goods", description: "Paper products", color: "#9c27b0" },
          { name: "Kitchen Supplies", description: "Kitchen equipment and supplies", color: "#f44336" },
          { name: "Bar Supplies", description: "Bar equipment and supplies", color: "#795548" },
        ]

        defaultCategories.forEach(async (cat) => {
          await push(dbRef(db, "consumableCategories"), {
            ...cat,
            createdAt: new Date().toISOString(),
          })
        })
      }

      setCategories(categoriesList)
      setLoading(false)
    })

    return () => {
      unsubscribeItems()
      unsubscribeCategories()
    }
  }, [])

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category || !newItem.unit) return

    try {
      const itemsRef = dbRef(db, "consumables")
      await push(itemsRef, {
        ...newItem,
        lastUpdated: new Date().toISOString(),
        countHistory: [],
      })

      setNewItem({
        name: "",
        category: "",
        unit: "",
        packSize: 1,
        packUnit: "",
        currentStock: 0,
        parLevel: 0,
        cost: 0,
        supplier: "",
      })
      setAddItemOpen(false)
    } catch (error) {
      console.error("Error adding item:", error)
    }
  }

  const handleEditItem = async () => {
    if (!selectedItem) return

    try {
      const itemRef = dbRef(db, `consumables/${selectedItem.id}`)
      await update(itemRef, {
        ...selectedItem,
        lastUpdated: new Date().toISOString(),
      })

      setEditItemOpen(false)
      setSelectedItem(null)
    } catch (error) {
      console.error("Error updating item:", error)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const itemRef = dbRef(db, `consumables/${itemId}`)
      await remove(itemRef)
    } catch (error) {
      console.error("Error deleting item:", error)
    }
  }

  const handleCountItem = async () => {
    if (!selectedItem) return

    let finalCount = countValue

    // Convert count based on method
    if (countMethod === "pack") {
      finalCount = countValue * selectedItem.packSize
    }

    try {
      const itemRef = dbRef(db, `consumables/${selectedItem.id}`)
      const newCountEntry = {
        date: new Date().toISOString(),
        count: finalCount,
        countedBy: "Current User",
        method: countMethod,
        previousCount: selectedItem.currentStock,
      }

      const updatedHistory = [...(selectedItem.countHistory || []), newCountEntry]

      await update(itemRef, {
        currentStock: finalCount,
        lastUpdated: new Date().toISOString(),
        countHistory: updatedHistory,
      })

      setCountItemOpen(false)
      setSelectedItem(null)
      setCountValue(0)
    } catch (error) {
      console.error("Error updating count:", error)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.name) return

    try {
      const categoriesRef = dbRef(db, "consumableCategories")
      await push(categoriesRef, {
        ...newCategory,
        createdAt: new Date().toISOString(),
      })

      setNewCategory({
        name: "",
        description: "",
        color: "#1976d2",
      })
      setAddCategoryOpen(false)
    } catch (error) {
      console.error("Error adding category:", error)
    }
  }

  const handleEditCategory = async () => {
    if (!selectedCategory) return

    try {
      const categoryRef = dbRef(db, `consumableCategories/${selectedCategory.id}`)
      await update(categoryRef, selectedCategory)

      setEditCategoryOpen(false)
      setSelectedCategory(null)
    } catch (error) {
      console.error("Error updating category:", error)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const itemsUsingCategory = items.filter(
      (item) => categories.find((cat) => cat.id === categoryId)?.name === item.category,
    )

    if (itemsUsingCategory.length > 0) {
      alert(`Cannot delete category. ${itemsUsingCategory.length} items are using this category.`)
      return
    }

    if (!confirm("Are you sure you want to delete this category?")) return

    try {
      const categoryRef = dbRef(db, `consumableCategories/${categoryId}`)
      await remove(categoryRef)
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  const getStockStatus = (item: ConsumableItem) => {
    if (item.currentStock === 0) return "out"
    if (item.currentStock < item.parLevel * 0.5) return "critical"
    if (item.currentStock < item.parLevel) return "low"
    return "good"
  }

  const getStockColor = (status: string) => {
    switch (status) {
      case "out":
        return "error"
      case "critical":
        return "error"
      case "low":
        return "warning"
      case "good":
        return "success"
      default:
        return "default"
    }
  }

  const filteredItems = items.filter((item) => {
    const categoryMatch = categoryFilter === "all" || item.category === categoryFilter
    const stockMatch =
      stockFilter === "all" ||
      (stockFilter === "low" && item.currentStock < item.parLevel) ||
      (stockFilter === "out" && item.currentStock === 0)

    return categoryMatch && stockMatch
  })

  const generateOrderList = () => {
    return items
      .filter((item) => item.currentStock < item.parLevel)
      .map((item) => ({
        ...item,
        orderQuantity: Math.ceil((item.parLevel - item.currentStock) / item.packSize),
        orderCost: Math.ceil((item.parLevel - item.currentStock) / item.packSize) * item.cost,
      }))
  }

  const orderList = generateOrderList()
  const totalOrderCost = orderList.reduce((sum, item) => sum + item.orderCost, 0)

  // Reports calculations
  const reportData = useMemo(() => {
    const fromDate = new Date(reportDateFrom)
    const toDate = new Date(reportDateTo)

    const filteredItems = items.filter(
      (item) => reportCategoryFilter === "all" || item.category === reportCategoryFilter,
    )

    const usageData = filteredItems.map((item) => {
      const relevantHistory = item.countHistory.filter((entry) => {
        const entryDate = new Date(entry.date)
        return entryDate >= fromDate && entryDate <= toDate
      })

      let totalUsage = 0
      let countChanges = 0

      for (let i = 0; i < relevantHistory.length; i++) {
        const entry = relevantHistory[i]
        if (entry.previousCount !== undefined) {
          const usage = entry.previousCount - entry.count
          if (usage > 0) {
            totalUsage += usage
            countChanges++
          }
        }
      }

      return {
        ...item,
        totalUsage,
        countChanges,
        averageUsage: countChanges > 0 ? totalUsage / countChanges : 0,
        lastCount: relevantHistory.length > 0 ? relevantHistory[relevantHistory.length - 1] : null,
      }
    })

    return usageData.sort((a, b) => b.totalUsage - a.totalUsage)
  }, [items, reportDateFrom, reportDateTo, reportCategoryFilter])

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 2, md: 3 },
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
      }}
    >
      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Inventory sx={{ fontSize: { xs: 36, md: 48 }, color: theme.palette.primary.main, mb: 1 }} />
          <Typography
            variant="h4"
            fontWeight={700}
            color="primary"
            gutterBottom
            sx={{ fontSize: { xs: "1.5rem", md: "2.125rem" } }}
          >
            Consumables Management
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: "0.875rem", md: "1rem" } }}>
            Track inventory, set par levels, and generate order lists
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper elevation={2}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Inventory" icon={<Inventory />} />
            <Tab label="Count Stock" icon={<Assessment />} />
            <Tab label="Order List" icon={<ShoppingCart />} />
            <Tab label="Categories" icon={<CategoryIcon />} />
            <Tab label="Reports" icon={<Analytics />} />
          </Tabs>

          {/* Inventory Tab */}
          <TabPanel value={tabValue} index={0}>
            <Stack spacing={3}>
              {/* Controls */}
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setAddItemOpen(true)}
                  size={isMobile ? "small" : "medium"}
                >
                  Add Item
                </Button>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Category</InputLabel>
                  <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} label="Category">
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Stock Level</InputLabel>
                  <Select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} label="Stock Level">
                    <MenuItem value="all">All Items</MenuItem>
                    <MenuItem value="low">Below Par</MenuItem>
                    <MenuItem value="out">Out of Stock</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Items Grid */}
              <Grid container spacing={2}>
                {filteredItems.map((item) => {
                  const status = getStockStatus(item)
                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                      <Card elevation={2}>
                        <CardContent sx={{ p: 2 }}>
                          <Stack spacing={1}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <Typography variant="h6" fontWeight={600} sx={{ fontSize: "1rem" }}>
                                {item.name}
                              </Typography>
                              <Box sx={{ display: "flex", gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedItem(item)
                                    setEditItemOpen(true)
                                  }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={() => handleDeleteItem(item.id)}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>

                            <Chip
                              label={item.category}
                              size="small"
                              sx={{
                                bgcolor:
                                  categories.find((c) => c.name === item.category)?.color || theme.palette.primary.main,
                                color: "white",
                              }}
                            />

                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Current Stock
                              </Typography>
                              <Typography variant="h6" fontWeight={700}>
                                {item.currentStock} {item.unit}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Par Level: {item.parLevel} {item.unit}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min((item.currentStock / item.parLevel) * 100, 100)}
                                color={getStockColor(status) as any}
                                sx={{ mt: 0.5, mb: 1 }}
                              />
                              <Chip
                                label={status.toUpperCase()}
                                color={getStockColor(status) as any}
                                size="small"
                                icon={status === "good" ? <CheckCircle /> : status === "low" ? <Warning /> : <Error />}
                              />
                            </Box>

                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Assessment />}
                              onClick={() => {
                                setSelectedItem(item)
                                setCountItemOpen(true)
                              }}
                              fullWidth
                            >
                              Count Stock
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
            </Stack>
          </TabPanel>

          {/* Count Stock Tab */}
          <TabPanel value={tabValue} index={1}>
            <Stack spacing={3}>
              <Typography variant="h6">Quick Count</Typography>
              <Grid container spacing={2}>
                {items
                  .filter((item) => getStockStatus(item) !== "good")
                  .map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item.id}>
                      <Card elevation={1}>
                        <CardContent sx={{ p: 2 }}>
                          <Stack spacing={1}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {item.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Current: {item.currentStock} {item.unit}
                            </Typography>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => {
                                setSelectedItem(item)
                                setCountItemOpen(true)
                              }}
                            >
                              Count Now
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </Stack>
          </TabPanel>

          {/* Order List Tab */}
          <TabPanel value={tabValue} index={2}>
            <Stack spacing={3}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">Items to Order</Typography>
                <Typography variant="h6" color="primary">
                  Total: £{totalOrderCost.toFixed(2)}
                </Typography>
              </Box>

              {orderList.length === 0 ? (
                <Alert severity="success" icon={<CheckCircle />}>
                  All items are at or above par level!
                </Alert>
              ) : (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Current</TableCell>
                        <TableCell>Par Level</TableCell>
                        <TableCell>Order Qty</TableCell>
                        <TableCell>Cost</TableCell>
                        <TableCell>Supplier</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderList.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            {item.currentStock} {item.unit}
                          </TableCell>
                          <TableCell>
                            {item.parLevel} {item.unit}
                          </TableCell>
                          <TableCell>{item.orderQuantity} packs</TableCell>
                          <TableCell>£{item.orderCost.toFixed(2)}</TableCell>
                          <TableCell>{item.supplier || "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          </TabPanel>

          {/* Categories Tab */}
          <TabPanel value={tabValue} index={3}>
            <Stack spacing={3}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">Manage Categories</Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setAddCategoryOpen(true)}
                  size={isMobile ? "small" : "medium"}
                >
                  Add Category
                </Button>
              </Box>

              <List>
                {categories.map((category, index) => (
                  <Box key={category.id}>
                    <ListItem>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: 1,
                          bgcolor: category.color,
                          mr: 2,
                        }}
                      />
                      <ListItemText primary={category.name} secondary={category.description} />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => {
                            setSelectedCategory(category)
                            setEditCategoryOpen(true)
                          }}
                          sx={{ mr: 1 }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton edge="end" color="error" onClick={() => handleDeleteCategory(category.id)}>
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < categories.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </Stack>
          </TabPanel>

          {/* Reports Tab */}
          <TabPanel value={tabValue} index={4}>
            <Stack spacing={3}>
              <Typography variant="h6">Usage Reports</Typography>

              {/* Report Filters */}
              <Paper elevation={1} sx={{ p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="From Date"
                      type="date"
                      value={reportDateFrom}
                      onChange={(e) => setReportDateFrom(e.target.value)}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="To Date"
                      type="date"
                      value={reportDateTo}
                      onChange={(e) => setReportDateTo(e.target.value)}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={reportCategoryFilter}
                        onChange={(e) => setReportCategoryFilter(e.target.value)}
                        label="Category"
                      >
                        <MenuItem value="all">All Categories</MenuItem>
                        {categories.map((cat) => (
                          <MenuItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      startIcon={<DateRange />}
                      onClick={() => {
                        setReportDateFrom(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
                        setReportDateTo(new Date().toISOString().split("T")[0])
                      }}
                      fullWidth
                    >
                      Last 7 Days
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* Usage Summary Cards */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="h4" color="primary">
                        {reportData.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Items Tracked
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="h4" color="success.main">
                        {reportData.reduce((sum, item) => sum + item.totalUsage, 0).toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Usage
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="h4" color="warning.main">
                        {reportData.filter((item) => item.totalUsage > 0).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Items Used
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="h4" color="info.main">
                        {(
                          reportData.reduce((sum, item) => sum + item.averageUsage, 0) / Math.max(reportData.length, 1)
                        ).toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Usage/Item
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Usage Table */}
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Total Usage</TableCell>
                      <TableCell>Count Changes</TableCell>
                      <TableCell>Avg Usage</TableCell>
                      <TableCell>Current Stock</TableCell>
                      <TableCell>Trend</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.category}
                            size="small"
                            sx={{
                              bgcolor:
                                categories.find((c) => c.name === item.category)?.color || theme.palette.primary.main,
                              color: "white",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {item.totalUsage.toFixed(1)} {item.unit}
                        </TableCell>
                        <TableCell>{item.countChanges}</TableCell>
                        <TableCell>
                          {item.averageUsage.toFixed(1)} {item.unit}
                        </TableCell>
                        <TableCell>
                          {item.currentStock} {item.unit}
                        </TableCell>
                        <TableCell>
                          {item.totalUsage > item.averageUsage ? (
                            <TrendingUp color="error" />
                          ) : item.totalUsage < item.averageUsage ? (
                            <TrendingDown color="success" />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Stable
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </TabPanel>
        </Paper>
      </Stack>

      {/* Add Item Dialog */}
      <Dialog open={addItemOpen} onClose={() => setAddItemOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Item</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Item Name"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                label="Category"
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Unit"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  placeholder="kg, L, pieces"
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Pack Size"
                  type="number"
                  value={newItem.packSize}
                  onChange={(e) => setNewItem({ ...newItem, packSize: Number(e.target.value) })}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Current Stock"
                  type="number"
                  value={newItem.currentStock}
                  onChange={(e) => setNewItem({ ...newItem, currentStock: Number(e.target.value) })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Par Level"
                  type="number"
                  value={newItem.parLevel}
                  onChange={(e) => setNewItem({ ...newItem, parLevel: Number(e.target.value) })}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Cost per Pack"
                  type="number"
                  value={newItem.cost}
                  onChange={(e) => setNewItem({ ...newItem, cost: Number(e.target.value) })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">£</InputAdornment>,
                  }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Supplier"
                  value={newItem.supplier}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddItemOpen(false)}>Cancel</Button>
          <Button onClick={handleAddItem} variant="contained">
            Add Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={editItemOpen} onClose={() => setEditItemOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Item</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Item Name"
                value={selectedItem.name}
                onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedItem.category}
                  onChange={(e) => setSelectedItem({ ...selectedItem, category: e.target.value })}
                  label="Category"
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Par Level"
                    type="number"
                    value={selectedItem.parLevel}
                    onChange={(e) => setSelectedItem({ ...selectedItem, parLevel: Number(e.target.value) })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Cost per Pack"
                    type="number"
                    value={selectedItem.cost}
                    onChange={(e) => setSelectedItem({ ...selectedItem, cost: Number(e.target.value) })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">£</InputAdornment>,
                    }}
                    fullWidth
                  />
                </Grid>
              </Grid>

              <TextField
                label="Supplier"
                value={selectedItem.supplier}
                onChange={(e) => setSelectedItem({ ...selectedItem, supplier: e.target.value })}
                fullWidth
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditItemOpen(false)}>Cancel</Button>
          <Button onClick={handleEditItem} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Count Item Dialog */}
      <Dialog open={countItemOpen} onClose={() => setCountItemOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Count Stock</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="h6">{selectedItem.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Current Stock: {selectedItem.currentStock} {selectedItem.unit}
              </Typography>

              <FormControl fullWidth>
                <InputLabel>Count Method</InputLabel>
                <Select
                  value={countMethod}
                  onChange={(e) => setCountMethod(e.target.value as any)}
                  label="Count Method"
                >
                  <MenuItem value="unit">Count by {selectedItem.unit}</MenuItem>
                  <MenuItem value="pack">
                    Count by packs ({selectedItem.packSize} {selectedItem.unit} each)
                  </MenuItem>
                  <MenuItem value="partial">Partial count</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label={`Count (${countMethod === "pack" ? "packs" : selectedItem.unit})`}
                type="number"
                value={countValue}
                onChange={(e) => setCountValue(Number(e.target.value))}
                fullWidth
                helperText={
                  countMethod === "pack"
                    ? `${countValue} packs = ${countValue * selectedItem.packSize} ${selectedItem.unit}`
                    : `Enter count in ${selectedItem.unit}`
                }
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCountItemOpen(false)}>Cancel</Button>
          <Button onClick={handleCountItem} variant="contained">
            Update Count
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={addCategoryOpen} onClose={() => setAddCategoryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Category Name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Description"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Color
              </Typography>
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                style={{ width: "100%", height: "40px", border: "1px solid #ccc", borderRadius: "4px" }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCategoryOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCategory} variant="contained">
            Add Category
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editCategoryOpen} onClose={() => setEditCategoryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          {selectedCategory && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Category Name"
                value={selectedCategory.name}
                onChange={(e) => setSelectedCategory({ ...selectedCategory, name: e.target.value })}
                fullWidth
                required
              />

              <TextField
                label="Description"
                value={selectedCategory.description}
                onChange={(e) => setSelectedCategory({ ...selectedCategory, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />

              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Color
                </Typography>
                <input
                  type="color"
                  value={selectedCategory.color}
                  onChange={(e) => setSelectedCategory({ ...selectedCategory, color: e.target.value })}
                  style={{ width: "100%", height: "40px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCategoryOpen(false)}>Cancel</Button>
          <Button onClick={handleEditCategory} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ConsumablesManagement
