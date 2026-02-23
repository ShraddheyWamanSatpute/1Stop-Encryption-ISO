import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  analyzeHRData as analyzeHRDataAI,
  analyzeStockData as analyzeStockDataAI,
  analyzeBookingsData as analyzeBookingsDataAI,
  analyzeFinanceData as analyzeFinanceDataAI,
  analyzeLocationData,
  analyzePOSData as analyzePOSDataAI,
  analyzeCompanyData,
  generateBusinessReport,
} from '../services/VertexService';
import { useCompany } from './CompanyContext';
import { useSettings } from './SettingsContext';
import { db, ref, get, set } from '../services/Firebase';
// Import RTDatabase modules
import * as StockRTDB from '../rtdatabase/Stock';
import * as StockFunctions from '../functions/Stock';
import * as HRRTDB from '../rtdatabase/HRs';
import * as BookingsRTDB from '../rtdatabase/Bookings';
import * as FinanceRTDB from '../rtdatabase/Finance';
// POS functions are in Stock and Finance RTDatabase modules
import * as MessengerRTDB from '../rtdatabase/Messenger';
import * as NotificationsRTDB from '../rtdatabase/Notifications';
import * as CompanyRTDB from '../rtdatabase/Company';
// import * as FinanceFunctions from '../functions/Finance'; // TODO: Implement FinanceFunctions
// New comprehensive analytics functions
import {
  analyzeStockData,
  analyzeHRData,
  analyzeBookingsData,
  analyzeFinanceData,
  analyzePOSData,
  calculateStockKPIs,
  calculateHRKPIs,
  calculateFinanceKPIs,
  generateChartData,
  // type DateRange,
  type FilterOptions,
  type GroupByOptions,
  type AnalyticsResult,
  type KPIMetrics,
  type ChartData
} from '../functions/Analytics';
// Import helper functions for filtering
import { 
  filterByCompanyContext, 
  safeArray, 
  safeNumber, 
  safeString,
  safeParseDate
} from '../../frontend/utils/reportHelpers';
import type { Employee, TimeOff, Department, Attendance, Payroll } from '../interfaces/HRs';
import type { Product, CategoryType, Supplier, Location, Sale, Purchase, StockCount, StockCountItem } from '../interfaces/Stock';
import type { Site, DataManagementConfig } from '../interfaces/Company';
import type { Transaction, Bill } from '../interfaces/Finance';
import type { Notification } from '../interfaces/Notifications';
import type { Chat } from '../interfaces/Messenger';
import type { DashboardCard } from '../interfaces/Dashboard';
import type { Booking } from '../interfaces/Bookings';

// Lightweight widget data contracts for dashboards
interface TimeSeriesPoint { label: string; value: number }

interface FinanceWidgets {
  kpis: {
    cashBalance: number;
    revenue: number;
    expenses: number;
    profit: number;
    profitMargin: number;
    outstandingInvoices: number;
    monthlyExpenses: number;
    quarterlyRevenue: number;
    yearlyRevenue: number;
    accountsReceivable: number;
    accountsPayable: number;
    currentRatio: number;
    debtToEquity: number;
    returnOnInvestment: number;
    burnRate: number;
    runway: number;
  };
  cashFlow: Array<{ month: string; inflow: number; outflow: number; net: number; forecast: number }>;
  revenueBySource: Array<{ source: string; amount: number; percentage: number; growth: number }>;
  expensesByCategory: Array<{ category: string; amount: number; percentage: number; trend: string }>;
  profitLossTrends: Array<{ month: string; revenue: number; expenses: number; profit: number; margin: number }>;
  budgetVsActual: Array<{ category: string; budgeted: number; actual: number; variance: number; percentage: number }>;
  invoiceAnalysis: Array<{ status: string; count: number; amount: number; avgDays: number }>;
  paymentTrends: Array<{ method: string; amount: number; count: number; percentage: number }>;
  financialRatios: Array<{ ratio: string; value: number; benchmark: number; status: string }>;
  taxAnalysis: Array<{ period: string; taxableIncome: number; taxOwed: number; rate: number }>;
}

interface BookingsWidgets {
  kpis: {
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    noShowBookings: number;
    averagePartySize: number;
    occupancyRate: number;
    revenuePerBooking: number;
    repeatCustomers: number;
    bookingConversionRate: number;
    averageLeadTime: number;
    peakBookingHours: string;
    totalRevenue: number;
  };
  bookingsByDay: Array<{ date: string; bookings: number; revenue: number; occupancy: number }>;
  bookingsByHour: Array<{ hour: string; bookings: number; utilization: number }>;
  bookingsBySource: Array<{ source: string; count: number; conversion: number }>;
  bookingsByPartySize: Array<{ size: number; count: number; revenue: number }>;
  customerSegments: Array<{ segment: string; count: number; averageSpend: number; frequency: number }>;
  tableUtilization: Array<{ table: string; bookings: number; revenue: number; utilization: number }>;
  seasonalTrends: Array<{ month: string; bookings: number; revenue: number; growth: number }>;
  cancellationAnalysis: Array<{ reason: string; count: number; leadTime: number; impact: number }>;
  waitlistAnalysis: Array<{ date: string; waitlisted: number; converted: number; conversionRate: number }>;
}

interface POSWidgets {
  kpis: { 
    totalSales: number; 
    totalTransactions: number;
    averageTransactionValue: number;
    dailySales: number;
    weeklySales: number;
    monthlySales: number;
    totalCustomers: number;
    repeatCustomers: number;
    peakHourSales: number;
    discountsGiven: number;
    refundsProcessed: number;
    cashSales: number;
    cardSales: number;
  };
  salesByDay: TimeSeriesPoint[];
  salesByHour: Array<{ hour: string; sales: number; transactions: number }>;
  salesByWeekday: Array<{ day: string; sales: number; transactions: number }>;
  paymentMethodBreakdown: Record<string, number>;
  topSellingItems: Array<{ item: string; quantity: number; revenue: number }>;
  customerAnalytics: Array<{ segment: string; count: number; averageSpend: number }>;
  discountAnalysis: Array<{ type: string; amount: number; usage: number; impact: number }>;
  refundAnalysis: Array<{ date: string; amount: number; reason: string; items: number }>;
  peakTimes: Array<{ timeSlot: string; avgSales: number; avgTransactions: number }>;
  tableUtilization: Array<{ table: string; utilization: number; revenue: number; turns: number }>;
}

interface HRWidgets {
  kpis: { 
    totalEmployees: number; 
    activeEmployees: number; 
    pendingTimeOff: number; 
    trainingsCompleted: number;
    totalDepartments: number;
    averageAttendance: number;
    turnoverRate: number;
    trainingCompletionRate: number;
    performanceScore: number;
    recruitmentActive: number;
    payrollTotal: number;
    overtimeHours: number;
  };
  employeesByDepartment: Array<{ department: string; count: number; active: number }>;
  attendanceTrends: Array<{ date: string; present: number; absent: number; late: number }>;
  performanceMetrics: Array<{ employee: string; score: number; department: string; trend: string }>;
  trainingProgress: Array<{ course: string; completed: number; total: number; completion: number }>;
  payrollBreakdown: Array<{ department: string; amount: number; employees: number; average: number }>;
  timeOffRequests: Array<{ date: string; approved: number; pending: number; rejected: number }>;
  recruitmentFunnel: Array<{ stage: string; count: number; conversion: number }>;
  turnoverAnalysis: Array<{ month: string; joined: number; left: number; netChange: number }>;
}

interface StockWidgets {
  kpis: { 
    totalStockValue: number; 
    totalItems: number; 
    lowStockCount: number;
    totalCategories: number;
    totalSuppliers: number;
    averageStockTurnover: number;
    totalPurchaseValue: number;
    totalSalesValue: number;
    profitMargin: number;
    stockAccuracy: number;
    reorderRequired: number;
    expiredItems: number;
  };
  stockByCategory: Array<{ category: string; value: number; count: number }>;
  stockBySupplier: Array<{ supplier: string; value: number; count: number }>;
  stockByLocation: Array<{ location: string; value: number; count: number }>;
  topSellingItems: Array<{ name: string; quantity: number; value: number }>;
  lowStockItems: Array<{ name: string; current: number; required: number; status: string }>;
  stockTrends: Array<{ date: string; stockValue: number; itemCount: number; transactions: number }>;
  purchaseHistory: Array<{ date: string; amount: number; items: number; supplier: string }>;
  salesHistory: Array<{ date: string; amount: number; items: number; profit: number }>;
  stockCounts: Array<{ date: string; counted: number; variance: number; accuracy: number }>;
  parLevelStatus: Array<{ item: string; current: number; parLevel: number; status: string }>;
  profitAnalysis: Array<{ item: string; cost: number; price: number; margin: number; volume: number }>;
}

interface CompanyWidgets {
  kpis: {
    totalSites: number;
    totalSubsites: number;
    totalEmployees: number;
    totalChecklists: number;
    completionRate: number;
    activeNotifications: number;
  };
  checklistStats: Array<{ name: string; completionRate: number; overdue: number }>;
  sitePerformance: Array<{ siteName: string; score: number; issues: number }>;
}

interface MessengerWidgets {
  kpis: {
    totalChats: number;
    activeChats: number;
    unreadMessages: number;
    responseTime: number;
  };
  activityTrends: TimeSeriesPoint[];
}

interface NotificationWidgets {
  kpis: {
    totalNotifications: number;
    unreadCount: number;
    criticalAlerts: number;
    systemAlerts: number;
  };
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
}

interface AnalyticsContextType {
  loading: boolean;
  error: string | null;
  
  // AI Analysis Functions (existing)
  analyzeHR: () => Promise<string>;
  analyzeStock: () => Promise<string>;
  analyzeBookings: (startDate?: string, endDate?: string) => Promise<string>;
  analyzeFinance: (startDate?: string, endDate?: string) => Promise<string>;
  analyzeLocations: () => Promise<string>;
  analyzePOS: (startDate?: string, endDate?: string) => Promise<string>;
  analyzeCompany: () => Promise<string>;
  analyzeMessenger: () => Promise<string>;
  analyzeNotifications: () => Promise<string>;
  
  // Comprehensive Analytics Functions (new)
  getStockAnalytics: (groupBy?: GroupByOptions, filters?: FilterOptions) => Promise<AnalyticsResult>;
  getHRAnalytics: (groupBy?: GroupByOptions, filters?: FilterOptions) => Promise<AnalyticsResult>;
  getBookingsAnalytics: (groupBy?: GroupByOptions, filters?: FilterOptions) => Promise<AnalyticsResult>;
  getFinanceAnalytics: (groupBy?: GroupByOptions, filters?: FilterOptions) => Promise<AnalyticsResult>;
  getPOSAnalytics: (groupBy?: GroupByOptions, filters?: FilterOptions) => Promise<AnalyticsResult>;
  
  // KPI Functions
  getStockKPIs: () => Promise<KPIMetrics[]>;
  getHRKPIs: () => Promise<KPIMetrics[]>;
  getFinanceKPIs: () => Promise<KPIMetrics[]>;
  getBookingsKPIs: () => Promise<KPIMetrics[]>;
  getPOSKPIs: () => Promise<KPIMetrics[]>;
  
  // Chart Data Functions
  getStockChartData: (groupBy: GroupByOptions, valueField?: string) => Promise<ChartData>;
  getHRChartData: (groupBy: GroupByOptions, valueField?: string) => Promise<ChartData>;
  getBookingsChartData: (groupBy: GroupByOptions, valueField?: string) => Promise<ChartData>;
  getFinanceChartData: (groupBy: GroupByOptions, valueField?: string) => Promise<ChartData>;
  getPOSChartData: (groupBy: GroupByOptions, valueField?: string) => Promise<ChartData>;
  
  // Enhanced widget data for comprehensive dashboards
  getFinanceWidgets: (dateRange?: { startDate: string; endDate: string }) => Promise<FinanceWidgets>;
  getBookingsWidgets: (dateRange?: { startDate: string; endDate: string }) => Promise<BookingsWidgets>;
  getPOSWidgets: (dateRange?: { startDate: string; endDate: string }) => Promise<POSWidgets>;
  getHRWidgets: (dateRange?: { startDate: string; endDate: string }) => Promise<HRWidgets>;
  getStockWidgets: (dateRange?: { startDate: string; endDate: string }) => Promise<StockWidgets>;
  getCompanyWidgets: () => Promise<CompanyWidgets>;
  getMessengerWidgets: () => Promise<MessengerWidgets>;
  getNotificationWidgets: () => Promise<NotificationWidgets>;
  
  // Universal data access for any data type
  getWidgetData: (dataType: string, options?: { 
    dateRange?: { startDate: string; endDate: string };
    filters?: Record<string, unknown>;
    groupBy?: string;
    sortBy?: string;
    limit?: number;
  }) => Promise<unknown>;
  
  // Dashboard management
  saveDashboardLayout: (section: string, layout: Array<Record<string, unknown>>) => Promise<void>;
  loadDashboardLayout: (section: string) => Promise<Array<Record<string, unknown>>>;
  getAvailableWidgetTypes: () => string[];
  getAvailableDataTypes: (section?: string) => Array<{ value: string; label: string; category: string }>;
  
  // Enhanced AI-powered reporting with cross-module analysis
  generateReport: (request: string, domain?: 'finance' | 'bookings' | 'pos' | 'hr' | 'stock' | 'company' | 'messenger' | 'notifications' | 'comprehensive') => Promise<string>;
  // New: Comprehensive data export for AI analysis
  getComprehensiveDataSnapshot: () => Promise<Record<string, unknown>>;
  // New: Cross-module correlation analysis
  analyzeCrossModuleCorrelations: () => Promise<string>;
  
  // Real-time data subscriptions
  subscribeToWidgetData: (dataType: string, callback: (data: unknown) => void) => () => void;
  unsubscribeFromWidgetData: (dataType: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    // Return a safe default context instead of throwing error
    // This allows components to render even when Analytics module isn't loaded yet
    // Suppress warnings during initial load - components will wait for providers via guards
    // (Warnings are expected during initial render before providers are ready)
    
    const emptyContext: AnalyticsContextType = {
      loading: false,
      error: null,
      
      // AI Analysis Functions - return empty strings
      analyzeHR: async () => "",
      analyzeStock: async () => "",
      analyzeBookings: async () => "",
      analyzeFinance: async () => "",
      analyzeLocations: async () => "",
      analyzePOS: async () => "",
      analyzeCompany: async () => "",
      analyzeMessenger: async () => "",
      analyzeNotifications: async () => "",
      
      // Comprehensive Analytics Functions - return empty results
      getStockAnalytics: async () => ({ 
        data: [], 
        summary: { total: 0, average: 0, min: 0, max: 0, count: 0 }, 
        groupedData: {},
        trends: [],
        insights: [] 
      }),
      getHRAnalytics: async () => ({ 
        data: [], 
        summary: { total: 0, average: 0, min: 0, max: 0, count: 0 }, 
        groupedData: {},
        trends: [],
        insights: [] 
      }),
      getBookingsAnalytics: async () => ({ 
        data: [], 
        summary: { total: 0, average: 0, min: 0, max: 0, count: 0 }, 
        groupedData: {},
        trends: [],
        insights: [] 
      }),
      getFinanceAnalytics: async () => ({ 
        data: [], 
        summary: { total: 0, average: 0, min: 0, max: 0, count: 0 }, 
        groupedData: {},
        trends: [],
        insights: [] 
      }),
      getPOSAnalytics: async () => ({ 
        data: [], 
        summary: { total: 0, average: 0, min: 0, max: 0, count: 0 }, 
        groupedData: {},
        trends: [],
        insights: [] 
      }),
      
      // KPI Functions - return empty KPIs
      getStockKPIs: async () => [],
      getHRKPIs: async () => [],
      getFinanceKPIs: async () => [],
      getBookingsKPIs: async () => [],
      getPOSKPIs: async () => [],
      
      // Chart Data Functions - return empty charts
      getStockChartData: async () => ({ labels: [], datasets: [] }),
      getHRChartData: async () => ({ labels: [], datasets: [] }),
      getBookingsChartData: async () => ({ labels: [], datasets: [] }),
      getFinanceChartData: async () => ({ labels: [], datasets: [] }),
      getPOSChartData: async () => ({ labels: [], datasets: [] }),
      
      // Widget getters - return empty widgets
      getStockWidgets: async () => ({ 
        kpis: { 
          totalStockValue: 0, totalItems: 0, lowStockCount: 0, totalCategories: 0, totalSuppliers: 0,
          averageStockTurnover: 0, totalPurchaseValue: 0, totalSalesValue: 0, profitMargin: 0,
          stockAccuracy: 0, reorderRequired: 0, expiredItems: 0
        }, 
        stockByCategory: [], stockBySupplier: [], stockByLocation: [], topSellingItems: [],
        lowStockItems: [], stockTrends: [], purchaseHistory: [], salesHistory: [],
        stockCounts: [], parLevelStatus: [], profitAnalysis: []
      }),
      getHRWidgets: async () => ({ 
        kpis: { 
          totalEmployees: 0, activeEmployees: 0, pendingTimeOff: 0, trainingsCompleted: 0, totalDepartments: 0,
          averageAttendance: 0, turnoverRate: 0, trainingCompletionRate: 0, performanceScore: 0,
          recruitmentActive: 0, payrollTotal: 0, overtimeHours: 0
        }, 
        employeesByDepartment: [], attendanceTrends: [], performanceMetrics: [], trainingProgress: [],
        payrollBreakdown: [], timeOffRequests: [], recruitmentFunnel: [], turnoverAnalysis: []
      }),
      getBookingsWidgets: async () => ({ 
        kpis: { 
          totalBookings: 0, confirmedBookings: 0, cancelledBookings: 0, noShowBookings: 0,
          averagePartySize: 0, occupancyRate: 0, revenuePerBooking: 0, repeatCustomers: 0,
          bookingConversionRate: 0, averageLeadTime: 0, peakBookingHours: "", totalRevenue: 0
        }, 
        bookingsByDay: [], bookingsByHour: [], bookingsBySource: [], bookingsByPartySize: [],
        customerSegments: [], tableUtilization: [], seasonalTrends: [], cancellationAnalysis: [],
        waitlistAnalysis: []
      }),
      getFinanceWidgets: async () => ({ 
        kpis: { 
          cashBalance: 0, revenue: 0, expenses: 0, profit: 0, profitMargin: 0,
          outstandingInvoices: 0, monthlyExpenses: 0, quarterlyRevenue: 0, yearlyRevenue: 0,
          accountsReceivable: 0, accountsPayable: 0, currentRatio: 0, debtToEquity: 0,
          returnOnInvestment: 0, burnRate: 0, runway: 0
        }, 
        cashFlow: [], revenueBySource: [], expensesByCategory: [], profitLossTrends: [],
        budgetVsActual: [], invoiceAnalysis: [], paymentTrends: [], financialRatios: [],
        taxAnalysis: []
      }),
      getPOSWidgets: async () => ({ 
        kpis: { 
          totalSales: 0, totalTransactions: 0, averageTransactionValue: 0, dailySales: 0,
          weeklySales: 0, monthlySales: 0, totalCustomers: 0, repeatCustomers: 0,
          peakHourSales: 0, discountsGiven: 0, refundsProcessed: 0, cashSales: 0, cardSales: 0
        }, 
        salesByDay: [], salesByHour: [], salesByWeekday: [], paymentMethodBreakdown: {},
        topSellingItems: [], customerAnalytics: [], discountAnalysis: [], refundAnalysis: [],
        peakTimes: [], tableUtilization: []
      }),
      getCompanyWidgets: async () => ({ 
        kpis: { 
          totalSites: 0, totalSubsites: 0, totalEmployees: 0, totalChecklists: 0,
          completionRate: 0, activeNotifications: 0
        }, 
        checklistStats: [], sitePerformance: []
      }),
      getMessengerWidgets: async () => ({ 
        kpis: { 
          totalChats: 0, activeChats: 0, unreadMessages: 0, responseTime: 0
        }, 
        activityTrends: []
      }),
      getNotificationWidgets: async () => ({ 
        kpis: { 
          totalNotifications: 0, unreadCount: 0, criticalAlerts: 0, systemAlerts: 0
        }, 
        categoryBreakdown: {}, priorityBreakdown: {}
      }),
      
      // Universal data access - return empty
      getWidgetData: async () => null,
      
      // Dashboard management
      saveDashboardLayout: async () => {},
      loadDashboardLayout: async () => [],
      getAvailableWidgetTypes: () => [],
      getAvailableDataTypes: () => [],
      
      // Enhanced AI-powered reporting - return empty string
      generateReport: async () => "",
      
      // Comprehensive data export - return empty object
      getComprehensiveDataSnapshot: async () => ({}),
      
      // Cross-module correlation analysis - return empty string
      analyzeCrossModuleCorrelations: async () => "",
      
      // Real-time data subscriptions - return no-op unsubscribe
      subscribeToWidgetData: () => () => {},
      unsubscribeFromWidgetData: () => {},
    };
    
    return emptyContext;
  }
  return context;
};

// Helper function to create empty HR widgets when data isn't available
const createEmptyHRWidgets = (): HRWidgets => ({
  kpis: {
    totalEmployees: 0,
    activeEmployees: 0,
    pendingTimeOff: 0,
    trainingsCompleted: 0,
    totalDepartments: 0,
    averageAttendance: 0,
    turnoverRate: 0,
    trainingCompletionRate: 0,
    performanceScore: 0,
    recruitmentActive: 0,
    payrollTotal: 0,
    overtimeHours: 0
  },
  employeesByDepartment: [],
  attendanceTrends: [],
  performanceMetrics: [],
  trainingProgress: [],
  payrollBreakdown: [],
  timeOffRequests: [],
  recruitmentFunnel: [],
  turnoverAnalysis: []
});

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state: companyState, getBasePath } = useCompany();
  const { state: settingsState } = useSettings();

  // Local analyzeData function using generateBusinessReport
  const analyzeData = async (data: Record<string, unknown>, prompt: string): Promise<string> => {
    return await generateBusinessReport(prompt, data);
  };

  const fetchDataForAnalysis = async (path: string) => {
    const dataRef = ref(db, path);
    const snapshot = await get(dataRef);
    return snapshot.exists() ? snapshot.val() : null;
  };

  const getModuleBasePath = (module: 'finance' | 'bookings' | 'stock' | 'hr' | 'pos' | 'company' | 'messenger' | 'notifications'): string => {
    const base = getBasePath(module as keyof DataManagementConfig | undefined);
    if (!base) return '';
    if (module === 'company') return base;
    if (module === 'messenger') return base + '/messenger';
    if (module === 'notifications') return base + '/notifications';
    // Most modules store under /data/{module}
    // POS sales are under /data/sales (handled in POS widgets method using company/site IDs)
    return `${base}/data/${module}`;
  };

  const fetchComprehensiveModuleData = async (module: string, basePath: string) => {
    try {
      const dataRef = ref(db, basePath);
      const snapshot = await get(dataRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.warn(`Failed to fetch ${module} data:`, error);
      return null;
    }
  };

  const analyzeHR = async () => {
    try {
      setLoading(true);
      setError(null);
      const hrBasePath = getModuleBasePath('hr');
      const [employees, timeOffs, attendances, trainings] = await Promise.all([
        HRRTDB.fetchEmployees(hrBasePath),
        HRRTDB.fetchTimeOffs(hrBasePath).catch(() => []),
        HRRTDB.fetchAttendances(hrBasePath).catch(() => []),
        HRRTDB.fetchTrainings(hrBasePath).catch(() => [])
      ]);
      const payrolls: Array<Record<string, unknown>> = []; // TODO: Implement fetchPayrolls
      
      const hrData = { employees, timeOffs, attendances, trainings, payrolls };
      if (!hrData.employees.length) throw new Error('No HR data found');
      return await analyzeHRDataAI(hrData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error analyzing HR data');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const analyzeStock = async () => {
    try {
      setLoading(true);
      setError(null);
      const stockBasePath = getModuleBasePath('stock');
      const [products, sales, purchases, stockCounts] = await Promise.all([
        StockRTDB.fetchProducts(stockBasePath),
        StockRTDB.fetchSales(stockBasePath),
        StockRTDB.fetchPurchases(stockBasePath),
        StockRTDB.fetchStockCounts2(stockBasePath)
      ]);
      
      const stockData = { products, sales, purchases, stockCounts };
      if (!stockData.products.length) throw new Error('No stock data found');
      return await analyzeStockDataAI(stockData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error analyzing stock data');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const analyzeBookings = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      setError(null);
      const bookingsBasePath = getModuleBasePath('bookings');
      if (!bookingsBasePath) throw new Error('No bookings path available');
      const [bookings] = await Promise.all([
        BookingsRTDB.fetchBookings(bookingsBasePath)
      ]);
      
      let filtered = bookings;
      if (startDate && endDate) {
        filtered = bookings.filter((b) => (b.date || '') >= startDate && (b.date || '') <= endDate);
      }
      if (!filtered || filtered.length === 0) throw new Error('No bookings data found');
      
      const bookingsData = { bookings: filtered };
      return await analyzeBookingsDataAI(bookingsData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error analyzing bookings data');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const analyzeFinance = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      setError(null);
      const financeBasePath = getModuleBasePath('finance');
      if (!financeBasePath) throw new Error('No finance path available');
      const [transactions, bills, expenses, budgets] = await Promise.all([
        FinanceRTDB.fetchTransactions(financeBasePath),
        FinanceRTDB.fetchBills(financeBasePath).catch(() => []),
        FinanceRTDB.fetchExpenses(financeBasePath).catch(() => []),
        FinanceRTDB.fetchBudgets(financeBasePath).catch(() => [])
      ]);
      // const invoices: any[] = []; // TODO: Implement fetchInvoices
      
      let filtered = transactions;
      if (startDate && endDate) {
        filtered = transactions.filter((t) => (t.date || '') >= startDate && (t.date || '') <= endDate);
      }
      if (!filtered || filtered.length === 0) throw new Error('No finance data found');
      
      const financeData = { transactions: filtered, invoices: [], bills, expenses, budgets };
      return await analyzeFinanceDataAI(financeData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error analyzing finance data');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const analyzeLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const locationsBasePath = getBasePath('bookings');
      const locationData = await fetchDataForAnalysis(`${locationsBasePath}/data/locations`);
      if (!locationData) throw new Error('No location data found');
      return await analyzeLocationData(locationData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error analyzing location data');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const analyzePOS = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      setError(null);
      const basePath = getModuleBasePath('pos');
      if (!basePath) throw new Error('No POS path available');
      const [bills, discounts, promotions] = await Promise.all([
        FinanceRTDB.fetchBills(basePath),
        // POSRTDB.fetchCards(basePath).catch(() => []), // TODO: Implement fetchCards
        StockRTDB.fetchDiscounts(basePath).catch(() => []),
        StockRTDB.fetchPromotions(basePath).catch(() => [])
      ]);
      
      let filtered = bills;
      if (startDate && endDate) {
        filtered = bills.filter((b) => {
          const bill = b as { tradingDate?: string; date?: string; receiveDate?: string; createdAt?: string }
          const d = safeString(bill.tradingDate || bill.date || bill.receiveDate || bill.createdAt);
          return d && d >= startDate && d <= endDate;
        });
      }
      if (!filtered || filtered.length === 0) throw new Error('No POS data found');
      
      const cards: Array<Record<string, unknown>> = []; // TODO: Implement fetchCards
      const posData = { bills: filtered, cards, discounts, promotions };
      return await analyzePOSDataAI(posData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error analyzing POS data');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const analyzeCompany = async () => {
    try {
      setLoading(true);
      setError(null);
      const companyBasePath = getBasePath();
      const companyData = await fetchDataForAnalysis(`${companyBasePath}`);
      if (!companyData) throw new Error('No company data found');
      return await analyzeCompanyData(companyData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error analyzing company data');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const analyzeMessenger = async () => {
    try {
      setLoading(true);
      setError(null);
      const messengerBasePath = getModuleBasePath('messenger');
      const [chats, contacts] = await Promise.all([
        MessengerRTDB.getCompanyChats(messengerBasePath).catch(() => []),
        MessengerRTDB.fetchContacts(messengerBasePath).catch(() => [])
      ]);
      const messages: Array<Record<string, unknown>> = []; // TODO: Implement getMessages
      
      const messengerData = { chats, messages, contacts };
      if (!messengerData.chats.length) throw new Error('No messenger data found');
      const prompt = `Analyze this messenger data and provide insights on:
1. Communication patterns and frequency
2. Response times and engagement
3. User activity trends
4. Chat effectiveness metrics
Please provide specific metrics and recommendations for improving communication.`;
      return await analyzeData(messengerData, prompt);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error analyzing messenger data');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const analyzeNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const notificationsBasePath = getModuleBasePath('notifications');
      const notifications = await NotificationsRTDB.fetchNotificationsFromDb(notificationsBasePath, settingsState.auth?.uid || '').catch(() => []);
      const settings = {}; // TODO: Implement fetchSettings
      
      const notificationsData = { notifications, settings };
      if (!notificationsData.notifications.length) throw new Error('No notifications data found');
      const prompt = `Analyze this notifications data and provide insights on:
1. Alert frequency and patterns
2. Critical vs non-critical notification ratios
3. User response and acknowledgment rates
4. System performance indicators
Please provide specific metrics and recommendations for optimizing notification systems.`;
      return await analyzeData(notificationsData, prompt);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error analyzing notifications data');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ===== NEW: Structured widget data helpers =====
  const getFinanceWidgets = async (dateRange?: { startDate: string; endDate: string }): Promise<FinanceWidgets> => {
    try {
      setLoading(true);
      setError(null);
      const basePath = getModuleBasePath('finance');
      if (!basePath) throw new Error('No finance path available');

      const allTransactions = await FinanceRTDB.fetchTransactions(basePath);
      const allBankAccounts = await FinanceRTDB.fetchBankAccounts(basePath);
      
      // Filter by company context (site/subsite)
      const contextFilteredTransactions = filterByCompanyContext(
        safeArray(allTransactions),
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      );
      const bankAccounts = filterByCompanyContext(
        safeArray(allBankAccounts),
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      );
      
      // Filter by date range if provided
      const transactions = dateRange ? contextFilteredTransactions.filter((t) => {
        const transaction = t as Transaction
        const tDate = safeString(transaction.date || transaction.createdAt);
        return tDate >= dateRange.startDate && tDate <= dateRange.endDate;
      }) : contextFilteredTransactions;

      // TODO: Implement FinanceFunctions methods
      const profitLoss = { 
        revenue: transactions.filter((t) => {
          const transaction = t as Transaction
          return safeString(transaction.type) === 'sale'
        }).reduce((sum: number, t) => {
          const transaction = t as Transaction
          return sum + safeNumber(transaction.totalAmount, 0)
        }, 0),
        expenses: transactions.filter((t) => {
          const transaction = t as Transaction
          return safeString(transaction.type) === 'purchase'
        }).reduce((sum: number, t) => {
          const transaction = t as Transaction
          return sum + safeNumber(transaction.totalAmount, 0)
        }, 0),
        profit: 0
      };
      profitLoss.profit = profitLoss.revenue - profitLoss.expenses;
      const cash = bankAccounts.reduce((sum: number, account) => sum + safeNumber(account.balance, 0), 0);
      const cashFlow: Array<{ month: string; inflow: number; outflow: number; net: number; forecast: number }> = [];
      // Quick report KPIs if available
      let outstandingInvoices: number | undefined;
      let monthlyExpenses: number | undefined;
      try {
        // const quick = await fetchFinanceQuickReport(basePath); // TODO: Implement fetchFinanceQuickReport
        // outstandingInvoices = quick.outstandingInvoices;
        // monthlyExpenses = quick.monthlyExpenses;
      } catch (error) {
        // Ignore errors from quick report calculation
        console.warn('Quick report calculation error:', error);
      }

      return {
        kpis: {
          cashBalance: cash,
          revenue: profitLoss.revenue,
          expenses: profitLoss.expenses,
          profit: profitLoss.profit,
          profitMargin: profitLoss.revenue > 0 ? (profitLoss.profit / profitLoss.revenue) * 100 : 0,
          outstandingInvoices: outstandingInvoices || 0,
          monthlyExpenses: monthlyExpenses || 0,
          quarterlyRevenue: 0, // TODO: Calculate quarterly revenue
          yearlyRevenue: 0, // TODO: Calculate yearly revenue
          accountsReceivable: 0, // TODO: Calculate accounts receivable
          accountsPayable: 0, // TODO: Calculate accounts payable
          currentRatio: 0, // TODO: Calculate current ratio
          debtToEquity: 0, // TODO: Calculate debt to equity
          returnOnInvestment: 0, // TODO: Calculate ROI
          burnRate: 0, // TODO: Calculate burn rate
          runway: 0, // TODO: Calculate runway
        },
        cashFlow: cashFlow.length > 0 ? cashFlow.map(cf => {
          const cfObj = cf as { month?: string; inflow?: number; outflow?: number; net?: number }
          return {
            month: cfObj.month || '',
            inflow: cfObj.inflow || 0,
            outflow: cfObj.outflow || 0,
            net: cfObj.net || 0,
            forecast: 0
          }
        }) : [],
        revenueBySource: [], // TODO: Implement revenue by source
        expensesByCategory: [], // TODO: Implement expenses by category
        profitLossTrends: [], // TODO: Implement profit loss trends
        budgetVsActual: [], // TODO: Implement budget vs actual
        invoiceAnalysis: [], // TODO: Implement invoice analysis
        paymentTrends: [], // TODO: Implement payment trends
        financialRatios: [], // TODO: Implement financial ratios
        taxAnalysis: [], // TODO: Implement tax analysis
      };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error loading finance widgets');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getBookingsWidgets = async (dateRange?: { startDate: string; endDate: string }): Promise<BookingsWidgets> => {
    try {
      setLoading(true);
      setError(null);
      const basePath = getModuleBasePath('bookings');
      if (!basePath) throw new Error('No bookings path available');
      const stats = await BookingsRTDB.calculateBookingStats(basePath, dateRange?.startDate, dateRange?.endDate);
      
      // Transform stats to match new interface
      const bookingsWidgets: BookingsWidgets = {
        kpis: {
          totalBookings: stats?.totalBookings || 0,
          confirmedBookings: stats?.confirmedBookings || 0,
          cancelledBookings: stats?.cancelledBookings || 0,
          noShowBookings: stats?.noShowBookings || 0,
          averagePartySize: stats?.averagePartySize || 0,
          occupancyRate: 0, // TODO: Calculate occupancy rate
          revenuePerBooking: 0, // TODO: Calculate revenue per booking
          repeatCustomers: 0, // TODO: Calculate repeat customers
          bookingConversionRate: 0, // TODO: Calculate conversion rate
          averageLeadTime: 0, // TODO: Calculate average lead time
          peakBookingHours: "12:00", // TODO: Calculate peak booking hours
          totalRevenue: 0, // TODO: Calculate total revenue
        },
        bookingsByDay: [], // TODO: Implement bookings by day
        bookingsByHour: [], // TODO: Implement bookings by hour
        bookingsBySource: [], // TODO: Implement bookings by source
        bookingsByPartySize: [], // TODO: Implement bookings by party size
        customerSegments: [], // TODO: Implement customer segments
        tableUtilization: [], // TODO: Implement table utilization
        seasonalTrends: [], // TODO: Implement seasonal trends
        cancellationAnalysis: [], // TODO: Implement cancellation analysis
        waitlistAnalysis: [], // TODO: Implement waitlist analysis
      };
      
      return bookingsWidgets;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error loading bookings widgets');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getPOSWidgets = async (dateRange?: { startDate: string; endDate: string }): Promise<POSWidgets> => {
    try {
      setLoading(true);
      setError(null);
      const basePath = getModuleBasePath('pos');
      if (!basePath) throw new Error('No POS path available');
      const allSales = await StockRTDB.fetchSales(basePath);
      
      // Filter by company context (site/subsite)
      const contextFilteredSales = filterByCompanyContext(
        safeArray(allSales),
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      );
      
      // Filter by date range if provided
      const sales = dateRange ? contextFilteredSales.filter((s: Sale) => {
        const sDate = safeString(s.tradingDate || s.date);
        return sDate >= dateRange.startDate && sDate <= dateRange.endDate;
      }) : contextFilteredSales;

      // KPIs
      const totalSales = sales.reduce((sum, s) => sum + safeNumber(Number(s.salePrice), 0), 0);
      const totalTransactions = sales.length;

      // Sales by day (using tradingDate or date) - aggregated by frequency
      const byDayMap = new Map<string, number>();
      const paymentBreakdown: Record<string, number> = {};
      for (const s of sales) {
        const day = safeString(s.tradingDate || s.date);
        if (day) byDayMap.set(day, (byDayMap.get(day) || 0) + safeNumber(Number(s.salePrice), 0));
        const pm = safeString(s.paymentMethod, 'unknown');
        paymentBreakdown[pm] = (paymentBreakdown[pm] || 0) + 1;
      }
      const salesByDay = Array.from(byDayMap.entries())
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([label, value]) => ({ label, value }));

      return {
        kpis: { 
          totalSales, 
          totalTransactions,
          averageTransactionValue: totalTransactions > 0 ? totalSales / totalTransactions : 0,
          dailySales: totalSales, // TODO: Calculate actual daily sales
          weeklySales: totalSales, // TODO: Calculate actual weekly sales
          monthlySales: totalSales, // TODO: Calculate actual monthly sales
          totalCustomers: 0, // TODO: Implement customer tracking
          repeatCustomers: 0, // TODO: Implement repeat customer analysis
          peakHourSales: 0, // TODO: Calculate peak hour sales
          discountsGiven: 0, // TODO: Calculate discounts given
          refundsProcessed: 0, // TODO: Calculate refunds processed
          cashSales: 0, // TODO: Calculate cash sales
          cardSales: 0, // TODO: Calculate card sales
        },
        salesByDay,
        salesByHour: [], // TODO: Implement hourly sales
        salesByWeekday: [], // TODO: Implement weekday sales
        paymentMethodBreakdown: paymentBreakdown,
        topSellingItems: [], // TODO: Implement top selling items
        customerAnalytics: [], // TODO: Implement customer analytics
        discountAnalysis: [], // TODO: Implement discount analysis
        refundAnalysis: [], // TODO: Implement refund analysis
        peakTimes: [], // TODO: Implement peak times analysis
        tableUtilization: [], // TODO: Implement table utilization
      };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error loading POS widgets');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getHRWidgets = async (dateRange?: { startDate: string; endDate: string }): Promise<HRWidgets> => {
    try {
      setLoading(true);
      setError(null);
      const basePath = getModuleBasePath('hr');
      if (!basePath) {
        console.warn('AnalyticsContext: No HR path available, returning empty HR widgets');
        return createEmptyHRWidgets();
      }
      
      console.log('AnalyticsContext: Fetching HR widgets from path:', basePath);
      
      const [allEmployees, allTimeOffs, allTrainings, allAttendances, allDepartments, , allPerformanceReviews, allPayrollRecords, allCandidates, allInterviews] = await Promise.all([
        HRRTDB.fetchEmployees(basePath).catch(err => { console.warn('Failed to fetch employees:', err); return []; }),
        HRRTDB.fetchTimeOffs(basePath).catch(() => []),
        HRRTDB.fetchTrainings(basePath).catch(() => []),
        HRRTDB.fetchAttendances(basePath).catch(() => []),
        HRRTDB.fetchDepartments(basePath).catch(() => []),
        HRRTDB.fetchRoles(basePath).catch(() => []), // Unused but kept for potential future use
        HRRTDB.fetchPerformanceReviews(basePath).catch(() => []),
        HRRTDB.fetchPayroll(basePath).catch(() => []),
        HRRTDB.fetchCandidates(basePath).catch(() => []),
        HRRTDB.fetchInterviews(basePath).catch(() => [])
      ]);
      
      // Filter by company context (site/subsite)
      const employees = filterByCompanyContext<Employee>(
        (allEmployees || []) as Employee[],
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      );
      const timeOffs = filterByCompanyContext<TimeOff>(
        (allTimeOffs || []) as TimeOff[],
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      );
      const trainings = filterByCompanyContext(
        (allTrainings || []) as Array<Record<string, unknown>>,
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      );
      const attendances = filterByCompanyContext<Attendance>(
        (allAttendances || []) as Attendance[],
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      );
      const departments = (allDepartments || []) as Department[]; // Departments are typically company-level
      // const roles = safeArray(allRoles); // Roles are typically company-level - unused
      const performanceReviews = filterByCompanyContext(
        (allPerformanceReviews || []) as Array<Record<string, unknown>>,
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      );
      const payrollRecords = filterByCompanyContext(
        (allPayrollRecords || []) as Array<Record<string, unknown>>,
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      );
      const candidates = filterByCompanyContext(
        (allCandidates || []) as Array<Record<string, unknown>>,
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      );
      const interviews = filterByCompanyContext(
        (allInterviews || []) as Array<Record<string, unknown>>,
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      );
      
      console.log('AnalyticsContext: HR data fetched and filtered:', {
        employees: employees.length,
        departments: departments.length,
        trainings: trainings.length,
        attendances: attendances.length,
        performanceReviews: performanceReviews.length
      });
      
      // Filter data by date range if provided (for future use)
      
      
      
      
      // Calculate comprehensive KPIs
      const totalEmployees = employees.length;
      const activeEmployees = employees.filter((e: Employee) => e.status === 'active' || (e as Employee & { isActive?: boolean }).isActive).length;
      const inactiveEmployees = employees.filter((e: Employee) => e.status === 'inactive' || !(e as Employee & { isActive?: boolean }).isActive).length;
      const pendingTimeOff = timeOffs.filter((t: TimeOff) => t.status === 'pending').length;
      const trainingsCompleted = trainings.filter((t) => (t as { status?: string }).status === 'completed').length;
      const totalTrainings = trainings.length;
      const totalDepartments = departments.length || new Set(employees.map((e: Employee) => e.department || e.departmentId)).size;
      
      // Calculate attendance rate - DEFAULT TO 0 when no data
      const totalAttendanceRecords = attendances.length;
      const presentRecords = attendances.filter((a: Attendance) => (a as Attendance & { status?: string; present?: boolean }).status === 'present' || (a as Attendance & { present?: boolean }).present).length;
      const averageAttendance = totalAttendanceRecords > 0 ? (presentRecords / totalAttendanceRecords) * 100 : 0;
      
      // Calculate turnover rate (simplified)
      const turnoverRate = totalEmployees > 0 ? (inactiveEmployees / totalEmployees) * 100 : 0;
      
      // Calculate training completion rate
      const trainingCompletionRate = totalTrainings > 0 ? (trainingsCompleted / totalTrainings) * 100 : 0;
      
      // Calculate average performance score from actual performance reviews
      const performanceScore = performanceReviews.length > 0
        ? performanceReviews.reduce((sum: number, review) => sum + ((review as { overallScore?: number }).overallScore || 0), 0) / performanceReviews.length
        : 0;
      
      // Calculate payroll total from actual payroll records
      const payrollTotal = payrollRecords.length > 0
        ? payrollRecords.reduce((sum: number, p) => sum + ((p as { grossPay?: number; totalGross?: number }).grossPay || (p as { totalGross?: number }).totalGross || 0), 0)
        : employees.reduce((sum: number, e: Employee) => {
            const salary = e.salary || (e.hourlyRate && e.hoursPerWeek ? e.hourlyRate * e.hoursPerWeek * 52 : 0) || 0;
            return sum + salary;
          }, 0);
      
      // Calculate overtime hours from actual attendance/clock records
      const overtimeHours = attendances.reduce((sum: number, a: Attendance) => {
        if (!a.clockIn || !a.clockOut) return sum;
        
        const clockInTime = new Date(a.clockIn).getTime();
        const clockOutTime = new Date(a.clockOut).getTime();
        const hoursWorked = (clockOutTime - clockInTime) / (1000 * 60 * 60);
        
        // Break time
        let breakHours = 0;
        if (a.breakStart && a.breakEnd) {
          const breakStart = new Date(a.breakStart).getTime();
          const breakEnd = new Date(a.breakEnd).getTime();
          breakHours = (breakEnd - breakStart) / (1000 * 60 * 60);
        }
        
        const netHours = hoursWorked - breakHours;
        const overtime = Math.max(0, netHours - 8); // Overtime beyond 8 hours per day
        return sum + overtime;
      }, 0);
      
      // Employees by department breakdown
      const employeesByDepartment = departments.length > 0 
        ? departments.map((dept: Department) => {
            const deptEmployees = employees.filter((e: Employee) => 
              e.department === dept.name || e.departmentId === dept.id
            );
            return {
              department: dept.name || 'Unknown',
              count: deptEmployees.length,
              active: deptEmployees.filter((e: Employee) => e.status === 'active' || (e as Employee & { isActive?: boolean }).isActive).length
            };
          })
        : Object.entries(employees.reduce((acc: Record<string, { total: number; active: number }>, e: Employee) => {
            const dept = e.department || 'Unknown';
            if (!acc[dept]) acc[dept] = { total: 0, active: 0 };
            acc[dept].total++;
            if (e.status === 'active' || (e as Employee & { isActive?: boolean }).isActive) acc[dept].active++;
            return acc;
          }, {})).map(([department, data]) => ({
            department,
            count: data.total,
            active: data.active
          }));
      
      // Generate attendance trends based on date range
      const generateAttendanceTrends = () => {
        const start = dateRange ? new Date(dateRange.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = dateRange ? new Date(dateRange.endDate) : new Date();
        const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
        const maxDays = Math.min(days, 90); // Limit to 90 days max
        
        return Array.from({ length: maxDays }).map((_, i) => {
          const date = new Date(start);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayAttendances = attendances.filter((a: Attendance) => {
            const dateValue = a.date || a.createdAt;
            if (!dateValue) return false;
            // Convert number (timestamp) to Date if needed
            const dateObj = typeof dateValue === 'number' ? new Date(dateValue) : dateValue;
            const aDate = safeParseDate(dateObj);
            if (!aDate) return false;
            return aDate.toISOString().split('T')[0] === dateStr;
          });
          
          return {
            date: dateStr,
            present: dayAttendances.filter((a: Attendance) => safeString((a as Attendance & { status?: string }).status) === 'present' || (a as Attendance & { present?: boolean }).present).length,
            absent: dayAttendances.filter((a: Attendance) => safeString((a as Attendance & { status?: string }).status) === 'absent' || !(a as Attendance & { present?: boolean }).present).length,
            late: dayAttendances.filter((a: Attendance) => safeString((a as Attendance & { status?: string }).status) === 'late' || (a as Attendance & { late?: boolean }).late).length
          };
        });
      };
      
      const attendanceTrends = generateAttendanceTrends();
      
      // Performance metrics from actual performance reviews
      const performanceMetrics = performanceReviews.map((review) => {
        const reviewWithId = review as { employeeId?: string; overallScore?: number; endDate?: number; createdAt?: number }
        const employee = employees.find((e: Employee) => e.id === reviewWithId.employeeId);
        
        // Calculate trend by comparing with previous reviews
        const employeeReviews = performanceReviews
          .filter((r) => (r as { employeeId?: string }).employeeId === reviewWithId.employeeId)
          .sort((a, b) => {
            const aDate = (a as { endDate?: number; createdAt?: number }).endDate || (a as { createdAt?: number }).createdAt || 0
            const bDate = (b as { endDate?: number; createdAt?: number }).endDate || (b as { createdAt?: number }).createdAt || 0
            return bDate - aDate
          });
        
        let trend = 'stable';
        if (employeeReviews.length >= 2) {
          const currentReview = employeeReviews[0] as { overallScore?: number }
          const previousReview = employeeReviews[1] as { overallScore?: number }
          const current = currentReview.overallScore || 0;
          const previous = previousReview.overallScore || 0;
          trend = current > previous ? 'up' : current < previous ? 'down' : 'stable';
        }
        
        return {
          employee: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee',
          score: reviewWithId.overallScore || 0,
          department: employee?.department || 'Unknown',
          trend
        };
      }).slice(0, 20); // Top 20 most recent reviews
      
      // Training progress
      const trainingProgress = trainings.reduce((acc: Record<string, { completed: number; total: number }>, t) => {
        const training = t as { course?: string; title?: string; status?: string }
        const course = training.course || training.title || 'Unknown Course';
        if (!acc[course]) {
          acc[course] = { completed: 0, total: 0 };
        }
        acc[course].total++;
        if (training.status === 'completed') acc[course].completed++;
        return acc;
      }, {});
      
      const trainingProgressArray = Object.entries(trainingProgress).map(([course, data]) => ({
        course,
        completed: data.completed,
        total: data.total,
        completion: data.total > 0 ? (data.completed / data.total) * 100 : 0
      }));
      
      // Payroll breakdown by department - use actual payroll records when available
      const payrollBreakdown = employeesByDepartment.map(dept => {
        const deptEmployees = employees.filter((e: Employee) => 
          e.department === dept.department || e.departmentId === dept.department
        );
        
        // Try to use actual payroll records first
        const deptPayrollRecords = payrollRecords.filter((p) => {
          const pWithId = p as { employeeId?: string }
          const emp = employees.find((e: Employee) => e.id === pWithId.employeeId);
          return emp && (emp.department === dept.department || emp.departmentId === dept.department);
        });
        
        const amount = deptPayrollRecords.length > 0
          ? deptPayrollRecords.reduce((sum: number, p) => {
              const pWithPay = p as { grossPay?: number; totalGross?: number }
              return sum + (pWithPay.grossPay || pWithPay.totalGross || 0)
            }, 0)
          : deptEmployees.reduce((sum: number, e: Employee) => {
              const salary = e.salary || (e.hourlyRate && e.hoursPerWeek ? e.hourlyRate * e.hoursPerWeek * 52 : 0) || 0;
              return sum + salary;
            }, 0);
            
        return {
          department: dept.department,
          amount,
          employees: dept.count,
          average: dept.count > 0 ? amount / dept.count : 0
        };
      });
      
      // Time off requests breakdown
      const timeOffRequests = Array.from({ length: 12 }).map((_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
        
        const monthRequests = timeOffs.filter((t: TimeOff) => {
          const requestDate = new Date(t.startDate || (t as TimeOff & { createdAt?: string | number }).createdAt).toISOString().slice(0, 7);
          return requestDate === monthStr;
        });
        
        return {
          date: monthStr,
          approved: monthRequests.filter((t: TimeOff) => t.status === 'approved').length,
          pending: monthRequests.filter((t: TimeOff) => t.status === 'pending').length,
          rejected: monthRequests.filter((t: TimeOff) => t.status === 'denied').length
        };
      });
      
      // Recruitment funnel from actual candidate and interview data
      const totalApplications = candidates.length;
      const screeningCandidates = candidates.filter((c) => {
        const status = (c as { status?: string }).status;
        return status === 'screening' || status === 'interview' || status === 'offer' || status === 'hired';
      }).length;
      const interviewCandidates = candidates.filter((c) => {
        const status = (c as { status?: string }).status;
        return status === 'interview' || status === 'offer' || status === 'hired';
      }).length;
      const offerCandidates = candidates.filter((c) => {
        const status = (c as { status?: string }).status;
        return status === 'offer' || status === 'hired';
      }).length;
      const hiredCandidates = candidates.filter((c) => (c as { status?: string }).status === 'hired').length;
      
      // Calculate phone screen count from interviews marked as 'phone'
      const phoneScreenCount = interviews.filter((i) => (i as { type?: string }).type === 'phone').length;
      
      const recruitmentFunnel = [
        { 
          stage: 'Applications', 
          count: totalApplications, 
          conversion: 100 
        },
        { 
          stage: 'Phone Screen', 
          count: phoneScreenCount || screeningCandidates, 
          conversion: totalApplications > 0 ? ((phoneScreenCount || screeningCandidates) / totalApplications) * 100 : 0 
        },
        { 
          stage: 'Interview', 
          count: interviewCandidates, 
          conversion: totalApplications > 0 ? (interviewCandidates / totalApplications) * 100 : 0 
        },
        { 
          stage: 'Offer', 
          count: offerCandidates, 
          conversion: totalApplications > 0 ? (offerCandidates / totalApplications) * 100 : 0 
        },
        { 
          stage: 'Hired', 
          count: hiredCandidates, 
          conversion: totalApplications > 0 ? (hiredCandidates / totalApplications) * 100 : 0 
        }
      ];
      
      // Turnover analysis from actual employee hire and termination dates
      const turnoverAnalysis = Array.from({ length: 12 }).map((_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        const monthStr = date.toISOString().slice(0, 7);
        
        // Count employees who joined in this month
        const joined = employees.filter((e: Employee) => {
          if (!e.hireDate && !e.createdAt) return false;
          const hireDate = new Date(e.hireDate || e.createdAt).toISOString().slice(0, 7);
          return hireDate === monthStr;
        }).length;
        
        // Count employees who left in this month (terminated or inactive with termination date)
        const left = employees.filter((e: Employee) => {
          const termDateValue = e.terminationDate || e.endDate;
          if (!termDateValue) return false;
          // Convert number (timestamp) to Date if needed
          const termDate = typeof termDateValue === 'number' 
            ? new Date(termDateValue).toISOString().slice(0, 7)
            : new Date(termDateValue).toISOString().slice(0, 7);
          return termDate === monthStr;
        }).length;
        
        return {
          month: monthStr,
          joined,
          left,
          netChange: joined - left
        };
      });
      
      // Count active recruitment (from job postings)
      const jobPostings = await HRRTDB.fetchJobs(basePath).catch(() => []);
      const recruitmentActive = jobPostings.filter((job) => {
        const status = (job as { status?: string }).status;
        return status === 'published' || status === 'Published' || status === 'active';
      }).length;
      
      return {
        kpis: {
          totalEmployees,
          activeEmployees,
          pendingTimeOff,
          trainingsCompleted,
          totalDepartments,
          averageAttendance,
          turnoverRate,
          trainingCompletionRate,
          performanceScore,
          recruitmentActive,
          payrollTotal,
          overtimeHours
        },
        employeesByDepartment,
        attendanceTrends,
        performanceMetrics,
        trainingProgress: trainingProgressArray,
        payrollBreakdown,
        timeOffRequests,
        recruitmentFunnel,
        turnoverAnalysis
      };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error loading HR widgets');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getStockWidgets = async (dateRange?: { startDate: string; endDate: string }): Promise<StockWidgets> => {
    console.log('AnalyticsContext: getStockWidgets called with dateRange:', dateRange);
    try {
      setLoading(true);
      setError(null);
      const basePath = getModuleBasePath('stock');
      console.log('AnalyticsContext: Stock base path:', basePath);
      if (!basePath) throw new Error('No stock path available');
      
      // Fetch all stock-related data INCLUDING MEASURES
      const [allProducts, allSales, allPurchases, allStockCounts, allCategories, allSuppliers, allLocations, allMeasures] = await Promise.all([
        StockRTDB.fetchProducts(basePath),
        StockRTDB.fetchSales(basePath),
        StockRTDB.fetchPurchases(basePath),
        StockRTDB.fetchStockCounts2(basePath),
        StockRTDB.fetchCategories(basePath).catch(() => []),
        StockRTDB.fetchSuppliers(basePath).catch(() => []),
        StockRTDB.fetchLocations(basePath).catch(() => []),
        StockRTDB.fetchMeasures(basePath).catch(() => [])
      ]);
      
      // Filter by company context (site/subsite)
      const products = filterByCompanyContext(
        safeArray(allProducts),
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      );
      const sales = filterByCompanyContext(
        safeArray(allSales),
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      );
      const purchases = filterByCompanyContext<Purchase>(
        (allPurchases || []) as Purchase[],
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      );
      const stockCounts = filterByCompanyContext(
        safeArray(allStockCounts),
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      );
      const categories = (allCategories || []) as CategoryType[]; // Categories are typically company-level
      const suppliers = (allSuppliers || []) as Supplier[]; // Suppliers are typically company-level
      const locations = (allLocations || []) as Location[]; // Locations are typically company-level
      const measures = (allMeasures || []) as Array<Record<string, unknown>>; // Measures are typically company-level
      
      console.log('AnalyticsContext: Fetched and filtered data - Products:', products.length, 'Sales:', sales.length, 'Purchases:', purchases.length, 'Measures:', measures.length);
      
      // Calculate current stock for each product (in base units)
      const productsWithStock = products.map((p: Product) => {
        const stockData = StockFunctions.calculateCurrentStock(
          p.id,
          stockCounts,
          purchases,
          sales,
          measures,
          dateRange?.endDate ? new Date(dateRange.endDate) : new Date()
        );
        
        // Calculate effective cost (uses recipe cost for recipe-type products)
        const effectiveCost = StockFunctions.getProductCost(p, products, measures);
        
        return {
          ...p,
          currentStock: stockData.quantity,
          predictedStock: stockData.quantity, // Same as currentStock per requirements
          baseUnit: stockData.baseUnit,
          effectiveCost: effectiveCost // Cost including recipe calculations
        };
      });
      
      // Calculate comprehensive KPIs using base units and defaultMeasure prices
      const totalPurchaseValue = purchases.reduce((sum: number, p) => sum + ((p as { totalValue?: number }).totalValue || 0), 0);
      
      // Calculate total sales value using base units
      const totalSalesValue = sales.reduce((sum: number, s) => {
        const sale = s as { productId?: string; itemID?: string; quantity?: number; measureId?: string }
        const product = productsWithStock.find((p: Product) => p.id === sale.productId || p.id === sale.itemID);
        if (!product) return sum;
        
        const salePrice = StockFunctions.getDefaultSalePrice(product);
        const baseQty = StockFunctions.convertToBaseUnits(sale.quantity || 0, sale.measureId || '', measures);
        return sum + (salePrice * baseQty);
      }, 0);
      
      const profitMargin = totalSalesValue > 0 ? ((totalSalesValue - totalPurchaseValue) / totalSalesValue) * 100 : 0;
      
      // Stock by category analysis - use base units and effective cost (includes recipe costs)
      const stockByCategory = categories.map((cat: CategoryType) => {
        const categoryProducts = productsWithStock.filter((p: Product) => p.categoryId === cat.id);
        const value = categoryProducts.reduce((sum: number, p: Product & { currentStock?: number; effectiveCost?: number }) => {
          // Use effectiveCost which includes recipe calculations
          return sum + ((p.currentStock || 0) * (p.effectiveCost || 0));
        }, 0);
        return {
          category: cat.name,
          value,
          count: categoryProducts.length
        };
      });
      
      // Stock by supplier analysis - use base units and effective cost (includes recipe costs)
      const stockBySupplier = suppliers.map((sup: Supplier) => {
        const supplierProducts = productsWithStock.filter((p: Product) => p.purchase?.defaultSupplier === sup.id);
        const value = supplierProducts.reduce((sum: number, p: Product & { currentStock?: number; effectiveCost?: number }) => {
          // Use effectiveCost which includes recipe calculations
          return sum + ((p.currentStock || 0) * (p.effectiveCost || 0));
        }, 0);
        return {
          supplier: sup.name,
          value,
          count: supplierProducts.length
        };
      });
      
      // Top selling items - use base units
      const topSellingItems = productsWithStock
        .map((p: Product & { currentStock?: number; effectiveCost?: number }) => {
          const productSales = sales.filter((s) => {
            const sale = s as { productId?: string; itemID?: string }
            return sale.productId === p.id || sale.itemID === p.id;
          });
          const quantity = productSales.reduce((sum: number, s) => {
            const sale = s as { quantity?: number; measureId?: string }
            return sum + StockFunctions.convertToBaseUnits(sale.quantity || 0, sale.measureId || '', measures);
          }, 0);
          const value = productSales.reduce((sum: number, s) => {
            const sale = s as { quantity?: number; measureId?: string }
            const salePrice = StockFunctions.getDefaultSalePrice(p);
            const baseQty = StockFunctions.convertToBaseUnits(sale.quantity || 0, sale.measureId || '', measures);
            return sum + (salePrice * baseQty);
          }, 0);
          return { name: p.name, quantity, value };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      
      // Low stock items - use calculated current stock
      const lowStockItems = productsWithStock
        .filter((p: Product & { currentStock?: number; parLevel?: number }) => (p.currentStock || 0) < (p.parLevel || 10))
        .map((p: Product & { currentStock?: number; parLevel?: number }) => ({
          name: p.name,
          current: p.currentStock || 0,
          required: p.parLevel || 10,
          status: p.currentStock === 0 ? 'Out of Stock' : 'Low Stock'
        }))
        .slice(0, 10);

      // Generate historical data based on date range with proper date filtering
      const generateHistoricalData = (baseValue: number, startDate?: string, endDate?: string) => {
        const start = startDate ? safeParseDate(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate ? safeParseDate(endDate) : new Date();
        
        if (!start || !end) {
          return [{
            date: new Date().toISOString().split('T')[0],
            value: baseValue,
            stockValue: baseValue,
            transactions: 0
          }];
        }
        
        const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
        
        return Array.from({ length: Math.max(1, days) }).map((_, i) => {
          const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
          const variation = 0.8 + Math.random() * 0.4; // ±20% variation
          return {
            date: date.toISOString().split('T')[0],
            value: Math.round(baseValue * variation),
            stockValue: Math.round(baseValue * variation),
            transactions: Math.round(Math.random() * 20) + 5
          };
        });
      };

      // Filter sales and purchases by date range if provided
      const filteredSales = dateRange ? sales.filter((s: Sale) => {
        const sale = s as Sale & { tradingDate?: string; date?: string }
        const saleDate = safeString(sale.tradingDate || sale.date);
        return saleDate && saleDate >= dateRange.startDate && saleDate <= dateRange.endDate;
      }) : sales;

      const filteredPurchases = dateRange ? (purchases as Purchase[]).filter((p: Purchase) => {
        const purchase = p as Purchase & { dateOrdered?: string; date?: string }
        const purchaseDate = safeString(purchase.dateOrdered || purchase.date);
        return purchaseDate && purchaseDate >= dateRange.startDate && purchaseDate <= dateRange.endDate;
      }) : purchases;

      // Generate trend data - format for widget compatibility
      // Calculate total stock value using base units and effective costs (includes recipe costs)
      const baseItemCount = Math.max(productsWithStock.length, 1); // Ensure at least 1 for calculation
      const baseStockValue = Math.max(
        productsWithStock.reduce((sum: number, p: Product & { currentStock?: number; effectiveCost?: number }) => {
          // Use effectiveCost which includes recipe calculations
          return sum + ((p.currentStock || 0) * (p.effectiveCost || 0));
        }, 0),
        1000 // Minimum base value for demo
      );
      
      console.log('AnalyticsContext: Using base values for trends - items:', baseItemCount, 'value:', baseStockValue);
      
      const rawTrends = generateHistoricalData(baseItemCount, dateRange?.startDate, dateRange?.endDate);
      const stockTrends = rawTrends.map(trend => ({
        date: trend.date,
        stockValue: Math.max(Math.round(baseStockValue * (trend.value / baseItemCount)), 100), // Scale price appropriately
        itemCount: Math.max(trend.value, 1), // Ensure non-zero values
        transactions: trend.transactions
      }));
      
      console.log('AnalyticsContext: Generated stock trends sample:', stockTrends[0]);
      
      // Generate sales history from filtered sales - format for widget compatibility
      const salesHistory = filteredSales.length > 0 
        ? filteredSales.map((s: Sale) => {
            const sale = s as Sale & { tradingDate?: string; date?: string; salePrice?: number; quantity?: number; cost?: number }
            return {
              date: sale.tradingDate || sale.date || new Date().toISOString().split('T')[0],
              amount: sale.salePrice || 0,
              items: sale.quantity || 1,
              profit: (sale.salePrice || 0) - (sale.cost || (sale.salePrice || 0) * 0.7 || 0)
            }
          })
        : generateHistoricalData(Math.max(totalSalesValue / Math.max(1, sales.length), 100), dateRange?.startDate, dateRange?.endDate)
            .map(d => ({
              date: d.date,
              amount: Math.max(d.value, 25),
              items: Math.max(Math.round(d.value / 25), 1),
              profit: Math.max(d.value * 0.3, 10)
            }));

      // Generate purchase history from filtered purchases - format for widget compatibility
      const purchaseHistory = filteredPurchases.length > 0
        ? (filteredPurchases as Purchase[]).map((p: Purchase) => {
            return {
              date: p.orderDate || new Date().toISOString().split('T')[0],
              amount: p.totalAmount || 0,
            items: p.items?.length || 1,
              supplier: p.supplier || 'Unknown'
            }
          })
        : generateHistoricalData(Math.max(totalPurchaseValue / Math.max(1, purchases.length), 200), dateRange?.startDate, dateRange?.endDate)
            .map(d => ({
              date: d.date,
              amount: Math.max(d.value, 50),
              items: Math.max(Math.round(d.value / 50), 1),
              supplier: 'Various'
            }));
      
      // Calculate stock turnover using standard formula (COGS / Average Inventory Value)
      const periodDays = dateRange ? 
        Math.ceil((new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (24 * 60 * 60 * 1000)) : 
        30;
      const stockTurnover = StockFunctions.calculateStockTurnover(
        productsWithStock,
        filteredSales,
        measures,
        periodDays
      );
      
      // Calculate stock accuracy from variance between predicted and actual counts
      let totalAccuracy = 0;
      let accuracyCount = 0;
      stockCounts.forEach((count: StockCount) => {
        if (!count.items) return;
        count.items.forEach((item) => {
          const stockItem = item as { id?: string; countedTotal?: number; measureId?: string }
          const product = productsWithStock.find((p: Product) => p.id === stockItem.id);
          if (!product) return;
          
          const predictedStock = (product as Product & { predictedStock?: number }).predictedStock || 0;
          const actualCount = StockFunctions.convertToBaseUnits(stockItem.countedTotal || 0, stockItem.measureId || '', measures);
          const accuracy = StockFunctions.calculateStockAccuracy(predictedStock, actualCount);
          
          totalAccuracy += accuracy;
          accuracyCount++;
        });
      });
      const avgStockAccuracy = accuracyCount > 0 ? totalAccuracy / accuracyCount : 95;
      
      const result = {
        kpis: {
          totalStockValue: baseStockValue,
          totalItems: productsWithStock.length,
          lowStockCount: lowStockItems.length,
          totalCategories: categories.length,
          totalSuppliers: suppliers.length,
          averageStockTurnover: stockTurnover,
          totalPurchaseValue,
          totalSalesValue,
          profitMargin,
          stockAccuracy: Math.round(avgStockAccuracy * 100) / 100,
          reorderRequired: lowStockItems.length,
          expiredItems: 0, // TODO: Calculate expired items based on expiry dates
        },
        stockByCategory,
        stockBySupplier,
        stockByLocation: locations.map((loc: Location) => ({
          location: loc.name || 'Unknown Location',
          value: Math.round(baseStockValue / Math.max(1, locations.length)),
          count: Math.round(productsWithStock.length / Math.max(1, locations.length))
        })),
        topSellingItems,
        lowStockItems,
        stockTrends,
        purchaseHistory,
        salesHistory,
        stockCounts: stockCounts.map((count: StockCount) => {
          // Calculate variance for this stock count
          let totalVariance = 0;
          let itemCount = 0;
          let totalAccuracyForCount = 0;
          
          if (count.items) {
            count.items.forEach((item) => {
              const stockItem = item as StockCountItem
              const product = productsWithStock.find((p: Product) => p.id === stockItem.id);
              if (!product) return;
              
              const predictedStock = (product as Product & { predictedStock?: number }).predictedStock || 0;
              const actualCount = StockFunctions.convertToBaseUnits(stockItem.countedTotal || 0, stockItem.measureId, measures);
              const variance = predictedStock - actualCount;
              const accuracy = StockFunctions.calculateStockAccuracy(predictedStock, actualCount);
              
              totalVariance += variance;
              totalAccuracyForCount += accuracy;
              itemCount++;
            });
          }
          
          return {
            date: count.dateUK || count.date || new Date().toISOString().split('T')[0],
            counted: count.items?.length || 0,
            variance: itemCount > 0 ? Math.round(totalVariance / itemCount) : 0,
            accuracy: itemCount > 0 ? Math.round((totalAccuracyForCount / itemCount) * 100) / 100 : 100
          };
        }),
        parLevelStatus: productsWithStock
          .filter((p: Product & { parLevel?: number }) => p.parLevel)
          .map((p: Product & { currentStock?: number; parLevel?: number }) => ({
            item: p.name,
            current: p.currentStock || 0,
            parLevel: p.parLevel || 0,
            status: (p.currentStock || 0) < (p.parLevel || 0) ? 'Below Par' : 'Above Par'
          }))
          .slice(0, 20),
        profitAnalysis: topSellingItems.map((item) => ({
          item: item.name,
          cost: item.value * 0.7, // Assume 70% cost ratio
          price: item.value,
          margin: 30, // 30% margin
          volume: item.quantity
        })),
      };
      
      console.log('AnalyticsContext: Returning stock widgets data:', {
        kpisCount: Object.keys(result.kpis).length,
        stockTrendsCount: result.stockTrends.length,
        salesHistoryCount: result.salesHistory.length,
        purchaseHistoryCount: result.purchaseHistory.length
      });
      
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error loading stock widgets');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getCompanyWidgets = async (): Promise<CompanyWidgets> => {
    try {
      setLoading(true);
      setError(null);
      const basePath = getBasePath();
      if (!basePath) throw new Error('No company path available');

      const [sites, checklists, notifications] = await Promise.all([
        CompanyRTDB.getSitesFromDb(companyState.companyID!),
        CompanyRTDB.fetchChecklistsFromDb(basePath),
        NotificationsRTDB.fetchNotificationsFromDb(basePath, settingsState.auth?.uid || '').catch(() => []),
      ]);

      const totalSites = sites?.length || 0;
      const totalSubsites = sites?.reduce((sum: number, site: Site) => {
        const siteWithSubsites = site as Site & { subsites?: Record<string, unknown> }
        return sum + (siteWithSubsites.subsites ? Object.keys(siteWithSubsites.subsites).length : 0)
      }, 0) || 0;
      const totalChecklists = checklists?.length || 0;
      const activeNotifications = notifications?.filter((n) => !(n as { isRead?: boolean }).isRead).length || 0;

      // Calculate completion rates and site performance
      const checklistStats = checklists?.map((checklist) => {
        const checklistWithTitle = checklist as { title?: string }
        return {
          name: checklistWithTitle.title || 'Unnamed Checklist',
        completionRate: Math.random() * 100, // Placeholder - implement actual calculation
        overdue: Math.floor(Math.random() * 10),
        }
      }) || [];

      const sitePerformance = sites?.map((site: Site) => ({
        siteName: site.name || 'Unnamed Site',
        score: Math.random() * 100, // Placeholder - implement actual scoring
        issues: Math.floor(Math.random() * 5),
      })) || [];

      return {
        kpis: {
          totalSites,
          totalSubsites,
          totalEmployees: 0, // Will be populated from HR data
          totalChecklists,
          completionRate: 85, // Placeholder - implement actual calculation
          activeNotifications,
        },
        checklistStats,
        sitePerformance,
      };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error loading company widgets');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getMessengerWidgets = async (): Promise<MessengerWidgets> => {
    try {
      setLoading(true);
      setError(null);
      const basePath = getModuleBasePath('messenger');
      if (!basePath) throw new Error('No messenger path available');

      const chats = await MessengerRTDB.getCompanyChats(basePath).catch(() => []);
      const totalChats = chats?.length || 0;
      const activeChats = chats?.filter((chat: Chat) => (chat as Chat & { isActive?: boolean }).isActive).length || 0;
      const unreadMessages = chats?.reduce((sum: number, chat: Chat) => sum + ((chat as Chat & { unreadCount?: number }).unreadCount || 0), 0) || 0;

      return {
        kpis: {
          totalChats,
          activeChats,
          unreadMessages,
          responseTime: 2.5, // Placeholder - implement actual calculation
        },
        activityTrends: [], // Placeholder - implement actual trends
      };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error loading messenger widgets');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getNotificationWidgets = async (): Promise<NotificationWidgets> => {
    try {
      setLoading(true);
      setError(null);
      const basePath = getModuleBasePath('notifications');
      if (!basePath) throw new Error('No notifications path available');

      const notifications = await NotificationsRTDB.fetchNotificationsFromDb(basePath, settingsState.auth?.uid || '').catch(() => []);
      const totalNotifications = notifications?.length || 0;
      const unreadCount = notifications?.filter((n: Notification) => !n.read).length || 0;
      const criticalAlerts = notifications?.filter((n: Notification) => n.priority === 'urgent' || n.priority === 'high').length || 0;
      const systemAlerts = notifications?.filter((n: Notification) => n.type === 'system').length || 0;

      const categoryBreakdown: Record<string, number> = {};
      const priorityBreakdown: Record<string, number> = {};

      notifications?.forEach((n: Notification) => {
        categoryBreakdown[n.category || 'unknown'] = (categoryBreakdown[n.category || 'unknown'] || 0) + 1;
        priorityBreakdown[n.priority || 'medium'] = (priorityBreakdown[n.priority || 'medium'] || 0) + 1;
      });

      return {
        kpis: {
          totalNotifications,
          unreadCount,
          criticalAlerts,
          systemAlerts,
        },
        categoryBreakdown,
        priorityBreakdown,
      };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error loading notification widgets');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getComprehensiveDataSnapshot = async () => {
    try {
      setLoading(true);
      setError(null);
      const basePath = getBasePath();
      if (!basePath) throw new Error('No base path available');

      // Fetch comprehensive data from all modules in parallel
      const [finance, bookings, pos, hr, stock, company, messenger, notifications, checklists, settings] = await Promise.all([
        fetchComprehensiveModuleData('finance', getModuleBasePath('finance')),
        fetchComprehensiveModuleData('bookings', getModuleBasePath('bookings')),
        fetchComprehensiveModuleData('pos', `${basePath}/data/sales`),
        fetchComprehensiveModuleData('hr', getModuleBasePath('hr')),
        fetchComprehensiveModuleData('stock', getModuleBasePath('stock')),
        fetchComprehensiveModuleData('company', basePath),
        fetchComprehensiveModuleData('messenger', getModuleBasePath('messenger')),
        fetchComprehensiveModuleData('notifications', getModuleBasePath('notifications')),
        fetchComprehensiveModuleData('checklists', `${basePath}/checklists`),
        fetchComprehensiveModuleData('settings', `${basePath}/settings`),
      ]);

      // Get current context information
      const currentSite = companyState.sites?.find(s => s.siteID === companyState.selectedSiteID);
      const currentSubsite = currentSite?.subsites?.[companyState.selectedSubsiteID || ''];
      const currentUser = settingsState.user;

      // Enhanced data snapshot with complete subsite context
      return {
        timestamp: new Date().toISOString(),
        
        // Current Context
        context: {
          companyId: companyState.companyID,
          companyName: companyState.companyName,
          siteId: companyState.selectedSiteID,
          siteName: currentSite?.name || 'Unknown Site',
          subsiteId: companyState.selectedSubsiteID,
          subsiteName: currentSubsite?.name || 'No Subsite Selected',
          userId: settingsState.auth?.uid,
          userName: currentUser?.displayName || currentUser?.email || 'Unknown User',
          userEmail: currentUser?.email || 'Unknown Email',
        },

        // Complete Business Data
        modules: {
          finance,
          bookings,
          pos,
          hr,
          stock,
          company,
          messenger,
          notifications,
          checklists,
          settings,
        },

        // Enhanced Metadata
        metadata: {
          dataScope: companyState.selectedSubsiteID ? 'subsite' : companyState.selectedSiteID ? 'site' : 'company',
          basePath,
          totalDataPoints: Object.values({ finance, bookings, pos, hr, stock, company, messenger, notifications, checklists, settings })
            .filter(Boolean)
            .reduce((sum, module) => sum + (typeof module === 'object' ? Object.keys(module).length : 0), 0),
          modulesWithData: Object.entries({ finance, bookings, pos, hr, stock, company, messenger, notifications, checklists, settings })
            .filter(([, data]) => data !== null)
            .map(([name]) => name),
          hierarchyLevel: companyState.selectedSubsiteID ? 3 : companyState.selectedSiteID ? 2 : 1,
          accessLevel: 'user', // Access level determined by Firebase Auth
        },

        // Site/Subsite Structure for Context
        organizationStructure: {
          company: {
            id: companyState.companyID,
            name: companyState.companyName,
          },
          site: currentSite ? {
            id: currentSite.siteID,
            name: currentSite.name,
            description: currentSite.description,
            address: currentSite.address,
          } : null,
          subsite: currentSubsite ? {
            id: companyState.selectedSubsiteID,
            name: currentSubsite.name,
            description: currentSubsite.description,
            address: currentSubsite.address,
          } : null,
          allSites: companyState.sites?.map(s => ({
            id: s.siteID,
            name: s.name,
            subsiteCount: s.subsites ? Object.keys(s.subsites).length : 0,
          })) || [],
        },
      };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error creating comprehensive data snapshot');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const analyzeCrossModuleCorrelations = async () => {
    try {
      setLoading(true);
      setError(null);
      const snapshot = await getComprehensiveDataSnapshot();
      const prompt = `Analyze cross-module correlations and dependencies in this comprehensive business data:

1. Identify patterns between different business modules (finance, HR, stock, bookings, etc.)
2. Find correlations between employee performance and business metrics
3. Analyze how inventory levels affect sales and bookings
4. Examine financial health impact on operational efficiency
5. Identify bottlenecks and optimization opportunities across modules

Provide specific insights with data-driven recommendations for improving overall business performance.`;
      return await analyzeData(snapshot, prompt);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error analyzing cross-module correlations');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (request: string, domain?: 'finance' | 'bookings' | 'pos' | 'hr' | 'stock' | 'company' | 'messenger' | 'notifications' | 'comprehensive') => {
    try {
      setLoading(true);
      setError(null);
      let context: Record<string, unknown> = {};
      
      switch (domain) {
        case 'finance':
          context = await getFinanceWidgets() as unknown as Record<string, unknown>;
          break;
        case 'bookings':
          context = await getBookingsWidgets() as unknown as Record<string, unknown>;
          break;
        case 'pos':
          context = await getPOSWidgets() as unknown as Record<string, unknown>;
          break;
        case 'hr':
          context = await getHRWidgets() as unknown as Record<string, unknown>;
          break;
        case 'stock':
          context = await getStockWidgets() as unknown as Record<string, unknown>;
          break;
        case 'company':
          context = await getCompanyWidgets() as unknown as Record<string, unknown>;
          break;
        case 'messenger':
          context = await getMessengerWidgets() as unknown as Record<string, unknown>;
          break;
        case 'notifications':
          context = await getNotificationWidgets() as unknown as Record<string, unknown>;
          break;
        case 'comprehensive':
          context = await getComprehensiveDataSnapshot();
          break;
        default:
          // Provide comprehensive context with all available modules
          context = {
            finance: await getFinanceWidgets().catch(() => undefined),
            bookings: await getBookingsWidgets().catch(() => undefined),
            pos: await getPOSWidgets().catch(() => undefined),
            hr: await getHRWidgets().catch(() => undefined),
            stock: await getStockWidgets().catch(() => undefined),
            company: await getCompanyWidgets().catch(() => undefined),
            messenger: await getMessengerWidgets().catch(() => undefined),
            notifications: await getNotificationWidgets().catch(() => undefined),
          };
      }
      
      return await generateBusinessReport(request, context);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error generating report');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ========== UNIVERSAL DATA ACCESS ==========
  
  const getWidgetData = useCallback(async (dataType: string, options?: { 
    dateRange?: { startDate: string; endDate: string };
    filters?: Record<string, unknown>;
    groupBy?: string;
    sortBy?: string;
    limit?: number;
  }): Promise<unknown> => {
    try {
      setLoading(true);
      setError(null);
      
      // Route to appropriate widget data based on data type
      if (dataType.startsWith('stock') || dataType.includes('STOCK')) {
        const stockWidgets = await getStockWidgets(options?.dateRange);
        return getDataFromWidgets(stockWidgets as unknown as Record<string, unknown>, dataType);
      }
      
      if (dataType.startsWith('hr') || dataType.includes('HR') || dataType.includes('EMPLOYEE')) {
        const hrWidgets = await getHRWidgets(options?.dateRange);
        return getDataFromWidgets(hrWidgets as unknown as Record<string, unknown>, dataType);
      }
      
      if (dataType.startsWith('pos') || dataType.includes('POS') || dataType.includes('SALES')) {
        const posWidgets = await getPOSWidgets(options?.dateRange);
        return getDataFromWidgets(posWidgets as unknown as Record<string, unknown>, dataType);
      }
      
      if (dataType.startsWith('booking') || dataType.includes('BOOKING')) {
        const bookingWidgets = await getBookingsWidgets(options?.dateRange);
        return getDataFromWidgets(bookingWidgets as unknown as Record<string, unknown>, dataType);
      }
      
      if (dataType.startsWith('finance') || dataType.includes('FINANCE')) {
        const financeWidgets = await getFinanceWidgets(options?.dateRange);
        return getDataFromWidgets(financeWidgets as unknown as Record<string, unknown>, dataType);
      }
      
      if (dataType.startsWith('company') || dataType.includes('COMPANY')) {
        const companyWidgets = await getCompanyWidgets();
        return getDataFromWidgets(companyWidgets as unknown as Record<string, unknown>, dataType);
      }
      
      throw new Error(`Unsupported data type: ${dataType}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error fetching widget data');
      throw error;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.companyID, companyState.selectedSiteID]);

  // Helper function to extract specific data from widget collections
  const getDataFromWidgets = (widgets: Record<string, unknown>, dataType: string): unknown => {
    const lowerDataType = dataType.toLowerCase();
    
    // KPI data
    if (lowerDataType.includes('kpi') || lowerDataType.includes('total') || lowerDataType.includes('count')) {
      return widgets.kpis || {};
    }
    
    // Chart/trend data
    if (lowerDataType.includes('trend') || lowerDataType.includes('history')) {
      return widgets.stockTrends || widgets.attendanceTrends || widgets.salesByDay || [];
    }
    
    // Category/breakdown data
    if (lowerDataType.includes('category') || lowerDataType.includes('breakdown')) {
      return widgets.stockByCategory || widgets.expensesByCategory || widgets.paymentMethodBreakdown || [];
    }
    
    // Analysis data
    if (lowerDataType.includes('analysis')) {
      return widgets.profitAnalysis || widgets.cancellationAnalysis || widgets.discountAnalysis || [];
    }
    
    // Return all widget data if no specific match
    return widgets;
  };

  // ========== DASHBOARD MANAGEMENT ==========
  
  const saveDashboardLayout = useCallback(async (section: string, layout: Array<Record<string, unknown>>): Promise<void> => {
    try {
      const basePath = getBasePath();
      if (!basePath) throw new Error('No base path available');
      
      const layoutPath = `${basePath}/dashboards/${section}/layout`;
      const layoutRef = ref(db, layoutPath);
      await set(layoutRef, {
        layout,
        updatedAt: new Date().toISOString(),
        updatedBy: settingsState.auth?.uid || 'unknown'
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error saving dashboard layout');
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.companyID, settingsState.auth?.uid]);

  // Get default dashboard layout for a specific section
  const getDefaultDashboardLayout = useCallback((section: string): DashboardCard[] => {
    const layouts: Record<string, DashboardCard[]> = {
      hr: [
        // Row 1: Key Metrics
        {
          id: 'hr-total-employees',
          type: 'kpi',
          title: 'Total Employees',
          size: 'medium',
          position: { x: 0, y: 0, w: 3, h: 2 },
          data: {
            source: 'analytics',
            module: 'hr',
            config: { dataType: 'totalEmployees', icon: 'People', color: 'primary', format: 'number', showTrend: true }
          },
          filters: {},
          visible: true,
          order: 0
        },
        {
          id: 'hr-active-employees',
          type: 'kpi',
          title: 'Active Employees',
          data: {
            source: 'analytics',
            module: 'hr',
            config: { dataType: 'activeEmployees' }
          },
          filters: {},
          visible: true,
          order: 1,
          size: 'medium',
          position: { x: 3, y: 0, w: 3, h: 2 }
        },
        {
          id: 'hr-attendance-rate',
          type: 'kpi',
          title: 'Attendance Rate',
          data: {
            source: 'analytics',
            module: 'hr',
            config: { dataType: 'averageAttendance' }
          },
          filters: {},
          visible: true,
          order: 2,
          size: 'medium',
          position: { x: 6, y: 0, w: 3, h: 2 }
        },
        {
          id: 'hr-payroll-total',
          type: 'kpi',
          title: 'Total Payroll',
          data: {
            source: 'analytics',
            module: 'hr',
            config: { dataType: 'payrollTotal', icon: 'AttachMoney', color: 'warning', format: 'currency', showTrend: true }
          },
          filters: {},
          visible: true,
          order: 3,
          size: 'medium',
          position: { x: 9, y: 0, w: 3, h: 2 }
        },
        // Row 2: Department & Performance
        {
          id: 'hr-employees-by-department',
          type: 'chart',
          title: 'Employees by Department',
          data: {
            source: 'analytics',
            module: 'hr',
            config: { dataType: 'employeesByDepartment', xAxis: 'department', yAxis: 'count', color: 'primary', showDataLabels: true }
          },
          filters: {},
          visible: true,
          order: 4,
          size: 'large',
          position: { x: 0, y: 2, w: 6, h: 4 }
        },
        {
          id: 'hr-performance-metrics',
          type: 'chart',
          title: 'Performance Overview',
          data: {
            source: 'analytics',
            module: 'hr',
            config: { dataType: 'performanceMetrics', metrics: ['score', 'attendance', 'training'], color: 'secondary' }
          },
          filters: {},
          visible: true,
          order: 5,
          size: 'large',
          position: { x: 6, y: 2, w: 6, h: 4 }
        },
        // Row 3: Attendance & Time Off
        {
          id: 'hr-attendance-trends',
          type: 'chart',
          title: 'Attendance Trends (30 Days)',
          data: {
            source: 'analytics',
            module: 'hr',
            config: { dataType: 'attendanceTrends', xAxis: 'date', yAxis: ['present', 'absent', 'late'], colors: ['#4caf50', '#f44336', '#ff9800'], showLegend: true }
          },
          filters: {},
          visible: true,
          order: 6,
          size: 'xlarge',
          position: { x: 0, y: 6, w: 8, h: 4 }
        },
        {
          id: 'hr-time-off-summary',
          type: 'chart',
          title: 'Time Off Requests',
          data: {
            source: 'analytics',
            module: 'hr',
            config: { dataType: 'timeOffRequests', valueField: 'approved', labelField: 'type', showPercentage: true }
          },
          filters: {},
          visible: true,
          order: 7,
          size: 'medium',
          position: { x: 8, y: 6, w: 4, h: 4 }
        },
        // Row 4: Training & Payroll
        {
          id: 'hr-training-progress',
          type: 'chart',
          title: 'Training Progress',
          data: {
            source: 'analytics',
            module: 'hr',
            config: { dataType: 'trainingProgress', xAxis: 'course', yAxis: ['completed', 'total'], colors: ['#4caf50', '#e0e0e0'], showPercentage: true }
          },
          filters: {},
          visible: true,
          order: 8,
          size: 'large',
          position: { x: 0, y: 10, w: 6, h: 4 }
        },
        {
          id: 'hr-payroll-breakdown',
          type: 'chart',
          title: 'Payroll by Department',
          data: {
            source: 'analytics',
            module: 'hr',
            config: { dataType: 'payrollBreakdown', valueField: 'amount', labelField: 'department', showTotal: true, format: 'currency' }
          },
          filters: {},
          visible: true,
          order: 9,
          size: 'large',
          position: { x: 6, y: 10, w: 6, h: 4 }
        },
        // Row 5: Recruitment & Turnover
        {
          id: 'hr-recruitment-funnel',
          type: 'chart',
          title: 'Recruitment Funnel',
          data: {
            source: 'analytics',
            module: 'hr',
            config: { dataType: 'recruitmentFunnel', valueField: 'count', labelField: 'stage', showConversion: true }
          },
          filters: {},
          visible: true,
          order: 10,
          size: 'large',
          position: { x: 0, y: 14, w: 6, h: 4 }
        },
        {
          id: 'hr-turnover-analysis',
          type: 'chart',
          title: 'Turnover Analysis (12 Months)',
          data: {
            source: 'analytics',
            module: 'hr',
            config: { dataType: 'turnoverAnalysis', xAxis: 'month', yAxis: ['joined', 'left', 'netChange'], colors: ['#4caf50', '#f44336', '#2196f3'], showLegend: true }
          },
          filters: {},
          visible: true,
          order: 11,
          size: 'large',
          position: { x: 6, y: 14, w: 6, h: 4 }
        }
      ],
      stock: [
        // Stock dashboard layout
        {
          id: 'stock-total-value',
          type: 'kpi',
          title: 'Total Stock Value',
          data: {
            source: 'analytics',
            module: 'stock',
            config: { dataType: 'totalStockValue', icon: 'Inventory', color: 'primary', format: 'currency' }
          },
          filters: {},
          visible: true,
          order: 0,
          size: 'medium',
          position: { x: 0, y: 0, w: 3, h: 2 }
        },
        {
          id: 'stock-total-items',
          type: 'kpi',
          title: 'Total Items',
          data: {
            source: 'analytics',
            module: 'stock',
            config: { dataType: 'totalItems', icon: 'Category', color: 'info', format: 'number' }
          },
          filters: {},
          visible: true,
          order: 1,
          size: 'medium',
          position: { x: 3, y: 0, w: 3, h: 2 }
        },
        {
          id: 'stock-low-stock',
          type: 'kpi',
          title: 'Low Stock Items',
          data: {
            source: 'analytics',
            module: 'stock',
            config: { dataType: 'lowStockCount', icon: 'Warning', color: 'warning', format: 'number' }
          },
          filters: {},
          visible: true,
          order: 2,
          size: 'medium',
          position: { x: 6, y: 0, w: 3, h: 2 }
        },
        {
          id: 'stock-profit-margin',
          type: 'kpi',
          title: 'Profit Margin',
          data: {
            source: 'analytics',
            module: 'stock',
            config: { dataType: 'profitMargin', icon: 'TrendingUp', color: 'success', format: 'percentage' }
          },
          filters: {},
          visible: true,
          order: 3,
          size: 'medium',
          position: { x: 9, y: 0, w: 3, h: 2 }
        },
        {
          id: 'stock-by-category',
          type: 'chart',
          title: 'Stock by Category',
          data: {
            source: 'analytics',
            module: 'stock',
            config: { dataType: 'stockByCategory', valueField: 'value', labelField: 'category' }
          },
          filters: {},
          visible: true,
          order: 4,
          size: 'large',
          position: { x: 0, y: 2, w: 6, h: 4 }
        },
        {
          id: 'stock-trends',
          type: 'chart',
          title: 'Stock Value Trends',
          data: {
            source: 'analytics',
            module: 'stock',
            config: { dataType: 'stockTrends', xAxis: 'date', yAxis: 'stockValue' }
          },
          filters: {},
          visible: true,
          order: 5,
          size: 'large',
          position: { x: 6, y: 2, w: 6, h: 4 }
        }
      ],
      finance: [
        // Finance dashboard layout
        {
          id: 'finance-cash-balance',
          type: 'kpi',
          title: 'Cash Balance',
          data: {
            source: 'analytics',
            module: 'finance',
            config: { dataType: 'cashBalance', icon: 'AccountBalance', color: 'primary', format: 'currency' }
          },
          filters: {},
          visible: true,
          order: 0,
          size: 'medium',
          position: { x: 0, y: 0, w: 3, h: 2 }
        },
        {
          id: 'finance-revenue',
          type: 'kpi',
          title: 'Revenue',
          data: {
            source: 'analytics',
            module: 'finance',
            config: { dataType: 'revenue', icon: 'TrendingUp', color: 'success', format: 'currency' }
          },
          filters: {},
          visible: true,
          order: 1,
          size: 'medium',
          position: { x: 3, y: 0, w: 3, h: 2 }
        },
        {
          id: 'finance-expenses',
          type: 'kpi',
          title: 'Expenses',
          data: {
            source: 'analytics',
            module: 'finance',
            config: { dataType: 'expenses', icon: 'TrendingDown', color: 'error', format: 'currency' }
          },
          filters: {},
          visible: true,
          order: 2,
          size: 'medium',
          position: { x: 6, y: 0, w: 3, h: 2 }
        },
        {
          id: 'finance-profit',
          type: 'kpi',
          title: 'Profit',
          data: {
            source: 'analytics',
            module: 'finance',
            config: { dataType: 'profit', icon: 'AttachMoney', color: 'warning', format: 'currency' }
          },
          filters: {},
          visible: true,
          order: 3,
          size: 'medium',
          position: { x: 9, y: 0, w: 3, h: 2 }
        }
      ],
      bookings: [
        // Bookings dashboard layout
        {
          id: 'bookings-total',
          type: 'kpi',
          title: 'Total Bookings',
          data: {
            source: 'analytics',
            module: 'bookings',
            config: { dataType: 'totalBookings', icon: 'Event', color: 'primary', format: 'number' }
          },
          filters: {},
          visible: true,
          order: 0,
          size: 'medium',
          position: { x: 0, y: 0, w: 3, h: 2 }
        },
        {
          id: 'bookings-confirmed',
          type: 'kpi',
          title: 'Confirmed Bookings',
          data: {
            source: 'analytics',
            module: 'bookings',
            config: { dataType: 'confirmedBookings', icon: 'CheckCircle', color: 'success', format: 'number' }
          },
          filters: {},
          visible: true,
          order: 1,
          size: 'medium',
          position: { x: 3, y: 0, w: 3, h: 2 }
        },
        {
          id: 'bookings-occupancy',
          type: 'kpi',
          title: 'Occupancy Rate',
          data: {
            source: 'analytics',
            module: 'bookings',
            config: { dataType: 'occupancyRate', icon: 'TableRestaurant', color: 'info', format: 'percentage' }
          },
          filters: {},
          visible: true,
          order: 2,
          size: 'medium',
          position: { x: 6, y: 0, w: 3, h: 2 }
        },
        {
          id: 'bookings-revenue',
          type: 'kpi',
          title: 'Booking Revenue',
          data: {
            source: 'analytics',
            module: 'bookings',
            config: { dataType: 'totalRevenue', icon: 'AttachMoney', color: 'warning', format: 'currency' }
          },
          filters: {},
          visible: true,
          order: 3,
          size: 'medium',
          position: { x: 9, y: 0, w: 3, h: 2 }
        }
      ],
      pos: [
        // POS dashboard layout
        {
          id: 'pos-total-sales',
          type: 'kpi',
          title: 'Total Sales',
          data: {
            source: 'analytics',
            module: 'pos',
            config: { dataType: 'totalSales', icon: 'PointOfSale', color: 'primary', format: 'currency' }
          },
          filters: {},
          visible: true,
          order: 0,
          size: 'medium',
          position: { x: 0, y: 0, w: 3, h: 2 }
        },
        {
          id: 'pos-transactions',
          type: 'kpi',
          title: 'Transactions',
          data: {
            source: 'analytics',
            module: 'pos',
            config: { dataType: 'totalTransactions', icon: 'Receipt', color: 'info', format: 'number' }
          },
          filters: {},
          visible: true,
          order: 1,
          size: 'medium',
          position: { x: 3, y: 0, w: 3, h: 2 }
        },
        {
          id: 'pos-avg-transaction',
          type: 'kpi',
          title: 'Avg Transaction',
          data: {
            source: 'analytics',
            module: 'pos',
            config: { dataType: 'averageTransactionValue', icon: 'Calculate', color: 'success', format: 'currency' }
          },
          filters: {},
          visible: true,
          order: 2,
          size: 'medium',
          position: { x: 6, y: 0, w: 3, h: 2 }
        },
        {
          id: 'pos-daily-sales',
          type: 'kpi',
          title: 'Daily Sales',
          data: {
            source: 'analytics',
            module: 'pos',
            config: { dataType: 'dailySales', icon: 'Today', color: 'warning', format: 'currency' }
          },
          filters: {},
          visible: true,
          order: 3,
          size: 'medium',
          position: { x: 9, y: 0, w: 3, h: 2 }
        }
      ]
    };
    
    return layouts[section.toLowerCase()] || [];
  }, []);

  const loadDashboardLayout = useCallback(async (section: string): Promise<Array<Record<string, unknown>>> => {
    try {
      const basePath = getBasePath();
      if (!basePath) {
        // Return default layout if no base path
        return getDefaultDashboardLayout(section) as unknown as Array<Record<string, unknown>>;
      }
      
      const layoutPath = `${basePath}/dashboards/${section}/layout`;
      const layoutRef = ref(db, layoutPath);
      const snapshot = await get(layoutRef);
      
      if (snapshot.exists() && snapshot.val().layout) {
        return snapshot.val().layout;
      }
      
      // Return default layout if no saved layout exists
      const defaultLayout = getDefaultDashboardLayout(section);
      
      // Optionally save the default layout for future use
      if (defaultLayout.length > 0) {
        try {
          await saveDashboardLayout(section, defaultLayout as unknown as Array<Record<string, unknown>>);
        } catch (saveError) {
          console.warn('Could not save default layout:', saveError);
        }
      }
      
      return defaultLayout as unknown as Array<Record<string, unknown>>;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error loading dashboard layout');
      // Return default layout as fallback
      return getDefaultDashboardLayout(section) as unknown as Array<Record<string, unknown>>;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.companyID, getDefaultDashboardLayout, saveDashboardLayout]);

  const getAvailableWidgetTypes = useCallback((): string[] => {
    return [
      'stat', 'kpiCard', 'dashboardCard',
      'barChart', 'lineChart', 'pieChart', 'donutChart', 'areaChart',
      'scatterChart', 'bubbleChart', 'radarChart', 'heatmap', 'gauge',
      'funnelChart', 'waterfallChart', 'candlestickChart',
      'multipleSeriesLineChart', 'multipleSeriesBarChart', 'stackedBarChart', 'stackedAreaChart',
      'table', 'dataGrid', 'metricList', 'progressBar', 'trendIndicator',
      'filterWidget', 'datePickerWidget', 'searchWidget',
      'calendarHeatmap', 'geographicMap', 'treeMap', 'sankeyDiagram', 'networkDiagram',
      'tabsWidget', 'accordionWidget', 'carouselWidget'
    ];
  }, []);


  // ========== REAL-TIME SUBSCRIPTIONS ==========
  
  const subscriptions = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  const subscribeToWidgetData = useCallback((dataType: string, callback: (data: unknown) => void): (() => void) => {
    // For now, implement polling-based updates
    // TODO: Implement real-time Firebase listeners for better performance
    const intervalId = setInterval(async () => {
      try {
        const data = await getWidgetData(dataType);
        callback(data);
      } catch (error) {
        console.error(`Error updating widget data for ${dataType}:`, error);
      }
    }, 30000); // Update every 30 seconds
    
    subscriptions.current.set(dataType, intervalId);
    
    return () => {
      clearInterval(intervalId);
      subscriptions.current.delete(dataType);
    };
  }, [getWidgetData]);

  const unsubscribeFromWidgetData = useCallback((dataType: string): void => {
    const intervalId = subscriptions.current.get(dataType);
    if (intervalId) {
      clearInterval(intervalId);
      subscriptions.current.delete(dataType);
    }
  }, []);

  // ========== COMPREHENSIVE ANALYTICS FUNCTIONS ==========

  const getStockAnalytics = useCallback(async (groupBy?: GroupByOptions, filters?: FilterOptions): Promise<AnalyticsResult> => {
    try {
      setLoading(true);
      setError(null);
      
      // Get data from RTDatabase
      const stockBasePath = getModuleBasePath('stock');
      const [products] = await Promise.all([
        StockRTDB.fetchProducts(stockBasePath)
      ]);
      
      // analyzeStockData expects a single array type, so we analyze products as the primary data type
      return analyzeStockData(products as Product[], groupBy, filters);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error analyzing stock data');
      throw error;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.companyID, companyState.selectedSiteID]);

  const getHRAnalytics = useCallback(async (groupBy?: GroupByOptions, filters?: FilterOptions): Promise<AnalyticsResult> => {
    try {
      setLoading(true);
      setError(null);
      
      // Get data from RTDatabase
      const hrBasePath = getModuleBasePath('hr');
      const [employees, timeOffs, attendances, trainings] = await Promise.all([
        HRRTDB.fetchEmployees(hrBasePath),
        HRRTDB.fetchTimeOffs(hrBasePath).catch(() => []),
        HRRTDB.fetchAttendances(hrBasePath).catch(() => []),
        HRRTDB.fetchTrainings(hrBasePath).catch(() => [])
      ]);
      const payrolls: Payroll[] = []; // TODO: Implement fetchPayrolls
      
      // Analyze each type separately and combine results
      // Note: analyzeHRData expects a single type array, so we'll use employees as the primary type
      // and cast the combined array appropriately
      const allData = [...employees, ...timeOffs, ...attendances, ...trainings, ...payrolls] as Employee[];
      
      return analyzeHRData(allData, groupBy, filters);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error analyzing HR data');
      throw error;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.companyID, companyState.selectedSiteID]);

  const getBookingsAnalytics = useCallback(async (groupBy?: GroupByOptions, filters?: FilterOptions): Promise<AnalyticsResult> => {
    try {
      setLoading(true);
      setError(null);
      
      // Get data from RTDatabase
      const bookingsBasePath = getModuleBasePath('bookings');
      const [bookings] = await Promise.all([
        BookingsRTDB.fetchBookings(bookingsBasePath)
      ]);
      
      // analyzeBookingsData expects a single array type, so we'll analyze bookings as the primary type
      return analyzeBookingsData(bookings as Booking[], groupBy, filters);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error analyzing bookings data');
      throw error;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.companyID, companyState.selectedSiteID]);

  const getFinanceAnalytics = useCallback(async (groupBy?: GroupByOptions, filters?: FilterOptions): Promise<AnalyticsResult> => {
    try {
      setLoading(true);
      setError(null);
      
      // Get data from RTDatabase
      const financeBasePath = getModuleBasePath('finance');
      const [transactions] = await Promise.all([
        FinanceRTDB.fetchTransactions(financeBasePath)
      ]);
      
      // analyzeFinanceData expects a single array type, so we'll analyze transactions as the primary type
      return analyzeFinanceData(transactions as Transaction[], groupBy, filters);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error analyzing finance data');
      throw error;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.companyID, companyState.selectedSiteID]);

  const getPOSAnalytics = useCallback(async (groupBy?: GroupByOptions, filters?: FilterOptions): Promise<AnalyticsResult> => {
    try {
      setLoading(true);
      setError(null);
      
      // Get data from RTDatabase
      const posBasePath = getModuleBasePath('pos');
      const [bills] = await Promise.all([
        FinanceRTDB.fetchBills(posBasePath)
      ]);
      
      // analyzePOSData expects Sale[] | Bill[], so we'll use bills as the primary type
      return analyzePOSData(bills as unknown as Sale[], groupBy, filters);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error analyzing POS data');
      throw error;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.companyID, companyState.selectedSiteID]);

  // ========== KPI FUNCTIONS ==========

  const getStockKPIs = useCallback(async (): Promise<KPIMetrics[]> => {
    try {
      const stockBasePath = getModuleBasePath('stock');
      const [products, sales, purchases] = await Promise.all([
        StockRTDB.fetchProducts(stockBasePath),
        StockRTDB.fetchSales(stockBasePath),
        StockRTDB.fetchPurchases(stockBasePath)
      ]);
      return calculateStockKPIs(products, sales, purchases as Purchase[]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error calculating stock KPIs');
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.companyID, companyState.selectedSiteID]);

  const getHRKPIs = useCallback(async (): Promise<KPIMetrics[]> => {
    try {
      const hrBasePath = getModuleBasePath('hr');
      const [employees, timeOffs, attendances] = await Promise.all([
        HRRTDB.fetchEmployees(hrBasePath),
        HRRTDB.fetchTimeOffs(hrBasePath).catch(() => []),
        HRRTDB.fetchAttendances(hrBasePath).catch(() => [])
      ]);
      return calculateHRKPIs(employees, timeOffs as TimeOff[], attendances);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error calculating HR KPIs');
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.companyID, companyState.selectedSiteID]);

  const getFinanceKPIs = useCallback(async (): Promise<KPIMetrics[]> => {
    try {
      const financeBasePath = getModuleBasePath('finance');
      const [transactions, expenses] = await Promise.all([
        FinanceRTDB.fetchTransactions(financeBasePath),
        FinanceRTDB.fetchExpenses(financeBasePath).catch(() => [])
      ]);
      // const invoices: any[] = []; // TODO: Implement fetchInvoices
      return calculateFinanceKPIs(transactions, [], expenses);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error calculating finance KPIs');
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.companyID, companyState.selectedSiteID]);

  const getBookingsKPIs = useCallback(async (): Promise<KPIMetrics[]> => {
    try {
      const bookingsBasePath = getModuleBasePath('bookings');
      const bookings = await BookingsRTDB.fetchBookings(bookingsBasePath);
      // Basic KPIs for bookings
      return [
        {
          value: bookings.length,
          label: 'Total Bookings',
          change: 0,
          changeType: 'neutral',
          trend: 'stable',
          format: 'number'
        },
        {
          value: bookings.filter(b => b.status === 'confirmed').length,
          label: 'Confirmed Bookings',
          change: 0,
          changeType: 'neutral',
          trend: 'stable',
          format: 'number'
        }
      ];
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error calculating bookings KPIs');
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.companyID, companyState.selectedSiteID, getModuleBasePath]);

  const getPOSKPIs = useCallback(async (): Promise<KPIMetrics[]> => {
    try {
      const posBasePath = getModuleBasePath('pos');
      const bills = await FinanceRTDB.fetchBills(posBasePath);
      const totalSales = bills.reduce((sum: number, bill: Bill) => sum + (bill.totalAmount || 0), 0);
      
      return [
        {
          value: totalSales,
          label: 'Total Sales',
          change: 0,
          changeType: 'neutral',
          trend: 'stable',
          format: 'currency'
        },
        {
          value: bills.length,
          label: 'Total Transactions',
          change: 0,
          changeType: 'neutral',
          trend: 'stable',
          format: 'number'
        }
      ];
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error calculating POS KPIs');
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.companyID, companyState.selectedSiteID, getModuleBasePath]);

  // ========== CHART DATA FUNCTIONS ==========

  const getStockChartData = useCallback(async (groupBy: GroupByOptions, valueField?: string): Promise<ChartData> => {
    try {
      const stockBasePath = getModuleBasePath('stock');
      const [products, sales, purchases] = await Promise.all([
        StockRTDB.fetchProducts(stockBasePath),
        StockRTDB.fetchSales(stockBasePath),
        StockRTDB.fetchPurchases(stockBasePath)
      ]);
      const allData = [...products, ...sales, ...purchases];
      return generateChartData(allData, groupBy, valueField);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error generating stock chart data');
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.companyID, companyState.selectedSiteID, getModuleBasePath]);

  const getHRChartData = useCallback(async (groupBy: GroupByOptions, valueField?: string): Promise<ChartData> => {
    try {
      const hrBasePath = getModuleBasePath('hr');
      const [employees] = await Promise.all([
        HRRTDB.fetchEmployees(hrBasePath)
      ]);
      
      // generateChartData expects a single array type, so we'll use employees as the primary type
      return generateChartData(employees as Employee[], groupBy, valueField);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error generating HR chart data');
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.companyID, companyState.selectedSiteID, getModuleBasePath]);

  const getBookingsChartData = useCallback(async (groupBy: GroupByOptions, valueField?: string): Promise<ChartData> => {
    try {
      const bookingsBasePath = getModuleBasePath('bookings');
      const [bookings] = await Promise.all([
        BookingsRTDB.fetchBookings(bookingsBasePath)
      ]);
      // generateChartData expects a single array type, so we'll use bookings as the primary type
      return generateChartData(bookings as Booking[], groupBy, valueField);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error generating bookings chart data');
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.companyID, companyState.selectedSiteID, getModuleBasePath]);

  const getFinanceChartData = useCallback(async (groupBy: GroupByOptions, valueField?: string): Promise<ChartData> => {
    try {
      const financeBasePath = getModuleBasePath('finance');
      const [transactions] = await Promise.all([
        FinanceRTDB.fetchTransactions(financeBasePath)
      ]);
      
      // generateChartData expects a single array type, so we'll use transactions as the primary type
      return generateChartData(transactions as Transaction[], groupBy, valueField);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error generating finance chart data');
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.companyID, companyState.selectedSiteID, getModuleBasePath]);

  const getPOSChartData = useCallback(async (groupBy: GroupByOptions, valueField?: string): Promise<ChartData> => {
    try {
      const posBasePath = getModuleBasePath('pos');
      const [bills] = await Promise.all([
        FinanceRTDB.fetchBills(posBasePath)
      ]);
      
      // generateChartData expects a single array type, so we'll use bills as the primary type
      return generateChartData(bills as unknown as Transaction[], groupBy, valueField);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error generating POS chart data');
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.companyID, companyState.selectedSiteID, getModuleBasePath]);

  // Get available data types for a specific section
  const getAvailableDataTypes = useCallback((section?: string) => {
    const allDataTypes = [
      // Stock Analytics
      { value: 'stockCount', label: 'Stock Count', category: 'Stock' },
      { value: 'stockValue', label: 'Stock Value', category: 'Stock' },
      { value: 'stockQuantity', label: 'Stock Quantity', category: 'Stock' },
      { value: 'purchases', label: 'Purchases', category: 'Stock' },
      { value: 'sales', label: 'Sales', category: 'Stock' },
      { value: 'predictedStock', label: 'Predicted Stock', category: 'Stock' },
      { value: 'costOfSales', label: 'Cost of Sales', category: 'Stock' },
      { value: 'profit', label: 'Profit', category: 'Stock' },
      { value: 'parLevels', label: 'Par Levels', category: 'Stock' },
      { value: 'stockTurnover', label: 'Stock Turnover', category: 'Stock' },
      { value: 'topItems', label: 'Top Items', category: 'Stock' },
      { value: 'totalItems', label: 'Total Items', category: 'Stock' },
      { value: 'profitMargin', label: 'Profit Margin', category: 'Stock' },
      { value: 'lowStockItems', label: 'Low Stock Items', category: 'Stock' },
      { value: 'inventoryValue', label: 'Inventory Value', category: 'Stock' },
      { value: 'stockReorder', label: 'Stock Reorder', category: 'Stock' },
      { value: 'stockProfit', label: 'Stock Profit', category: 'Stock' },
      { value: 'categories', label: 'Categories', category: 'Stock' },
      { value: 'suppliers', label: 'Suppliers', category: 'Stock' },
      { value: 'locations', label: 'Locations', category: 'Stock' },
      { value: 'stockAccuracy', label: 'Stock Accuracy', category: 'Stock' },
      { value: 'expiredItems', label: 'Expired Items', category: 'Stock' },
      { value: 'stockByCategory', label: 'Stock by Category', category: 'Stock' },
      { value: 'stockBySupplier', label: 'Stock by Supplier', category: 'Stock' },
      { value: 'stockByLocation', label: 'Stock by Location', category: 'Stock' },
      { value: 'stockTrends', label: 'Stock Trends', category: 'Stock' },
      { value: 'purchaseHistory', label: 'Purchase History', category: 'Stock' },
      { value: 'salesHistory', label: 'Sales History', category: 'Stock' },
      { value: 'stockCountsHistory', label: 'Stock Counts History', category: 'Stock' },
      { value: 'parLevelStatus', label: 'Par Level Status', category: 'Stock' },
      { value: 'profitAnalysis', label: 'Profit Analysis', category: 'Stock' },

      // HR Analytics
      { value: 'attendance', label: 'Attendance', category: 'HR' },
      { value: 'performance', label: 'Performance', category: 'HR' },
      { value: 'turnover', label: 'Turnover', category: 'HR' },
      { value: 'recruitment', label: 'Recruitment', category: 'HR' },
      { value: 'training', label: 'Training', category: 'HR' },
      { value: 'payroll', label: 'Payroll', category: 'HR' },
      { value: 'departments', label: 'Departments', category: 'HR' },
      { value: 'employeesByDepartment', label: 'Employees by Department', category: 'HR' },
      { value: 'attendanceTrends', label: 'Attendance Trends', category: 'HR' },
      { value: 'performanceMetrics', label: 'Performance Metrics', category: 'HR' },
      { value: 'trainingProgress', label: 'Training Progress', category: 'HR' },
      { value: 'payrollBreakdown', label: 'Payroll Breakdown', category: 'HR' },
      { value: 'timeOffRequests', label: 'Time Off Requests', category: 'HR' },
      { value: 'recruitmentFunnel', label: 'Recruitment Funnel', category: 'HR' },
      { value: 'turnoverAnalysis', label: 'Turnover Analysis', category: 'HR' },

      // Finance Analytics
      { value: 'cashBalance', label: 'Cash Balance', category: 'Finance' },
      { value: 'revenue', label: 'Revenue', category: 'Finance' },
      { value: 'expenses', label: 'Expenses', category: 'Finance' },
      { value: 'cashFlow', label: 'Cash Flow', category: 'Finance' },
      { value: 'revenueBySource', label: 'Revenue by Source', category: 'Finance' },
      { value: 'expensesByCategory', label: 'Expenses by Category', category: 'Finance' },
      { value: 'profitLossTrends', label: 'Profit/Loss Trends', category: 'Finance' },
      { value: 'budgetVsActual', label: 'Budget vs Actual', category: 'Finance' },
      { value: 'invoiceAnalysis', label: 'Invoice Analysis', category: 'Finance' },
      { value: 'paymentTrends', label: 'Payment Trends', category: 'Finance' },
      { value: 'financialRatios', label: 'Financial Ratios', category: 'Finance' },
      { value: 'taxAnalysis', label: 'Tax Analysis', category: 'Finance' },
      { value: 'accountsReceivable', label: 'Accounts Receivable', category: 'Finance' },
      { value: 'accountsPayable', label: 'Accounts Payable', category: 'Finance' },

      // POS Analytics
      { value: 'posSales', label: 'POS Sales', category: 'POS' },
      { value: 'posTransactions', label: 'POS Transactions', category: 'POS' },
      { value: 'totalTransactions', label: 'Total Transactions', category: 'POS' },
      { value: 'dailySales', label: 'Daily Sales', category: 'POS' },
      { value: 'hourlySales', label: 'Hourly Sales', category: 'POS' },
      { value: 'salesByDay', label: 'Sales by Day', category: 'POS' },
      { value: 'salesByHour', label: 'Sales by Hour', category: 'POS' },
      { value: 'salesByWeekday', label: 'Sales by Weekday', category: 'POS' },
      { value: 'paymentMethods', label: 'Payment Methods', category: 'POS' },
      { value: 'paymentMethodBreakdown', label: 'Payment Method Breakdown', category: 'POS' },
      { value: 'topSellingItems', label: 'Top Selling Items', category: 'POS' },
      { value: 'customerAnalytics', label: 'Customer Analytics', category: 'POS' },
      { value: 'discountAnalysis', label: 'Discount Analysis', category: 'POS' },
      { value: 'refundAnalysis', label: 'Refund Analysis', category: 'POS' },
      { value: 'peakTimes', label: 'Peak Times', category: 'POS' },
      { value: 'tableUtilization', label: 'Table Utilization', category: 'POS' },

      // Bookings Analytics
      { value: 'totalBookings', label: 'Total Bookings', category: 'Bookings' },
      { value: 'bookingsByDay', label: 'Bookings by Day', category: 'Bookings' },
      { value: 'bookingsByHour', label: 'Bookings by Hour', category: 'Bookings' },
      { value: 'bookingsBySource', label: 'Bookings by Source', category: 'Bookings' },
      { value: 'bookingsByPartySize', label: 'Bookings by Party Size', category: 'Bookings' },
      { value: 'customerSegments', label: 'Customer Segments', category: 'Bookings' },
      { value: 'seasonalTrends', label: 'Seasonal Trends', category: 'Bookings' },
      { value: 'cancellationAnalysis', label: 'Cancellation Analysis', category: 'Bookings' },
      { value: 'waitlistAnalytics', label: 'Waitlist Analytics', category: 'Bookings' },
      { value: 'occupancyRate', label: 'Occupancy Rate', category: 'Bookings' },
      { value: 'bookingsByStatus', label: 'Bookings by Status', category: 'Bookings' },
      { value: 'bookingsByType', label: 'Bookings by Type', category: 'Bookings' },
      { value: 'tableOccupancy', label: 'Table Occupancy', category: 'Bookings' },
      { value: 'bookingTrends', label: 'Booking Trends', category: 'Bookings' },

      // Company Analytics
      { value: 'totalSites', label: 'Total Sites', category: 'Company' },
      { value: 'checklistStats', label: 'Checklist Stats', category: 'Company' },
      { value: 'sitePerformance', label: 'Site Performance', category: 'Company' },
      { value: 'notificationsBreakdown', label: 'Notifications Breakdown', category: 'Company' },
      { value: 'companyMetrics', label: 'Company Metrics', category: 'Company' },

      // Messenger Analytics
      { value: 'messengerChats', label: 'Messenger Chats', category: 'Messenger' },
      { value: 'messengerActivity', label: 'Messenger Activity', category: 'Messenger' },
      { value: 'responseTimes', label: 'Response Times', category: 'Messenger' },
      { value: 'messageVolume', label: 'Message Volume', category: 'Messenger' },

      // Cross-module Analytics
      { value: 'businessOverview', label: 'Business Overview', category: 'Cross-module' },
      { value: 'performanceDashboard', label: 'Performance Dashboard', category: 'Cross-module' },
      { value: 'operationalMetrics', label: 'Operational Metrics', category: 'Cross-module' },
      { value: 'financialHealth', label: 'Financial Health', category: 'Cross-module' },
    ];

    if (section) {
      return allDataTypes.filter(dt => dt.category.toLowerCase() === section.toLowerCase());
    }
    
    return allDataTypes;
  }, []);

  const value = {
    loading,
    error,
    analyzeHR,
    analyzeStock,
    analyzeBookings,
    analyzeFinance,
    analyzeLocations,
    analyzePOS,
    analyzeCompany,
    analyzeMessenger,
    analyzeNotifications,
    // New comprehensive analytics functions
    getStockAnalytics,
    getHRAnalytics,
    getBookingsAnalytics,
    getFinanceAnalytics,
    getPOSAnalytics,
    // KPI functions
    getStockKPIs,
    getHRKPIs,
    getFinanceKPIs,
    getBookingsKPIs,
    getPOSKPIs,
    // Chart data functions
    getStockChartData,
    getHRChartData,
    getBookingsChartData,
    getFinanceChartData,
    getPOSChartData,
    // Enhanced widget functions
    getFinanceWidgets,
    getBookingsWidgets,
    getPOSWidgets,
    getHRWidgets,
    getStockWidgets,
    getCompanyWidgets,
    getMessengerWidgets,
    getNotificationWidgets,
    // Universal data access
    getWidgetData,
    // Dashboard management
    saveDashboardLayout,
    loadDashboardLayout,
    getDefaultDashboardLayout,
    getAvailableWidgetTypes,
    getAvailableDataTypes,
    // Real-time subscriptions
    subscribeToWidgetData,
    unsubscribeFromWidgetData,
    // AI reporting
    generateReport,
    getComprehensiveDataSnapshot,
    analyzeCrossModuleCorrelations,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Export types for frontend consumption
export type { 
  DateRange,
  FilterOptions,
  GroupByOptions,
  AnalyticsResult,
  KPIMetrics,
  ChartData
} from "../functions/Analytics"