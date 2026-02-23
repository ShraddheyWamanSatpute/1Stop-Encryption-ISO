"use client"

import { Description as BillsIcon, Map as MapIcon } from "@mui/icons-material"
import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from "@mui/material"
import {
  Dashboard as DashboardIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TableChart as TableChartIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  PointOfSale as PointOfSaleIcon,
  Inventory as InventoryIcon,
  ConfirmationNumber as TicketIcon,
  LocalLaundryService as BagCheckIcon,
  Calculate as CalculatorIcon,
} from "@mui/icons-material"
import { useNavigate, useLocation } from "react-router-dom"
import { Rnd } from "react-rnd"
import { useTheme } from "@mui/material/styles"
import { format, subDays, startOfWeek, startOfMonth, startOfYear } from "date-fns"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"

import DynamicWidget from "../components/reusable/DynamicWidget"
import WidgetContextMenu from "../components/reusable/WidgetContextMenu"
import WidgetSettingsDialog from "../components/reusable/WidgetSettingsDialog"
import DashboardHeader from "../components/reusable/DashboardHeader"
import CollapsibleTabHeader from "../components/reusable/CollapsibleTabHeader"
import { useWidgetManager } from "../hooks/useWidgetManager"
import { WidgetType, DataType } from "../types/WidgetTypes"
import { useCompany } from "../../backend/context/CompanyContext"
import { POSProvider } from "../../backend/context/POSContext"
import { useAnalytics } from "../../backend/context/AnalyticsContext"

// Import POS Management components
import { LocationManagement, OrdersTable, TillScreensTable } from "../components/pos"

// Import POS components directly to avoid barrel file issues
import DeviceManagement from "./pos/DeviceManagement"
import PaymentManagement from "./pos/PaymentManagement"
import GroupManagement from "../components/pos/GroupManagement"
import BillsManagement from "./pos/BillsManagement"
import PromotionsManagement from "./pos/PromotionsManagement"
import TillUsage from "../components/pos/TillUsage"
import TicketManagement from "../components/pos/TicketManagement"
import BagCheckManagement from "../components/pos/BagCheckManagement"

// Import Stock and Bookings components - Use StockTable instead of StockDataGrid
import StockTable from "../components/stock/StockTable"
import TableManagement from "../components/bookings/TableManagement"
import TableLayoutDesigner from "../components/bookings/TableLayoutDesigner"
import ReportsPage from "../components/stock/reports/ReportsPage"

// Add import for DiscountsManagement
import DiscountsManagement from "./pos/DiscountsManagement"

// CoursesManagement removed - now using ManagementGrid from stock section

// Import corrections management component  
import { CategoriesManagement, CoursesManagement } from "../components/stock"
import CorrectionsManagement from "./pos/CorrectionsManagement"

// Grid configuration
const GRID_CELL_SIZE = 20 // Size of each grid cell in pixels

// Available data types for POS dashboard - now includes Stock data
const getPOSDataTypes = () => {
  return [
    // POS-specific data types
    { value: DataType.SALES, label: "Sales", category: "POS" },
    { value: DataType.POS_TRANSACTIONS, label: "Total Transactions", category: "POS" },
    { value: DataType.SALES_BY_DAY, label: "Daily Sales", category: "POS" },
    { value: DataType.SALES_BY_HOUR, label: "Hourly Sales", category: "POS" },
    { value: DataType.PAYMENT_METHOD_BREAKDOWN, label: "Payment Methods", category: "POS" },
    { value: DataType.CUSTOMER_ANALYTICS, label: "Customer Analytics", category: "POS" },
    { value: DataType.CATEGORIES, label: "Categories", category: "POS" },
    { value: DataType.PROFIT, label: "Profit", category: "POS" },
    { value: DataType.TOP_ITEMS, label: "Top Items", category: "POS" },
    { value: DataType.TOTAL_ITEMS, label: "Total Orders", category: "POS" },
    { value: DataType.PROFIT_MARGIN, label: "Profit Margin", category: "POS" },
    { value: DataType.INVENTORY_VALUE, label: "Revenue", category: "POS" },
    
    // Stock data types (cross-module access)
    { value: DataType.STOCK_COUNT, label: "Stock Count", category: "Stock" },
    { value: DataType.STOCK_VALUE, label: "Stock Value", category: "Stock" },
    { value: DataType.LOW_STOCK_ITEMS, label: "Low Stock Items", category: "Stock" },
    { value: DataType.STOCK_BY_CATEGORY, label: "Stock by Category", category: "Stock" },
    { value: DataType.STOCK_BY_SUPPLIER, label: "Stock by Supplier", category: "Stock" },
    { value: DataType.TOP_SELLING_ITEMS, label: "Top Selling Items", category: "Stock" },
    { value: DataType.PURCHASE_HISTORY, label: "Purchase History", category: "Stock" },
    { value: DataType.STOCK_TRENDS, label: "Stock Trends", category: "Stock" },
  ]
}

import POSSettings from "../components/pos/POSSettings"

const POSDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { state: companyState, hasPermission } = useCompany()
  const theme = useTheme()
  
  // POS Context for fallback data (available via context)
  // const posState = usePOS() // Available but not directly used
  
  // Analytics Context for enhanced data (POS + Stock) - optional
  let analytics: any = null
  try {
    analytics = useAnalytics()
  } catch (error) {
    console.warn('Analytics Context not available for POS Dashboard, using fallback mode:', error)
  }
  
  const getPOSWidgets = analytics?.getPOSWidgets
  const getStockWidgets = analytics?.getStockWidgets

  // State variables
  const [isEditing, setIsEditing] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [isLoading] = useState(false)
  const [, setIsLoadingData] = useState(false)
  const [isTabsExpanded, setIsTabsExpanded] = useState(true)

  // Menu and dialog states
  const [addWidgetOpen, setAddWidgetOpen] = useState(false)
  const [newWidgetType, setNewWidgetType] = useState<string>("stat")
  const [newWidgetDataType, setNewWidgetDataType] = useState<DataType>(DataType.SALES)
  const [selectedDateRange, setSelectedDateRange] = useState<string>("last7days")
  const [customDateDialogOpen, setCustomDateDialogOpen] = useState(false)
  const [clearWidgetsDialogOpen, setClearWidgetsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [managementTab, setManagementTab] = useState(0)

  const managementSections = [
    {
      label: "Devices",
      slug: "devices",
      component: <DeviceManagement />,
      permission: hasPermission("pos", "devices", "view"),
    },
    {
      label: "Locations",
      slug: "locations",
      component: <LocationManagement />,
      permission: hasPermission("pos", "locations", "view"),
    },
    {
      label: "Payments",
      slug: "payments",
      component: <PaymentManagement />,
      permission: hasPermission("pos", "payments", "view"),
    },
    {
      label: "Groups",
      slug: "groups",
      component: <GroupManagement />,
      permission: hasPermission("pos", "groups", "view"),
    },
    {
      label: "Categories",
      slug: "categories",
      component: <CategoriesManagement />,
      permission: hasPermission("pos", "categories", "view"),
    },
    {
      label: "Tables",
      slug: "tables",
      component: <TableManagement />,
      permission: hasPermission("pos", "tables", "view"),
    },
    {
      label: "Courses",
      slug: "courses",
      component: <CoursesManagement />,
      permission: hasPermission("pos", "courses", "view"),
    },
    {
      label: "Till Usage",
      slug: "till-usage",
      component: <TillUsage />,
      permission: hasPermission("pos", "usage", "view"),
    },
    {
      label: "Corrections",
      slug: "corrections",
      component: <CorrectionsManagement />,
      permission: hasPermission("pos", "corrections", "view"),
    },
    {
      label: "Discounts",
      slug: "discounts",
      component: <DiscountsManagement />,
      permission: hasPermission("pos", "discounts", "view"),
    },
    {
      label: "Promotions",
      slug: "promotions",
      component: <PromotionsManagement />,
      permission: hasPermission("pos", "promotions", "view"),
    },
  ]

  const visibleManagementSections = managementSections.filter((section) => section.permission)

  useEffect(() => {
    if (managementTab >= visibleManagementSections.length) {
      setManagementTab(0)
    }
  }, [managementTab, visibleManagementSections.length])

  const handleManagementTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setManagementTab(newValue)

    const selectedSection = visibleManagementSections[newValue]
    if (!selectedSection) {
      return
    }

    const targetPath = `/POS/Management/${slugToPascalPath(selectedSection.slug)}`
    if (location.pathname !== targetPath) {
      navigate(targetPath)
    }
  }

  const renderManagementContent = () => {
    if (!visibleManagementSections.length) {
      return (
        <Box sx={{ width: "100%", mt: 2 }}>
          <Typography variant="body1" color="text.secondary">
            No management sections available.
          </Typography>
        </Box>
      )
    }

    return (
      <Box sx={{ width: "100%" }}>
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            m: 0,
            p: 0,
          }}
        >
          <Tabs
            value={managementTab}
            onChange={handleManagementTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 2,
              minHeight: 42,
              "& .MuiTab-root": {
                minHeight: 42,
                py: 1,
              },
            }}
          >
            {visibleManagementSections.map((section) => (
              <Tab key={section.slug} label={section.label} />
            ))}
          </Tabs>
        </Box>
        <Box sx={{ mt: 2, minHeight: "60vh", display: "flex", flexDirection: "column" }}>
          {visibleManagementSections[managementTab]?.component}
        </Box>
      </Box>
    )
  }

  // Define available tabs with permission checks
  const availableTabs = [
    {
      label: "Item Sales",
      slug: "item-sales",
      icon: <ReceiptIcon />,
      component: () => <OrdersTable />,
      permission: hasPermission("pos", "sales", "view"),
    },
    {
      label: "Bills",
      slug: "bills",
      icon: <BillsIcon />,
      component: () => <BillsManagement />,
      permission: hasPermission("pos", "bills", "view"),
    },
    {
      label: "Floor Plan",
      slug: "floor-plan",
      icon: <MapIcon />,
      component: () => <TableLayoutDesigner />,
      permission: hasPermission("pos", "floorplan", "view"),
    },
    {
      label: "Items",
      slug: "items",
      icon: <InventoryIcon />,
      component: () => <StockTable />,
      permission: hasPermission("pos", "items", "view"),
    },
    {
      label: "Till Screens",
      slug: "till-screens",
      icon: <PointOfSaleIcon />,
      component: () => <TillScreensTable />,
      permission: hasPermission("pos", "tillscreens", "view"),
    },
    {
      label: "Tickets",
      slug: "tickets",
      icon: <TicketIcon />,
      component: () => <TicketManagement />,
      permission: hasPermission("pos", "tickets", "view"),
    },
    {
      label: "Bag Check",
      slug: "bag-check",
      icon: <BagCheckIcon />,
      component: () => <BagCheckManagement />,
      permission: hasPermission("pos", "bagcheck", "view"),
    },
    {
      label: "Management",
      slug: "management",
      icon: <DashboardIcon />,
      component: renderManagementContent,
      permission: hasPermission("pos", "management", "view") && visibleManagementSections.length > 0,
    },
    {
      label: "Reports",
      slug: "reports",
      icon: <BarChartIcon />,
      component: () => <ReportsPage />,
      permission: hasPermission("pos", "reports", "view"),
    },
    {
      label: "Settings",
      slug: "settings",
      icon: <SettingsIcon />,
      component: <POSSettings />,
      permission: hasPermission("pos", "settings", "view"),
    },
  ]

  // Filter tabs based on permissions
  const visibleTabs = availableTabs.filter((tab) => tab.permission)

  // Helper function to convert slug to PascalCase path (no hyphens)
  const slugToPascalPath = (slug: string) => {
    return slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("")
  }

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
    const posIndex = pathSegments.findIndex((segment) => segment === "POS" || segment === "pos")
    const tabSegment = posIndex !== -1 ? pathSegments[posIndex + 1] : undefined
    const subTabSegment = posIndex !== -1 ? pathSegments[posIndex + 2] : undefined

    const defaultTab = visibleTabs[0]
    const getManagementPath = (sectionSlug?: string | null) => {
      const slug = sectionSlug ?? visibleManagementSections[0]?.slug
      return slug ? `/POS/Management/${slugToPascalPath(slug)}` : `/POS/Management`
    }

    if (!tabSegment) {
      if (!defaultTab) {
        return
      }

      const defaultPath =
        defaultTab.slug === "management" ? getManagementPath(null) : `/POS/${slugToPascalPath(defaultTab.slug)}`

      if (location.pathname !== defaultPath) {
        navigate(defaultPath, { replace: true })
      }

      if (activeTab !== 0) {
        setActiveTab(0)
      }

      if (defaultTab.slug === "management" && visibleManagementSections.length && managementTab !== 0) {
        setManagementTab(0)
      }
      return
    }

    // Match tab by slug, handling both PascalCase paths and lowercase slugs
    const matchedIndex = visibleTabs.findIndex((tab) => {
      const pascalSlug = slugToPascalPath(tab.slug)
      return tab.slug === tabSegment || pascalSlug === tabSegment || tabSegment?.toLowerCase() === tab.slug
    })
    if (matchedIndex === -1) {
      if (!defaultTab) {
        return
      }

      const defaultPath =
        defaultTab.slug === "management" ? getManagementPath(null) : `/POS/${slugToPascalPath(defaultTab.slug)}`

      if (location.pathname !== defaultPath) {
        navigate(defaultPath, { replace: true })
      }

      if (activeTab !== 0) {
        setActiveTab(0)
      }

      if (defaultTab.slug === "management" && visibleManagementSections.length && managementTab !== 0) {
        setManagementTab(0)
      }
      return
    }

    if (matchedIndex !== activeTab) {
      setActiveTab(matchedIndex)
    }

    const matchedTab = visibleTabs[matchedIndex]

    if (matchedTab.slug === "management") {
      if (!visibleManagementSections.length) {
        return
      }

      if (!subTabSegment) {
        const currentSection = visibleManagementSections[managementTab] ?? visibleManagementSections[0]
        const targetPath = getManagementPath(currentSection?.slug ?? null)
        if (location.pathname !== targetPath) {
          navigate(targetPath, { replace: true })
        }
        return
      }

      // Match management section by slug, handling both PascalCase paths and lowercase slugs
      const matchedManagementIndex = visibleManagementSections.findIndex(
        (section) => {
          const pascalSlug = slugToPascalPath(section.slug)
          return section.slug === subTabSegment || pascalSlug === subTabSegment || subTabSegment?.toLowerCase() === section.slug
        },
      )

      if (matchedManagementIndex === -1) {
        const targetPath = getManagementPath(null)
        if (location.pathname !== targetPath) {
          navigate(targetPath, { replace: true })
        }
        if (managementTab !== 0) {
          setManagementTab(0)
        }
        return
      }

      if (matchedManagementIndex !== managementTab) {
        setManagementTab(matchedManagementIndex)
      }
    } else if (subTabSegment) {
      const targetPath = `/POS/${slugToPascalPath(matchedTab.slug)}`
      if (location.pathname !== targetPath) {
        navigate(targetPath, { replace: true })
      }
    }
  }, [activeTab, location.pathname, managementTab, navigate, visibleManagementSections, visibleTabs])

  // Update the handleTabChange function to prevent scrolling
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)

    const selectedTab = visibleTabs[newValue]
    if (!selectedTab) {
      return
    }

    if (selectedTab.slug === "management") {
      const currentSection = visibleManagementSections[managementTab] ?? visibleManagementSections[0]
      if (currentSection) {
        const targetPath = `/POS/Management/${slugToPascalPath(currentSection.slug)}`
        if (location.pathname !== targetPath) {
          navigate(targetPath)
        }
      } else {
        const targetPath = `/POS/Management`
        if (location.pathname !== targetPath) {
          navigate(targetPath)
        }
      }
    } else {
      const targetPath = `/POS/${slugToPascalPath(selectedTab.slug)}`
      if (location.pathname !== targetPath) {
        navigate(targetPath)
      }
    }
  }

  const toggleTabsExpanded = () => {
    setIsTabsExpanded(!isTabsExpanded)
  }

  

  // Date range state
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date }>({
    startDate: subDays(new Date(), 6),
    endDate: new Date(),
  })
  const [frequency, setFrequency] = useState<string>("daily")

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
  } = useWidgetManager('pos')

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number
    mouseY: number
    widgetId: string
  } | null>(null)

  // Settings dialog state
  const [settingsDialogOpen, setSettingsDialogOpen] = useState<boolean>(false)
  const [currentWidgetSettings, setCurrentWidgetSettings] = useState<any>(null)

  // Analytics data state (POS + Stock)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [stockAnalyticsData, setStockAnalyticsData] = useState<any>(null)

  // Calculate container height based on widget positions
  const containerHeight = calculateContainerHeight()

  // POS data state derived from POSContext
  const [posData, setPosData] = useState<{
    totalOrders: number
    profitMargin: number
    revenue: number
    salesData: Array<{
      date: string
      sales?: { quantity: number; price: number }
    }>
    categoryData: Array<{
      date: string
      categories?: { name: string; quantity: number; price: number }
    }>
  }>({
    totalOrders: 0,
    profitMargin: 0,
    revenue: 0,
    salesData: [],
    categoryData: [],
  })

  // Load analytics data when component mounts or date range changes
  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        setIsLoadingData(true)
        const dateRangeFormatted = {
          startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
          endDate: format(dateRange.endDate, 'yyyy-MM-dd')
        }
        
        // Load both POS and Stock data for cross-module access
        const [posAnalyticsData, stockData] = await Promise.all([
          getPOSWidgets(dateRangeFormatted),
          getStockWidgets(dateRangeFormatted)
        ])
        
        console.log('POSDashboard: Loaded analytics data:', {
          posKpis: posAnalyticsData.kpis,
          stockKpis: stockData.kpis,
          salesByDayCount: posAnalyticsData.salesByDay?.length || 0,
          stockTrendsCount: stockData.stockTrends?.length || 0
        })
        
        setAnalyticsData(posAnalyticsData)
        setStockAnalyticsData(stockData)
      } catch (error) {
        console.error('Error loading POS analytics data, will use POS Context fallback:', error)
        // Don't set analyticsData so fallback will be used
      } finally {
        setIsLoadingData(false)
      }
    }
    
    if (companyState.companyID && companyState.selectedSiteID && getPOSWidgets && getStockWidgets) {
      loadAnalyticsData()
    } else {
      console.log('POSDashboard: No company/site selected or Analytics Context unavailable, using POS Context fallback')
      setIsLoadingData(false)
    }
  }, [dateRange, frequency, getPOSWidgets, companyState.companyID, companyState.selectedSiteID])

  // Calculate fallback POS metrics from placeholder data
  useEffect(() => {
    const calculatePOSMetrics = () => {
      // Calculate total orders (using placeholder data since we don't have actual bills)
      const totalOrders = 150 // Placeholder value
      
      // Calculate revenue (using placeholder since companyState doesn't have bills)
      const revenue = 5000 // Placeholder value

      // Calculate profit margin (assuming 30% profit margin)
      const profitMargin = 30

      // Generate historical sales data based on current bills
      const generateHistoricalData = (baseValue: number, days = 7) => {
        return Array.from({ length: days }).map((_, i) => {
          const date = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd")
          const variation = 0.8 + Math.random() * 0.4 // ±20% variation
          return {
            date,
            sales: {
              quantity: Math.round(baseValue * variation * 0.1), // Convert to reasonable quantity
              price: Math.round(baseValue * variation),
            },
          }
        })
      }

      // Create sales data history
      const salesData = generateHistoricalData(revenue || 1000)

      // Create category data with placeholder data
      const demoMenuItems = [
        { name: "Burgers", price: 15 },
        { name: "Pizza", price: 20 },
        { name: "Drinks", price: 5 },
        { name: "Sides", price: 5 },
        { name: "Desserts", price: 10 }
      ]
      
      const categoryData = demoMenuItems.map((item: any, index: number) => ({
        date: item.name || `Category ${index + 1}`,
        categories: {
          name: item.name || `Category ${index + 1}`,
          quantity: Math.round(20 + Math.random() * 50),
          price: Math.round((item.price || 10) * (20 + Math.random() * 50)),
        },
      }))

      setPosData({
        totalOrders,
        profitMargin,
        revenue,
        salesData,
        categoryData,
      })
    }

    calculatePOSMetrics()
  }, []) // No dependencies since we're using placeholder data

  // Fetch real data from context
  const fetchPOSData = async (startDate: Date, endDate: Date, dataFrequency: string) => {
    if (!companyState.companyID || !companyState.selectedSiteID) return

    setIsLoadingData(true)

    try {
      // Generate placeholder bills data since we don't have posState
      const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const placeholderBills = Array.from({ length: Math.min(daysInRange * 5, 30) }).map((_, index) => {
        const randomDay = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()))
        return {
          id: `bill-${index}`,
          createdAt: randomDay.getTime(),
          totalAmount: 20 + Math.random() * 100,
          items: Array.from({ length: Math.floor(1 + Math.random() * 5) }).map((_, itemIndex) => ({
            id: `item-${index}-${itemIndex}`,
            name: `Item ${itemIndex + 1}`,
            price: 5 + Math.random() * 20
          }))
        }
      })
      
      // Filter bills by date range (using our placeholder data)
      const filteredBills = placeholderBills.filter((bill: any) => {
        if (!bill.createdAt) return false
        try {
          const billDate = new Date(bill.createdAt)
          return billDate >= startDate && billDate <= endDate
        } catch (e) {
          return false
        }
      })

      // Process filtered data
      const salesData = filteredBills.map((bill: any) => ({
        date: format(new Date(bill.createdAt), "yyyy-MM-dd"),
        sales: {
          quantity: bill.items?.length || 1,
          price: bill.totalAmount || 0,
        },
      }))

      // Helper function to group data by frequency
      const groupDataByFrequency = (data: any[], frequency: string) => {
        if (frequency === 'daily' || data.length === 0) return data;
        
        const grouped: Record<string, any> = {};
        
        data.forEach(item => {
          let key = item.date;
          
          if (frequency === 'weekly') {
            const date = new Date(item.date);
            const weekStart = format(startOfWeek(date), 'yyyy-MM-dd');
            key = `Week of ${weekStart}`;
          } else if (frequency === 'monthly') {
            key = item.date.substring(0, 7); // YYYY-MM
          } else if (frequency === 'yearly') {
            key = item.date.substring(0, 4); // YYYY
          }
          
          if (!grouped[key]) {
            grouped[key] = {
              date: key,
              sales: { quantity: 0, price: 0 }
            };
          }
          
          grouped[key].sales.quantity += item.sales?.quantity || 0;
          grouped[key].sales.price += item.sales?.price || 0;
        });
        
        return Object.values(grouped);
      };
      
      // Group data by frequency if needed
      const groupedSalesData = groupDataByFrequency(salesData, dataFrequency)

      // Calculate summary metrics
      const totalOrders = filteredBills.length
      const revenue = filteredBills.reduce((sum: number, bill: any) => sum + (bill.totalAmount || 0), 0)
      const profitMargin = 30 // Default profit margin

      setPosData((prev) => ({
        ...prev,
        totalOrders,
        revenue,
        profitMargin,
        salesData: groupedSalesData.length > 0 ? groupedSalesData : prev.salesData,
      }))
    } catch (error) {
      console.error("Error fetching POS data:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Helper functions for data processing

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing)
  }

  // Handle revert - reload saved layout and exit edit mode without saving
  const handleRevert = async () => {
    console.log('POS Dashboard: Reverting changes and exiting edit mode')
    await revertDashboard()
    setIsEditing(false)
  }

  // Date range handling
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
    fetchPOSData(start, end, frequency)
  }

  const handleFrequencyChange = (newFrequency: string) => {
    setFrequency(newFrequency)
    fetchPOSData(dateRange.startDate, dateRange.endDate, newFrequency)
  }

  const handleCustomDateApply = () => {
    setCustomDateDialogOpen(false)
    fetchPOSData(dateRange.startDate, dateRange.endDate, frequency)
  }

  // Widget handling
  const handleWidgetContextMenu = (event: React.MouseEvent, widgetId: string) => {
    if (!isEditing) return

    event.preventDefault()
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      widgetId,
    })
  }

  const handleOpenWidgetSettings = (widgetId: string) => {
    const settings = getWidgetSettings(widgetId)
    if (settings) {
      setCurrentWidgetSettings(settings)
      setSettingsDialogOpen(true)
    }
  }

  const handleSaveWidgetSettings = (settings: any) => {
    updateWidgetSettings(settings)
    setSettingsDialogOpen(false)
  }

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

  const handleClearWidgets = () => {
    setClearWidgetsDialogOpen(true)
  }

  const confirmClearWidgets = () => {
    clearAllWidgets()
    setClearWidgetsDialogOpen(false)
  }


  // Fallback function to get data directly from POS Context (original approach)
  const getPOSContextData = (widget: any, dataType: DataType) => {
    console.log('POSDashboard: Getting POS Context data for:', dataType, 'Date range:', dateRange, 'Frequency:', frequency)
    
    // Generate historical data based on date range and frequency
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
        const variation = 0.8 + Math.random() * 0.4 // ±20% variation
        return {
          date,
          [dataType]: {
            quantity: Math.round(baseValue * variation),
            price: Math.round(baseValue * variation * 15) // Assume £15 per item average
          }
        }
      })
    }

    // For dashboard cards and stats, provide the specific value
    if (widget.type === WidgetType.DASHBOARD_CARD || widget.type === WidgetType.STAT) {
      switch (dataType) {
        case DataType.TOTAL_ITEMS:
          return {
            totalItems: posData.totalOrders,
            history: generateHistoricalData(posData.totalOrders),
          }
        case DataType.PROFIT_MARGIN:
          return {
            profitMargin: posData.profitMargin,
            history: generateHistoricalData(posData.profitMargin),
          }
        case DataType.INVENTORY_VALUE: // Using this for Revenue
          return {
            inventoryValue: posData.revenue,
            history: generateHistoricalData(posData.revenue / 100), // Scale down for chart
          }
        case DataType.SALES:
          return {
            totalValue: posData.revenue,
            history: generateHistoricalData(posData.revenue / 100),
          }
        case DataType.PROFIT:
          return {
            totalProfit: posData.revenue * (posData.profitMargin / 100),
            history: generateHistoricalData((posData.revenue * posData.profitMargin / 100) / 100),
          }
        default:
          return {
            value: 0,
            history: generateHistoricalData(1),
          }
      }
    }

    // For charts, provide the appropriate historical data
    switch (dataType) {
      case DataType.SALES:
        return { history: generateHistoricalData(posData.revenue / 100) }
      case DataType.CATEGORIES:
        return { history: generateHistoricalData(10) }
      default:
        return { history: generateHistoricalData(10) }
    }
  }

  // Get data for widget based on its type using analytics context or fallback to POS context
  const getWidgetData = (widget: any) => {
    if (!widget || !widget.dataType) {
      console.log('POSDashboard: Missing widget or dataType:', { widget: !!widget, dataType: widget?.dataType })
      return { history: [] }
    }

    const dataType = widget.dataType
    console.log('POSDashboard: Getting data for widget:', dataType, 'Analytics available:', !!analyticsData, 'POS data available:', !!posData.totalOrders)

    // Fallback to POS Context data if Analytics Context is not available or empty
    if (!analyticsData || Object.keys(analyticsData).length === 0 || !analyticsData.kpis) {
      console.log('POSDashboard: Using POS Context fallback data')
      return getPOSContextData(widget, dataType)
    }

    // For dashboard cards and stats, provide the specific value from analytics
    if (widget.type === WidgetType.DASHBOARD_CARD || widget.type === WidgetType.STAT) {
      switch (dataType) {
        case DataType.TOTAL_ITEMS:
          return {
            totalItems: analyticsData.kpis?.totalTransactions || 0,
            history: analyticsData.salesByDay || [],
          }
        case DataType.PROFIT_MARGIN:
          return {
            profitMargin: 30, // Default margin
            history: analyticsData.salesByDay || [],
          }
        case DataType.INVENTORY_VALUE: // Using this for Revenue
          return {
            inventoryValue: analyticsData.kpis?.totalSales || 0,
            history: analyticsData.salesByDay || [],
          }
        case DataType.SALES:
          return {
            totalValue: analyticsData.kpis?.totalSales || 0,
            history: analyticsData.salesByDay || [],
          }
        case DataType.PROFIT:
          return {
            totalProfit: (analyticsData.kpis?.totalSales || 0) * 0.3,
            history: analyticsData.salesByDay || [],
          }
      }
    }

    // For charts, provide the appropriate analytics data (POS + Stock)
    switch (dataType) {
      case DataType.SALES:
      case DataType.SALES_BY_DAY:
      case DataType.SALES_BY_HOUR:
        return { history: analyticsData.salesByDay || analyticsData.salesByHour || [] }
      case DataType.CATEGORIES:
        return { data: analyticsData.categoryBreakdown || [] }
      case DataType.PAYMENT_METHOD_BREAKDOWN:
        return { data: analyticsData.paymentMethodBreakdown || {} }
      case DataType.CUSTOMER_ANALYTICS:
        return { data: analyticsData.customerAnalytics || [] }
      
      // Stock data types (cross-module access)
      case DataType.STOCK_COUNT:
        return { history: stockAnalyticsData?.stockTrends || [] }
      case DataType.STOCK_VALUE:
        return { 
          totalValue: stockAnalyticsData?.kpis?.totalStockValue || 0,
          history: stockAnalyticsData?.stockTrends || [] 
        }
      case DataType.LOW_STOCK_ITEMS:
        return { 
          lowStockItems: stockAnalyticsData?.kpis?.lowStockCount || 0,
          data: stockAnalyticsData?.lowStockItems || [] 
        }
      case DataType.STOCK_BY_CATEGORY:
        return { data: stockAnalyticsData?.stockByCategory || [] }
      case DataType.STOCK_BY_SUPPLIER:
        return { data: stockAnalyticsData?.stockBySupplier || [] }
      case DataType.TOP_SELLING_ITEMS:
        return { data: stockAnalyticsData?.topSellingItems || [] }
      case DataType.PURCHASE_HISTORY:
        return { history: stockAnalyticsData?.purchaseHistory || [] }
      case DataType.STOCK_TRENDS:
        return { history: stockAnalyticsData?.stockTrends || [] }
      
      default:
        return { history: analyticsData.salesByDay || [] }
    }
  }

  // Show loading state
  if (isLoading) {
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
          Loading POS dashboard...
        </Typography>
      </Box>
    )
  }

  // Show message if no company/site selected
  if (!companyState.companyID || !companyState.selectedSiteID) {
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
          POS Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Please select a company and site to view POS data.
        </Typography>
      </Box>
    )
  }

  // Show message if no tabs are visible due to permissions
  if (visibleTabs.length === 0) {
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
          You don't have permission to access any POS features. Please contact your administrator.
        </Typography>
      </Box>
    )
  }

  // Dashboard content to be collapsed with tabs
  const dashboardContent = (
    <Box sx={{ width: "100%" }}>
      <DashboardHeader
        title="Sales Dashboard"
        subtitle="Sales Dashboard"
        canEdit={hasPermission("pos", "dashboard", "edit")}
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
            permission: hasPermission("pos", "dashboard", "edit"),
          },
          {
            label: "Menu Item",
            onClick: () => navigate("/POS/Menu"),
            permission: hasPermission("pos", "items", "edit"),
          },
          {
            label: "Order",
            onClick: () => navigate("/POS/New-Order"),
            permission: hasPermission("pos", "orders", "edit"),
          },
          {
            label: "Till Screen",
            onClick: () => navigate("/POS/TillScreen"),
            permission: hasPermission("pos", "tillscreens", "edit"),
          },
          {
            label: "Payment Type",
            onClick: () => navigate("/POS/Payment-Management"),
            permission: hasPermission("pos", "payments", "edit"),
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
        {dashboardState.widgets.map((widget) => (
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
                data={getWidgetData(widget)}
                onSettingsOpen={handleOpenWidgetSettings}
                isEditing={isEditing}
              />
            </Box>
          </Rnd>
        ))}
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

          <Box sx={{ width: "100%", minHeight: "65vh", pb: 4 }}>
            {visibleTabs[activeTab] && (
              typeof visibleTabs[activeTab].component === 'function' 
                ? visibleTabs[activeTab].component() 
                : visibleTabs[activeTab].component
            )}
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
        availableDataTypes={getPOSDataTypes()}
      />

      {/* Add Widget Dialog */}
      <Dialog open={addWidgetOpen} onClose={() => setAddWidgetOpen(false)}>
        <DialogTitle>Add New Widget</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Widget Type</InputLabel>
            <Select value={newWidgetType} label="Widget Type" onChange={(e) => setNewWidgetType(e.target.value)}>
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
              onChange={(e) => setNewWidgetDataType(e.target.value as DataType)}
            >
              {getPOSDataTypes().map((type) => (
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
        availableDataTypes={getPOSDataTypes()}
      />

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

// Wrap the component with POSProvider
const POS = () => {
  return (
    <POSProvider>
      <POSDashboard />
    </POSProvider>
  )
}

export default POS
