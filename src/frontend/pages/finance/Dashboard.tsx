"use client"

import React, { useState, useEffect, useCallback } from "react"
import { 
  Box, 
  Typography, 
  Button,
  useTheme,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  CircularProgress, 
  Alert, 
} from "@mui/material"
import { 
  Dashboard as DashboardIcon,
  TableChart as TableChartIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
} from "@mui/icons-material"
import { Rnd } from "react-rnd"
import { format, subDays, addDays, startOfMonth, startOfYear } from "date-fns"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"

import { useFinance } from "../../../backend/context/FinanceContext"
import { useCompany } from "../../../backend/context/CompanyContext"
import useWidgetManager from "../../hooks/useWidgetManager"
import WidgetContextMenu from "../../components/reusable/WidgetContextMenu"
import WidgetSettingsDialog from "../../components/reusable/WidgetSettingsDialog"
import DynamicWidget from "../../components/reusable/DynamicWidget"
import { DataType } from "../../types/WidgetTypes"
import DashboardHeader from "../../components/reusable/DashboardHeader"
import LocationPlaceholder from "../../components/common/LocationPlaceholder"

enum WidgetType {
  STAT = "stat",
  BAR_CHART = "barChart",
  LINE_CHART = "lineChart",
  PIE_CHART = "pieChart",
  TABLE = "table",
  DASHBOARD_CARD = "dashboardCard",
}

const GRID_CELL_SIZE = 20

const FinanceDashboard: React.FC = () => {
  const theme = useTheme()
  const { state: financeState, refreshAll } = useFinance()
  const { state: companyState, hasPermission } = useCompany()

  // Track if component has been initialized
  const isInitialized = React.useRef(false)

  // Memoize finance data snapshot
  const financeDataSnapshot = React.useMemo(
    () => ({
      invoices: financeState.invoices || [],
      bills: financeState.bills || [],
      expenses: financeState.expenses || [],
      bankAccounts: financeState.bankAccounts || [],
      contacts: financeState.contacts || [],
      transactions: financeState.transactions || [],
      budgets: financeState.budgets || [],
      accounts: financeState.accounts || [],
    }),
    [
      financeState.invoices?.length,
      financeState.bills?.length,
      financeState.expenses?.length,
      financeState.bankAccounts?.length,
      financeState.contacts?.length,
      financeState.transactions?.length,
      financeState.budgets?.length,
      financeState.accounts?.length,
    ]
  )

  // Dashboard widget state
  const [isEditing, setIsEditing] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [addWidgetOpen, setAddWidgetOpen] = useState(false)
  const [newWidgetType, setNewWidgetType] = useState<string>("stat")
  const [newWidgetDataType, setNewWidgetDataType] = useState<DataType>(DataType.TOTAL_ITEMS)
  const [selectedDateRange, setSelectedDateRange] = useState<string>("last30days")
  const [customDateDialogOpen, setCustomDateDialogOpen] = useState(false)
  const [clearWidgetsDialogOpen, setClearWidgetsDialogOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number
    mouseY: number
    widgetId: string
  } | null>(null)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState<boolean>(false)
  const [currentWidgetSettings, setCurrentWidgetSettings] = useState<any>(null)

  // Date range state
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date }>({
    startDate: subDays(new Date(), 30),
    endDate: addDays(new Date(), 30),
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
  } = useWidgetManager("finance")

  // Calculate container height
  const containerHeight = calculateContainerHeight()

  // Show location placeholder if no company selected
  if (!companyState.companyID) {
    return <LocationPlaceholder />
  }

  // Note: Finance data is loaded automatically by FinanceContext
  // Only refresh if data is missing (e.g., user navigated directly to this page)
  useEffect(() => {
    if (!isInitialized.current && companyState.companyID && financeState.basePath) {
      // Only refresh if we have a basePath but no data yet
      if (financeState.accounts.length === 0 && !financeState.loading) {
        refreshAll()
      }
      isInitialized.current = true
    }
  }, [companyState.companyID, financeState.basePath, financeState.accounts.length, financeState.loading, refreshAll])

  // Get data for widget based on its type
  const getWidgetData = useCallback(
    (widget: any) => {
      if (!widget || !widget.dataType) return { history: [] }

      const dataType = widget.dataType

      // Calculate metrics from finance data
      const totalRevenue = financeDataSnapshot.invoices
        .filter((inv) => inv.status === "paid")
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)

      const totalExpenses = financeDataSnapshot.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)

      const outstandingInvoices = financeDataSnapshot.invoices
        .filter((inv) => inv.status !== "paid" && inv.status !== "cancelled")
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)


      const totalBankBalance = financeDataSnapshot.bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)

      const profit = totalRevenue - totalExpenses
      const profitMargin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0

      // Budget variance
      const budgetedTotal = financeDataSnapshot.budgets.reduce((sum, b) => sum + (b.budgeted || 0), 0)
      const actualTotal = financeDataSnapshot.budgets.reduce((sum, b) => sum + (b.actual || 0), 0)
      const budgetVariance = budgetedTotal - actualTotal

      // Generate historical data
      const generateHistoricalData = (baseValue: number, _variationFactor: number = 0.1) => {
        const startDate = new Date(dateRange.startDate)
        const endDate = new Date(dateRange.endDate)
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

        let dataPoints: number
        let dateIncrement: number

        switch (frequency) {
          case "hourly":
            dataPoints = Math.min(daysDiff * 24, 168)
            dateIncrement = 1 / 24
            break
          case "daily":
            dataPoints = Math.min(daysDiff, 90)
            dateIncrement = 1
            break
          case "weekly":
            dataPoints = Math.min(Math.ceil(daysDiff / 7), 52)
            dateIncrement = 7
            break
          case "monthly":
            dataPoints = Math.min(Math.ceil(daysDiff / 30), 24)
            dateIncrement = 30
            break
          default:
            dataPoints = Math.min(daysDiff, 30)
            dateIncrement = 1
        }

        return Array.from({ length: dataPoints }).map((_, i) => {
          const currentDate = new Date(startDate.getTime() + i * dateIncrement * 24 * 60 * 60 * 1000)
          const date = format(currentDate, "yyyy-MM-dd")
          const variation = 0.9 + Math.random() * 0.2
          return {
            date,
            value: Math.max(0, Math.round(baseValue * variation)),
          }
        })
      }

      // Handle stat and dashboard card widgets
      if (widget.type === WidgetType.DASHBOARD_CARD || widget.type === WidgetType.STAT) {
        switch (dataType) {
          case DataType.TOTAL_ITEMS:
            return {
              totalItems: financeDataSnapshot.invoices.length,
              history: generateHistoricalData(financeDataSnapshot.invoices.length).map((item) => ({
                date: item.date,
                totalItems: { quantity: item.value },
              })),
            }
          case DataType.REVENUE:
            return {
              revenue: totalRevenue,
              history: generateHistoricalData(totalRevenue, 0.15).map((item) => ({
                date: item.date,
                revenue: { amount: item.value },
              })),
            }
          case DataType.EXPENSES:
            return {
              expenses: totalExpenses,
              history: generateHistoricalData(totalExpenses, 0.1).map((item) => ({
                date: item.date,
                expenses: { amount: item.value },
              })),
            }
          case DataType.PROFIT:
            return {
              profit: profit,
              history: generateHistoricalData(profit, 0.2).map((item) => ({
                date: item.date,
                profit: { amount: item.value },
              })),
            }
          case DataType.CASH_FLOW:
            return {
              cashFlow: totalBankBalance,
              history: generateHistoricalData(totalBankBalance, 0.12).map((item) => ({
                date: item.date,
                cashFlow: { amount: item.value },
              })),
            }
          case DataType.OUTSTANDING_INVOICES:
            return {
              outstandingInvoices: outstandingInvoices,
              history: generateHistoricalData(outstandingInvoices, 0.25).map((item) => ({
                date: item.date,
                outstandingInvoices: { amount: item.value },
              })),
            }
          case DataType.PROFIT_MARGIN:
            return {
              profitMargin: profitMargin,
              history: generateHistoricalData(profitMargin, 0.08).map((item) => ({
                date: item.date,
                profitMargin: { percentage: item.value },
              })),
            }
          case DataType.BUDGET_VARIANCE:
            return {
              budgetVariance: budgetVariance,
              history: generateHistoricalData(Math.abs(budgetVariance), 0.3).map((item) => ({
                date: item.date,
                budgetVariance: { amount: item.value * (budgetVariance < 0 ? -1 : 1) },
              })),
            }
        }
      }

      // For charts, provide the history data
      switch (dataType) {
        case DataType.TOTAL_ITEMS:
          return {
            history: generateHistoricalData(financeDataSnapshot.invoices.length).map((item) => ({
              date: item.date,
              totalItems: { quantity: item.value },
            })),
          }
        case DataType.REVENUE:
          return {
            history: generateHistoricalData(totalRevenue, 0.15).map((item) => ({
              date: item.date,
              revenue: { amount: item.value },
            })),
          }
        case DataType.EXPENSES:
          return {
            history: generateHistoricalData(totalExpenses, 0.1).map((item) => ({
              date: item.date,
              expenses: { amount: item.value },
            })),
          }
        case DataType.CASH_FLOW_ANALYSIS:
          return {
            history: generateHistoricalData(totalRevenue, 0.15).map((item) => ({
              date: item.date,
              cashFlow: {
                inflow: item.value,
                outflow: Math.round(item.value * 0.7),
                net: Math.round(item.value * 0.3),
              },
            })),
          }
        case DataType.REVENUE_BY_CUSTOMER:
          const customerRevenue = financeDataSnapshot.invoices.reduce((acc: Record<string, number>, inv) => {
            const customer = inv.customerName || "Unknown"
            acc[customer] = (acc[customer] || 0) + (inv.totalAmount || 0)
            return acc
          }, {} as Record<string, number>)

          return {
            data: Object.entries(customerRevenue)
              .map(([customer, amount]) => ({
                customer,
                amount,
                value: amount,
              }))
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 10),
          }
        case DataType.EXPENSE_BREAKDOWN:
          const expenseByCategory = financeDataSnapshot.expenses.reduce((acc: Record<string, number>, exp) => {
            const category = exp.category || "Other"
            acc[category] = (acc[category] || 0) + (exp.amount || 0)
            return acc
          }, {} as Record<string, number>)

          return {
            data: Object.entries(expenseByCategory).map(([category, amount]) => ({
              category,
              amount,
              value: amount,
            })),
          }
        case DataType.BUDGET_PERFORMANCE:
          return {
            data: financeDataSnapshot.budgets.map((budget) => ({
              category: budget.category,
              budgeted: budget.budgeted,
              actual: budget.actual,
              variance: budget.remaining,
              percentage: budget.percentage,
            })),
          }
        default:
          return { history: generateHistoricalData(totalRevenue) }
      }
    },
    [dateRange, frequency, financeDataSnapshot]
  )

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing)
  }

  // Handle revert - reload saved layout and exit edit mode without saving
  const handleRevert = async () => {
    console.log('Finance Dashboard: Reverting changes and exiting edit mode')
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
        return "Last 30 Days"
    }
  }

  const handleDateRangeChange = (range: string) => {
    setSelectedDateRange(range)

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
  }

  const handleFrequencyChange = (newFrequency: string) => {
    setFrequency(newFrequency)
  }

  const handleCustomDateApply = () => {
    setCustomDateDialogOpen(false)
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
    let widgetType: "stat" | "barChart" | "lineChart" | "pieChart" | "chart" | "table" | "dashboardCard" = "stat"

    switch (type) {
      case "stat":
      case "barChart":
      case "lineChart":
      case "pieChart":
      case "chart":
      case "table":
      case "dashboardCard":
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

  // Available data types for finance widgets
  const availableDataTypes = [
    { value: DataType.TOTAL_ITEMS, label: "Total Invoices" },
    { value: DataType.REVENUE, label: "Revenue" },
    { value: DataType.EXPENSES, label: "Expenses" },
    { value: DataType.PROFIT, label: "Profit" },
    { value: DataType.CASH_FLOW, label: "Cash Flow" },
    { value: DataType.OUTSTANDING_INVOICES, label: "Outstanding Invoices" },
    { value: DataType.PROFIT_MARGIN, label: "Profit Margin" },
    { value: DataType.BUDGET_VARIANCE, label: "Budget Variance" },
    { value: DataType.CASH_FLOW_ANALYSIS, label: "Cash Flow Analysis" },
    { value: DataType.REVENUE_BY_CUSTOMER, label: "Revenue by Customer" },
    { value: DataType.EXPENSE_BREAKDOWN, label: "Expense Breakdown" },
    { value: DataType.BUDGET_PERFORMANCE, label: "Budget Performance" },
  ]

  // Loading state
  if (financeState.loading) {
    return (
      <Box sx={{ p: 3, width: "100%" }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2, color: "text.secondary" }}>
            Loading finance data...
          </Typography>
        </Box>
      </Box>
    )
  }

  // Error state
  if (financeState.error) {
    return (
      <Box sx={{ p: 3, width: "100%" }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load finance data: {financeState.error}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Dashboard Header */}
      <DashboardHeader
        title="Finance Dashboard"
        subtitle="Finance Dashboard"
        canEdit={hasPermission("finance", "dashboard", "edit")}
        isEditing={isEditing}
        onToggleEdit={toggleEditMode}
        onClearWidgets={handleClearWidgets}
        onRevert={handleRevert}
        showGrid={showGrid}
        onToggleGrid={setShowGrid}
        menuItems={[
          {
            label: "Add Widget",
            onClick: () => setAddWidgetOpen(true),
            permission: hasPermission("finance", "dashboard", "edit"),
          },
        ]}
        dateRange={{
          value: selectedDateRange,
          label: getDateRangeLabel(),
          onChange: handleDateRangeChange,
        }}
        frequency={{
          value: frequency,
          options: ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"],
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
          backgroundColor: theme.palette.background.default,
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
        availableDataTypes={availableDataTypes}
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
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Data Type</InputLabel>
            <Select
              value={newWidgetDataType}
              label="Data Type"
              onChange={(e) => setNewWidgetDataType(e.target.value as DataType)}
            >
              {availableDataTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
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
    </Box>
  )
}

export default FinanceDashboard
