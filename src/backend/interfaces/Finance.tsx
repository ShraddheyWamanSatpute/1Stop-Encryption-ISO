// Supporting interfaces
export interface Address {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  taxAmount: number
  lineTotal: number
  accountId?: string
}

export interface BillLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  taxAmount: number
  lineTotal: number
  accountId?: string
}

export interface RecurringSchedule {
  frequency: "weekly" | "monthly" | "quarterly" | "yearly"
  interval: number
  endDate?: string
  nextDate: string
  isActive: boolean
}

export interface BankAccountDetails {
  accountNumber: string
  sortCode: string
  iban?: string
  swiftCode?: string
}

export interface TaxRate {
  id: string
  name: string
  rate: number
  type: "VAT" | "GST" | "Sales Tax" | "Other"
  isActive: boolean
}

export interface PaymentTerm {
  id: string
  name: string
  days: number
  discountPercentage?: number
  discountDays?: number
}

export interface JournalEntry {
  accountId: string
  amount: number
  type: "debit" | "credit"
  description?: string
  debit?: number
  credit?: number
  id?: string
  transactionId?: string
}

export interface Transaction {
  id: string
  transactionNumber: string
  date: string
  description: string
  reference?: string
  type: "sale" | "purchase" | "payment" | "receipt" | "transfer" | "adjustment" | "opening_balance"
  status: "draft" | "pending" | "completed" | "cancelled" | "reconciled"
  entries: JournalEntry[]
  totalAmount: number
  currency: string
  exchangeRate?: number
  sourceDocument?: {
    type: "invoice" | "bill" | "expense" | "manual"
    id: string
  }
  bankAccountId?: string
  contactId?: string
  isReconciled: boolean
  reconciledAt?: string
  attachments?: string[]
  createdBy: string
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  customerId: string
  customerName: string
  customerEmail?: string
  customerAddress?: Address
  lineItems: InvoiceLineItem[]
  subtotal: number
  taxAmount: number
  totalAmount: number
  currency: string
  status: "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled"
  dueDate: string
  issueDate: string
  paidDate?: string
  description?: string
  notes?: string
  terms?: string
  reference?: string
  recurringSchedule?: RecurringSchedule
  paymentTerms: number // days
  discountPercentage?: number
  discountAmount?: number
  createdAt: string
  updatedAt: string
  sentAt?: string
  viewedAt?: string
  remindersSent: number
  attachments?: string[]
}

export interface Bill {
  id: string
  billNumber: string
  supplierId: string
  supplierName: string
  supplierEmail?: string
  supplierAddress?: Address
  lineItems: BillLineItem[]
  subtotal: number
  taxAmount: number
  totalAmount: number
  currency: string
  status: "draft" | "pending" | "approved" | "paid" | "overdue" | "cancelled"
  dueDate: string
  receiveDate: string
  paidDate?: string
  description?: string
  reference: string
  purchaseOrderNumber?: string
  approvedBy?: string
  approvedAt?: string
  paymentMethod?: string
  createdAt: string
  updatedAt: string
  attachments?: string[]
}

export interface Contact {
  id: string
  name: string
  type: "customer" | "supplier" | "employee" | "other"
  companyName?: string
  firstName?: string
  lastName?: string
  contactPerson?: string
  email: string
  phone?: string
  mobile?: string
  website?: string
  address?: Address
  billingAddress?: Address
  shippingAddress?: Address
  taxNumber?: string
  vatNumber?: string
  paymentTerms?: number
  creditLimit?: number
  discount?: number
  currency: string
  isActive: boolean
  notes?: string
  tags?: string[]
  totalInvoiced?: number
  totalPaid?: number
  outstandingBalance?: number
  lastTransactionDate?: string
  createdAt: string
  updatedAt: string
}

export interface Account {
  id: string
  name: string
  code: string
  type: "asset" | "liability" | "equity" | "revenue" | "expense"
  subType: "current_asset" | "fixed_asset" | "current_liability" | "long_term_liability" | "equity" | "revenue" | "cost_of_goods_sold" | "expense" | "other_income" | "other_expense"
  category?: string
  balance: number
  description: string
  parentAccountId?: string
  isArchived: boolean
  isSystemAccount: boolean
  taxCode?: string
  currency: string
  bankAccountDetails?: BankAccountDetails
  createdAt: string
  updatedAt: string
}

export interface BankAccount {
  id: string
  name: string
  bank: string
  accountNumber: string
  type: "checking" | "savings" | "credit"
  balance: number
  currency: string
  status: "active" | "inactive"
  lastSync: string
}

export interface Expense {
  id: string
  employee: string
  description: string
  amount: number
  category: string
  status: "pending" | "approved" | "reimbursed" | "rejected"
  submitDate: string
  receiptAttached: boolean
  department: string
}

export interface Currency {
  code: string
  name: string
  symbol: string
  rate: number
  isBase: boolean
  lastUpdated: string
  status: "active" | "inactive"
}

export interface Budget {
  id: string
  category: string
  budgeted: number
  actual: number
  remaining: number
  period: string
  status: "on-track" | "under-budget" | "near-limit" | "over-budget"
  percentage: number
}

// Advanced finance interfaces
export interface BankReconciliation {
  id: string
  bankAccountId: string
  statementDate: string
  openingBalance: number
  closingBalance: number
  reconciledTransactions: string[]
  unreconciledTransactions: string[]
  adjustments: BankAdjustment[]
  status: "in_progress" | "completed" | "reviewed"
  reconciledBy: string
  reconciledAt?: string
  createdAt: string
}

export interface BankAdjustment {
  id: string
  description: string
  amount: number
  type: "bank_fee" | "interest" | "correction" | "other"
  accountId: string
}

export interface Payment {
  id: string
  paymentNumber: string
  type: "customer_payment" | "supplier_payment" | "expense_payment" | "transfer"
  amount: number
  currency: string
  exchangeRate?: number
  paymentDate: string
  paymentMethod: "cash" | "cheque" | "bank_transfer" | "card" | "online" | "other"
  reference?: string
  bankAccountId: string
  contactId?: string
  allocations: PaymentAllocation[]
  status: "pending" | "completed" | "cancelled" | "failed"
  createdAt: string
  updatedAt: string
}

export interface PaymentAllocation {
  documentType: "invoice" | "bill" | "credit_note"
  documentId: string
  amount: number
  discount?: number
}

export interface CreditNote {
  id: string
  creditNoteNumber: string
  customerId: string
  customerName: string
  lineItems: InvoiceLineItem[]
  subtotal: number
  taxAmount: number
  totalAmount: number
  currency: string
  issueDate: string
  reason: string
  originalInvoiceId?: string
  status: "draft" | "issued" | "applied"
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplierName: string
  lineItems: BillLineItem[]
  subtotal: number
  taxAmount: number
  totalAmount: number
  currency: string
  orderDate: string
  expectedDate?: string
  deliveryAddress?: Address
  status: "draft" | "sent" | "acknowledged" | "partially_received" | "received" | "cancelled"
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface FinancialReport {
  id: string
  name: string
  type: "profit_loss" | "balance_sheet" | "cash_flow" | "trial_balance" | "aged_receivables" | "aged_payables" | "budget_vs_actual" | "custom"
  period: {
    startDate: string
    endDate: string
    type: "month" | "quarter" | "year" | "custom"
  }
  data: unknown
  generatedAt: string
  generatedBy: string
  parameters?: Record<string, unknown>
}

export interface FinanceData {
  transactions: Transaction[]
  invoices: Invoice[]
  bills: Bill[]
  contacts: Contact[]
  accounts: Account[]
  bankAccounts: BankAccount[]
  expenses: Expense[]
  currencies: Currency[]
  budgets: Budget[]
  payments: Payment[]
  creditNotes: CreditNote[]
  purchaseOrders: PurchaseOrder[]
  taxRates: TaxRate[]
  paymentTerms: PaymentTerm[]
  bankReconciliations: BankReconciliation[]
  reports: FinancialReport[]
}

// Alias for FinanceReport
export type FinanceReport = FinancialReport

// FinanceSettings interface
export interface FinanceSettings {
  id: string
  companyId: string
  defaultCurrency: string
  taxRate: number
  invoicePrefix: string
  invoiceNumber: number
  billPrefix: string
  billNumber: number
  paymentTerms: number
  lateFeeRate: number
  lateFeeAmount: number
  autoReminders: boolean
  reminderDays: number[]
  fiscalYearStart: string
  fiscalYearEnd: string
  createdAt: string
  updatedAt: string
}
