import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo, useRef, FC } from "react"
import { useCompany } from "./CompanyContext"
import { useSettings } from "./SettingsContext"
import { createNotification } from "../functions/Notifications"
import { measurePerformance } from "../utils/PerformanceTimer"
import { createCachedFetcher } from "../utils/CachedFetcher"

// Import finance functions from RTDatabase
import {
  fetchAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  fetchInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  fetchBills,
  createBill as addBill,
  updateBill,
  deleteBill,
  fetchContacts,
  createContact,
  updateContact,
  deleteContact,
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  fetchTransactions,
  createTransaction,
  fetchBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  fetchReports,
  saveReport,
  deleteReport,
  fetchCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  fetchPayments,
  createPayment,
  updatePayment,
  deletePayment,
  fetchCreditNotes,
  createCreditNote,
  updateCreditNote,
  deleteCreditNote,
  fetchPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  fetchTaxRates,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  // fetchPaymentTerms,
  // createPaymentTerm,
  // fetchBankReconciliations,
  // createBankReconciliation,
  // updateBankReconciliation,
  // fetchJournalEntries,
  // createJournalEntry,
  // updateJournalEntry,
  // deleteJournalEntry,
} from "../rtdatabase/Finance"
import {
  createBankAccountSecureCall,
  updateBankAccountSecureCall,
  fetchBankAccountsSecureCall,
  fetchBankAccountDetailSecureCall,
  deleteBankAccountSecureCall,
} from "../functions/financeSecureClient"

// Import advanced finance functions
import {
  sendInvoice,
  startBankReconciliation,
  formatCurrency,
  getDefaultPaymentTerms,
  convertCurrency,
} from "../functions/FinanceAdvanced"

// Import finance interfaces
import {
  Account,
  Transaction,
  Invoice,
  Bill,
  Contact,
  BankAccount,
  Budget,
  Expense,
  Payment,
  CreditNote,
  PurchaseOrder,
  TaxRate,
  PaymentTerm,
  BankReconciliation,
  FinancialReport,
  Currency,
} from "../interfaces/Finance"

// Finance State Interface
interface FinanceState {
  accounts: Account[]
  transactions: Transaction[]
  invoices: Invoice[]
  bills: Bill[]
  contacts: Contact[]
  bankAccounts: BankAccount[]
  budgets: Budget[]
  expenses: Expense[]
  payments: Payment[]
  creditNotes: CreditNote[]
  purchaseOrders: PurchaseOrder[]
  taxRates: TaxRate[]
  paymentTerms: PaymentTerm[]
  bankReconciliations: BankReconciliation[]
  reports: FinancialReport[]
  currencies: Currency[]
  loading: boolean
  error: string | null
  basePath: string
  dataVersion: number // Increments on data changes to trigger re-renders
}

// Finance Action Types
type FinanceAction =
  | { type: "SET_ACCOUNTS"; payload: Account[] }
  | { type: "SET_TRANSACTIONS"; payload: Transaction[] }
  | { type: "SET_INVOICES"; payload: Invoice[] }
  | { type: "SET_BILLS"; payload: Bill[] }
  | { type: "SET_CONTACTS"; payload: Contact[] }
  | { type: "SET_BANK_ACCOUNTS"; payload: BankAccount[] }
  | { type: "SET_BUDGETS"; payload: Budget[] }
  | { type: "SET_EXPENSES"; payload: Expense[] }
  | { type: "SET_PAYMENTS"; payload: Payment[] }
  | { type: "SET_CREDIT_NOTES"; payload: CreditNote[] }
  | { type: "SET_PURCHASE_ORDERS"; payload: PurchaseOrder[] }
  | { type: "SET_TAX_RATES"; payload: TaxRate[] }
  | { type: "SET_PAYMENT_TERMS"; payload: PaymentTerm[] }
  | { type: "SET_BANK_RECONCILIATIONS"; payload: BankReconciliation[] }
  | { type: "SET_REPORTS"; payload: FinancialReport[] }
  | { type: "SET_CURRENCIES"; payload: Currency[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_BASE_PATH"; payload: string }
  | { 
      type: "BATCH_UPDATE"; 
      payload: {
        accounts?: Account[]
        transactions?: Transaction[]
        invoices?: Invoice[]
        bills?: Bill[]
        contacts?: Contact[]
        bankAccounts?: BankAccount[]
        budgets?: Budget[]
        expenses?: Expense[]
        payments?: Payment[]
        creditNotes?: CreditNote[]
        purchaseOrders?: PurchaseOrder[]
        taxRates?: TaxRate[]
        paymentTerms?: PaymentTerm[]
        bankReconciliations?: BankReconciliation[]
        reports?: FinancialReport[]
        currencies?: Currency[]
      }
    }

// Initial State
const initialState: FinanceState = {
  accounts: [],
  transactions: [],
  invoices: [],
  bills: [],
  contacts: [],
  bankAccounts: [],
  budgets: [],
  expenses: [],
  payments: [],
  creditNotes: [],
  purchaseOrders: [],
  taxRates: [],
  paymentTerms: [],
  bankReconciliations: [],
  reports: [],
  currencies: [],
  loading: false,
  error: null,
  basePath: "",
  dataVersion: 0,
}

// Finance Reducer
const financeReducer = (state: FinanceState, action: FinanceAction): FinanceState => {
  switch (action.type) {
    case "SET_ACCOUNTS":
      return { ...state, accounts: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_TRANSACTIONS":
      return { ...state, transactions: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_INVOICES":
      return { ...state, invoices: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_BILLS":
      return { ...state, bills: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_CONTACTS":
      return { ...state, contacts: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_BANK_ACCOUNTS":
      return { ...state, bankAccounts: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_BUDGETS":
      return { ...state, budgets: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_EXPENSES":
      return { ...state, expenses: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_PAYMENTS":
      return { ...state, payments: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_CREDIT_NOTES":
      return { ...state, creditNotes: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_PURCHASE_ORDERS":
      return { ...state, purchaseOrders: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_TAX_RATES":
      return { ...state, taxRates: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_PAYMENT_TERMS":
      return { ...state, paymentTerms: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_BANK_RECONCILIATIONS":
      return { ...state, bankReconciliations: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_REPORTS":
      return { ...state, reports: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_CURRENCIES":
      return { ...state, currencies: action.payload, dataVersion: state.dataVersion + 1 }
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    case "SET_BASE_PATH":
      return { ...state, basePath: action.payload }
    case "BATCH_UPDATE":
      return {
        ...state,
        ...(action.payload.accounts !== undefined && { accounts: action.payload.accounts }),
        ...(action.payload.transactions !== undefined && { transactions: action.payload.transactions }),
        ...(action.payload.invoices !== undefined && { invoices: action.payload.invoices }),
        ...(action.payload.bills !== undefined && { bills: action.payload.bills }),
        ...(action.payload.contacts !== undefined && { contacts: action.payload.contacts }),
        ...(action.payload.bankAccounts !== undefined && { bankAccounts: action.payload.bankAccounts }),
        ...(action.payload.budgets !== undefined && { budgets: action.payload.budgets }),
        ...(action.payload.expenses !== undefined && { expenses: action.payload.expenses }),
        ...(action.payload.payments !== undefined && { payments: action.payload.payments }),
        ...(action.payload.creditNotes !== undefined && { creditNotes: action.payload.creditNotes }),
        ...(action.payload.purchaseOrders !== undefined && { purchaseOrders: action.payload.purchaseOrders }),
        ...(action.payload.taxRates !== undefined && { taxRates: action.payload.taxRates }),
        ...(action.payload.paymentTerms !== undefined && { paymentTerms: action.payload.paymentTerms }),
        ...(action.payload.bankReconciliations !== undefined && { bankReconciliations: action.payload.bankReconciliations }),
        ...(action.payload.reports !== undefined && { reports: action.payload.reports }),
        ...(action.payload.currencies !== undefined && { currencies: action.payload.currencies }),
        dataVersion: state.dataVersion + 1 // Increment version once for the batch update
      }
    default:
      return state
  }
}

// Finance Context Type
interface FinanceContextType {
  state: FinanceState
  dispatch: React.Dispatch<FinanceAction>
  // Permission functions
  canViewFinance: () => boolean
  canEditFinance: () => boolean
  canDeleteFinance: () => boolean
  isOwner: () => boolean
  // Refresh functions
  refreshAccounts: () => Promise<void>
  refreshTransactions: () => Promise<void>
  refreshInvoices: () => Promise<void>
  refreshBills: () => Promise<void>
  refreshContacts: () => Promise<void>
  refreshBankAccounts: () => Promise<void>
  refreshBudgets: () => Promise<void>
  refreshExpenses: () => Promise<void>
  refreshPayments: () => Promise<void>
  refreshCreditNotes: () => Promise<void>
  refreshPurchaseOrders: () => Promise<void>
  refreshTaxRates: () => Promise<void>
  refreshPaymentTerms: () => Promise<void>
  refreshBankReconciliations: () => Promise<void>
  refreshReports: () => Promise<void>
  refreshCurrencies: () => Promise<void>
  refreshAll: () => Promise<void>
  // Account operations
  createAccount: (account: Omit<Account, "id">) => Promise<void>
  updateAccount: (accountId: string, updates: Partial<Account>) => Promise<void>
  deleteAccount: (accountId: string) => Promise<void>
  // Invoice operations
  createInvoice: (invoice: any) => Promise<void>
  updateInvoice: (invoiceId: string, updates: any) => Promise<void>
  deleteInvoice: (invoiceId: string) => Promise<void>
  sendInvoice: (invoiceId: string) => Promise<void>
  markInvoicePaid: (invoiceId: string, paymentAmount: number) => Promise<void>
  // Bill operations
  createBill: (bill: Omit<Bill, "id">) => Promise<void>
  updateBill: (billId: string, updates: Partial<Bill>) => Promise<void>
  deleteBill: (billId: string) => Promise<void>
  approveBill: (billId: string) => Promise<void>
  markBillPaid: (billId: string, paymentAmount: number) => Promise<void>
  // Contact operations
  createContact: (contact: Omit<Contact, "id">) => Promise<void>
  updateContact: (contactId: string, updates: Partial<Contact>) => Promise<void>
  deleteContact: (contactId: string) => Promise<void>
  // Payment operations
  createPayment: (payment: Partial<Payment>) => Promise<void>
  updatePayment: (paymentId: string, updates: Partial<Payment>) => Promise<void>
  deletePayment: (paymentId: string) => Promise<void>
  allocatePayment: (paymentId: string, allocations: any[]) => Promise<void>
  // Bank operations
  createBankAccount: (bankAccount: Omit<BankAccount, "id">) => Promise<void>
  updateBankAccount: (bankAccountId: string, updates: Partial<BankAccount>) => Promise<void>
  deleteBankAccount: (bankAccountId: string) => Promise<void>
  /** Fetch full bank account (decrypted) for edit - list returns non-sensitive only */
  fetchBankAccountDetail: (bankAccountId: string) => Promise<BankAccount | null>
  startReconciliation: (bankAccountId: string, statementDate: Date, closingBalance?: number, reconciledBy?: string) => Promise<void>
  reconcileTransaction: (transactionId: string, statementLineId: string) => Promise<void>
  completeReconciliation: (reconciliationId: string) => Promise<void>
  // Credit Note operations
  createCreditNote: (creditNote: Omit<CreditNote, "id">) => Promise<void>
  updateCreditNote: (creditNoteId: string, updates: Partial<CreditNote>) => Promise<void>
  deleteCreditNote: (creditNoteId: string) => Promise<void>
  // Purchase Order operations
  createPurchaseOrder: (purchaseOrder: Omit<PurchaseOrder, "id">) => Promise<void>
  updatePurchaseOrder: (purchaseOrderId: string, updates: Partial<PurchaseOrder>) => Promise<void>
  deletePurchaseOrder: (purchaseOrderId: string) => Promise<void>
  // Tax Rate operations
  createTaxRate: (taxRate: Omit<TaxRate, "id">) => Promise<void>
  updateTaxRate: (taxRateId: string, updates: Partial<TaxRate>) => Promise<void>
  deleteTaxRate: (taxRateId: string) => Promise<void>
  // Budget operations
  createBudget: (budget: Omit<Budget, "id">) => Promise<void>
  updateBudget: (budgetId: string, updates: Partial<Budget>) => Promise<void>
  deleteBudget: (budgetId: string) => Promise<void>
  // Currency operations
  createCurrency: (currency: Currency) => Promise<void>
  updateCurrency: (currencyCode: string, updates: Partial<Currency>) => Promise<void>
  deleteCurrency: (currencyCode: string) => Promise<void>
  // Report operations
  generateReport: (reportType: string, period: any, parameters?: any) => Promise<void>
  saveReport: (report: Omit<FinancialReport, "id">) => Promise<void>
  deleteReport: (reportId: string) => Promise<void>
  // Expense operations
  createExpense: (expense: Omit<Expense, "id">) => Promise<void>
  updateExpense: (expenseId: string, updates: Partial<Expense>) => Promise<void>
  deleteExpense: (expenseId: string) => Promise<void>
  approveExpense: (expenseId: string) => Promise<void>
  rejectExpense: (expenseId: string) => Promise<void>
  reimburseExpense: (expenseId: string) => Promise<void>
  // Transaction operations
  createTransaction: (transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => Promise<void>
  // Utility functions
  calculateTax: (amount: number, taxRateId: string) => number
  convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) => Promise<number>
  formatCurrency: (amount: number, currency?: string) => string
  getAccountBalance: (accountId: string) => number
  getOutstandingInvoices: () => Invoice[]
  getOverdueBills: () => Bill[]
  getCashFlowProjection: (months: number) => any[]
}

// Finance Provider Props
interface FinanceProviderProps {
  children: React.ReactNode
}

// Create Finance Context
const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

// Finance Provider Component
export const FinanceProvider: FC<FinanceProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(financeReducer, initialState)
  const { state: companyState, isOwner, hasPermission } = useCompany()
  const { state: settingsState } = useSettings()

  // Multi-path loading functions
  const getFinancePaths = useCallback(() => {
    const paths: string[] = []
    
    if (companyState.companyID && companyState.selectedSiteID) {
      // Add subsite path first if subsite is selected
      if (companyState.selectedSubsiteID) {
        paths.push(`companies/${companyState.companyID}/sites/${companyState.selectedSiteID}/subsites/${companyState.selectedSubsiteID}/data/finance`)
      }
      // Add site path as fallback
      paths.push(`companies/${companyState.companyID}/sites/${companyState.selectedSiteID}/data/finance`)
    }
    
    return paths
  }, [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID])

  const getFinanceWritePath = useCallback(() => {
    if (companyState.companyID && companyState.selectedSiteID) {
      // Prioritize subsite for write operations if available
      if (companyState.selectedSubsiteID) {
        return `companies/${companyState.companyID}/sites/${companyState.selectedSiteID}/subsites/${companyState.selectedSubsiteID}/data/finance`
      }
      return `companies/${companyState.companyID}/sites/${companyState.selectedSiteID}/data/finance`
    }
    return ''
  }, [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID])

  // Update base path when company context changes
  useEffect(() => {
    const paths = getFinancePaths()
    if (paths.length > 0) {
      dispatch({ type: "SET_BASE_PATH", payload: paths[0] })
    }
  }, [getFinancePaths])

  // Refresh functions with multi-path loading
  const refreshAccounts = useCallback(async () => {
    const paths = getFinancePaths()
    if (paths.length === 0) return
    
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      
      for (const path of paths) {
        try {
          const accounts = await fetchAccounts(path)
          if (accounts && accounts.length > 0) {
            dispatch({ type: "SET_ACCOUNTS", payload: accounts })
            console.log(`All accounts loaded from path: ${path}`)
            break
          }
        } catch (error) {
          console.warn(`Failed to load accounts from ${path}:`, error)
        }
      }
    } catch (error) {
      console.error("Error fetching accounts:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch accounts" })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [getFinancePaths])

  const refreshTransactions = useCallback(async () => {
    const paths = getFinancePaths()
    if (paths.length === 0) return
    
    try {
      for (const path of paths) {
        try {
          const transactions = await fetchTransactions(path)
          if (transactions && transactions.length > 0) {
            dispatch({ type: "SET_TRANSACTIONS", payload: transactions })
            console.log(`All transactions loaded from path: ${path}`)
            break
          }
        } catch (error) {
          console.warn(`Failed to load transactions from ${path}:`, error)
        }
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    }
  }, [getFinancePaths])

  const refreshInvoices = useCallback(async () => {
    const paths = getFinancePaths()
    if (paths.length === 0) return
    
    try {
      for (const path of paths) {
        try {
          const invoices = await fetchInvoices(path)
          if (invoices && invoices.length > 0) {
            dispatch({ type: "SET_INVOICES", payload: invoices })
            console.log(`All invoices loaded from path: ${path}`)
            break
          }
        } catch (error) {
          console.warn(`Failed to load invoices from ${path}:`, error)
        }
      }
    } catch (error) {
      console.error("Error fetching invoices:", error)
    }
  }, [getFinancePaths])

  const refreshBills = useCallback(async () => {
    const paths = getFinancePaths()
    if (paths.length === 0) return
    
    try {
      for (const path of paths) {
        try {
          const bills = await fetchBills(path)
          if (bills && bills.length > 0) {
            dispatch({ type: "SET_BILLS", payload: bills })
            console.log(`All bills loaded from path: ${path}`)
            break
          }
        } catch (error) {
          console.warn(`Failed to load bills from ${path}:`, error)
        }
      }
    } catch (error) {
      console.error("Error fetching bills:", error)
    }
  }, [getFinancePaths])

  const refreshContacts = useCallback(async () => {
    const paths = getFinancePaths()
    if (paths.length === 0) return
    
    try {
      for (const path of paths) {
        try {
          const contacts = await fetchContacts(path)
          if (contacts && contacts.length > 0) {
            dispatch({ type: "SET_CONTACTS", payload: contacts })
            console.log(`All contacts loaded from path: ${path}`)
            break
          }
        } catch (error) {
          console.warn(`Failed to load contacts from ${path}:`, error)
        }
      }
    } catch (error) {
      console.error("Error fetching contacts:", error)
    }
  }, [getFinancePaths])

  const refreshBankAccounts = useCallback(async () => {
    const paths = getFinancePaths()
    if (paths.length === 0) return

    try {
      for (const path of paths) {
        try {
          const bankAccounts = await fetchBankAccountsSecureCall(path)
          if (bankAccounts && bankAccounts.length > 0) {
            dispatch({ type: "SET_BANK_ACCOUNTS", payload: bankAccounts as BankAccount[] })
            console.log(`All bank accounts loaded from secure path: ${path}`)
            break
          }
        } catch (error) {
          console.warn(`Failed to load bank accounts from secure Function ${path}:`, error)
        }
      }
    } catch (error) {
      console.error("Error fetching bank accounts:", error)
    }
  }, [getFinancePaths])

  const refreshBudgets = useCallback(async () => {
    const paths = getFinancePaths()
    if (paths.length === 0) return
    
    try {
      for (const path of paths) {
        try {
          const budgets = await fetchBudgets(path)
          if (budgets && budgets.length > 0) {
            dispatch({ type: "SET_BUDGETS", payload: budgets })
            console.log(`All budgets loaded from path: ${path}`)
            break
          }
        } catch (error) {
          console.warn(`Failed to load budgets from ${path}:`, error)
        }
      }
    } catch (error) {
      console.error("Error fetching budgets:", error)
    }
  }, [getFinancePaths])

  const refreshExpenses = useCallback(async () => {
    const paths = getFinancePaths()
    if (paths.length === 0) return
    
    try {
      for (const path of paths) {
        try {
          const expenses = await fetchExpenses(path)
          if (expenses && expenses.length > 0) {
            dispatch({ type: "SET_EXPENSES", payload: expenses })
            console.log(`All expenses loaded from path: ${path}`)
            break
          }
        } catch (error) {
          console.warn(`Failed to load expenses from ${path}:`, error)
        }
      }
    } catch (error) {
      console.error("Error fetching expenses:", error)
    }
  }, [getFinancePaths])

  const refreshPayments = useCallback(async () => {
    const paths = getFinancePaths()
    if (paths.length === 0) return
    
    try {
      for (const path of paths) {
        try {
          const payments = await fetchPayments(path)
          if (payments && payments.length > 0) {
            dispatch({ type: "SET_PAYMENTS", payload: payments })
            console.log(`All payments loaded from path: ${path}`)
            break
          }
        } catch (error) {
          console.warn(`Failed to load payments from ${path}:`, error)
        }
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
    }
  }, [getFinancePaths])

  const refreshCreditNotes = useCallback(async () => {
    const paths = getFinancePaths()
    if (paths.length === 0) return
    
    try {
      for (const path of paths) {
        try {
          const creditNotes = await fetchCreditNotes(path)
          if (creditNotes && creditNotes.length > 0) {
            dispatch({ type: "SET_CREDIT_NOTES", payload: creditNotes })
            console.log(`All credit notes loaded from path: ${path}`)
            break
          }
        } catch (error) {
          console.warn(`Failed to load credit notes from ${path}:`, error)
        }
      }
    } catch (error) {
      console.error("Error fetching credit notes:", error)
    }
  }, [getFinancePaths])

  const refreshPurchaseOrders = useCallback(async () => {
    const paths = getFinancePaths()
    if (paths.length === 0) return
    
    try {
      for (const path of paths) {
        try {
          const purchaseOrders = await fetchPurchaseOrders(path)
          if (purchaseOrders && purchaseOrders.length > 0) {
            dispatch({ type: "SET_PURCHASE_ORDERS", payload: purchaseOrders })
            console.log(`All purchase orders loaded from path: ${path}`)
            break
          }
        } catch (error) {
          console.warn(`Failed to load purchase orders from ${path}:`, error)
        }
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error)
    }
  }, [getFinancePaths])

  const refreshTaxRates = useCallback(async () => {
    const paths = getFinancePaths()
    if (paths.length === 0) return
    
    try {
      for (const path of paths) {
        try {
          const taxRates = await fetchTaxRates(path)
          if (taxRates && taxRates.length > 0) {
            dispatch({ type: "SET_TAX_RATES", payload: taxRates })
            console.log(`All tax rates loaded from path: ${path}`)
            break
          }
        } catch (error) {
          console.warn(`Failed to load tax rates from ${path}:`, error)
        }
      }
    } catch (error) {
      console.error("Error fetching tax rates:", error)
    }
  }, [getFinancePaths])

  const refreshPaymentTerms = useCallback(async () => {
    if (!state.basePath) return
    try {
      const paymentTerms = await getDefaultPaymentTerms()
      dispatch({ type: "SET_PAYMENT_TERMS", payload: paymentTerms })
    } catch (error) {
      console.error("Error fetching payment terms:", error)
    }
  }, [state.basePath])

  const refreshBankReconciliations = useCallback(async () => {
    if (!state.basePath) return
    try {
      // Bank reconciliations will be fetched when the function is implemented
      // For now, set empty array to avoid errors
      dispatch({ type: "SET_BANK_RECONCILIATIONS", payload: [] })
    } catch (error) {
      console.error("Error fetching bank reconciliations:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch bank reconciliations" })
    }
  }, [state.basePath])

  const refreshReports = useCallback(async () => {
    if (!state.basePath) return
    try {
      const reports = await fetchReports(state.basePath)
      dispatch({ type: "SET_REPORTS", payload: reports })
    } catch (error) {
      console.error("Error fetching reports:", error)
    }
  }, [state.basePath])

  const refreshCurrencies = useCallback(async () => {
    if (!state.basePath) return
    try {
      const currencies = await fetchCurrencies(state.basePath)
      dispatch({ type: "SET_CURRENCIES", payload: currencies })
    } catch (error) {
      console.error("Error fetching currencies:", error)
    }
  }, [state.basePath])

  // Create cached fetchers for critical data
  const fetchAccountsCached = useMemo(() => createCachedFetcher(fetchAccounts, 'accounts'), [])
  const fetchTransactionsCached = useMemo(() => createCachedFetcher(fetchTransactions, 'transactions'), [])
  const fetchInvoicesCached = useMemo(() => createCachedFetcher(fetchInvoices, 'invoices'), [])
  const fetchBillsCached = useMemo(() => createCachedFetcher(fetchBills, 'bills'), [])
  const fetchContactsCached = useMemo(() => createCachedFetcher(fetchContacts, 'contacts'), [])

  // Track if we're currently loading to prevent duplicate loads
  const isLoadingRef = useRef(false)
  const lastLoadedPathRef = useRef<string>("")

  const refreshAll = useCallback(async () => {
    const paths = getFinancePaths()
    if (paths.length === 0) {
      dispatch({ type: "SET_LOADING", payload: false })
      return
    }
    
    const basePath = state.basePath || paths[0]
    
    // Prevent duplicate loading for same path if already loaded or loading
    if (basePath === lastLoadedPathRef.current && (isLoadingRef.current || state.accounts.length > 0)) {
      console.log("💰 FinanceContext: Already loaded data for path, skipping:", basePath)
      dispatch({ type: "SET_LOADING", payload: false })
      return
    }
    
    // Mark as loading and update last loaded path
    isLoadingRef.current = true
    lastLoadedPathRef.current = basePath
    
    await measurePerformance('FinanceContext', 'refreshAll', async () => {
      dispatch({ type: "SET_LOADING", payload: true })
      
      try {
        // Helper to fetch from first available path
        const fetchFromPaths = async <T,>(fetchFn: (path: string) => Promise<T[]>): Promise<T[]> => {
          for (const path of paths) {
            try {
              const data = await fetchFn(path)
              if (data && data.length > 0) return data
            } catch (error) {
              console.warn(`Failed to load from ${path}:`, error)
              continue
            }
          }
          return []
        }
        
        // PROGRESSIVE LOADING: Critical data first (for immediate UI)
        const [accounts, transactions, invoices] = await Promise.all([
          fetchAccountsCached(basePath, false).catch(() => fetchFromPaths(fetchAccounts)),
          fetchTransactionsCached(basePath, false).catch(() => fetchFromPaths(fetchTransactions)),
          fetchInvoicesCached(basePath, false).catch(() => fetchFromPaths(fetchInvoices)),
        ])
        
        // Update critical data immediately
        dispatch({ 
          type: "BATCH_UPDATE", 
          payload: {
            accounts: accounts || [],
            transactions: transactions || [],
            invoices: invoices || [],
          }
        })
        
        console.log("💰 FinanceContext: Critical data loaded (accounts, transactions, invoices) for", basePath)
        
        // BACKGROUND: Load non-critical data after (non-blocking)
        const loadBackgroundData = () => {
          Promise.all([
            fetchBillsCached(basePath, false).catch(() => fetchFromPaths(fetchBills)),
            fetchContactsCached(basePath, false).catch(() => fetchFromPaths(fetchContacts)),
            fetchFromPaths(fetchBankAccountsSecureCall),
            fetchFromPaths(fetchBudgets),
            fetchFromPaths(fetchExpenses),
            fetchFromPaths(fetchPayments),
            fetchFromPaths(fetchCreditNotes),
            fetchFromPaths(fetchPurchaseOrders),
            fetchFromPaths(fetchTaxRates),
            basePath ? Promise.resolve(getDefaultPaymentTerms()).catch(() => []) : Promise.resolve([]),
            Promise.resolve([]), // Bank reconciliations not implemented yet
            basePath ? fetchReports(basePath).catch(() => []) : Promise.resolve([]),
            basePath ? fetchCurrencies(basePath).catch(() => []) : Promise.resolve([]),
          ]).then(([
            bills, contacts, bankAccounts, budgets, expenses, payments,
            creditNotes, purchaseOrders, taxRates, paymentTerms,
            bankReconciliations, reports, currencies
          ]) => {
            dispatch({
              type: "BATCH_UPDATE",
              payload: {
                bills: bills || [],
                contacts: contacts || [],
                bankAccounts: (bankAccounts || []) as BankAccount[],
                budgets: budgets || [],
                expenses: expenses || [],
                payments: payments || [],
                creditNotes: creditNotes || [],
                purchaseOrders: purchaseOrders || [],
                taxRates: taxRates || [],
                paymentTerms: paymentTerms || [],
                bankReconciliations: bankReconciliations || [],
                reports: reports || [],
                currencies: currencies || [],
              }
            })
            console.log("💰 FinanceContext: Background data loaded for", basePath)
          }).catch(error => {
            console.warn('Error loading background finance data:', error)
          })
        }
        
        // Use requestIdleCallback if available, otherwise setTimeout
        if ('requestIdleCallback' in window) {
          requestIdleCallback(loadBackgroundData, { timeout: 2000 })
        } else {
          setTimeout(loadBackgroundData, 100)
        }
        
      } catch (error) {
        console.error("Error loading finance data:", error)
        dispatch({ type: "SET_ERROR", payload: "Failed to load finance data" })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
        isLoadingRef.current = false
      }
    }, () => ({
      accounts: state.accounts?.length || 0,
      transactions: state.transactions?.length || 0,
      invoices: state.invoices?.length || 0,
    }))
  }, [getFinancePaths, state.basePath, fetchAccountsCached, fetchTransactionsCached, fetchInvoicesCached, fetchBillsCached, fetchContactsCached])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: FinanceContextType = useMemo(() => ({
    state,
    dispatch,
    refreshAccounts,
    refreshTransactions,
    refreshInvoices,
    refreshBills,
    refreshContacts,
    refreshBankAccounts,
    refreshBudgets,
    refreshExpenses,
    refreshPayments,
    refreshCreditNotes,
    refreshPurchaseOrders,
    refreshTaxRates,
    refreshPaymentTerms,
    refreshBankReconciliations,
    refreshReports,
    refreshCurrencies,
    refreshAll,
    createAccount: async (account: Omit<Account, "id">) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await createAccount(writePath, account)
      await refreshAccounts()
    },
    updateAccount: async (accountId: string, updates: Partial<Account>) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await updateAccount(writePath, accountId, updates)
      await refreshAccounts()
    },
    deleteAccount: async (accountId) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await deleteAccount(writePath, accountId)
      await refreshAccounts()
    },
    createInvoice: async (invoice) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await createInvoice(writePath, invoice)
      
      // Add notification
      try {
        await createNotification(
          companyState.companyID,
          settingsState.auth?.uid || 'system',
          'finance',
          'created',
          'Invoice Created',
          `Invoice ${invoice.invoiceNumber || 'new invoice'} was created`,
          {
            siteId: companyState.selectedSiteID || undefined,
            priority: 'medium',
            category: 'success',
            details: {
              entityId: invoice.id,
              entityName: `Invoice ${invoice.invoiceNumber}`,
              newValue: invoice,
              changes: {
                invoice: { from: {}, to: invoice }
              }
            }
          }
        )
      } catch (notificationError) {
        console.warn('Failed to create notification:', notificationError)
      }
      
      await refreshInvoices()
    },
    updateInvoice: async (invoiceId: string, updates: any) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await updateInvoice(writePath, invoiceId, updates)
      await refreshInvoices()
    },
    deleteInvoice: async (invoiceId: string) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await deleteInvoice(writePath, invoiceId)
      await refreshInvoices()
    },
    sendInvoice: async (invoiceId: string) => {
      if (!state.basePath) return
      await sendInvoice(state.basePath, invoiceId)
      await refreshInvoices()
    },
    markInvoicePaid: async (_invoiceId: string, _paymentAmount: number) => {
      if (!state.basePath) return
      // markInvoicePaid function not implemented in backend yet
      console.warn('markInvoicePaid not implemented')
      await refreshInvoices()
    },
    createBill: async (bill: Omit<Bill, "id">) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await addBill(writePath, bill)
      
      // Add notification
      try {
        await createNotification(
          companyState.companyID,
          settingsState.auth?.uid || 'system',
          'finance',
          'created',
          'Bill Created',
          `Bill ${bill.billNumber || 'new bill'} was created`,
          {
            siteId: companyState.selectedSiteID || undefined,
            priority: 'medium',
            category: 'info',
            details: {
              entityId: bill.billNumber || 'new-bill',
              entityName: `Bill ${bill.billNumber}`,
              newValue: bill,
              changes: {
                bill: { from: {}, to: bill }
              }
            }
          }
        )
      } catch (notificationError) {
        console.warn('Failed to create notification:', notificationError)
      }
      
      await refreshBills()
    },
    updateBill: async (billId: string, updates: Partial<Bill>) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await updateBill(writePath, billId, updates)
      await refreshBills()
    },
    deleteBill: async (billId: string) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await deleteBill(writePath, billId)
      await refreshBills()
    },
    approveBill: async (_billId: string) => {
      if (!state.basePath) return
      // approveBill function not implemented in backend yet
      console.warn('approveBill not implemented')
      await refreshBills()
    },
    markBillPaid: async (_billId: string, _paymentAmount: number) => {
      if (!state.basePath) return
      // markBillPaid function not implemented in backend yet
      console.warn('markBillPaid not implemented')
      await refreshBills()
    },
    createContact: async (contact: Omit<Contact, "id">) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await createContact(writePath, contact)
      await refreshContacts()
    },
    updateContact: async (contactId: string, updates: Partial<Contact>) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await updateContact(writePath, contactId, updates)
      await refreshContacts()
    },
    deleteContact: async (contactId: string) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await deleteContact(writePath, contactId)
      await refreshContacts()
    },
    createPayment: async (payment: Partial<Payment>) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await createPayment(writePath, payment as Omit<Payment, "id">)
      await refreshPayments()
    },
    allocatePayment: async (paymentId: string, allocations: any[]) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await updatePayment(writePath, paymentId, { allocations })
      await refreshPayments()
    },
    startReconciliation: async (bankAccountId: string, statementDate: Date, closingBalance: number = 0, reconciledBy: string = "system") => {
      if (!state.basePath) return
      await startBankReconciliation(state.basePath, bankAccountId, statementDate.toISOString(), closingBalance, reconciledBy)
      await refreshBankReconciliations()
    },
    reconcileTransaction: async (_transactionId: string, _statementLineId: string) => {
      if (!state.basePath) return
      // reconcileTransaction function not implemented in backend yet
      console.warn('reconcileTransaction not implemented')
      await refreshBankReconciliations()
    },
    completeReconciliation: async (_reconciliationId: string) => {
      if (!state.basePath) return
      // completeReconciliation function not implemented in backend yet
      console.warn('completeReconciliation not implemented')
      await refreshBankReconciliations()
    },
    generateReport: async (_reportType: string, _period: any, _parameters?: any) => {
      if (!state.basePath) return
      // generateReport function not implemented in backend yet
      console.warn('generateReport not implemented')
      await refreshReports()
    },
    calculateTax: (_amount: number, _taxRateId: string) => {
      // calculateTax function not implemented in backend yet
      console.warn('calculateTax not implemented')
      return 0
    },
    convertCurrency: async (amount: number, fromCurrency: string, toCurrency: string) => {
      return await convertCurrency(amount, fromCurrency, toCurrency)
    },
    formatCurrency: (amount: number, currency?: string) => formatCurrency(amount, currency || 'GBP'),
    getAccountBalance: (accountId: string) => {
      // getAccountBalance utility function not implemented yet
      const account = state.accounts.find(acc => acc.id === accountId)
      return account ? account.balance || 0 : 0
    },
    getOutstandingInvoices: () => {
      // getOutstandingInvoices utility function not implemented yet
      return state.invoices.filter(invoice => invoice.status === 'draft' || invoice.status === 'sent')
    },
    getOverdueBills: () => {
      // getOverdueBills utility function not implemented yet
      const today = new Date()
      return state.bills.filter(bill => new Date(bill.dueDate) < today && bill.status !== 'paid')
    },
    getCashFlowProjection: (_months: number) => {
      // getCashFlowProjection utility function not implemented yet
      console.warn('getCashFlowProjection not implemented')
      return []
    },
    createExpense: async (expense: Omit<Expense, "id">) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await createExpense(writePath, expense)
      await refreshExpenses()
    },
    updateExpense: async (expenseId: string, updates: Partial<Expense>) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await updateExpense(writePath, expenseId, updates)
      await refreshExpenses()
    },
    deleteExpense: async (expenseId: string) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await deleteExpense(writePath, expenseId)
      await refreshExpenses()
    },
    approveExpense: async (expenseId: string) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await updateExpense(writePath, expenseId, { status: "approved" })
      await refreshExpenses()
    },
    rejectExpense: async (expenseId: string) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await updateExpense(writePath, expenseId, { status: "rejected" })
      await refreshExpenses()
    },
    reimburseExpense: async (expenseId: string) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await updateExpense(writePath, expenseId, { status: "reimbursed" })
      await refreshExpenses()
    },
    // Bank Account operations - use secure Functions (server-side encryption)
    createBankAccount: async (bankAccount: Omit<BankAccount, "id">) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await createBankAccountSecureCall(writePath, bankAccount as Record<string, unknown>)
      await refreshBankAccounts()
    },
    updateBankAccount: async (bankAccountId: string, updates: Partial<BankAccount>) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await updateBankAccountSecureCall(writePath, bankAccountId, updates as Record<string, unknown>)
      await refreshBankAccounts()
    },
    deleteBankAccount: async (bankAccountId: string) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await deleteBankAccountSecureCall(writePath, bankAccountId)
      await refreshBankAccounts()
    },
    fetchBankAccountDetail: async (bankAccountId: string) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return null
      const detail = await fetchBankAccountDetailSecureCall(writePath, bankAccountId)
      return detail as unknown as BankAccount | null
    },
    // Credit Note operations
    createCreditNote: async (creditNote: Omit<CreditNote, "id">) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await createCreditNote(writePath, creditNote)
      await refreshCreditNotes()
    },
    updateCreditNote: async (creditNoteId: string, updates: Partial<CreditNote>) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await updateCreditNote(writePath, creditNoteId, updates)
      await refreshCreditNotes()
    },
    deleteCreditNote: async (creditNoteId: string) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await deleteCreditNote(writePath, creditNoteId)
      await refreshCreditNotes()
    },
    // Purchase Order operations
    createPurchaseOrder: async (purchaseOrder: Omit<PurchaseOrder, "id">) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await createPurchaseOrder(writePath, purchaseOrder)
      await refreshPurchaseOrders()
    },
    updatePurchaseOrder: async (purchaseOrderId: string, updates: Partial<PurchaseOrder>) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await updatePurchaseOrder(writePath, purchaseOrderId, updates)
      await refreshPurchaseOrders()
    },
    deletePurchaseOrder: async (purchaseOrderId: string) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await deletePurchaseOrder(writePath, purchaseOrderId)
      await refreshPurchaseOrders()
    },
    // Tax Rate operations
    createTaxRate: async (taxRate: Omit<TaxRate, "id">) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await createTaxRate(writePath, taxRate)
      await refreshTaxRates()
    },
    updateTaxRate: async (taxRateId: string, updates: Partial<TaxRate>) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await updateTaxRate(writePath, taxRateId, updates)
      await refreshTaxRates()
    },
    deleteTaxRate: async (taxRateId: string) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await deleteTaxRate(writePath, taxRateId)
      await refreshTaxRates()
    },
    // Budget operations
    createBudget: async (budget: Omit<Budget, "id">) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await createBudget(writePath, budget)
      await refreshBudgets()
    },
    updateBudget: async (budgetId: string, updates: Partial<Budget>) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await updateBudget(writePath, budgetId, updates)
      await refreshBudgets()
    },
    deleteBudget: async (budgetId: string) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await deleteBudget(writePath, budgetId)
      await refreshBudgets()
    },
    // Currency operations
    createCurrency: async (currency: Currency) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await createCurrency(writePath, currency)
      await refreshCurrencies()
    },
    updateCurrency: async (currencyCode: string, updates: Partial<Currency>) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await updateCurrency(writePath, currencyCode, updates)
      await refreshCurrencies()
    },
    deleteCurrency: async (currencyCode: string) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await deleteCurrency(writePath, currencyCode)
      await refreshCurrencies()
    },
    // Payment operations
    updatePayment: async (paymentId: string, updates: Partial<Payment>) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await updatePayment(writePath, paymentId, updates)
      await refreshPayments()
    },
    deletePayment: async (paymentId: string) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await deletePayment(writePath, paymentId)
      await refreshPayments()
    },
    // Report operations
    saveReport: async (report: Omit<FinancialReport, "id">) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await saveReport(writePath, report)
      await refreshReports()
    },
    deleteReport: async (reportId: string) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await deleteReport(writePath, reportId)
      await refreshReports()
    },
    // Transaction operations
    createTransaction: async (transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => {
      const writePath = getFinanceWritePath()
      if (!writePath) return
      await createTransaction(writePath, transaction)
      await refreshTransactions()
    },
    // Permission functions - Owner has full access
    canViewFinance: () => isOwner() || hasPermission("finance", "accounts", "view"),
    canEditFinance: () => isOwner() || hasPermission("finance", "accounts", "edit"),
    canDeleteFinance: () => isOwner() || hasPermission("finance", "accounts", "delete"),
    isOwner: () => isOwner()
  }), [
    state,
    dispatch,
    refreshAccounts,
    refreshTransactions,
    refreshInvoices,
    refreshBills,
    refreshContacts,
    refreshBankAccounts,
    refreshBudgets,
    refreshExpenses,
    refreshPayments,
    refreshCreditNotes,
    refreshPurchaseOrders,
    refreshTaxRates,
    refreshPaymentTerms,
    refreshBankReconciliations,
    refreshReports,
    refreshCurrencies,
    refreshAll,
    getFinanceWritePath,
    companyState,
    settingsState,
    isOwner,
    hasPermission,
  ])

  // Debounced initialization - only load when basePath stabilizes
  const refreshTimeoutRef = React.useRef<NodeJS.Timeout>()

  // Debounced initialization - only load when basePath stabilizes
  useEffect(() => {
    // Wait for dependencies: Settings and Company must be ready first
    if (!settingsState.auth || settingsState.loading) {
      dispatch({ type: "SET_LOADING", payload: false })
      return // Settings not ready yet
    }
    
    if (!companyState.companyID && settingsState.auth.isLoggedIn) {
      dispatch({ type: "SET_LOADING", payload: false })
      return // Company not selected yet (but user is logged in)
    }
    
    // Clear any pending refresh
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    // Only initialize if basePath is valid and different from last loaded path
    if (state.basePath && state.basePath !== lastLoadedPathRef.current) {
      // Debounce to prevent rapid refreshes during company/site switching
      refreshTimeoutRef.current = setTimeout(() => {
        // Load data in background, maintaining old data until complete
        refreshAll().catch(error => {
          console.warn('Finance data refresh failed, maintaining old data:', error)
          dispatch({ type: "SET_LOADING", payload: false })
        })
      }, 150) // Slightly increased debounce for stability
    } else if (!state.basePath) {
      // Clear loading state if no basePath
      dispatch({ type: "SET_LOADING", payload: false })
    } else if (state.basePath === lastLoadedPathRef.current && !isLoadingRef.current) {
      // If basePath hasn't changed and we're not loading, ensure loading is cleared
      dispatch({ type: "SET_LOADING", payload: false })
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [state.basePath, settingsState.auth, settingsState.loading, companyState.companyID, refreshAll])

  return <FinanceContext.Provider value={contextValue}>{children}</FinanceContext.Provider>
}

// Hook to use the finance context - graceful handling when not loaded
export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext)
  if (context === undefined) {
    // Return a safe default context instead of throwing error
    // This allows components to render even when Finance module isn't loaded yet
    console.warn("useFinance called outside FinanceProvider - returning empty context")
    
    const emptyContext: FinanceContextType = {
      state: {
        accounts: [],
        transactions: [],
        invoices: [],
        bills: [],
        contacts: [],
        bankAccounts: [],
        budgets: [],
        expenses: [],
        payments: [],
        creditNotes: [],
        purchaseOrders: [],
        taxRates: [],
        paymentTerms: [],
        bankReconciliations: [],
        reports: [],
        currencies: [],
        loading: false,
        error: null,
        basePath: "",
        dataVersion: 0,
      },
      dispatch: () => {},
      canViewFinance: () => false,
      canEditFinance: () => false,
      canDeleteFinance: () => false,
      isOwner: () => false,
      refreshAccounts: async () => {},
      refreshTransactions: async () => {},
      refreshInvoices: async () => {},
      refreshBills: async () => {},
      refreshContacts: async () => {},
      refreshBankAccounts: async () => {},
      refreshBudgets: async () => {},
      refreshExpenses: async () => {},
      refreshPayments: async () => {},
      refreshCreditNotes: async () => {},
      refreshPurchaseOrders: async () => {},
      refreshTaxRates: async () => {},
      refreshPaymentTerms: async () => {},
      refreshBankReconciliations: async () => {},
      refreshReports: async () => {},
      refreshCurrencies: async () => {},
      refreshAll: async () => {},
      createAccount: async () => {},
      updateAccount: async () => {},
      deleteAccount: async () => {},
      createInvoice: async () => {},
      updateInvoice: async () => {},
      deleteInvoice: async () => {},
      sendInvoice: async () => {},
      markInvoicePaid: async () => {},
      createBill: async () => {},
      updateBill: async () => {},
      deleteBill: async () => {},
      approveBill: async () => {},
      markBillPaid: async () => {},
      createContact: async () => {},
      updateContact: async () => {},
      deleteContact: async () => {},
      createPayment: async () => {},
      allocatePayment: async () => {},
      startReconciliation: async () => {},
      reconcileTransaction: async () => {},
      completeReconciliation: async () => {},
      generateReport: async () => {},
      calculateTax: () => 0,
      convertCurrency: async () => 0,
      formatCurrency: () => "$0.00",
      getAccountBalance: () => 0,
      getOutstandingInvoices: () => [],
      getOverdueBills: () => [],
      getCashFlowProjection: () => [],
      createExpense: async () => {},
      updateExpense: async () => {},
      deleteExpense: async () => {},
      approveExpense: async () => {},
      rejectExpense: async () => {},
      reimburseExpense: async () => {},
      createBankAccount: async () => {},
      updateBankAccount: async () => {},
      deleteBankAccount: async () => {},
      fetchBankAccountDetail: async () => null,
      createCreditNote: async () => {},
      updateCreditNote: async () => {},
      deleteCreditNote: async () => {},
      createPurchaseOrder: async () => {},
      updatePurchaseOrder: async () => {},
      deletePurchaseOrder: async () => {},
      createTaxRate: async () => {},
      updateTaxRate: async () => {},
      deleteTaxRate: async () => {},
      createBudget: async () => {},
      updateBudget: async () => {},
      deleteBudget: async () => {},
      createCurrency: async () => {},
      updateCurrency: async () => {},
      deleteCurrency: async () => {},
      updatePayment: async () => {},
      deletePayment: async () => {},
      saveReport: async () => {},
      deleteReport: async () => {},
      createTransaction: async () => {},
    }
    
    return emptyContext
  }
  return context
}

// Export the context (FinanceProvider is already exported above)
export { FinanceContext }

// Export types for frontend consumption
export type { 
  Account, 
  Transaction, 
  Invoice, 
  Bill, 
  Contact, 
  BankAccount, 
  Budget, 
  Expense, 
  Payment, 
  Currency,
  FinanceReport,
  FinanceSettings
} from "../interfaces/Finance"
