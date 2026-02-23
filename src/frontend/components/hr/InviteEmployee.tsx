"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { useHR } from "../../../backend/context/HRContext"
import { Box, Button, Card, CardContent, CardHeader, Chip, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, Snackbar, TextField, Tooltip, Alert } from "@mui/material"
import { ContentCopy as CopyIcon, Email as EmailIcon, WhatsApp as WhatsAppIcon, Send as SendIcon } from "@mui/icons-material"
// Company state is now handled through HRContext

const InviteEmployee: React.FC = () => {
  const { generateJoinCode, state: hrState } = useHR()
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState("staff")
  const [link, setLink] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canInvite = useMemo(() => Boolean(hrState.companyID && (hrState.selectedSiteID || (hrState.sites && hrState.sites.length > 0))), [hrState.companyID, hrState.selectedSiteID, hrState.sites])

  const makeLink = (code: string) => `${window.location.origin}/join?code=${code}`

  const handleGenerate = async () => {
    try {
      const code = await generateJoinCode(role)
      setLink(makeLink(code))
    } catch (e: any) {
      setError(e?.message || "Failed to generate invite")
    }
  }

  const copy = async () => {
    if (!link) return
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
  }

  const sendEmail = () => {
    if (!link || !email) return
    const subject = encodeURIComponent(`You're invited to join ${hrState.companyName || "our company"}`)
    const body = encodeURIComponent(`Please click the link to join: ${link}`)
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank")
  }

  const sendWhatsApp = () => {
    if (!link || !phone) return
    const text = encodeURIComponent(`Please click the link to join: ${link}`)
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${text}`, "_blank")
  }

  return (
    <Card>
      <CardHeader title="Invite Employee" />
      <CardContent>
        {!canInvite && <Alert severity="warning" sx={{ mb: 2 }}>Select a company and site before inviting employees.</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="supervisor">Supervisor</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" startIcon={<SendIcon />} onClick={handleGenerate} disabled={!canInvite}>Generate Invite Link</Button>
              {link && <Chip label="Link ready" color="success" size="small" />}
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Invite Link" value={link} InputProps={{ readOnly: true }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="WhatsApp / Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Copy link">
                <span>
                  <IconButton onClick={copy} disabled={!link}><CopyIcon /></IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Send email">
                <span>
                  <IconButton onClick={sendEmail} disabled={!link || !email}><EmailIcon /></IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Send WhatsApp">
                <span>
                  <IconButton onClick={sendWhatsApp} disabled={!link || !phone}><WhatsAppIcon /></IconButton>
                </span>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
        <Snackbar open={copied} autoHideDuration={1500} onClose={() => setCopied(false)} message="Copied!" />
        <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)} message={error || ''} />
      </CardContent>
    </Card>
  )
}

export default InviteEmployee


