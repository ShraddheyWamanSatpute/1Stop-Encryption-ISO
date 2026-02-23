import { ref, get, set, push, update } from "firebase/database"
import { db } from "../services/Firebase"
import { v4 as uuidv4 } from "uuid"
import type { Invoice, Bill, Payment, BankReconciliation, FinancialReport, TaxRate, PaymentTerm, Contact, Transaction } from "../interfaces/Finance"

// Currency and formatting utilities
export const DEFAULT_CURRENCY = "GBP"
export const CURRENCY_SYMBOL = "£"

export const formatCurrency = (amount: number, currency: string = DEFAULT_CURRENCY): string => {
  if (currency === "GBP") {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Generate sequential numbers for documents
export const generateInvoiceNumber = async (basePath: string): Promise<string> => {
  const counterRef = ref(db, `${basePath}/counters/invoiceNumber`)
  const snapshot = await get(counterRef)
  const currentNumber = snapshot.exists() ? snapshot.val() : 0
  const newNumber = currentNumber + 1
  await set(counterRef, newNumber)
  return `INV-${String(newNumber).padStart(6, '0')}`
}

export const generateBillNumber = async (basePath: string): Promise<string> => {
  const counterRef = ref(db, `${basePath}/counters/billNumber`)
  const snapshot = await get(counterRef)
  const currentNumber = snapshot.exists() ? snapshot.val() : 0
  const newNumber = currentNumber + 1
  await set(counterRef, newNumber)
  return `BILL-${String(newNumber).padStart(6, '0')}`
}

export const generatePaymentNumber = async (basePath: string): Promise<string> => {
  const counterRef = ref(db, `${basePath}/counters/paymentNumber`)
  const snapshot = await get(counterRef)
  const currentNumber = snapshot.exists() ? snapshot.val() : 0
  const newNumber = currentNumber + 1
  await set(counterRef, newNumber)
  return `PAY-${String(newNumber).padStart(6, '0')}`
}

// Advanced Invoice Functions
export const createInvoiceAdvanced = async (
  basePath: string,
  invoiceData: Omit<Invoice, "id" | "invoiceNumber" | "createdAt" | "updatedAt">
): Promise<Invoice> => {
  try {
    const invoicesRef = ref(db, `${basePath}/invoices`)
    const newInvoiceRef = push(invoicesRef)
    const id = newInvoiceRef.key as string
    const invoiceNumber = await generateInvoiceNumber(basePath)

    // Calculate totals
    let subtotal = 0
    let taxAmount = 0
    const processedLineItems = invoiceData.lineItems.map(item => {
      const lineTotal = item.quantity * item.unitPrice
      const lineTax = lineTotal * (item.taxRate / 100)
      subtotal += lineTotal
      taxAmount += lineTax
      return {
        ...item,
        lineTotal,
        taxAmount: lineTax
      }
    })

    const totalAmount = subtotal + taxAmount

    const newInvoice: Invoice = {
      ...invoiceData,
      id,
      invoiceNumber,
      lineItems: processedLineItems,
      subtotal,
      taxAmount,
      totalAmount,
      currency: invoiceData.currency || DEFAULT_CURRENCY,
      remindersSent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await set(newInvoiceRef, newInvoice)

    // Create corresponding transaction if invoice is not draft
    if (newInvoice.status !== "draft") {
      await createInvoiceTransaction(basePath, newInvoice)
    }

    return newInvoice
  } catch (error) {
    console.error("Error creating invoice:", error)
    throw error
  }
}

export const updateInvoiceAdvanced = async (
  basePath: string,
  invoiceId: string,
  updates: Partial<Invoice>
): Promise<void> => {
  try {
    const invoiceRef = ref(db, `${basePath}/invoices/${invoiceId}`)
    
    // Recalculate totals if line items are updated
    if (updates.lineItems) {
      let subtotal = 0
      let taxAmount = 0
      const processedLineItems = updates.lineItems.map(item => {
        const lineTotal = item.quantity * item.unitPrice
        const lineTax = lineTotal * (item.taxRate / 100)
        subtotal += lineTotal
        taxAmount += lineTax
        return {
          ...item,
          lineTotal,
          taxAmount: lineTax
        }
      })

      updates.subtotal = subtotal
      updates.taxAmount = taxAmount
      updates.totalAmount = subtotal + taxAmount
      updates.lineItems = processedLineItems
    }

    const updatedFields = {
      ...updates,
      updatedAt: new Date().toISOString()
    }

    await update(invoiceRef, updatedFields)
  } catch (error) {
    console.error("Error updating invoice:", error)
    throw error
  }
}

export const sendInvoice = async (basePath: string, invoiceId: string): Promise<void> => {
  try {
    const invoiceRef = ref(db, `${basePath}/invoices/${invoiceId}`)
    await update(invoiceRef, {
      status: "sent",
      sentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    // Create transaction for sent invoice
    const invoiceSnapshot = await get(invoiceRef)
    if (invoiceSnapshot.exists()) {
      const invoice = invoiceSnapshot.val() as Invoice
      await createInvoiceTransaction(basePath, invoice)
    }
  } catch (error) {
    console.error("Error sending invoice:", error)
    throw error
  }
}

export const markInvoicePaid = async (
  basePath: string,
  invoiceId: string,
  paymentAmount: number,
  paymentDate: string,
  paymentMethod: string = "bank_transfer"
): Promise<void> => {
  try {
    const invoiceRef = ref(db, `${basePath}/invoices/${invoiceId}`)
    const invoiceSnapshot = await get(invoiceRef)
    
    if (!invoiceSnapshot.exists()) {
      throw new Error("Invoice not found")
    }

    const invoice = invoiceSnapshot.val() as Invoice

    // Update invoice status
    await update(invoiceRef, {
      status: "paid",
      paidDate: paymentDate,
      updatedAt: new Date().toISOString()
    })

    // Create payment record
    await createPaymentAdvanced(basePath, {
      type: "customer_payment",
      amount: paymentAmount,
      currency: invoice.currency,
      paymentDate,
      paymentMethod: paymentMethod as any,
      contactId: invoice.customerId,
      allocations: [{
        documentType: "invoice",
        documentId: invoiceId,
        amount: paymentAmount
      }],
      status: "completed",
      bankAccountId: "" // This should be set based on the payment method
    })

    // Update customer balance
    await updateContactBalance(basePath, invoice.customerId, -paymentAmount)
  } catch (error) {
    console.error("Error marking invoice as paid:", error)
    throw error
  }
}

// Advanced Bill Functions
export const createBillAdvanced = async (
  basePath: string,
  billData: Omit<Bill, "id" | "billNumber" | "createdAt" | "updatedAt">
): Promise<Bill> => {
  try {
    const billsRef = ref(db, `${basePath}/bills`)
    const newBillRef = push(billsRef)
    const id = newBillRef.key as string
    const billNumber = await generateBillNumber(basePath)

    // Calculate totals
    let subtotal = 0
    let taxAmount = 0
    const processedLineItems = billData.lineItems.map(item => {
      const lineTotal = item.quantity * item.unitPrice
      const lineTax = lineTotal * (item.taxRate / 100)
      subtotal += lineTotal
      taxAmount += lineTax
      return {
        ...item,
        lineTotal,
        taxAmount: lineTax
      }
    })

    const totalAmount = subtotal + taxAmount

    const newBill: Bill = {
      ...billData,
      id,
      billNumber,
      lineItems: processedLineItems,
      subtotal,
      taxAmount,
      totalAmount,
      currency: billData.currency || DEFAULT_CURRENCY,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await set(newBillRef, newBill)

    // Create corresponding transaction if bill is approved
    if (newBill.status === "approved") {
      await createBillTransaction(basePath, newBill)
    }

    return newBill
  } catch (error) {
    console.error("Error creating bill:", error)
    throw error
  }
}

export const approveBill = async (
  basePath: string,
  billId: string,
  approvedBy: string
): Promise<void> => {
  try {
    const billRef = ref(db, `${basePath}/bills/${billId}`)
    await update(billRef, {
      status: "approved",
      approvedBy,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    // Create transaction for approved bill
    const billSnapshot = await get(billRef)
    if (billSnapshot.exists()) {
      const bill = billSnapshot.val() as Bill
      await createBillTransaction(basePath, bill)
    }
  } catch (error) {
    console.error("Error approving bill:", error)
    throw error
  }
}

// Payment Functions
export const createPaymentAdvanced = async (
  basePath: string,
  paymentData: Omit<Payment, "id" | "paymentNumber" | "createdAt" | "updatedAt">
): Promise<Payment> => {
  try {
    const paymentsRef = ref(db, `${basePath}/payments`)
    const newPaymentRef = push(paymentsRef)
    const id = newPaymentRef.key as string
    const paymentNumber = await generatePaymentNumber(basePath)

    const newPayment: Payment = {
      ...paymentData,
      id,
      paymentNumber,
      currency: paymentData.currency || DEFAULT_CURRENCY,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await set(newPaymentRef, newPayment)

    // Create corresponding transaction
    await createPaymentTransaction(basePath, newPayment)

    return newPayment
  } catch (error) {
    console.error("Error creating payment:", error)
    throw error
  }
}

// Bank Reconciliation Functions
export const startBankReconciliation = async (
  basePath: string,
  bankAccountId: string,
  statementDate: string,
  closingBalance: number,
  reconciledBy: string
): Promise<BankReconciliation> => {
  try {
    const reconciliationsRef = ref(db, `${basePath}/bankReconciliations`)
    const newReconciliationRef = push(reconciliationsRef)
    const id = newReconciliationRef.key as string

    // Get opening balance from previous reconciliation or account
    const openingBalance = await getPreviousReconciliationBalance(basePath, bankAccountId, statementDate)

    // Get unreconciled transactions
    const unreconciledTransactions = await getUnreconciledTransactions(basePath, bankAccountId)

    const newReconciliation: BankReconciliation = {
      id,
      bankAccountId,
      statementDate,
      openingBalance,
      closingBalance,
      reconciledTransactions: [],
      unreconciledTransactions,
      adjustments: [],
      status: "in_progress",
      reconciledBy,
      createdAt: new Date().toISOString()
    }

    await set(newReconciliationRef, newReconciliation)
    return newReconciliation
  } catch (error) {
    console.error("Error starting bank reconciliation:", error)
    throw error
  }
}

// Transaction Creation Helpers
const createInvoiceTransaction = async (basePath: string, invoice: Invoice): Promise<void> => {
  const transactionsRef = ref(db, `${basePath}/transactions`)
  const newTransactionRef = push(transactionsRef)
  const id = newTransactionRef.key as string

  const transaction: Transaction = {
    id,
    transactionNumber: `TXN-${id.slice(-6)}`,
    date: invoice.issueDate,
    description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
    type: "sale",
    status: invoice.status === "paid" ? "completed" : "pending",
    entries: [
      {
        accountId: "accounts_receivable", // This should be configurable
        amount: invoice.totalAmount,
        type: "debit",
        description: `Invoice ${invoice.invoiceNumber}`
      },
      {
        accountId: "revenue", // This should be configurable
        amount: invoice.subtotal,
        type: "credit",
        description: `Sales - Invoice ${invoice.invoiceNumber}`
      },
      {
        accountId: "vat_payable", // This should be configurable
        amount: invoice.taxAmount,
        type: "credit",
        description: `VAT - Invoice ${invoice.invoiceNumber}`
      }
    ],
    totalAmount: invoice.totalAmount,
    currency: invoice.currency,
    sourceDocument: {
      type: "invoice",
      id: invoice.id
    },
    contactId: invoice.customerId,
    isReconciled: false,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  await set(newTransactionRef, transaction)
}

const createBillTransaction = async (basePath: string, bill: Bill): Promise<void> => {
  const transactionsRef = ref(db, `${basePath}/transactions`)
  const newTransactionRef = push(transactionsRef)
  const id = newTransactionRef.key as string

  const transaction: Transaction = {
    id,
    transactionNumber: `TXN-${id.slice(-6)}`,
    date: bill.receiveDate,
    description: `Bill ${bill.billNumber} - ${bill.supplierName}`,
    type: "purchase",
    status: bill.status === "paid" ? "completed" : "pending",
    entries: [
      {
        accountId: "expense", // This should be configurable based on bill line items
        amount: bill.subtotal,
        type: "debit",
        description: `Expense - Bill ${bill.billNumber}`
      },
      {
        accountId: "vat_recoverable", // This should be configurable
        amount: bill.taxAmount,
        type: "debit",
        description: `VAT - Bill ${bill.billNumber}`
      },
      {
        accountId: "accounts_payable", // This should be configurable
        amount: bill.totalAmount,
        type: "credit",
        description: `Bill ${bill.billNumber}`
      }
    ],
    totalAmount: bill.totalAmount,
    currency: bill.currency,
    sourceDocument: {
      type: "bill",
      id: bill.id
    },
    contactId: bill.supplierId,
    isReconciled: false,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  await set(newTransactionRef, transaction)
}

const createPaymentTransaction = async (basePath: string, payment: Payment): Promise<void> => {
  const transactionsRef = ref(db, `${basePath}/transactions`)
  const newTransactionRef = push(transactionsRef)
  const id = newTransactionRef.key as string

  const transaction: Transaction = {
    id,
    transactionNumber: `TXN-${id.slice(-6)}`,
    date: payment.paymentDate,
    description: `Payment ${payment.paymentNumber}`,
    type: payment.type === "customer_payment" ? "receipt" : "payment",
    status: payment.status === "failed" ? "pending" : payment.status,
    entries: [], // Will be populated based on payment allocations
    totalAmount: payment.amount,
    currency: payment.currency,
    bankAccountId: payment.bankAccountId,
    contactId: payment.contactId,
    isReconciled: false,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  await set(newTransactionRef, transaction)
}

// Helper Functions
const updateContactBalance = async (basePath: string, contactId: string, amount: number): Promise<void> => {
  const contactRef = ref(db, `${basePath}/contacts/${contactId}`)
  const contactSnapshot = await get(contactRef)
  
  if (contactSnapshot.exists()) {
    const contact = contactSnapshot.val() as Contact
    const currentBalance = contact.outstandingBalance || 0
    await update(contactRef, {
      outstandingBalance: currentBalance + amount,
      lastTransactionDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }
}

const getPreviousReconciliationBalance = async (
  _basePath: string,
  _bankAccountId: string,
  _statementDate: string
): Promise<number> => {
  // This would get the closing balance from the most recent reconciliation
  // For now, return 0 as a placeholder
  return 0
}

const getUnreconciledTransactions = async (
  _basePath: string,
  _bankAccountId: string
): Promise<string[]> => {
  // This would get all transactions for the bank account that haven't been reconciled
  // For now, return empty array as a placeholder
  return []
}

// Reporting Functions
export const generateProfitLossReport = async (
  basePath: string,
  startDate: string,
  endDate: string
): Promise<FinancialReport> => {
  try {
    // Get all transactions in the period
    const transactionsRef = ref(db, `${basePath}/transactions`)
    const snapshot = await get(transactionsRef)
    
    let revenue = 0
    let expenses = 0
    
    if (snapshot.exists()) {
      const transactions = Object.values(snapshot.val()) as Transaction[]
      
      transactions.forEach(transaction => {
        if (transaction.date >= startDate && transaction.date <= endDate) {
          if (transaction.type === "sale") {
            revenue += transaction.totalAmount
          } else if (transaction.type === "purchase") {
            expenses += transaction.totalAmount
          }
        }
      })
    }

    const profit = revenue - expenses

    const report: FinancialReport = {
      id: uuidv4(),
      name: `Profit & Loss - ${startDate} to ${endDate}`,
      type: "profit_loss",
      period: {
        startDate,
        endDate,
        type: "custom"
      },
      data: {
        revenue,
        expenses,
        profit,
        profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0
      },
      generatedAt: new Date().toISOString(),
      generatedBy: "system"
    }

    // Save report
    const reportsRef = ref(db, `${basePath}/reports`)
    const newReportRef = push(reportsRef)
    await set(newReportRef, report)

    return report
  } catch (error) {
    console.error("Error generating profit & loss report:", error)
    throw error
  }
}

// Tax Functions
export const calculateVAT = (amount: number, vatRate: number = 20): number => {
  return amount * (vatRate / 100)
}

export const getVATRates = (): TaxRate[] => {
  return [
    {
      id: "vat_standard",
      name: "Standard VAT",
      rate: 20,
      type: "VAT",
      isActive: true
    },
    {
      id: "vat_reduced",
      name: "Reduced VAT",
      rate: 5,
      type: "VAT",
      isActive: true
    },
    {
      id: "vat_zero",
      name: "Zero VAT",
      rate: 0,
      type: "VAT",
      isActive: true
    }
  ]
}

// Default Payment Terms
export const getDefaultPaymentTerms = (): PaymentTerm[] => {
  return [
    {
      id: "net_30",
      name: "Net 30",
      days: 30
    },
    {
      id: "net_15",
      name: "Net 15",
      days: 15
    },
    {
      id: "net_7",
      name: "Net 7",
      days: 7
    },
    {
      id: "due_on_receipt",
      name: "Due on Receipt",
      days: 0
    }
  ]
}

// Currency Exchange (placeholder - would integrate with real API)
export const getExchangeRate = async (fromCurrency: string, toCurrency: string): Promise<number> => {
  // For GBP-based system, this would integrate with a real exchange rate API
  if (fromCurrency === toCurrency) return 1
  if (fromCurrency === "GBP" && toCurrency === "USD") return 1.27 // Example rate
  if (fromCurrency === "USD" && toCurrency === "GBP") return 0.79 // Example rate
  return 1 // Default fallback
}

export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  const rate = await getExchangeRate(fromCurrency, toCurrency)
  return amount * rate
}
