"use client"

import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material"
import {
  Save as SaveIcon,
  People as PeopleIcon,
} from "@mui/icons-material"
import { useCompany } from "../../../../backend/context/CompanyContext"
import { ref, get, set } from 'firebase/database'
import { db } from '../../../../backend/services/Firebase'

interface EmployeeDefaults {
  defaultHolidaysPerYear: number
  defaultHoursPerWeek: number
  defaultEmploymentType: 'full_time' | 'part_time' | 'contract' | 'temporary'
  defaultPayType: 'salary' | 'hourly'
  requireNINumber: boolean
  requireTaxCode: boolean
  autoGenerateEmployeeID: boolean
  employeeIDFormat: string
  defaultDepartment?: string
  defaultRole?: string
}

const EmployeeDefaultsTab: React.FC = () => {
  const { state: companyState } = useCompany()
  const companyId = companyState.companyID
  const siteId = companyState.selectedSiteID

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [settings, setSettings] = useState<EmployeeDefaults>({
    defaultHolidaysPerYear: 25,
    defaultHoursPerWeek: 40,
    defaultEmploymentType: 'full_time',
    defaultPayType: 'salary',
    requireNINumber: true,
    requireTaxCode: false,
    autoGenerateEmployeeID: true,
    employeeIDFormat: 'EMP{YYYY}{####}',
  })

  useEffect(() => {
    if (companyId && siteId) {
      loadSettings()
    }
  }, [companyId, siteId])

  const loadSettings = async () => {
    if (!companyId || !siteId) return

    setLoading(true)
    try {
      const settingsRef = ref(db, `companies/${companyId}/sites/${siteId}/data/company/employeeDefaults`)
      const snapshot = await get(settingsRef)
      
      if (snapshot.exists()) {
        setSettings(snapshot.val())
      }
    } catch (err: any) {
      console.error('Error loading employee defaults:', err)
      setError(`Failed to load settings: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!companyId || !siteId) {
      setError('Company ID or Site ID missing')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const settingsRef = ref(db, `companies/${companyId}/sites/${siteId}/data/company/employeeDefaults`)
      await set(settingsRef, {
        ...settings,
        updatedAt: Date.now()
      })

      setSuccess('Employee defaults saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error saving employee defaults:', err)
      setError(`Failed to save settings: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof EmployeeDefaults, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Employee Default Settings
      </Typography>

      {/* Default Values */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Default Employee Values" avatar={<PeopleIcon />} />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Default Holidays Per Year"
                value={settings.defaultHolidaysPerYear}
                onChange={(e) => handleChange('defaultHolidaysPerYear', parseInt(e.target.value) || 0)}
                helperText="Default annual leave entitlement"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Default Hours Per Week"
                value={settings.defaultHoursPerWeek}
                onChange={(e) => handleChange('defaultHoursPerWeek', parseInt(e.target.value) || 0)}
                helperText="Default weekly working hours"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Default Employment Type</InputLabel>
                <Select
                  value={settings.defaultEmploymentType}
                  onChange={(e) => handleChange('defaultEmploymentType', e.target.value)}
                  label="Default Employment Type"
                >
                  <MenuItem value="full_time">Full Time</MenuItem>
                  <MenuItem value="part_time">Part Time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="temporary">Temporary</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Default Pay Type</InputLabel>
                <Select
                  value={settings.defaultPayType}
                  onChange={(e) => handleChange('defaultPayType', e.target.value)}
                  label="Default Pay Type"
                >
                  <MenuItem value="salary">Salary</MenuItem>
                  <MenuItem value="hourly">Hourly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Validation Requirements */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Validation Requirements" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.requireNINumber}
                    onChange={(e) => handleChange('requireNINumber', e.target.checked)}
                  />
                }
                label="Require National Insurance Number"
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4, mt: 0.5 }}>
                Required for HMRC payroll submissions
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.requireTaxCode}
                    onChange={(e) => handleChange('requireTaxCode', e.target.checked)}
                  />
                }
                label="Require Tax Code"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Employee ID Settings */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Employee ID Settings" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoGenerateEmployeeID}
                    onChange={(e) => handleChange('autoGenerateEmployeeID', e.target.checked)}
                  />
                }
                label="Auto-generate Employee ID"
              />
            </Grid>
            {settings.autoGenerateEmployeeID && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Employee ID Format"
                  value={settings.employeeIDFormat}
                  onChange={(e) => handleChange('employeeIDFormat', e.target.value)}
                  helperText="Use {YYYY} for year, {####} for sequential number (e.g., EMP{YYYY}{####})"
                />
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button variant="outlined" onClick={loadSettings} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          Save Settings
        </Button>
      </Box>

      {/* Messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
      </Snackbar>
    </Box>
  )
}

export default EmployeeDefaultsTab

