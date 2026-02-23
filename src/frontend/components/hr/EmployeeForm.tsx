"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  Typography,
  Divider,
  Avatar,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  type SelectChangeEvent,
  Paper,
  useTheme,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import {
  Add as AddIcon,
  AttachMoney as AttachMoneyIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Work as WorkIcon,
  Link as LinkIcon,
  ContentCopy as ContentCopyIcon,
} from "@mui/icons-material"
import type { Employee, Role } from "../../../backend/interfaces/HRs"
import { isValid } from "date-fns"
import { useHR } from "../../../backend/context/HRContext"
import type { TabPanelProps } from "../../../backend/interfaces/HRs"

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

export const EmployeeForm: React.FC<{
  mode: "add" | "edit"
  employee?: Employee
  roles: Role[]
  onSave: (employee: Omit<Employee, "id">) => void
  onCancel: () => void
}> = ({ mode, employee, roles, onSave, onCancel }) => {
  const theme = useTheme()
  const { state: hrState, addRole, addDepartment, refreshRoles, refreshDepartments } = useHR()
  const { generateJoinCode } = useHR()
  // Company state is now handled through HRContext

  const [tabValue, setTabValue] = useState(0)
  // Enhanced form data with new structures
  const [formData, setFormData] = useState<Omit<Employee, "id">>({
    firstName: "",
    lastName: "",
    middleName: "",
    gender: "",
    email: "",
    phone: "",
    hireDate: new Date().getTime(),
    status: "active",
    roleId: "",
    departmentId: "",
    photo: "",
    employmentType: "Full-time",
    createdAt: new Date().getTime(),
    payType: "salary",
    tronc: 0,
    bonus: 0,
    startDate: "",
    endDate: "",
    jobTitle: "",
    companyId: "",
    siteId: "",
    holidaysPerYear: 25,
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "UK"
    },
    nationalInsuranceNumber: "",
    notes: ""
  })
  
  // New state for enhanced features
  const [holidayType, setHolidayType] = useState<'year' | 'week' | 'hour'>('year')
  const [compensationItems, setCompensationItems] = useState<Array<{
    id: string
    type: 'bonus' | 'tronc'
    troncType?: 'percent_self' | 'percent_venue' | 'flat_rate' | 'pool_points'
    bonusType?: 'flat' | 'percentage'
    percentageType?: 'pay' | 'sales' | 'revenue'
    frequency?: number // months
    amount?: number
    percentage?: number
    points?: number
  }>>([])
  const [emergencyContacts, setEmergencyContacts] = useState<Array<{
    id: string
    name: string
    relationship: string
    phone: string
    email: string
  }>>([])
  
  // Pay frequency state
  const [payDayOfWeek, setPayDayOfWeek] = useState<string>('')
  const [nextPayDate, setNextPayDate] = useState<Date | null>(null)
  const [monthlyPayType, setMonthlyPayType] = useState<'specific_date' | 'last_day_of_week'>('specific_date')
  const [monthlySpecificDate, setMonthlySpecificDate] = useState<number>(1)
  const [monthlyDayOfWeek, setMonthlyDayOfWeek] = useState<string>('')
  
  // Google Places state
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const [, setPhotoFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [, setIsFullTime] = useState(true)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)
  
  // Quick creation dialogs
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false)
  const [newRoleForm, setNewRoleForm] = useState({ label: '', description: '', department: '' })
  const [newDepartmentForm, setNewDepartmentForm] = useState({ name: '', description: '' })

  // Get the selected role details
  const selectedRole = roles.find((role) => role.id === formData.roleId)

  // Get department and manager based on role
  useEffect(() => {
    if (selectedRole) {
      // Auto-fill department based on role
      setFormData((prev) => ({
        ...prev,
        department: selectedRole.department || prev.department,
      }))

      // Find manager for this department
      if (selectedRole.department) {
        const departmentManagers = hrState.employees.filter(
          (emp) => emp.department === selectedRole.department && emp.position?.toLowerCase().includes("manager"),
        )

        if (departmentManagers.length > 0) {
          setFormData((prev) => ({
            ...prev,
            manager: departmentManagers[0].id,
          }))
        }
      }
    }
  }, [formData.roleId, selectedRole, hrState.employees])

  useEffect(() => {
    if (employee) {
      setFormData({
        ...employee,
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        middleName: employee.middleName || "",
        gender: employee.gender || "",
        email: employee.email || "",
        phone: employee.phone || "",
        hireDate: employee.hireDate || new Date().getTime(),
        status: employee.status || "active",
        roleId: employee.roleId || "",
        photo: employee.photo || "",
        employmentType: employee.employmentType || "Full-time",
        payType: employee.payType || "salary",
        tronc: employee.tronc || 0, // Ensure tronc is initialized
        bonus: employee.bonus || 0, // Ensure bonus is initialized
        createdAt: employee.createdAt || new Date().getTime(),
      })
      setPhotoPreview(employee.photo || null)
      setIsFullTime(employee.employmentType === "Full-time")
    }
  }, [employee])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Handle money fields with 2 decimal place validation
    if (['hourlyRate', 'salary', 'annualSalary'].includes(name)) {
      // Allow empty string or valid decimal with max 2 decimal places
      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }))
      }
      return
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleDateChange = (date: Date | null, fieldName: string) => {
    if (date && isValid(date)) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: date.getTime(),
      }))
      // Clear error when field is edited
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: "" }))
      }
    }
  }

  const handleRoleChange = (e: SelectChangeEvent<string>) => {
    const roleId = e.target.value
    setFormData((prev) => ({
      ...prev,
      roleId: roleId,
    }))
  }

  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    setFormData((prev) => ({
      ...prev,
      status: e.target.value as "active" | "inactive" | "on_leave" | "terminated",
    }))
  }

  const handleEmploymentTypeChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value
    setFormData((prev) => ({
      ...prev,
      employmentType: value,
    }))
    setIsFullTime(value === "Full-time")
  }

  const handlePayTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as "salary" | "hourly"
    setFormData((prev) => ({
      ...prev,
      payType: value,
    }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, photo: 'Please select a valid image file' }))
        return
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, photo: 'Image size must be less than 5MB' }))
        return
      }
      
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        setPhotoPreview(result)
        setFormData((prev) => ({ ...prev, photo: result }))
        setErrors(prev => ({ ...prev, photo: '' }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setPhotoPreview(null)
    setPhotoFile(null)
    setFormData((prev) => ({ ...prev, photo: "" }))
  }

  // Helper functions for enhanced features
  const addCompensationItem = () => {
    const newItem = {
      id: Date.now().toString(),
      type: 'bonus' as const,
      amount: 0
    }
    setCompensationItems(prev => [...prev, newItem])
  }

  const updateCompensationItem = (id: string, updates: Partial<typeof compensationItems[0]>) => {
    setCompensationItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ))
  }

  const removeCompensationItem = (id: string) => {
    setCompensationItems(prev => prev.filter(item => item.id !== id))
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
  
  // Enhanced address search with better suggestions
  const handleAddressSearch = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([])
      setShowAddressSuggestions(false)
      return
    }
    
    // Enhanced mock suggestions with more realistic addresses
    const mockSuggestions = [
      { 
        description: `${query}, London, UK`, 
        place_id: '1',
        components: { street: query, city: 'London', country: 'UK' }
      },
      { 
        description: `${query}, Manchester, UK`, 
        place_id: '2',
        components: { street: query, city: 'Manchester', country: 'UK' }
      },
      { 
        description: `${query}, Birmingham, UK`, 
        place_id: '3',
        components: { street: query, city: 'Birmingham', country: 'UK' }
      },
      { 
        description: `${query}, Liverpool, UK`, 
        place_id: '4',
        components: { street: query, city: 'Liverpool', country: 'UK' }
      },
      { 
        description: `${query}, Leeds, UK`, 
        place_id: '5',
        components: { street: query, city: 'Leeds', country: 'UK' }
      }
    ]
    
    setAddressSuggestions(mockSuggestions)
    setShowAddressSuggestions(true)
  }
  
  const handleAddressSelect = (suggestion: any) => {
    setFormData(prev => ({ 
      ...prev, 
      address: {
        street: suggestion.components?.street || suggestion.description,
        city: suggestion.components?.city || '',
        state: suggestion.components?.state || '',
        zipCode: suggestion.components?.postcode || '',
        country: suggestion.components?.country || 'UK'
      }
    }))
    setShowAddressSuggestions(false)
    setAddressSuggestions([])
  }

  const updateEmergencyContact = (id: string, updates: Partial<typeof emergencyContacts[0]>) => {
    setEmergencyContacts(prev => prev.map(contact => 
      contact.id === id ? { ...contact, ...updates } : contact
    ))
  }

  const removeEmergencyContact = (id: string) => {
    setEmergencyContacts(prev => prev.filter(contact => contact.id !== id))
  }

  // Quick creation handlers
  const handleCreateRole = async () => {
    if (!newRoleForm.label.trim()) {
      setSaveError('Role name is required')
      return
    }

    try {
      setLoading(true)
      const roleData = {
        name: newRoleForm.label,
        label: newRoleForm.label,
        description: newRoleForm.description,
        departmentId: newRoleForm.department,
        permissions: [], // Add required permissions array
        isActive: true,
        createdAt: Date.now(),
      }
      
      await addRole(roleData)
      await refreshRoles()
      setShowRoleDialog(false)
      setNewRoleForm({ label: '', description: '', department: '' })
      setSaveError(null)
    } catch (error: any) {
      setSaveError(error?.message || 'Failed to create role')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDepartment = async () => {
    if (!newDepartmentForm.name.trim()) {
      setSaveError('Department name is required')
      return
    }

    try {
      setLoading(true)
      const departmentData = {
        name: newDepartmentForm.name,
        description: newDepartmentForm.description,
        managerId: '',
        employees: [],
        roles: [],
        isActive: true,
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime()
      }
      
      await addDepartment(departmentData)
      await refreshDepartments()
      setShowDepartmentDialog(false)
      setNewDepartmentForm({ name: '', description: '' })
      setSaveError(null)
    } catch (error: any) {
      setSaveError(error?.message || 'Failed to create department')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName) newErrors.firstName = "First name is required"
    if (!formData.lastName) newErrors.lastName = "Last name is required"
    if (!formData.email) newErrors.email = "Email is required"
    if (!formData.phone) newErrors.phone = "Phone number is required"
    if (!formData.hireDate) newErrors.hireDate = "Hire date is required"
    if (!formData.employmentType) newErrors.employmentType = "Employment type is required"
    if (!formData.gender) newErrors.gender = "Gender is required"

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }

    // Phone validation
    const phoneRegex = /^\+?[0-9\s\-()]{10,20}$/
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format"
    }

    // Salary/hourly rate validation
    if (formData.payType === "salary" && formData.salary !== undefined && formData.salary < 0) {
      newErrors.salary = "Salary cannot be negative"
    }

    if (formData.payType === "hourly" && formData.hourlyRate !== undefined && formData.hourlyRate < 0) {
      newErrors.hourlyRate = "Hourly rate cannot be negative"
    }

    // Tronc and bonus validation
    if (formData.tronc !== undefined && formData.tronc < 0) {
      newErrors.tronc = "Tronc amount cannot be negative"
    }

    if (formData.bonus !== undefined && formData.bonus < 0) {
      newErrors.bonus = "Bonus amount cannot be negative"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError(null)

    if (!validateForm()) return

    try {
      setLoading(true)

      // Ensure tronc and bonus are properly formatted as numbers
      const submissionData = {
        ...formData,
        tronc: formData.tronc !== undefined ? Number(formData.tronc) : 0,
        bonus: formData.bonus !== undefined ? Number(formData.bonus) : 0,
        address: formData.address,
        hireDate: formData.startDate ? new Date(formData.startDate).getTime() : Date.now(),
        departmentId: formData.departmentId || "",
        roleId: formData.roleId || undefined,
        createdAt: Date.now(),
      }

      onSave(submissionData)
    } catch (error) {
      console.error("Error in form submission:", error)
      setSaveError("An error occurred while submitting the form.")
    } finally {
      setLoading(false)
    }
  }

  // Invite link generation (only when editing an existing employee)
  const canGenerateInvite = mode === 'edit' && employee?.id
  const buildInviteUrl = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${origin}/join?code=${encodeURIComponent(code)}`
  }
  const handleGenerateInvite = async () => {
    if (!canGenerateInvite) return
    try {
      setSaveError(null)
      setCopied(false)
      setLoading(true)
      const code = await generateJoinCode(employee!.roleId || 'employee', employee!.id)
      setInviteLink(buildInviteUrl(code))
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to generate invite link')
    } finally {
      setLoading(false)
    }
  }
  const handleCopyInvite = async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setSaveError('Failed to copy invite link')
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        {saveError && (
          <Alert severity="error" sx={{ 
            mb: 2, 
            borderRadius: 1
          }}>
            {saveError}
          </Alert>
        )}

        <Paper sx={{ 
            mb: 3, 
            overflow: "hidden",
            borderRadius: 1,
            boxShadow: 1,
            bgcolor: theme.palette.background.paper
          }}>
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
                color: theme.palette.text.secondary,
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  fontWeight: 600
                }
              }
            }}
          >
            <Tab icon={<PersonIcon />} label="Personal Info" />
            <Tab icon={<WorkIcon />} label="Employment" />
            <Tab icon={<AttachMoneyIcon />} label="Compensation" />
          </Tabs>

          {canGenerateInvite && (
            <Box sx={{ px: 3, pt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<LinkIcon />}
                onClick={handleGenerateInvite}
                disabled={loading}
                sx={{ borderRadius: 1 }}
              >
                Generate Invite Link
              </Button>
              {inviteLink && (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ContentCopyIcon />}
                    onClick={handleCopyInvite}
                    color={copied ? 'success' as any : 'primary'}
                    sx={{ borderRadius: 1 }}
                  >
                    {copied ? 'Copied' : 'Copy Link'}
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1, fontFamily: 'monospace' }}>
                    {inviteLink}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      href={`mailto:?subject=${encodeURIComponent('Company invite')}&body=${encodeURIComponent('Join our company as this employee:\n' + inviteLink)}`}
                    >
                      Email
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      href={`https://wa.me/?text=${encodeURIComponent('Join our company:\n' + inviteLink)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      href={`sms:?&body=${encodeURIComponent('Join our company: ' + inviteLink)}`}
                    >
                      SMS
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          )}

          {/* Personal Information Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Avatar
                    src={photoPreview || undefined}
                    sx={{
                      width: 120,
                      height: 120,
                      mb: 2,
                                  bgcolor: theme.palette.primary.main
                    }}
                  >
                    {formData.firstName.charAt(0)}
                    {formData.lastName.charAt(0)}
                  </Avatar>
                  <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                    <input
                      accept="image/*"
                      style={{ display: "none" }}
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
                        sx={{
                          borderRadius: 1,
                          borderColor: theme.palette.grey[500],
                          color: theme.palette.text.primary,
                          '&:hover': {
                            borderColor: theme.palette.grey[700],
                            backgroundColor: theme.palette.grey[100]
                          }
                        }}
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
                        sx={{
                          borderRadius: 1
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={9}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      required
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      error={!!errors.firstName}
                      helperText={errors.firstName}
                      sx={{
                        '& .MuiInputBase-root': {
                          borderRadius: 1
                        },
                        '& .MuiInputLabel-root': {
              
                        },
                        '& .MuiInputBase-input': {
              
                        },
                        '& .MuiFormHelperText-root': {
              
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      sx={{
                        '& .MuiInputBase-root': {
                          borderRadius: 1
                        },
                        '& .MuiInputLabel-root': {
              
                        },
                        '& .MuiInputBase-input': {
              
                        },
                        '& .MuiFormHelperText-root': {
              
                        }
                      }}
                      label="Middle Name"
                      name="middleName"
                      value={formData.middleName || ""}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      required
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      error={!!errors.lastName}
                      helperText={errors.lastName}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth
                    sx={{
                      '& .MuiInputBase-root': {
                        borderRadius: 1
                      },
                      '& .MuiInputLabel-root': {
            
                      },
                      '& .MuiSelect-select': {
            
                      },
                      '& .MuiFormHelperText-root': {
            
                      }
                    }} required error={!!errors.gender}>
                      <InputLabel id="gender-label">Gender</InputLabel>
                      <Select
                        labelId="gender-label"
                        name="gender"
                        value={formData.gender || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
                        label="Gender"
                      >
                        <MenuItem value="male"                       >Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                        <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                      </Select>
                      {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Date of Birth"
                      value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                      onChange={(date) => handleDateChange(date, "dateOfBirth")}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.dateOfBirth,
                          helperText: errors.dateOfBirth,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="National Insurance Number"
                      name="nationalInsuranceNumber"
                      value={formData.nationalInsuranceNumber || ""}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      error={!!errors.email}
                      helperText={errors.email}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      error={!!errors.phone}
                      helperText={errors.phone}
                      required
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Additional Information
              </Typography>
            </Grid>
            <Grid item xs={12}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12}>
                    <Box sx={{ position: 'relative' }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Address"
                        name="address"
                        value={formData.address || ""}
                        onChange={(e) => {
                          handleInputChange(e)
                          handleAddressSearch(e.target.value)
                        }}
                        placeholder="Start typing to search addresses..."
                      />
                      {showAddressSuggestions && addressSuggestions.length > 0 && (
                        <Paper sx={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, maxHeight: 200, overflow: 'auto' }}>
                          {addressSuggestions.map((suggestion) => (
                            <Box
                              key={suggestion.place_id}
                              sx={{ p: 1, cursor: 'pointer', '&:hover': { bgcolor: 'grey.100' } }}
                              onClick={() => handleAddressSelect(suggestion)}
                            >
                              <Typography variant="body2">{suggestion.description}</Typography>
                            </Box>
                          ))}
                        </Paper>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="City"
                      name="city"
                      value={formData.city || ""}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Postcode"
                      name="zip"
                      value={formData.zip || ""}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Country"
                      name="country"
                      value={formData.country || "UK"}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Notes"
                      name="notes"
                      value={formData.notes || ""}
                      onChange={handleInputChange}
                      multiline
                      rows={2}
                      placeholder="Additional notes about the employee..."
                    />
                  </Grid>
                </Grid>
                
                {/* Emergency Contacts Section (moved from Contact tab) */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="h6" gutterBottom>
                      Emergency Contacts
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={addEmergencyContact}
                    >
                      Add Contact
                    </Button>
                  </Box>
                  
                  {emergencyContacts.map((contact) => (
                    <Paper key={contact.id} sx={{ p: 1.5, mb: 1.5, bgcolor: 'grey.50' }}>
                      <Grid container spacing={1.5} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Name"
                            value={contact.name}
                            onChange={(e) => updateEmergencyContact(contact.id, { name: e.target.value })}
                            placeholder="Contact name"
                          />
                        </Grid>
                        <Grid item xs={12} sm={2.5}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Relationship"
                            value={contact.relationship}
                            onChange={(e) => updateEmergencyContact(contact.id, { relationship: e.target.value })}
                            placeholder="e.g., Spouse, Parent"
                          />
                        </Grid>
                        <Grid item xs={12} sm={2.5}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Phone"
                            value={contact.phone}
                            onChange={(e) => updateEmergencyContact(contact.id, { phone: e.target.value })}
                            placeholder="Phone number"
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
                            placeholder="Email address"
                          />
                        </Grid>
                        <Grid item xs={12} sm={1}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeEmergencyContact(contact.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  
                  {emergencyContacts.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1.5 }}>
                      No emergency contacts added. Click "Add Contact" to add contact information.
                    </Typography>
                  )}
                </Grid>
            </Grid>
          </TabPanel>

          {/* Employment Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select name="roleId" value={formData.roleId || ""} onChange={handleRoleChange} label="Role">
                    <MenuItem value="">
                      <em>Select a role</em>
                    </MenuItem>
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setShowRoleDialog(true)}
                  sx={{ mt: 1, fontSize: '0.75rem' }}
                >
                  Create New Role
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department"
                  name="department"
                  value={formData.department || ""}
                  onChange={handleInputChange}
                  helperText="Can be set manually or auto-filled from role"
                />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setShowDepartmentDialog(true)}
                  sx={{ mt: 1, fontSize: '0.75rem' }}
                >
                  Create New Department
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Employment Type</InputLabel>
                  <Select
                    name="employmentType"
                    value={formData.employmentType || "Full-time"}
                    onChange={handleEmploymentTypeChange}
                    label="Employment Type"
                    error={!!errors.employmentType}
                  >
                    <MenuItem value="Full-time">Full-time</MenuItem>
                    <MenuItem value="Part-time">Part-time</MenuItem>
                    <MenuItem value="Contract">Contract</MenuItem>
                    <MenuItem value="Temporary">Temporary</MenuItem>
                  </Select>
                  {errors.employmentType && <FormHelperText error>{errors.employmentType}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select name="status" value={formData.status} onChange={handleStatusChange} label="Status">
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
                  value={new Date(formData.hireDate)}
                  onChange={(date) => handleDateChange(date, "hireDate")}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!errors.hireDate,
                      helperText: errors.hireDate,
                    },
                  }}
                />
              </Grid>
              {formData.status === "terminated" && (
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Date Terminated"
                    value={formData.terminationDate ? new Date(formData.terminationDate) : null}
                    onChange={(date) => handleDateChange(date, "terminationDate")}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Manager"
                  name="manager"
                  value={formData.manager || ""}
                  disabled
                  helperText="Auto-filled based on role"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Holiday Entitlement
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Amount"
                        name="holidaysPerYear"
                        type="number"
                        value={formData.holidaysPerYear || ""}
                        onChange={handleInputChange}
                        InputProps={{
                          inputProps: { min: 0 },
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Per</InputLabel>
                        <Select
                          value={holidayType}
                          onChange={(e) => setHolidayType(e.target.value as 'year' | 'week' | 'hour')}
                          label="Per"
                        >
                          <MenuItem value="year">Year</MenuItem>
                          <MenuItem value="week">Week</MenuItem>
                          <MenuItem value="hour">Hour</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Working Hours
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Hours Per Week"
                  name="hoursPerWeek"
                  type="number"
                  value={formData.hoursPerWeek || ""}
                  onChange={handleInputChange}
                  InputProps={{
                    inputProps: { min: 0, max: 168, step: 0.5 },
                  }}
                  helperText="Standard working hours per week"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Minimum Hours Per Week"
                  name="minHoursPerWeek"
                  type="number"
                  value={formData.minHoursPerWeek || ""}
                  onChange={handleInputChange}
                  InputProps={{
                    inputProps: { min: 0, max: 168, step: 0.5 },
                  }}
                  helperText="Minimum contracted hours"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Maximum Hours Per Week"
                  name="maxHoursPerWeek"
                  type="number"
                  value={formData.maxHoursPerWeek || ""}
                  onChange={handleInputChange}
                  InputProps={{
                    inputProps: { min: 0, max: 168, step: 0.5 },
                  }}
                  helperText="Maximum allowed hours"
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Compensation Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <Typography variant="subtitle1" gutterBottom>
                    Pay Type
                  </Typography>
                  <RadioGroup row name="payType" value={formData.payType || "salary"} onChange={handlePayTypeChange}>
                    <FormControlLabel value="salary" control={<Radio />} label="Salary" />
                    <FormControlLabel value="hourly" control={<Radio />} label="Hourly Rate" />
                  </RadioGroup>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hourly Rate"
                  name="hourlyRate"
                  type="number"
                  value={formData.hourlyRate || ""}
                  onChange={handleInputChange}
                  disabled={formData.payType !== "hourly"}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>£</Typography>,
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Annual Salary"
                  name="salary"
                  type="number"
                  value={formData.salary || ""}
                  onChange={handleInputChange}
                  disabled={formData.payType !== "salary"}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>£</Typography>,
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              {/* Enhanced Compensation Items List */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Additional Compensation
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={addCompensationItem}
                  >
                    Add Compensation
                  </Button>
                </Box>
                
                {compensationItems.map((item) => (
                  <Paper key={item.id} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={2}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Type</InputLabel>
                          <Select
                            value={item.type}
                            onChange={(e) => {
                              const newType = e.target.value as 'bonus' | 'tronc'
                              updateCompensationItem(item.id, { 
                                type: newType,
                                // Reset type-specific fields when changing type
                                bonusType: undefined,
                                percentageType: undefined,
                                troncType: undefined,
                                frequency: undefined
                              })
                            }}
                            label="Type"
                          >
                            <MenuItem value="bonus">Bonus</MenuItem>
                            <MenuItem value="tronc">Tronc</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      {/* Bonus Type Selection */}
                      {item.type === 'bonus' && (
                        <Grid item xs={12} sm={2}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Bonus Type</InputLabel>
                            <Select
                              value={item.bonusType || ''}
                              onChange={(e) => updateCompensationItem(item.id, { 
                                bonusType: e.target.value as 'flat' | 'percentage',
                                percentageType: undefined // Reset when changing bonus type
                              })}
                              label="Bonus Type"
                            >
                              <MenuItem value="flat">Flat Bonus</MenuItem>
                              <MenuItem value="percentage">Percentage Bonus</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      )}
                      
                      {/* Percentage Type for Bonus */}
                      {item.type === 'bonus' && item.bonusType === 'percentage' && (
                        <Grid item xs={12} sm={2}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Percentage Of</InputLabel>
                            <Select
                              value={item.percentageType || ''}
                              onChange={(e) => updateCompensationItem(item.id, { percentageType: e.target.value as 'pay' | 'sales' | 'revenue' })}
                              label="Percentage Of"
                            >
                              <MenuItem value="pay">% of Pay</MenuItem>
                              <MenuItem value="sales">% of Sales</MenuItem>
                              <MenuItem value="revenue">% of Revenue</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      )}
                      
                      {/* Frequency field for bonus types */}
                      {item.type === 'bonus' && item.bonusType && (
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Frequency (Months)"
                            type="number"
                            value={item.frequency || ''}
                            onChange={(e) => updateCompensationItem(item.id, { frequency: Number(e.target.value) })}
                            InputProps={{
                              inputProps: { min: 1, step: 1 }
                            }}
                            placeholder="e.g., 12"
                          />
                        </Grid>
                      )}
                      
                      {/* Amount field for flat bonus */}
                      {item.type === 'bonus' && item.bonusType === 'flat' && (
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Amount"
                            type="number"
                            value={item.amount || ''}
                            onChange={(e) => updateCompensationItem(item.id, { amount: Number(e.target.value) })}
                            InputProps={{
                              startAdornment: <Typography>£</Typography>,
                              inputProps: { step: 0.01, min: 0 }
                            }}
                            helperText="Max 2dp"
                          />
                        </Grid>
                      )}
                      
                      {/* Percentage field for percentage bonus */}
                      {item.type === 'bonus' && item.bonusType === 'percentage' && item.percentageType && (
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Percentage"
                            type="number"
                            value={item.percentage || ''}
                            onChange={(e) => updateCompensationItem(item.id, { percentage: Number(e.target.value) })}
                            InputProps={{
                              endAdornment: <Typography>%</Typography>,
                              inputProps: { step: 0.01, min: 0, max: 100 }
                            }}
                            helperText="Max 2dp"
                          />
                        </Grid>
                      )}
                      
                      {/* Tronc Type Selection */}
                      {item.type === 'tronc' && (
                        <Grid item xs={12} sm={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Tronc Type</InputLabel>
                            <Select
                              value={item.troncType || ''}
                              onChange={(e) => updateCompensationItem(item.id, { troncType: e.target.value as any })}
                              label="Tronc Type"
                            >
                              <MenuItem value="percent_self">% of Self Made</MenuItem>
                              <MenuItem value="percent_venue">% of Venue Total</MenuItem>
                              <MenuItem value="flat_rate">Flat Rate</MenuItem>
                              <MenuItem value="pool_points">Pool of Points</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      )}
                      
                      {/* Dynamic input fields based on tronc type */}
                      {item.type === 'tronc' && item.troncType === 'percent_self' && (
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Percentage"
                            type="number"
                            value={item.percentage || ''}
                            onChange={(e) => updateCompensationItem(item.id, { percentage: Number(e.target.value) })}
                            InputProps={{
                              endAdornment: <Typography>%</Typography>,
                              inputProps: { step: 0.01, min: 0, max: 100 }
                            }}
                            helperText="Max 2dp"
                          />
                        </Grid>
                      )}
                      
                      {item.type === 'tronc' && item.troncType === 'percent_venue' && (
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Percentage"
                            type="number"
                            value={item.percentage || ''}
                            onChange={(e) => updateCompensationItem(item.id, { percentage: Number(e.target.value) })}
                            InputProps={{
                              endAdornment: <Typography>%</Typography>,
                              inputProps: { step: 0.01, min: 0, max: 100 }
                            }}
                            helperText="Max 2dp"
                          />
                        </Grid>
                      )}
                      
                      {item.type === 'tronc' && item.troncType === 'flat_rate' && (
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Amount"
                            type="number"
                            value={item.amount || ''}
                            onChange={(e) => updateCompensationItem(item.id, { amount: Number(e.target.value) })}
                            InputProps={{
                              startAdornment: <Typography>£</Typography>,
                              inputProps: { step: 0.01, min: 0 }
                            }}
                            helperText="Max 2dp"
                          />
                        </Grid>
                      )}
                      
                      {item.type === 'tronc' && item.troncType === 'pool_points' && (
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Points"
                            type="number"
                            value={item.points || ''}
                            onChange={(e) => updateCompensationItem(item.id, { points: Number(e.target.value) })}
                            InputProps={{
                              inputProps: { step: 1, min: 0 }
                            }}
                            placeholder="Points value"
                          />
                        </Grid>
                      )}
                      
                      <Grid item xs={12} sm={1}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeCompensationItem(item.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
                
                {compensationItems.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No additional compensation items added. Click "Add Compensation" to add bonus or tronc payments.
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Pay Frequency</InputLabel>
                  <Select
                    name="payFrequency"
                    value={formData.payFrequency || ""}
                    onChange={(e: SelectChangeEvent<string>) => {
                      const frequency = e.target.value as "weekly" | "biweekly" | "every4weeks" | "monthly" | undefined
                      setFormData((prev) => ({
                        ...prev,
                        payFrequency: frequency,
                      }))
                      // Reset related fields when frequency changes
                      setPayDayOfWeek('')
                      setNextPayDate(null)
                      setMonthlyPayType('specific_date')
                      setMonthlySpecificDate(1)
                      setMonthlyDayOfWeek('')
                    }}
                    label="Pay Frequency"
                  >
                    <MenuItem value="">
                      <em>Select pay frequency</em>
                    </MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="biweekly">Bi-weekly</MenuItem>
                    <MenuItem value="every4weeks">Every 4 Weeks</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Pay Frequency Specific Fields */}
              {formData.payFrequency === 'weekly' && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Pay Day</InputLabel>
                    <Select
                      value={payDayOfWeek}
                      onChange={(e) => setPayDayOfWeek(e.target.value)}
                      label="Pay Day"
                    >
                      <MenuItem value="monday">Monday</MenuItem>
                      <MenuItem value="tuesday">Tuesday</MenuItem>
                      <MenuItem value="wednesday">Wednesday</MenuItem>
                      <MenuItem value="thursday">Thursday</MenuItem>
                      <MenuItem value="friday">Friday</MenuItem>
                      <MenuItem value="saturday">Saturday</MenuItem>
                      <MenuItem value="sunday">Sunday</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              {formData.payFrequency === 'biweekly' && (
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Next Pay Date"
                    value={nextPayDate}
                    onChange={(date) => setNextPayDate(date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        helperText: 'Select the next payday to determine the bi-weekly schedule'
                      },
                    }}
                  />
                </Grid>
              )}
              
              {formData.payFrequency === 'every4weeks' && (
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Next Pay Date"
                    value={nextPayDate}
                    onChange={(date) => setNextPayDate(date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        helperText: 'Select the next payday for the 4-week cycle'
                      },
                    }}
                  />
                </Grid>
              )}
              
              {formData.payFrequency === 'monthly' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Monthly Pay Type</InputLabel>
                      <Select
                        value={monthlyPayType}
                        onChange={(e) => setMonthlyPayType(e.target.value as 'specific_date' | 'last_day_of_week')}
                        label="Monthly Pay Type"
                      >
                        <MenuItem value="specific_date">Specific Date</MenuItem>
                        <MenuItem value="last_day_of_week">Last Specific Day of Week</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {monthlyPayType === 'specific_date' && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Date of Month"
                        type="number"
                        value={monthlySpecificDate}
                        onChange={(e) => setMonthlySpecificDate(Number(e.target.value))}
                        InputProps={{
                          inputProps: { min: 1, max: 31 }
                        }}
                        helperText="Day of the month (1-31)"
                      />
                    </Grid>
                  )}
                  
                  {monthlyPayType === 'last_day_of_week' && (
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Day of Week</InputLabel>
                        <Select
                          value={monthlyDayOfWeek}
                          onChange={(e) => setMonthlyDayOfWeek(e.target.value)}
                          label="Day of Week"
                        >
                          <MenuItem value="monday">Last Monday</MenuItem>
                          <MenuItem value="tuesday">Last Tuesday</MenuItem>
                          <MenuItem value="wednesday">Last Wednesday</MenuItem>
                          <MenuItem value="thursday">Last Thursday</MenuItem>
                          <MenuItem value="friday">Last Friday</MenuItem>
                          <MenuItem value="saturday">Last Saturday</MenuItem>
                          <MenuItem value="sunday">Last Sunday</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Bank Details
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Account Name"
                  name="bankDetails.accountName"
                  value={formData.bankDetails?.accountName || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    setFormData((prev) => ({
                      ...prev,
                      bankDetails: {
                        ...prev.bankDetails,
                        accountName: value,
                      } as any,
                    }))
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Account Number"
                  name="bankDetails.accountNumber"
                  value={formData.bankDetails?.accountNumber || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    setFormData((prev) => ({
                      ...prev,
                      bankDetails: {
                        ...prev.bankDetails,
                        accountNumber: value,
                      } as any,
                    }))
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Sort Code"
                  name="bankDetails.routingNumber"
                  value={formData.bankDetails?.routingNumber || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    setFormData((prev) => ({
                      ...prev,
                      bankDetails: {
                        ...prev.bankDetails,
                        routingNumber: value,
                      } as any,
                    }))
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Bank Name"
                  name="bankDetails.bankName"
                  value={formData.bankDetails?.bankName || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    setFormData((prev) => ({
                      ...prev,
                      bankDetails: {
                        ...prev.bankDetails,
                        bankName: value,
                      } as any,
                    }))
                  }}
                />
              </Grid>
            </Grid>
          </TabPanel>


        </Paper>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3, gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            startIcon={<CancelIcon />}
            disabled={loading}
            sx={{
              borderRadius: 1,
              borderColor: theme.palette.grey[500],
              color: theme.palette.text.primary,
              '&:hover': {
                borderColor: theme.palette.grey[700],
                backgroundColor: theme.palette.grey[100]
              }
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            disabled={loading}
            sx={{
              borderRadius: 1,
              bgcolor: theme.palette.primary.main,
              '&:hover': { bgcolor: theme.palette.primary.dark }
            }}
          >
            {loading ? "Saving..." : mode === "edit" ? "Update Employee" : "Save Employee"}
          </Button>
        </Box>
      </Box>

      {/* Quick Role Creation Dialog */}
      <Dialog open={showRoleDialog} onClose={() => setShowRoleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Role Name"
                value={newRoleForm.label}
                onChange={(e) => setNewRoleForm(prev => ({ ...prev, label: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newRoleForm.description}
                onChange={(e) => setNewRoleForm(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Department"
                value={newRoleForm.department}
                onChange={(e) => setNewRoleForm(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Optional - can be set later"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRoleDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateRole} variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Department Creation Dialog */}
      <Dialog open={showDepartmentDialog} onClose={() => setShowDepartmentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Department</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Department Name"
                value={newDepartmentForm.name}
                onChange={(e) => setNewDepartmentForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newDepartmentForm.description}
                onChange={(e) => setNewDepartmentForm(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDepartmentDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateDepartment} variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create Department'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  )
}

export default EmployeeForm
