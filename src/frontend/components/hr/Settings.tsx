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
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material"
import { Save as SaveIcon } from "@mui/icons-material"
import { useCompany } from "../../../backend/context/CompanyContext"
import { ref, get, set } from "firebase/database"
import { db } from "../../../backend/services/Firebase"
import {
  Settings as SettingsIcon,
  AccountBalance as AccountBalanceIcon,
  People as PeopleIcon,
  Send as SendIcon,
  VpnKey as VpnKeyIcon,
  Notifications as NotificationsIcon,
  Gavel as ComplianceIcon,
  IntegrationInstructions as IntegrationIcon,
} from "@mui/icons-material"
import HMRCSettingsTab from "./settings/HMRCSettingsTab"
import PayrollSettingsTab from "./settings/PayrollSettingsTab"
import EmployeeDefaultsTab from "./settings/EmployeeDefaultsTab"
import RTISubmissionTab from "./settings/RTISubmissionTab"
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
      id={`hr-settings-tabpanel-${index}`}
      aria-labelledby={`hr-settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `hr-settings-tab-${index}`,
    'aria-controls': `hr-settings-tabpanel-${index}`,
  }
}

const HRSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const tabs = [
    {
      label: "General",
      icon: <SettingsIcon />,
      component: <GeneralHRSettingsTab />,
    },
    {
      label: "HMRC Integration",
      icon: <VpnKeyIcon />,
      component: <HMRCSettingsTab />,
    },
    {
      label: "Payroll Settings",
      icon: <AccountBalanceIcon />,
      component: <PayrollSettingsTab />,
    },
    {
      label: "Employee Defaults",
      icon: <PeopleIcon />,
      component: <EmployeeDefaultsTab />,
    },
    {
      label: "RTI Submission",
      icon: <SendIcon />,
      component: <RTISubmissionTab />,
    },
    {
      label: "Compliance",
      icon: <ComplianceIcon />,
      component: <ComplianceSettingsTab />,
    },
    {
      label: "Notifications",
      icon: <NotificationsIcon />,
      component: <NotificationsSettingsTab />,
    },
    {
      label: "Integrations",
      icon: <IntegrationIcon />,
      component: <IntegrationsSettingsTab />,
    },
  ]

  return (
    <Box sx={{ width: "100%", pt: 2 }}>
      <Paper sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="HR settings tabs"
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
        </Box>

        {tabs.map((tab, index) => (
          <TabPanel key={index} value={activeTab} index={index}>
            {tab.component}
          </TabPanel>
        ))}
      </Paper>
    </Box>
  )
}

// General HR Settings Tab Component
const GeneralHRSettingsTab: React.FC = () => {
  const { state: companyState } = useCompany()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    defaultWorkWeekHours: 40,
    defaultHolidayEntitlement: 28,
    probationPeriodDays: 90,
    requireApprovalForLeave: true,
    autoCalculateHoliday: true,
  })

  useEffect(() => {
    loadSettings()
  }, [companyState.companyID])

  const getSettingsPath = () => {
    if (!companyState.companyID) return null
    return `companies/${companyState.companyID}/settings/hr/general`
  }

  const loadSettings = async () => {
    const path = getSettingsPath()
    if (!path) return
    try {
      const settingsRef = ref(db, path)
      const snapshot = await get(settingsRef)
      if (snapshot.exists()) {
        setSettings({ ...settings, ...snapshot.val() })
      }
    } catch (err: any) {
      console.error("Error loading HR general settings:", err)
    }
  }

  const saveSettings = async () => {
    const path = getSettingsPath()
    if (!path) return
    try {
      setSaving(true)
      const settingsRef = ref(db, path)
      await set(settingsRef, { ...settings, updatedAt: Date.now() })
      setSuccess("Settings saved successfully")
    } catch (err: any) {
      setError("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title="General HR Settings" />
            <CardContent>
              <TextField
                fullWidth
                label="Default Work Week Hours"
                type="number"
                value={settings.defaultWorkWeekHours}
                onChange={(e) => setSettings({ ...settings, defaultWorkWeekHours: parseInt(e.target.value) })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Default Holiday Entitlement (days)"
                type="number"
                value={settings.defaultHolidayEntitlement}
                onChange={(e) => setSettings({ ...settings, defaultHolidayEntitlement: parseInt(e.target.value) })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Probation Period (days)"
                type="number"
                value={settings.probationPeriodDays}
                onChange={(e) => setSettings({ ...settings, probationPeriodDays: parseInt(e.target.value) })}
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.requireApprovalForLeave}
                    onChange={(e) => setSettings({ ...settings, requireApprovalForLeave: e.target.checked })}
                  />
                }
                label="Require approval for leave requests"
                sx={{ mb: 2, display: "block" }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoCalculateHoliday}
                    onChange={(e) => setSettings({ ...settings, autoCalculateHoliday: e.target.checked })}
                  />
                }
                label="Auto-calculate holiday entitlement"
                sx={{ display: "block" }}
              />
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                onClick={saveSettings}
                disabled={saving}
                sx={{ mt: 2 }}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert severity="success">{success}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Box>
  )
}

// Compliance Settings Tab Component
const ComplianceSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState({
    gdprCompliance: true,
    dataRetentionDays: 2555, // 7 years
    requireRightToWorkCheck: true,
    requireDBSCheck: false,
    autoArchiveAfterYears: 7,
  })

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Compliance Settings" />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.gdprCompliance}
                    onChange={(e) => setSettings({ ...settings, gdprCompliance: e.target.checked })}
                  />
                }
                label="Enable GDPR compliance"
                sx={{ mb: 2, display: "block" }}
              />
              <TextField
                fullWidth
                label="Data Retention Period (days)"
                type="number"
                value={settings.dataRetentionDays}
                onChange={(e) => setSettings({ ...settings, dataRetentionDays: parseInt(e.target.value) })}
                sx={{ mb: 2 }}
                helperText="How long to retain employee data after termination"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.requireRightToWorkCheck}
                    onChange={(e) => setSettings({ ...settings, requireRightToWorkCheck: e.target.checked })}
                  />
                }
                label="Require right to work check"
                sx={{ mb: 2, display: "block" }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.requireDBSCheck}
                    onChange={(e) => setSettings({ ...settings, requireDBSCheck: e.target.checked })}
                  />
                }
                label="Require DBS check"
                sx={{ display: "block" }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

// Notifications Settings Tab Component
const NotificationsSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    leaveRequestNotifications: true,
    absenceNotifications: true,
    documentExpiryNotifications: true,
    rightToWorkExpiryNotifications: true,
  })

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Notification Settings" />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  />
                }
                label="Enable email notifications"
                sx={{ mb: 2, display: "block" }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.leaveRequestNotifications}
                    onChange={(e) => setSettings({ ...settings, leaveRequestNotifications: e.target.checked })}
                  />
                }
                label="Leave request notifications"
                sx={{ mb: 2, display: "block" }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.absenceNotifications}
                    onChange={(e) => setSettings({ ...settings, absenceNotifications: e.target.checked })}
                  />
                }
                label="Absence notifications"
                sx={{ mb: 2, display: "block" }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.documentExpiryNotifications}
                    onChange={(e) => setSettings({ ...settings, documentExpiryNotifications: e.target.checked })}
                  />
                }
                label="Document expiry notifications"
                sx={{ mb: 2, display: "block" }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.rightToWorkExpiryNotifications}
                    onChange={(e) => setSettings({ ...settings, rightToWorkExpiryNotifications: e.target.checked })}
                  />
                }
                label="Right to work expiry notifications"
                sx={{ display: "block" }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

// Integrations Settings Tab Component
const IntegrationsSettingsTab: React.FC = () => {
  return (
    <Box>
      <IntegrationManager
        module="hr"
        availableIntegrations={[
          {
            id: "hmrc",
            name: "HMRC",
            description: "Connect with HMRC for RTI submissions and payroll",
            icon: "🏛️",
            enabled: false,
          },
          {
            id: "sage",
            name: "Sage Payroll",
            description: "Sync payroll data with Sage",
            icon: "📊",
            enabled: false,
          },
          {
            id: "xero",
            name: "Xero",
            description: "Sync payroll data with Xero",
            icon: "💼",
            enabled: false,
          },
        ]}
      />
    </Box>
  )
}

export default HRSettings
