"use client"

import React, { useState } from "react"
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Switch,
  FormControlLabel,
  Grid,
} from "@mui/material"
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  IntegrationInstructions as IntegrationIcon,
  AutoAwesome as AutomationIcon,
} from "@mui/icons-material"
import BookingSettings from "./BookingSettings"
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
      id={`bookings-settings-tabpanel-${index}`}
      aria-labelledby={`bookings-settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `bookings-settings-tab-${index}`,
    "aria-controls": `bookings-settings-tabpanel-${index}`,
  }
}

// General Settings Tab - Extract general settings from BookingSettings
const GeneralSettingsTab: React.FC = () => {
  return <BookingSettings />
}

// Notifications Settings Tab
const NotificationsSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    bookingConfirmationEmail: true,
    bookingReminderEmail: true,
    cancellationEmail: true,
    reminderHoursBefore: 24,
    confirmationEmailTemplate: "Thank you for your booking!",
  })

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Email Notifications" />
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
                    checked={settings.bookingConfirmationEmail}
                    onChange={(e) => setSettings({ ...settings, bookingConfirmationEmail: e.target.checked })}
                  />
                }
                label="Send booking confirmation emails"
                sx={{ mb: 2, display: "block" }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.bookingReminderEmail}
                    onChange={(e) => setSettings({ ...settings, bookingReminderEmail: e.target.checked })}
                  />
                }
                label="Send booking reminder emails"
                sx={{ mb: 2, display: "block" }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.cancellationEmail}
                    onChange={(e) => setSettings({ ...settings, cancellationEmail: e.target.checked })}
                  />
                }
                label="Send cancellation emails"
                sx={{ mb: 2, display: "block" }}
              />
              <TextField
                fullWidth
                label="Reminder Hours Before Booking"
                type="number"
                value={settings.reminderHoursBefore}
                onChange={(e) => setSettings({ ...settings, reminderHoursBefore: parseInt(e.target.value) })}
                sx={{ mb: 2 }}
                helperText="Hours before booking to send reminder"
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardHeader title="SMS Notifications" />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.smsNotifications}
                    onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                  />
                }
                label="Enable SMS notifications"
                sx={{ display: "block" }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

// Integrations Settings Tab
const IntegrationsSettingsTab: React.FC = () => {
  return (
    <Box>
      <IntegrationManager
        module="bookings"
        availableIntegrations={[
          {
            id: "google-calendar",
            name: "Google Calendar",
            description: "Sync bookings with Google Calendar",
            icon: "📅",
            enabled: false,
          },
          {
            id: "outlook-calendar",
            name: "Outlook Calendar",
            description: "Sync bookings with Outlook Calendar",
            icon: "📆",
            enabled: false,
          },
          {
            id: "opentable",
            name: "OpenTable",
            description: "Sync with OpenTable reservation system",
            icon: "🍽️",
            enabled: false,
          },
          {
            id: "resy",
            name: "Resy",
            description: "Sync with Resy reservation system",
            icon: "🍴",
            enabled: false,
          },
        ]}
      />
    </Box>
  )
}

// Automation Settings Tab
const AutomationSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState({
    autoConfirmBookings: false,
    autoAssignTables: false,
    autoSendReminders: true,
    autoCancelNoShows: false,
    noShowGracePeriod: 15, // minutes
    waitlistAutoPromote: true,
    waitlistPromotionHours: 2,
  })

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Booking Automation" />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoConfirmBookings}
                    onChange={(e) => setSettings({ ...settings, autoConfirmBookings: e.target.checked })}
                  />
                }
                label="Auto-confirm bookings"
                sx={{ mb: 2, display: "block" }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoAssignTables}
                    onChange={(e) => setSettings({ ...settings, autoAssignTables: e.target.checked })}
                  />
                }
                label="Auto-assign tables"
                sx={{ mb: 2, display: "block" }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoSendReminders}
                    onChange={(e) => setSettings({ ...settings, autoSendReminders: e.target.checked })}
                  />
                }
                label="Auto-send reminders"
                sx={{ mb: 2, display: "block" }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoCancelNoShows}
                    onChange={(e) => setSettings({ ...settings, autoCancelNoShows: e.target.checked })}
                  />
                }
                label="Auto-cancel no-shows"
                sx={{ mb: 2, display: "block" }}
              />
              {settings.autoCancelNoShows && (
                <TextField
                  fullWidth
                  label="No-Show Grace Period (minutes)"
                  type="number"
                  value={settings.noShowGracePeriod}
                  onChange={(e) => setSettings({ ...settings, noShowGracePeriod: parseInt(e.target.value) })}
                  sx={{ mb: 2 }}
                  helperText="Minutes after booking time before auto-canceling"
                />
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Waitlist Automation" />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.waitlistAutoPromote}
                    onChange={(e) => setSettings({ ...settings, waitlistAutoPromote: e.target.checked })}
                  />
                }
                label="Auto-promote from waitlist"
                sx={{ mb: 2, display: "block" }}
              />
              {settings.waitlistAutoPromote && (
                <TextField
                  fullWidth
                  label="Promotion Hours Before Booking"
                  type="number"
                  value={settings.waitlistPromotionHours}
                  onChange={(e) => setSettings({ ...settings, waitlistPromotionHours: parseInt(e.target.value) })}
                  helperText="Hours before booking time to promote from waitlist"
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

const BookingSettingsTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    {
      label: "General",
      icon: <SettingsIcon />,
      component: <GeneralSettingsTab />,
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
    {
      label: "Automation",
      icon: <AutomationIcon />,
      component: <AutomationSettingsTab />,
    },
  ]

  return (
    <Box sx={{ width: "100%", pt: 2 }}>
      <Paper sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            aria-label="Bookings settings tabs"
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

export default BookingSettingsTabs

