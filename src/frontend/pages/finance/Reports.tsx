"use client"

import { useState, useEffect, useMemo } from "react"
import type React from "react"
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert
} from "@mui/material"
import { BarChart, TrendingUp, AttachMoney as DollarSign, Description as FileText, PieChart } from "@mui/icons-material"
import { useFinance } from "../../../backend/context/FinanceContext"
import { useCompany } from "../../../backend/context/CompanyContext"
import DataHeader from "../../components/reusable/DataHeader"
import CRUDModal from "../../components/reusable/CRUDModal"
import AnimatedCounter from "../../components/reusable/AnimatedCounter"
import type { Invoice, BankAccount, Expense } from "../../../backend/interfaces/Finance"
import { 
  filterByCompanyContext, 
  safeArray,
  safeNumber,
  safeString 
} from "../../utils/reportHelpers"


const Reports: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const { state: financeState, refreshAll } = useFinance()
  const { state: companyState } = useCompany()
  
  // Date management
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dateType, setDateType] = useState<"day" | "week" | "month" | "custom">("month")
  
  // Filter states
  const [reportTypeFilter, setReportTypeFilter] = useState("All")
  const [createReportDialogOpen, setCreateReportDialogOpen] = useState(false)
  
  // Note: Finance data is loaded automatically by FinanceContext
  // Only refresh if data is missing (e.g., user navigated directly to this page)
  useEffect(() => {
    if (financeState.basePath && financeState.accounts.length === 0 && !financeState.loading) {
      refreshAll()
    }
  }, [financeState.basePath, financeState.accounts.length, financeState.loading, refreshAll])

  const reportCategories = [
    {
      title: "Financial Statements",
      reports: [
        { name: "Profit & Loss", description: "Income and expenses summary", icon: TrendingUp, frequency: "Monthly" },
        {
          name: "Balance Sheet",
          description: "Assets, liabilities, and equity",
          icon: DollarSign,
          frequency: "Monthly",
        },
        { name: "Cash Flow Statement", description: "Cash inflows and outflows", icon: BarChart, frequency: "Monthly" },
        { name: "Trial Balance", description: "Account balances verification", icon: FileText, frequency: "Monthly" },
      ],
    },
    {
      title: "Sales Reports",
      reports: [
        { name: "Sales Summary", description: "Revenue breakdown by period", icon: TrendingUp, frequency: "Weekly" },
        { name: "Customer Analysis", description: "Top customers and trends", icon: PieChart, frequency: "Monthly" },
        { name: "Invoice Aging", description: "Outstanding invoice analysis", icon: FileText, frequency: "Weekly" },
        {
          name: "Sales Tax Report",
          description: "Tax collected and payable",
          icon: DollarSign,
          frequency: "Quarterly",
        },
      ],
    },
    {
      title: "Purchase Reports",
      reports: [
        {
          name: "Purchase Summary",
          description: "Spending analysis by category",
          icon: BarChart,
          frequency: "Monthly",
        },
        { name: "Supplier Analysis", description: "Top suppliers and spending", icon: PieChart, frequency: "Monthly" },
        { name: "Bill Aging", description: "Outstanding bills analysis", icon: FileText, frequency: "Weekly" },
        {
          name: "Expense Analysis",
          description: "Operating expense breakdown",
          icon: TrendingUp,
          frequency: "Monthly",
        },
      ],
    },
  ]

  
  // Calculate report data from financeState with company context filtering
  const filteredInvoices = useMemo((): Invoice[] => {
    try {
      return filterByCompanyContext<Invoice>(
        safeArray(financeState.invoices),
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      )
    } catch (error) {
      console.error("Error filtering invoices:", error)
      return []
    }
  }, [financeState.invoices, companyState.selectedSiteID, companyState.selectedSubsiteID])
  
  const filteredBankAccounts = useMemo((): BankAccount[] => {
    try {
      return filterByCompanyContext<BankAccount>(
        safeArray(financeState.bankAccounts),
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      )
    } catch (error) {
      console.error("Error filtering bank accounts:", error)
      return []
    }
  }, [financeState.bankAccounts, companyState.selectedSiteID, companyState.selectedSubsiteID])
  
  const filteredExpenses = useMemo((): Expense[] => {
    try {
      return filterByCompanyContext<Expense>(
        safeArray(financeState.expenses),
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      )
    } catch (error) {
      console.error("Error filtering expenses:", error)
      return []
    }
  }, [financeState.expenses, companyState.selectedSiteID, companyState.selectedSubsiteID])
  
  // Calculate financial metrics from filtered context data
  const todaySales = useMemo(() => {
    try {
      const today = new Date().toISOString().split('T')[0]
      return filteredInvoices
        .filter(inv => {
          return (inv.issueDate && inv.issueDate.split('T')[0] === today) ||
                 (inv.dueDate && inv.dueDate.split('T')[0] === today)
        })
        .reduce((sum, inv) => sum + safeNumber(inv.totalAmount, 0), 0)
    } catch (error) {
      console.error("Error calculating today's sales:", error)
      return 0
    }
  }, [filteredInvoices])
    
  const outstandingInvoices = useMemo(() => {
    try {
      return filteredInvoices
        .filter(inv => safeString(inv.status) !== 'paid')
        .reduce((sum, inv) => sum + safeNumber(inv.totalAmount, 0), 0)
    } catch (error) {
      console.error("Error calculating outstanding invoices:", error)
      return 0
    }
  }, [filteredInvoices])
  
  const cashBalance = useMemo(() => {
    try {
      return filteredBankAccounts
        .reduce((sum, account) => sum + safeNumber(account.balance, 0), 0)
    } catch (error) {
      console.error("Error calculating cash balance:", error)
      return 0
    }
  }, [filteredBankAccounts])
  
  const monthlyExpenses = useMemo(() => {
    try {
      return filteredExpenses
        .filter(exp => {
          const expenseDate = new Date(exp.submitDate || '')
          const currentMonth = new Date().getMonth()
          const currentYear = new Date().getFullYear()
          return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
        })
        .reduce((sum, exp) => sum + safeNumber(exp.amount, 0), 0)
    } catch (error) {
      console.error("Error calculating monthly expenses:", error)
      return 0
    }
  }, [filteredExpenses])
  

  if (financeState.loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (financeState.error) {
    return (
      <Box sx={{ pt: 3, width: "100%" }}>
        <Alert severity="error">{financeState.error}</Alert>
      </Box>
    )
  }
  
  return (
    <Box sx={{ pt: 3, width: "100%" }}>
      <DataHeader
        onRefresh={refreshAll}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        dateType={dateType}
        onDateTypeChange={setDateType}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={[
          {
            label: "Report Type",
            options: [
              { id: "all", name: "All" },
              { id: "financial", name: "Financial Statements" },
              { id: "sales", name: "Sales Reports" },
              { id: "purchase", name: "Purchase Reports" }
            ],
            selectedValues: [reportTypeFilter],
            onSelectionChange: (values) => setReportTypeFilter(values[0] || "All")
          }
        ]}
        sortOptions={[
          { label: "Name", value: "name" },
          { label: "Frequency", value: "frequency" },
          { label: "Category", value: "category" }
        ]}
        onSortChange={() => {}}
        onExportCSV={() => {}}
        onCreateNew={() => setCreateReportDialogOpen(true)}
        createButtonLabel="Custom Report"
      />

      <Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: "100%", boxShadow: 3, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Today's Sales
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  <AnimatedCounter
                    value={todaySales}
                    prefix="$"
                    suffix=""
                    decimals={0}
                    duration={1000}
                    isCurrency={true}
                  />
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
                  Daily revenue
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: "100%", boxShadow: 3, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Outstanding Invoices
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  <AnimatedCounter
                    value={outstandingInvoices}
                    prefix="$"
                    suffix=""
                    decimals={0}
                    duration={1000}
                    isCurrency={true}
                  />
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
                  Unpaid amounts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: "100%", boxShadow: 3, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Cash Balance
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  <AnimatedCounter
                    value={cashBalance}
                    prefix="$"
                    suffix=""
                    decimals={0}
                    duration={1000}
                    isCurrency={true}
                  />
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
                  Available funds
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: "100%", boxShadow: 3, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Monthly Expenses
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="error.main">
                  <AnimatedCounter
                    value={monthlyExpenses}
                    prefix="$"
                    suffix=""
                    decimals={0}
                    duration={1000}
                    isCurrency={true}
                  />
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
                  Current month
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>


      {reportCategories.map((category) => (
        <Box key={category.title}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {category.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Essential reports for {category.title.toLowerCase()}
              </Typography>
              <Grid container spacing={3}>
                {category.reports
                  .filter(
                    (report) =>
                      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      report.description.toLowerCase().includes(searchTerm.toLowerCase()),
                  )
                  .map((report) => (
                    <Grid item xs={12} sm={6} md={3} key={report.name}>
                      <Card
                        variant="outlined"
                        sx={{
                          cursor: "pointer",
                          "&:hover": { backgroundColor: "action.hover" },
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: "flex", alignItems: "start", gap: 2 }}>
                            <report.icon color="primary" sx={{ mt: 0.5 }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                                {report.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
                                {report.description}
                              </Typography>
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="caption" color="text.secondary">
                                  {report.frequency}
                                </Typography>
                                <Button size="small" variant="text" color="primary" sx={{ p: 0 }}>
                                  Generate
                                </Button>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </CardContent>
          </Card>
        </Box>
      ))}

      {/* Create Custom Report Modal */}
      <CRUDModal
        open={createReportDialogOpen}
        onClose={() => setCreateReportDialogOpen(false)}
        mode="create"
        title="Create Custom Report"
        onSave={async (data: any) => {
          // TODO: Implement custom report creation
          console.log("Creating custom report:", data)
          setCreateReportDialogOpen(false)
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Custom report creation form will be implemented here
          </Typography>
        </Box>
      </CRUDModal>
    </Box>
  )
}

export default Reports
