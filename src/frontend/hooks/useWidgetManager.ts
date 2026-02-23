"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { WidgetSettings, DashboardState, DataSeries } from "../types/WidgetTypes"
import { WidgetType } from "../types/WidgetTypes"
import { v4 as uuidv4 } from "uuid"
import { DataType } from "../types/WidgetTypes"
import { useAnalytics } from "../../backend/context/AnalyticsContext"

// Grid configuration
export const GRID_SIZE = 20 // Size of each grid cell in pixels
export const MIN_WIDGET_WIDTH = 10 // Minimum widget width in grid units (200px)
export const MIN_WIDGET_HEIGHT = 7 // Minimum widget height in grid units (140px)

// Default colors for different data types
const DEFAULT_DATA_COLORS: Record<string, string> = {
  stockCount: "#4caf50",
  purchases: "#2196f3",
  sales: "#f44336",
  predictedStock: "#ff9800",
  costOfSales: "#9c27b0",
  profit: "#009688",
  parLevels: "#673ab7",
  stockValue: "#3f51b5",
  stockTurnover: "#795548",
  topItems: "#607d8b",
  totalItems: "#4caf50",
  profitMargin: "#009688",
  lowStockItems: "#ff9800",
  inventoryValue: "#3f51b5",
}

// Convert pixel values to grid units
const convertPixelsToGridUnits = (pixels: number) => Math.round(pixels / GRID_SIZE)

// Convert grid units to pixels
const convertGridUnitsToPixels = (units: number) => units * GRID_SIZE

// Section-specific default layouts
const getDefaultLayoutForSection = (section: string): DashboardState => {
  switch (section) {
    case 'stock':
      return {
        widgets: [
          {
            id: "total-items",
            type: WidgetType.STAT,
            title: "Total Items",
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            minW: 2,
            minH: 2,
            gridX: 0,
            gridY: 0,
            gridWidth: 10,
            gridHeight: 5,
            dataType: DataType.TOTAL_ITEMS,
            displayMode: "quantity",
            dataSeries: [{ dataType: DataType.TOTAL_ITEMS, displayMode: "quantity", color: "#1976d2", visible: true, label: "Total Items" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#1976d2"] },
            visible: true,
          },
          {
            id: "stock-value",
            type: WidgetType.STAT,
            title: "Stock Value",
            x: 220,
            y: 0,
            width: 200,
            height: 100,
            minW: 2,
            minH: 2,
            gridX: 11,
            gridY: 0,
            gridWidth: 10,
            gridHeight: 5,
            dataType: DataType.STOCK_VALUE,
            displayMode: "price",
            dataSeries: [{ dataType: DataType.STOCK_VALUE, displayMode: "price", color: "#388e3c", visible: true, label: "Stock Value" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#388e3c"] },
            visible: true,
          },
          {
            id: "low-stock",
            type: WidgetType.STAT,
            title: "Low Stock Items",
            x: 440,
            y: 0,
            width: 200,
            height: 100,
            minW: 2,
            minH: 2,
            gridX: 22,
            gridY: 0,
            gridWidth: 10,
            gridHeight: 5,
            dataType: DataType.LOW_STOCK_ITEMS,
            displayMode: "quantity",
            dataSeries: [{ dataType: DataType.LOW_STOCK_ITEMS, displayMode: "quantity", color: "#f57c00", visible: true, label: "Low Stock" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#f57c00"] },
            visible: true,
          },
          {
            id: "stock-trends",
            type: WidgetType.LINE_CHART,
            title: "Stock Trends",
            x: 0,
            y: 120,
            width: 400,
            height: 200,
            minW: 4,
            minH: 3,
            gridX: 0,
            gridY: 6,
            gridWidth: 20,
            gridHeight: 10,
            dataType: DataType.STOCK_TRENDS,
            displayMode: "quantity",
            dataSeries: [{ dataType: DataType.STOCK_TRENDS, displayMode: "quantity", color: "#1976d2", visible: true, label: "Stock Trends" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#1976d2", "#388e3c", "#f57c00"] },
            visible: true,
          },
          {
            id: "stock-by-category",
            type: WidgetType.PIE_CHART,
            title: "Stock by Category",
            x: 420,
            y: 120,
            width: 300,
            height: 200,
            minW: 3,
            minH: 3,
            gridX: 21,
            gridY: 6,
            gridWidth: 15,
            gridHeight: 10,
            dataType: DataType.STOCK_BY_CATEGORY,
            displayMode: "quantity",
            dataSeries: [{ dataType: DataType.STOCK_BY_CATEGORY, displayMode: "quantity", color: "#1976d2", visible: true, label: "Categories" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#1976d2", "#388e3c", "#f57c00", "#d32f2f", "#7b1fa2"] },
            visible: true,
          }
        ]
      }
    case 'hr':
      return {
        widgets: [
          {
            id: "total-employees",
            type: WidgetType.STAT,
            title: "Total Employees",
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            minW: 2,
            minH: 2,
            gridX: 0,
            gridY: 0,
            gridWidth: 10,
            gridHeight: 5,
            dataType: DataType.TOTAL_ITEMS,
            displayMode: "quantity",
            dataSeries: [{ dataType: DataType.TOTAL_ITEMS, displayMode: "quantity", color: "#1976d2", visible: true, label: "Total Employees" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#1976d2"] },
            visible: true,
          },
          {
            id: "attendance-rate",
            type: WidgetType.STAT,
            title: "Attendance Rate",
            x: 220,
            y: 0,
            width: 200,
            height: 100,
            minW: 2,
            minH: 2,
            gridX: 11,
            gridY: 0,
            gridWidth: 10,
            gridHeight: 5,
            dataType: DataType.ATTENDANCE,
            displayMode: "percentage",
            dataSeries: [{ dataType: DataType.ATTENDANCE, displayMode: "percentage", color: "#388e3c", visible: true, label: "Attendance" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#388e3c"] },
            visible: true,
          },
          {
            id: "performance-score",
            type: WidgetType.STAT,
            title: "Performance Score",
            x: 440,
            y: 0,
            width: 200,
            height: 100,
            minW: 2,
            minH: 2,
            gridX: 22,
            gridY: 0,
            gridWidth: 10,
            gridHeight: 5,
            dataType: DataType.PERFORMANCE,
            displayMode: "score",
            dataSeries: [{ dataType: DataType.PERFORMANCE, displayMode: "score", color: "#f57c00", visible: true, label: "Performance" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#f57c00"] },
            visible: true,
          },
          {
            id: "attendance-trends",
            type: WidgetType.LINE_CHART,
            title: "Attendance Trends",
            x: 0,
            y: 120,
            width: 400,
            height: 200,
            minW: 4,
            minH: 3,
            gridX: 0,
            gridY: 6,
            gridWidth: 20,
            gridHeight: 10,
            dataType: DataType.ATTENDANCE,
            displayMode: "percentage",
            dataSeries: [{ dataType: DataType.ATTENDANCE, displayMode: "percentage", color: "#1976d2", visible: true, label: "Attendance Trends" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#1976d2", "#388e3c", "#f57c00"] },
            visible: true,
          },
          {
            id: "employees-by-department",
            type: WidgetType.PIE_CHART,
            title: "Employees by Department",
            x: 420,
            y: 120,
            width: 300,
            height: 200,
            minW: 3,
            minH: 3,
            gridX: 21,
            gridY: 6,
            gridWidth: 15,
            gridHeight: 10,
            dataType: DataType.DEPARTMENTS,
            displayMode: "quantity",
            dataSeries: [{ dataType: DataType.DEPARTMENTS, displayMode: "quantity", color: "#1976d2", visible: true, label: "Departments" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#1976d2", "#388e3c", "#f57c00", "#d32f2f", "#7b1fa2"] },
            visible: true,
          }
        ]
      }
    case 'bookings':
      return {
        widgets: [
          {
            id: "total-bookings",
            type: WidgetType.STAT,
            title: "Total Bookings",
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            minW: 2,
            minH: 2,
            gridX: 0,
            gridY: 0,
            gridWidth: 10,
            gridHeight: 5,
            dataType: DataType.TOTAL_BOOKINGS,
            displayMode: "quantity",
            dataSeries: [{ dataType: DataType.TOTAL_BOOKINGS, displayMode: "quantity", color: "#1976d2", visible: true, label: "Total Bookings" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#1976d2"] },
            visible: true,
          },
          {
            id: "occupancy-rate",
            type: WidgetType.STAT,
            title: "Occupancy Rate",
            x: 220,
            y: 0,
            width: 200,
            height: 100,
            minW: 2,
            minH: 2,
            gridX: 11,
            gridY: 0,
            gridWidth: 10,
            gridHeight: 5,
            dataType: DataType.OCCUPANCY_RATE,
            displayMode: "percentage",
            dataSeries: [{ dataType: DataType.OCCUPANCY_RATE, displayMode: "percentage", color: "#388e3c", visible: true, label: "Occupancy" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#388e3c"] },
            visible: true,
          },
          {
            id: "waitlist-count",
            type: WidgetType.STAT,
            title: "Waitlist",
            x: 440,
            y: 0,
            width: 200,
            height: 100,
            minW: 2,
            minH: 2,
            gridX: 22,
            gridY: 0,
            gridWidth: 10,
            gridHeight: 5,
            dataType: DataType.WAITLIST_ANALYTICS,
            displayMode: "quantity",
            dataSeries: [{ dataType: DataType.WAITLIST_ANALYTICS, displayMode: "quantity", color: "#f57c00", visible: true, label: "Waitlist" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#f57c00"] },
            visible: true,
          },
          {
            id: "booking-trends",
            type: WidgetType.LINE_CHART,
            title: "Booking Trends",
            x: 0,
            y: 120,
            width: 400,
            height: 200,
            minW: 4,
            minH: 3,
            gridX: 0,
            gridY: 6,
            gridWidth: 20,
            gridHeight: 10,
            dataType: DataType.BOOKING_TRENDS,
            displayMode: "quantity",
            dataSeries: [{ dataType: DataType.BOOKING_TRENDS, displayMode: "quantity", color: "#1976d2", visible: true, label: "Booking Trends" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#1976d2", "#388e3c", "#f57c00"] },
            visible: true,
          },
          {
            id: "bookings-by-status",
            type: WidgetType.PIE_CHART,
            title: "Bookings by Status",
            x: 420,
            y: 120,
            width: 300,
            height: 200,
            minW: 3,
            minH: 3,
            gridX: 21,
            gridY: 6,
            gridWidth: 15,
            gridHeight: 10,
            dataType: DataType.BOOKINGS_BY_STATUS,
            displayMode: "quantity",
            dataSeries: [{ dataType: DataType.BOOKINGS_BY_STATUS, displayMode: "quantity", color: "#1976d2", visible: true, label: "Status" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#1976d2", "#388e3c", "#f57c00", "#d32f2f", "#7b1fa2"] },
            visible: true,
          }
        ]
      }
    case 'pos':
      return {
        widgets: [
          {
            id: "total-transactions",
            type: WidgetType.STAT,
            title: "Total Transactions",
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            minW: 2,
            minH: 2,
            gridX: 0,
            gridY: 0,
            gridWidth: 10,
            gridHeight: 5,
            dataType: DataType.POS_TRANSACTIONS,
            displayMode: "quantity",
            dataSeries: [{ dataType: DataType.POS_TRANSACTIONS, displayMode: "quantity", color: "#1976d2", visible: true, label: "Transactions" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#1976d2"] },
            visible: true,
          },
          {
            id: "daily-revenue",
            type: WidgetType.STAT,
            title: "Daily Revenue",
            x: 220,
            y: 0,
            width: 200,
            height: 100,
            minW: 2,
            minH: 2,
            gridX: 11,
            gridY: 0,
            gridWidth: 10,
            gridHeight: 5,
            dataType: DataType.SALES_BY_DAY,
            displayMode: "price",
            dataSeries: [{ dataType: DataType.SALES_BY_DAY, displayMode: "price", color: "#388e3c", visible: true, label: "Revenue" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#388e3c"] },
            visible: true,
          },
          {
            id: "average-order-value",
            type: WidgetType.STAT,
            title: "Average Order Value",
            x: 440,
            y: 0,
            width: 200,
            height: 100,
            minW: 2,
            minH: 2,
            gridX: 22,
            gridY: 0,
            gridWidth: 10,
            gridHeight: 5,
            dataType: DataType.SALES_BY_DAY,
            displayMode: "price",
            dataSeries: [{ dataType: DataType.SALES_BY_DAY, displayMode: "price", color: "#f57c00", visible: true, label: "AOV" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#f57c00"] },
            visible: true,
          },
          {
            id: "sales-trends",
            type: WidgetType.LINE_CHART,
            title: "Sales Trends",
            x: 0,
            y: 120,
            width: 400,
            height: 200,
            minW: 4,
            minH: 3,
            gridX: 0,
            gridY: 6,
            gridWidth: 20,
            gridHeight: 10,
            dataType: DataType.SALES_BY_DAY,
            displayMode: "price",
            dataSeries: [{ dataType: DataType.SALES_BY_DAY, displayMode: "price", color: "#1976d2", visible: true, label: "Sales Trends" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#1976d2", "#388e3c", "#f57c00"] },
            visible: true,
          },
          {
            id: "payment-methods",
            type: WidgetType.PIE_CHART,
            title: "Payment Methods",
            x: 420,
            y: 120,
            width: 300,
            height: 200,
            minW: 3,
            minH: 3,
            gridX: 21,
            gridY: 6,
            gridWidth: 15,
            gridHeight: 10,
            dataType: DataType.PAYMENT_METHOD_BREAKDOWN,
            displayMode: "quantity",
            dataSeries: [{ dataType: DataType.PAYMENT_METHOD_BREAKDOWN, displayMode: "quantity", color: "#1976d2", visible: true, label: "Payment Methods" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#1976d2", "#388e3c", "#f57c00", "#d32f2f", "#7b1fa2"] },
            visible: true,
          }
        ]
      }
    case 'finance':
      return {
        widgets: [
          {
            id: "total-revenue",
            type: WidgetType.STAT,
            title: "Total Revenue",
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            minW: 2,
            minH: 2,
            gridX: 0,
            gridY: 0,
            gridWidth: 10,
            gridHeight: 5,
            dataType: DataType.REVENUE,
            displayMode: "price",
            dataSeries: [{ dataType: DataType.REVENUE, displayMode: "price", color: "#1976d2", visible: true, label: "Revenue" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#1976d2"] },
            visible: true,
          },
          {
            id: "total-expenses",
            type: WidgetType.STAT,
            title: "Total Expenses",
            x: 220,
            y: 0,
            width: 200,
            height: 100,
            minW: 2,
            minH: 2,
            gridX: 11,
            gridY: 0,
            gridWidth: 10,
            gridHeight: 5,
            dataType: DataType.EXPENSES,
            displayMode: "price",
            dataSeries: [{ dataType: DataType.EXPENSES, displayMode: "price", color: "#f44336", visible: true, label: "Expenses" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#f44336"] },
            visible: true,
          },
          {
            id: "net-profit",
            type: WidgetType.STAT,
            title: "Net Profit",
            x: 440,
            y: 0,
            width: 200,
            height: 100,
            minW: 2,
            minH: 2,
            gridX: 22,
            gridY: 0,
            gridWidth: 10,
            gridHeight: 5,
            dataType: DataType.PROFIT,
            displayMode: "price",
            dataSeries: [{ dataType: DataType.PROFIT, displayMode: "price", color: "#4caf50", visible: true, label: "Profit" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#4caf50"] },
            visible: true,
          },
          {
            id: "cash-flow",
            type: WidgetType.LINE_CHART,
            title: "Cash Flow Analysis",
            x: 0,
            y: 120,
            width: 400,
            height: 200,
            minW: 4,
            minH: 3,
            gridX: 0,
            gridY: 6,
            gridWidth: 20,
            gridHeight: 10,
            dataType: DataType.CASH_FLOW_ANALYSIS,
            displayMode: "price",
            dataSeries: [{ dataType: DataType.CASH_FLOW_ANALYSIS, displayMode: "price", color: "#2196f3", visible: true, label: "Cash Flow" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#2196f3", "#4caf50", "#f44336"] },
            visible: true,
          },
          {
            id: "expense-breakdown",
            type: WidgetType.PIE_CHART,
            title: "Expense Breakdown",
            x: 420,
            y: 120,
            width: 300,
            height: 200,
            minW: 3,
            minH: 3,
            gridX: 21,
            gridY: 6,
            gridWidth: 15,
            gridHeight: 10,
            dataType: DataType.EXPENSE_BREAKDOWN,
            displayMode: "price",
            dataSeries: [{ dataType: DataType.EXPENSE_BREAKDOWN, displayMode: "price", color: "#ff9800", visible: true, label: "Expenses" }],
            colors: { background: "#ffffff", border: "#e0e0e0", text: "#333333", series: ["#ff9800", "#f44336", "#9c27b0", "#3f51b5", "#009688"] },
            visible: true,
          }
        ]
      }
    default:
      return { widgets: [] }
  }
}

// Fix the initial dashboard state to use enum values
const INITIAL_DASHBOARD_STATE: DashboardState = {
  widgets: [
    {
      id: "performance-chart",
      type: WidgetType.LINE_CHART,
      title: "Stock Performance",
      x: 0,
      y: 0,
      width: 600,
      height: 300,
      minW: 4,
      minH: 3,
      gridX: 0,
      gridY: 0,
      gridWidth: 30, // 600px / 20px = 30 grid units
      gridHeight: 15, // 300px / 20px = 15 grid units
      dataType: DataType.STOCK_COUNT,
      displayMode: "quantity",
      dataSeries: [
        {
          dataType: DataType.STOCK_COUNT,
          displayMode: "quantity",
          color: "#4caf50",
          visible: true,
          label: "Stock Count",
        },
      ],
      colors: {
        background: "#ffffff",
        border: "#e0e0e0",
        text: "#333333",
        series: ["#4caf50", "#2196f3", "#f44336"],
      },
      visible: true,
    },
    {
      id: "category-chart",
      type: WidgetType.BAR_CHART,
      title: "Category Distribution",
      x: 620,
      y: 0,
      width: 600,
      height: 300,
      minW: 4,
      minH: 3,
      gridX: 31, // (620px / 20px) = 31 grid units
      gridY: 0,
      gridWidth: 30, // 600px / 20px = 30 grid units
      gridHeight: 15, // 300px / 20px = 15 grid units
      dataType: DataType.STOCK_COUNT,
      displayMode: "quantity",
      dataSeries: [
        {
          dataType: DataType.STOCK_COUNT,
          displayMode: "quantity",
          color: "#4caf50",
          visible: true,
          label: "Stock Count",
        },
      ],
      colors: {
        background: "#ffffff",
        border: "#e0e0e0",
        text: "#333333",
        series: ["#4caf50", "#2196f3", "#f44336", "#ff9800", "#9c27b0"],
      },
      visible: true,
    },
    {
      id: "stock-value",
      type: WidgetType.STAT,
      title: "Total Stock Value",
      x: 0,
      y: 320,
      width: 300,
      height: 150,
      minW: 2,
      minH: 1,
      gridX: 0,
      gridY: 16, // (320px / 20px) = 16 grid units
      gridWidth: 15, // 300px / 20px = 15 grid units
      gridHeight: 8, // 150px / 20px = 7.5 grid units (rounded to 8)
      dataType: DataType.STOCK_VALUE,
      displayMode: "price",
      dataSeries: [
        {
          dataType: DataType.STOCK_VALUE,
          displayMode: "price",
          color: "#3f51b5",
          visible: true,
          label: "Stock Value",
        },
      ],
      colors: {
        background: "#ffffff",
        border: "#e0e0e0",
        text: "#333333",
        series: ["#3f51b5"],
      },
      visible: true,
    },
    {
      id: "stock-count",
      type: WidgetType.STAT,
      title: "Total Items",
      x: 320,
      y: 320,
      width: 300,
      height: 150,
      minW: 2,
      minH: 1,
      gridX: 16, // (320px / 20px) = 16 grid units
      gridY: 16, // (320px / 20px) = 16 grid units
      gridWidth: 15, // 300px / 20px = 15 grid units
      gridHeight: 8, // 150px / 20px = 7.5 grid units (rounded to 8)
      dataType: DataType.STOCK_COUNT,
      displayMode: "quantity",
      dataSeries: [
        {
          dataType: DataType.STOCK_COUNT,
          displayMode: "quantity",
          color: "#4caf50",
          visible: true,
          label: "Stock Count",
        },
      ],
      colors: {
        background: "#ffffff",
        border: "#e0e0e0",
        text: "#333333",
        series: ["#4caf50"],
      },
      visible: true,
    },
    {
      id: "profit-chart",
      type: WidgetType.PIE_CHART,
      title: "Profit Distribution",
      x: 640,
      y: 320,
      width: 300,
      height: 300,
      minW: 3,
      minH: 3,
      gridX: 32, // (640px / 20px) = 32 grid units
      gridY: 16, // (320px / 20px) = 16 grid units
      gridWidth: 15, // 300px / 20px = 15 grid units
      gridHeight: 15, // 300px / 20px = 15 grid units
      dataType: DataType.PROFIT,
      displayMode: "price",
      dataSeries: [
        {
          dataType: DataType.PROFIT,
          displayMode: "price",
          color: "#009688",
          visible: true,
          label: "Profit",
        },
      ],
      colors: {
        background: "#ffffff",
        border: "#e0e0e0",
        text: "#333333",
        series: ["#009688", "#f44336"],
      },
      visible: true,
    },
  ],
}

const useWidgetManager = (section: string = 'stock') => {
  const [dashboardState, setDashboardState] = useState<DashboardState>(() => getDefaultLayoutForSection(section))
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null)
  const [, setContainerHeight] = useState<number>(600)
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false)
  const savedStateSnapshotRef = useRef<DashboardState | null>(null) // Store snapshot for instant revert
  
  // Call useAnalytics unconditionally at top level (React hooks rule)
  // The hook itself handles the case when provider is not available
  const analytics = useAnalytics()
  
  // Get analytics functions if available, otherwise use null
  const saveDashboardLayout = analytics?.saveDashboardLayout || null
  const loadDashboardLayout = analytics?.loadDashboardLayout || null
  
  console.log(`useWidgetManager: Initial dashboard state for ${section} section, widgets count:`, getDefaultLayoutForSection(section).widgets.length)

  // Load dashboard state from database first, then localStorage fallback
  useEffect(() => {
    // Reset load flag when section changes
    setIsInitialLoadComplete(false)
    
    const loadDashboard = async () => {
      // Try to load from database first (if analytics is available)
      if (loadDashboardLayout) {
        try {
          console.log(`useWidgetManager: Loading dashboard layout for ${section} from database`)
          const dbLayout = await loadDashboardLayout(section)
          
          // loadDashboardLayout returns the layout array directly
          // Handle both array return and object with layout property (for backward compatibility)
          let layoutArray: WidgetSettings[] = []
          if (Array.isArray(dbLayout)) {
            layoutArray = dbLayout
          } else if (dbLayout && typeof dbLayout === 'object' && 'layout' in dbLayout && Array.isArray((dbLayout as any).layout)) {
            layoutArray = (dbLayout as any).layout
          } else if (dbLayout && typeof dbLayout === 'object') {
            // Try to extract layout from any structure
            console.warn(`useWidgetManager: Unexpected layout structure for ${section}, attempting to parse`)
            layoutArray = []
          }
          
          if (layoutArray && layoutArray.length > 0) {
            console.log(`useWidgetManager: Found database layout for ${section}, widgets count:`, layoutArray.length)
            
            // Ensure all widgets have grid positions and dataSeries
            const updatedWidgets = layoutArray.map((widget: WidgetSettings) => {
              if (widget.gridX === undefined || widget.gridY === undefined) {
                return {
                  ...widget,
                  gridX: convertPixelsToGridUnits(widget.x),
                  gridY: convertPixelsToGridUnits(widget.y),
                  gridWidth: convertPixelsToGridUnits(widget.width),
                  gridHeight: convertPixelsToGridUnits(widget.height),
                }
              }

            if (!widget.dataSeries) {
              const dataType = (widget.dataType || DataType.TOTAL_ITEMS) as DataType
              const displayMode = widget.displayMode || "quantity"
              const color = DEFAULT_DATA_COLORS[dataType] || "#4caf50"

              return {
                ...widget,
                dataSeries: [
                  {
                    dataType,
                    displayMode,
                    color,
                    visible: true,
                    label: dataType.toString().charAt(0).toUpperCase() + dataType.toString().slice(1).replace(/([A-Z])/g, " $1"),
                  },
                ],
              } as WidgetSettings
            }

            return widget as WidgetSettings
          })

          const loadedState = { widgets: updatedWidgets as WidgetSettings[] }
          setDashboardState(loadedState)
          savedStateSnapshotRef.current = JSON.parse(JSON.stringify(loadedState)) // Deep clone for snapshot
          updateContainerHeight(updatedWidgets)
          setIsInitialLoadComplete(true)
          return
          }
        } catch (error) {
          console.log(`useWidgetManager: Database load failed for ${section}, trying localStorage:`, error)
        }
      }

      // Fallback to localStorage
      const storageKey = `dashboardState_${section}`
      const savedState = localStorage.getItem(storageKey)
      console.log(`useWidgetManager: Saved state from localStorage for ${section}:`, savedState ? 'exists' : 'none')
      
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState)
          console.log(`useWidgetManager: Parsed saved state widgets count for ${section}:`, parsedState.widgets?.length || 0)

          const updatedWidgets = parsedState.widgets.map((widget: WidgetSettings) => {
            if (widget.gridX === undefined || widget.gridY === undefined) {
              return {
                ...widget,
                gridX: convertPixelsToGridUnits(widget.x),
                gridY: convertPixelsToGridUnits(widget.y),
                gridWidth: convertPixelsToGridUnits(widget.width),
                gridHeight: convertPixelsToGridUnits(widget.height),
              }
            }

            if (!widget.dataSeries) {
              const dataType = widget.dataType || "stockCount"
              const displayMode = widget.displayMode || "quantity"
              const color = DEFAULT_DATA_COLORS[dataType] || "#4caf50"

              return {
                ...widget,
                dataSeries: [
                  {
                    dataType,
                    displayMode,
                    color,
                    visible: true,
                    label: dataType.charAt(0).toUpperCase() + dataType.slice(1).replace(/([A-Z])/g, " $1"),
                  },
                ],
              }
            }

            return widget
          })

          const loadedState = { ...parsedState, widgets: updatedWidgets }
          setDashboardState(loadedState)
          savedStateSnapshotRef.current = JSON.parse(JSON.stringify(loadedState)) // Deep clone for snapshot
          console.log(`useWidgetManager: Dashboard state set from localStorage for ${section}, widgets count:`, updatedWidgets.length)
          updateContainerHeight(updatedWidgets)
          setIsInitialLoadComplete(true)
        } catch (error) {
          console.error(`Failed to parse dashboard state from localStorage for ${section}:`, error)
          const defaultState = getDefaultLayoutForSection(section)
          setDashboardState(defaultState)
          savedStateSnapshotRef.current = JSON.parse(JSON.stringify(defaultState)) // Deep clone for snapshot
          updateContainerHeight(defaultState.widgets)
          setIsInitialLoadComplete(true)
        }
      } else {
        const defaultState = getDefaultLayoutForSection(section)
        setDashboardState(defaultState)
        savedStateSnapshotRef.current = JSON.parse(JSON.stringify(defaultState)) // Deep clone for snapshot
        console.log(`useWidgetManager: No saved state for ${section}, using default layout with`, defaultState.widgets.length, 'widgets')
        updateContainerHeight(defaultState.widgets)
        setIsInitialLoadComplete(true)
      }
    }

    loadDashboard()
  }, [section, loadDashboardLayout])

  // Save dashboard state to database and localStorage whenever it changes
  useEffect(() => {
    // Don't save until initial load is complete to avoid overwriting saved layouts
    if (!isInitialLoadComplete) {
      console.log(`useWidgetManager: Skipping save - initial load not complete for ${section}`)
      return
    }

    const saveDashboard = async () => {
      console.log(`useWidgetManager: Dashboard state changed for ${section}, widgets count:`, dashboardState.widgets.length)
      
      // Ensure all widgets have required grid positions before saving
      const widgetsToSave = dashboardState.widgets.map((widget) => {
        const widgetCopy = { ...widget }
        // Ensure grid positions exist
        if (widgetCopy.gridX === undefined) {
          widgetCopy.gridX = convertPixelsToGridUnits(widgetCopy.x)
        }
        if (widgetCopy.gridY === undefined) {
          widgetCopy.gridY = convertPixelsToGridUnits(widgetCopy.y)
        }
        if (widgetCopy.gridWidth === undefined) {
          widgetCopy.gridWidth = convertPixelsToGridUnits(widgetCopy.width)
        }
        if (widgetCopy.gridHeight === undefined) {
          widgetCopy.gridHeight = convertPixelsToGridUnits(widgetCopy.height)
        }
        return widgetCopy
      })
      
      console.log(`useWidgetManager: Saving ${widgetsToSave.length} widgets for ${section} section`)
      
      // Save to localStorage immediately for fast access
      const storageKey = `dashboardState_${section}`
      const stateToSave = { ...dashboardState, widgets: widgetsToSave }
      localStorage.setItem(storageKey, JSON.stringify(stateToSave))
      console.log(`useWidgetManager: Saved to localStorage for ${section}`)
      
      // Save to database (if analytics is available)
      if (saveDashboardLayout) {
        try {
          await saveDashboardLayout(section, widgetsToSave)
          console.log(`useWidgetManager: ✅ Dashboard layout successfully saved to database for ${section}`)
        } catch (error) {
          console.error(`useWidgetManager: ❌ Failed to save dashboard layout to database for ${section}:`, error)
          // Continue with localStorage only if database save fails
        }
      } else {
        console.warn(`useWidgetManager: saveDashboardLayout not available for ${section}, only saving to localStorage`)
      }
    }

    saveDashboard()
  }, [dashboardState, section, saveDashboardLayout, isInitialLoadComplete])

  // Calculate the required container height based on widget positions
  const updateContainerHeight = (widgets: WidgetSettings[]) => {
    if (!widgets.length) {
      setContainerHeight(600)
      return
    }

    const maxY =
      Math.max(
        ...widgets.map((widget) => {
          const gridY = widget.gridY || 0
          const gridHeight = widget.gridHeight || 2
          return gridY + gridHeight
        }),
      ) + 2 // Add 2 grid units of padding

    setContainerHeight(convertGridUnitsToPixels(maxY))
  }

  const updateWidgetSettings = useCallback((updatedSettings: WidgetSettings) => {
    setDashboardState((prevState: DashboardState) => {
      const updatedWidgets = prevState.widgets.map((widget) =>
        widget.id === updatedSettings.id ? updatedSettings : widget,
      )

      // Update container height if needed
      updateContainerHeight(updatedWidgets)

      return {
        ...prevState,
        widgets: updatedWidgets,
      }
    })
  }, [])

  const removeWidget = useCallback(
    (id: string) => {
      setDashboardState((prevState: DashboardState) => {
        const updatedWidgets = prevState.widgets.filter((widget) => widget.id !== id)

        // Update container height if needed
        updateContainerHeight(updatedWidgets)

        return {
          ...prevState,
          widgets: updatedWidgets,
        }
      })

      if (selectedWidgetId === id) {
        setSelectedWidgetId(null)
      }
    },
    [selectedWidgetId],
  )

  // Fix the addWidget function to handle DataType enum
  const addWidget = useCallback(
    (
      type: "stat" | "barChart" | "lineChart" | "pieChart" | "chart" | "table" | "dashboardCard" | "calculator",
      dataType: DataType,
    ) => {
      // Find a suitable position for the new widget
      const existingWidgets = dashboardState.widgets

      // Find the lowest y position in grid units
      let maxGridY = 0
      if (existingWidgets.length > 0) {
        maxGridY = Math.max(...existingWidgets.map((w) => (w.gridY || 0) + (w.gridHeight || 2)))
      }

      // Default sizes based on widget type
      let gridWidth = 15 // 300px
      let gridHeight = 8 // 160px
      let minW = 2
      let minH = 1

      if (type === "barChart" || type === "lineChart") {
        gridWidth = 30 // 600px
        gridHeight = 15 // 300px
        minW = 4
        minH = 3
      } else if (type === "pieChart") {
        gridWidth = 15 // 300px
        gridHeight = 15 // 300px
        minW = 3
        minH = 3
      } else if (type === "table") {
        gridWidth = 30 // 600px
        gridHeight = 20 // 400px
        minW = 6
        minH = 4
      } else if (type === "dashboardCard") {
        gridWidth = 15 // 300px
        gridHeight = 8 // 160px
        minW = 3
        minH = 2
      } else if (type === "calculator") {
        gridWidth = 18 // 360px (portrait calculator ratio)
        gridHeight = 24 // 480px
        minW = 3
        minH = 4
      }

      // Convert to pixels
      const x = 0
      const y = convertGridUnitsToPixels(maxGridY + 1) // Add 1 grid unit of spacing
      const width = convertGridUnitsToPixels(gridWidth)
      const height = convertGridUnitsToPixels(gridHeight)

      // Determine display mode based on data type
      const displayMode: "price" | "quantity" = [
        DataType.STOCK_VALUE,
        DataType.PROFIT,
        DataType.COST_OF_SALES,
        DataType.INVENTORY_VALUE,
        DataType.PROFIT_MARGIN,
      ].includes(dataType)
        ? "price"
        : "quantity"

      // Create the data series
      const dataSeries: DataSeries[] = [
        {
          dataType,
          displayMode,
          color: DEFAULT_DATA_COLORS[dataType] || "#4caf50",
          visible: true,
          label: dataType.charAt(0).toUpperCase() + dataType.slice(1).replace(/([A-Z])/g, " $1"),
        },
      ]

      // Map string type to WidgetType enum
      let widgetType: WidgetType
      const typeStr = type as string
      switch (typeStr) {
        case "stat":
          widgetType = WidgetType.STAT
          break
        case "barChart":
          widgetType = WidgetType.BAR_CHART
          break
        case "lineChart":
          widgetType = WidgetType.LINE_CHART
          break
        case "pieChart":
          widgetType = WidgetType.PIE_CHART
          break
        case "chart":
          widgetType = WidgetType.CHART
          break
        case "table":
          widgetType = WidgetType.TABLE
          break
        case "dashboardCard":
          widgetType = WidgetType.DASHBOARD_CARD
          break
        case "calculator":
          widgetType = WidgetType.CALCULATOR
          break
        default:
          widgetType = WidgetType.STAT
      }

      const newWidget: WidgetSettings = {
        id: uuidv4(),
        type: widgetType,
        title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        x,
        y,
        width,
        height,
        minW,
        minH,
        gridX: 0,
        gridY: maxGridY + 1,
        gridWidth,
        gridHeight,
        dataType,
        displayMode,
        dataSeries,
        colors: {
          background: "#ffffff",
          border: "#e0e0e0",
          text: "#333333",
          series: [DEFAULT_DATA_COLORS[dataType] || "#4caf50"],
        },
        visible: true,
      }

      setDashboardState((prevState: DashboardState) => {
        const updatedWidgets = [...prevState.widgets, newWidget]

        // Update container height
        updateContainerHeight(updatedWidgets)

        return {
          ...prevState,
          widgets: updatedWidgets,
        }
      })

      return newWidget.id
    },
    [dashboardState.widgets],
  )

  // Fix the addDashboardCard function to handle DataType enum
  const addDashboardCard = useCallback(
    (cardData: any) => {
      // Convert dashboard card to widget
      const { title, dataType } = cardData

      // Find a suitable position
      const existingWidgets = dashboardState.widgets

      // Find the lowest y position in grid units
      let maxGridY = 0
      if (existingWidgets.length > 0) {
        maxGridY = Math.max(...existingWidgets.map((w) => (w.gridY || 0) + (w.gridHeight || 2)))
      }

      // Default sizes for dashboard card
      const gridWidth = 15 // 300px
      const gridHeight = 8 // 160px

      // Convert to pixels
      const x = 0
      const y = convertGridUnitsToPixels(maxGridY + 1) // Add 1 grid unit of spacing
      const width = convertGridUnitsToPixels(gridWidth)
      const height = convertGridUnitsToPixels(gridHeight)

      // Determine display mode based on data type
      const displayMode: "price" | "quantity" = [
        DataType.INVENTORY_VALUE,
        DataType.PROFIT_MARGIN,
        DataType.STOCK_VALUE,
        DataType.PROFIT,
      ].includes(dataType)
        ? "price"
        : "quantity"

      // Create the data series
      const dataSeries: DataSeries[] = [
        {
          dataType,
          displayMode,
          color: DEFAULT_DATA_COLORS[dataType] || "#4caf50",
          visible: true,
          label: title,
        },
      ]

      const newWidget: WidgetSettings = {
        id: uuidv4(),
        type: WidgetType.DASHBOARD_CARD,
        title,
        x,
        y,
        width,
        height,
        minW: 3,
        minH: 2,
        gridX: 0,
        gridY: maxGridY + 1,
        gridWidth,
        gridHeight,
        dataType,
        displayMode,
        dataSeries,
        colors: {
          background: "#ffffff",
          border: "#e0e0e0",
          text: "#333333",
          series: [DEFAULT_DATA_COLORS[dataType] || "#4caf50"],
        },
        visible: true,
        cardType: getCardTypeFromDataType(dataType),
        icon: getIconFromDataType(dataType),
      }

      setDashboardState((prevState: DashboardState) => {
        const updatedWidgets = [...prevState.widgets, newWidget]

        // Update container height
        updateContainerHeight(updatedWidgets)

        return {
          ...prevState,
          widgets: updatedWidgets,
        }
      })

      return newWidget.id
    },
    [dashboardState.widgets],
  )

  const getWidgetSettings = useCallback(
    (id: string): WidgetSettings | null => {
      return dashboardState.widgets.find((widget) => widget.id === id) || null
    },
    [dashboardState.widgets],
  )

  const resetDashboard = useCallback(() => {
    setDashboardState(INITIAL_DASHBOARD_STATE)
    setSelectedWidgetId(null)
    updateContainerHeight(INITIAL_DASHBOARD_STATE.widgets)
  }, [])

  // Revert to last saved layout (instant revert from snapshot)
  const revertDashboard = useCallback(async () => {
    console.log(`useWidgetManager: Reverting dashboard for ${section} to last saved state (instant revert)`)
    setIsInitialLoadComplete(false) // Prevent saving during reload
    
    // Instant revert from snapshot if available
    if (savedStateSnapshotRef.current) {
      const snapshot = JSON.parse(JSON.stringify(savedStateSnapshotRef.current)) // Deep clone
      setDashboardState(snapshot)
      updateContainerHeight(snapshot.widgets)
      setIsInitialLoadComplete(true)
      setSelectedWidgetId(null)
      console.log(`useWidgetManager: ✅ Instantly reverted to snapshot for ${section}, widgets count:`, snapshot.widgets.length)
      return
    }
    
    // Fallback: Try to load from database
    if (loadDashboardLayout) {
      try {
        const dbLayout = await loadDashboardLayout(section)
        const layoutArray = Array.isArray(dbLayout) 
          ? dbLayout 
          : (dbLayout && typeof dbLayout === 'object' && 'layout' in dbLayout && Array.isArray((dbLayout as any).layout))
            ? (dbLayout as any).layout
            : (dbLayout || [])
        
        if (layoutArray && layoutArray.length > 0) {
          const updatedWidgets = layoutArray.map((widget: WidgetSettings) => {
            if (widget.gridX === undefined || widget.gridY === undefined) {
              return {
                ...widget,
                gridX: convertPixelsToGridUnits(widget.x),
                gridY: convertPixelsToGridUnits(widget.y),
                gridWidth: convertPixelsToGridUnits(widget.width),
                gridHeight: convertPixelsToGridUnits(widget.height),
              } as WidgetSettings
            }
            if (!widget.dataSeries) {
              const dataType = (widget.dataType || DataType.TOTAL_ITEMS) as DataType
              const displayMode = widget.displayMode || "quantity"
              const color = DEFAULT_DATA_COLORS[dataType] || "#4caf50"
              return {
                ...widget,
                dataSeries: [{
                  dataType,
                  displayMode,
                  color,
                  visible: true,
                  label: dataType.toString().charAt(0).toUpperCase() + dataType.toString().slice(1).replace(/([A-Z])/g, " $1"),
                }],
              } as WidgetSettings
            }
            return widget as WidgetSettings
          })
          
          setDashboardState({ widgets: updatedWidgets as WidgetSettings[] })
          updateContainerHeight(updatedWidgets)
          setIsInitialLoadComplete(true)
          setSelectedWidgetId(null)
          console.log(`useWidgetManager: ✅ Reverted to saved layout for ${section}, widgets count:`, updatedWidgets.length)
          return
        }
      } catch (error) {
        console.error(`useWidgetManager: Failed to load saved layout for revert:`, error)
      }
    }
    
    // Fallback to localStorage
    const storageKey = `dashboardState_${section}`
    const savedState = localStorage.getItem(storageKey)
    
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        const updatedWidgets = parsedState.widgets?.map((widget: WidgetSettings) => {
          if (widget.gridX === undefined || widget.gridY === undefined) {
            return {
              ...widget,
              gridX: convertPixelsToGridUnits(widget.x),
              gridY: convertPixelsToGridUnits(widget.y),
              gridWidth: convertPixelsToGridUnits(widget.width),
              gridHeight: convertPixelsToGridUnits(widget.height),
            } as WidgetSettings
          }
          if (!widget.dataSeries) {
            const dataType = (widget.dataType || DataType.TOTAL_ITEMS) as DataType
            const displayMode = widget.displayMode || "quantity"
            const color = DEFAULT_DATA_COLORS[dataType] || "#4caf50"
            return {
              ...widget,
              dataSeries: [{
                dataType,
                displayMode,
                color,
                visible: true,
                label: dataType.toString().charAt(0).toUpperCase() + dataType.toString().slice(1).replace(/([A-Z])/g, " $1"),
              }],
            } as WidgetSettings
          }
          return widget as WidgetSettings
        }) || []
        
        setDashboardState({ ...parsedState, widgets: updatedWidgets as WidgetSettings[] })
        updateContainerHeight(updatedWidgets)
        setIsInitialLoadComplete(true)
        setSelectedWidgetId(null)
        console.log(`useWidgetManager: ✅ Reverted to localStorage layout for ${section}`)
      } catch (error) {
        console.error(`useWidgetManager: Failed to revert from localStorage:`, error)
        // Fall back to default
        setDashboardState(getDefaultLayoutForSection(section))
        updateContainerHeight(getDefaultLayoutForSection(section).widgets)
        setIsInitialLoadComplete(true)
      }
    } else {
      // No saved state, revert to default
      setDashboardState(getDefaultLayoutForSection(section))
      updateContainerHeight(getDefaultLayoutForSection(section).widgets)
      setIsInitialLoadComplete(true)
      console.log(`useWidgetManager: No saved layout found, reverted to default for ${section}`)
    }
  }, [section, loadDashboardLayout])

  // Fix the addDataSeriesToWidget function to handle DataType enum
  const addDataSeriesToWidget = useCallback((widgetId: string, dataType: DataType) => {
    setDashboardState((prevState: DashboardState) => {
      const updatedWidgets = prevState.widgets.map((widget) => {
        if (widget.id === widgetId) {
          if (widget.dataSeries.length >= 4) {
            return widget // Limit to 4 series
          }

          if (widget.dataSeries.some((series) => series.dataType === dataType)) {
            return widget // Avoid duplicate series
          }

          // Determine display mode based on data type
          const displayMode: "price" | "quantity" = [
            DataType.STOCK_VALUE,
            DataType.PROFIT,
            DataType.COST_OF_SALES,
            DataType.INVENTORY_VALUE,
            DataType.PROFIT_MARGIN,
          ].includes(dataType)
            ? "price"
            : "quantity"

          return {
            ...widget,
            dataSeries: [
              ...widget.dataSeries,
              {
                dataType,
                displayMode,
                color: DEFAULT_DATA_COLORS[dataType] || "#4caf50",
                visible: true,
                label: dataType.charAt(0).toUpperCase() + dataType.slice(1).replace(/([A-Z])/g, " $1"),
              },
            ],
          }
        }

        return widget
      })

      return {
        ...prevState,
        widgets: updatedWidgets,
      }
    })
  }, [])

  const removeDataSeriesFromWidget = useCallback((widgetId: string, dataTypeIndex: number) => {
    setDashboardState((prevState: DashboardState) => {
      const updatedWidgets = prevState.widgets.map((widget) => {
        if (widget.id === widgetId) {
          // Don't remove if it's the last data series
          if (widget.dataSeries.length <= 1) {
            return widget
          }

          // Remove the data series at the specified index
          const newDataSeries = [...widget.dataSeries]
          newDataSeries.splice(dataTypeIndex, 1)

          return {
            ...widget,
            dataSeries: newDataSeries,
            // Update the primary dataType to the first series
            dataType: newDataSeries[0].dataType,
            displayMode: newDataSeries[0].displayMode,
          }
        }
        return widget
      })

      return {
        ...prevState,
        widgets: updatedWidgets,
      }
    })
  }, [])

  // Snap position to grid
  const snapToGrid = useCallback((position: { x: number; y: number }) => {
    return {
      x: Math.round(position.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(position.y / GRID_SIZE) * GRID_SIZE,
    }
  }, [])

  // Snap size to grid
  const snapSizeToGrid = useCallback((size: { width: number; height: number }) => {
    return {
      width: Math.max(1, Math.round(size.width / GRID_SIZE)) * GRID_SIZE,
      height: Math.max(1, Math.round(size.height / GRID_SIZE)) * GRID_SIZE,
    }
  }, [])

  // Convert position to grid coordinates
  const positionToGrid = useCallback((position: { x: number; y: number }) => {
    return {
      col: Math.round(position.x / GRID_SIZE),
      row: Math.round(position.y / GRID_SIZE),
    }
  }, [])

  // Convert grid coordinates to position
  const gridToPosition = useCallback((grid: { row: number; col: number }) => {
    return {
      x: grid.col * GRID_SIZE,
      y: grid.row * GRID_SIZE,
    }
  }, [])

  // Check if a widget position would overlap with existing widgets
  const checkWidgetOverlap = useCallback(
    (id: string, position: { x: number; y: number }, size: { width: number; height: number }) => {
      const gridPos = positionToGrid(position)
      const gridSize = {
        cols: Math.round(size.width / GRID_SIZE),
        rows: Math.round(size.height / GRID_SIZE),
      }

      // Check for overlap with other widgets
      for (const widget of dashboardState.widgets) {
        if (widget.id === id) continue // Skip the current widget

        const widgetGridX = widget.gridX || 0
        const widgetGridY = widget.gridY || 0
        const widgetGridWidth = widget.gridWidth || Math.round(widget.width / GRID_SIZE)
        const widgetGridHeight = widget.gridHeight || Math.round(widget.height / GRID_SIZE)

        // Check if rectangles overlap
        if (
          gridPos.col < widgetGridX + widgetGridWidth &&
          gridPos.col + gridSize.cols > widgetGridX &&
          gridPos.row < widgetGridY + widgetGridHeight &&
          gridPos.row + gridSize.rows > widgetGridY
        ) {
          return true // Overlap detected
        }
      }

      return false // No overlap
    },
    [dashboardState.widgets, positionToGrid],
  )

  // Find a valid position for a widget that doesn't overlap
  const findValidPosition = useCallback(
    (id: string, position: { x: number; y: number }, size: { width: number; height: number }) => {
      const currentPos = { ...position }

      // Try to find a position without overlap
      let attempts = 0
      const maxAttempts = 100 // Prevent infinite loops

      while (checkWidgetOverlap(id, currentPos, size) && attempts < maxAttempts) {
        attempts++

        // Try moving right by one grid cell
        currentPos.x += GRID_SIZE

        // If we hit the right edge, move down and reset x
        if (currentPos.x > GRID_SIZE * 50) {
          // Assuming max width is 50 grid cells
          currentPos.x = 0
          currentPos.y += GRID_SIZE
        }
      }

      return currentPos
    },
    [checkWidgetOverlap],
  )

  const updateWidgetPosition = useCallback(
    (id: string, position: { x: number; y: number }) => {
      const widget = getWidgetSettings(id)
      if (!widget) return

      const snappedPosition = snapToGrid(position)

      // Find a position that doesn't overlap with other widgets
      const size = { width: widget.width, height: widget.height }
      const validPosition = findValidPosition(id, snappedPosition, size)

      const gridPosition = positionToGrid(validPosition)

      setDashboardState((prevState: DashboardState) => {
        const updatedWidgets = prevState.widgets.map((widget) =>
          widget.id === id
            ? {
                ...widget,
                x: validPosition.x,
                y: validPosition.y,
                gridX: gridPosition.col,
                gridY: gridPosition.row,
              }
            : widget,
        )

        // Update container height if needed
        updateContainerHeight(updatedWidgets)

        return {
          ...prevState,
          widgets: updatedWidgets,
        }
      })
    },
    [snapToGrid, positionToGrid, getWidgetSettings, findValidPosition],
  )

  const updateWidgetSize = useCallback(
    (id: string, size: { width: number; height: number }) => {
      const widget = getWidgetSettings(id)
      if (!widget) return

      // Ensure minimum size constraints are met
      const minWidth = widget.minW * GRID_SIZE
      const minHeight = widget.minH * GRID_SIZE

      const constrainedSize = {
        width: Math.max(size.width, minWidth),
        height: Math.max(size.height, minHeight),
      }

      const snappedSize = snapSizeToGrid(constrainedSize)
      const gridSize = {
        cols: Math.round(snappedSize.width / GRID_SIZE),
        rows: Math.round(snappedSize.height / GRID_SIZE),
      }

      setDashboardState((prevState: DashboardState) => {
        const updatedWidgets = prevState.widgets.map((widget) =>
          widget.id === id
            ? {
                ...widget,
                width: snappedSize.width,
                height: snappedSize.height,
                gridWidth: gridSize.cols,
                gridHeight: gridSize.rows,
              }
            : widget,
        )

        // Update container height if needed
        updateContainerHeight(updatedWidgets)

        return {
          ...prevState,
          widgets: updatedWidgets,
        }
      })
    },
    [snapSizeToGrid, getWidgetSettings],
  )

  // Fix the updateWidgetDataTypes function to handle DataType enum
  const updateWidgetDataTypes = useCallback((id: string, dataTypes: DataType[]) => {
    setDashboardState((prevState: DashboardState) => {
      const updatedWidgets = prevState.widgets.map((widget) => {
        if (widget.id === id) {
          // Create a new widget without the dataTypes property
          const updatedWidget: WidgetSettings = {
            ...widget,
            // Update the primary dataType to the first in the array
            dataType: dataTypes[0],
            // Update the title based on the widget type and data types
            title: dataTypes.length === 1 ? `${widget.type} - ${dataTypes[0]}` : `${widget.type} - Multiple Data`,
          }
          return updatedWidget
        }
        return widget
      })

      return {
        ...prevState,
        widgets: updatedWidgets,
      }
    })
  }, [])

  const calculateContainerHeight = useCallback(() => {
    if (dashboardState.widgets.length === 0) return 600 // Default height

    const maxY = Math.max(
      ...dashboardState.widgets.map((widget) => {
        const gridY = widget.gridY || 0
        const gridHeight = widget.gridHeight || 2
        return gridY + gridHeight
      }),
    )

    // Add some padding (2 grid units) to the bottom
    return (maxY + 2) * GRID_SIZE
  }, [dashboardState.widgets])

  // Fix the createWidget function to handle DataType enum
  const createWidget = useCallback(
    (
      type: "stat" | "barChart" | "lineChart" | "pieChart" | "chart" | "table" | "dashboardCard",
      initialDataType: DataType,
    ) => {
      // Find a suitable position for the new widget
      const existingWidgets = dashboardState.widgets

      // Find the lowest y position in grid units
      let maxGridY = 0
      if (existingWidgets.length > 0) {
        maxGridY = Math.max(...existingWidgets.map((w) => (w.gridY || 0) + (w.gridHeight || 2)))
      }

      // Default sizes based on widget type
      let gridWidth = 15 // 300px
      let gridHeight = 8 // 160px
      let minW = 2
      let minH = 1

      if (type === "barChart" || type === "lineChart") {
        gridWidth = 30 // 600px
        gridHeight = 15 // 300px
        minW = 4
        minH = 3
      } else if (type === "pieChart") {
        gridWidth = 15 // 300px
        gridHeight = 15 // 300px
        minW = 3
        minH = 3
      } else if (type === "table") {
        gridWidth = 30 // 600px
        gridHeight = 20 // 400px
        minW = 6
        minH = 4
      } else if (type === "dashboardCard") {
        gridWidth = 15 // 300px
        gridHeight = 8 // 160px
        minW = 3
        minH = 2
      }

      // Convert to pixels
      const x = 0
      const y = convertGridUnitsToPixels(maxGridY + 1) // Add 1 grid unit of spacing
      const width = convertGridUnitsToPixels(gridWidth)
      const height = convertGridUnitsToPixels(gridHeight)

      // Determine display mode based on data type
      const displayMode: "price" | "quantity" = [
        DataType.STOCK_VALUE,
        DataType.PROFIT,
        DataType.COST_OF_SALES,
        DataType.INVENTORY_VALUE,
        DataType.PROFIT_MARGIN,
      ].includes(initialDataType)
        ? "price"
        : "quantity"

      // Create the data series
      const dataSeries: DataSeries[] = [
        {
          dataType: initialDataType,
          displayMode,
          color: DEFAULT_DATA_COLORS[initialDataType] || "#4caf50",
          visible: true,
          label: initialDataType.charAt(0).toUpperCase() + initialDataType.slice(1).replace(/([A-Z])/g, " $1"),
        },
      ]

      // Map string type to WidgetType enum
      let widgetType: WidgetType
      const typeStr = type as string
      switch (typeStr) {
        case "stat":
          widgetType = WidgetType.STAT
          break
        case "barChart":
          widgetType = WidgetType.BAR_CHART
          break
        case "lineChart":
          widgetType = WidgetType.LINE_CHART
          break
        case "pieChart":
          widgetType = WidgetType.PIE_CHART
          break
        case "chart":
          widgetType = WidgetType.CHART
          break
        case "table":
          widgetType = WidgetType.TABLE
          break
        case "dashboardCard":
          widgetType = WidgetType.DASHBOARD_CARD
          break
        case "calculator":
          widgetType = WidgetType.CALCULATOR
          break
        default:
          widgetType = WidgetType.STAT
      }

      const newWidget: WidgetSettings = {
        id: uuidv4(),
        type: widgetType,
        title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        x,
        y,
        width,
        height,
        minW,
        minH,
        gridX: 0,
        gridY: maxGridY + 1,
        gridWidth,
        gridHeight,
        dataType: initialDataType,
        displayMode,
        dataSeries,
        colors: {
          background: "#ffffff",
          border: "#e0e0e0",
          text: "#333333",
          series: [DEFAULT_DATA_COLORS[initialDataType] || "#4caf50"],
        },
        visible: true,
      }

      setDashboardState((prevState: DashboardState) => {
        const updatedWidgets = [...prevState.widgets, newWidget]

        // Update container height
        updateContainerHeight(updatedWidgets)

        return {
          ...prevState,
          widgets: updatedWidgets,
        }
      })

      return newWidget.id
    },
    [dashboardState.widgets],
  )

  // Add helper functions for card types and icons
  const getCardTypeFromDataType = (dataType: DataType): "sales" | "inventory" | "alerts" | "performance" => {
    switch (dataType) {
      case DataType.SALES:
      case DataType.PROFIT:
      case DataType.PROFIT_MARGIN:
        return "sales"
      case DataType.STOCK_COUNT:
      case DataType.STOCK_VALUE:
      case DataType.INVENTORY_VALUE:
      case DataType.TOTAL_ITEMS:
        return "inventory"
      case DataType.LOW_STOCK_ITEMS:
      case DataType.STOCK_REORDER:
        return "alerts"
      default:
        return "performance"
    }
  }

  const getIconFromDataType = (dataType: DataType): string => {
    switch (dataType) {
      case DataType.SALES:
      case DataType.PROFIT:
      case DataType.PROFIT_MARGIN:
        return "mdi:cash-register"
      case DataType.STOCK_COUNT:
      case DataType.STOCK_VALUE:
      case DataType.INVENTORY_VALUE:
      case DataType.TOTAL_ITEMS:
        return "mdi:package-variant-closed"
      case DataType.LOW_STOCK_ITEMS:
      case DataType.STOCK_REORDER:
        return "mdi:alert-circle-outline"
      default:
        return "mdi:chart-line"
    }
  }

  const clearAllWidgets = () => {
    setDashboardState((prev) => ({
      ...prev,
      widgets: [],
    }))

    // Save the empty state to localStorage
    localStorage.setItem(
      "dashboardState",
      JSON.stringify({
        ...dashboardState,
        widgets: [],
      }),
    )
  }

  return {
    dashboardState,
    selectedWidgetId,
    setSelectedWidgetId,
    updateWidgetPosition,
    updateWidgetSize,
    updateWidgetSettings,
    removeWidget,
    addWidget,
    addDashboardCard,
    getWidgetSettings,
    resetDashboard,
    revertDashboard,
    addDataSeriesToWidget,
    removeDataSeriesFromWidget,
    createWidget,
    updateWidgetDataTypes,
    calculateContainerHeight,
    snapToGrid,
    snapSizeToGrid,
    gridToPosition,
    positionToGrid,
    checkWidgetOverlap,
    findValidPosition,
    clearAllWidgets,
  }
}

export { useWidgetManager }
export default useWidgetManager
