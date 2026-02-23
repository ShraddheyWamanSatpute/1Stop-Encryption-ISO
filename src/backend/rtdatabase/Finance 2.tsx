import { ref, get, set, push, update, remove } from "firebase/database"
import { db } from "../services/Firebase"
import type {
  Account,
  Transaction,
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
  JournalEntry,
  Invoice,
} from "../interfaces/Finance"

// Accounts
export const fetchAccounts = async (basePath: string): Promise<Account[]> => {
  try {
    const accountsRef = ref(db, `${basePath}/accounts`)
    const snapshot = await get(accountsRef)

    if (snapshot.exists()) {
      return Object.entries(snapshot.val() as Record<string, unknown>).map(([id, raw]) => {
        const data = raw as Account
        return {
          ...data,
          id,
        }
      })
    }
    return []
  } catch (error) {
    console.error("Error fetching accounts:", error)
    throw error
  }
}

export const createAccount = async (basePath: string, account: Omit<Account, "id">): Promise<Account> => {
  try {
    const accountsRef = ref(db, `${basePath}/accounts`)
    const newAccountRef = push(accountsRef)
    const id = newAccountRef.key as string

    const newAccount = {
      ...account,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await set(newAccountRef, newAccount)
    return newAccount
  } catch (error) {
    console.error("Error creating account:", error)
    throw error
  }
}

export const updateAccount = async (basePath: string, accountId: string, updates: Partial<Account>): Promise<void> => {
  try {
    const accountRef = ref(db, `${basePath}/accounts/${accountId}`)
    const updatedFields = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    await update(accountRef, updatedFields)
  } catch (error) {
    console.error("Error updating account:", error)
    throw error
  }
}

export const deleteAccount = async (basePath: string, accountId: string): Promise<void> => {
  try {
    const accountRef = ref(db, `${basePath}/accounts/${accountId}`)
    await remove(accountRef)
  } catch (error) {
    console.error("Error deleting account:", error)
    throw error
  }
}

// Transactions
export const fetchTransactions = async (basePath: string): Promise<Transaction[]> => {
  try {
    const transactionsRef = ref(db, `${basePath}/transactions`)
    const snapshot = await get(transactionsRef)

    if (snapshot.exists()) {
      return Object.entries(snapshot.val() as Record<string, unknown>).map(([id, raw]) => {
        const data = raw as Transaction
        return {
          ...data,
          id,
        }
      })
    }
    return []
  } catch (error) {
    console.error("Error fetching transactions:", error)
    throw error
  }
}

export const createTransaction = async (
  basePath: string,
  transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
): Promise<Transaction> => {
  try {
    const transactionsRef = ref(db, `${basePath}/transactions`)
    const newTransactionRef = push(transactionsRef)
    const id = newTransactionRef.key as string

    const now = new Date().toISOString()
    const newTransaction = {
      ...transaction,
      id,
      createdAt: now,
      updatedAt: now,
    }

    await set(newTransactionRef, newTransaction)
    return newTransaction as Transaction
  } catch (error) {
    console.error("Error creating transaction:", error)
    throw error
  }
}

// Bills
export const fetchBills = async (basePath: string): Promise<Bill[]> => {
  try {
    const billsRef = ref(db, `${basePath}/bills`)
    const snapshot = await get(billsRef)
    if (snapshot.exists()) {
      return Object.entries(snapshot.val() as Record<string, unknown>).map(([id, raw]) => {
        const data = raw as Bill
        return {
          ...data,
          id,
        }
      })
    }
    return []
  } catch (error) {
    console.error("Error fetching bills:", error)
    throw error
  }
}

export const createBill = async (basePath: string, bill: Omit<Bill, "id">): Promise<Bill> => {
  try {
    const billsRef = ref(db, `${basePath}/bills`)
    const newBillRef = push(billsRef)
    const id = newBillRef.key as string

    const newBill = {
      ...bill,
      id,
    }

    await set(newBillRef, newBill)
    return newBill
  } catch (error) {
    console.error("Error creating bill:", error)
    throw error
  }
}

// Contacts
export const fetchContacts = async (basePath: string): Promise<Contact[]> => {
  try {
    const contactsRef = ref(db, `${basePath}/contacts`)
    const snapshot = await get(contactsRef)
    if (snapshot.exists()) {
      return Object.entries(snapshot.val() as Record<string, unknown>).map(([id, raw]) => {
        const data = raw as Contact
        return {
          ...data,
          id,
        }
      })
    }
    return []
  } catch (error) {
    console.error("Error fetching contacts:", error)
    throw error
  }
}

// Bank Accounts
export const fetchBankAccounts = async (basePath: string): Promise<BankAccount[]> => {
  try {
    const bankAccountsRef = ref(db, `${basePath}/bankAccounts`)
    const snapshot = await get(bankAccountsRef)
    if (snapshot.exists()) {
      return Object.entries(snapshot.val() as Record<string, unknown>).map(([id, raw]) => {
        const data = raw as BankAccount
        return {
          ...data,
          id,
        }
      })
    }
    return []
  } catch (error) {
    console.error("Error fetching bank accounts:", error)
    throw error
  }
}

// Budgets
export const fetchBudgets = async (basePath: string): Promise<Budget[]> => {
  try {
    const budgetsRef = ref(db, `${basePath}/budgets`)
    const snapshot = await get(budgetsRef)
    if (snapshot.exists()) {
      return Object.entries(snapshot.val() as Record<string, unknown>).map(([id, raw]) => {
        const data = raw as Budget
        return {
          ...data,
          id,
        }
      })
    }
    return []
  } catch (error) {
    console.error("Error fetching budgets:", error)
    throw error
  }
}

// Expenses
export const fetchExpenses = async (basePath: string): Promise<Expense[]> => {
  try {
    const expensesRef = ref(db, `${basePath}/expenses`)
    const snapshot = await get(expensesRef)
    if (snapshot.exists()) {
      return Object.entries(snapshot.val() as Record<string, unknown>).map(([id, raw]) => {
        const data = raw as Expense
        return {
          ...data,
          id,
        }
      })
    }
    return []
  } catch (error) {
    console.error("Error fetching expenses:", error)
    throw error
  }
}

export const createExpense = async (basePath: string, expense: Omit<Expense, "id">): Promise<Expense> => {
  try {
    const expensesRef = ref(db, `${basePath}/expenses`)
    const newExpenseRef = push(expensesRef)
    const id = newExpenseRef.key as string

    const newExpense = {
      ...expense,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await set(newExpenseRef, newExpense)
    return newExpense
  } catch (error) {
    console.error("Error creating expense:", error)
    throw error
  }
}

export const updateExpense = async (basePath: string, expenseId: string, updates: Partial<Expense>): Promise<void> => {
  try {
    const expenseRef = ref(db, `${basePath}/expenses/${expenseId}`)
    const updatedFields = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    await update(expenseRef, updatedFields)
  } catch (error) {
    console.error("Error updating expense:", error)
    throw error
  }
}

export const deleteExpense = async (basePath: string, expenseId: string): Promise<void> => {
  try {
    const expenseRef = ref(db, `${basePath}/expenses/${expenseId}`)
    await remove(expenseRef)
  } catch (error) {
    console.error("Error deleting expense:", error)
    throw error
  }
}

// Invoices
export const fetchInvoices = async (basePath: string): Promise<Invoice[]> => {
  try {
    const invoicesRef = ref(db, `${basePath}/invoices`)
    const snapshot = await get(invoicesRef)
    if (snapshot.exists()) {
      return Object.entries(snapshot.val() as Record<string, unknown>).map(([id, raw]) => {
        const data = raw as Invoice
        return {
          ...data,
          id,
        }
      })
    }
    return []
  } catch (error) {
    console.error("Error fetching invoices:", error)
    throw error
  }
}

export const createInvoice = async (basePath: string, invoice: Omit<Invoice, "id">): Promise<Invoice> => {
  try {
    const invoicesRef = ref(db, `${basePath}/invoices`)
    const newInvoiceRef = push(invoicesRef)
    const id = newInvoiceRef.key as string

    const newInvoice = {
      ...invoice,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await set(newInvoiceRef, newInvoice)
    return newInvoice
  } catch (error) {
    console.error("Error creating invoice:", error)
    throw error
  }
}

export const updateInvoice = async (basePath: string, invoiceId: string, updates: Partial<Invoice>): Promise<void> => {
  try {
    const invoiceRef = ref(db, `${basePath}/invoices/${invoiceId}`)
    const updatedFields = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    await update(invoiceRef, updatedFields)
  } catch (error) {
    console.error("Error updating invoice:", error)
    throw error
  }
}

// Bills - Add missing CRUD operations
export const updateBill = async (basePath: string, billId: string, updates: Partial<Bill>): Promise<void> => {
  try {
    const billRef = ref(db, `${basePath}/bills/${billId}`)
    const updatedFields = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    await update(billRef, updatedFields)
  } catch (error) {
    console.error("Error updating bill:", error)
    throw error
  }
}

export const deleteBill = async (basePath: string, billId: string): Promise<void> => {
  try {
    const billRef = ref(db, `${basePath}/bills/${billId}`)
    await remove(billRef)
  } catch (error) {
    console.error("Error deleting bill:", error)
    throw error
  }
}

// Contacts - Add missing CRUD operations
export const createContact = async (basePath: string, contact: Omit<Contact, "id">): Promise<Contact> => {
  try {
    const contactsRef = ref(db, `${basePath}/contacts`)
    const newContactRef = push(contactsRef)
    const id = newContactRef.key as string

    const newContact = {
      ...contact,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await set(newContactRef, newContact)
    return newContact
  } catch (error) {
    console.error("Error creating contact:", error)
    throw error
  }
}

export const updateContact = async (basePath: string, contactId: string, updates: Partial<Contact>): Promise<void> => {
  try {
    const contactRef = ref(db, `${basePath}/contacts/${contactId}`)
    const updatedFields = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    await update(contactRef, updatedFields)
  } catch (error) {
    console.error("Error updating contact:", error)
    throw error
  }
}

export const deleteContact = async (basePath: string, contactId: string): Promise<void> => {
  try {
    const contactRef = ref(db, `${basePath}/contacts/${contactId}`)
    await remove(contactRef)
  } catch (error) {
    console.error("Error deleting contact:", error)
    throw error
  }
}

// Bank Accounts - Add missing CRUD operations
export const createBankAccount = async (basePath: string, bankAccount: Omit<BankAccount, "id">): Promise<BankAccount> => {
  try {
    const bankAccountsRef = ref(db, `${basePath}/bankAccounts`)
    const newBankAccountRef = push(bankAccountsRef)
    const id = newBankAccountRef.key as string

    const newBankAccount = {
      ...bankAccount,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await set(newBankAccountRef, newBankAccount)
    return newBankAccount
  } catch (error) {
    console.error("Error creating bank account:", error)
    throw error
  }
}

export const updateBankAccount = async (basePath: string, bankAccountId: string, updates: Partial<BankAccount>): Promise<void> => {
  try {
    const bankAccountRef = ref(db, `${basePath}/bankAccounts/${bankAccountId}`)
    const updatedFields = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    await update(bankAccountRef, updatedFields)
  } catch (error) {
    console.error("Error updating bank account:", error)
    throw error
  }
}

export const deleteBankAccount = async (basePath: string, bankAccountId: string): Promise<void> => {
  try {
    const bankAccountRef = ref(db, `${basePath}/bankAccounts/${bankAccountId}`)
    await remove(bankAccountRef)
  } catch (error) {
    console.error("Error deleting bank account:", error)
    throw error
  }
}

// Budgets - Add missing CRUD operations
export const createBudget = async (basePath: string, budget: Omit<Budget, "id">): Promise<Budget> => {
  try {
    const budgetsRef = ref(db, `${basePath}/budgets`)
    const newBudgetRef = push(budgetsRef)
    const id = newBudgetRef.key as string

    const newBudget = {
      ...budget,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await set(newBudgetRef, newBudget)
    return newBudget
  } catch (error) {
    console.error("Error creating budget:", error)
    throw error
  }
}

export const updateBudget = async (basePath: string, budgetId: string, updates: Partial<Budget>): Promise<void> => {
  try {
    const budgetRef = ref(db, `${basePath}/budgets/${budgetId}`)
    const updatedFields = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    await update(budgetRef, updatedFields)
  } catch (error) {
    console.error("Error updating budget:", error)
    throw error
  }
}

export const deleteBudget = async (basePath: string, budgetId: string): Promise<void> => {
  try {
    const budgetRef = ref(db, `${basePath}/budgets/${budgetId}`)
    await remove(budgetRef)
  } catch (error) {
    console.error("Error deleting budget:", error)
    throw error
  }
}

export const fetchReports = async (basePath: string): Promise<FinancialReport[]> => {
  try {
    const reportsRef = ref(db, `${basePath}/reports`)
    const snapshot = await get(reportsRef)
    const reports = snapshot.val() || {}
    return Object.values(reports) as FinancialReport[]
  } catch (error) {
    console.error("Error fetching reports:", error)
    return []
  }
}

export const fetchCurrencies = async (basePath: string): Promise<Currency[]> => {
  try {
    const currenciesRef = ref(db, `${basePath}/currencies`)
    const snapshot = await get(currenciesRef)
    if (snapshot.exists()) {
      return Object.entries(snapshot.val() as Record<string, unknown>).map(([code, raw]) => {
        const data = raw as Currency
        return {
          ...data,
          code,
        }
      })
    }
    return []
  } catch (error) {
    console.error("Error fetching currencies:", error)
    return []
  }
}

export const createCurrency = async (basePath: string, currency: Currency): Promise<Currency> => {
  try {
    const currencyRef = ref(db, `${basePath}/currencies/${currency.code}`)
    await set(currencyRef, currency)
    return currency
  } catch (error) {
    console.error("Error creating currency:", error)
    throw error
  }
}

export const updateCurrency = async (basePath: string, currencyCode: string, updates: Partial<Currency>): Promise<void> => {
  try {
    const currencyRef = ref(db, `${basePath}/currencies/${currencyCode}`)
    await update(currencyRef, updates)
  } catch (error) {
    console.error("Error updating currency:", error)
    throw error
  }
}

export const deleteCurrency = async (basePath: string, currencyCode: string): Promise<void> => {
  try {
    const currencyRef = ref(db, `${basePath}/currencies/${currencyCode}`)
    await remove(currencyRef)
  } catch (error) {
    console.error("Error deleting currency:", error)
    throw error
  }
}

// Payments
export const fetchPayments = async (basePath: string): Promise<Payment[]> => {
  try {
    const paymentsRef = ref(db, `${basePath}/payments`)
    const snapshot = await get(paymentsRef)
    if (snapshot.exists()) {
      return Object.entries(snapshot.val() as Record<string, unknown>).map(([id, raw]) => {
        const data = raw as Payment
        return {
          ...data,
          id,
        }
      })
    }
    return []
  } catch (error) {
    console.error("Error fetching payments:", error)
    throw error
  }
}

export const createPayment = async (basePath: string, payment: Omit<Payment, "id">): Promise<Payment> => {
  try {
    const paymentsRef = ref(db, `${basePath}/payments`)
    const newPaymentRef = push(paymentsRef)
    const id = newPaymentRef.key as string

    const newPayment = {
      ...payment,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await set(newPaymentRef, newPayment)
    return newPayment
  } catch (error) {
    console.error("Error creating payment:", error)
    throw error
  }
}

export const updatePayment = async (basePath: string, paymentId: string, updates: Partial<Payment>): Promise<void> => {
  try {
    const paymentRef = ref(db, `${basePath}/payments/${paymentId}`)
    const updatedFields = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    await update(paymentRef, updatedFields)
  } catch (error) {
    console.error("Error updating payment:", error)
    throw error
  }
}

export const deletePayment = async (basePath: string, paymentId: string): Promise<void> => {
  try {
    const paymentRef = ref(db, `${basePath}/payments/${paymentId}`)
    await remove(paymentRef)
  } catch (error) {
    console.error("Error deleting payment:", error)
    throw error
  }
}

// Credit Notes
export const fetchCreditNotes = async (basePath: string): Promise<CreditNote[]> => {
  try {
    const creditNotesRef = ref(db, `${basePath}/creditNotes`)
    const snapshot = await get(creditNotesRef)
    if (snapshot.exists()) {
      return Object.entries(snapshot.val() as Record<string, unknown>).map(([id, raw]) => {
        const data = raw as CreditNote
        return {
          ...data,
          id,
        }
      })
    }
    return []
  } catch (error) {
    console.error("Error fetching credit notes:", error)
    throw error
  }
}

export const createCreditNote = async (basePath: string, creditNote: Omit<CreditNote, "id">): Promise<CreditNote> => {
  try {
    const creditNotesRef = ref(db, `${basePath}/creditNotes`)
    const newCreditNoteRef = push(creditNotesRef)
    const id = newCreditNoteRef.key as string

    const newCreditNote = {
      ...creditNote,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await set(newCreditNoteRef, newCreditNote)
    return newCreditNote
  } catch (error) {
    console.error("Error creating credit note:", error)
    throw error
  }
}

export const updateCreditNote = async (basePath: string, creditNoteId: string, updates: Partial<CreditNote>): Promise<void> => {
  try {
    const creditNoteRef = ref(db, `${basePath}/creditNotes/${creditNoteId}`)
    const updatedFields = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    await update(creditNoteRef, updatedFields)
  } catch (error) {
    console.error("Error updating credit note:", error)
    throw error
  }
}

export const deleteCreditNote = async (basePath: string, creditNoteId: string): Promise<void> => {
  try {
    const creditNoteRef = ref(db, `${basePath}/creditNotes/${creditNoteId}`)
    await remove(creditNoteRef)
  } catch (error) {
    console.error("Error deleting credit note:", error)
    throw error
  }
}

// Purchase Orders
export const fetchPurchaseOrders = async (basePath: string): Promise<PurchaseOrder[]> => {
  try {
    const purchaseOrdersRef = ref(db, `${basePath}/purchaseOrders`)
    const snapshot = await get(purchaseOrdersRef)
    if (snapshot.exists()) {
      return Object.entries(snapshot.val() as Record<string, unknown>).map(([id, raw]) => {
        const data = raw as PurchaseOrder
        return {
          ...data,
          id,
        }
      })
    }
    return []
  } catch (error) {
    console.error("Error fetching purchase orders:", error)
    throw error
  }
}

export const createPurchaseOrder = async (basePath: string, purchaseOrder: Omit<PurchaseOrder, "id">): Promise<PurchaseOrder> => {
  try {
    const purchaseOrdersRef = ref(db, `${basePath}/purchaseOrders`)
    const newPurchaseOrderRef = push(purchaseOrdersRef)
    const id = newPurchaseOrderRef.key as string

    const newPurchaseOrder = {
      ...purchaseOrder,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await set(newPurchaseOrderRef, newPurchaseOrder)
    return newPurchaseOrder
  } catch (error) {
    console.error("Error creating purchase order:", error)
    throw error
  }
}

export const updatePurchaseOrder = async (basePath: string, purchaseOrderId: string, updates: Partial<PurchaseOrder>): Promise<void> => {
  try {
    const purchaseOrderRef = ref(db, `${basePath}/purchaseOrders/${purchaseOrderId}`)
    const updatedFields = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    await update(purchaseOrderRef, updatedFields)
  } catch (error) {
    console.error("Error updating purchase order:", error)
    throw error
  }
}

export const deletePurchaseOrder = async (basePath: string, purchaseOrderId: string): Promise<void> => {
  try {
    const purchaseOrderRef = ref(db, `${basePath}/purchaseOrders/${purchaseOrderId}`)
    await remove(purchaseOrderRef)
  } catch (error) {
    console.error("Error deleting purchase order:", error)
    throw error
  }
}

// Tax Rates
export const fetchTaxRates = async (basePath: string): Promise<TaxRate[]> => {
  try {
    const taxRatesRef = ref(db, `${basePath}/taxRates`)
    const snapshot = await get(taxRatesRef)
    if (snapshot.exists()) {
      return Object.entries(snapshot.val() as Record<string, unknown>).map(([id, raw]) => {
        const data = raw as TaxRate
        return {
          ...data,
          id,
        }
      })
    }
    return []
  } catch (error) {
    console.error("Error fetching tax rates:", error)
    throw error
  }
}

export const createTaxRate = async (basePath: string, taxRate: Omit<TaxRate, "id">): Promise<TaxRate> => {
  try {
    const taxRatesRef = ref(db, `${basePath}/taxRates`)
    const newTaxRateRef = push(taxRatesRef)
    const id = newTaxRateRef.key as string

    const newTaxRate = {
      ...taxRate,
      id,
    }

    await set(newTaxRateRef, newTaxRate)
    return newTaxRate
  } catch (error) {
    console.error("Error creating tax rate:", error)
    throw error
  }
}

export const updateTaxRate = async (basePath: string, taxRateId: string, updates: Partial<TaxRate>): Promise<void> => {
  try {
    const taxRateRef = ref(db, `${basePath}/taxRates/${taxRateId}`)
    await update(taxRateRef, updates)
  } catch (error) {
    console.error("Error updating tax rate:", error)
    throw error
  }
}

export const deleteTaxRate = async (basePath: string, taxRateId: string): Promise<void> => {
  try {
    const taxRateRef = ref(db, `${basePath}/taxRates/${taxRateId}`)
    await remove(taxRateRef)
  } catch (error) {
    console.error("Error deleting tax rate:", error)
    throw error
  }
}

// Payment Terms
export const fetchPaymentTerms = async (basePath: string): Promise<PaymentTerm[]> => {
  try {
    const paymentTermsRef = ref(db, `${basePath}/paymentTerms`)
    const snapshot = await get(paymentTermsRef)
    if (snapshot.exists()) {
      return Object.entries(snapshot.val() as Record<string, unknown>).map(([id, raw]) => {
        const data = raw as PaymentTerm
        return {
          ...data,
          id,
        }
      })
    }
    return []
  } catch (error) {
    console.error("Error fetching payment terms:", error)
    throw error
  }
}

export const createPaymentTerm = async (basePath: string, paymentTerm: Omit<PaymentTerm, "id">): Promise<PaymentTerm> => {
  try {
    const paymentTermsRef = ref(db, `${basePath}/paymentTerms`)
    const newPaymentTermRef = push(paymentTermsRef)
    const id = newPaymentTermRef.key as string

    const newPaymentTerm = {
      ...paymentTerm,
      id,
    }

    await set(newPaymentTermRef, newPaymentTerm)
    return newPaymentTerm
  } catch (error) {
    console.error("Error creating payment term:", error)
    throw error
  }
}

// Bank Reconciliations
export const fetchBankReconciliations = async (basePath: string): Promise<BankReconciliation[]> => {
  try {
    const reconciliationsRef = ref(db, `${basePath}/bankReconciliations`)
    const snapshot = await get(reconciliationsRef)
    if (snapshot.exists()) {
      return Object.entries(snapshot.val() as Record<string, unknown>).map(([id, raw]) => {
        const data = raw as BankReconciliation
        return {
          ...data,
          id,
        }
      })
    }
    return []
  } catch (error) {
    console.error("Error fetching bank reconciliations:", error)
    throw error
  }
}

export const createBankReconciliation = async (basePath: string, reconciliation: Omit<BankReconciliation, "id">): Promise<BankReconciliation> => {
  try {
    const reconciliationsRef = ref(db, `${basePath}/bankReconciliations`)
    const newReconciliationRef = push(reconciliationsRef)
    const id = newReconciliationRef.key as string

    const newReconciliation = {
      ...reconciliation,
      id,
      createdAt: new Date().toISOString(),
    }

    await set(newReconciliationRef, newReconciliation)
    return newReconciliation
  } catch (error) {
    console.error("Error creating bank reconciliation:", error)
    throw error
  }
}

export const updateBankReconciliation = async (basePath: string, reconciliationId: string, updates: Partial<BankReconciliation>): Promise<void> => {
  try {
    const reconciliationRef = ref(db, `${basePath}/bankReconciliations/${reconciliationId}`)
    await update(reconciliationRef, updates)
  } catch (error) {
    console.error("Error updating bank reconciliation:", error)
    throw error
  }
}

// Journal Entries
export const fetchJournalEntries = async (basePath: string): Promise<JournalEntry[]> => {
  try {
    const journalEntriesRef = ref(db, `${basePath}/journalEntries`)
    const snapshot = await get(journalEntriesRef)
    if (snapshot.exists()) {
      return Object.entries(snapshot.val() as Record<string, unknown>).map(([id, raw]) => {
        const data = raw as JournalEntry
        return {
          ...data,
          id,
        }
      })
    }
    return []
  } catch (error) {
    console.error("Error fetching journal entries:", error)
    throw error
  }
}

export const createJournalEntry = async (basePath: string, entry: Omit<JournalEntry, "id">): Promise<JournalEntry> => {
  try {
    const journalEntriesRef = ref(db, `${basePath}/journalEntries`)
    const newEntryRef = push(journalEntriesRef)
    const id = newEntryRef.key as string

    const newEntry = {
      ...entry,
      id,
    }

    await set(newEntryRef, newEntry)
    return newEntry
  } catch (error) {
    console.error("Error creating journal entry:", error)
    throw error
  }
}

export const updateJournalEntry = async (basePath: string, entryId: string, updates: Partial<JournalEntry>): Promise<void> => {
  try {
    const entryRef = ref(db, `${basePath}/journalEntries/${entryId}`)
    await update(entryRef, updates)
  } catch (error) {
    console.error("Error updating journal entry:", error)
    throw error
  }
}

export const deleteJournalEntry = async (basePath: string, entryId: string): Promise<void> => {
  try {
    const entryRef = ref(db, `${basePath}/journalEntries/${entryId}`)
    await remove(entryRef)
  } catch (error) {
    console.error("Error deleting journal entry:", error)
    throw error
  }
}

// Financial Reports
export const saveReport = async (basePath: string, report: Omit<FinancialReport, "id">): Promise<FinancialReport> => {
  try {
    const reportsRef = ref(db, `${basePath}/reports`)
    const newReportRef = push(reportsRef)
    const id = newReportRef.key as string

    const newReport = {
      ...report,
      id,
    }

    await set(newReportRef, newReport)
    return newReport
  } catch (error) {
    console.error("Error saving report:", error)
    throw error
  }
}

export const deleteReport = async (basePath: string, reportId: string): Promise<void> => {
  try {
    const reportRef = ref(db, `${basePath}/reports/${reportId}`)
    await remove(reportRef)
  } catch (error) {
    console.error("Error deleting report:", error)
    throw error
  }
}

// Delete Invoice
export const deleteInvoice = async (basePath: string, invoiceId: string): Promise<void> => {
  try {
    const invoiceRef = ref(db, `${basePath}/invoices/${invoiceId}`)
    await remove(invoiceRef)
  } catch (error) {
    console.error("Error deleting invoice:", error)
    throw error
  }
}
