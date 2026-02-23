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
  FormControlLabel,
  Typography,
  Avatar,
  Button,
  IconButton,
  Tabs,
  Tab,
  Paper,
  RadioGroup,
  Radio,
  Checkbox,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { enGB } from 'date-fns/locale'
import {
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  AttachMoney as AttachMoneyIcon,
  Add as AddIcon,
  AccountBalance as AccountBalanceIcon,
  School as SchoolIcon,
} from '@mui/icons-material'
import FormSection from '../../reusable/FormSection'
import { useHR } from '../../../../backend/context/HRContext'
import { useCompany } from '../../../../backend/context/CompanyContext'
import { useSettings } from '../../../../backend/context/SettingsContext'
import { ConsentService } from '../../../../backend/services/gdpr/ConsentService'
import { PrivacyPolicyService } from '../../../../backend/services/gdpr/PrivacyPolicy'
import { Link } from 'react-router-dom'
import { forwardRef, useImperativeHandle } from 'react'
import type { Employee } from '../../../../backend/interfaces/HRs'

export interface EmployeeCRUDFormRef {
  submit: () => void
}

interface EmployeeCRUDFormProps {
  employee?: Employee | null
  mode: 'create' | 'edit' | 'view'
  onSave: (data: any) => void
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
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

const EmployeeCRUDForm = forwardRef<EmployeeCRUDFormRef, EmployeeCRUDFormProps>(({
  employee,
  mode,
  onSave}, ref) => {
  const { state: hrState } = useHR()
  const { state: companyState } = useCompany()
  const { state: settingsState } = useSettings()
  const [tabValue, setTabValue] = useState(0)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(mode !== 'create')
  const consentService = new ConsentService()
  const privacyPolicyService = new PrivacyPolicyService()

  // Store privacy policy acceptance state in ref for validation
  const privacyPolicyAcceptedRef = React.useRef(privacyPolicyAccepted)
  
  React.useEffect(() => {
    privacyPolicyAcceptedRef.current = privacyPolicyAccepted
  }, [privacyPolicyAccepted])

  // Expose form submit function for CRUDModal
  useImperativeHandle(ref, () => ({
    submit: () => {
      // Validate privacy policy consent for new employees
      if (mode === 'create' && !privacyPolicyAcceptedRef.current) {
        alert('You must confirm that the employee has been informed about and accepts the Privacy Policy before creating their record.')
        return
      }

      // Record consent for new employees before saving
      if (mode === 'create' && privacyPolicyAcceptedRef.current && settingsState.auth?.uid && companyState.companyID) {
        // Record consent asynchronously (don't block save)
        const policyVersion = privacyPolicyService.getPrivacyPolicy({
          companyName: companyState.companyName || 'Company',
          companyAddress: '',
          dpoName: 'Data Protection Officer',
          dpoEmail: 'dpo@company.com',
        }).version

        consentService.documentLawfulBasis(
          companyState.companyID,
          settingsState.auth.uid,
          'employee_records',
          'contract',
          `Employee record created by HR. Employee data processing is necessary for employment contract and legal obligations (HMRC, payroll). Employee has been informed about privacy policy.`,
          policyVersion
        ).catch((error) => {
          console.warn('Failed to record privacy policy consent during employee creation:', error)
        })
      }

      // Prepare and pass form data to onSave
      const employeeData = {
        ...formData,
        hireDate: formData.hireDate instanceof Date ? formData.hireDate.getTime() : formData.hireDate,
        dateOfBirth: formData.dateOfBirth instanceof Date ? formData.dateOfBirth.getTime() : formData.dateOfBirth,
      }
      onSave(employeeData)
    }
  }), [formData, mode, privacyPolicyAccepted, settingsState.auth?.uid, companyState.companyID, companyState.companyName, onSave, consentService, privacyPolicyService])

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: null as Date | null,
    nationalInsuranceNumber: '',
    hireDate: new Date(),
    status: 'active' as 'active' | 'inactive' | 'on_leave' | 'terminated',
    roleId: '',
    departmentId: '',
    employmentType: 'full_time' as 'full_time' | 'part_time' | 'contract' | 'temporary',
    payType: 'salary' as 'salary' | 'hourly',
    salary: 0,
    hourlyRate: 0,
    hoursPerWeek: 40,
    holidaysPerYear: 25,
    photo: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'UK'
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    bankDetails: {
      accountName: '',
      accountNumber: '',
      routingNumber: '',
      bankName: ''
    },
    // HMRC Tax & NI Fields
    taxCode: '1257L',
    taxCodeBasis: 'cumulative' as 'cumulative' | 'week1month1',
    niCategory: 'A' as 'A' | 'B' | 'C' | 'F' | 'H' | 'I' | 'J' | 'L' | 'M' | 'S' | 'V' | 'Z',
    isDirector: false,
    directorNICalculationMethod: 'annual' as 'annual' | 'alternative',
    // Starter Information
    starterDeclaration: undefined as 'A' | 'B' | 'C' | undefined,
    // Student Loans
    studentLoanPlan: 'none' as 'none' | 'plan1' | 'plan2' | 'plan4',
    hasPostgraduateLoan: false,
    // Pension
    autoEnrolmentStatus: 'not_eligible' as 'eligible' | 'enrolled' | 'opted_out' | 'not_eligible' | 'postponed',
    pensionSchemeReference: '',
    pensionContributionPercentage: 5,
    // Payment Frequency
    paymentFrequency: 'monthly' as 'weekly' | 'fortnightly' | 'four_weekly' | 'monthly',
    // Tronc (Hospitality)
    troncParticipant: false,
    troncType: 'points' as 'points' | 'flat_rate' | 'percentage',
    troncPoints: 0,
    troncFlatRate: 0,
    troncPercentage: 0,
  })

  // Emergency contacts array for multiple contacts
  const [emergencyContacts, setEmergencyContacts] = useState<Array<{
    id: string
    name: string
    relationship: string
    phone: string
    email: string
  }>>([])

  // Sync department when role is set (for existing employees or when role changes)
  useEffect(() => {
    if (formData.roleId && hrState.roles && hrState.roles.length > 0) {
      const selectedRole = hrState.roles.find(r => r.id === formData.roleId)
      if (selectedRole) {
        // Check both departmentId (primary) and department (fallback) fields
        const roleDeptId = selectedRole.departmentId || (selectedRole as any).departmentID || (selectedRole as any).department
        if (roleDeptId) {
          // Only update if department is not set or doesn't match the role's department
          if (!formData.departmentId || formData.departmentId !== roleDeptId) {
            console.log("🔍 EmployeeCRUDForm - useEffect syncing department from role:", {
              roleId: formData.roleId,
              roleName: selectedRole.label || selectedRole.name,
              departmentId: roleDeptId,
              currentDepartmentId: formData.departmentId
            })
            setFormData(prev => ({
              ...prev,
              departmentId: roleDeptId
            }))
          }
        }
      }
    }
  }, [formData.roleId, hrState.roles])

  // Update form data when employee prop changes
  useEffect(() => {
    if (employee) {
      const roleId = employee.roleId || ''
      const departmentId = employee.departmentId || ''
      
      // If role is set but department is not, try to get department from role
      let finalDepartmentId = departmentId
      if (roleId && !departmentId) {
        const role = hrState.roles?.find(r => r.id === roleId)
        if (role && role.departmentId) {
          finalDepartmentId = role.departmentId
        }
      }
      
      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        middleName: employee.middleName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        gender: employee.gender || '',
        dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth) : null,
        nationalInsuranceNumber: employee.nationalInsuranceNumber || '',
        hireDate: employee.hireDate ? new Date(employee.hireDate) : new Date(),
        status: employee.status || 'active',
        roleId: roleId,
        departmentId: finalDepartmentId,
        employmentType: (employee.employmentType as 'full_time' | 'part_time' | 'contract' | 'temporary') || 'full_time',
        payType: employee.payType || 'salary',
        salary: employee.salary || 0,
        hourlyRate: employee.hourlyRate || 0,
        hoursPerWeek: employee.hoursPerWeek || 40,
        holidaysPerYear: employee.holidaysPerYear || 25,
        photo: employee.photo || '',
        address: employee.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'UK'
        },
        emergencyContact: employee.emergencyContact ? {
          name: employee.emergencyContact.name || '',
          relationship: employee.emergencyContact.relationship || '',
          phone: employee.emergencyContact.phone || '',
          email: (employee.emergencyContact as any).email || ''
        } : {
          name: '',
          relationship: '',
          phone: '',
          email: ''
        },
        bankDetails: employee.bankDetails || {
          accountName: '',
          accountNumber: '',
          routingNumber: '',
          bankName: ''
        },
        // HMRC Fields
        taxCode: employee.taxCode || '1257L',
        taxCodeBasis: employee.taxCodeBasis || 'cumulative',
        niCategory: employee.niCategory || 'A',
        isDirector: employee.isDirector || false,
        directorNICalculationMethod: employee.directorNICalculationMethod || 'annual',
        starterDeclaration: employee.starterDeclaration,
        studentLoanPlan: employee.studentLoanPlan || 'none',
        hasPostgraduateLoan: employee.hasPostgraduateLoan || false,
        autoEnrolmentStatus: employee.autoEnrolmentStatus || 'not_eligible',
        pensionSchemeReference: employee.pensionSchemeReference || '',
        pensionContributionPercentage: employee.pensionContributionPercentage || 5,
        paymentFrequency: employee.paymentFrequency || 'monthly',
        troncParticipant: employee.troncParticipant || false,
        troncType: (employee as any).troncType || 'points',
        troncPoints: employee.troncPoints || 0,
        troncFlatRate: (employee as any).troncFlatRate || 0,
        troncPercentage: (employee as any).troncPercentage || 0,
      })
      setPhotoPreview(employee.photo || null)
    }
  }, [employee])

  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any || {}),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        setPhotoPreview(result)
        handleChange('photo', result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setPhotoPreview(null)
    handleChange('photo', '')
  }

  const addEmergencyContact = () => {
    const newContact = {
      id: Date.now().toString(),
      name: '',
      relationship: '',
      phone: '',
      email: ''
    }
    setEmergencyContacts(prev => [...prev, newContact])
  }

  const updateEmergencyContact = (id: string, updates: Partial<typeof emergencyContacts[0]>) => {
    setEmergencyContacts(prev => prev.map(contact => 
      contact.id === id ? { ...contact, ...updates } : contact
    ))
  }

  const removeEmergencyContact = (id: string) => {
    setEmergencyContacts(prev => prev.filter(contact => contact.id !== id))
  }


  const isReadOnly = mode === 'view'

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
      <Box sx={{ width: '100%' }}>
        <Paper sx={{ mb: 2, overflow: 'hidden' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                minWidth: 120,
              }
            }}
          >
            <Tab icon={<PersonIcon />} label="Personal Info" />
            <Tab icon={<WorkIcon />} label="Employment" />
            <Tab icon={<AttachMoneyIcon />} label="Compensation" />
            <Tab icon={<AccountBalanceIcon />} label="Tax & NI" />
            <Tab icon={<SchoolIcon />} label="Pensions & Loans" />
          </Tabs>

          {/* Personal Information Tab */}
          <TabPanel value={tabValue} index={0}>
            <FormSection title="Basic Information">
              <Grid container spacing={3}>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Avatar
                      src={photoPreview || undefined}
                      sx={{ width: 120, height: 120, mb: 2 }}
                    >
                      {formData.firstName.charAt(0)}
                      {formData.lastName.charAt(0)}
                    </Avatar>
                    {!isReadOnly && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="photo-upload"
                          type="file"
                          onChange={handlePhotoChange}
                        />
                        <label htmlFor="photo-upload">
                          <Button 
                            variant="outlined" 
                            component="span" 
                            startIcon={<PhotoCameraIcon />} 
                            size="small"
                          >
                            Upload
                          </Button>
                        </label>
                        {photoPreview && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={handleRemovePhoto}
                          >
                            Remove
                          </Button>
                        )}
                      </Box>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={9}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        required
                        disabled={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Middle Name"
                        value={formData.middleName}
                        onChange={(e) => handleChange('middleName', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        required
                        disabled={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required disabled={isReadOnly}>
                        <InputLabel>Gender</InputLabel>
                        <Select
                          value={formData.gender}
                          onChange={(e) => handleChange('gender', e.target.value)}
                          label="Gender"
                        >
                          <MenuItem value="male">Male</MenuItem>
                          <MenuItem value="female">Female</MenuItem>
                          <MenuItem value="other">Other</MenuItem>
                          <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Date of Birth"
                        value={formData.dateOfBirth}
                        onChange={(date) => handleChange('dateOfBirth', date)}
                        disabled={isReadOnly}
                        maxDate={new Date(new Date().setDate(new Date().getDate() - 1))}
                        locale={enGB}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: formData.dateOfBirth && formData.dateOfBirth >= new Date(new Date().setHours(0, 0, 0, 0)),
                            helperText: formData.dateOfBirth && formData.dateOfBirth >= new Date(new Date().setHours(0, 0, 0, 0)) 
                              ? "Date of birth cannot be today or in the future" 
                              : "DD/MM/YYYY format"
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        required
                        disabled={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        required
                        disabled={isReadOnly}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </FormSection>

            <FormSection title="Address Information">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={formData.address.street}
                    onChange={(e) => handleChange('address.street', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.address.city}
                    onChange={(e) => handleChange('address.city', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Postcode"
                    value={formData.address.zipCode}
                    onChange={(e) => handleChange('address.zipCode', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={formData.address.country}
                    onChange={(e) => handleChange('address.country', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Grid>
              </Grid>
            </FormSection>

            <FormSection title="Emergency Contacts">
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Emergency Contacts</Typography>
                {!isReadOnly && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={addEmergencyContact}
                  >
                    Add Contact
                  </Button>
                )}
              </Box>
              
              {emergencyContacts.map((contact) => (
                <Paper key={contact.id} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Name"
                        value={contact.name}
                        onChange={(e) => updateEmergencyContact(contact.id, { name: e.target.value })}
                        disabled={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2.5}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Relationship"
                        value={contact.relationship}
                        onChange={(e) => updateEmergencyContact(contact.id, { relationship: e.target.value })}
                        disabled={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2.5}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Phone"
                        value={contact.phone}
                        onChange={(e) => updateEmergencyContact(contact.id, { phone: e.target.value })}
                        disabled={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Email"
                        type="email"
                        value={contact.email}
                        onChange={(e) => updateEmergencyContact(contact.id, { email: e.target.value })}
                        disabled={isReadOnly}
                      />
                    </Grid>
                    {!isReadOnly && (
                      <Grid item xs={12} sm={1}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeEmergencyContact(contact.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              ))}
              
              {emergencyContacts.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No emergency contacts added. {!isReadOnly && 'Click "Add Contact" to add contact information.'}
                </Typography>
              )}
            </FormSection>
          </TabPanel>

          {/* Employment Tab */}
          <TabPanel value={tabValue} index={1}>
            <FormSection title="Role & Department">
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={isReadOnly}>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={formData.departmentId}
                      onChange={(e) => {
                        const newDepartmentId = e.target.value
                        // Update department
                        setFormData(prev => {
                          const updated = {
                            ...prev,
                            departmentId: newDepartmentId
                          }
                          // Clear role when department changes (unless the current role belongs to the new department)
                          if (prev.roleId && newDepartmentId) {
                            const currentRole = hrState.roles?.find(r => r.id === prev.roleId)
                            if (currentRole) {
                              // Check both departmentId (primary) and department (fallback) fields
                              const roleDeptId = currentRole.departmentId || (currentRole as any).departmentID || (currentRole as any).department
                              if (!roleDeptId || roleDeptId !== newDepartmentId) {
                                updated.roleId = ''
                              }
                            } else {
                              // Role not found, clear it
                              updated.roleId = ''
                            }
                          } else if (!newDepartmentId) {
                            // If department is cleared, keep the role (user might want to keep it)
                          }
                          return updated
                        })
                      }}
                      label="Department"
                    >
                      <MenuItem value="">
                        <em>Select a department</em>
                      </MenuItem>
                      {hrState.departments?.map((department) => (
                        <MenuItem key={department.id} value={department.id}>
                          {department.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={isReadOnly}>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={formData.roleId}
                      onChange={(e) => {
                        const roleId = e.target.value
                        // Auto-select department when role is selected
                        if (roleId) {
                          const selectedRole = hrState.roles?.find(r => r.id === roleId)
                          if (selectedRole) {
                            // Check both departmentId (primary) and department (fallback) fields
                            const roleDeptId = selectedRole.departmentId || (selectedRole as any).departmentID || (selectedRole as any).department
                            if (roleDeptId) {
                              console.log("🔍 EmployeeCRUDForm - Role selected, setting department:", {
                                roleId,
                                roleName: selectedRole.label || selectedRole.name,
                                departmentId: roleDeptId
                              })
                              // Use setFormData to ensure state updates correctly
                              setFormData(prev => ({
                                ...prev,
                                roleId: roleId,
                                departmentId: roleDeptId
                              }))
                            } else {
                              // Role has no department, just update role
                              setFormData(prev => ({
                                ...prev,
                                roleId: roleId
                              }))
                            }
                          }
                        } else {
                          // Role cleared, just update role
                          setFormData(prev => ({
                            ...prev,
                            roleId: ''
                          }))
                        }
                      }}
                      label="Role"
                    >
                      <MenuItem value="">
                        <em>Select a role</em>
                      </MenuItem>
                      {hrState.roles?.filter(role => {
                        // If department is selected, only show roles in that department
                        if (formData.departmentId) {
                          // Check both departmentId (primary) and department (fallback) fields
                          const roleDeptId = role.departmentId || (role as any).departmentID || (role as any).department
                          return roleDeptId === formData.departmentId
                        }
                        // If no department selected, show all roles
                        return true
                      }).map((role) => (
                        <MenuItem key={role.id} value={role.id}>
                          {role.label || role.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required disabled={isReadOnly}>
                    <InputLabel>Employment Type</InputLabel>
                    <Select
                      value={formData.employmentType}
                      onChange={(e) => handleChange('employmentType', e.target.value)}
                      label="Employment Type"
                    >
                      <MenuItem value="full_time">Full-time</MenuItem>
                      <MenuItem value="part_time">Part-time</MenuItem>
                      <MenuItem value="contract">Contract</MenuItem>
                      <MenuItem value="temporary">Temporary</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required disabled={isReadOnly}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="on_leave">On Leave</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="terminated">Terminated</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Date Hired"
                    value={formData.hireDate}
                    onChange={(date) => handleChange('hireDate', date || new Date())}
                    disabled={isReadOnly}
                    locale={enGB}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        helperText: "DD/MM/YYYY format"
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Hours Per Week"
                    type="number"
                    value={formData.hoursPerWeek}
                    onChange={(e) => handleChange('hoursPerWeek', Number(e.target.value))}
                    disabled={isReadOnly}
                    InputProps={{
                      inputProps: { min: 0, max: 168, step: 0.5 },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Holidays Per Year"
                    type="number"
                    value={formData.holidaysPerYear}
                    onChange={(e) => handleChange('holidaysPerYear', Number(e.target.value))}
                    disabled={isReadOnly}
                    InputProps={{
                      inputProps: { min: 0 },
                    }}
                  />
                </Grid>
              </Grid>
            </FormSection>
          </TabPanel>

          {/* Compensation Tab */}
          <TabPanel value={tabValue} index={2}>
            <FormSection title="Pay Information">
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl component="fieldset" disabled={isReadOnly}>
                    <Typography variant="subtitle1" gutterBottom>
                      Pay Type
                    </Typography>
                    <RadioGroup
                      row
                      value={formData.payType}
                      onChange={(e) => handleChange('payType', e.target.value)}
                    >
                      <FormControlLabel value="salary" control={<Radio />} label="Salary" />
                      <FormControlLabel value="hourly" control={<Radio />} label="Hourly Rate" />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Hourly Rate"
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => handleChange('hourlyRate', Number(e.target.value))}
                    disabled={isReadOnly || formData.payType !== 'hourly'}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>£</Typography>,
                      inputProps: { min: 0, step: 0.01 }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Annual Salary"
                    type="number"
                    value={formData.salary}
                    onChange={(e) => handleChange('salary', Number(e.target.value))}
                    disabled={isReadOnly || formData.payType !== 'salary'}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>£</Typography>,
                      inputProps: { min: 0 }
                    }}
                  />
                </Grid>
              </Grid>
            </FormSection>

            <FormSection title="Bank Details">
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Account Name"
                    value={formData.bankDetails.accountName}
                    onChange={(e) => handleChange('bankDetails.accountName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Account Number"
                    value={formData.bankDetails.accountNumber}
                    onChange={(e) => handleChange('bankDetails.accountNumber', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Sort Code"
                    value={formData.bankDetails.routingNumber}
                    onChange={(e) => handleChange('bankDetails.routingNumber', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Bank Name"
                    value={formData.bankDetails.bankName}
                    onChange={(e) => handleChange('bankDetails.bankName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Grid>
              </Grid>
            </FormSection>

            <FormSection title="Tronc Scheme (Hospitality)">
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Radio
                        checked={formData.troncParticipant}
                        onChange={(e) => handleChange('troncParticipant', e.target.checked)}
                        disabled={isReadOnly}
                      />
                    }
                    label="Participates in Tronc Scheme"
                  />
                </Grid>
                {formData.troncParticipant && (
                  <>
                    <Grid item xs={12}>
                      <FormControl component="fieldset" disabled={isReadOnly}>
                        <Typography variant="subtitle2" gutterBottom>
                          Tronc Type
                        </Typography>
                        <RadioGroup
                          row
                          value={formData.troncType}
                          onChange={(e) => handleChange('troncType', e.target.value)}
                        >
                          <FormControlLabel value="points" control={<Radio />} label="Points" />
                          <FormControlLabel value="flat_rate" control={<Radio />} label="Flat Rate Per Hour" />
                          <FormControlLabel value="percentage" control={<Radio />} label="Percentage of Sales Service Charge" />
                        </RadioGroup>
                      </FormControl>
                    </Grid>
                    {formData.troncType === 'points' && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Tronc Points"
                          type="number"
                          value={formData.troncPoints}
                          onChange={(e) => handleChange('troncPoints', Number(e.target.value))}
                          disabled={isReadOnly}
                          InputProps={{
                            inputProps: { min: 0, step: 0.5 }
                          }}
                          helperText="Points for service charge allocation"
                        />
                      </Grid>
                    )}
                    {formData.troncType === 'flat_rate' && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Flat Rate Per Hour"
                          type="number"
                          value={formData.troncFlatRate}
                          onChange={(e) => handleChange('troncFlatRate', Number(e.target.value))}
                          disabled={isReadOnly}
                          InputProps={{
                            startAdornment: <Typography sx={{ mr: 1 }}>£</Typography>,
                            inputProps: { min: 0, step: 0.01 }
                          }}
                          helperText="Fixed amount per hour worked"
                        />
                      </Grid>
                    )}
                    {formData.troncType === 'percentage' && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Percentage of Sales Service Charge"
                          type="number"
                          value={formData.troncPercentage}
                          onChange={(e) => handleChange('troncPercentage', Number(e.target.value))}
                          disabled={isReadOnly}
                          InputProps={{
                            inputProps: { min: 0, max: 100, step: 0.1 },
                            endAdornment: <Typography>%</Typography>
                          }}
                          helperText="Percentage of total service charge sales"
                        />
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Tronc schemes distribute tips/service charges. Must be operated independently from employer for NI savings.
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </FormSection>
          </TabPanel>

          {/* Tax & NI Tab */}
          <TabPanel value={tabValue} index={3}>
            <FormSection title="Tax Information">
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="National Insurance Number"
                    value={formData.nationalInsuranceNumber}
                    onChange={(e) => handleChange('nationalInsuranceNumber', e.target.value)}
                    disabled={isReadOnly}
                    helperText="UK National Insurance number"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tax Code"
                    value={formData.taxCode}
                    onChange={(e) => handleChange('taxCode', e.target.value.toUpperCase())}
                    disabled={isReadOnly}
                    required
                    helperText="e.g., 1257L, S1257L, BR, D0, D1, 0T"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={isReadOnly}>
                    <InputLabel>Tax Code Basis</InputLabel>
                    <Select
                      value={formData.taxCodeBasis}
                      onChange={(e) => handleChange('taxCodeBasis', e.target.value)}
                      label="Tax Code Basis"
                    >
                      <MenuItem value="cumulative">Cumulative (Standard)</MenuItem>
                      <MenuItem value="week1month1">Week 1/Month 1 (Emergency Tax)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Tax code determines how much income tax is deducted. Get tax code from P45 or HMRC. Standard code for 2024/25 is 1257L.
                  </Typography>
                </Grid>
              </Grid>
            </FormSection>

            <FormSection title="National Insurance">
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={isReadOnly} required>
                    <InputLabel>NI Category</InputLabel>
                    <Select
                      value={formData.niCategory}
                      onChange={(e) => handleChange('niCategory', e.target.value)}
                      label="NI Category"
                    >
                      <MenuItem value="A">Category A (Standard)</MenuItem>
                      <MenuItem value="B">Category B (Married women - reduced rate)</MenuItem>
                      <MenuItem value="C">Category C (Over state pension age)</MenuItem>
                      <MenuItem value="H">Category H (Apprentice under 25)</MenuItem>
                      <MenuItem value="M">Category M (Under 21)</MenuItem>
                      <MenuItem value="Z">Category Z (Under 21 - deferred)</MenuItem>
                      <MenuItem value="F">Category F (Female over 60)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={isReadOnly}>
                    <InputLabel>Payment Frequency</InputLabel>
                    <Select
                      value={formData.paymentFrequency}
                      onChange={(e) => handleChange('paymentFrequency', e.target.value)}
                      label="Payment Frequency"
                    >
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="fortnightly">Fortnightly</MenuItem>
                      <MenuItem value="four_weekly">Four Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Radio
                        checked={formData.isDirector}
                        onChange={(e) => handleChange('isDirector', e.target.checked)}
                        disabled={isReadOnly}
                      />
                    }
                    label="Company Director (NI calculated annually)"
                  />
                </Grid>
                {formData.isDirector && (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={isReadOnly}>
                      <InputLabel>Director NI Method</InputLabel>
                      <Select
                        value={formData.directorNICalculationMethod}
                        onChange={(e) => handleChange('directorNICalculationMethod', e.target.value)}
                        label="Director NI Method"
                      >
                        <MenuItem value="annual">Annual (Standard)</MenuItem>
                        <MenuItem value="alternative">Alternative</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </Grid>
            </FormSection>

            <FormSection title="New Starter Information">
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Starter Declaration (for new employees without P45)
                  </Typography>
                  <FormControl fullWidth disabled={isReadOnly}>
                    <InputLabel>Starter Declaration</InputLabel>
                    <Select
                      value={formData.starterDeclaration || ''}
                      onChange={(e) => handleChange('starterDeclaration', e.target.value || undefined)}
                      label="Starter Declaration"
                    >
                      <MenuItem value="">
                        <em>None (Has P45)</em>
                      </MenuItem>
                      <MenuItem value="A">A - This is my first job since last 6 April</MenuItem>
                      <MenuItem value="B">B - This is now my only job</MenuItem>
                      <MenuItem value="C">C - I have another job or pension</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Privacy Policy Consent (only for new employees) */}
                {mode === 'create' && (
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={privacyPolicyAccepted}
                          onChange={(e) => {
                            setPrivacyPolicyAccepted(e.target.checked)
                            privacyPolicyAcceptedRef.current = e.target.checked
                          }}
                          required
                          disabled={isReadOnly}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          I confirm that the employee has been informed about and accepts the{" "}
                          <Link to="/PrivacyPolicy" target="_blank" rel="noopener noreferrer">
                            Privacy Policy
                          </Link>
                          {" "}for processing their personal data in accordance with UK GDPR
                        </Typography>
                      }
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, ml: 4 }}>
                      This consent is required for processing employee data including payroll, tax, and HMRC submissions
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </FormSection>
          </TabPanel>

          {/* Pensions & Student Loans Tab */}
          <TabPanel value={tabValue} index={4}>
            <FormSection title="Pension Auto-Enrolment">
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={isReadOnly}>
                    <InputLabel>Auto-Enrolment Status</InputLabel>
                    <Select
                      value={formData.autoEnrolmentStatus}
                      onChange={(e) => handleChange('autoEnrolmentStatus', e.target.value)}
                      label="Auto-Enrolment Status"
                    >
                      <MenuItem value="not_eligible">Not Eligible</MenuItem>
                      <MenuItem value="eligible">Eligible (Not Yet Enrolled)</MenuItem>
                      <MenuItem value="enrolled">Enrolled</MenuItem>
                      <MenuItem value="opted_out">Opted Out</MenuItem>
                      <MenuItem value="postponed">Postponed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {formData.autoEnrolmentStatus === 'enrolled' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Pension Scheme Reference"
                        value={formData.pensionSchemeReference}
                        onChange={(e) => handleChange('pensionSchemeReference', e.target.value)}
                        disabled={isReadOnly}
                        helperText="PSTR - Pension Scheme Tax Reference"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Employee Contribution %"
                        type="number"
                        value={formData.pensionContributionPercentage}
                        onChange={(e) => handleChange('pensionContributionPercentage', Number(e.target.value))}
                        disabled={isReadOnly}
                        InputProps={{
                          inputProps: { min: 5, max: 100, step: 0.5 },
                          endAdornment: <Typography>%</Typography>
                        }}
                        helperText="Minimum 5% (total 8% with employer)"
                      />
                    </Grid>
                  </>
                )}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Employees aged 22-66 earning £10,000+ annually must be auto-enrolled. Contributions on qualifying earnings (£6,240-£50,270).
                  </Typography>
                </Grid>
              </Grid>
            </FormSection>

            <FormSection title="Student Loans">
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={isReadOnly}>
                    <InputLabel>Student Loan Plan</InputLabel>
                    <Select
                      value={formData.studentLoanPlan}
                      onChange={(e) => handleChange('studentLoanPlan', e.target.value)}
                      label="Student Loan Plan"
                    >
                      <MenuItem value="none">No Student Loan</MenuItem>
                      <MenuItem value="plan1">Plan 1 (Started before Sep 2012)</MenuItem>
                      <MenuItem value="plan2">Plan 2 (Started Sep 2012+)</MenuItem>
                      <MenuItem value="plan4">Plan 4 (Scotland)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.hasPostgraduateLoan}
                        onChange={(e) => handleChange('hasPostgraduateLoan', e.target.checked)}
                        disabled={isReadOnly}
                      />
                    }
                    label="Has Postgraduate Loan"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'info.lighter' }}>
                    <Typography variant="caption" display="block">
                      <strong>Student Loan Thresholds 2024/25:</strong>
                    </Typography>
                    <Typography variant="caption" display="block">
                      • Plan 1: £22,015 (9% above threshold)
                    </Typography>
                    <Typography variant="caption" display="block">
                      • Plan 2: £27,295 (9% above threshold)
                    </Typography>
                    <Typography variant="caption" display="block">
                      • Plan 4: £27,660 (9% above threshold)
                    </Typography>
                    <Typography variant="caption" display="block">
                      • Postgraduate: £21,000 (6% above threshold)
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </FormSection>

          </TabPanel>
        </Paper>
      </Box>
    </LocalizationProvider>
  )
})

EmployeeCRUDForm.displayName = 'EmployeeCRUDForm'

export default EmployeeCRUDForm
