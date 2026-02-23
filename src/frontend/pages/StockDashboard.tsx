"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  type SelectChangeEvent,
} from "@mui/material"
import {
  BarChart as BarChartIcon,
  Dashboard as DashboardIcon,
  PieChart as PieChartIcon,
  TableChart as TableChartIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Assessment as AssessmentIcon,
  Category as CategoryIcon,
  Equalizer as EqualizerIcon,
  Settings as SettingsIcon,
  Calculate as CalculatorIcon,
} from "@mui/icons-material"
import { WidgetType, DataType } from "../types/WidgetTypes"
import DynamicWidget from "../components/reusable/DynamicWidget"
import useWidgetManager from "../hooks/useWidgetManager"
import WidgetContextMenu from "../components/reusable/WidgetContextMenu"
import WidgetSettingsDialog from "../components/reusable/WidgetSettingsDialog"
import DashboardHeader from "../components/reusable/DashboardHeader"
import CollapsibleTabHeader from "../components/reusable/CollapsibleTabHeader"
import { Rnd } from "react-rnd"
import { useStock } from "../../backend/context/StockContext"
import { useAnalytics } from "../../backend/context/AnalyticsContext"
import { useCompany } from "../../backend/context/CompanyContext"
import { useSettings } from "../../backend/context/SettingsContext"
import { areDependenciesReady } from "../../backend/utils/ContextDependencies"
import LocationPlaceholder from "../components/common/LocationPlaceholder"

import {
  StockTable,
  PurchaseOrdersTable,
  StockCountTable,
  ManagementGrid,
  ParLevelsManagement,
  ReportsGrid,
} from "../components/stock"
import { format, subDays, startOfMonth, startOfYear } from "date-fns"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { useTheme } from "@mui/material/styles"
import { useNavigate, useLocation } from "react-router-dom"

// Grid constants
export const GRID_CELL_SIZE = 20
export const GRID_COLS = 60

// Settings Component
import StockSettings from "../components/stock/StockSettings"

// Available data types for stock dashboard - now powered by Analytics Context with POS data
const getStockDataTypes = (getAvailableDataTypes: any) => {
  return getAvailableDataTypes('stock').concat([
    // Stock-specific data types
    { value: DataType.STOCK_BY_CATEGORY, label: "Stock by Category", category: "Stock" },
    { value: DataType.STOCK_BY_SUPPLIER, label: "Stock by Supplier", category: "Stock" },
    { value: DataType.STOCK_BY_LOCATION, label: "Stock by Location", category: "Stock" },
    { value: DataType.TOP_SELLING_ITEMS, label: "Top Selling Items", category: "Stock" },
    { value: DataType.STOCK_TRENDS, label: "Stock Trends", category: "Stock" },
    { value: DataType.PURCHASE_HISTORY, label: "Purchase History", category: "Stock" },
    { value: DataType.SALES_HISTORY, label: "Sales History", category: "Stock" },
    { value: DataType.STOCK_COUNTS_HISTORY, label: "Stock Counts History", category: "Stock" },
    { value: DataType.PAR_LEVEL_STATUS, label: "Par Level Status", category: "Stock" },
    { value: DataType.PROFIT_ANALYSIS, label: "Profit Analysis", category: "Stock" },
    
    // POS data types (cross-module access)
    { value: DataType.SALES, label: "POS Sales", category: "POS" },
    { value: DataType.POS_TRANSACTIONS, label: "Total Transactions", category: "POS" },
    { value: DataType.SALES_BY_DAY, label: "Daily Sales", category: "POS" },
    { value: DataType.PAYMENT_METHOD_BREAKDOWN, label: "Payment Methods", category: "POS" },
    { value: DataType.SALES_BY_HOUR, label: "Hourly Sales", category: "POS" },
    { value: DataType.CUSTOMER_ANALYTICS, label: "Customer Analytics", category: "POS" },
  ])
}

const StockDashboard = () => {
  // Get core contexts first to check readiness
  const { state: settingsState } = useSettings()
  const { state: companyState } = useCompany()
  
  // Wait for core contexts (Settings and Company) to be ready before proceeding
  // This prevents premature rendering and context access errors
  const coreContextsReady = areDependenciesReady(settingsState, companyState)
  
  // Early return if core contexts aren't ready - show loading spinner
  if (!coreContextsReady) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    )
  }
  
  // Theme context is provided app-wide; local darkMode not needed here
  const { 
    state: stockState, 
    refreshAll, 
    canViewStock, 
    canEditStock
  } = useStock()
  
  // Analytics context for all dashboard data (stock + POS)
  const {
    getStockWidgets,
    getAvailableDataTypes
  } = useAnalytics()
  
  const navigate = useNavigate()
  const location = useLocation()
  const isEditingRef = useRef(false)
  const theme = useTheme()

  // All useState hooks must be called before any conditional returns
  const [activeTab, setActiveTab] = useState<number>(0)
  const [isTabsExpanded, setIsTabsExpanded] = useState<boolean>(true)
  const [addWidgetOpen, setAddWidgetOpen] = useState<boolean>(false)
  const [newWidgetType, setNewWidgetType] = useState<string>("stat")
  const [newWidgetDataType, setNewWidgetDataType] = useState<DataType>(DataType.STOCK_COUNT)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [showGrid, setShowGrid] = useState<boolean>(false)
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date }>({
    startDate: subDays(new Date(), 6),
    endDate: new Date(),
  })
  const [frequency, setFrequency] = useState<string>("daily")
  const [, setIsLoadingData] = useState<boolean>(false)

  const [selectedDateRange, setSelectedDateRange] = useState<string>("last7days")
  const [customDateDialogOpen, setCustomDateDialogOpen] = useState<boolean>(false)
  const [clearWidgetsDialogOpen, setClearWidgetsDialogOpen] = useState<boolean>(false)
  
  // Analytics data state (stock + POS)
  // const [posAnalyticsData] = useState<any>(null) // Removed unused variable

  // Widget management
  const {
    dashboardState,
    selectedWidgetId,
    setSelectedWidgetId,
    updateWidgetPosition,
    updateWidgetSize,
    updateWidgetSettings,
    removeWidget,
    addWidget,
    getWidgetSettings,
    calculateContainerHeight,
    clearAllWidgets,
    revertDashboard,
  } = useWidgetManager('stock')

  // Calculate container height based on widget positions
  const containerHeight = calculateContainerHeight()

  // Default dashboard setup is now handled by useWidgetManager with section-specific layouts

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number
    mouseY: number
    widgetId: string
  } | null>(null)

  // Settings dialog state
  const [settingsDialogOpen, setSettingsDialogOpen] = useState<boolean>(false)
  const [currentWidgetSettings, setCurrentWidgetSettings] = useState<any>(null)

  // Dashboard data from Analytics Context
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  
  // Simplified data loading - just set loading to false since we use StockContext directly
  useEffect(() => {
    setIsLoadingData(false)
  }, [stockState.companyID, stockState.siteID])


  // Define available tabs with permission checks - use useMemo to recalculate when permissions change
  const availableTabs = useMemo(() => [
    {
      label: "Items",
      slug: "items",
      icon: <InventoryIcon />,
      component: <StockTable />,
      permission: canViewStock(),
    },
    {
      label: "Purchase Orders",
      slug: "purchase-orders",
      icon: <ShoppingCartIcon />,
      component: <PurchaseOrdersTable />,
      permission: canViewStock(),
    },
    {
      label: "Stock Counts",
      slug: "stock-counts",
      icon: <AssessmentIcon />,
      component: <StockCountTable />,
      permission: canViewStock(),
    },
    {
      label: "Par Levels",
      slug: "par-levels",
      icon: <EqualizerIcon />,
      component: <ParLevelsManagement />,
      permission: canViewStock(),
    },
    {
      label: "Management",
      slug: "management",
      icon: <CategoryIcon />,
      component: <ManagementGrid />,
      permission: canViewStock(),
    },
    {
      label: "Reports",
      slug: "reports",
      icon: <BarChartIcon />,
      component: <ReportsGrid />,
      permission: canViewStock(),
    },
    {
      label: "Settings",
      slug: "settings",
      icon: <SettingsIcon />,
      component: <StockSettings />,
      permission: canViewStock(),
    },
  ], [canViewStock])

  // Filter tabs based on permissions
  const visibleTabs = useMemo(() => availableTabs.filter((tab) => tab.permission), [availableTabs])
  
  // Wait for permissions to be loaded before showing access restricted message
  const permissionsLoaded = companyState.permissions && companyState.permissions.roles

  const loadMockData = () => {
    // Mock data loading logic here
    console.log("Loading mock data...")
  }

  const fetchDashboardData = async (startDate: Date, endDate: Date, dataFrequency: string) => {
    if (!stockState.companyID || !stockState.siteID) return

    setIsLoadingData(true)

    try {
      // Trigger analytics data refresh with new date range and frequency
      const dateRangeFormatted = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      }
      
       const stockData = await getStockWidgets(dateRangeFormatted)
       setAnalyticsData(stockData)
      
      // Update current date range and frequency for future widget updates
      setDateRange({ startDate, endDate })
      setFrequency(dataFrequency)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoadingData(false)
    }
  }


  // Ensure activeTab stays in bounds when visibleTabs change (e.g., permissions/site changes)
  useEffect(() => {
    if (activeTab >= visibleTabs.length) {
      setActiveTab(0)
    }
  }, [visibleTabs.length, activeTab])

  useEffect(() => {
    if (!visibleTabs.length) {
      return
    }

    const pathWithoutTrailingSlash = location.pathname.replace(/\/+$/, "")
    const pathSegments = pathWithoutTrailingSlash.split("/").filter(Boolean)
    const stockIndex = pathSegments.findIndex((segment) => segment === "Stock" || segment === "stock")
    const tabSegment = stockIndex !== -1 ? pathSegments[stockIndex + 1] : undefined

    const defaultSlug = visibleTabs[0]?.slug
    const slugToPascalPath = (slug: string) => {
      return slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("")
    }

    if (!tabSegment) {
      if (defaultSlug) {
        const defaultPath = `/Stock/${slugToPascalPath(defaultSlug)}`
        if (location.pathname !== defaultPath) {
          navigate(defaultPath, { replace: true })
        }
      }
      if (activeTab !== 0) {
        setActiveTab(0)
      }
      return
    }

    // Match tab by slug, handling both PascalCase paths and lowercase slugs
    const matchedIndex = visibleTabs.findIndex((tab) => {
      const pascalSlug = slugToPascalPath(tab.slug)
      return tab.slug === tabSegment || pascalSlug === tabSegment || tabSegment?.toLowerCase() === tab.slug
    })
    if (matchedIndex === -1) {
      if (defaultSlug) {
        const defaultPath = `/Stock/${slugToPascalPath(defaultSlug)}`
        if (location.pathname !== defaultPath) {
          navigate(defaultPath, { replace: true })
        }
        if (activeTab !== 0) {
          setActiveTab(0)
        }
      }
      return
    }

    if (matchedIndex !== activeTab) {
      setActiveTab(matchedIndex)
    }
  }, [activeTab, location.pathname, navigate, visibleTabs])

  // Load data from StockContext
  useEffect(() => {
    if (stockState.companyID && stockState.siteID) {
      setIsLoadingData(true)
      refreshAll().finally(() => setIsLoadingData(false))
    }
  }, [stockState.companyID, stockState.siteID]) // Removed refreshAll dependency to prevent infinite loop

  // Trigger re-render when StockContext data changes (for fallback mode)
  useEffect(() => {
    console.log('StockDashboard: StockContext data changed:', {
      products: stockState.products.length,
      stockCounts: stockState.stockCounts.length,
      purchaseOrders: stockState.purchaseOrders.length
    })
    // Force re-render of widgets when stock data changes and we're using fallback
    if (!analyticsData && stockState.products.length > 0) {
      console.log('StockDashboard: Triggering widget refresh due to StockContext changes')
      // This will cause widgets to re-render with new data
    }
  }, [stockState.products, stockState.stockCounts, stockState.purchaseOrders, analyticsData])

  useEffect(() => {
    if (stockState.companyID && stockState.siteID) {
      fetchDashboardData(dateRange.startDate, dateRange.endDate, frequency)
    } else {
      loadMockData()
    }
  }, [stockState.companyID, stockState.siteID, dateRange.startDate, dateRange.endDate, frequency])

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing)
    isEditingRef.current = !isEditing
  }

  // Handle revert - reload saved layout and exit edit mode without saving
  const handleRevert = async () => {
    console.log('Stock Dashboard: Reverting changes and exiting edit mode')
    await revertDashboard()
    setIsEditing(false)
    isEditingRef.current = false
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)

    const selectedTab = visibleTabs[newValue]
    if (!selectedTab?.slug) {
      return
    }

    const slugToPascalPath = (slug: string) => {
      return slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("")
    }
    const targetPath = `/Stock/${slugToPascalPath(selectedTab.slug)}`
    if (location.pathname !== targetPath) {
      navigate(targetPath)
    }
  }

  const toggleTabsExpanded = () => {
    setIsTabsExpanded(!isTabsExpanded)
  }

  const getDateRangeLabel = () => {
    switch (selectedDateRange) {
      case "today":
        return "Today"
      case "yesterday":
        return "Yesterday"
      case "last7days":
        return "Last 7 Days"
      case "last30days":
        return "Last 30 Days"
      case "thisMonth":
        return "This Month"
      case "lastMonth":
        return "Last Month"
      case "thisYear":
        return "This Year"
      case "lastYear":
        return "Last Year"
      case "custom":
        return `${format(dateRange.startDate, "MMM d, yyyy")} - ${format(dateRange.endDate, "MMM d, yyyy")}`
      default:
        return "Last 7 Days"
    }
  }

  const handleDateRangeChange = (range: string) => {
    setSelectedDateRange(range)
    // Close date range menu if it was open

    if (range === "custom") {
      setCustomDateDialogOpen(true)
      return
    }

    const today = new Date()
    let start = new Date()
    let end = new Date()

    switch (range) {
      case "today":
        start = new Date(today)
        end = new Date(today)
        break
      case "yesterday":
        start = subDays(today, 1)
        end = subDays(today, 1)
        break
      case "last7days":
        start = subDays(today, 6)
        end = today
        break
      case "last30days":
        start = subDays(today, 29)
        end = today
        break
      case "thisMonth":
        start = startOfMonth(today)
        end = today
        break
      case "lastMonth":
        const lastMonthEnd = subDays(startOfMonth(today), 1)
        start = startOfMonth(lastMonthEnd)
        end = lastMonthEnd
        break
      case "thisYear":
        start = startOfYear(today)
        end = today
        break
      case "lastYear":
        const lastYearEnd = subDays(startOfYear(today), 1)
        start = startOfYear(lastYearEnd)
        end = lastYearEnd
        break
      default:
        break
    }

    setDateRange({ startDate: start, endDate: end })
    // Widget data will automatically update due to useCallback dependencies
  }

  const handleFrequencyChange = (newFrequency: string) => {
    setFrequency(newFrequency)
    // Widget data will automatically update due to useCallback dependencies
  }

  const handleCustomDateApply = () => {
    setCustomDateDialogOpen(false)
    // Widget data will automatically update due to useCallback dependencies
  }

  // Handle widget context menu
  const handleWidgetContextMenu = (event: React.MouseEvent, widgetId: string) => {
    if (!isEditing) return

    event.preventDefault()
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      widgetId,
    })
  }

  // Handle widget settings dialog
  const handleOpenWidgetSettings = (widgetId: string) => {
    const settings = getWidgetSettings(widgetId)
    if (settings) {
      setCurrentWidgetSettings(settings)
      setSettingsDialogOpen(true)
    }
  }

  // Handle widget settings save
  const handleSaveWidgetSettings = (settings: any) => {
    updateWidgetSettings(settings)
    setSettingsDialogOpen(false)
  }

  // Handle add widget dialog
  const handleAddWidget = (type: string, dataType: DataType) => {
    // Convert string type to WidgetTypeEnum
    let widgetType: "stat" | "barChart" | "lineChart" | "pieChart" | "chart" | "table" | "dashboardCard" | "calculator" = "stat"

    switch (type) {
      case "stat":
      case "barChart":
      case "lineChart":
      case "pieChart":
      case "chart":
      case "table":
      case "dashboardCard":
      case "calculator":
        widgetType = type
        break
    }

    const newWidgetId = addWidget(widgetType, dataType)
    setSelectedWidgetId(newWidgetId)
  }

  // Memoized stock metrics calculation with proper GBP calculations
  const stockMetrics = useMemo(() => {
    const totalItems = stockState.products.length
    const lowStockCount = stockState.products.filter((p: any) => (p.predictedStock || 0) < (p.parLevel || 10)).length
    
    // Calculate total sales value (what we could sell for)
    const totalSalesValue = stockState.products.reduce((total: number, product: any) => {
      const salePrice = product.price || product.salePrice || 0
      const quantity = product.predictedStock || 0
      return total + (salePrice * quantity)
    }, 0)
    
    // Calculate profit margin based on cost vs sale price
    const totalCostValue = stockState.products.reduce((total: number, product: any) => {
      const costPrice = product.purchasePrice || product.costPrice || 0
      const quantity = product.predictedStock || 0
      return total + (costPrice * quantity)
    }, 0)
    
    const profitMargin = totalSalesValue > 0 ? ((totalSalesValue - totalCostValue) / totalSalesValue) * 100 : 0
    const totalProfit = totalSalesValue - totalCostValue
    
    const categories = [...new Set(stockState.products.map((p: any) => 
      p.category || p.categoryName || p.categoryId || 'Uncategorized'
    ).filter(Boolean))]
    const suppliers = [...new Set(stockState.products.map((p: any) => 
      p.supplier || p.supplierName || p.supplierId || 'Unknown Supplier'
    ).filter(Boolean))]
    
    
    return {
      totalItems,
      lowStockCount,
      stockValue: totalCostValue, // Use cost basis for stock value
      totalSalesValue,
      totalCostValue,
      categories,
      suppliers,
      profitMargin: Math.round(profitMargin * 10) / 10, // Round to 1 decimal
      totalProfit: Math.round(totalProfit * 100) / 100 // Round to 2 decimals for currency
    }
  }, [stockState.products])

  // Improved data function that generates realistic data from StockContext
  const getStockContextData = useCallback((widget: any, dataType: DataType) => {
    console.log('StockDashboard: Getting StockContext data for:', dataType, 'Date range:', dateRange, 'Frequency:', frequency)
    
    // Use memoized metrics
    const { totalItems, lowStockCount, stockValue, totalSalesValue, totalCostValue, categories, suppliers, profitMargin, totalProfit } = stockMetrics
    
    // Generate realistic historical data based on date range and frequency
    const generateHistoricalData = (baseValue: number) => {
      const startDate = dateRange.startDate
      const endDate = dateRange.endDate
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Determine data points based on frequency
      let dataPoints = daysDiff
      let dateIncrement = 1 // days
      
      switch (frequency) {
        case 'hourly':
          dataPoints = Math.min(daysDiff * 24, 168) // Max 1 week
          dateIncrement = 1 / 24 // hours
          break
        case 'daily':
          dataPoints = Math.min(daysDiff, 90) // Max 90 days
          dateIncrement = 1 // days
          break
        case 'weekly':
          dataPoints = Math.min(Math.ceil(daysDiff / 7), 52) // Max 52 weeks
          dateIncrement = 7 // days
          break
        case 'monthly':
          dataPoints = Math.min(Math.ceil(daysDiff / 30), 24) // Max 24 months
          dateIncrement = 30 // days
          break
        case 'quarterly':
          dataPoints = Math.min(Math.ceil(daysDiff / 90), 8) // Max 8 quarters
          dateIncrement = 90 // days
          break
        case 'yearly':
          dataPoints = Math.min(Math.ceil(daysDiff / 365), 5) // Max 5 years
          dateIncrement = 365 // days
          break
        default:
          dataPoints = Math.min(daysDiff, 30) // Default to 30 days max
      }
      
      return Array.from({ length: dataPoints }).map((_, i) => {
        const currentDate = new Date(startDate.getTime() + (i * dateIncrement * 24 * 60 * 60 * 1000))
        const date = format(currentDate, "yyyy-MM-dd")
        const variation = 0.9 + Math.random() * 0.2 // ±10% variation for more realistic data
        return {
          date,
          value: Math.round(baseValue * variation),
          stockValue: Math.round(stockValue * variation),
          itemCount: Math.round(totalItems * variation)
        }
      })
    }

    // For dashboard cards and stats, provide the specific value
    if (widget.type === WidgetType.DASHBOARD_CARD || widget.type === WidgetType.STAT) {
      switch (dataType) {
        case DataType.TOTAL_ITEMS:
          return {
            totalItems: totalItems,
            history: generateHistoricalData(totalItems),
          }
        case DataType.PROFIT_MARGIN:
          return {
            profitMargin: profitMargin,
            history: generateHistoricalData(profitMargin),
          }
        case DataType.LOW_STOCK_ITEMS:
          return {
            lowStockItems: lowStockCount,
            history: generateHistoricalData(lowStockCount),
          }
        case DataType.STOCK_VALUE:
        case DataType.INVENTORY_VALUE:
          return {
            totalValue: stockValue,
            inventoryValue: stockValue,
            history: generateHistoricalData(stockValue / 1000), // Scale down for chart
          }
        case DataType.STOCK_PROFIT:
          return {
            totalProfit: totalProfit,
            history: generateHistoricalData(totalProfit / 1000),
          }
        case DataType.SALES:
          return {
            totalSalesValue: totalSalesValue,
            history: generateHistoricalData(totalSalesValue / 1000),
          }
        case DataType.COST_OF_SALES:
          return {
            totalCostValue: totalCostValue,
            history: generateHistoricalData(totalCostValue / 1000),
          }
        default:
          return {
            value: totalItems,
            history: generateHistoricalData(totalItems),
          }
      }
    }

    // For charts, provide the appropriate data
    switch (dataType) {
      case DataType.STOCK_COUNT:
        return { 
          history: generateHistoricalData(totalItems).map(d => ({
            date: d.date,
            stockCount: { quantity: d.itemCount, price: d.stockValue }
          }))
        }
      case DataType.STOCK_TRENDS:
        return { 
          history: generateHistoricalData(totalItems).map(d => ({
            date: d.date,
            stockTrends: { 
              price: d.stockValue, 
              quantity: d.itemCount 
            },
            stockValue: d.stockValue,
            itemCount: d.itemCount,
            transactions: Math.round(d.value * 0.1)
          }))
        }
      case DataType.PURCHASES:
        return { 
          history: generateHistoricalData(stockState.purchaseOrders.length).map(d => ({
            date: d.date,
            purchases: { quantity: d.value, price: d.stockValue }
          }))
        }
      case DataType.SALES:
        return { 
          history: generateHistoricalData(Math.round(totalItems * 0.1)).map(d => ({
            date: d.date,
            sales: { quantity: d.value, price: d.stockValue }
          }))
        }
      case DataType.STOCK_BY_CATEGORY:
        const categoryData = categories.map((category) => {
          // Calculate actual values for this category
          const categoryProducts = stockState.products.filter((p: any) => 
            (p.category || p.categoryName || p.categoryId) === category
          )
          
          const categoryValue = categoryProducts.reduce((total: number, product: any) => {
            const costPrice = product.purchasePrice || product.costPrice || product.price || 0
            const quantity = product.predictedStock || 0
            return total + (costPrice * quantity)
          }, 0)
          
          const categoryCount = categoryProducts.length
          
          return {
            category,
            value: Math.round(categoryValue * 100) / 100, // Round to 2 decimals
            count: categoryCount
          }
        })
        
        return { 
          data: categoryData,
          history: generateHistoricalData(totalItems).map(d => ({
            date: d.date,
            stockByCategory: { 
              price: d.stockValue, 
              quantity: d.itemCount 
            }
          }))
        }
      case DataType.STOCK_BY_SUPPLIER:
        const supplierData = suppliers.map((supplier) => {
          // Calculate actual values for this supplier
          const supplierProducts = stockState.products.filter((p: any) => 
            (p.supplier || p.supplierName || p.supplierId) === supplier
          )
          
          const supplierValue = supplierProducts.reduce((total: number, product: any) => {
            const costPrice = product.purchasePrice || product.costPrice || product.price || 0
            const quantity = product.predictedStock || 0
            return total + (costPrice * quantity)
          }, 0)
          
          const supplierCount = supplierProducts.length
          
          return {
            supplier,
            value: Math.round(supplierValue * 100) / 100, // Round to 2 decimals
            count: supplierCount
          }
        })
        
        return { 
          data: supplierData,
          history: generateHistoricalData(totalItems).map(d => ({
            date: d.date,
            stockBySupplier: { 
              price: d.stockValue, 
              quantity: d.itemCount 
            }
          }))
        }
      case DataType.TOP_SELLING_ITEMS:
        return { 
          data: stockState.products.slice(0, 5).map((product: any, index: number) => ({
            name: product.name || `Item ${index + 1}`,
            value: product.price || 0,
            quantity: product.predictedStock || 0
          }))
        }
      case DataType.STOCK_BY_LOCATION:
        const locations = [...new Set(stockState.products.map((p: any) => 
          p.location || p.locationName || p.locationId || 'Unknown Location'
        ).filter(Boolean))]
        
        const locationData = locations.map((location) => {
          const locationProducts = stockState.products.filter((p: any) => 
            (p.location || p.locationName || p.locationId) === location
          )
          
          const locationValue = locationProducts.reduce((total: number, product: any) => {
            const costPrice = product.purchasePrice || product.costPrice || product.price || 0
            const quantity = product.predictedStock || 0
            return total + (costPrice * quantity)
          }, 0)
          
          return {
            location,
            value: Math.round(locationValue * 100) / 100,
            count: locationProducts.length
          }
        })
        
        return { 
          data: locationData,
          history: generateHistoricalData(totalItems).map(d => ({
            date: d.date,
            stockByLocation: { 
              price: d.stockValue, 
              quantity: d.itemCount 
            }
          }))
        }
      case DataType.PURCHASE_HISTORY:
        return { 
          history: stockState.purchaseOrders.map((order: any, index: number) => ({
            date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: order.total || order.amount || 0,
            items: order.items?.length || 0,
            supplier: order.supplier || 'Unknown Supplier'
          }))
        }
      case DataType.SALES_HISTORY:
        return { 
          history: generateHistoricalData(Math.round(totalItems * 0.1)).map(d => ({
            date: d.date,
            amount: d.stockValue,
            items: d.value,
            profit: d.stockValue * 0.3
          }))
        }
      case DataType.STOCK_COUNTS_HISTORY:
        return { 
          history: generateHistoricalData(totalItems).map(d => ({
            date: d.date,
            counted: d.itemCount,
            variance: Math.round(d.itemCount * 0.05),
            accuracy: Math.round((1 - Math.random() * 0.1) * 100)
          }))
        }
      case DataType.PAR_LEVEL_STATUS:
        return { 
          data: stockState.products.slice(0, 10).map((product: any) => ({
            item: product.name || 'Unknown Item',
            current: product.predictedStock || 0,
            parLevel: product.parLevel || 10,
            status: (product.predictedStock || 0) < (product.parLevel || 10) ? 'Low' : 'OK'
          }))
        }
      case DataType.PROFIT_ANALYSIS:
        return { 
          data: stockState.products.slice(0, 10).map((product: any) => ({
            item: product.name || 'Unknown Item',
            cost: product.purchasePrice || product.costPrice || 0,
            price: product.price || 0,
            margin: product.price && product.purchasePrice ? 
              ((product.price - product.purchasePrice) / product.price) * 100 : 0,
            volume: product.predictedStock || 0
          }))
        }
      default:
        return { 
          history: generateHistoricalData(totalItems).map(d => ({
            date: d.date,
            value: d.value
          }))
        }
    }
  }, [dateRange, frequency, stockMetrics, stockState.purchaseOrders])

  // Simplified widget data function - always use StockContext for reliability
  const getWidgetDataForWidget = (widget: any) => {
    if (!widget || !widget.dataType) {
      return { history: [] }
    }

    const dataType = widget.dataType
    console.log('StockDashboard: Getting data for widget:', dataType)

    // Always use StockContext data for reliability
    return getStockContextData(widget, dataType)
  }

  const handleClearWidgets = () => {
    setClearWidgetsDialogOpen(true)
  }

  const confirmClearWidgets = () => {
    clearAllWidgets()
    setClearWidgetsDialogOpen(false)
  }

  // Show location placeholder if no company is selected
  // Check companyState directly (source of truth) as stockState might not be synced yet
  if (!companyState.companyID) {
    return <LocationPlaceholder />
  }

  // Show loading state - use stockState.loading from StockContext
  if (stockState.loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2, animation: "pulse 1.5s infinite ease-in-out" }}>
          Loading stock dashboard...
        </Typography>
      </Box>
    )
  }

  // Show message if no company/site selected
  // Check companyState directly (source of truth) as stockState might not be synced yet
  if (!companyState.companyID || (!companyState.selectedSiteID && !companyState.selectedSubsiteID)) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          bgcolor: "background.default",
          p: 3,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Stock Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Please select a company and site to view stock data.
        </Typography>
      </Box>
    )
  }

  // Show loading if permissions aren't loaded yet
  if (!permissionsLoaded && companyState.companyID) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading permissions...
        </Typography>
      </Box>
    )
  }

  // Show message if no tabs are visible due to permissions (only after permissions are loaded)
  if (permissionsLoaded && visibleTabs.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          bgcolor: "background.default",
          p: 3,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Access Restricted
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          You don't have permission to access any stock management features. Please contact your administrator.
        </Typography>
      </Box>
    )
  }

  // Dashboard content to be collapsed with tabs
  const dashboardContent = (
    <Box sx={{ width: "100%" }}>
      <DashboardHeader
        title="Stock Dashboard"
        subtitle="Stock Dashboard"
        canEdit={canEditStock()}
        isEditing={isEditing}
        onToggleEdit={toggleEditMode}
        onClearWidgets={handleClearWidgets}
        onRevert={handleRevert}
        showGrid={showGrid}
        onToggleGrid={setShowGrid}
        menuItems={[
          {
            label: "Widget",
            onClick: () => setAddWidgetOpen(true),
            permission: canEditStock(),
          },
          {
            label: "Product",
            onClick: () => navigate("/Stock/AddItem"),
            permission: canEditStock(),
          },
          {
            label: "Stock Count",
            onClick: () => navigate("/Stock/AddStockCount"),
            permission: canEditStock(),
          },
          {
            label: "Purchase",
            onClick: () => navigate("/Stock/AddPurchase"),
            permission: canEditStock(),
          },
          {
            label: "Par Level",
            onClick: () => navigate("/Stock/AddParLevel"),
            permission: canEditStock(),
          },
        ]}
        dateRange={{
          value: selectedDateRange,
          label: getDateRangeLabel(),
          onChange: handleDateRangeChange,
        }}
        frequency={{
          value: frequency,
          options: ["Hourly", "Daily", "Weekly", "Monthly", "Yearly"],
          onChange: handleFrequencyChange,
        }}
      />

      {/* Widgets Container */}
      <Box
        sx={{
          position: "relative",
          minHeight: `${containerHeight}px`,
          mb: 4,
          border: isEditing ? "1px dashed" : "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          p: 2,
          backgroundColor: "background.default",
          backgroundImage: showGrid
            ? `linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), 
             linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)`
            : "none",
          backgroundSize: `${GRID_CELL_SIZE}px ${GRID_CELL_SIZE}px`,
          backgroundPosition: "0 0",
        }}
      >
        {dashboardState.widgets.length === 0 && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No widgets found. Click "Add Widget" to get started.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => {
                console.log("StockDashboard: Clearing localStorage and refreshing...")
                localStorage.removeItem("dashboardState")
                window.location.reload()
              }}
            >
              Reset Dashboard
            </Button>
          </Box>
        )}
        {dashboardState.widgets.map((widget) => {
          console.log("StockDashboard: Rendering widget:", widget.id, widget.type, widget.dataType)
          return (
            <Rnd
              key={widget.id}
              default={{
                x: widget.x,
                y: widget.y,
                width: widget.width,
                height: widget.height,
              }}
              size={{ width: widget.width, height: widget.height }}
              position={{ x: widget.x, y: widget.y }}
              minWidth={widget.minW * GRID_CELL_SIZE}
              minHeight={widget.minH * GRID_CELL_SIZE}
              disableDragging={!isEditing}
              enableResizing={isEditing}
              bounds="parent"
              onDragStop={(_e, d) => {
                updateWidgetPosition(widget.id, { x: d.x, y: d.y })
              }}
              onResizeStop={(_e, _direction, ref, _delta, position) => {
                updateWidgetSize(widget.id, {
                  width: ref.offsetWidth,
                  height: ref.offsetHeight,
                })
                updateWidgetPosition(widget.id, {
                  x: position.x,
                  y: position.y,
                })
              }}
              style={{
                border: selectedWidgetId === widget.id ? `2px solid ${theme.palette.primary.main}` : "none",
                borderRadius: "8px",
                overflow: "hidden",
              }}
              onMouseDown={() => isEditing && setSelectedWidgetId(widget.id)}
              onContextMenu={(e: React.MouseEvent<Element, MouseEvent>) => handleWidgetContextMenu(e, widget.id)}
              dragGrid={[GRID_CELL_SIZE, GRID_CELL_SIZE]}
              resizeGrid={[GRID_CELL_SIZE, GRID_CELL_SIZE]}
            >
              <Box sx={{ height: "100%", width: "100%", overflow: "hidden" }}>
                <DynamicWidget
                  widget={widget}
                  data={getWidgetDataForWidget(widget)}
                  onSettingsOpen={handleOpenWidgetSettings}
                  isEditing={isEditing}
                />
              </Box>
            </Rnd>
          )
        })}
      </Box>
    </Box>
  )

  return (
    <>
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 64px)",
          m: 0,
          mt: isTabsExpanded ? 0 : -3,
          p: 0,
          transition: "margin 0.3s ease",
        }}
      >
        <Box sx={{ overflow: "auto", flexGrow: 1, display: "flex", flexDirection: "column" }}>
          <CollapsibleTabHeader
            tabs={visibleTabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isExpanded={isTabsExpanded}
            onToggleExpanded={toggleTabsExpanded}
            dashboardContent={dashboardContent}
          />

          <Box sx={{ width: "100%", minHeight: "75vh", pb: 4 }}>
            {visibleTabs[activeTab] && visibleTabs[activeTab].component}
          </Box>
        </Box>
      </Box>

      {/* Widget Context Menu */}
      <WidgetContextMenu
        open={contextMenu !== null}
        position={contextMenu ? { x: contextMenu.mouseX, y: contextMenu.mouseY } : { x: 0, y: 0 }}
        onClose={() => setContextMenu(null)}
        widgetId={contextMenu?.widgetId || ""}
        onSettingsOpen={handleOpenWidgetSettings}
        onRemove={() => {
          if (contextMenu) {
            removeWidget(contextMenu.widgetId)
            setContextMenu(null)
          }
        }}
      />

      {/* Widget Settings Dialog */}
      <WidgetSettingsDialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        widget={currentWidgetSettings}
        onSave={handleSaveWidgetSettings}
        availableDataTypes={getStockDataTypes(getAvailableDataTypes)}
      />

      {/* Add Widget Dialog */}
      <Dialog open={addWidgetOpen} onClose={() => setAddWidgetOpen(false)}>
        <DialogTitle>Add New Widget</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Widget Type</InputLabel>
            <Select
              value={newWidgetType}
              label="Widget Type"
              onChange={(e: SelectChangeEvent) => setNewWidgetType(e.target.value)}
            >
              <MenuItem value="stat">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <DashboardIcon fontSize="small" />
                  Stat Card
                </Box>
              </MenuItem>
              <MenuItem value="barChart">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <BarChartIcon fontSize="small" />
                  Bar Chart
                </Box>
              </MenuItem>
              <MenuItem value="lineChart">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <BarChartIcon fontSize="small" />
                  Line Chart
                </Box>
              </MenuItem>
              <MenuItem value="pieChart">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PieChartIcon fontSize="small" />
                  Pie Chart
                </Box>
              </MenuItem>
              <MenuItem value="table">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TableChartIcon fontSize="small" />
                  Table
                </Box>
              </MenuItem>
              <MenuItem value="dashboardCard">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <DashboardIcon fontSize="small" />
                  Dashboard Card
                </Box>
              </MenuItem>
              <MenuItem value="calculator">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CalculatorIcon fontSize="small" />
                  Calculator
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Data Type</InputLabel>
            <Select
              value={newWidgetDataType}
              label="Data Type"
              onChange={(e: SelectChangeEvent) => setNewWidgetDataType(e.target.value as DataType)}
            >
              {getStockDataTypes(getAvailableDataTypes).map((type: any) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body2">{type.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{type.category}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddWidgetOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              handleAddWidget(newWidgetType, newWidgetDataType)
              setAddWidgetOpen(false)
            }}
            variant="contained"
            color="primary"
          >
            Add Widget
          </Button>
        </DialogActions>
      </Dialog>
      {/* Custom Date Range Dialog */}
      <Dialog open={customDateDialogOpen} onClose={() => setCustomDateDialogOpen(false)}>
        <DialogTitle>Select Custom Date Range</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2, minWidth: 300 }}>
              <DatePicker
                label="Start Date"
                value={dateRange.startDate}
                onChange={(newValue) => {
                  if (newValue) {
                    setDateRange((prev) => ({ ...prev, startDate: newValue }))
                  }
                }}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="End Date"
                value={dateRange.endDate}
                onChange={(newValue) => {
                  if (newValue) {
                    setDateRange((prev) => ({ ...prev, endDate: newValue }))
                  }
                }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomDateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCustomDateApply} variant="contained" color="primary">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
      {/* Clear Widgets Confirmation Dialog */}
      <Dialog open={clearWidgetsDialogOpen} onClose={() => setClearWidgetsDialogOpen(false)}>
        <DialogTitle>Clear All Widgets</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove all widgets from the dashboard? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearWidgetsDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmClearWidgets} variant="contained" color="error">
            Clear All Widgets
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default StockDashboard
