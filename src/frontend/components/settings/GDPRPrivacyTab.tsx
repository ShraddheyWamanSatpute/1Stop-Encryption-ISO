"use client"

import React, { useState, useEffect } from "react"
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
} from "@mui/material"
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  PrivacyTip as PrivacyIcon,
  Restore as RestoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material"
import { useSettings } from "../../../backend/context/SettingsContext"
import { useCompany } from "../../../backend/context/CompanyContext"
import { dsarService } from "../../../backend/services/gdpr/DSARService"
import { userAccountDeletionService } from "../../../backend/services/gdpr/UserAccountDeletionService"
import { getAuth } from "firebase/auth"

const GDPRPrivacyTab: React.FC = () => {
  const { state } = useSettings()
  const { companyState } = useCompany()
  const auth = getAuth()
  const userId = state.auth.uid
  const companyId = companyState.selectedCompany?.id || companyState.companyID

  const [exportLoading, setExportLoading] = useState(false)
  const [deletionStatus, setDeletionStatus] = useState<any>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load deletion status
  useEffect(() => {
    const loadDeletionStatus = async () => {
      if (!userId) {
        setLoadingStatus(false)
        return
      }

      try {
        const status = await userAccountDeletionService.getDeletionStatus(userId)
        setDeletionStatus(status)
      } catch (err) {
        console.error("Error loading deletion status:", err)
      } finally {
        setLoadingStatus(false)
      }
    }

    loadDeletionStatus()
  }, [userId])

  // Handle data export
  const handleExportData = async (format: 'json' | 'csv' = 'json') => {
    if (!userId || !companyId) {
      setError("User ID or Company ID missing")
      return
    }

    setExportLoading(true)
    setError(null)

    try {
      const exportData = await dsarService.generateDataExport(companyId, userId, format)

      // Create download
      const blob = new Blob([format === 'json' ? JSON.stringify(exportData.personalData, null, 2) : exportData.personalData.toString()], {
        type: format === 'json' ? 'application/json' : 'text/csv',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `my-data-export-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setSuccess(`Data exported successfully in ${format.toUpperCase()} format`)
    } catch (err) {
      console.error("Error exporting data:", err)
      setError(err instanceof Error ? err.message : "Failed to export data")
    } finally {
      setExportLoading(false)
    }
  }

  // Handle account deletion initiation
  const handleInitiateDeletion = async () => {
    if (confirmText !== "DELETE") {
      setError("Please type 'DELETE' to confirm")
      return
    }

    if (!userId || !companyId) {
      setError("User ID or Company ID missing")
      return
    }

    setError(null)

    try {
      await userAccountDeletionService.initiateDeletion(userId, companyId, userId)
      setSuccess("Account deletion initiated. You have 30 days to restore your account.")
      setDeleteDialogOpen(false)
      setConfirmText("")
      
      // Reload status
      const status = await userAccountDeletionService.getDeletionStatus(userId)
      setDeletionStatus(status)
    } catch (err) {
      console.error("Error initiating deletion:", err)
      setError(err instanceof Error ? err.message : "Failed to initiate account deletion")
    }
  }

  // Handle account restoration
  const handleRestoreAccount = async () => {
    if (!userId || !companyId) {
      setError("User ID or Company ID missing")
      return
    }

    setError(null)

    try {
      await userAccountDeletionService.restoreAccount(userId, companyId, userId)
      setSuccess("Account restored successfully")
      setRestoreDialogOpen(false)
      
      // Reload status
      const status = await userAccountDeletionService.getDeletionStatus(userId)
      setDeletionStatus(status)
    } catch (err) {
      console.error("Error restoring account:", err)
      setError(err instanceof Error ? err.message : "Failed to restore account")
    }
  }

  // Calculate days remaining in grace period
  const getDaysRemaining = () => {
    if (!deletionStatus?.gracePeriodEndsAt) return null
    const now = Date.now()
    const remaining = deletionStatus.gracePeriodEndsAt - now
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)))
  }

  const daysRemaining = getDaysRemaining()

  if (loadingStatus) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Account Deletion Status */}
      {deletionStatus?.isDeleted && (
        <Card sx={{ mb: 3, border: "2px solid", borderColor: deletionStatus.isAnonymized ? "error.main" : "warning.main" }}>
          <CardHeader
            avatar={<WarningIcon color={deletionStatus.isAnonymized ? "error" : "warning"} />}
            title={deletionStatus.isAnonymized ? "Account Anonymized" : "Account Deletion Pending"}
            subheader={
              deletionStatus.isAnonymized
                ? "Your account has been anonymized. This action cannot be undone."
                : `Your account is scheduled for deletion. ${daysRemaining !== null ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining.` : ''}`
            }
          />
          <CardContent>
            {!deletionStatus.isAnonymized && daysRemaining !== null && daysRemaining > 0 && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  You can restore your account during the grace period. After {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}, your account will be automatically anonymized.
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(30 - daysRemaining) / 30 * 100}
                  sx={{ mb: 2, height: 8, borderRadius: 1 }}
                />
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<RestoreIcon />}
                  onClick={() => setRestoreDialogOpen(true)}
                  fullWidth
                >
                  Restore My Account
                </Button>
              </>
            )}
            {deletionStatus.isAnonymized && (
              <Alert severity="info">
                Your personal information has been anonymized. Some data may be retained for legal compliance (e.g., HMRC requirements).
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Export Section */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          avatar={<DownloadIcon />}
          title="Export My Data"
          subheader="Download a copy of all your personal data (GDPR Art. 15 - Right of Access)"
        />
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            You have the right to receive a copy of all personal data we hold about you. The export includes:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="User profile and personal settings" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Employee records (if applicable)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Payroll records" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Consent records" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Audit logs (your activity)" />
            </ListItem>
          </List>
          <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              startIcon={exportLoading ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={() => handleExportData('json')}
              disabled={exportLoading || !userId || !companyId}
            >
              Export JSON
            </Button>
            <Button
              variant="outlined"
              startIcon={exportLoading ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={() => handleExportData('csv')}
              disabled={exportLoading || !userId || !companyId}
            >
              Export CSV
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Account Deletion Section */}
      {!deletionStatus?.isDeleted && (
        <Card sx={{ border: "2px solid", borderColor: "error.main" }}>
          <CardHeader
            avatar={<DeleteIcon color="error" />}
            title="Delete My Account"
            subheader="Request account deletion (GDPR Art. 17 - Right to Erasure)"
          />
          <CardContent>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                What happens when you delete your account:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="30-day grace period"
                    secondary="Your account will be soft-deleted. You can restore it within 30 days."
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="After grace period"
                    secondary="Your account will be anonymized. Personal information will be replaced with anonymized values."
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Legal retention"
                    secondary="Some data (e.g., payroll records) may be retained for legal compliance (HMRC 6-year requirement)."
                  />
                </ListItem>
              </List>
            </Alert>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
              fullWidth
            >
              Request Account Deletion
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Privacy Information */}
      <Card sx={{ mt: 3 }}>
        <CardHeader
          avatar={<PrivacyIcon />}
          title="Your Privacy Rights"
        />
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Under UK GDPR, you have the following rights:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="Right of Access (Art. 15)"
                secondary="Request a copy of your personal data"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Right to Rectification (Art. 16)"
                secondary="Correct inaccurate personal data"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Right to Erasure (Art. 17)"
                secondary="Request deletion of your personal data"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Right to Data Portability (Art. 20)"
                secondary="Receive your data in a machine-readable format"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Right to Object (Art. 21)"
                secondary="Object to processing of your personal data"
              />
            </ListItem>
          </List>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            For more information, please contact us or review our Privacy Policy.
          </Typography>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Account Deletion</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be easily undone. Your account will be deleted after a 30-day grace period.
          </Alert>
          <Typography variant="body2" sx={{ mb: 2 }}>
            To confirm, please type <strong>DELETE</strong> in the field below:
          </Typography>
          <TextField
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            error={confirmText !== "" && confirmText !== "DELETE"}
            helperText={confirmText !== "" && confirmText !== "DELETE" ? "Please type exactly 'DELETE'" : ""}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); setConfirmText("") }}>
            Cancel
          </Button>
          <Button
            onClick={handleInitiateDeletion}
            color="error"
            variant="contained"
            disabled={confirmText !== "DELETE"}
          >
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Restore Account</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Your account will be restored and you can continue using it normally.
          </Alert>
          <Typography variant="body2">
            Are you sure you want to restore your account? The deletion request will be cancelled.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRestoreAccount}
            color="success"
            variant="contained"
          >
            Restore Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default GDPRPrivacyTab
