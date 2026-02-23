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
  Inventory as InventoryIcon,
  LocalShipping as SupplierIcon,
  IntegrationInstructions as IntegrationIcon,
  Notifications as NotificationsIcon,
  Warning as AlertIcon,
  Save as SaveIcon,
} from "@mui/icons-material"
import { useCompany } from "../../../backend/context/CompanyContext"
import { ref, get, set } from "firebase/database"
import { db } from "../../../backend/services/Firebase"
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
      id={`stock-settings-tabpanel-${index}`}
      aria-labelledby={`stock-settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `stock-settings-tab-${index}`,
    "aria-controls": `stock-settings-tabpanel-${index}`,
  }
}

interface StockSettingsState {
  // General
  defaultUnit: string
  trackBySerialNumber: boolean
  trackByBatchNumber: boolean
  allowNegativeStock: boolean
  autoReorderEnabled: boolean
  
  // Inventory
  lowStockThreshold: number
  reorderPoint: number
  reorderQuantity: number
  stockTakeFrequency: string
  requireApprovalForAdjustments: boolean
  
  // Suppliers
  defaultSupplier: string
  supplierPaymentTerms: number
  autoCreatePurchaseOrders: boolean
  
  // Notifications
  lowStockAlert: boolean
  outOfStockAlert: boolean
  stockTakeReminder: boolean
  supplierOrderReminder: boolean
  
  // Alerts
  alertEmail: string
  alertThreshold: number
}

const StockSettings: React.FC = () => {
  const { state: companyState } = useCompany()
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [settings, setSettings] = useState<StockSettingsState>({
    defaultUnit: "each",
    trackBySerialNumber: false,
    trackByBatchNumber: false,
    allowNegativeStock: false,
    autoReorderEnabled: false,
    lowStockThreshold: 10,
    reorderPoint: 20,
    reorderQuantity: 50,
    stockTakeFrequency: "monthly",
    requireApprovalForAdjustments: true,
    defaultSupplier: "",
    supplierPaymentTerms: 30,
    autoCreatePurchaseOrders: false,
    lowStockAlert: true,
    outOfStockAlert: true,
    stockTakeReminder: true,
    supplierOrderReminder: true,
    alertEmail: "",
    alertThreshold: 5,
  })

  useEffect(() => {
    loadSettings()
  }, [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID])

  const getSettingsPath = () => {
    if (!companyState.companyID) return null
    let path = `companies/${companyState.companyID}/settings/stock`
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
      console.error("Error loading stock settings:", err)
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
      console.error("Error saving stock settings:", err)
      setError("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof StockSettingsState, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const tabs = [
    {
      label: "General",
      icon: <SettingsIcon />,
    },
    {
      label: "Inventory",
      icon: <InventoryIcon />,
    },
    {
      label: "Suppliers",
      icon: <SupplierIcon />,
    },
    {
      label: "Integrations",
      icon: <IntegrationIcon />,
    },
    {
      label: "Notifications",
      icon: <NotificationsIcon />,
    },
    {
      label: "Alerts",
      icon: <AlertIcon />,
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
            aria-label="Stock settings tabs"
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
                <CardHeader title="Tracking Settings" />
                <CardContent>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Default Unit</InputLabel>
                    <Select
                      value={settings.defaultUnit}
                      onChange={(e) => handleChange("defaultUnit", e.target.value)}
                      label="Default Unit"
                    >
                      <MenuItem value="each">Each</MenuItem>
                      <MenuItem value="kg">Kilogram (kg)</MenuItem>
                      <MenuItem value="g">Gram (g)</MenuItem>
                      <MenuItem value="l">Liter (L)</MenuItem>
                      <MenuItem value="ml">Milliliter (mL)</MenuItem>
                      <MenuItem value="box">Box</MenuItem>
                      <MenuItem value="case">Case</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.trackBySerialNumber}
                        onChange={(e) => handleChange("trackBySerialNumber", e.target.checked)}
                      />
                    }
                    label="Track by serial number"
                    sx={{ mb: 2, display: "block" }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.trackByBatchNumber}
                        onChange={(e) => handleChange("trackByBatchNumber", e.target.checked)}
                      />
                    }
                    label="Track by batch number"
                    sx={{ mb: 2, display: "block" }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.allowNegativeStock}
                        onChange={(e) => handleChange("allowNegativeStock", e.target.checked)}
                      />
                    }
                    label="Allow negative stock"
                    sx={{ mb: 2, display: "block" }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Reorder Settings" />
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoReorderEnabled}
                        onChange={(e) => handleChange("autoReorderEnabled", e.target.checked)}
                      />
                    }
                    label="Enable automatic reordering"
                    sx={{ mb: 2, display: "block" }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Inventory Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Inventory Management" />
                <CardContent>
                  <TextField
                    fullWidth
                    label="Low Stock Threshold"
                    type="number"
                    value={settings.lowStockThreshold}
                    onChange={(e) => handleChange("lowStockThreshold", parseInt(e.target.value))}
                    sx={{ mb: 2 }}
                    helperText="Alert when stock falls below this level"
                  />
                  <TextField
                    fullWidth
                    label="Reorder Point"
                    type="number"
                    value={settings.reorderPoint}
                    onChange={(e) => handleChange("reorderPoint", parseInt(e.target.value))}
                    sx={{ mb: 2 }}
                    helperText="Automatically reorder when stock reaches this level"
                  />
                  <TextField
                    fullWidth
                    label="Reorder Quantity"
                    type="number"
                    value={settings.reorderQuantity}
                    onChange={(e) => handleChange("reorderQuantity", parseInt(e.target.value))}
                    sx={{ mb: 2 }}
                    helperText="Default quantity to reorder"
                  />
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Stock Take Frequency</InputLabel>
                    <Select
                      value={settings.stockTakeFrequency}
                      onChange={(e) => handleChange("stockTakeFrequency", e.target.value)}
                      label="Stock Take Frequency"
                    >
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="quarterly">Quarterly</MenuItem>
                      <MenuItem value="annually">Annually</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.requireApprovalForAdjustments}
                        onChange={(e) => handleChange("requireApprovalForAdjustments", e.target.checked)}
                      />
                    }
                    label="Require approval for stock adjustments"
                    sx={{ display: "block" }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Suppliers Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Supplier Settings" />
                <CardContent>
                  <TextField
                    fullWidth
                    label="Default Supplier"
                    value={settings.defaultSupplier}
                    onChange={(e) => handleChange("defaultSupplier", e.target.value)}
                    sx={{ mb: 2 }}
                    helperText="Default supplier for new items"
                  />
                  <TextField
                    fullWidth
                    label="Supplier Payment Terms (days)"
                    type="number"
                    value={settings.supplierPaymentTerms}
                    onChange={(e) => handleChange("supplierPaymentTerms", parseInt(e.target.value))}
                    sx={{ mb: 2 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoCreatePurchaseOrders}
                        onChange={(e) => handleChange("autoCreatePurchaseOrders", e.target.checked)}
                      />
                    }
                    label="Auto-create purchase orders when reorder point is reached"
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
              <IntegrationManager
                module="stock"
                availableIntegrations={[
                  {
                    id: "lightspeed",
                    name: "Lightspeed Retail",
                    description: "Sync products and inventory with Lightspeed",
                    icon: "🛒",
                    enabled: false,
                  },
                  {
                    id: "square",
                    name: "Square",
                    description: "Sync inventory with Square POS",
                    icon: "📱",
                    enabled: false,
                  },
                  {
                    id: "shopify",
                    name: "Shopify",
                    description: "Sync products and inventory with Shopify",
                    icon: "🛍️",
                    enabled: false,
                  },
                ]}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={activeTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Notification Settings" />
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.lowStockAlert}
                        onChange={(e) => handleChange("lowStockAlert", e.target.checked)}
                      />
                    }
                    label="Low stock alert"
                    sx={{ mb: 2, display: "block" }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.outOfStockAlert}
                        onChange={(e) => handleChange("outOfStockAlert", e.target.checked)}
                      />
                    }
                    label="Out of stock alert"
                    sx={{ mb: 2, display: "block" }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.stockTakeReminder}
                        onChange={(e) => handleChange("stockTakeReminder", e.target.checked)}
                      />
                    }
                    label="Stock take reminder"
                    sx={{ mb: 2, display: "block" }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.supplierOrderReminder}
                        onChange={(e) => handleChange("supplierOrderReminder", e.target.checked)}
                      />
                    }
                    label="Supplier order reminder"
                    sx={{ display: "block" }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Alerts Tab */}
        <TabPanel value={activeTab} index={5}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Alert Settings" />
                <CardContent>
                  <TextField
                    fullWidth
                    label="Alert Email"
                    type="email"
                    value={settings.alertEmail}
                    onChange={(e) => handleChange("alertEmail", e.target.value)}
                    sx={{ mb: 2 }}
                    helperText="Email address to receive stock alerts"
                  />
                  <TextField
                    fullWidth
                    label="Alert Threshold"
                    type="number"
                    value={settings.alertThreshold}
                    onChange={(e) => handleChange("alertThreshold", parseInt(e.target.value))}
                    helperText="Minimum stock level to trigger alert"
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

export default StockSettings

