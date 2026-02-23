"use client"

import React, { useState, useEffect } from "react"
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Typography,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material"
import {
  Settings as SettingsIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  LocalAtm as TaxIcon,
  IntegrationInstructions as IntegrationIcon,
  Notifications as NotificationsIcon,
  Save as SaveIcon,
} from "@mui/icons-material"
import { useCompany } from "../../../backend/context/CompanyContext"
import { ref, get, set } from "firebase/database"
import { db } from "../../../backend/services/Firebase"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`finance-settings-tabpanel-${index}`}
      aria-labelledby={`finance-settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `finance-settings-tab-${index}`,
    "aria-controls": `finance-settings-tabpanel-${index}`,
  }
}

interface FinanceSettingsState {
  // General
  currency: string
  fiscalYearStart: string
  defaultPaymentTerms: number
  autoNumberInvoices: boolean
  invoicePrefix: string
  invoiceNumberFormat: string
  
  // Invoicing
  defaultInvoiceTemplate: string
  sendInvoiceAutomatically: boolean
  invoiceReminderDays: number[]
  allowPartialPayments: boolean
  requirePurchaseOrder: boolean
  
  // Payments
  paymentMethods: string[]
  defaultPaymentMethod: string
  autoApplyPayments: boolean
  paymentReminderEnabled: boolean
  paymentReminderDays: number
  
  // Tax
  taxEnabled: boolean
  defaultTaxRate: number
  taxInclusive: boolean
  vatNumber: string
  
  // Notifications
  emailNotifications: boolean
  lowBalanceAlert: boolean
  lowBalanceThreshold: number
  overdueInvoiceAlert: boolean
  overdueInvoiceDays: number
  
  // Integrations
  accountingSoftware: string
  bankIntegration: string
}

const FinanceSettings: React.FC = () => {
  const { state: companyState } = useCompany()
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [settings, setSettings] = useState<FinanceSettingsState>({
    currency: "GBP",
    fiscalYearStart: "04-01",
    defaultPaymentTerms: 30,
    autoNumberInvoices: true,
    invoicePrefix: "INV",
    invoiceNumberFormat: "INV-{YYYY}-{####}",
    defaultInvoiceTemplate: "standard",
    sendInvoiceAutomatically: false,
    invoiceReminderDays: [7, 14, 30],
    allowPartialPayments: true,
    requirePurchaseOrder: false,
    paymentMethods: ["Bank Transfer", "Card", "Cash", "Cheque"],
    defaultPaymentMethod: "Bank Transfer",
    autoApplyPayments: true,
    paymentReminderEnabled: true,
    paymentReminderDays: 7,
    taxEnabled: true,
    defaultTaxRate: 20,
    taxInclusive: false,
    vatNumber: "",
    emailNotifications: true,
    lowBalanceAlert: true,
    lowBalanceThreshold: 1000,
    overdueInvoiceAlert: true,
    overdueInvoiceDays: 30,
    accountingSoftware: "",
    bankIntegration: "",
  })

  useEffect(() => {
    loadSettings()
  }, [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID])

  const getSettingsPath = () => {
    if (!companyState.companyID) return null
    let path = `companies/${companyState.companyID}/settings/finance`
    if (companyState.selectedSiteID) {
      path += `/sites/${companyState.selectedSiteID}`
      if (companyState.selectedSubsiteID) {
        path += `/subsites/${companyState.selectedSubsiteID}`
      }
    }
    return path
  }

  const loadSettings = async () => {
    const path = getSettingsPath()
    if (!path) return

    try {
      setLoading(true)
      const settingsRef = ref(db, path)
      const snapshot = await get(settingsRef)
      
      if (snapshot.exists()) {
        setSettings({ ...settings, ...snapshot.val() })
      }
    } catch (err: any) {
      console.error("Error loading finance settings:", err)
      setError("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    const path = getSettingsPath()
    if (!path) return

    try {
      setSaving(true)
      setError(null)
      const settingsRef = ref(db, path)
      await set(settingsRef, {
        ...settings,
        updatedAt: Date.now(),
      })
      setSuccess("Settings saved successfully")
    } catch (err: any) {
      console.error("Error saving finance settings:", err)
      setError("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof FinanceSettingsState, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const tabs = [
    {
      label: "General",
      icon: <SettingsIcon />,
    },
    {
      label: "Invoicing",
      icon: <ReceiptIcon />,
    },
    {
      label: "Payments",
      icon: <PaymentIcon />,
    },
    {
      label: "Tax",
      icon: <TaxIcon />,
    },
    {
      label: "Integrations",
      icon: <IntegrationIcon />,
    },
    {
      label: "Notifications",
      icon: <NotificationsIcon />,
    },
  ]

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ width: "100%", pt: 2 }}>
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Paper sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            aria-label="Finance settings tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                {...a11yProps(index)}
              />
            ))}
          </Tabs>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </Box>

        {/* General Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Currency & Formatting" />
                <CardContent>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={settings.currency}
                      onChange={(e) => handleChange("currency", e.target.value)}
                      label="Currency"
                    >
                      <MenuItem value="GBP">GBP (£)</MenuItem>
                      <MenuItem value="USD">USD ($)</MenuItem>
                      <MenuItem value="EUR">EUR (€)</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="Fiscal Year Start"
                    type="date"
                    value={`2024-${settings.fiscalYearStart}`}
                    onChange={(e) => {
                      const date = new Date(e.target.value)
                      const month = String(date.getMonth() + 1).padStart(2, "0")
                      const day = String(date.getDate()).padStart(2, "0")
                      handleChange("fiscalYearStart", `${month}-${day}`)
                    }}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Default Payment Terms (days)"
                    type="number"
                    value={settings.defaultPaymentTerms}
                    onChange={(e) => handleChange("defaultPaymentTerms", parseInt(e.target.value))}
                    sx={{ mb: 2 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Invoice Numbering" />
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoNumberInvoices}
                        onChange={(e) => handleChange("autoNumberInvoices", e.target.checked)}
                      />
                    }
                    label="Auto-number invoices"
                    sx={{ mb: 2, display: "block" }}
                  />
                  <TextField
                    fullWidth
                    label="Invoice Prefix"
                    value={settings.invoicePrefix}
                    onChange={(e) => handleChange("invoicePrefix", e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Invoice Number Format"
                    value={settings.invoiceNumberFormat}
                    onChange={(e) => handleChange("invoiceNumberFormat", e.target.value)}
                    helperText="Use {YYYY} for year, {####} for sequential number"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Invoicing Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Invoice Settings" />
                <CardContent>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Default Invoice Template</InputLabel>
                    <Select
                      value={settings.defaultInvoiceTemplate}
                      onChange={(e) => handleChange("defaultInvoiceTemplate", e.target.value)}
                      label="Default Invoice Template"
                    >
                      <MenuItem value="standard">Standard</MenuItem>
                      <MenuItem value="detailed">Detailed</MenuItem>
                      <MenuItem value="minimal">Minimal</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.sendInvoiceAutomatically}
                        onChange={(e) => handleChange("sendInvoiceAutomatically", e.target.checked)}
                      />
                    }
                    label="Send invoices automatically"
                    sx={{ mb: 2, display: "block" }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.allowPartialPayments}
                        onChange={(e) => handleChange("allowPartialPayments", e.target.checked)}
                      />
                    }
                    label="Allow partial payments"
                    sx={{ mb: 2, display: "block" }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.requirePurchaseOrder}
                        onChange={(e) => handleChange("requirePurchaseOrder", e.target.checked)}
                      />
                    }
                    label="Require purchase order"
                    sx={{ mb: 2, display: "block" }}
                  />
                  <TextField
                    fullWidth
                    label="Invoice Reminder Days"
                    value={settings.invoiceReminderDays.join(", ")}
                    onChange={(e) => {
                      const days = e.target.value.split(",").map((d) => parseInt(d.trim())).filter((d) => !isNaN(d))
                      handleChange("invoiceReminderDays", days)
                    }}
                    helperText="Comma-separated list of days (e.g., 7, 14, 30)"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Payments Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Payment Settings" />
                <CardContent>
                  <TextField
                    fullWidth
                    label="Payment Methods"
                    value={settings.paymentMethods.join(", ")}
                    onChange={(e) => {
                      const methods = e.target.value.split(",").map((m) => m.trim()).filter(Boolean)
                      handleChange("paymentMethods", methods)
                    }}
                    helperText="Comma-separated list of payment methods"
                    sx={{ mb: 2 }}
                  />
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Default Payment Method</InputLabel>
                    <Select
                      value={settings.defaultPaymentMethod}
                      onChange={(e) => handleChange("defaultPaymentMethod", e.target.value)}
                      label="Default Payment Method"
                    >
                      {settings.paymentMethods.map((method) => (
                        <MenuItem key={method} value={method}>
                          {method}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoApplyPayments}
                        onChange={(e) => handleChange("autoApplyPayments", e.target.checked)}
                      />
                    }
                    label="Auto-apply payments to invoices"
                    sx={{ mb: 2, display: "block" }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.paymentReminderEnabled}
                        onChange={(e) => handleChange("paymentReminderEnabled", e.target.checked)}
                      />
                    }
                    label="Enable payment reminders"
                    sx={{ mb: 2, display: "block" }}
                  />
                  {settings.paymentReminderEnabled && (
                    <TextField
                      fullWidth
                      label="Payment Reminder Days"
                      type="number"
                      value={settings.paymentReminderDays}
                      onChange={(e) => handleChange("paymentReminderDays", parseInt(e.target.value))}
                      helperText="Days before due date to send reminder"
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tax Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Tax Settings" />
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.taxEnabled}
                        onChange={(e) => handleChange("taxEnabled", e.target.checked)}
                      />
                    }
                    label="Enable tax calculations"
                    sx={{ mb: 2, display: "block" }}
                  />
                  {settings.taxEnabled && (
                    <>
                      <TextField
                        fullWidth
                        label="Default Tax Rate (%)"
                        type="number"
                        value={settings.defaultTaxRate}
                        onChange={(e) => handleChange("defaultTaxRate", parseFloat(e.target.value))}
                        sx={{ mb: 2 }}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.taxInclusive}
                            onChange={(e) => handleChange("taxInclusive", e.target.checked)}
                          />
                        }
                        label="Prices include tax"
                        sx={{ mb: 2, display: "block" }}
                      />
                      <TextField
                        fullWidth
                        label="VAT Number"
                        value={settings.vatNumber}
                        onChange={(e) => handleChange("vatNumber", e.target.value)}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Integrations Tab */}
        <TabPanel value={activeTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Accounting Software Integration" />
                <CardContent>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Accounting Software</InputLabel>
                    <Select
                      value={settings.accountingSoftware}
                      onChange={(e) => handleChange("accountingSoftware", e.target.value)}
                      label="Accounting Software"
                    >
                      <MenuItem value="">None</MenuItem>
                      <MenuItem value="xero">Xero</MenuItem>
                      <MenuItem value="quickbooks">QuickBooks</MenuItem>
                      <MenuItem value="sage">Sage</MenuItem>
                      <MenuItem value="freeagent">FreeAgent</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Bank Integration</InputLabel>
                    <Select
                      value={settings.bankIntegration}
                      onChange={(e) => handleChange("bankIntegration", e.target.value)}
                      label="Bank Integration"
                    >
                      <MenuItem value="">None</MenuItem>
                      <MenuItem value="openbanking">Open Banking</MenuItem>
                      <MenuItem value="plaid">Plaid</MenuItem>
                      <MenuItem value="yodlee">Yodlee</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={activeTab} index={5}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Notification Settings" />
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.emailNotifications}
                        onChange={(e) => handleChange("emailNotifications", e.target.checked)}
                      />
                    }
                    label="Enable email notifications"
                    sx={{ mb: 2, display: "block" }}
                  />
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Alerts
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.lowBalanceAlert}
                        onChange={(e) => handleChange("lowBalanceAlert", e.target.checked)}
                      />
                    }
                    label="Low balance alert"
                    sx={{ mb: 2, display: "block" }}
                  />
                  {settings.lowBalanceAlert && (
                    <TextField
                      fullWidth
                      label="Low Balance Threshold"
                      type="number"
                      value={settings.lowBalanceThreshold}
                      onChange={(e) => handleChange("lowBalanceThreshold", parseFloat(e.target.value))}
                      sx={{ mb: 2 }}
                    />
                  )}
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.overdueInvoiceAlert}
                        onChange={(e) => handleChange("overdueInvoiceAlert", e.target.checked)}
                      />
                    }
                    label="Overdue invoice alert"
                    sx={{ mb: 2, display: "block" }}
                  />
                  {settings.overdueInvoiceAlert && (
                    <TextField
                      fullWidth
                      label="Overdue Invoice Days"
                      type="number"
                      value={settings.overdueInvoiceDays}
                      onChange={(e) => handleChange("overdueInvoiceDays", parseInt(e.target.value))}
                      helperText="Days after due date to send alert"
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  )
}

export default FinanceSettings
