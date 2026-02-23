"use client"

import React, { useState } from "react"
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Tabs,
  Tab,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider
} from "@mui/material"
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Close as CloseIcon,
  Send as SendIcon,
  ContentCopy as CopyIcon,
  WhatsApp as WhatsAppIcon,
  Description as ContractIcon,
  BeachAccess as VacationIcon
} from "@mui/icons-material"
// Company state is now handled through HRContext
import { themeConfig } from "../../../theme/AppTheme"
import type { ContractTemplate } from "../../../backend/interfaces/HRs"
import { useHR } from "../../../backend/context/HRContext"
// Functions now accessed through HRContext

interface ViewEmployeeProps {
  employee: any
  open: boolean
  onClose: () => void
  onEdit: (employee: any) => void
}

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
      id={`employee-tabpanel-${index}`}
      aria-labelledby={`employee-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const ViewEmployee: React.FC<ViewEmployeeProps> = ({ employee, open, onClose, onEdit }) => {
  // Company state is now handled through HRContext
  const { fetchContractTemplates, createContract, initializeDefaultContractTemplates, generateJoinCode } = useHR()
  
  const [tabValue, setTabValue] = useState(0)
  const [inviteLink, setInviteLink] = useState("")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [contractDialogOpen, setContractDialogOpen] = useState(false)
  const [contractTitle, setContractTitle] = useState("")
  const [contractBody, setContractBody] = useState("")
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [notification, setNotification] = useState<{
    open: boolean
    message: string
    severity: "success" | "error" | "warning" | "info"
  }>({ open: false, message: "", severity: "info" })

  // Mock time off data for now - will be replaced with real data later
  const mockTimeOffRequests: any[] = []

  // Calculate time off statistics
  const currentYear = new Date().getFullYear()
  const thisYearRequests = mockTimeOffRequests.filter((request: any) => 
    new Date(request.startDate).getFullYear() === currentYear
  )
  const approvedRequests = thisYearRequests.filter((request: any) => request.status === "approved")
  const totalDaysUsed = approvedRequests.reduce((sum: number, request: any) => {
    const start = new Date(request.startDate)
    const end = new Date(request.endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return sum + days
  }, 0)
  
  // Calculate accrued days based on hours worked
  // Formula: (yearly entitlement / 52 weeks) / hours per week * hours worked
  const yearlyEntitlement = employee.holidaysPerYear || 0
  const hoursPerWeek = employee.hoursPerWeek || 40
  const weeksWorked = Math.floor((Date.now() - (employee.hireDate || Date.now())) / (1000 * 60 * 60 * 24 * 7))
  const hoursWorked = Math.min(weeksWorked * hoursPerWeek, 52 * hoursPerWeek) // Cap at full year
  const weeklyAccrual = yearlyEntitlement / 52
  const hourlyAccrual = weeklyAccrual / hoursPerWeek
  const accruedDays = Math.floor(hourlyAccrual * hoursWorked)
  
  // Calculate available days (accrued minus taken)
  const availableDays = accruedDays - totalDaysUsed
  const remainingDays = (employee.holidaysPerYear || 0) - totalDaysUsed

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const generateInviteLink = async () => {
    try {
      const code = await generateJoinCode("site")
      const link = `${window.location.origin}/join-company?code=${code}&employeeId=${employee.id}`
      setInviteLink(link)
      setInviteDialogOpen(true)
    } catch (error) {
      setNotification({
        open: true,
        message: "Failed to generate invite link",
        severity: "error"
      })
    }
  }

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setNotification({
        open: true,
        message: "Invite link copied to clipboard!",
        severity: "success"
      })
    } catch (error) {
      setNotification({
        open: true,
        message: "Failed to copy link",
        severity: "error"
      })
    }
  }

  const sendEmailInvite = () => {
    const subject = encodeURIComponent("You're invited to join our company")
    const body = encodeURIComponent(`Hi ${employee.firstName},\n\nPlease click the link below to access your employee account:\n\n${inviteLink}`)
    window.open(`mailto:${employee.email}?subject=${subject}&body=${body}`, "_blank")
  }

  const sendWhatsAppInvite = () => {
    const text = encodeURIComponent(`Hi ${employee.firstName}, please click this link to access your employee account: ${inviteLink}`)
    const phone = employee.phone?.replace(/\D/g, '') || ""
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${text}`, "_blank")
    }
  }

  const generateContract = async () => {
    setLoadingTemplates(true)
    try {
      // Company state handled internally
      setNotification({ open: true, message: "Loading templates...", severity: "info" })

      // Initialize default templates if needed
      await initializeDefaultContractTemplates()
      
      // Fetch available templates
      const templates = await fetchContractTemplates()
      setContractTemplates(templates)
      
      if (templates.length > 0) {
        // Select first template by default
        const defaultTemplate = templates[0]
        setSelectedTemplate(defaultTemplate)
        setContractTitle(`${defaultTemplate.name} - ${employee.firstName} ${employee.lastName}`)
        setContractBody(defaultTemplate.bodyHtml)
      } else {
        // Fallback to basic template if no templates exist
        setContractTitle(`Employment Contract - ${employee.firstName} ${employee.lastName}`)
        setContractBody(`<h2>Employment Contract</h2><p>Dear {{employeeName}},</p><p>Welcome to {{companyName}}!</p>`)
      }
      
      setContractDialogOpen(true)
    } catch (error) {
      console.error('Error loading contract templates:', error)
      setNotification({ open: true, message: "Failed to load contract templates", severity: "error" })
    } finally {
      setLoadingTemplates(false)
    }
  }

  const processContractAutoFill = (text: string): string => {
    return text
      .replace(/{{companyName}}/g, 'Company Name') // Handled internally by HR context
      .replace(/{{employeeName}}/g, `${employee.firstName} ${employee.lastName}`)
      .replace(/{{firstName}}/g, employee.firstName || "")
      .replace(/{{lastName}}/g, employee.lastName || "")
      .replace(/{{role}}/g, employee.position || 'Employee')
      .replace(/{{position}}/g, employee.position || "")
      .replace(/{{department}}/g, employee.department || "")
      .replace(/{{startDate}}/g, new Date().toLocaleDateString())
      .replace(/{{hireDate}}/g, employee.hireDate ? formatDate(employee.hireDate) : "")
      .replace(/{{salary}}/g, employee.salary ? `£${employee.salary.toLocaleString()}` : 'TBD')
      .replace(/{{contractDuration}}/g, '12 months')
      .replace(/{{endDate}}/g, new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString())
      .replace(/{{hourlyRate}}/g, employee.hourlyRate ? `£${employee.hourlyRate.toFixed(2)}` : (employee.salary ? `£${(employee.salary / 1800).toFixed(2)}` : 'TBD'))
      .replace(/{{hoursPerWeek}}/g, employee.hoursPerWeek?.toString() || '40')
      .replace(/{{employmentType}}/g, employee.employmentType || "")
      .replace(/{{holidaysPerYear}}/g, employee.holidaysPerYear?.toString() || "")
      .replace(/{{email}}/g, employee.email || "")
      .replace(/{{phone}}/g, employee.phone || "")
      .replace(/{{address}}/g, employee.address && typeof employee.address === 'object' 
        ? `${employee.address.street || ''}, ${employee.address.city || ''}, ${employee.address.state || ''} ${employee.address.zipCode || ''}`.trim()
        : employee.address || "")
      .replace(/{{nationalInsuranceNumber}}/g, employee.nationalInsuranceNumber || "")
  }

  const sendContract = async () => {
    try {
      // Company state handled internally
      const processedContract = processContractAutoFill(contractBody)
      
      // Create contract in database
      await createContract({
        employeeId: employee.id,
        type: 'permanent',
        startDate: Date.now(),
        salary: employee.salary || 0,
        benefits: [],
        terms: [],
        status: 'sent',
        contractTitle: contractTitle,
        bodyHtml: processedContract,
        createdBy: 'user',
        createdAt: Date.now(),
        updatedAt: Date.now()
      })
      
      setNotification({
        open: true,
        message: `Contract sent to ${employee.firstName} ${employee.lastName} successfully!`,
        severity: "success"
      })
      
      setContractDialogOpen(false)
    } catch (error) {
      console.error('Error creating contract:', error)
      setNotification({ open: true, message: "Failed to create contract", severity: "error" })
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: "90vh" } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar src={employee.photo} sx={{ width: 60, height: 60 }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h5">
                  {employee.firstName} {employee.lastName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {employee.position} • {employee.department}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<SendIcon />}
                onClick={generateInviteLink}
                size="small"
              >
                Invite Link
              </Button>
              <Button
                variant="outlined"
                startIcon={<ContractIcon />}
                onClick={generateContract}
                disabled={loadingTemplates}
                size="small"
              >
                Generate Contract
              </Button>
              <Button
                variant="contained"
                onClick={() => onEdit(employee)}
                size="small"
              >
                Edit Employee
              </Button>
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Personal Info" />
              <Tab label="Employment Details" />
              <Tab label="Time Off" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Contact Information</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <EmailIcon fontSize="small" />
                      <Typography>{employee.email}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <PhoneIcon fontSize="small" />
                      <Typography>{employee.phone}</Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Address:</strong> {employee.address && typeof employee.address === 'object' 
                        ? `${employee.address.street || ''}, ${employee.address.city || ''}, ${employee.address.state || ''} ${employee.address.zipCode || ''}`.trim().replace(/,\s*,/g, ',').replace(/,\s*$/, '')
                        : employee.address || "N/A"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Personal Details</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Date of Birth:</strong> {employee.dateOfBirth ? formatDate(employee.dateOfBirth) : "N/A"}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>NI Number:</strong> {employee.nationalInsuranceNumber || "N/A"}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>City:</strong> {employee.city || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Country:</strong> {employee.country || "N/A"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              {employee.emergencyContact && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Emergency Contact</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2">
                            <strong>Name:</strong> {employee.emergencyContact.name}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2">
                            <strong>Relationship:</strong> {employee.emergencyContact.relationship}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2">
                            <strong>Phone:</strong> {employee.emergencyContact.phone}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Employment Information</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <WorkIcon fontSize="small" />
                      <Typography>{employee.employmentType}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <CalendarIcon fontSize="small" />
                      <Typography>Hired: {employee.hireDate ? formatDate(employee.hireDate) : "N/A"}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Status:</strong> 
                      <Chip 
                        label={employee.status} 
                        color={employee.status === "active" ? "success" : "default"}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    <Typography variant="body2">
                      <strong>Manager:</strong> {employee.manager || "N/A"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Compensation</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <MoneyIcon fontSize="small" />
                      <Typography>
                        {employee.payType === "salary" 
                          ? `Salary: ${employee.salary ? formatCurrency(employee.salary) : "N/A"}`
                          : `Hourly: ${employee.hourlyRate ? formatCurrency(employee.hourlyRate) : "N/A"}`
                        }
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Pay Type:</strong> {employee.payType || "N/A"}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Hours per Week:</strong> {employee.hoursPerWeek || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Holiday Entitlement:</strong> {employee.holidaysPerYear || 0} days/year
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent sx={{ textAlign: "center" }}>
                    <VacationIcon sx={{ fontSize: 40, color: themeConfig.colors.primary.main, mb: 1 }} />
                    <Typography variant="h4" color="primary">
                      {employee.holidaysPerYear || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Annual Entitlement
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent sx={{ textAlign: "center" }}>
                    <VacationIcon sx={{ fontSize: 40, color: themeConfig.colors.info.main, mb: 1 }} />
                    <Typography variant="h4" color="info.main">
                      {accruedDays}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Accrued Days
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent sx={{ textAlign: "center" }}>
                    <VacationIcon sx={{ fontSize: 40, color: themeConfig.colors.secondary.main, mb: 1 }} />
                    <Typography variant="h4" color="secondary.main">
                      {availableDays}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Available Days
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent sx={{ textAlign: "center" }}>
                    <VacationIcon sx={{ fontSize: 40, color: themeConfig.colors.warning.main, mb: 1 }} />
                    <Typography variant="h4" color="warning.main">
                      {totalDaysUsed}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Days Used ({currentYear})
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent sx={{ textAlign: "center" }}>
                    <VacationIcon sx={{ fontSize: 40, color: themeConfig.colors.success.main, mb: 1 }} />
                    <Typography variant="h4" color="success.main">
                      {remainingDays}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Days Remaining
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Time Off History</Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Start Date</TableCell>
                            <TableCell>End Date</TableCell>
                            <TableCell>Days</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Reason</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {mockTimeOffRequests.map((request: any) => {
                            const days = Math.ceil((new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
                            return (
                              <TableRow key={request.id}>
                                <TableCell>{formatDate(request.startDate)}</TableCell>
                                <TableCell>{formatDate(request.endDate)}</TableCell>
                                <TableCell>{days}</TableCell>
                                <TableCell>{request.type}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={request.status} 
                                    color={
                                      request.status === "approved" ? "success" :
                                      request.status === "rejected" ? "error" : "default"
                                    }
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>{request.reason}</TableCell>
                              </TableRow>
                            )
                          })}
                          {mockTimeOffRequests.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} align="center">
                                <Typography variant="body2" color="textSecondary">
                                  No time off requests found
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </DialogContent>
      </Dialog>

      {/* Invite Link Dialog */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Employee Invite Link</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Invite Link"
            value={inviteLink}
            InputProps={{ readOnly: true }}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
            <Tooltip title="Copy Link">
              <IconButton onClick={copyInviteLink}>
                <CopyIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Send Email">
              <IconButton onClick={sendEmailInvite}>
                <EmailIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Send WhatsApp">
              <IconButton onClick={sendWhatsAppInvite}>
                <WhatsAppIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Contract Generation Dialog */}
      <Dialog open={contractDialogOpen} onClose={() => setContractDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ContractIcon />
            Generate Contract
            {loadingTemplates && <CircularProgress size={20} />}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Contract Details</Typography>
              
              {contractTemplates.length > 0 && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Select Template</InputLabel>
                  <Select
                    value={selectedTemplate?.id || ''}
                    onChange={(e) => {
                      const template = contractTemplates.find(t => t.id === e.target.value)
                      if (template) {
                        setSelectedTemplate(template)
                        setContractTitle(`${template.name} - ${employee.firstName} ${employee.lastName}`)
                        setContractBody(template.bodyHtml)
                      }
                    }}
                    label="Select Template"
                  >
                    {contractTemplates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              
              <TextField
                fullWidth
                label="Contract Title"
                value={contractTitle}
                onChange={(e) => setContractTitle(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={12}
                label="Contract Body (HTML)"
                value={contractBody}
                onChange={(e) => setContractBody(e.target.value)}
                helperText="Use placeholders: {{employeeName}}, {{role}}, {{salary}}, {{companyName}}, {{startDate}}"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Live Preview</Typography>
              <Box sx={{ 
                p: 2, 
                bgcolor: "grey.50", 
                borderRadius: 1, 
                border: '1px solid',
                borderColor: 'grey.300',
                maxHeight: 400, 
                overflow: "auto" 
              }}>
                <div dangerouslySetInnerHTML={{ __html: processContractAutoFill(contractBody) }} />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>Employee Information:</Typography>
              <Box sx={{ p: 1, bgcolor: "info.50", borderRadius: 1 }}>
                <Typography variant="body2">• Name: {employee.firstName} {employee.lastName}</Typography>
                <Typography variant="body2">• Role: {(employee.role && typeof employee.role === 'object' ? employee.role.name : employee.role) || 'Not specified'}</Typography>
                <Typography variant="body2">• Email: {employee.email}</Typography>
                <Typography variant="body2">• Salary: {employee.salary ? `£${employee.salary.toLocaleString()}` : 'Not specified'}</Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContractDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={sendContract} startIcon={<SendIcon />}>
            Generate & Send Contract
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ open: false, message: "", severity: "info" })}
      >
        <Alert
          onClose={() => setNotification({ open: false, message: "", severity: "info" })}
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default ViewEmployee
