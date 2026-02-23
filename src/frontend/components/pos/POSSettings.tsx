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
  Payment as PaymentIcon,
  Devices as DevicesIcon,
  IntegrationInstructions as IntegrationIcon,
  Save as SaveIcon,
} from "@mui/icons-material"
import { useCompany } from "../../../backend/context/CompanyContext"
import { ref, get, set } from "firebase/database"
import { db } from "../../../backend/services/Firebase"
import POSIntegrationSettings from "./POSIntegrationSettings"
import IntegrationManager from "../reusable/IntegrationManager"

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
      id={`pos-settings-tabpanel-${index}`}
      aria-labelledby={`pos-settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `pos-settings-tab-${index}`,
    "aria-controls": `pos-settings-tabpanel-${index}`,
  }
}

interface POSSettingsState {
  // General
  defaultCurrency: string
  taxInclusive: boolean
  defaultTaxRate: number
  receiptFooter: string
  printReceiptAutomatically: boolean
  
  // Payment Methods
  acceptedPaymentMethods: string[]
  cashPaymentEnabled: boolean
  cardPaymentEnabled: boolean
  contactlessEnabled: boolean
  tipEnabled: boolean
  defaultTipPercentage: number
  
  // Hardware
  receiptPrinterEnabled: boolean
  receiptPrinterName: string
  barcodeScannerEnabled: boolean
  scaleEnabled: boolean
  cashDrawerEnabled: boolean
}

const POSSettings: React.FC = () => {
  const { state: companyState } = useCompany()
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [settings, setSettings] = useState<POSSettingsState>({
    defaultCurrency: "GBP",
    taxInclusive: false,
    defaultTaxRate: 20,
    receiptFooter: "Thank you for your business!",
    printReceiptAutomatically: true,
    acceptedPaymentMethods: ["Cash", "Card", "Contactless"],
    cashPaymentEnabled: true,
    cardPaymentEnabled: true,
    contactlessEnabled: true,
    tipEnabled: false,
    defaultTipPercentage: 10,
    receiptPrinterEnabled: false,
    receiptPrinterName: "",
    barcodeScannerEnabled: false,
    scaleEnabled: false,
    cashDrawerEnabled: false,
  })

  useEffect(() => {
    loadSettings()
  }, [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID])

  const getSettingsPath = () => {
    if (!companyState.companyID) return null
    let path = `companies/${companyState.companyID}/settings/pos`
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
      console.error("Error loading POS settings:", err)
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
      console.error("Error saving POS settings:", err)
      setError("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof POSSettingsState, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const tabs = [
    {
      label: "General",
      icon: <SettingsIcon />,
    },
    {
      label: "Payment Methods",
      icon: <PaymentIcon />,
    },
    {
      label: "Hardware",
      icon: <DevicesIcon />,
    },
    {
      label: "Integrations",
      icon: <IntegrationIcon />,
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
            aria-label="POS settings tabs"
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
                <CardHeader title="Currency & Tax" />
                <CardContent>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Default Currency</InputLabel>
                    <Select
                      value={settings.defaultCurrency}
                      onChange={(e) => handleChange("defaultCurrency", e.target.value)}
                      label="Default Currency"
                    >
                      <MenuItem value="GBP">GBP (£)</MenuItem>
                      <MenuItem value="USD">USD ($)</MenuItem>
                      <MenuItem value="EUR">EUR (€)</MenuItem>
                    </Select>
                  </FormControl>
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
                    label="Default Tax Rate (%)"
                    type="number"
                    value={settings.defaultTaxRate}
                    onChange={(e) => handleChange("defaultTaxRate", parseFloat(e.target.value))}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Receipt Settings" />
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.printReceiptAutomatically}
                        onChange={(e) => handleChange("printReceiptAutomatically", e.target.checked)}
                      />
                    }
                    label="Print receipt automatically"
                    sx={{ mb: 2, display: "block" }}
                  />
                  <TextField
                    fullWidth
                    label="Receipt Footer"
                    multiline
                    rows={3}
                    value={settings.receiptFooter}
                    onChange={(e) => handleChange("receiptFooter", e.target.value)}
                    helperText="Text to display at the bottom of receipts"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Payment Methods Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Payment Method Settings" />
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.cashPaymentEnabled}
                        onChange={(e) => handleChange("cashPaymentEnabled", e.target.checked)}
                      />
                    }
                    label="Enable cash payments"
                    sx={{ mb: 2, display: "block" }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.cardPaymentEnabled}
                        onChange={(e) => handleChange("cardPaymentEnabled", e.target.checked)}
                      />
                    }
                    label="Enable card payments"
                    sx={{ mb: 2, display: "block" }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.contactlessEnabled}
                        onChange={(e) => handleChange("contactlessEnabled", e.target.checked)}
                      />
                    }
                    label="Enable contactless payments"
                    sx={{ mb: 2, display: "block" }}
                  />
                  <Divider sx={{ my: 2 }} />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.tipEnabled}
                        onChange={(e) => handleChange("tipEnabled", e.target.checked)}
                      />
                    }
                    label="Enable tips"
                    sx={{ mb: 2, display: "block" }}
                  />
                  {settings.tipEnabled && (
                    <TextField
                      fullWidth
                      label="Default Tip Percentage (%)"
                      type="number"
                      value={settings.defaultTipPercentage}
                      onChange={(e) => handleChange("defaultTipPercentage", parseFloat(e.target.value))}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Hardware Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Hardware Configuration" />
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.receiptPrinterEnabled}
                        onChange={(e) => handleChange("receiptPrinterEnabled", e.target.checked)}
                      />
                    }
                    label="Enable receipt printer"
                    sx={{ mb: 2, display: "block" }}
                  />
                  {settings.receiptPrinterEnabled && (
                    <TextField
                      fullWidth
                      label="Receipt Printer Name"
                      value={settings.receiptPrinterName}
                      onChange={(e) => handleChange("receiptPrinterName", e.target.value)}
                      sx={{ mb: 2 }}
                      helperText="Name of the printer as configured in your system"
                    />
                  )}
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.barcodeScannerEnabled}
                        onChange={(e) => handleChange("barcodeScannerEnabled", e.target.checked)}
                      />
                    }
                    label="Enable barcode scanner"
                    sx={{ mb: 2, display: "block" }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.scaleEnabled}
                        onChange={(e) => handleChange("scaleEnabled", e.target.checked)}
                      />
                    }
                    label="Enable scale"
                    sx={{ mb: 2, display: "block" }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.cashDrawerEnabled}
                        onChange={(e) => handleChange("cashDrawerEnabled", e.target.checked)}
                      />
                    }
                    label="Enable cash drawer"
                    sx={{ display: "block" }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Integrations Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="POS System Integrations" />
                <CardContent>
                  <POSIntegrationSettings />
                  <Divider sx={{ my: 4 }} />
                  <IntegrationManager
                    module="pos"
                    availableIntegrations={[
                      {
                        id: "lightspeed",
                        name: "Lightspeed Retail",
                        description: "Sync products, inventory, and sales with Lightspeed",
                        icon: "🛒",
                        enabled: false,
                      },
                      {
                        id: "square",
                        name: "Square",
                        description: "Sync with Square POS system",
                        icon: "📱",
                        enabled: false,
                      },
                      {
                        id: "toast",
                        name: "Toast",
                        description: "Sync with Toast POS system",
                        icon: "🍞",
                        enabled: false,
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  )
}

export default POSSettings

