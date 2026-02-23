"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Box,
  Typography,
  Button,
  useTheme,
  MenuItem,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Paper,
  IconButton,
  CircularProgress,
} from "@mui/material"
import {
  Person,
  Group,
  Work,
  EventNote,
  Badge as BadgeIcon,
  Dashboard,
  Dashboard as DashboardIcon,
  TableChart as TableChartIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material"
import { useHR } from "../../backend/context/HRContext"
import { useCompany } from "../../backend/context/CompanyContext"
import { useBookings } from "../../backend/context/BookingsContext"
import { useNavigate, useLocation } from "react-router-dom"

// Import all HR components
import {
  EmployeeList,
  RoleManagement,
  ScheduleManager,
  FinalizeShifts,
  PayrollManagement,
  ServiceChargeAllocationPage,
  PerformanceReviewManagement,
  RecruitmentManagement,
  BenefitsManagement,
  WarningsTracking,
  ComplianceTracking,
  TimeOffManagement,
  AnnouncementsManagement,
  EmployeeSelfService,
  DepartmentManagement,
  EventsManagement,
  HRReportsDashboard,
  HMRCSubmissionHistoryReport,
  DiversityInclusion,
  ExpensesManagement,
  ContractsManagement,
} from "../components/hr/index"
import HRSettings from "../components/hr/Settings"

// Import date-fns
import { format, subDays, addDays, startOfMonth, startOfYear } from "date-fns"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"

// Import Rnd for resizable and draggable components
import { Rnd } from "react-rnd"

// Import custom hooks and components for widget management
import useWidgetManager from "../hooks/useWidgetManager"
import WidgetContextMenu from "../components/reusable/WidgetContextMenu"
import WidgetSettingsDialog from "../components/reusable/WidgetSettingsDialog"
import DynamicWidget from "../components/reusable/DynamicWidget"
import { DataType } from "../types/WidgetTypes"
import DashboardHeader from "../components/reusable/DashboardHeader"

// Define enums and constants
enum WidgetType {
  STAT = "stat",
  BAR_CHART = "barChart",
  LINE_CHART = "lineChart",
  PIE_CHART = "pieChart",
  TABLE = "table",
  DASHBOARD_CARD = "dashboardCard",
}


// Define the GRID_CELL_SIZE constant
const GRID_CELL_SIZE = 20

const HR = () => {
  const theme = useTheme()
  const { state: hrState, refreshEmployees, refreshDepartments, refreshRoles, refreshTrainings, refreshAttendances, refreshPayrolls, refreshPerformanceReviews } = useHR()
  const { state: companyState, hasPermission } = useCompany()
  const { bookings, bookingSettings, initialized: bookingsInitialized } = useBookings()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Track if component has been initialized to prevent duplicate renders
  const isInitialized = React.useRef(false)
  const hasTriggeredRefresh = React.useRef<string | null>(null) // Track which company we've refreshed for
  
  // Check if providers are actually available (not just initialized)
  // Providers return empty context when not loaded, so we check if we have a real provider
  const hrProviderAvailable = hrState !== undefined && (hrState.initialized !== undefined || hrState.employees !== undefined)
  const bookingsProviderAvailable = bookingsInitialized !== undefined || bookings !== undefined
  
  // Trigger data refresh only once when component mounts or company changes
  // This ensures data is loaded even if the HRContext thinks it's already loaded
  useEffect(() => {
    // Only trigger if we have a company context
    if (!companyState.companyID || !hrProviderAvailable) {
      return
    }
    
    // Skip if we've already refreshed for this company
    if (hasTriggeredRefresh.current === companyState.companyID) {
      return
    }
    
    // Only check once - if initialized but no data, trigger refresh
    // Use a timeout to ensure this only runs once after mount
    const timeoutId = setTimeout(() => {
      // Check if data is empty
      const hasNoData = !hrState.employees?.length && 
                        !hrState.departments?.length && 
                        !hrState.roles?.length &&
                        hrState.initialized &&
                        !hrState.isLoading
      
      // Only trigger refresh if data is empty
      if (hasNoData) {
        hasTriggeredRefresh.current = companyState.companyID
        
        // Trigger refresh of all HR data when navigating to HR section
        const refreshHRData = async () => {
          try {
            console.log('🔄 HR: Triggering data refresh on navigation...')
            await Promise.all([
              refreshEmployees().catch(err => console.warn('Failed to refresh employees:', err)),
              refreshDepartments().catch(err => console.warn('Failed to refresh departments:', err)),
              refreshRoles().catch(err => console.warn('Failed to refresh roles:', err)),
              refreshTrainings().catch(err => console.warn('Failed to refresh trainings:', err)),
              refreshAttendances().catch(err => console.warn('Failed to refresh attendances:', err)),
              refreshPayrolls().catch(err => console.warn('Failed to refresh payrolls:', err)),
              refreshPerformanceReviews().catch(err => console.warn('Failed to refresh performance reviews:', err)),
            ])
            console.log('✅ HR: Data refreshed on navigation')
          } catch (error) {
            console.error('Error refreshing HR data:', error)
          }
        }
        
        refreshHRData()
      } else {
        // If we have data, mark as refreshed for this company
        hasTriggeredRefresh.current = companyState.companyID
      }
    }, 100) // Small delay to ensure state is stable
    
    return () => clearTimeout(timeoutId)
  }, [companyState.companyID, hrProviderAvailable]) // Only depend on company ID and provider availability
  
  // Wait for HR and Bookings providers to be available before rendering
  // Allow rendering even if not fully initialized (empty state is valid)
  // Only show loading if providers aren't loaded at all
  if (!hrProviderAvailable || !bookingsProviderAvailable) {
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
          Loading HR module...
        </Typography>
      </Box>
    )
  }
  
  // Memoize HR data to prevent unnecessary re-renders
  const hrDataSnapshot = React.useMemo(() => ({
    employees: hrState.employees || [],
    departments: hrState.departments || [],
    trainings: hrState.trainings || [],
    attendances: hrState.attendances || [],
    performanceReviews: hrState.performanceReviews || [],
    payrollRecords: hrState.payrollRecords || [],
    jobPostings: hrState.jobPostings || [],
  }), [
    hrState.employees?.length,
    hrState.departments?.length,
    hrState.trainings?.length,
    hrState.attendances?.length,
    hrState.performanceReviews?.length,
    hrState.payrollRecords?.length,
    hrState.jobPostings?.length,
  ])
  
  // Debug logging for business hours (only log once after initialization)
  React.useEffect(() => {
    if (!isInitialized.current && hrState.employees?.length > 0) {
      console.log("HR Page - BookingsContext data:", {
        bookings: bookings?.length || 0,
        bookingSettings: bookingSettings,
        businessHours: bookingSettings?.businessHours
      })
      console.log("HR Page - HR data loaded:", {
        employees: hrState.employees?.length,
        departments: hrState.departments?.length,
        roles: hrState.roles?.length,
      })
      isInitialized.current = true
    }
  }, [hrState.employees?.length, hrState.departments?.length, bookings?.length])

  // All hooks must be called before any conditional returns
  const [activeTab, setActiveTab] = useState(0)
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null)
  const [isTabsExpanded, setIsTabsExpanded] = useState(true)
  

  // Dashboard widget state - moved from renderDashboard to top level
  const [isEditing, setIsEditing] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [addWidgetOpen, setAddWidgetOpen] = useState(false)
  const [newWidgetType, setNewWidgetType] = useState<string>("stat")
  const [newWidgetDataType, setNewWidgetDataType] = useState<DataType>(DataType.TOTAL_ITEMS)
  const [selectedDateRange, setSelectedDateRange] = useState<string>("last7days")
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
    startDate: subDays(new Date(), 30), // Last 30 days for broader view
    endDate: addDays(new Date(), 30), // Next 30 days for broader view
  })
  const [frequency, setFrequency] = useState<string>("daily")

  // Widget management - MUST be called before any conditional returns
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
  } = useWidgetManager('hr')

  // Calculate container height based on widget positions
  const containerHeight = calculateContainerHeight()

  // Get data for widget based on its type - using HR context data
  const getWidgetData = useCallback((widget: any) => {
    if (!widget || !widget.dataType) return { history: [] }

    const dataType = widget.dataType
    console.log('HR Dashboard: Getting data for:', dataType, 'Employees:', hrDataSnapshot.employees.length, 'Departments:', hrDataSnapshot.departments.length)

    // Calculate metrics from memoized HR data snapshot
    const totalEmployees = hrDataSnapshot.employees.length
    const averageTrainingCompletion = hrDataSnapshot.trainings.length
      ? Math.round(
          (hrDataSnapshot.trainings.filter((t: any) => t.status === 'completed').length / hrDataSnapshot.trainings.length) * 100
        )
      : 0
    const averagePerformanceScore = hrDataSnapshot.performanceReviews.length
      ? Math.round(
          hrDataSnapshot.performanceReviews.reduce((acc: number, review: any) => acc + (review.overallScore || 0), 0) /
            hrDataSnapshot.performanceReviews.length,
        )
      : 0
    const attendanceRate = hrDataSnapshot.attendances.length
      ? Math.round(
          (hrDataSnapshot.attendances.filter((record: any) => record.status === "present").length /
            hrDataSnapshot.attendances.length) *
            100,
        )
      : 0

    // Generate historical data based on date range and frequency
    const generateHistoricalData = (baseValue: number, _variationFactor: number = 0.1) => {
      const startDate = new Date(dateRange.startDate)
      const endDate = new Date(dateRange.endDate)
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      let dataPoints: number
      let dateIncrement: number
      
      switch (frequency) {
        case "hourly":
          dataPoints = Math.min(daysDiff * 24, 168) // Max 1 week of hourly data
          dateIncrement = 1 / 24
          break
        case "daily":
          dataPoints = Math.min(daysDiff, 90) // Max 90 days
          dateIncrement = 1
          break
        case "weekly":
          dataPoints = Math.min(Math.ceil(daysDiff / 7), 52) // Max 52 weeks
          dateIncrement = 7
          break
        case "monthly":
          dataPoints = Math.min(Math.ceil(daysDiff / 30), 24) // Max 24 months
          dateIncrement = 30
          break
        case "quarterly":
          dataPoints = Math.min(Math.ceil(daysDiff / 90), 8) // Max 8 quarters (2 years)
          dateIncrement = 90
          break
        case "yearly":
          dataPoints = Math.min(Math.ceil(daysDiff / 365), 5) // Max 5 years
          dateIncrement = 365
          break
        default:
          dataPoints = Math.min(daysDiff, 30) // Default to 30 days max
          dateIncrement = 1
      }
      
      return Array.from({ length: dataPoints }).map((_, i) => {
        const currentDate = new Date(startDate.getTime() + (i * dateIncrement * 24 * 60 * 60 * 1000))
        const date = format(currentDate, "yyyy-MM-dd")
        const variation = 0.9 + Math.random() * 0.2 // ±10% variation for more realistic data
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
            totalItems: totalEmployees,
            history: generateHistoricalData(totalEmployees).map((item) => ({
              date: item.date,
              totalItems: { quantity: item.value },
            })),
          }
        case DataType.ATTENDANCE:
          return {
            attendanceRate: attendanceRate,
            history: generateHistoricalData(attendanceRate, 0.05).map((item) => ({
              date: item.date,
              attendance: { rate: item.value },
            })),
          }
        case DataType.PERFORMANCE:
          return {
            performanceScore: averagePerformanceScore,
            history: generateHistoricalData(averagePerformanceScore, 0.1).map((item) => ({
              date: item.date,
              performance: { score: item.value },
            })),
          }
        case DataType.TURNOVER:
          const turnoverRate = hrDataSnapshot.employees.length
            ? Math.round(
                (hrDataSnapshot.employees.filter((e: any) => e.status === "terminated").length / hrDataSnapshot.employees.length) * 100,
              )
            : 0
          return {
            turnoverRate: turnoverRate,
            history: generateHistoricalData(turnoverRate, 0.2).map((item) => ({
              date: item.date,
              turnover: { rate: item.value },
            })),
          }
        case DataType.RECRUITMENT:
          const avgTimeToHire = hrDataSnapshot.jobPostings.length
            ? Math.round(
                hrDataSnapshot.jobPostings.reduce((acc: number, job: any) => acc + (job.daysToFill || 21), 0) / hrDataSnapshot.jobPostings.length,
              )
            : 21
          return {
            timeToHire: avgTimeToHire,
            history: generateHistoricalData(15, 0.3).map((item) => ({
              date: item.date,
              recruitment: { timeToHire: item.value },
            })),
          }
        case DataType.TRAINING:
          return {
            trainingCompletion: averageTrainingCompletion,
            history: generateHistoricalData(averageTrainingCompletion, 0.1).map((item) => ({
              date: item.date,
              training: { completion: item.value },
            })),
          }
        case DataType.PAYROLL:
          const totalPayroll = hrDataSnapshot.payrollRecords.reduce((acc: number, record: any) => acc + (record.grossPay || 0), 0) || 45000
          return {
            payrollCost: totalPayroll,
            history: generateHistoricalData(totalPayroll, 0.05).map((item) => ({
              date: item.date,
              payroll: { cost: item.value },
            })),
          }
      }
    }

    // For charts, provide the history data
    switch (dataType) {
      case DataType.TOTAL_ITEMS:
        return {
          history: generateHistoricalData(totalEmployees).map((item) => ({
            date: item.date,
            totalItems: { quantity: item.value },
          })),
        }
      case DataType.ATTENDANCE:
        return {
          history: generateHistoricalData(20, 0.2).map((item) => ({
            date: item.date,
            attendance: {
              present: item.value,
              absent: Math.max(0, 25 - item.value),
              late: Math.floor(Math.random() * 3),
            },
          })),
        }
      case DataType.PERFORMANCE:
        return {
          history: generateHistoricalData(averagePerformanceScore, 0.1).map((item) => ({
            date: item.date,
            performance: { score: item.value },
          })),
        }
      case DataType.RECRUITMENT:
        return {
          history: generateHistoricalData(15, 0.3).map((item) => ({
            date: item.date,
            recruitment: {
              applicants: item.value,
              hired: Math.floor(item.value * 0.2),
            },
          })),
        }
        case DataType.DEPARTMENTS:
        case DataType.EMPLOYEES_BY_DEPARTMENT:
          return {
            data: hrDataSnapshot.departments.map((dept: any) => ({
              department: dept.name,
              employees: hrDataSnapshot.employees.filter((emp: any) => 
                emp.departmentId === dept.id || emp.department === dept.name || emp.department === dept.id
              ).length,
              value: hrDataSnapshot.employees.filter((emp: any) => 
                emp.departmentId === dept.id || emp.department === dept.name || emp.department === dept.id
              ).length
            })),
            history: generateHistoricalData(totalEmployees).map((item) => ({
              date: item.date,
              departments: { employees: item.value },
            })),
          }
        case DataType.ATTENDANCE_TRENDS:
          return {
            history: generateHistoricalData(attendanceRate, 0.05).map((item) => ({
              date: item.date,
              attendanceTrends: { rate: item.value },
            })),
          }
        case DataType.PERFORMANCE_METRICS:
          return {
            history: generateHistoricalData(averagePerformanceScore, 0.1).map((item) => ({
              date: item.date,
              performanceMetrics: { score: item.value },
            })),
          }
        case DataType.TRAINING_PROGRESS:
          return {
            history: generateHistoricalData(averageTrainingCompletion, 0.1).map((item) => ({
              date: item.date,
              trainingProgress: { completion: item.value },
            })),
          }
        case DataType.PAYROLL_BREAKDOWN:
          const payrollBreakdown = hrDataSnapshot.payrollRecords.reduce((acc: Record<string, number>, record: any) => {
            const department = hrDataSnapshot.employees.find((emp: any) => emp.id === record.employeeId)?.department || 'Unknown'
            acc[department] = (acc[department] || 0) + (record.grossPay || 0)
            return acc
          }, {} as Record<string, number>)
          
          return {
            data: Object.entries(payrollBreakdown).map(([department, amount]) => ({
              department,
              amount,
              value: amount,
              count: hrDataSnapshot.employees.filter((emp: any) => emp.department === department).length
            })),
            history: generateHistoricalData(45000, 0.05).map((item) => ({
              date: item.date,
              payrollBreakdown: { cost: item.value },
            })),
          }
        case DataType.TIME_OFF_REQUESTS:
          return {
            history: generateHistoricalData(5, 0.3).map((item) => ({
              date: item.date,
              timeOffRequests: { count: item.value },
            })),
          }
        case DataType.RECRUITMENT_FUNNEL:
          return {
            history: generateHistoricalData(15, 0.3).map((item) => ({
              date: item.date,
              recruitmentFunnel: { applicants: item.value },
            })),
          }
        case DataType.TURNOVER_ANALYSIS:
          const turnoverRateForAnalysis = hrDataSnapshot.employees.length
            ? Math.round(
                (hrDataSnapshot.employees.filter((e: any) => e.status === "terminated").length / hrDataSnapshot.employees.length) * 100,
              )
            : 0
          return {
            history: generateHistoricalData(turnoverRateForAnalysis, 0.2).map((item) => ({
              date: item.date,
              turnoverAnalysis: { rate: item.value },
            })),
          }
      default:
        return { history: generateHistoricalData(totalEmployees) }
    }
  }, [
    dateRange, 
    frequency, 
    hrDataSnapshot
  ])

  // Default dashboard setup is now handled by useWidgetManager with section-specific layouts

  // Define main navigation categories with permission checks
  const mainCategories = [
    {
      id: 0,
      label: "Dashboard",
      slug: "dashboard",
      icon: <Dashboard />,
      component: null, // Dashboard is handled separately
      permission: hasPermission("hr", "dashboard", "view"),
    },
    {
      id: 1,
      label: "Employees",
      slug: "employees",
      icon: <Person />,
      component: <EmployeeList />,
      permission: hasPermission("hr", "employees", "view"),
    },
    {
      id: 2,
      label: "Scheduling",
      slug: "scheduling",
      icon: <EventNote />,
      component: <ScheduleManager 
        dateRange={dateRange} 
        bookingsData={bookings} 
        businessHours={bookingSettings?.businessHours} 
      />,
      permission: hasPermission("hr", "scheduling", "view"),
      subTabs: [
        {
          id: "schedule-manager",
          label: "Rota",
          component: <ScheduleManager 
            dateRange={dateRange} 
            bookingsData={bookings} 
            businessHours={bookingSettings?.businessHours} 
          />,
          permission: hasPermission("hr", "scheduling", "view"),
        },
        {
          id: "finalize-shifts",
          label: "Finalize Shifts",
          component: <FinalizeShifts />,
          permission: hasPermission("hr", "scheduling", "view"),
        },
      ],
    },
    {
      id: 3,
      label: "Time Off",
      slug: "time-off",
      icon: <BadgeIcon />,
      component: <TimeOffManagement />,
      permission: hasPermission("hr", "timeoff", "view"),
    },
    {
      id: 4,
      label: "Payroll",
      slug: "payroll",
      icon: <Work />,
      component: <PayrollManagement />,
      permission: hasPermission("hr", "payroll", "view"),
      subTabs: [
        {
          id: "payroll-management",
          label: "Payroll Management",
          component: <PayrollManagement />,
          permission: hasPermission("hr", "payroll", "view"),
        },
        {
          id: "service-charge",
          label: "Service Charge Allocation",
          component: <ServiceChargeAllocationPage />,
          permission: hasPermission("hr", "payroll", "view"),
        },
      ],
    },
    {
      id: 5,
      label: "Self Service",
      slug: "self-service",
      icon: <BadgeIcon />,
      component: <EmployeeSelfService />,
      permission: hasPermission("hr", "selfservice", "view"),
    },
    {
      id: 6,
      label: "Management",
      slug: "management",
      icon: <Group />,
      permission:
        hasPermission("hr", "performance", "view") ||
        hasPermission("hr", "recruitment", "view") ||
        hasPermission("hr", "roles", "view") ||
        hasPermission("hr", "departments", "view") ||
        hasPermission("hr", "announcements", "view") ||
        hasPermission("hr", "benefits", "view") ||
        hasPermission("hr", "expenses", "view") ||
        hasPermission("hr", "compliance", "view"),
      subTabs: [
        {
          id: "contracts",
          label: "Contracts",
          component: <ContractsManagement />,
          permission: hasPermission("hr", "employees", "view"),
        },
        {
          id: "performance",
          label: "Staff Performance",
          component: <PerformanceReviewManagement />,
          permission: hasPermission("hr", "performance", "view"),
        },
        {
          id: "recruitment",
          label: "Recruitment",
          component: <RecruitmentManagement />,
          permission: hasPermission("hr", "recruitment", "view"),
        },
        {
          id: "warnings",
          label: "Warnings",
          component: <WarningsTracking />,
          permission: hasPermission("hr", "warnings", "view"),
        },
        {
          id: "roles",
          label: "Roles",
          component: <RoleManagement />,
          permission: hasPermission("hr", "roles", "view"),
        },
        {
          id: "departments",
          label: "Departments",
          component: <DepartmentManagement />,
          permission: hasPermission("hr", "departments", "view"),
        },
        {
          id: "announcements",
          label: "Announcements",
          component: <AnnouncementsManagement />,
          permission: hasPermission("hr", "announcements", "view"),
        },
        {
          id: "benefits",
          label: "Benefits",
          component: <BenefitsManagement />,
          permission: hasPermission("hr", "benefits", "view"),
        },
        {
          id: "expenses",
          label: "Expenses",
          component: <ExpensesManagement />,
          permission: hasPermission("hr", "expenses", "view"),
        },
        {
          id: "risk",
          label: "Risk & Compliance",
          component: <ComplianceTracking />,
          permission: hasPermission("hr", "compliance", "view"),
        },
        {
          id: "events",
          label: "Events",
          component: <EventsManagement />,
          permission: hasPermission("hr", "events", "view"),
        },
        {
          id: "diversity",
          label: "Diversity & Inclusion",
          component: <DiversityInclusion />,
          permission: hasPermission("hr", "diversity", "view"),
        },
      ],
    },
    {
      id: 7,
      label: "Reports",
      slug: "reports",
      icon: <BarChartIcon />,
      component: <HRReportsDashboard />,
      permission: hasPermission("hr", "reports", "view"),
    },
    {
      id: 8,
      label: "Settings",
      slug: "settings",
      icon: <SettingsIcon />,
      component: <HRSettings />,
      permission: hasPermission("hr", "settings", "edit"),
    },
  ]

  // Memoize visibleCategories to prevent unnecessary re-renders
  const memoizedVisibleCategories = React.useMemo(() => {
    return mainCategories
      .filter((category) => category.permission)
      .map((category) => ({
        ...category,
        subTabs: category.subTabs?.filter((subTab) => subTab.permission),
      }))
  }, [mainCategories])

  // Use memoized visible categories
  const visibleCategories = memoizedVisibleCategories

  useEffect(() => {
    if (activeTab >= visibleCategories.length) {
      setActiveTab(0)
    }
  }, [visibleCategories.length, activeTab])

  // Initialize activeSubTab when component mounts or when activeTab changes
  const initializeActiveSubTab = () => {
    // Make sure activeTab is valid and the tab exists
    const currentTab = visibleCategories[activeTab]
    // If the current tab has subtabs, ensure activeSubTab is set to a valid value
    if (currentTab && currentTab.subTabs && currentTab.subTabs.length > 0) {
      // If activeSubTab is null or doesn't match any available subtab, set it to the first subtab
      const availableSubTabs = currentTab.subTabs.map((tab) => tab.id)
      if (!activeSubTab || !availableSubTabs.includes(activeSubTab)) {
        setActiveSubTab(availableSubTabs[0])
      }
    } else {
      // If the current tab doesn't have subtabs, reset activeSubTab to null
      setActiveSubTab(null)
    }
  }

  // Initialize activeSubTab when component mounts or when activeTab changes (optimized)
  useEffect(() => {
    initializeActiveSubTab()
  }, [activeTab]) // Remove excessive dependencies

  useEffect(() => {
    if (!visibleCategories.length) {
      return
    }

    const pathWithoutTrailingSlash = location.pathname.replace(/\/+$/, "")
    const pathSegments = pathWithoutTrailingSlash.split("/").filter(Boolean)
    const hrIndex = pathSegments.findIndex((segment) => segment === "HR" || segment === "hr")
    const tabSegment = hrIndex !== -1 ? pathSegments[hrIndex + 1] : undefined
    const subTabSegment = hrIndex !== -1 ? pathSegments[hrIndex + 2] : undefined

    const slugToPascalPath = (slug: string) => {
      return slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("")
    }

    const getCategoryPath = (category: any, subTabId?: string | null) => {
      if (!category) {
        return null
      }
      if (category.subTabs && category.subTabs.length > 0) {
        const slug = subTabId ?? category.subTabs[0]?.id
        if (slug) {
          return `/HR/${slugToPascalPath(category.slug)}/${slugToPascalPath(slug)}`
        }
      }
      return `/HR/${slugToPascalPath(category.slug)}`
    }

    const defaultCategory = visibleCategories[0]
    const defaultPath = getCategoryPath(defaultCategory)

    if (!tabSegment) {
      if (defaultPath && location.pathname !== defaultPath) {
        navigate(defaultPath, { replace: true })
      }
      if (activeTab !== 0) {
        setActiveTab(0)
      }
      if (defaultCategory?.subTabs?.length) {
        const firstSub = defaultCategory.subTabs[0]?.id ?? null
        if (activeSubTab !== firstSub) {
          setActiveSubTab(firstSub)
        }
      } else if (activeSubTab !== null) {
        setActiveSubTab(null)
      }
      return
    }

    // Match category by slug, handling both PascalCase paths and lowercase slugs
    const matchedIndex = visibleCategories.findIndex((category) => {
      const pascalSlug = slugToPascalPath(category.slug)
      return category.slug === tabSegment || pascalSlug === tabSegment || tabSegment?.toLowerCase() === category.slug
    })
    if (matchedIndex === -1) {
      if (defaultPath && location.pathname !== defaultPath) {
        navigate(defaultPath, { replace: true })
      }
      if (activeTab !== 0) {
        setActiveTab(0)
      }
      if (defaultCategory?.subTabs?.length) {
        const firstSub = defaultCategory.subTabs[0]?.id ?? null
        if (activeSubTab !== firstSub) {
          setActiveSubTab(firstSub)
        }
      } else if (activeSubTab !== null) {
        setActiveSubTab(null)
      }
      return
    }

    if (matchedIndex !== activeTab) {
      setActiveTab(matchedIndex)
    }

    const matchedCategory = visibleCategories[matchedIndex]
    if (matchedCategory.subTabs && matchedCategory.subTabs.length > 0) {
      if (!subTabSegment) {
        const firstSub = matchedCategory.subTabs[0]?.id ?? null
        const targetPath = getCategoryPath(matchedCategory, firstSub)
        if (targetPath && location.pathname !== targetPath) {
          navigate(targetPath, { replace: true })
        }
        if (activeSubTab !== firstSub) {
          setActiveSubTab(firstSub)
        }
        return
      }

      // Match subTab by id, handling both PascalCase paths and lowercase ids
      const matchedSub = matchedCategory.subTabs.find((subTab: any) => {
        const pascalId = slugToPascalPath(subTab.id)
        return subTab.id === subTabSegment || pascalId === subTabSegment || subTabSegment?.toLowerCase() === subTab.id
      })
      if (!matchedSub) {
        const firstSub = matchedCategory.subTabs[0]?.id ?? null
        const targetPath = getCategoryPath(matchedCategory, firstSub)
        if (targetPath && location.pathname !== targetPath) {
          navigate(targetPath, { replace: true })
        }
        if (activeSubTab !== firstSub) {
          setActiveSubTab(firstSub)
        }
        return
      }

      if (activeSubTab !== matchedSub.id) {
        setActiveSubTab(matchedSub.id)
      }
    } else {
      if (activeSubTab !== null) {
        setActiveSubTab(null)
      }
      if (subTabSegment) {
        const targetPath = getCategoryPath(matchedCategory)
        if (targetPath && location.pathname !== targetPath) {
          navigate(targetPath, { replace: true })
        }
      }
    }
  }, [activeSubTab, activeTab, location.pathname, navigate, visibleCategories])

  // Log site/subsite changes only when they actually change
  useEffect(() => {
    if (companyState.companyID && companyState.selectedSiteID) {
      if (companyState.selectedSubsiteID) {
        console.log(`Loading data for subsite: ${companyState.selectedSubsiteID}`)
      } else {
        console.log(`Loading data for site: ${companyState.selectedSiteID}`)
      }
    }
  }, [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID]) // Remove activeTab dependency

  // Show message if no company/site selected - check after all hooks
  if (!companyState.companyID) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          p: 3,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Human Resources
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Please select a company to access HR data.
        </Typography>
      </Box>
    )
  }

  // Show message if no categories are visible due to permissions
  if (visibleCategories.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          p: 3,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Access Restricted
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          You don't have permission to access any HR features. Please contact your administrator.
        </Typography>
      </Box>
    )
  }

  

  const handleTabChange = (newTab: number) => {
    const selectedCategory = visibleCategories[newTab]
    if (!selectedCategory) {
      return
    }

    setActiveTab(newTab)

    if (selectedCategory.subTabs && selectedCategory.subTabs.length > 0) {
      const firstSubTab = selectedCategory.subTabs[0]?.id ?? null
      setActiveSubTab(firstSubTab)
      const slugToPascalPath = (slug: string) => {
        return slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("-")
      }
      const targetPath =
        firstSubTab !== null 
          ? `/HR/${slugToPascalPath(selectedCategory.slug)}/${slugToPascalPath(firstSubTab)}` 
          : `/HR/${slugToPascalPath(selectedCategory.slug)}`
      if (location.pathname !== targetPath) {
        navigate(targetPath)
      }
    } else {
      setActiveSubTab(null)
      const slugToPascalPath = (slug: string) => {
        return slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("-")
      }
      const targetPath = `/HR/${slugToPascalPath(selectedCategory.slug)}`
      if (location.pathname !== targetPath) {
        navigate(targetPath)
      }
    }
  }

  const handleSubTabChange = (_event: React.SyntheticEvent, newSubTab: string) => {
    setActiveSubTab(newSubTab)
    const currentCategory = visibleCategories[activeTab]
    if (!currentCategory) {
      return
    }

    const slugToPascalPath = (slug: string) => {
      return slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("")
    }
    const targetPath = `/HR/${slugToPascalPath(currentCategory.slug)}/${slugToPascalPath(newSubTab)}`
    if (location.pathname !== targetPath) {
      navigate(targetPath)
    }
  }

  const toggleTabsExpanded = () => {
    setIsTabsExpanded(!isTabsExpanded)
  }

  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    if (isEditing) {
      // When exiting edit mode, the layout is automatically saved via useWidgetManager's useEffect
      console.log('HR Dashboard: Exiting edit mode - layout will be saved automatically')
    } else {
      console.log('HR Dashboard: Entering edit mode')
    }
    setIsEditing(!isEditing)
  }, [isEditing])

  // Handle revert - reload saved layout and exit edit mode without saving
  const handleRevert = useCallback(async () => {
    console.log('HR Dashboard: Reverting changes and exiting edit mode')
    await revertDashboard()
    setIsEditing(false)
  }, [revertDashboard])

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
    console.log('HR Dashboard: Date range changed to:', range)
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

    console.log('HR Dashboard: New date range:', { start, end })
    setDateRange({ startDate: start, endDate: end })
  }

  const handleFrequencyChange = (newFrequency: string) => {
    console.log('HR Dashboard: Frequency changed to:', newFrequency)
    setFrequency(newFrequency)
    // Force widget data refresh by updating a dependency
  }

  const handleCustomDateApply = () => {
    console.log('HR Dashboard: Custom date range applied:', dateRange)
    setCustomDateDialogOpen(false)
    // The dateRange state is already updated via the DatePicker onChange handlers
    // This will trigger widget data refresh via the getWidgetData dependency
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

  // Available data types for widgets
  const availableDataTypes = [
    { value: DataType.TOTAL_ITEMS, label: "Total Employees" },
    { value: DataType.ATTENDANCE, label: "Attendance" },
    { value: DataType.PERFORMANCE, label: "Performance" },
    { value: DataType.TURNOVER, label: "Turnover" },
    { value: DataType.RECRUITMENT, label: "Recruitment" },
    { value: DataType.TRAINING, label: "Training" },
    { value: DataType.PAYROLL, label: "Payroll" },
    { value: DataType.DEPARTMENTS, label: "Departments" },
    { value: DataType.EMPLOYEES_BY_DEPARTMENT, label: "Employees by Department" },
    { value: DataType.ATTENDANCE_TRENDS, label: "Attendance Trends" },
    { value: DataType.PERFORMANCE_METRICS, label: "Performance Metrics" },
    { value: DataType.TRAINING_PROGRESS, label: "Training Progress" },
    { value: DataType.PAYROLL_BREAKDOWN, label: "Payroll Breakdown" },
    { value: DataType.TIME_OFF_REQUESTS, label: "Time Off Requests" },
    { value: DataType.RECRUITMENT_FUNNEL, label: "Recruitment Funnel" },
    { value: DataType.TURNOVER_ANALYSIS, label: "Turnover Analysis" },
  ]

  // Side navigation removed in favor of top horizontal tabs

  // Render the dashboard content
  const renderDashboard = () => {
    return (
      <Box sx={{ width: "100%" }}>
        {/* Dashboard Header */}
        <DashboardHeader
          title="Human Resources Dashboard"
          subtitle="HR Dashboad"
          canEdit={hasPermission("hr", "dashboard", "edit")}
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
              permission: hasPermission("hr", "dashboard", "edit"),
            },
            {
              label: "Add Employee",
              onClick: () => handleTabChange(1),
              permission: hasPermission("hr", "employees", "edit"),
            },
            {
              label: "Schedule Shift",
              onClick: () => handleTabChange(2),
              permission: hasPermission("hr", "scheduling", "edit"),
            },
            {
              label: "Add Announcement",
              onClick: () => handleTabChange(4),
              permission: hasPermission("hr", "announcements", "edit"),
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
            border: isEditing ? "1px dashed" : "none",
            borderColor: "divider",
            borderRadius: 2,
            p: 2,
            backgroundColor: "transparent",
            backgroundImage: showGrid
              ? `linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), 
               linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)`
              : "none",
            backgroundSize: `${GRID_CELL_SIZE}px ${GRID_CELL_SIZE}px`,
            backgroundPosition: "0 0",
            overflow: "visible",
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
                overflow: "visible", // Changed to visible to ensure content isn't cut off
                zIndex: selectedWidgetId === widget.id ? 1000 : 1,
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

  // Main layout (Top horizontal tabs like Bookings)
  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 64px)",
        overflow: "hidden",
        m: 0,
        mt: isTabsExpanded ? 0 : -3,
        p: 0,
        transition: "margin 0.3s ease",
      }}
    >
      {isTabsExpanded && (
        <Paper 
          sx={{ 
            borderBottom: 1, 
            borderColor: "divider", 
            bgcolor: "primary.main", 
            color: "primary.contrastText",
            m: 0,
            p: 0,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_e, val: number) => handleTabChange(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 2,
              "& .MuiTab-root": {
                color: "primary.contrastText",
                opacity: 0.7,
                "&.Mui-selected": {
                  color: "primary.contrastText",
                  opacity: 1,
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "primary.contrastText",
              },
            }}
          >
            {visibleCategories.map((category) => (
              <Tab key={category.id} icon={category.icon} label={category.label} />
            ))}
          </Tabs>
        </Paper>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "background.paper",
          m: 0,
          p: 0,
          lineHeight: 0,
        }}
      >
        <IconButton
          onClick={toggleTabsExpanded}
          size="small"
          sx={{
            color: "text.primary",
            m: 0,
            p: 0.5,
            "&:hover": {
              bgcolor: "transparent",
              opacity: 0.7,
            },
          }}
        >
          {isTabsExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: "auto", width: "100%" }}>
        {activeTab === 0 ? (
          <Box>{renderDashboard()}</Box>
        ) : (
          <Box sx={{ width: "100%" }}>
            {/* Secondary horizontal tabs for sections with sub-tabs */}
            {visibleCategories[activeTab].subTabs && visibleCategories[activeTab].subTabs!.length > 0 && (
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                  value={activeSubTab}
                  onChange={handleSubTabChange}
                  aria-label="hr section sub-tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  {visibleCategories[activeTab].subTabs!.map((subTab) => (
                    <Tab key={subTab.id} label={subTab.label} value={subTab.id} />
                  ))}
                </Tabs>
              </Box>
            )}

            {/* Render the appropriate component based on active tab and sub-tab */}
            {visibleCategories[activeTab].subTabs && visibleCategories[activeTab].subTabs!.length > 0
              ? visibleCategories[activeTab].subTabs!.find((subTab) => subTab.id === activeSubTab)?.component
              : visibleCategories[activeTab].component}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default HR
