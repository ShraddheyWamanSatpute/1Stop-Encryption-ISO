"use client"

import React, { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Chip,
  Paper,
  Alert,
  Avatar,
  Card,
  CardContent,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { differenceInDays, format } from 'date-fns'
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  AccessTime as PendingIcon,
} from '@mui/icons-material'
import FormSection from '../../reusable/FormSection'
import { useHR } from '../../../../backend/context/HRContext'

interface TimeOffRequest {
  id?: string
  employeeId: string
  type: 'holiday' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'bereavement' | 'other'
  startDate: Date
  endDate: Date
  totalDays: number
  reason?: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  approvedBy?: string
  approvedDate?: Date
  rejectionReason?: string
  emergencyContact?: string
  medicalCertificate?: boolean
  coveringEmployee?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface TimeOffCRUDFormProps {
  timeOffRequest?: TimeOffRequest | null
  mode: 'create' | 'edit' | 'view'
  onSave: (data: any) => void
  employees?: any[]
}

const TimeOffCRUDForm: React.FC<TimeOffCRUDFormProps> = ({
  timeOffRequest,
  mode,
  employees: employeesProp
}) => {
  const { state: hrState } = useHR()
  
  // Use employees from props if provided, otherwise from hrState
  const employees = employeesProp || hrState.employees || []

  // Debug logging
  useEffect(() => {
    console.log('TimeOffCRUDForm - employees from prop:', employeesProp?.length || 0)
    console.log('TimeOffCRUDForm - hrState.employees:', hrState.employees?.length || 0)
    console.log('TimeOffCRUDForm - final employees used:', employees?.length || 0, employees)
  }, [employeesProp, hrState.employees, employees])

  const [formData, setFormData] = useState<TimeOffRequest>({
    employeeId: '',
    type: 'holiday',
    startDate: new Date(),
    endDate: new Date(),
    totalDays: 1,
    status: 'pending',
    medicalCertificate: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // Update form data when timeOffRequest prop changes
  useEffect(() => {
    if (timeOffRequest) {
      setFormData({
        ...timeOffRequest,
        startDate: new Date(timeOffRequest.startDate),
        endDate: new Date(timeOffRequest.endDate),
        approvedDate: timeOffRequest.approvedDate ? new Date(timeOffRequest.approvedDate) : undefined,
        createdAt: new Date(timeOffRequest.createdAt),
        updatedAt: new Date(timeOffRequest.updatedAt),
      })
    }
  }, [timeOffRequest])

  // Auto-calculate total days when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const days = differenceInDays(formData.endDate, formData.startDate) + 1
      setFormData(prev => ({
        ...prev,
        totalDays: Math.max(1, days)
      }))
    }
  }, [formData.startDate, formData.endDate])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date()
    }))
  }


  const isReadOnly = mode === 'view'
  const canApprove = mode === 'edit' && formData.status === 'pending'

  // Get selected employee details
  const selectedEmployee = employees?.find(emp => emp.id === formData.employeeId)
  const approverEmployee = employees?.find(emp => emp.id === formData.approvedBy)
  const coveringEmployee = employees?.find(emp => emp.id === formData.coveringEmployee)

  // Calculate remaining holiday entitlement
  const getHolidayEntitlement = () => {
    if (!selectedEmployee) return { total: 0, used: 0, remaining: 0 }
    
    const totalEntitlement = selectedEmployee.holidaysPerYear || 25
    
    // Calculate used holidays from approved time off requests
    const usedHolidays = (hrState?.timeOffs || [])
      .filter((to: any) => 
        to.employeeId === selectedEmployee.id &&
        (to.type === 'holiday' || to.type === 'vacation') &&
        to.status === 'approved'
      )
      .reduce((sum: number, to: any) => sum + (to.totalDays || 0), 0)
    
    const remaining = Math.max(0, totalEntitlement - usedHolidays)
    
    return { total: totalEntitlement, used: usedHolidays, remaining }
  }

  const holidayStats = getHolidayEntitlement()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success'
      case 'rejected': return 'error'
      case 'cancelled': return 'default'
      default: return 'warning'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckIcon fontSize="small" />
      case 'rejected': return <CancelIcon fontSize="small" />
      default: return <PendingIcon fontSize="small" />
    }
  }

  const formatType = (text: string) => {
    return text
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // View Mode Layout (matching the original view modal)
  if (isReadOnly) {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ width: '100%' }}>
          {/* Header with Employee Name and Status */}
          <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h5">
              {selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : `Employee ${formData.employeeId}`} - {formatType(formData.type)}
            </Typography>
            <Chip
              icon={getStatusIcon(formData.status)}
              label={formatType(formData.status)}
              color={getStatusColor(formData.status) as "success" | "warning" | "error" | "default"}
            />
          </Box>

          <Grid container spacing={3}>
            {/* Request Information Card */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Request Information
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Employee:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : `Employee ${formData.employeeId}`}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Type:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">{formatType(formData.type)}</Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Start Date:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {format(new Date(formData.startDate), "MMM d, yyyy")}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          End Date:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {format(new Date(formData.endDate), "MMM d, yyyy")}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Total Days:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">{formData.totalDays} days</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Status Information Card */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Status Information
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Status:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Chip
                          icon={getStatusIcon(formData.status)}
                          label={formatType(formData.status)}
                          color={getStatusColor(formData.status) as "success" | "warning" | "error" | "default"}
                          size="small"
                        />
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Requested:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {format(new Date(formData.createdAt), "MMM d, yyyy")}
                        </Typography>
                      </Grid>

                      {formData.approvedBy && approverEmployee && (
                        <>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">
                              Approved By:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              {approverEmployee.firstName} {approverEmployee.lastName}
                            </Typography>
                          </Grid>
                        </>
                      )}

                      {formData.approvedDate && (
                        <>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">
                              Approved Date:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              {format(new Date(formData.approvedDate), "MMM d, yyyy")}
                            </Typography>
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Reason Card */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Reason
                  </Typography>
                  <Typography variant="body2">{formData.reason || 'No reason provided'}</Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Notes Card */}
            {formData.notes && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Notes
                    </Typography>
                    <Typography variant="body2">{formData.notes}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Rejection Reason Card */}
            {formData.rejectionReason && (
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ borderColor: 'error.main' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom color="error">
                      Rejection Reason
                    </Typography>
                    <Typography variant="body2">{formData.rejectionReason}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Covering Employee Card */}
            {coveringEmployee && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Cover Arrangements
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                      <Avatar
                        src={coveringEmployee.photo}
                        sx={{ width: 48, height: 48 }}
                      >
                        {coveringEmployee.firstName?.charAt(0)}{coveringEmployee.lastName?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1">
                          <strong>{coveringEmployee.firstName} {coveringEmployee.lastName}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {coveringEmployee.position} - {coveringEmployee.department}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {coveringEmployee.email} | {coveringEmployee.phone}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Employee Information Card */}
            {selectedEmployee && (
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Employee Information
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                      <Avatar
                        src={selectedEmployee.photo}
                        sx={{ width: 56, height: 56 }}
                      >
                        {selectedEmployee.firstName?.charAt(0)}{selectedEmployee.lastName?.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">
                          {selectedEmployee.firstName} {selectedEmployee.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedEmployee.position || 'No position'} - {selectedEmployee.department || 'No department'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedEmployee.email}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2">
                          <strong>Holiday Entitlement:</strong> {holidayStats.total} days/year
                        </Typography>
                        <Typography variant="body2">
                          <strong>Used:</strong> {holidayStats.used} days
                        </Typography>
                        <Typography variant="body2" color={holidayStats.remaining < 5 ? 'error.main' : 'success.main'}>
                          <strong>Remaining:</strong> {holidayStats.remaining} days
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      </LocalizationProvider>
    )
  }

  // Edit/Create Mode Layout
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: '100%' }}>
        <FormSection 
          title="Request Information" 
          icon={<PersonIcon />}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={isReadOnly}>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={formData.employeeId}
                  onChange={(e) => handleChange('employeeId', e.target.value)}
                  label="Employee"
                >
                  <MenuItem value="">
                    <em>Select an employee</em>
                  </MenuItem>
                  {(() => {
                    console.log('Rendering employee dropdown - employees:', employees?.length, employees)
                    return employees?.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} - {employee.department || 'No department'}
                      </MenuItem>
                    ))
                  })()}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={isReadOnly}>
                <InputLabel>Request Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  label="Request Type"
                >
                  <MenuItem value="holiday">Annual Leave</MenuItem>
                  <MenuItem value="sick">Sick Leave</MenuItem>
                  <MenuItem value="personal">Personal Leave</MenuItem>
                  <MenuItem value="maternity">Maternity Leave</MenuItem>
                  <MenuItem value="paternity">Paternity Leave</MenuItem>
                  <MenuItem value="bereavement">Bereavement Leave</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Start Date"
                value={formData.startDate}
                onChange={(date) => handleChange('startDate', date || new Date())}
                disabled={isReadOnly}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="End Date"
                value={formData.endDate}
                onChange={(date) => handleChange('endDate', date || new Date())}
                disabled={isReadOnly}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Total Days"
                value={formData.totalDays}
                disabled
                helperText="Automatically calculated"
              />
            </Grid>
          </Grid>

          {selectedEmployee && (
            <Paper sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>
                Employee Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={selectedEmployee.photo}
                      sx={{ width: 48, height: 48 }}
                    >
                      {selectedEmployee.firstName?.charAt(0)}{selectedEmployee.lastName?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">
                        <strong>{selectedEmployee.firstName} {selectedEmployee.lastName}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedEmployee.position || 'No position'} - {selectedEmployee.department || 'No department'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedEmployee.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Employment Type:</strong> {selectedEmployee.employmentType}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Holiday Entitlement:</strong> {holidayStats.total} days/year
                  </Typography>
                  <Typography variant="body2">
                    <strong>Used:</strong> {holidayStats.used} days
                  </Typography>
                  <Typography variant="body2" color={holidayStats.remaining < 5 ? 'error.main' : 'success.main'}>
                    <strong>Remaining:</strong> {holidayStats.remaining} days
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}
        </FormSection>

        <FormSection 
          title="Request Details" 
          icon={<CalendarIcon />}
        >
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason for Time Off"
                multiline
                rows={3}
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                disabled={isReadOnly}
                placeholder="Please provide a reason for your time off request..."
              />
            </Grid>
            
            {formData.type === 'sick' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={isReadOnly}>
                  <InputLabel>Medical Certificate Required?</InputLabel>
                  <Select
                    value={formData.medicalCertificate ? 'yes' : 'no'}
                    onChange={(e) => handleChange('medicalCertificate', e.target.value === 'yes')}
                    label="Medical Certificate Required?"
                  >
                    <MenuItem value="no">No</MenuItem>
                    <MenuItem value="yes">Yes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} sm={formData.type === 'sick' ? 6 : 12}>
              <FormControl fullWidth disabled={isReadOnly}>
                <InputLabel>Covering Employee</InputLabel>
                <Select
                  value={formData.coveringEmployee || ''}
                  onChange={(e) => handleChange('coveringEmployee', e.target.value)}
                  label="Covering Employee"
                >
                  <MenuItem value="">
                    <em>No cover needed</em>
                  </MenuItem>
                  {employees?.filter(emp => emp.id !== formData.employeeId).map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName} - {employee.department}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {formData.type === 'other' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Emergency Contact (if applicable)"
                  value={formData.emergencyContact}
                  onChange={(e) => handleChange('emergencyContact', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Emergency contact information during leave"
                />
              </Grid>
            )}
          </Grid>
        </FormSection>

        {coveringEmployee && (
          <FormSection 
            title="Cover Arrangements" 
            icon={<PersonIcon />}
          >
            <Paper sx={{ p: 2, bgcolor: 'info.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={coveringEmployee.photo}
                  sx={{ width: 48, height: 48 }}
                >
                  {coveringEmployee.firstName?.charAt(0)}{coveringEmployee.lastName?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {coveringEmployee.firstName} {coveringEmployee.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {coveringEmployee.position} - {coveringEmployee.department}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {coveringEmployee.email} | {coveringEmployee.phone}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </FormSection>
        )}

        <FormSection 
          title="Approval Status" 
          icon={<AssignmentIcon />}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!canApprove}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => {
                    handleChange('status', e.target.value)
                    if (e.target.value === 'approved' || e.target.value === 'rejected') {
                      handleChange('approvedDate', new Date())
                    }
                  }}
                  label="Status"
                >
                  <MenuItem value="pending">Pending Approval</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {canApprove && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Approving Manager</InputLabel>
                  <Select
                    value={formData.approvedBy || ''}
                    onChange={(e) => handleChange('approvedBy', e.target.value)}
                    label="Approving Manager"
                  >
                    <MenuItem value="">
                      <em>Select approver</em>
                    </MenuItem>
                    {employees?.filter(emp => 
                      emp.position?.toLowerCase().includes('manager') || 
                      emp.position?.toLowerCase().includes('supervisor')
                    ).map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {formData.status === 'rejected' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Rejection Reason"
                  multiline
                  rows={3}
                  value={formData.rejectionReason}
                  onChange={(e) => handleChange('rejectionReason', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Please provide a reason for rejection..."
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                disabled={isReadOnly}
                placeholder="Any additional notes or comments..."
              />
            </Grid>
          </Grid>

          {approverEmployee && formData.approvedDate && (
            <Paper sx={{ mt: 3, p: 2, bgcolor: 'success.50' }}>
              <Typography variant="h6" gutterBottom>
                Approval Information
              </Typography>
              <Typography variant="body2">
                <strong>Approved by:</strong> {approverEmployee.firstName} {approverEmployee.lastName}
              </Typography>
              <Typography variant="body2">
                <strong>Approval Date:</strong> {format(formData.approvedDate, 'PPP')}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> 
                <Chip 
                  label={formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                  color={getStatusColor(formData.status) as any}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Paper>
          )}

          {formData.type === 'holiday' && selectedEmployee && (
            <Alert 
              severity={holidayStats.remaining < formData.totalDays ? 'warning' : 'info'} 
              sx={{ mt: 2 }}
            >
              {holidayStats.remaining < formData.totalDays ? 
                `Warning: This request exceeds remaining holiday entitlement by ${formData.totalDays - holidayStats.remaining} days.` :
                `After this request, ${holidayStats.remaining - formData.totalDays} holiday days will remain.`
              }
            </Alert>
          )}
        </FormSection>
      </Box>
    </LocalizationProvider>
  )
}

export default TimeOffCRUDForm
